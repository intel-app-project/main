from __future__ import annotations
from .prompts import build_review_text
from .rules import build_hitter_metrics, build_pitcher_metrics, detect_review_issues

def _average_metrics(metrics_list: list[dict], keys: list[str]) -> dict:
    if not metrics_list:
        return {key: 0 for key in keys}

    averaged = {}
    for key in keys:
        averaged[key] = sum(float(item.get(key, 0)) for item in metrics_list) / len(metrics_list)
    return averaged


def _build_empty_review(member_id: int, mode: str, message: str) -> dict:
    return {
        "member_id": member_id,
        "review": message,
        "issues": [],
        "mode": mode,
        "recent_date": None,
        "baseline_game_count": 0,
        "saved": False,
    }


def _fetch_existing_review(supabase, member_id: int, recent_game_date: str | None) -> dict | None:
    if not recent_game_date:
        return None

    try:
        response = (
            supabase.table("review")
            .select("*")
            .eq("member_id", member_id)
            .eq("date", recent_game_date)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        return response.data[0] if response.data else None
    except Exception:
        return None


def _save_review(supabase, payload: dict) -> dict | None:
    try:
        upsert_response = (
            supabase.table("review")
            .upsert(payload, on_conflict="member_id,date")
            .execute()
        )
        return upsert_response.data[0] if upsert_response.data else None
    except Exception:
        return None


def generate_player_review(supabase, member_id: int) -> dict:
    member_response = supabase.table("member").select("*").eq("Id", member_id).limit(1).execute()
    member = member_response.data[0] if member_response.data else None
    if not member:
        raise ValueError(f"member not found: {member_id}")

    team = None
    if member.get("Team") is not None:
        team_response = supabase.table("team").select("*").eq("id", member["Team"]).limit(1).execute()
        team = team_response.data[0] if team_response.data else None

    all_games_response = (
        supabase.table("game")
        .select("*")
        .or_(f"batter_id.eq.{member_id},pitcher_id.eq.{member_id}")
        .order("date", desc=True)
        .execute()
    )
    all_games = all_games_response.data or []

    if not all_games:
        return _build_empty_review(member_id, "EMPTY", "경기 데이터가 아직 없어 리뷰를 만들 수 없습니다.")

    is_pitcher = member.get("Is_Pitcher") == 1
    if is_pitcher:
        player_games = [game for game in all_games if int(game.get("pitcher_id") or -1) == member_id]
        metrics_builder = build_pitcher_metrics
        metric_keys = ["walks", "runs_allowed", "strikeouts", "era", "whip", "k_per_9"]
        mode = "PITCHER"
    else:
        player_games = [game for game in all_games if int(game.get("batter_id") or -1) == member_id]
        metrics_builder = build_hitter_metrics
        metric_keys = ["hits", "at_bats", "walks", "strikeouts", "average", "on_base", "slugging", "ops"]
        mode = "HITTER"

    if not player_games:
        return _build_empty_review(member_id, mode, "해당 역할 기준의 경기 데이터가 아직 없어 리뷰를 만들 수 없습니다.")

    recent_game = player_games[0]
    recent_date = str(recent_game.get("date") or "")
    existing_review = _fetch_existing_review(supabase, member_id, recent_date)
    if existing_review:
        return {
            "member_id": member_id,
            "member_name": member.get("Name"),
            "team_name": (team or {}).get("name"),
            "mode": existing_review.get("mode") or mode,
            "recent_date": existing_review.get("date"),
            "review": existing_review.get("message") or "",
            "issues": existing_review.get("issues") or [],
            "baseline_metrics": existing_review.get("baseline_metrics") or {},
            "recent_metrics": existing_review.get("recent_metrics") or {},
            "saved": True,
        }

    previous_games = player_games[1:6]

    recent_metrics = metrics_builder([recent_game])
    baseline_metrics = (
        _average_metrics([metrics_builder([game]) for game in previous_games], metric_keys)
        if previous_games
        else {key: float(recent_metrics.get(key, 0)) for key in metric_keys}
    )

    issues = detect_review_issues(
        position=member.get("Primary_Position") or "-",
        baseline=baseline_metrics,
        recent=recent_metrics,
        is_pitcher=is_pitcher,
    )

    review_text = build_review_text(
        member=member,
        team=team,
        issues=issues,
        recent_date=recent_date,
        mode=mode,
    )

    review_payload = {
        "member_id": member_id,
        "date": recent_date,
        "mode": mode,
        "message": review_text,
        "issues": issues,
        "baseline_metrics": baseline_metrics,
        "recent_metrics": recent_metrics,
    }
    saved_review = _save_review(supabase, review_payload)

    return {
        "member_id": member_id,
        "member_name": member.get("Name"),
        "team_name": (team or {}).get("name"),
        "mode": mode,
        "recent_date": recent_date,
        "review": review_text,
        "issues": issues,
        "baseline_metrics": baseline_metrics,
        "recent_metrics": recent_metrics,
        "saved": bool(saved_review),
    }
