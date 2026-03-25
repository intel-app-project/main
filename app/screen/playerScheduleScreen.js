import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ImageBackground,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const API_BASE_URL = "http://172.30.1.19:8000";
const SCHEDULE_API_ENDPOINT = "/api/schedule";

const FALLBACK_NEAREST = {
  date: new Date(2024, 8, 12, 19, 30),
  opponent: "리버 오크스",
  teamName: "테라 타이탄즈",
  stadiumName: "테라 센트럴 스타디움",
  stadiumAddress: "경기도 그린필드파크 오크 애비뉴 442번지",
  isHome: true,
  dateText: "9월 12일",
  timeText: "오후 7:30",
};

const FALLBACK_UPCOMING = [
  { dateText: "9월 17일", opponent: "힐사이드 호크스", timeText: "오후 4:00" },
  { dateText: "9월 19일", opponent: "파인 그로브 블루", timeText: "오후 7:00" },
  {
    dateText: "9월 24일",
    opponent: "레이크사이드 스타즈",
    timeText: "오후 6:30",
  },
];

const calendarRows = [
  ["25", "26", "27", "28", "29", "30", "1"],
  ["2", "3", "4", "5", "6", "7", "8"],
  ["9", "10", "11", "12", "13", "14", "15"],
  ["16", "17", "18", "19", "20", "21", "22"],
];

const pick = (obj, keys) => {
  for (const key of keys) {
    if (obj?.[key] !== undefined && obj?.[key] !== null && obj?.[key] !== "") {
      return obj[key];
    }
  }
  return null;
};

const findMemberByUserId = (members, userId) =>
  members.find(
    (member) =>
      String(pick(member, ["User_ID", "user_id"]) || "").trim() === userId,
  );

