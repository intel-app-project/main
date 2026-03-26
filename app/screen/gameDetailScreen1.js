import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const API_BASE_URL = "http://172.30.1.19:8000";
const SCHEDULE_API_ENDPOINT = "/api/schedule";
const TEAM_API_ENDPOINT = "/api/team";
const MEMBER_API_ENDPOINT = "/api/member";
const STADIUM_NAME = "수원KT위즈파크";

const fallbackMatchDetail = {
  matchDate: "03/29(SUN)",
  matchTime: "12:00 PM",
  venue: STADIUM_NAME,
  homeTeam: "BTS FC",
  awayTeam: "Terra United",
  homeInitial: "B",
  awayInitial: "T",
  mood: "이번 경기는 초반 압박과 세트피스 집중력이 핵심입니다.",
  participating: [],
  notParticipating: [],
  undecided: [],
};

const formatMatchDate = (value) => {
  if (!value) {
    return fallbackMatchDetail.matchDate;
  }

  const raw = String(value).trim();
  if (!/^\d{8}$/.test(raw)) {
    return raw;
  }

  const year = Number(raw.slice(0, 4));
  const month = Number(raw.slice(4, 6)) - 1;
  const day = Number(raw.slice(6, 8));
  const date = new Date(year, month, day);
  const weekdays = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

  return `${raw.slice(4, 6)}/${raw.slice(6, 8)}(${weekdays[date.getDay()]})`;
};

const getInitial = (name, fallback) => {
  if (!name) {
    return fallback;
  }

  return String(name).trim().charAt(0).toUpperCase() || fallback;
};

const parseMemberMap = (value) => {
  if (!value) {
    return {};
  }

  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return {};
    }
  }

  if (typeof value === "object") {
    return value;
  }

  return {};
};

const getTeamById = (teamRows, teamId) => {
  if (!Array.isArray(teamRows)) {
    return null;
  }

  return teamRows.find((team) => String(team.id) === String(teamId)) || null;
};

const getTeamNameById = (teamRows, teamId, fallbackName) => {
  const matched = getTeamById(teamRows, teamId);

  return matched?.name || fallbackName;
};

const buildMemberCard = (member, status, teamName) => {
  const number = member?.Num ? `#${member.Num}` : "No Num";
  const position = member?.Primary_Position || "N/A";
  const name = member?.Name || `Player ${member?.Id ?? ""}`.trim();
  const isPitcher = Number(member?.Is_Pitcher) === 1;

  return {
    id: String(member?.Id ?? name),
    name,
    age: member?.Age ?? "-",
    meta: `${number} · ${position} · ${teamName}`,
    tag: isPitcher ? "P" : position.charAt(0).toUpperCase() || "M",
    status,
  };
};

const buildRosterSections = (schedule, members, teamRows) => {
  const homeTeam = getTeamNameById(teamRows, schedule?.home, `HOME ${schedule?.home ?? ""}`);
  const awayTeam = getTeamNameById(teamRows, schedule?.away, `AWAY ${schedule?.away ?? ""}`);

  const memberById = new Map(
    (Array.isArray(members) ? members : []).map((member) => [
      String(member.Id),
      member,
    ])
  );

  const homeMap = parseMemberMap(schedule?.home_member);
  const awayMap = parseMemberMap(schedule?.away_member);
  const participating = [];
  const notParticipating = [];

  const pushMember = (memberMap, teamName) => {
    Object.entries(memberMap).forEach(([memberId, statusValue]) => {
      const member = memberById.get(String(memberId));
      if (!member) {
        return;
      }

      const normalizedStatus = Number(statusValue) === 1 ? "participating" : "notParticipating";
      const card = buildMemberCard(member, normalizedStatus, teamName);

      if (normalizedStatus === "participating") {
        participating.push(card);
      } else {
        notParticipating.push(card);
      }
    });
  };

  pushMember(homeMap, homeTeam);
  pushMember(awayMap, awayTeam);

  participating.sort((a, b) => a.name.localeCompare(b.name, "ko"));
  notParticipating.sort((a, b) => a.name.localeCompare(b.name, "ko"));

  return {
    participating,
    notParticipating,
    undecided: [],
  };
};

