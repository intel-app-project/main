import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { API_BASE_URL } from "../constants/commonConstants";
import {
  MEMBER_API_ENDPOINT,
  SCHEDULE_API_ENDPOINT,
  TEAM_API_ENDPOINT,
} from "../constants/scheduleConstants";
import { styles } from "./gameDetailScreen.styles";
import CommonHeader from "../components/CommonHeader";
import { SafeAreaView } from "react-native-safe-area-context";

const DEFAULT_MATCH_TIME = "12:00 PM";
const DEFAULT_STADIUM_NAME = "수원KT위즈파크";
const EMPTY_ROSTER = {
  participating: [],
  notParticipating: [],
  undecided: [],
};

const formatMatchDate = (value) => {
  if (!value) {
    return "";
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

const getMemberId = (member) => member?.Id ?? member?.id ?? null;

const buildMemberCard = (member, teamName, suffix = "") => {
  const memberId = getMemberId(member);
  const number = member?.Num ? `#${member.Num}` : "No Num";
  const position = member?.Primary_Position || "N/A";
  const name =
    member?.Name || member?.name || `Player ${memberId ?? ""}`.trim();
  const isPitcher = Number(member?.Is_Pitcher) === 1;
  const tagLabel = isPitcher ? "P" : String(position).trim().slice(0, 2) || "M";

  return {
    id: String(memberId ?? name),
    name,
    meta: `${number} · ${position}`,
    tag: tagLabel,
  };
};

const buildRosterSections = (schedule, members, teamRows) => {
  const memberById = new Map(
    (Array.isArray(members) ? members : []).map((member) => [
      String(getMemberId(member)),
      member,
    ]),
  );

  const homeTeamName =
    getTeamById(teamRows, schedule?.home)?.name ||
    `HOME ${schedule?.home ?? ""}`;
  const awayTeamName =
    getTeamById(teamRows, schedule?.away)?.name ||
    `AWAY ${schedule?.away ?? ""}`;

  const homeMap = parseMemberMap(schedule?.home_member);
  const awayMap = parseMemberMap(schedule?.away_member);
  const participating = [];
  const notParticipating = [];

  const pushMembers = (memberMap, teamName) => {
    Object.entries(memberMap).forEach(([memberId, statusValue]) => {
      const member = memberById.get(String(memberId));
      if (!member) {
        return;
      }

      const card = buildMemberCard(member, teamName);

      if (Number(statusValue) === 1) {
        participating.push(card);
      } else {
        notParticipating.push(card);
      }
    });
  };

  pushMembers(homeMap, homeTeamName);
  pushMembers(awayMap, awayTeamName);

  participating.sort((a, b) => a.name.localeCompare(b.name, "ko"));
  notParticipating.sort((a, b) => a.name.localeCompare(b.name, "ko"));

  return {
    participating,
    notParticipating,
  };
};

const findMemberByUserId = (members, id) => (
  members.find((member) => member.Id === id)
);

const buildUndecidedRoster = (schedule, members, teamRows, id) => {
  const loginMember = findMemberByUserId(members, id);
  const userTeamId = loginMember?.Team;
  const isHomeTeam = String(schedule?.home) === String(userTeamId);
  const isAwayTeam = String(schedule?.away) === String(userTeamId);


  const checkedMemberMap = parseMemberMap(
    isHomeTeam ? schedule?.home_member : schedule?.away_member,
  );
  const checkedMemberIds = new Set(Object.keys(checkedMemberMap));
  const teamName = isHomeTeam
    ? getTeamById(teamRows, schedule?.home)?.name || "HOME"
    : getTeamById(teamRows, schedule?.away)?.name || "AWAY";

  return (Array.isArray(members) ? members : [])
    .filter(
      (member) => String(member?.Team) === String(userTeamId),
    )
    .filter(
      (member) =>
        !["감독", "기록원"].includes(String(
          member?.Primary_Position ?? member?.primary_position ?? "",
        ).trim()),
    )
    .filter((member) => !checkedMemberIds.has(String(getMemberId(member))))
    .map((member) => buildMemberCard(member, teamName, " · 미응답"))
    .sort((a, b) => a.name.localeCompare(b.name, "ko"));
};

const pickSchedule = (scheduleRows, scheduleId) => {
  if (!Array.isArray(scheduleRows) || scheduleRows.length === 0) {
    return null;
  }

  if (scheduleId == null) {
    return scheduleRows[0];
  }

  return (
    scheduleRows.find(
      (schedule) => String(schedule.id) === String(scheduleId),
    ) || scheduleRows[0]
  );
};

const buildMatchData = (
  scheduleRows = [],
  teamRows = [],
  memberRows = [],
  scheduleId,
  id,
) => {
  const targetSchedule = pickSchedule(scheduleRows, scheduleId);

  if (!targetSchedule) {
    return null;
  }

  const homeTeamInfo = getTeamById(teamRows, targetSchedule.home);
  const awayTeamInfo = getTeamById(teamRows, targetSchedule.away);
  const homeTeam = homeTeamInfo?.name || `HOME ${targetSchedule.home}`;
  const awayTeam = awayTeamInfo?.name || `AWAY ${targetSchedule.away}`;
  const homeTrait = homeTeamInfo?.trait?.trim() || "정보 없음";
  const awayTrait = awayTeamInfo?.trait?.trim() || "정보 없음";
  const roster = buildRosterSections(targetSchedule, memberRows, teamRows);
  const undecided = buildUndecidedRoster(
    targetSchedule,
    memberRows,
    teamRows,
    id,
  );

  const lineup = targetSchedule.lineup ? parseMemberMap(targetSchedule.lineup) : null;

  return {
    matchId: targetSchedule.id,
    matchDate: formatMatchDate(targetSchedule.date),
    matchTime: DEFAULT_MATCH_TIME,
    venue: DEFAULT_STADIUM_NAME,
    homeTeam,
    awayTeam,
    homeInitial: getInitial(homeTeam, "H"),
    awayInitial: getInitial(awayTeam, "A"),
    homeTraitLine: `${homeTeam} : ${homeTrait}`,
    awayTraitLine: `${awayTeam} : ${awayTrait}`,
    participating: roster.participating,
    notParticipating: roster.notParticipating,
    undecided,
    lineup,
  };
};

const SectionHeader = ({ title, accent, count, countStyle }) => (
  <View style={styles.sectionHeader}>
    <View style={[styles.sectionAccent, { backgroundColor: accent }]} />
    <Text style={styles.sectionHeaderTitle}>{title}</Text>
    <View style={[styles.sectionCount, countStyle]}>
      <Text style={styles.sectionCountText}>{count}명</Text>
    </View>
  </View>
);

const PlayerCard = ({ item, strong, dimmed, accentBorder }) => (
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
        {item.name}
      </Text>
      <Text style={styles.playerMeta}>{item.meta}</Text>
    </View>
    <Text style={styles.playerTag}>{item.tag}</Text>
  </View>
);

const GameDetailScreen = ({navigation, route}) => {
  const { scheduleId, id } = route.params || {};
  const [matchData, setMatchData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");
  const [visibleUndecidedCount, setVisibleUndecidedCount] = useState(3);

  useEffect(() => {
    let isMounted = true;

    const loadGameDetail = async () => {
      try {
        setLoading(true);
        setErrorText("");
        setVisibleUndecidedCount(3);

        const [scheduleRes, teamRes, memberRes] = await Promise.all([
          fetch(`${API_BASE_URL}${SCHEDULE_API_ENDPOINT}`),
          fetch(`${API_BASE_URL}${TEAM_API_ENDPOINT}`),
          fetch(`${API_BASE_URL}${MEMBER_API_ENDPOINT}`),
        ]);

        if (!scheduleRes.ok) {
          throw new Error(`schedule API 오류: ${scheduleRes.status}`);
        }
        if (!teamRes.ok) {
          throw new Error(`team API 오류: ${teamRes.status}`);
        }
        if (!memberRes.ok) {
          throw new Error(`member API 오류: ${memberRes.status}`);
        }

        const [scheduleRows, teamRows, memberRows] = await Promise.all([
          scheduleRes.json(),
          teamRes.json(),
          memberRes.json(),
        ]);

        if (isMounted) {
          setMatchData(
            buildMatchData(
              scheduleRows,
              teamRows,
              memberRows,
              scheduleId,
              id,
            ),
          );
        }
      } catch (error) {
        console.error("[GameDetailScreen] load failed", error);
        if (isMounted) {
          setMatchData(null);
          setErrorText(
            error.message || "경기 상세 정보를 불러오지 못했습니다.",
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadGameDetail();

    return () => {
      isMounted = false;
    };
  }, [scheduleId, id]);

  const participating = matchData?.participating || EMPTY_ROSTER.participating;
  const notParticipating =
    matchData?.notParticipating || EMPTY_ROSTER.notParticipating;
  const undecided = matchData?.undecided ||EMPTY_ROSTER.undecided;
  const visibleUndecided = undecided.slice(0, visibleUndecidedCount);

  return (
    <SafeAreaView style={styles.safeArea}>
      <CommonHeader title="gameDetailScreen" />

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#4a7c59" />
          <Text style={styles.loadingText}>경기 상세 정보를 불러오는 중..</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}

          <View style={styles.scoreboardCard}>
            <View style={styles.glowOrb} />
            <View style={styles.scoreboardInner}>
              <Text style={styles.matchStamp}>
                {matchData?.matchDate || "-"} ·{" "}
                {matchData?.matchTime || DEFAULT_MATCH_TIME}
              </Text>
              <Text style={styles.scoreboardNote}>
                {matchData?.venue || DEFAULT_STADIUM_NAME}
              </Text>

              <View style={styles.versusRow}>
                <View style={styles.teamBlock}>
                  <View style={styles.teamBadge}>
                    <Text style={styles.teamBadgeText}>
                      {matchData?.homeInitial || "H"}
                    </Text>
                  </View>
                  <Text style={styles.teamCaption}>Home Team</Text>
                  <Text style={styles.teamFullName}>
                    {matchData?.homeTeam || "HOME"}
                  </Text>
                </View>

                <View style={styles.vsBlock}>
                  <Text style={styles.vsText}>VS</Text>
                  <Text style={styles.vsSubText}>MATCH DAY</Text>
                </View>

                <View style={styles.teamBlock}>
                  <View style={styles.teamBadge}>
                    <Text style={styles.teamBadgeText}>
                      {matchData?.awayInitial || "A"}
                    </Text>
                  </View>
                  <Text style={styles.teamCaption}>Away Team</Text>
                  <Text style={styles.teamFullName}>
                    {matchData?.awayTeam || "AWAY"}
                  </Text>
                </View>
              </View>

              <View style={styles.traitWrap}>
                <Text style={styles.traitText}>
                  {matchData?.homeTraitLine || "HOME : 정보 없음"}
                </Text>
                <Text style={[styles.traitText, styles.traitTextSpacing]}>
                  {matchData?.awayTraitLine || "AWAY : 정보 없음"}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.lineupHeader}>
            <Text style={styles.lineupTitle}>LINEUP</Text>
          </View>

          {matchData?.lineup && (
            <View style={styles.card}>
              <View style={styles.cardTitleWrap}>
                <MaterialCommunityIcons name="format-list-numbered" size={20} color="#4a7c59" />
                <Text style={styles.cardTitleText}>Starting Lineup</Text>
              </View>
              <View style={{ marginTop: 12 }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: "#4a7c59", marginBottom: 8 }}>BATTING ORDER</Text>
                {matchData.lineup.batting.map((name, idx) => (
                  <View key={idx} style={{ flexDirection: "row", paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" }}>
                    <Text style={{ width: 24, fontSize: 12, fontWeight: "800", color: "#705c30" }}>{idx + 1}</Text>
                    <Text style={{ fontSize: 14, color: "#2e3230" }}>{name}</Text>
                  </View>
                ))}
              </View>
              <View style={{ marginTop: 16 }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: "#4a7c59", marginBottom: 8 }}>DEFENSE</Text>
                {Object.entries(matchData.lineup.defense).map(([pos, name]) => {
                  if (pos === "BENCH") return null;
                  return (
                    <View key={pos} style={{ flexDirection: "row", paddingVertical: 4 }}>
                      <Text style={{ width: 30, fontSize: 11, fontWeight: "800", color: "#705c30" }}>{pos}</Text>
                      <Text style={{ fontSize: 14, color: "#2e3230" }}>{name}</Text>
                    </View>
                  );
                })}
              </View>
              {matchData.lineup.defense.BENCH && (
                <View style={{ marginTop: 16 }}>
                  <Text style={{ fontSize: 12, fontWeight: "700", color: "#a0a0a0", marginBottom: 4 }}>BENCH</Text>
                  <Text style={{ fontSize: 13, color: "#705c30" }}>{matchData.lineup.defense.BENCH.join(", ")}</Text>
                </View>
              )}
            </View>
          )}

          <View style={styles.column}>
            <SectionHeader
              title="참가 인원"
              accent="#4a7c59"
              count={participating.length}
              countStyle={styles.countPrimary}
            />
            {participating.length ? (
              participating.map((item) => (
                <PlayerCard key={item.id} item={item} strong />
              ))
            ) : (
              <Text style={styles.emptyText}>참석 선수 정보가 없습니다.</Text>
            )}
          </View>

          <View style={styles.column}>
            <SectionHeader
              title="불참 인원"
              accent="rgba(74, 124, 89, 0.18)"
              count={notParticipating.length}
              countStyle={styles.countMuted}
            />
            {notParticipating.length ? (
              notParticipating.map((item) => (
                <PlayerCard key={item.id} item={item} dimmed />
              ))
            ) : (
              <Text style={styles.emptyText}>불참 선수 정보가 없습니다.</Text>
            )}
          </View>

          <View style={styles.column}>
            <SectionHeader
              title="미정 인원"
              accent="#705c30"
              count={undecided.length}
              countStyle={styles.countAmber}
            />
            {undecided.length ? (
              visibleUndecided.map((item) => (
                <PlayerCard key={item.id} item={item} accentBorder />
              ))
            ) : (
              <Text style={styles.emptyText}>미정 선수 정보가 없습니다.</Text>
            )}
            {undecided.length > visibleUndecidedCount ? (
              <TouchableOpacity
                style={styles.moreButton}
                onPress={() =>
                  setVisibleUndecidedCount((currentCount) => currentCount + 3)
                }
              >
                <Text style={styles.moreText}>더 보기</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonArrow}>{"<"}</Text>
            <Text style={styles.backButtonText}>BACK</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default GameDetailScreen;