const parseJsonField = (value) => {
  if (typeof value !== "string") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const containsUserId = (value, userId) => {
  const parsedValue = parseJsonField(value);

  if (Array.isArray(parsedValue)) {
    return parsedValue.some((item) => containsUserId(item, userId));
  }

  if (parsedValue && typeof parsedValue === "object") {
    const directUserId = pick(parsedValue, ["User_ID", "user_id", "userid"]);
    if (String(directUserId || "").trim() === userId) {
      return true;
    }

    return Object.values(parsedValue).some((item) => containsUserId(item, userId));
  }

  return String(parsedValue || "").trim() === userId;
};

const toDate = (value) => {
  if (!value) return null;

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  const rawValue = String(value).trim();
  const candidateValues = [
    rawValue,
    rawValue.replace(" ", "T"),
    rawValue.replace(/\./g, "-").replace(" ", "T"),
    rawValue.replace(/\//g, "-").replace(" ", "T"),
    rawValue
      .replace(/년\s*/g, "-")
      .replace(/월\s*/g, "-")
      .replace(/일\s*/g, " ")
      .replace(/\./g, ":")
      .trim()
      .replace(" ", "T"),
  ];

  for (const candidate of candidateValues) {
    const date = new Date(candidate);
    if (!Number.isNaN(date.getTime())) {
      return date;
    }
  }

  return null;
};

const formatDateText = (date) => `${date.getMonth() + 1}월 ${date.getDate()}일`;

const formatTimeText = (date) => {
  const hour = date.getHours();
  const minute = String(date.getMinutes()).padStart(2, "0");
  const isPm = hour >= 12;
  const displayHour = hour % 12 || 12;
  return `${isPm ? "오후" : "오전"} ${displayHour}:${minute}`;
};

const formatTeamLabel = (teamId, fallbackLabel) => {
  if (teamId === null || teamId === undefined || teamId === "") {
    return fallbackLabel;
  }

  return `팀 ${teamId}`;
};

const matchScheduleForUser = (row, member, userId) => {
  const homeTeamId = pick(row, ["home", "home_team"]);
  const awayTeamId = pick(row, ["away", "away_team"]);
  const memberTeamId = pick(member, ["Team", "team"]);

  const inHomeMembers = containsUserId(row?.home_member, userId);
  const inAwayMembers = containsUserId(row?.away_member, userId);
  const matchByHomeTeam =
    memberTeamId !== null &&
    memberTeamId !== undefined &&
    String(homeTeamId || "") === String(memberTeamId);
  const matchByAwayTeam =
    memberTeamId !== null &&
    memberTeamId !== undefined &&
    String(awayTeamId || "") === String(memberTeamId);

  const matched =
    inHomeMembers || inAwayMembers || matchByHomeTeam || matchByAwayTeam;

  return {
    matched,
    isHome: inHomeMembers || (!inAwayMembers && matchByHomeTeam),
    homeTeamId,
    awayTeamId,
  };
};

const normalizeSchedule = (row, scheduleContext, member) => {
  const dateValue = pick(row, [
    "date",
    "start_time",
    "start_at",
    "game_date",
    "match_date",
    "scheduled_at",
  ]);
  const date = toDate(dateValue);
  if (!date) return null;

  const homeTeamId =
    scheduleContext?.homeTeamId ?? pick(row, ["home", "home_team"]);
  const awayTeamId =
    scheduleContext?.awayTeamId ?? pick(row, ["away", "away_team"]);
  const isHome = Boolean(scheduleContext?.isHome);
  const memberTeamId = pick(member, ["Team", "team"]);
  const myTeamId = isHome ? homeTeamId : awayTeamId ?? memberTeamId;
  const opponentTeamId = isHome ? awayTeamId : homeTeamId;
  const teamName =
    pick(row, isHome ? ["home_name", "team_name"] : ["away_name", "team_name"]) ||
    formatTeamLabel(myTeamId, "우리 팀");
  const opponent =
    pick(
      row,
      isHome
        ? ["away_name", "opponent", "opponent_team", "away_team"]
        : ["home_name", "opponent", "opponent_team", "home_team"],
    ) || formatTeamLabel(opponentTeamId, "상대팀 미정");
  const stadiumName =
    pick(row, ["stadium", "stadium_name", "venue", "location"]) ||
    "경기장 정보 없음";
  const stadiumAddress =
    pick(row, [
      "stadium_address",
      "venue_address",
      "address",
      "location_detail",
    ]) || "주소 정보 없음";

  return {
    date,
    opponent,
    teamName,
    stadiumName,
    stadiumAddress,
    isHome,
    dateText: formatDateText(date),
    timeText: formatTimeText(date),
  };
};

const PlayerScheduleScreen = ({ loginUserId, onLogout }) => {
  const normalizedUserId = String(loginUserId || "").trim();
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");
  const [memberName, setMemberName] = useState("");
  const [nearestGame, setNearestGame] = useState(FALLBACK_NEAREST);
  const [upcomingGames, setUpcomingGames] = useState(FALLBACK_UPCOMING);

  useEffect(() => {
    let isMounted = true;

    const loadUpcomingSchedules = async () => {
      if (!normalizedUserId) {
        if (isMounted) {
          setErrorText("로그인 사용자 ID가 없습니다.");
          setLoading(false);
        }
        return;
      }

      try {
        if (isMounted) {
          setLoading(true);
        }

        const schedulePromise = fetch(
          `${API_BASE_URL}${SCHEDULE_API_ENDPOINT}`,
        );
        const memberByIdPromise = fetch(
          `${API_BASE_URL}/api/member/${encodeURIComponent(normalizedUserId)}`,
        );
        const [memberRes, scheduleRes] = await Promise.all([
          memberByIdPromise,
          schedulePromise,
        ]);

        if (!scheduleRes.ok) {
          throw new Error(`schedule API 오류: ${scheduleRes.status}`);
        }

        const schedulesJson = await scheduleRes.json();
        const scheduleRows = Array.isArray(schedulesJson) ? schedulesJson : [];
        let member = null;

        if (memberRes.ok) {
          const memberJson = await memberRes.json();
          member = memberJson?.member || memberJson;
        } else {
          const fallbackMemberRes = await fetch(`${API_BASE_URL}/api/member`);
          if (!fallbackMemberRes.ok) {
            throw new Error(
              `member API 오류: ${memberRes.status}/${fallbackMemberRes.status}`,
            );
          }

          const membersJson = await fallbackMemberRes.json();
          const members = Array.isArray(membersJson) ? membersJson : [];
          member = findMemberByUserId(members, normalizedUserId) || null;
        }

        if (!member) {
          throw new Error(
            `member 테이블에서 '${normalizedUserId}' 사용자를 찾지 못했습니다.`,
          );
        }

        const foundName = String(
          pick(member, ["Name", "name"]) || normalizedUserId,
        );

        if (isMounted) {
          setMemberName(foundName);
        }

        console.log("[PlayerScheduleScreen] member resolved", {
          userId: normalizedUserId,
          memberName: foundName,
          memberTeam: pick(member, ["Team", "team"]),
        });

        if (scheduleRows.length === 0) {
          throw new Error("schedule 데이터가 비어 있습니다.");
        }

        const matchedSchedules = scheduleRows
          .map((row) => ({
            row,
            scheduleContext: matchScheduleForUser(row, member, normalizedUserId),
          }))
          .filter((item) => item.scheduleContext.matched);

        console.log("[PlayerScheduleScreen] matched schedules", {
          totalSchedules: scheduleRows.length,
          matchedSchedules: matchedSchedules.length,
          firstMatchedSchedule: matchedSchedules[0]?.row || null,
        });

        const normalized = matchedSchedules
          .map((item) => normalizeSchedule(item.row, item.scheduleContext, member))
          .filter(Boolean)
          .filter((item) => item.date.getTime() >= Date.now())
          .sort((a, b) => a.date.getTime() - b.date.getTime());

        if (normalized.length === 0) {
          throw new Error("해당 사용자의 다가오는 일정 데이터가 없습니다.");
        }

        const nearest = normalized[0];
        const rest = normalized.slice(1, 4).map((item) => ({
          dateText: item.dateText,
          opponent: item.opponent,
          timeText: item.timeText,
        }));

        if (isMounted) {
          setNearestGame(nearest);
          setUpcomingGames(rest);
          setErrorText("");
        }
      } catch (error) {
        if (isMounted) {
          setErrorText(error.message || "일정을 불러오지 못했습니다.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadUpcomingSchedules();

    return () => {
      isMounted = false;
    };
  }, [normalizedUserId]);

  const selectedDay = useMemo(() => {
    const day = nearestGame?.date?.getDate?.();
    return day ? String(day) : "12";
  }, [nearestGame]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>
            {memberName ? `${memberName}의 일정` : "일정"}
          </Text>
          {onLogout ? (
            <TouchableOpacity
              style={styles.switchUserButton}
              onPress={onLogout}
            >
              <Text style={styles.switchUserText}>사용자 변경</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}

        <View style={styles.card}>
          <View style={styles.scheduleHeaderRow}>
            <Text style={[styles.cardTitle, styles.cardTitleNoMargin]}>
              1. 다음 경기
            </Text>
            <TouchableOpacity style={styles.inlineReminderButton}>
              <Text style={styles.inlineReminderText}>알림 설정</Text>
            </TouchableOpacity>
          </View>
          <ImageBackground
            source={require("../assets/baseballStadium.jpg")}
            style={styles.gameHero}
            imageStyle={styles.gameHeroImage}
          >
            <View style={styles.gameHeroOverlay} />
            <View style={styles.dateBadge}>
              <Text style={styles.dateDay}>{nearestGame.date.getDate()}</Text>
              <Text style={styles.dateMonth}>
                {nearestGame.date.getMonth() + 1}월
              </Text>
            </View>
            <View style={styles.metaRowInHero}>
              <Text style={styles.metaChip}>
                {nearestGame.isHome ? "홈 경기" : "원정 경기"}
              </Text>
              <Text style={styles.metaTimeInHero}>
                {nearestGame.timeText} 시작
              </Text>
            </View>
          </ImageBackground>
          <Text style={styles.matchTitle}>
            {nearestGame.teamName} vs {nearestGame.opponent}
          </Text>
          <Text style={styles.matchSub}>{nearestGame.stadiumName}</Text>
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.secondaryButton, styles.detailButton]}
            >
              <Text style={styles.secondaryText}>경기 상세</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.sectionDivider} />
          <Text style={styles.subTitle}>경기장 정보</Text>
          <View style={styles.mapWrap}>
            <View style={styles.mapInner} />
          </View>
          <Text style={styles.stadiumTitle}>{nearestGame.stadiumName}</Text>
          <Text style={styles.stadiumInfo}>{nearestGame.stadiumAddress}</Text>
          <TouchableOpacity>
            <Text style={styles.mapLink}>지도에서 열기</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>2. 캘린더</Text>
          <View style={styles.calendarHeader}>
            <Text style={styles.calendarMonth}>2024년 9월</Text>
            <Text style={styles.calendarArrow}>‹ ›</Text>
          </View>
          <View style={styles.weekHeader}>
            {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
              <Text key={day} style={styles.weekDay}>
                {day}
              </Text>
            ))}
          </View>
          {calendarRows.map((row, rowIndex) => (
            <View key={`row-${rowIndex}`} style={styles.weekRow}>
              {row.map((day) => {
                const isSelected = day === selectedDay;
                const isEvent = day === selectedDay || day === "4";
                const isDim = rowIndex === 0;
                return (
                  <View key={`${rowIndex}-${day}`} style={styles.dayCell}>
                    <View
                      style={[
                        styles.dayCircle,
                        isEvent && styles.dayEvent,
                        isSelected && styles.daySelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          isDim && styles.dayDim,
                          isSelected && styles.daySelectedText,
                        ]}
                      >
                        {day}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>3. 이후 경기 일정</Text>
          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="small" color="#4a7c59" />
              <Text style={styles.loadingText}>일정 불러오는 중...</Text>
            </View>
          ) : (
            upcomingGames.map((game) => (
              <View
                key={`${game.dateText}-${game.opponent}`}
                style={styles.listItem}
              >
                <View style={styles.listLeft}>
                  <Text style={styles.listDate}>{game.dateText}</Text>
                  <Text style={styles.listOpponent}>{game.opponent}</Text>
                </View>
                <Text style={styles.listTime}>{game.timeText}</Text>
              </View>
            ))
          )}
          <TouchableOpacity style={styles.moreButton}>
            <Text style={styles.moreText}>더 보기</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PlayerScheduleScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#faf6f0",
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 24,
    gap: 12,
  },
  pageHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  pageTitle: {
    flex: 1,
    fontSize: 30,
    lineHeight: 34,
    color: "#2e322f",
    fontWeight: "700",
    marginBottom: 2,
  },
  switchUserButton: {
    borderWidth: 1,
    borderColor: "#b7c8b0",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#fdf9f3",
  },
  switchUserText: {
    color: "#4a7c59",
    fontSize: 11,
    fontWeight: "700",
  },
  errorText: {
    color: "#8b3f3f",
    fontSize: 12,
    lineHeight: 18,
  },
  card: {
    backgroundColor: "#f7f2ea",
    borderRadius: 14,
    padding: 14,
    shadowColor: "#2e3230",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    color: "#2e322f",
    fontWeight: "700",
    marginBottom: 10,
  },
  cardTitleNoMargin: {
    marginBottom: 0,
  },
  scheduleHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  inlineReminderButton: {
    backgroundColor: "#fdf9f3",
    borderWidth: 1,
    borderColor: "#b7c8b0",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  inlineReminderText: {
    color: "#4a7c59",
    fontSize: 11,
    fontWeight: "700",
  },
  gameHero: {
    height: 132,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    overflow: "hidden",
  },
  gameHeroImage: {
    borderRadius: 12,
  },
  gameHeroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(46, 50, 47, 0.24)",
  },
  dateBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#d5e4c3",
    alignItems: "center",
    justifyContent: "center",
  },
  dateDay: {
    fontSize: 13,
    fontWeight: "800",
    color: "#2d382f",
  },
  dateMonth: {
    fontSize: 8,
    fontWeight: "700",
    color: "#5f6f61",
    marginTop: -1,
  },
  metaRowInHero: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metaChip: {
    backgroundColor: "#e6dfd2",
    color: "#8b805f",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 10,
    fontWeight: "700",
  },
  metaTimeInHero: {
    color: "#f5efe5",
    fontSize: 11,
    fontWeight: "700",
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  matchTitle: {
    fontSize: 24,
    lineHeight: 29,
    color: "#2e322f",
    fontWeight: "700",
  },
  matchSub: {
    fontSize: 12,
    color: "#7f786f",
    marginTop: 6,
    marginBottom: 12,
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
  },
  secondaryButton: {
    width: 90,
    backgroundColor: "#fdf9f3",
    borderWidth: 1,
    borderColor: "#b7c8b0",
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: "center",
  },
  detailButton: {
    width: "100%",
  },
  secondaryText: {
    color: "#4a7c59",
    fontSize: 12,
    fontWeight: "700",
  },
  sectionDivider: {
    height: 1,
    backgroundColor: "rgba(112, 92, 48, 0.16)",
    marginTop: 12,
    marginBottom: 10,
  },
  subTitle: {
    fontSize: 14,
    color: "#2e322f",
    fontWeight: "700",
    marginBottom: 8,
  },
  mapWrap: {
    height: 88,
    borderRadius: 12,
    padding: 8,
    backgroundColor: "#d8d4cb",
    marginBottom: 10,
  },
  mapInner: {
    flex: 1,
    borderRadius: 10,
    backgroundColor: "#b7c9b1",
  },
  stadiumTitle: {
    color: "#2e322f",
    fontSize: 14,
    fontWeight: "700",
  },
  stadiumInfo: {
    color: "#8b857c",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 4,
    marginBottom: 8,
  },
  mapLink: {
    color: "#4a7c59",
    fontSize: 11,
    fontWeight: "700",
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  calendarMonth: {
    color: "#2e322f",
    fontSize: 16,
    fontWeight: "700",
  },
  calendarArrow: {
    color: "#7b776f",
    fontSize: 16,
    fontWeight: "700",
  },
  weekHeader: {
    flexDirection: "row",
    marginBottom: 8,
  },
  weekDay: {
    width: `${100 / 7}%`,
    textAlign: "center",
    fontSize: 10,
    color: "#99948d",
    fontWeight: "700",
  },
  weekRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  dayCell: {
    width: `${100 / 7}%`,
    alignItems: "center",
  },
  dayCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  dayEvent: {
    backgroundColor: "#e4ecd9",
  },
  daySelected: {
    backgroundColor: "#9ebd8d",
  },
  dayText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#3a3f3b",
  },
  dayDim: {
    color: "#c1bcb4",
  },
  daySelectedText: {
    color: "#fff",
  },
  loadingWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
  },
  loadingText: {
    color: "#6f6a62",
    fontSize: 12,
  },
  listItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(112, 92, 48, 0.14)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  listLeft: {
    flex: 1,
  },
  listDate: {
    color: "#9f988f",
    fontSize: 10,
    fontWeight: "700",
    marginBottom: 3,
  },
  listOpponent: {
    color: "#2f3431",
    fontSize: 13,
    fontWeight: "700",
  },
  listTime: {
    color: "#8f887e",
    fontSize: 11,
    marginLeft: 8,
  },
  moreButton: {
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d4ccc0",
    backgroundColor: "#fdf9f3",
    paddingVertical: 10,
    alignItems: "center",
  },
  moreText: {
    color: "#4a7c59",
    fontSize: 13,
    fontWeight: "700",
  },
});