const buildMatchDetail = (scheduleRows = [], teamRows = [], memberRows = []) => {
  const nextSchedule = Array.isArray(scheduleRows) && scheduleRows.length > 0
    ? scheduleRows[0]
    : null;

  if (!nextSchedule) {
    return fallbackMatchDetail;
  }

  const homeTeam = getTeamNameById(teamRows, nextSchedule.home, `HOME ${nextSchedule.home}`);
  const awayTeam = getTeamNameById(teamRows, nextSchedule.away, `AWAY ${nextSchedule.away}`);
  const homeTeamInfo = getTeamById(teamRows, nextSchedule.home);
  const awayTeamInfo = getTeamById(teamRows, nextSchedule.away);
  const roster = buildRosterSections(nextSchedule, memberRows, teamRows);
  const homeTrait = homeTeamInfo?.trait?.trim();
  const awayTrait = awayTeamInfo?.trait?.trim();

  let mood = `${homeTeam}와 ${awayTeam}의 출전 명단을 기준으로 이번 경기 상세 정보를 구성했습니다.`;

  if (homeTrait && awayTrait) {
    mood = `${homeTeam}의 ${homeTrait}와 ${awayTeam}의 ${awayTrait}가 맞붙는 경기입니다.`;
  } else if (homeTrait) {
    mood = `${homeTeam}의 ${homeTrait}를 중심으로 이번 경기 흐름을 확인할 수 있습니다.`;
  } else if (awayTrait) {
    mood = `${awayTeam}의 ${awayTrait}를 경계해야 하는 경기입니다.`;
  }

  return {
    matchDate: formatMatchDate(nextSchedule.date),
    matchTime: fallbackMatchDetail.matchTime,
    venue: STADIUM_NAME,
    homeTeam,
    awayTeam,
    homeInitial: getInitial(homeTeam, "H"),
    awayInitial: getInitial(awayTeam, "A"),
    mood,
    participating: roster.participating,
    notParticipating: roster.notParticipating,
    undecided: roster.undecided,
  };
};

const SectionHeader = ({ title, accent, count, countStyle }) => (
  <View style={styles.sectionHeader}>
    <View style={[styles.sectionAccent, { backgroundColor: accent }]} />
    <Text style={styles.sectionHeaderTitle}>{title}</Text>
    <View style={[styles.sectionCount, countStyle]}>
      <Text style={styles.sectionCountText}>{count}</Text>
    </View>
  </View>
);

const PlayerCard = ({ item, strong, dimmed, tag, accentBorder }) => (
  <View
    style={[
      styles.playerCard,
      strong && styles.playerCardStrong,
      dimmed && styles.playerCardDimmed,
      accentBorder && styles.playerCardAccent,
    ]}
  >
    <View style={styles.playerTextWrap}>
      <Text style={[styles.playerName, dimmed && styles.playerNameDimmed]}>
        {item.name} ({item.age})
      </Text>
      <Text style={styles.playerMeta}>{item.meta}</Text>
    </View>
    {tag ? <Text style={styles.playerTag}>{tag}</Text> : null}
  </View>
);

