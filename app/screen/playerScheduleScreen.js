import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ImageBackground,
  Linking,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { API_BASE_URL } from "../constants/commonConstants";
import {
  SCHEDULE_API_ENDPOINT,
  TEAM_API_ENDPOINT,
  MEMBER_API_ENDPOINT,
  WEEKDAY_LABELS,
  STADIUM_LINK_URL,
  ATTENDANCE_OPTIONS,
} from "../constants/scheduleConstants";
import {
  startOfMonth,
  toDateKey,
  formatCalendarMonth,
  buildCalendarRows,
  buildTeamNameMap,
  getGameKey,
  getAttendanceBadgePalette,
  buildNormalizedSchedules,
  resolveMember,
  toDate,
  pick,
  summarizeUpcomingGame,
  buildCalendarAttendanceMap,
} from "../utils/scheduleUtils";
import { styles } from "./playerScheduleScreen.styles";
import PlayerFooter from "../components/PlayerFooter";
import CommonHeader from "../components/CommonHeader";

const PlayerScheduleScreen = ({ navigation, route }) => {
  const { id } = route.params;
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");
  const [memberName, setMemberName] = useState("");
  const [memberId, setMemberId] = useState(null);
  const [userPosition, setUserPosition] = useState(null);
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

      try {
        if (isMounted) {
          setLoading(true);
          resetScheduleState();
        }

        const [memberRes, scheduleRes, teamRes] = await Promise.all([
          fetch(
            `${API_BASE_URL}${MEMBER_API_ENDPOINT}/${id}`,
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
        const member = await resolveMember(memberRes, id); 

        const foundName = String(
          pick(member, ["Name", "name"]) || id,
        );
        const foundMemberId = pick(member, ["Id", "id"]);
        const foundPosition = pick(member, ["Primary_Position", "primary_position"]);

        if (isMounted) {
          setMemberName(foundName);
          setMemberId(foundMemberId);
          setUserPosition(foundPosition);
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
        const rest = normalized.map(summarizeUpcomingGame);
        const nextCalendarAttendanceMap =
          buildCalendarAttendanceMap(normalized);

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
  }, [id]);

  const hasNearestGame = Boolean(nearestGame);
  const selectedDateKey = nearestGame?.date
    ? toDateKey(nearestGame.date)
    : null;
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
    const gameKey = getGameKey(game);

    try {
      setSavingAttendanceKey(gameKey);
      setErrorText("");

      const payload = {
        schedule_id: game.scheduleId ?? null,
        schedule_date: game.scheduleDate || null,
        member_id: memberId,
        side: game.attendanceSide,
        status: nextStatus,
      };

      const response = await fetch(`${API_BASE_URL}/api/schedule/attendance`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.detail || `attendance API 오류: ${response.status}`,
        );
      }

      updateUpcomingGameStatus(gameKey, nextStatus);
      updateCalendarStatus(game.scheduleDate, nextStatus);

      if (nearestGame && getGameKey(nearestGame) === gameKey) {
        setNearestGame((current) => ({
          ...current,
          attendanceStatus: nextStatus,
        }));
      }

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
          onPress={() => {
            handleSelectAttendance(game, option.key);
          }}
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
    const isDirector = userPosition === "감독";

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
          {isDirector ? (
            <TouchableOpacity
              style={styles.lineupBadge}
              onPress={() => navigation.navigate("LineupScreen", {
                targetDate: game.scheduleDate,
                id,
              })}
              activeOpacity={0.8}
            >
              <Text style={styles.lineupBadgeText}>라인업</Text>
            </TouchableOpacity>
          ) : (
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
          )}
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
            isSelected && styles.daySelected,
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
      <CommonHeader title="playerScheduleScreen" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >

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
              onPress={() =>
                navigation.navigate("GameDetail", {
                  scheduleId: nearestGame.scheduleId,
                  id: id,
                })
              }
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
            <TouchableOpacity
              style={styles.todayButton}
              onPress={handleResetCalendarMonth}
            >
              <MaterialCommunityIcons name="restore" size={24} color="#4a7c59" />
            </TouchableOpacity>
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
      <PlayerFooter activeTab="TeamSchedule" />
    </SafeAreaView>
  );
};

export default PlayerScheduleScreen;
