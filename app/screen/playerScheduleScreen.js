import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ImageBackground,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const API_BASE_URL = "http://172.30.1.42:8000";
const SCHEDULE_API_ENDPOINT = "/api/schedule";
const TEAM_API_ENDPOINT = "/api/team";
const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];
const STADIUM_NAME = "수원KT위즈파크";
const STADIUM_LINK_URL = "https://www.ktwiz.co.kr/wizpark/location";
const ATTENDANCE_OPTIONS = [
  { key: "attending", label: "O", text: "참석", color: "#2f8f4e" },
  { key: "pending", label: "-", text: "미응답", color: "#8f8f8f" },
  { key: "absent", label: "X", text: "불참", color: "#c84747" },
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

const getAttendanceValue = (value, memberId) => {
  const parsedValue = parseJsonField(value);
  const normalizedMemberId = String(memberId ?? "").trim();

  if (!normalizedMemberId) {
    return null;
  }

  if (parsedValue === null || parsedValue === undefined) {
    return null;
  }

  if (Array.isArray(parsedValue)) {
    for (const item of parsedValue) {
      const nestedValue = getAttendanceValue(item, normalizedMemberId);
      if (nestedValue !== null) {
        return nestedValue;
      }
    }
    return null;
  }

  if (typeof parsedValue === "object") {
    if (Object.prototype.hasOwnProperty.call(parsedValue, normalizedMemberId)) {
      const attendanceValue = Number(parsedValue[normalizedMemberId]);
      return Number.isNaN(attendanceValue) ? null : attendanceValue;
    }

    for (const nestedValue of Object.values(parsedValue)) {
      const resolvedValue = getAttendanceValue(nestedValue, normalizedMemberId);
      if (resolvedValue !== null) {
        return resolvedValue;
      }
    }
  }

  return null;
};

const toDate = (value) => {
  if (!value) return null;

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  const rawValue = String(value).trim();

  if (/^\d{8}$/.test(rawValue)) {
    const year = rawValue.substring(0, 4);
    const month = rawValue.substring(4, 6);
    const day = rawValue.substring(6, 8);
    const date = new Date(`${year}-${month}-${day}T00:00:00`);
    if (!Number.isNaN(date.getTime())) {
      return date;
    }
  }

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

const startOfDay = (date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());
const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);

const toDateKey = (date) =>
  [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");

const formatDateText = (date) => `${date.getMonth() + 1}월 ${date.getDate()}일`;
const formatCalendarMonth = (date) =>
  `${date.getFullYear()}년 ${date.getMonth() + 1}월`;

const formatTimeText = (date) => {
  const hour = date.getHours();
  const minute = String(date.getMinutes()).padStart(2, "0");
  const isPm = hour >= 12;
  const displayHour = hour % 12 || 12;
  return `${isPm ? "오후" : "오전"} ${displayHour}:${minute}`;
};

const buildCalendarRows = (monthDate) => {
  const monthStart = startOfMonth(monthDate);
  const gridStart = new Date(monthStart);
  gridStart.setDate(monthStart.getDate() - monthStart.getDay());

  const rows = [];

  for (let weekIndex = 0; weekIndex < 6; weekIndex += 1) {
    const row = [];

    for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
      const cellDate = new Date(gridStart);
      cellDate.setDate(gridStart.getDate() + weekIndex * 7 + dayIndex);

      row.push({
        key: toDateKey(cellDate),
        label: String(cellDate.getDate()),
        dateKey: toDateKey(cellDate),
        isCurrentMonth: cellDate.getMonth() === monthDate.getMonth(),
      });
    }

    rows.push(row);
  }

  return rows;
};

const formatTeamLabel = (teamId, fallbackLabel) => {
  if (teamId === null || teamId === undefined || teamId === "") {
    return fallbackLabel;
  }

  return `팀 ${teamId}`;
};

const buildTeamNameMap = (teams) =>
  teams.reduce((result, team) => {
    const teamId = pick(team, ["Id", "id"]);
    const teamName = pick(team, ["Name", "name"]);

    if (teamId !== null && teamId !== undefined && teamName) {
      result[String(teamId)] = String(teamName);
    }

    return result;
  }, {});

const resolveTeamName = (teamNameMap, teamId, fallbackLabel) => {
  if (teamId !== null && teamId !== undefined && teamId !== "") {
    const mappedName = teamNameMap[String(teamId)];
    if (mappedName) {
      return mappedName;
    }
  }

  return formatTeamLabel(teamId, fallbackLabel);
};

const getAttendanceStatus = (attendanceValue) => {
  if (attendanceValue === 1) {
    return "attending";
  }

  if (attendanceValue === 0) {
    return "absent";
  }

  return "pending";
};

const getAttendanceOption = (status) =>
  ATTENDANCE_OPTIONS.find((option) => option.key === status) ||
  ATTENDANCE_OPTIONS[1];

const getGameKey = (game) =>
  `${game.scheduleId ?? game.scheduleDate}-${game.teamName}-${game.opponent}`;

const getAttendanceBadgePalette = (status) => {
  const option = getAttendanceOption(status);

  return {
    option,
    backgroundColor: `${option.color}18`,
    borderColor: `${option.color}55`,
  };
};

const mergeAttendanceStatus = (currentStatus, nextStatus) => {
  const priority = {
    attending: 3,
    absent: 2,
    pending: 1,
  };

  return priority[nextStatus] > priority[currentStatus]
    ? nextStatus
    : currentStatus;
};

const isActiveSchedule = (row) => !pick(row, ["deleted_at", "deletedAt"]);

const matchScheduleForUser = (row, member) => {
  const homeTeamId = pick(row, ["home", "home_team"]);
  const awayTeamId = pick(row, ["away", "away_team"]);
  const memberTeamId = pick(member, ["Team", "team"]);
  const memberId = pick(member, ["Id", "id"]);
  const homeAttendance = getAttendanceValue(row?.home_member, memberId);
  const awayAttendance = getAttendanceValue(row?.away_member, memberId);
  const hasAttendanceInfo = homeAttendance !== null || awayAttendance !== null;
  const matchByHomeTeam =
    memberTeamId !== null &&
    memberTeamId !== undefined &&
    String(homeTeamId || "") === String(memberTeamId);
  const matchByAwayTeam =
    memberTeamId !== null &&
    memberTeamId !== undefined &&
    String(awayTeamId || "") === String(memberTeamId);
  const isHome =
    matchByHomeTeam || (!matchByAwayTeam && homeAttendance !== null);
  const attendanceSide = isHome ? "home" : "away";
  const attendanceValue = isHome ? homeAttendance : awayAttendance;

  return {
    matched: matchByHomeTeam || matchByAwayTeam || hasAttendanceInfo,
    isHome,
    homeTeamId,
    awayTeamId,
    homeAttendance,
    awayAttendance,
    attendanceSide,
    attendanceValue,
  };
};

const normalizeSchedule = (row, scheduleContext, member, teamNameMap) => {
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
  const myTeamId = isHome ? homeTeamId : (awayTeamId ?? memberTeamId);
  const opponentTeamId = isHome ? awayTeamId : homeTeamId;

  const teamName =
    pick(
      row,
      isHome ? ["home_name", "team_name"] : ["away_name", "team_name"],
    ) || resolveTeamName(teamNameMap, myTeamId, "우리 팀");
  const opponent =
    pick(
      row,
      isHome
        ? ["away_name", "opponent", "opponent_team", "away_team"]
        : ["home_name", "opponent", "opponent_team", "home_team"],
    ) || resolveTeamName(teamNameMap, opponentTeamId, "상대팀 미정");
  const stadiumName = STADIUM_NAME;

  return {
    scheduleId: pick(row, ["id", "Id"]),
    scheduleDate: String(pick(row, ["date", "game_date", "match_date"]) || ""),
    date,
    opponent,
    teamName,
    stadiumName,
    isHome,
    attendanceSide:
      scheduleContext?.attendanceSide || (isHome ? "home" : "away"),
    attendanceStatus: getAttendanceStatus(scheduleContext?.attendanceValue),
    dateText: formatDateText(date),
    timeText: formatTimeText(date),
  };
};

const summarizeUpcomingGame = (item) => ({
  scheduleId: item.scheduleId,
  scheduleDate: item.scheduleDate,
  dateText: item.dateText,
  teamName: item.teamName,
  opponent: item.opponent,
  timeText: item.timeText,
  attendanceStatus: item.attendanceStatus,
  attendanceSide: item.attendanceSide,
});

const buildCalendarAttendanceMap = (games) =>
  games.reduce((result, item) => {
    const dateKey = toDateKey(item.date);
    const currentStatus = result[dateKey] || "pending";
    result[dateKey] = mergeAttendanceStatus(
      currentStatus,
      item.attendanceStatus,
    );
    return result;
  }, {});

const buildNormalizedSchedules = (scheduleRows, member, teamNameMap) => {
  const todayStart = startOfDay(new Date()).getTime();

  return scheduleRows
    .filter(isActiveSchedule)
    .map((row) => ({
      row,
      scheduleContext: matchScheduleForUser(row, member),
    }))
    .filter((item) => item.scheduleContext.matched)
    .map((item) =>
      normalizeSchedule(item.row, item.scheduleContext, member, teamNameMap),
    )
    .filter(Boolean)
    .filter((item) => item.date.getTime() >= todayStart)
    .sort((a, b) => a.date.getTime() - b.date.getTime());
};

const resolveMember = async (memberRes, normalizedUserId) => {
  if (memberRes.ok) {
    const memberJson = await memberRes.json();
    return memberJson?.member || memberJson;
  }

  const fallbackMemberRes = await fetch(`${API_BASE_URL}/api/member`);
  if (!fallbackMemberRes.ok) {
    throw new Error(
      `member API 오류: ${memberRes.status}/${fallbackMemberRes.status}`,
    );
  }

  const membersJson = await fallbackMemberRes.json();
  const members = Array.isArray(membersJson) ? membersJson : [];
  return findMemberByUserId(members, normalizedUserId) || null;
};

const PlayerScheduleScreen = ({ loginUserId, onLogout, onOpenGameDetail }) => {
  const normalizedUserId = String(loginUserId || "").trim();
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");
  const [memberName, setMemberName] = useState("");
  const [memberId, setMemberId] = useState(null);
  const [nearestGame, setNearestGame] = useState(null);
  const [upcomingGames, setUpcomingGames] = useState([]);
  const [visibleUpcomingCount, setVisibleUpcomingCount] = useState(3);
  const [calendarMonthDate, setCalendarMonthDate] = useState(
    startOfMonth(new Date()),
  );
  const [calendarAttendanceMap, setCalendarAttendanceMap] = useState({});
  const [openedAttendanceKey, setOpenedAttendanceKey] = useState(null);
  const [savingAttendanceKey, setSavingAttendanceKey] = useState(null);
  const resetScheduleState = () => {
    setNearestGame(null);
    setUpcomingGames([]);
    setVisibleUpcomingCount(3);
    setCalendarAttendanceMap({});
    setCalendarMonthDate(startOfMonth(new Date()));
    setOpenedAttendanceKey(null);
  };

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
          resetScheduleState();
        }

        const [memberRes, scheduleRes, teamRes] = await Promise.all([
          fetch(
            `${API_BASE_URL}/api/member/${encodeURIComponent(normalizedUserId)}`,
          ),
          fetch(`${API_BASE_URL}${SCHEDULE_API_ENDPOINT}`),
          fetch(`${API_BASE_URL}${TEAM_API_ENDPOINT}`),
        ]);

        if (!scheduleRes.ok) {
          throw new Error(`schedule API 오류: ${scheduleRes.status}`);
        }
        if (!teamRes.ok) {
          throw new Error(`team API 오류: ${teamRes.status}`);
        }

        const schedulesJson = await scheduleRes.json();
        const teamsJson = await teamRes.json();
        const scheduleRows = Array.isArray(schedulesJson) ? schedulesJson : [];
        const teamRows = Array.isArray(teamsJson) ? teamsJson : [];
        const teamNameMap = buildTeamNameMap(teamRows);
        const member = await resolveMember(memberRes, normalizedUserId);

        if (!member) {
          throw new Error(
            `member 테이블에서 '${normalizedUserId}' 사용자를 찾지 못했습니다.`,
          );
        }

        const foundName = String(
          pick(member, ["Name", "name"]) || normalizedUserId,
        );
        const foundMemberId = pick(member, ["Id", "id"]);

        if (isMounted) {
          setMemberName(foundName);
          setMemberId(foundMemberId);
        }

        if (scheduleRows.length === 0) {
          throw new Error("schedule 데이터가 비어 있습니다.");
        }

        const normalized = buildNormalizedSchedules(
          scheduleRows,
          member,
          teamNameMap,
        );

        if (normalized.length === 0) {
          throw new Error("해당 사용자의 다가오는 일정 데이터가 없습니다.");
        }

        const nearest = normalized[0];
        const rest = normalized.slice(1).map(summarizeUpcomingGame);
        const nextCalendarAttendanceMap = buildCalendarAttendanceMap(normalized);

        if (isMounted) {
          setNearestGame(nearest);
          setUpcomingGames(rest);
          setVisibleUpcomingCount(3);
          setCalendarAttendanceMap(nextCalendarAttendanceMap);
          setCalendarMonthDate(startOfMonth(nearest.date));
          setErrorText("");
        }
      } catch (error) {
        console.error("[PlayerScheduleScreen] load failed", error);
        if (isMounted) {
          resetScheduleState();
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

  const hasNearestGame = Boolean(nearestGame);
  const selectedDateKey = nearestGame?.date ? toDateKey(nearestGame.date) : null;
  const todayDateKey = toDateKey(new Date());
  const visibleUpcomingGames = useMemo(
    () => upcomingGames.slice(0, visibleUpcomingCount),
    [upcomingGames, visibleUpcomingCount],
  );
  const calendarRows = useMemo(
    () => buildCalendarRows(calendarMonthDate),
    [calendarMonthDate],
  );

  const handleCalendarMonthChange = (offset) => {
    setCalendarMonthDate(
      (currentMonthDate) =>
        new Date(
          currentMonthDate.getFullYear(),
          currentMonthDate.getMonth() + offset,
          1,
        ),
    );
  };

  const handleResetCalendarMonth = () => {
    setCalendarMonthDate(startOfMonth(new Date()));
  };

  const handleOpenStadiumLink = async () => {
    try {
      await Linking.openURL(STADIUM_LINK_URL);
    } catch (error) {
      console.error(
        "[PlayerScheduleScreen] failed to open stadium link",
        error,
      );
    }
  };

  const updateUpcomingGameStatus = (gameKey, nextStatus) => {
    setUpcomingGames((currentGames) =>
      currentGames.map((game) =>
        getGameKey(game) === gameKey
          ? { ...game, attendanceStatus: nextStatus }
          : game,
      ),
    );
  };

  const updateCalendarStatus = (scheduleDate, nextStatus) => {
    const targetDate = toDate(scheduleDate);
    if (!targetDate) {
      return;
    }

    const targetDateKey = toDateKey(targetDate);

    setCalendarAttendanceMap((currentMap) => ({
      ...currentMap,
      [targetDateKey]: nextStatus,
    }));
  };

  const handleSelectAttendance = async (game, nextStatus) => {
    if (!memberId) {
      setErrorText("member Id를 찾지 못해 참석 여부를 저장할 수 없습니다.");
      return;
    }

    const gameKey = getGameKey(game);

    try {
      setSavingAttendanceKey(gameKey);
      setErrorText("");

      const response = await fetch(`${API_BASE_URL}/api/schedule/attendance`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          schedule_id: game.scheduleId ?? null,
          schedule_date: game.scheduleDate || null,
          member_id: memberId,
          side: game.attendanceSide,
          status: nextStatus,
        }),
      });

      if (!response.ok) {
        throw new Error(`attendance API 오류: ${response.status}`);
      }

      updateUpcomingGameStatus(gameKey, nextStatus);
      updateCalendarStatus(game.scheduleDate, nextStatus);
      setOpenedAttendanceKey(null);
    } catch (error) {
      console.error("[PlayerScheduleScreen] attendance update failed", error);
      setErrorText(error.message || "참석 여부를 저장하지 못했습니다.");
    } finally {
      setSavingAttendanceKey(null);
    }
  };

  const renderAttendanceOptions = (game) => (
    <View style={styles.attendanceOptionRow}>
      {ATTENDANCE_OPTIONS.map((option) => (
        <TouchableOpacity
          key={option.key}
          style={[
            styles.attendanceOptionButton,
            game.attendanceStatus === option.key &&
              styles.attendanceOptionButtonSelected,
          ]}
          onPress={() => handleSelectAttendance(game, option.key)}
          disabled={savingAttendanceKey === getGameKey(game)}
        >
          <Text style={[styles.attendanceOptionIcon, { color: option.color }]}>
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderUpcomingGameItem = (game) => {
    const gameKey = getGameKey(game);
    const isAttendanceOpen = openedAttendanceKey === gameKey;
    const isSaving = savingAttendanceKey === gameKey;
    const attendancePalette = getAttendanceBadgePalette(game.attendanceStatus);

    return (
      <View key={gameKey} style={styles.listItem}>
        <View style={styles.listLeft}>
          <Text style={styles.listDate}>{game.dateText}</Text>
          <Text
            style={styles.listOpponent}
          >{`${game.teamName} vs ${game.opponent}`}</Text>
        </View>
        <View style={styles.listRight}>
          <Text style={styles.listTime}>{game.timeText}</Text>
          <View style={styles.attendanceWrap}>
            <TouchableOpacity
              style={[
                styles.attendanceBadge,
                {
                  backgroundColor: attendancePalette.backgroundColor,
                  borderColor: attendancePalette.borderColor,
                },
              ]}
              onPress={() =>
                setOpenedAttendanceKey((currentKey) =>
                  currentKey === gameKey ? null : gameKey,
                )
              }
            >
              <Text
                style={[
                  styles.attendanceBadgeIcon,
                  { color: attendancePalette.option.color },
                ]}
              >
                {attendancePalette.option.label}
              </Text>
              <Text
                style={[
                  styles.attendanceBadgeText,
                  { color: attendancePalette.option.color },
                ]}
              >
                {attendancePalette.option.text}
              </Text>
            </TouchableOpacity>
            {isAttendanceOpen ? renderAttendanceOptions(game) : null}
          </View>
          {isSaving ? <Text style={styles.savingText}>저장 중</Text> : null}
        </View>
      </View>
    );
  };

  const renderCalendarCell = (cell) => {
    const isSelected = cell.dateKey === selectedDateKey;
    const isToday = cell.dateKey === todayDateKey;
    const attendanceStatus = calendarAttendanceMap[cell.dateKey] || null;
    const isDim = !cell.isCurrentMonth;

    return (
      <View key={cell.key} style={styles.dayCell}>
        <View
          style={[
            styles.dayCircle,
            attendanceStatus && styles.dayEvent,
            attendanceStatus === "attending" && styles.dayEventAttending,
            attendanceStatus === "pending" && styles.dayEventPending,
            attendanceStatus === "absent" && styles.dayEventAbsent,
            isSelected && !isToday && styles.daySelected,
            isToday && styles.dayToday,
          ]}
        >
          <Text
            style={[
              styles.dayText,
              isDim && styles.dayDim,
              isSelected && !isToday && styles.daySelectedText,
            ]}
          >
            {cell.label}
          </Text>
        </View>
      </View>
    );
  };

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
          <Text style={[styles.cardTitle]}>이번 경기</Text>
          <ImageBackground
            source={require("../assets/baseballStadium.jpg")}
            style={styles.gameHero}
            imageStyle={styles.gameHeroImage}
          >
            <View style={styles.gameHeroOverlay} />
            <View style={styles.dateBadge}>
              <Text style={styles.dateDay}>
                {hasNearestGame ? nearestGame.date.getDate() : "-"}
              </Text>
              <Text style={styles.dateMonth}>
                {hasNearestGame ? `${nearestGame.date.getMonth() + 1}월` : ""}
              </Text>
            </View>
            <View style={styles.metaRowInHero}>
              <Text style={styles.metaChip}>
                {hasNearestGame
                  ? nearestGame.isHome
                    ? "홈 경기"
                    : "원정 경기"
                  : "경기 대기"}
              </Text>
              <Text style={styles.metaTimeInHero}>
                {hasNearestGame
                  ? `${nearestGame.timeText} 시작`
                  : "오늘 이후 일정 대기 중"}
              </Text>
            </View>
          </ImageBackground>
          <Text style={styles.matchTitle}>
            {hasNearestGame
              ? `${nearestGame.teamName} vs ${nearestGame.opponent}`
              : "다가오는 경기 없음"}
          </Text>
          {hasNearestGame ? (
            <TouchableOpacity
              onPress={handleOpenStadiumLink}
              style={styles.matchSubButton}
            >
              <Text style={[styles.matchSub, styles.matchSubLink]}>
                {nearestGame.stadiumName}
              </Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.matchSub}>
              오늘 이후 일정이 업로드되면 여기에 표시됩니다.
            </Text>
          )}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.secondaryButton, styles.detailButton]}
              onPress={onOpenGameDetail}
            >
              <Text style={[styles.secondaryText, styles.detailButtonText]}>
                경기 상세
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.calendarHeader}>
            <View style={styles.calendarArrowGroup}>
              <TouchableOpacity
                style={styles.calendarArrowButton}
                onPress={() => handleCalendarMonthChange(-1)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.calendarArrow}>‹</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.calendarMonthButton}
                onPress={handleResetCalendarMonth}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.calendarMonth}>
                  {formatCalendarMonth(calendarMonthDate)}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.calendarArrowButton}
                onPress={() => handleCalendarMonthChange(1)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.calendarArrow}>›</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.weekHeader}>
            {WEEKDAY_LABELS.map((day) => (
              <Text key={day} style={styles.weekDay}>
                {day}
              </Text>
            ))}
          </View>
          {calendarRows.map((row, rowIndex) => (
            <View key={`row-${rowIndex}`} style={styles.weekRow}>
              {row.map(renderCalendarCell)}
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>다음 경기 일정</Text>
          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="small" color="#4a7c59" />
              <Text style={styles.loadingText}>일정 불러오는 중...</Text>
            </View>
          ) : upcomingGames.length === 0 ? (
            <Text style={styles.loadingText}>다가오는 일정이 없습니다.</Text>
          ) : (
            visibleUpcomingGames.map(renderUpcomingGameItem)
          )}
          {upcomingGames.length > visibleUpcomingCount ? (
            <TouchableOpacity
              style={styles.moreButton}
              onPress={() => setVisibleUpcomingCount((count) => count + 3)}
            >
              <Text style={styles.moreText}>더 보기</Text>
            </TouchableOpacity>
          ) : null}
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
    fontSize: 24,
    color: "#2e322f",
    fontWeight: "700",
    marginBottom: 20,
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
    textAlign: "center",
    fontSize: 20,
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
    textAlign: "right",
  },
  matchSubButton: {
    width: "100%",
    alignItems: "flex-end",
  },
  matchSubLink: {
    color: "#2f6f4f",
    textDecorationLine: "underline",
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
  detailButtonText: {
    fontSize: 16,
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  calendarMonth: {
    color: "#2e322f",
    fontSize: 18,
    fontWeight: "700",
    minWidth: 110,
    textAlign: "center",
  },
  calendarMonthButton: {
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fdf9f3",
    borderWidth: 1,
    borderColor: "#d4ccc0",
  },
  calendarArrowGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  calendarArrowButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fdf9f3",
    borderWidth: 1,
    borderColor: "#d4ccc0",
  },
  calendarArrow: {
    color: "#7b776f",
    fontSize: 26,
    fontWeight: "700",
  },
  weekHeader: {
    flexDirection: "row",
    marginBottom: 8,
  },
  weekDay: {
    width: `${100 / 7}%`,
    textAlign: "center",
    fontSize: 14,
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
  dayEventAttending: {
    backgroundColor: "#d9f1df",
  },
  dayEventPending: {
    backgroundColor: "#ebebeb",
  },
  dayEventAbsent: {
    backgroundColor: "#f4dada",
  },
  daySelected: {
    backgroundColor: "#9ebd8d",
  },
  dayToday: {
    borderWidth: 1,
    borderColor: "#a9a39a",
  },
  dayText: {
    fontSize: 16,
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
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 3,
  },
  listOpponent: {
    color: "#2f3431",
    fontSize: 17,
    fontWeight: "700",
  },
  listTime: {
    color: "#8f887e",
    fontSize: 15,
    marginLeft: 8,
  },
  listRight: {
    alignItems: "flex-end",
    marginLeft: 8,
  },
  attendanceWrap: {
    marginTop: 8,
    alignItems: "flex-end",
    gap: 6,
  },
  attendanceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  attendanceBadgeIcon: {
    fontSize: 16,
    fontWeight: "800",
  },
  attendanceBadgeText: {
    fontSize: 15,
    fontWeight: "700",
  },
  attendanceOptionRow: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "flex-end",
  },
  attendanceOptionButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fdf9f3",
    borderWidth: 1,
    borderColor: "#ddd5c8",
  },
  attendanceOptionButtonSelected: {
    borderColor: "#7a9a74",
    backgroundColor: "#eef5e7",
  },
  attendanceOptionIcon: {
    fontSize: 13,
    fontWeight: "800",
  },
  savingText: {
    marginTop: 6,
    color: "#9f988f",
    fontSize: 14,
    fontWeight: "700",
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