const GameDetailScreen = ({ onNavigate }) => {
  const [matchDetail, setMatchDetail] = useState(fallbackMatchDetail);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const fetchMatchDetail = async () => {
      try {
        setLoading(true);
        setError("");

        const [scheduleResponse, teamResponse, memberResponse] = await Promise.all([
          fetch(`${API_BASE_URL}${SCHEDULE_API_ENDPOINT}`),
          fetch(`${API_BASE_URL}${TEAM_API_ENDPOINT}`),
          fetch(`${API_BASE_URL}${MEMBER_API_ENDPOINT}`),
        ]);

        if (!scheduleResponse.ok) {
          throw new Error("schedule api failed");
        }
        if (!teamResponse.ok) {
          throw new Error("team api failed");
        }
        if (!memberResponse.ok) {
          throw new Error("member api failed");
        }

        const [scheduleRows, teamRows, memberRows] = await Promise.all([
          scheduleResponse.json(),
          teamResponse.json(),
          memberResponse.json(),
        ]);

        if (active) {
          setMatchDetail(buildMatchDetail(scheduleRows, teamRows, memberRows));
        }
      } catch (fetchError) {
        console.error("game detail fetch error", fetchError);
        if (active) {
          setMatchDetail(fallbackMatchDetail);
          setError("서버 데이터를 불러오지 못해 기본 경기 정보로 표시 중입니다.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchMatchDetail();

    return () => {
      active = false;
    };
  }, []);

  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.iconButton}
          activeOpacity={0.85}
          onPress={() => onNavigate && onNavigate("player")}
        >
          <Text style={styles.iconText}>{"<"}</Text>
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>MATCH DETAILS</Text>
        <TouchableOpacity style={styles.iconButton} activeOpacity={0.85}>
          <Text style={styles.iconText}>...</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#4a7c59" />
          <Text style={styles.loadingText}>경기 상세 정보를 불러오는 중입니다.</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.scoreboardCard}>
            <View style={styles.glowOrb} />
            <View style={styles.scoreboardInner}>
              <Text style={styles.matchStamp}>
                {matchDetail.matchDate} · {matchDetail.matchTime}
              </Text>
              <Text style={styles.scoreboardNote}>{matchDetail.venue}</Text>

              <View style={styles.versusRow}>
                <View style={styles.teamBlock}>
                  <View style={styles.teamBadge}>
                    <Text style={styles.teamBadgeText}>
                      {matchDetail.homeInitial}
                    </Text>
                  </View>
                  <Text style={styles.teamCaption}>Home Team</Text>
                  <Text style={styles.teamFullName}>{matchDetail.homeTeam}</Text>
                </View>

                <View style={styles.vsBlock}>
                  <Text style={styles.vsText}>VS</Text>
                  <Text style={styles.vsSubText}>MATCH DAY</Text>
                </View>

                <View style={styles.teamBlock}>
                  <View style={styles.teamBadge}>
                    <Text style={styles.teamBadgeText}>
                      {matchDetail.awayInitial}
                    </Text>
                  </View>
                  <Text style={styles.teamCaption}>Away Team</Text>
                  <Text style={styles.teamFullName}>{matchDetail.awayTeam}</Text>
                </View>
              </View>

              <Text style={styles.moodText}>{matchDetail.mood}</Text>
            </View>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.lineupHeader}>
            <Text style={styles.lineupTitle}>LINEUP</Text>
            <TouchableOpacity style={styles.detailsLink} activeOpacity={0.8}>
              <Text style={styles.detailsLinkText}>DETAILS</Text>
              <Text style={styles.detailsLinkArrow}>{">"}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.columns}>
            <View style={styles.column}>
              <SectionHeader
                title="PARTICIPATING"
                accent="#4a7c59"
                count={matchDetail.participating.length}
                countStyle={styles.countPrimary}
              />
              {matchDetail.participating.length ? (
                matchDetail.participating.map((item) => (
                  <PlayerCard key={item.id} item={item} strong tag={item.tag} />
                ))
              ) : (
                <Text style={styles.emptyText}>참석 선수 정보가 없습니다.</Text>
              )}
            </View>

            <View style={styles.column}>
              <SectionHeader
                title="NOT PARTICIPATING"
                accent="rgba(74, 124, 89, 0.18)"
                count={matchDetail.notParticipating.length}
                countStyle={styles.countMuted}
              />
              {matchDetail.notParticipating.length ? (
                matchDetail.notParticipating.map((item) => (
                  <PlayerCard key={item.id} item={item} dimmed />
                ))
              ) : (
                <Text style={styles.emptyText}>불참 선수 정보가 없습니다.</Text>
              )}
            </View>

            <View style={styles.column}>
              <SectionHeader
                title="UNDECIDED"
                accent="#705c30"
                count={matchDetail.undecided.length}
                countStyle={styles.countAmber}
              />
              <Text style={styles.emptyText}>현재 미정 상태 데이터는 없습니다.</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.88}
            onPress={() => onNavigate && onNavigate("player")}
          >
            <Text style={styles.backButtonArrow}>{"<"}</Text>
            <Text style={styles.backButtonText}>BACK</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      <View style={styles.bottomNav}>
        <View style={styles.navItem}>
          <Text style={styles.navIcon}>[]</Text>
          <Text style={styles.navText}>MATCHES</Text>
        </View>
        <View style={[styles.navItem, styles.navItemActive]}>
          <Text style={[styles.navIcon, styles.navIconActive]}>O</Text>
          <Text style={[styles.navText, styles.navTextActive]}>TEAM</Text>
        </View>
        <View style={styles.navItem}>
          <Text style={styles.navIcon}>#</Text>
          <Text style={styles.navText}>LEAGUE</Text>
        </View>
        <View style={styles.navItem}>
          <Text style={styles.navIcon}>@</Text>
          <Text style={styles.navText}>PROFILE</Text>
        </View>
      </View>
    </View>
  );
};

