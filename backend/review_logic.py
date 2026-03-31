REVIEW_TABLE = "review"

HIT_TOKENS = ["안타", "내야안타", "적시타", "번트안타"]
DOUBLE_TOKENS = ["2루타"]
TRIPLE_TOKENS = ["3루타"]
HOME_RUN_TOKENS = ["홈런"]
WALK_TOKENS = ["볼넷"]
HBP_TOKENS = ["사구"]
SACRIFICE_TOKENS = ["희생", "희생번트", "희생플라이"]
STRIKEOUT_TOKENS = ["삼진"]
COACH_POSITIONS = ("감독", "기록원")


def _contains_any(text, tokens):
    for token in tokens:
        if token in text:
            return True
    return False


def _hitter_stats(games):
    hits = 0
    at_bats = 0
    walks = 0
    strikeouts = 0
    runs_batted_in = 0
    home_runs = 0
    total_bases = 0

    for game in games:
        result = str(game.get("result") or "")

        if _contains_any(result, WALK_TOKENS):
            walks += 1

        if _contains_any(result, STRIKEOUT_TOKENS):
            strikeouts += 1

        if not _contains_any(result, WALK_TOKENS + HBP_TOKENS + SACRIFICE_TOKENS):
            at_bats += 1

        if _contains_any(result, HOME_RUN_TOKENS):
            hits += 1
            home_runs += 1
            total_bases += 4
        elif _contains_any(result, TRIPLE_TOKENS):
            hits += 1
            total_bases += 3
        elif _contains_any(result, DOUBLE_TOKENS):
            hits += 1
            total_bases += 2
        elif _contains_any(result, HIT_TOKENS):
            hits += 1
            total_bases += 1

        runs_batted_in += int(game.get("runs_scored_on_play") or 0)

    average = hits / at_bats if at_bats else 0
    on_base = (hits + walks) / (at_bats + walks) if (at_bats + walks) else 0
    slugging = total_bases / at_bats if at_bats else 0

    return {
        "hits": hits,
        "at_bats": at_bats,
        "walks": walks,
        "strikeouts": strikeouts,
        "runs_batted_in": runs_batted_in,
        "home_runs": home_runs,
        "average": average,
        "on_base": on_base,
        "slugging": slugging,
        "ops": on_base + slugging,
    }


def _pitcher_stats(games):
    runs_allowed = 0
    outs_recorded = 0
    strikeouts = 0
    walks = 0
    hits_allowed = 0

    for game in games:
        result = str(game.get("result") or "")
        runs_allowed += int(game.get("runs_scored_on_play") or 0)
        outs_recorded += max(
            0,
            int(game.get("outs_after") or 0) - int(game.get("outs_before") or 0),
        )

        if _contains_any(result, STRIKEOUT_TOKENS):
            strikeouts += 1

        if _contains_any(result, WALK_TOKENS + HBP_TOKENS):
            walks += 1

        if _contains_any(result, HIT_TOKENS + DOUBLE_TOKENS + TRIPLE_TOKENS + HOME_RUN_TOKENS):
            hits_allowed += 1

    innings_pitched = outs_recorded / 3 if outs_recorded else 0

    return {
        "runs_allowed": runs_allowed,
        "outs_recorded": outs_recorded,
        "innings_pitched": innings_pitched,
        "strikeouts": strikeouts,
        "walks": walks,
        "hits_allowed": hits_allowed,
        "era": (runs_allowed * 9 / innings_pitched) if innings_pitched else 0,
        "whip": ((walks + hits_allowed) / innings_pitched) if innings_pitched else 0,
        "k_per_9": ((strikeouts * 9) / innings_pitched) if innings_pitched else 0,
    }


def _average_stats(list_of_stats, keys):
    if not list_of_stats:
        return {key: 0 for key in keys}

    result = {}
    for key in keys:
        result[key] = sum(float(item.get(key, 0)) for item in list_of_stats) / len(list_of_stats)
    return result


def _issues(member, baseline, recent, is_pitcher):
    issues = []

    if is_pitcher:
        if recent["walks"] > baseline["walks"]:
            issues.append("볼넷이 늘어 제구 안정감이 직전 경기에서 흔들렸습니다.")
        if recent["runs_allowed"] > baseline["runs_allowed"]:
            issues.append("직전 경기에서 실점 억제력이 이전 경기들보다 떨어졌습니다.")
        if baseline["strikeouts"] and recent["strikeouts"] < baseline["strikeouts"]:
            issues.append("결정구 마무리 능력이 직전 경기에서 다소 약해졌습니다.")
        if not issues:
            issues.append("전체 흐름은 안정적이어서 현재 리듬을 유지하는 데 집중하면 됩니다.")
        return issues

    if recent["average"] + 0.05 < baseline["average"]:
        issues.append("직전 경기에서 컨택 정확도가 이전 경기들보다 내려갔습니다.")
    if recent["on_base"] + 0.05 < baseline["on_base"]:
        issues.append("출루 생산성이 직전 경기에서 떨어졌습니다.")
    if recent["strikeouts"] > baseline["strikeouts"]:
        issues.append("삼진이 늘어 타석 접근을 다시 점검할 필요가 있습니다.")
    if recent["ops"] + 0.08 < baseline["ops"]:
        issues.append("장타 또는 타구 질 측면의 위협감이 줄었습니다.")
    if not issues:
        issues.append(f"{member.get('Primary_Position') or '-'} 포지션 기준으로 기본 경기력은 안정적으로 유지되고 있습니다.")
    return issues


