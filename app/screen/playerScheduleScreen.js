import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  PanResponder,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_BASE_URL } from "../constants/commonConstants";
import {
  ATTENDANCE_OPTIONS,
  MEMBER_API_ENDPOINT,
  SCHEDULE_API_ENDPOINT,
  TEAM_API_ENDPOINT,
  WEEKDAY_LABELS,
} from "../constants/scheduleConstants";
import {
  buildCalendarAttendanceMap,
  buildCalendarRows,
  buildNormalizedSchedules,
  buildTeamNameMap,
  formatCalendarMonth,
  getAttendanceBadgePalette,
  getGameKey,
  pick,
  resolveMember,
  startOfMonth,
  summarizeUpcomingGame,
  toDate,
  toDateKey,
} from "../utils/scheduleUtils";
import { styles } from "./playerScheduleScreen.styles";
import CommonFooter from "../components/CommonFooter";
import CommonHeader from "../components/CommonHeader";

const PlayerScheduleScreen = ({ route }) => {
  const { id } = route.params;
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");
  const [memberId, setMemberId] = useState(null);
  const [memberTeamName, setMemberTeamName] = useState("");
  const [upcomingGames, setUpcomingGames] = useState([]);
  const [visibleUpcomingCount, setVisibleUpcomingCount] = useState(5);
  const [calendarMonthDate, setCalendarMonthDate] = useState(
    startOfMonth(new Date()),
  );
  const [calendarAttendanceMap, setCalendarAttendanceMap] = useState({});
  const [openedAttendanceKey, setOpenedAttendanceKey] = useState(null);
  const [savingAttendanceKey, setSavingAttendanceKey] = useState(null);
  const calendarTranslateX = useRef(new Animated.Value(0)).current;
  const calendarOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let isMounted = true;

    const loadSchedules = async () => {
      try {
        if (isMounted) {
          setLoading(true);
          setErrorText("");
          setUpcomingGames([]);
          setVisibleUpcomingCount(5);
          setCalendarAttendanceMap({});
          setOpenedAttendanceKey(null);
        }

        const [memberRes, scheduleRes, teamRes] = await Promise.all([
          fetch(`${API_BASE_URL}${MEMBER_API_ENDPOINT}/${id}`),
          fetch(`${API_BASE_URL}${SCHEDULE_API_ENDPOINT}`),
          fetch(`${API_BASE_URL}${TEAM_API_ENDPOINT}`),
        ]);

        if (!scheduleRes.ok) {
          throw new Error(`schedule API error: ${scheduleRes.status}`);
        }
        if (!teamRes.ok) {
          throw new Error(`team API error: ${teamRes.status}`);
        }

        const schedulesJson = await scheduleRes.json();
        const teamsJson = await teamRes.json();
        const scheduleRows = Array.isArray(schedulesJson) ? schedulesJson : [];
        const teamRows = Array.isArray(teamsJson) ? teamsJson : [];
        const teamNameMap = buildTeamNameMap(teamRows);
        const member = await resolveMember(memberRes, id);

        if (!member) {
          throw new Error("사용자 정보를 찾을 수 없습니다.");
        }

        const foundMemberId = pick(member, ["Id", "id"]);
        const foundMemberTeamId = pick(member, ["Team", "team"]);
        const foundMemberTeamName =
          teamNameMap[String(foundMemberTeamId)] || "";
        const normalizedGames = buildNormalizedSchedules(
          scheduleRows,
          member,
          teamNameMap,
        );

        if (isMounted) {
          setMemberId(foundMemberId);
          setMemberTeamName(foundMemberTeamName);
          setUpcomingGames(normalizedGames.map(summarizeUpcomingGame));
          setCalendarAttendanceMap(buildCalendarAttendanceMap(normalizedGames));

          if (normalizedGames[0]?.date) {
            setCalendarMonthDate(startOfMonth(normalizedGames[0].date));
          } else {
            setCalendarMonthDate(startOfMonth(new Date()));
          }
        }
      } catch (error) {
        console.error("[PlayerScheduleScreen] load failed", error);
        if (isMounted) {
          setErrorText(error.message || "경기 일정을 불러오지 못했습니다.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadSchedules();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const todayDateKey = toDateKey(new Date());
  const visibleUpcomingGames = useMemo(
    () => upcomingGames.slice(0, visibleUpcomingCount),
    [upcomingGames, visibleUpcomingCount],
  );
  const calendarRows = useMemo(
    () => buildCalendarRows(calendarMonthDate),
    [calendarMonthDate],
  );

  const runCalendarTransition = (offset) => {
    const direction = offset > 0 ? -1 : 1;

    Animated.parallel([
      Animated.timing(calendarTranslateX, {
        toValue: 18 * direction,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(calendarOpacity, {
        toValue: 0.55,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCalendarMonthDate(
        (currentMonthDate) =>
          new Date(
            currentMonthDate.getFullYear(),
            currentMonthDate.getMonth() + offset,
            1,
          ),
      );

      calendarTranslateX.setValue(-18 * direction);
      calendarOpacity.setValue(0.55);

      Animated.parallel([
        Animated.timing(calendarTranslateX, {
          toValue: 0,
          duration: 160,
          useNativeDriver: true,
        }),
        Animated.timing(calendarOpacity, {
          toValue: 1,
          duration: 160,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const handleResetCalendarMonth = () => {
    setCalendarMonthDate(startOfMonth(new Date()));
  };

  const calendarPanResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dx) > 20 &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dx >= 50) {
            runCalendarTransition(-1);
          } else if (gestureState.dx <= -50) {
            runCalendarTransition(1);
          }
        },
      }),
    [calendarMonthDate],
  );

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
          result.detail || `attendance API error: ${response.status}`,
        );
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
        <View style={styles.listMain}>
          <View style={styles.listHeaderRow}>
            <Text style={styles.listDate}>{game.dateText}</Text>
            <Text style={styles.listTime}>{game.timeText}</Text>
          </View>
          <View style={styles.listMatchRow}>
            <Text style={styles.listOpponent}>
              {`${game.teamName} vs ${game.opponent}`}
            </Text>
            <TouchableOpacity
              style={[
                styles.attendanceBadge,
                styles.attendanceBadgeInline,
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
          </View>
          <Text style={styles.listMeta}>
            {game.attendanceSide === "home" ? "홈 경기" : "원정 경기"}
          </Text>
        </View>

        <View style={styles.attendanceWrap}>
          {isAttendanceOpen ? renderAttendanceOptions(game) : null}
          {isSaving ? <Text style={styles.savingText}>저장 중...</Text> : null}
        </View>
      </View>
    );
  };

  const renderCalendarCell = (cell) => {
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
            isToday && styles.dayToday,
          ]}
        >
          <Text style={[styles.dayText, isDim && styles.dayDim]}>
            {cell.label}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <CommonHeader title="playerScheduleScreen" />

      <View style={styles.body}>
        <View style={styles.calendarSection}>
          <View
            style={[styles.card, styles.calendarCard]}
            {...calendarPanResponder.panHandlers}
          >
            <Text style={styles.cardEyebrow}>Schedule Calendar</Text>

            <View style={styles.calendarTopRow}>
              <Text style={styles.cardTitle}>
                {formatCalendarMonth(calendarMonthDate)}
              </Text>

              <TouchableOpacity
                style={styles.todayButton}
                onPress={handleResetCalendarMonth}
              >
                <Text style={styles.todayButtonText}>오늘</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.calendarBody}>
              <TouchableOpacity
                style={[
                  styles.calendarSideButton,
                  styles.calendarSideButtonLeft,
                ]}
                onPress={() => runCalendarTransition(-1)}
              >
                <Text style={styles.calendarSideArrow}>‹</Text>
              </TouchableOpacity>

              <Animated.View
                style={{
                  transform: [{ translateX: calendarTranslateX }],
                  opacity: calendarOpacity,
                }}
              >
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
              </Animated.View>

              <TouchableOpacity
                style={[
                  styles.calendarSideButton,
                  styles.calendarSideButtonRight,
                ]}
                onPress={() => runCalendarTransition(1)}
              >
                <Text style={styles.calendarSideArrow}>›</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <ScrollView
          style={styles.listScroll}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}

          <View style={styles.card}>
            <View style={styles.listTitleRow}>
              <View>
                <Text style={styles.cardEyebrow}>Attendance</Text>
                <Text style={styles.cardTitle}>
                  {memberTeamName
                    ? `${memberTeamName} 경기 일정 관리`
                    : "경기 일정 관리"}
                </Text>
              </View>
              <Text style={styles.listCountText}>
                {upcomingGames.length}경기
              </Text>
            </View>

            {loading ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator size="small" color="#4a7c59" />
                <Text style={styles.loadingText}>
                  일정을 불러오는 중입니다.
                </Text>
              </View>
            ) : upcomingGames.length === 0 ? (
              <Text style={styles.emptyText}>확인할 예정 경기가 없습니다.</Text>
            ) : (
              visibleUpcomingGames.map(renderUpcomingGameItem)
            )}

            {upcomingGames.length > visibleUpcomingCount ? (
              <TouchableOpacity
                style={styles.moreButton}
                onPress={() => setVisibleUpcomingCount((count) => count + 5)}
              >
                <Text style={styles.moreText}>더보기</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </ScrollView>
      </View>

      <CommonFooter activeTab="PlayerSchedule" />
    </SafeAreaView>
  );
};

export default PlayerScheduleScreen;