export default GameDetailScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#faf6f0",
  },
  topBar: {
    height: 72,
    paddingTop: 20,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f4efe6",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(74, 124, 89, 0.08)",
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(74, 124, 89, 0.08)",
  },
  iconText: {
    color: "#705c30",
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 18,
  },
  topBarTitle: {
    color: "#705c30",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2,
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 14,
    color: "#705c30",
    fontSize: 15,
    textAlign: "center",
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 18,
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  scoreboardCard: {
    position: "relative",
    overflow: "hidden",
    backgroundColor: "#f2ede4",
    borderRadius: 24,
    padding: 24,
    marginBottom: 28,
    shadowColor: "#2e3230",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 2,
  },
  glowOrb: {
    position: "absolute",
    top: -24,
    right: -18,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(112, 92, 48, 0.08)",
  },
  scoreboardInner: {
    alignItems: "center",
  },
  matchStamp: {
    color: "#4a7c59",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2,
    marginBottom: 8,
  },
  scoreboardNote: {
    color: "#7b7468",
    fontSize: 13,
    marginBottom: 24,
  },
  versusRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  teamBlock: {
    flex: 1,
    alignItems: "center",
  },
  teamBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#fbf7f1",
    borderWidth: 1,
    borderColor: "rgba(74, 124, 89, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  teamBadgeText: {
    color: "#2f3c33",
    fontSize: 28,
    fontWeight: "800",
  },
  teamCaption: {
    color: "#8b867c",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  teamFullName: {
    color: "#2f3c33",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  vsBlock: {
    paddingHorizontal: 12,
    alignItems: "center",
  },
  vsText: {
    color: "#705c30",
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 4,
  },
  vsSubText: {
    color: "#8b867c",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.4,
  },
  moodText: {
    color: "#5d5a54",
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
  },
  errorText: {
    color: "#705c30",
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 18,
  },
  lineupHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingBottom: 10,
    marginBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(74, 124, 89, 0.1)",
  },
  lineupTitle: {
    color: "#2f3c33",
    fontSize: 28,
    fontWeight: "800",
  },
  detailsLink: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailsLinkText: {
    color: "#4a7c59",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.6,
  },
  detailsLinkArrow: {
    color: "#4a7c59",
    fontSize: 16,
    fontWeight: "800",
    marginLeft: 2,
  },
  columns: {
    gap: 22,
  },
  column: {
    marginBottom: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  sectionAccent: {
    width: 4,
    height: 18,
    borderRadius: 2,
    marginRight: 10,
  },
  sectionHeaderTitle: {
    flex: 1,
    color: "#3c453d",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.4,
  },
  sectionCount: {
    minWidth: 28,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    alignItems: "center",
  },
  countPrimary: {
    backgroundColor: "rgba(74, 124, 89, 0.12)",
  },
  countMuted: {
    backgroundColor: "rgba(74, 124, 89, 0.07)",
  },
  countAmber: {
    backgroundColor: "rgba(112, 92, 48, 0.12)",
  },
  sectionCountText: {
    color: "#705c30",
    fontSize: 11,
    fontWeight: "800",
  },
  playerCard: {
    backgroundColor: "#fffaf2",
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "rgba(74, 124, 89, 0.06)",
  },
  playerCardStrong: {
    backgroundColor: "#fcf8f2",
  },
  playerCardDimmed: {
    opacity: 0.62,
  },
  playerCardAccent: {
    borderLeftWidth: 3,
    borderLeftColor: "#705c30",
  },
  playerTextWrap: {
    flex: 1,
    paddingRight: 12,
  },
  playerName: {
    color: "#2f3c33",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  playerNameDimmed: {
    color: "#7e796e",
  },
  playerMeta: {
    color: "#8b867c",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  playerTag: {
    color: "#4a7c59",
    fontSize: 24,
    fontWeight: "800",
    opacity: 0.45,
  },
  emptyText: {
    color: "#8b867c",
    fontSize: 13,
    lineHeight: 20,
    paddingHorizontal: 2,
  },
  backButton: {
    marginTop: 18,
    minHeight: 58,
    borderRadius: 18,
    backgroundColor: "#4a7c59",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2e3230",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 2,
  },
  backButtonArrow: {
    color: "#faf6f0",
    fontSize: 18,
    fontWeight: "800",
    marginRight: 8,
  },
  backButtonText: {
    color: "#faf6f0",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 2,
  },
  bottomNav: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 84,
    paddingHorizontal: 8,
    paddingBottom: 12,
    paddingTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: "#f4efe6",
    borderTopWidth: 1,
    borderTopColor: "rgba(74, 124, 89, 0.08)",
  },
  navItem: {
    minWidth: 72,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 14,
  },
  navItemActive: {
    backgroundColor: "#eadfca",
  },
  navIcon: {
    color: "#6e7a6f",
    fontSize: 16,
    marginBottom: 4,
  },
  navIconActive: {
    color: "#705c30",
  },
  navText: {
    color: "#6e7a6f",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.1,
  },
  navTextActive: {
    color: "#705c30",
  },
});