def _review_text(member, team_name, mode, date, issues):
    name = member.get("Name") or "선수"
    position = member.get("Primary_Position") or "-"
    issue_text = "\n".join([f"- {issue}" for issue in issues[:3]])
    return (
        f"{team_name} {name}({position}) {mode} 리뷰\n"
        f"{date} 경기 기준으로 이전 경기 흐름과 비교했을 때, 아래 부분을 먼저 보완하는 것이 좋습니다.\n"
        f"{issue_text}\n"
        "다음 경기에서는 위 항목을 우선 점검하면서 플레이 리듬을 회복하는 데 집중해보세요."
    )


def _needs_refresh(row):
    message = str(row.get("message") or "")
    issues = row.get("issues") or []

    if " review" in message:
        return True
    if "??" in message:
        return True
    if "?" in message and "리뷰" not in message:
        return True

    for issue in issues:
        text = str(issue or "")
        if "??" in text:
            return True
        if "?" in text and "필요" not in text and "감독" not in text:
            return True

    return False


def generate_player_review(supabase, member_id):
    member_response = supabase.table("member").select("*").eq("Id", member_id).limit(1).execute()
    member = member_response.data[0] if member_response.data else None
    if not member:
        raise ValueError(f"member not found: {member_id}")

    if member.get("Primary_Position") in COACH_POSITIONS:
        return {
            "member_id": member_id,
            "member_name": member.get("Name"),
            "review": "감독과 기록원은 리뷰 대상이 아닙니다.",
            "issues": [],
            "saved": False,
        }

    team_name = "TEAM"
    if member.get("Team") is not None:
        team_response = supabase.table("team").select("*").eq("id", member["Team"]).limit(1).execute()
        if team_response.data:
            team_name = team_response.data[0].get("name") or team_name

    games_response = (
        supabase.table("game")
        .select("*")
        .or_(f"batter_id.eq.{member_id},pitcher_id.eq.{member_id}")
        .order("date", desc=True)
        .execute()
    )
    games = games_response.data or []
    if not games:
        return {
            "member_id": member_id,
            "member_name": member.get("Name"),
            "review": "경기 데이터가 아직 없어 리뷰를 만들 수 없습니다.",
            "issues": [],
            "saved": False,
        }

    is_pitcher = member.get("Is_Pitcher") == 1
    mode = "PITCHER" if is_pitcher else "HITTER"
    player_games = []

    for game in games:
        if is_pitcher and int(game.get("pitcher_id") or -1) == int(member_id):
            player_games.append(game)
        elif not is_pitcher and int(game.get("batter_id") or -1) == int(member_id):
            player_games.append(game)

    if not player_games:
        return {
            "member_id": member_id,
            "member_name": member.get("Name"),
            "review": "해당 역할 기준의 경기 데이터가 아직 없어 리뷰를 만들 수 없습니다.",
            "issues": [],
            "saved": False,
        }

    recent_game = player_games[0]
    recent_date = str(recent_game.get("date") or "")

    existing = (
        supabase.table(REVIEW_TABLE)
        .select("*")
        .eq("member_id", member_id)
        .eq("date", recent_date)
        .limit(1)
        .execute()
    )
    if existing.data:
        row = existing.data[0]
        if not _needs_refresh(row):
            return {
                "member_id": member_id,
                "member_name": member.get("Name"),
                "mode": row.get("mode") or mode,
                "recent_date": row.get("date"),
                "review": row.get("message") or "",
                "issues": row.get("issues") or [],
                "baseline_metrics": row.get("baseline_metrics") or {},
                "recent_metrics": row.get("recent_metrics") or {},
                "saved": True,
            }

    previous_games = player_games[1:6]

    if is_pitcher:
        recent_metrics = _pitcher_stats([recent_game])
        baseline_metrics = (
            _average_stats(
                [_pitcher_stats([game]) for game in previous_games],
                [
                    "runs_allowed",
                    "outs_recorded",
                    "innings_pitched",
                    "strikeouts",
                    "walks",
                    "hits_allowed",
                    "era",
                    "whip",
                    "k_per_9",
                ],
            )
            if previous_games
            else dict(recent_metrics)
        )
    else:
        recent_metrics = _hitter_stats([recent_game])
        baseline_metrics = (
            _average_stats(
                [_hitter_stats([game]) for game in previous_games],
                [
                    "hits",
                    "at_bats",
                    "walks",
                    "strikeouts",
                    "runs_batted_in",
                    "home_runs",
                    "average",
                    "on_base",
                    "slugging",
                    "ops",
                ],
            )
            if previous_games
            else dict(recent_metrics)
        )

    issues = _issues(member, baseline_metrics, recent_metrics, is_pitcher)
    review = _review_text(member, team_name, mode, recent_date, issues)

    payload = {
        "member_id": member_id,
        "date": recent_date,
        "mode": mode,
        "message": review,
        "issues": issues,
        "baseline_metrics": baseline_metrics,
        "recent_metrics": recent_metrics,
    }

    saved = supabase.table(REVIEW_TABLE).upsert(payload, on_conflict="member_id,date").execute()

    return {
        "member_id": member_id,
        "member_name": member.get("Name"),
        "mode": mode,
        "recent_date": recent_date,
        "review": review,
        "issues": issues,
        "baseline_metrics": baseline_metrics,
        "recent_metrics": recent_metrics,
        "saved": bool(saved.data),
    }


def generate_all_reviews(supabase):
    members_response = supabase.table("member").select("*").execute()
    members = members_response.data or []
    result = []

    for member in members:
        if member.get("Team") is None:
            continue
        if member.get("Primary_Position") in COACH_POSITIONS:
            continue

        try:
            result.append(generate_player_review(supabase, int(member["Id"])))
        except Exception as error:
            result.append(
                {
                    "member_id": int(member["Id"]),
                    "member_name": member.get("Name"),
                    "saved": False,
                    "error": str(error),
                }
            )

    return {
        "count": len(result),
        "results": result,
    }
