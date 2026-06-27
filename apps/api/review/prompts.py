from __future__ import annotations


def build_review_text(member: dict, team: dict | None, issues: list[dict], recent_date: str | None, mode: str) -> str:
    team_name = (team or {}).get("name") or "TEAM"
    player_name = member.get("Name") or "선수"
    position = member.get("Primary_Position") or "-"
    issue_lines = [f"- {issue['message']}" for issue in issues[:3]]
    issue_text = "\n".join(issue_lines)
    recent_label = recent_date or "최근 경기"

    return (
        f"{team_name} {player_name}({position}) {mode} review\n"
        f"{recent_label} 기준으로 이전 경기 흐름과 비교했을 때 아래 부분을 우선 점검하는 것이 좋습니다.\n"
        f"{issue_text}\n"
        "다음 경기에서는 가장 먼저 흔들린 지표 하나만 집중해서 보정하는 접근이 적절합니다."
    )
