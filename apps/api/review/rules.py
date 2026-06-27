from __future__ import annotations


def safe_divide(numerator: float, denominator: float) -> float:
    if not denominator:
        return 0.0
    return numerator / denominator


def build_hitter_metrics(games: list[dict]) -> dict:
    hits = 0
    at_bats = 0
    walks = 0
    strikeouts = 0
    runs_batted_in = 0
    singles = 0
    doubles = 0
    triples = 0
    home_runs = 0

    for game in games:
        result = str(game.get("result") or "")
        runs_batted_in += int(game.get("runs_scored_on_play") or 0)

        is_walk = "볼넷" in result
        is_hbp = "사구" in result
        is_sacrifice = "희생" in result
        is_strikeout = "삼진" in result

        if is_walk:
            walks += 1

        if is_strikeout:
            strikeouts += 1

        if not is_walk and not is_hbp and not is_sacrifice:
            at_bats += 1

        if "홈런" in result:
            hits += 1
            home_runs += 1
        elif "3루타" in result:
            hits += 1
            triples += 1
        elif "2루타" in result:
            hits += 1
            doubles += 1
        elif any(token in result for token in ["안타", "내야안타", "번트안타", "적시타"]):
            hits += 1
            singles += 1

    total_bases = singles + (doubles * 2) + (triples * 3) + (home_runs * 4)
    average = safe_divide(hits, at_bats)
    on_base = safe_divide(hits + walks, at_bats + walks)
    slugging = safe_divide(total_bases, at_bats)

    return {
        "games": len(games),
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


def build_pitcher_metrics(games: list[dict]) -> dict:
    runs_allowed = 0
    outs_recorded = 0
    strikeouts = 0
    walks = 0
    hits_allowed = 0

    for game in games:
        result = str(game.get("result") or "")
        runs_allowed += int(game.get("runs_scored_on_play") or 0)
        outs_recorded += max(0, int(game.get("outs_after") or 0) - int(game.get("outs_before") or 0))

        if "삼진" in result:
            strikeouts += 1

        if "볼넷" in result or "사구" in result:
            walks += 1

        if any(token in result for token in ["안타", "2루타", "3루타", "홈런", "내야안타", "적시타"]):
            hits_allowed += 1

    innings_pitched = outs_recorded / 3 if outs_recorded else 0.0
    era = safe_divide(runs_allowed * 9, innings_pitched)
    whip = safe_divide(walks + hits_allowed, innings_pitched)
    k_per_9 = safe_divide(strikeouts * 9, innings_pitched)

    return {
        "games": len(games),
        "outs_recorded": outs_recorded,
        "innings_pitched": innings_pitched,
        "runs_allowed": runs_allowed,
        "strikeouts": strikeouts,
        "walks": walks,
        "hits_allowed": hits_allowed,
        "era": era,
        "whip": whip,
        "k_per_9": k_per_9,
    }


def detect_review_issues(position: str, baseline: dict, recent: dict, is_pitcher: bool) -> list[dict]:
    issues: list[dict] = []

    if is_pitcher:
        if recent["walks"] > baseline["walks"]:
            issues.append({"tag": "control_drop", "message": "볼넷이 늘어 제구 안정감이 떨어졌습니다."})
        if recent["runs_allowed"] > baseline["runs_allowed"]:
            issues.append({"tag": "run_prevention_drop", "message": "실점 억제력이 직전 경기에서 낮아졌습니다."})
        if baseline["strikeouts"] and recent["strikeouts"] < baseline["strikeouts"]:
            issues.append({"tag": "putaway_drop", "message": "결정구 마무리 능력이 직전 경기에서 약해졌습니다."})
        if not issues:
            issues.append({"tag": "maintenance", "message": "전체 흐름은 유지됐지만 위기 관리와 제구를 꾸준히 점검할 필요가 있습니다."})
        return issues

    if recent["average"] + 0.05 < baseline["average"]:
        issues.append({"tag": "contact_drop", "message": "직전 경기에서 컨택 품질이 이전 경기들보다 내려갔습니다."})
    if recent["on_base"] + 0.05 < baseline["on_base"]:
        issues.append({"tag": "onbase_drop", "message": "출루 생산성이 직전 경기에서 떨어졌습니다."})
    if recent["strikeouts"] > baseline["strikeouts"]:
        issues.append({"tag": "strikeout_increase", "message": "삼진 비율이 높아져 타석 접근을 다시 점검할 필요가 있습니다."})
    if recent["ops"] + 0.08 < baseline["ops"]:
        issues.append({"tag": "impact_drop", "message": "장타 또는 타구 질 측면에서 임팩트가 줄었습니다."})

    if not issues:
        issues.append({"tag": "maintenance", "message": f"{position} 포지션 기준으로 기본 흐름은 유지되고 있어 작은 보정 중심의 리뷰가 적절합니다."})

    return issues
