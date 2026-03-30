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
  SCHEDULE_API_ENDPOINT,
  TEAM_API_ENDPOINT,
  WEEKDAY_LABELS,
} from "../constants/scheduleConstants";
import { supabase } from "../lib/supabase";
import { styles } from "./playerScheduleScreen.styles";
import CommonHeader from "../components/CommonHeader";

const lineupButtonStyle = {
  flexShrink: 0,
  borderRadius: 999,
  paddingHorizontal: 14,
  paddingVertical: 8,
  backgroundColor: "#4a7c59",
  borderWidth: 1,
  borderColor: "#4a7c59",
};

const lineupButtonTextStyle = {
  color: "#ffffff",
  fontSize: 13,
  fontWeight: "700",
};

const parseScheduleDate = (rawDate) => {
  if (typeof rawDate === "string" && /^\d{8}$/.test(rawDate.trim())) {
    return new Date(
      Number(rawDate.slice(0, 4)),
      Number(rawDate.slice(4, 6)) - 1,
      Number(rawDate.slice(6, 8)),
    );
  }

  if (rawDate) {
    return new Date(rawDate);
  }

  return null;
};

const DirectorScheduleScreen = ({ navigation, route }) => {
  const { id: routeId } = route.params;
  const id = Number(routeId);

  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");
  const [teamName, setTeamName] = useState("");
  const [scheduleList, setScheduleList] = useState([]);
  const [visibleCount, setVisibleCount] = useState(5);
  const [monthDate, setMonthDate] = useState(new Date());
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        if (mounted) {
          setLoading(true);
          setErrorText("");
          setScheduleList([]);
          setVisibleCount(5);
        }

        const { data, error } = await supabase
          .from("member")
          .select("Team")
          .eq("Id", id)
          .single();

        if (error) {
          throw error;
        }

        const currentTeamId = data?.Team;
        if (!currentTeamId) {
          throw new Error("팀 정보를 찾을 수 없습니다.");
        }

        const [scheduleRes, teamRes] = await Promise.all([
          fetch(`${API_BASE_URL}${SCHEDULE_API_ENDPOINT}/team/${currentTeamId}`),
          fetch(`${API_BASE_URL}${TEAM_API_ENDPOINT}`),
        ]);

        if (!scheduleRes.ok) {
          throw new Error(`schedule API error: ${scheduleRes.status}`);
        }
        if (!teamRes.ok) {
          throw new Error(`team API error: ${teamRes.status}`);
        }

        const scheduleRows = await scheduleRes.json();
        const teamRows = await teamRes.json();
        const teamNameMap = {};
        const nextList = [];
        const today = new Date();
        const startToday = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
        ).getTime();

        if (Array.isArray(teamRows)) {
          for (let i = 0; i < teamRows.length; i += 1) {
            if (teamRows[i]?.id) {
              teamNameMap[String(teamRows[i].id)] =
                teamRows[i].name || teamRows[i].Name || "";
            }
          }
        }

        if (Array.isArray(scheduleRows)) {
          for (let i = 0; i < scheduleRows.length; i += 1) {
            const row = scheduleRows[i];
            if (row?.deleted_at) continue;

            const date = parseScheduleDate(row?.date);
            if (!date || Number.isNaN(date.getTime())) continue;
            if (date.getTime() < startToday) continue;

            const isHome =
              String(row?.home ?? "") === String(currentTeamId);
            const opponentId = isHome ? row?.away : row?.home;

            nextList.push({
              key: `${row?.date}-${row?.home}-${row?.away}`,
              scheduleDate: row?.date ?? "",
              date,
              isHome,
              dateText: `${date.getMonth() + 1}월 ${date.getDate()}일`,
              timeText: "시간 미정",
              teamName:
                teamNameMap[String(currentTeamId)] || `TEAM ${currentTeamId}`,
              opponent:
                teamNameMap[String(opponentId ?? "")] ||
                `TEAM ${opponentId ?? ""}`,
            });
          }
        }

        nextList.sort((a, b) => a.date.getTime() - b.date.getTime());

        if (mounted) {
          setTeamName(teamNameMap[String(currentTeamId)] || "");
          setScheduleList(nextList);
          if (nextList.length > 0) {
            setMonthDate(
              new Date(
                nextList[0].date.getFullYear(),
                nextList[0].date.getMonth(),
                1,
              ),
            );
          } else {
            setMonthDate(new Date(today.getFullYear(), today.getMonth(), 1));
          }
        }
      } catch (loadError) {
        console.error("[DirectorScheduleScreen] load failed", loadError);
        if (mounted) {
          setErrorText(
            loadError.message || "경기 일정을 불러오지 못했습니다.",
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [id]);

  const calendarRows = useMemo(() => {
    const rows = [];
    const first = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const start = new Date(first);
    start.setDate(first.getDate() - first.getDay());

    for (let week = 0; week < 6; week += 1) {
      const row = [];
      for (let day = 0; day < 7; day += 1) {
        const cell = new Date(start);
        cell.setDate(start.getDate() + week * 7 + day);
        row.push(cell);
      }
      rows.push(row);
    }
    return rows;
  }, [monthDate]);

  const visibleSchedules = useMemo(
    () => scheduleList.slice(0, visibleCount),
    [scheduleList, visibleCount],
  );

  const runMonth = (offset) => {
    const direction = offset > 0 ? -1 : 1;

    Animated.parallel([
      Animated.timing(translateX, {
        toValue: 18 * direction,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0.55,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setMonthDate(
        (current) =>
          new Date(current.getFullYear(), current.getMonth() + offset, 1),
      );
      translateX.setValue(-18 * direction);
      opacity.setValue(0.55);
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 0,
          duration: 160,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 160,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dx) > 20 &&
          Math.abs(gesture.dx) > Math.abs(gesture.dy),
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dx >= 50) runMonth(-1);
          if (gesture.dx <= -50) runMonth(1);
        },
      }),
    [],
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <CommonHeader title="directorScheduleScreen" />
      <View style={styles.body}>
        <View style={styles.calendarSection}>
          <View
            style={[styles.card, styles.calendarCard]}
            {...panResponder.panHandlers}
          >
            <Text style={styles.cardEyebrow}>Schedule Calendar</Text>
            <View style={styles.calendarTopRow}>
              <Text
                style={styles.cardTitle}
              >{`${monthDate.getFullYear()}년 ${monthDate.getMonth() + 1}월`}</Text>
              <TouchableOpacity
                style={styles.todayButton}
                onPress={() =>
                  setMonthDate(
                    new Date(
                      new Date().getFullYear(),
                      new Date().getMonth(),
                      1,
                    ),
                  )
                }
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
                onPress={() => runMonth(-1)}
              >
                <Text style={styles.calendarSideArrow}>‹</Text>
              </TouchableOpacity>

              <Animated.View style={{ transform: [{ translateX }], opacity }}>
                <View style={styles.weekHeader}>
                  {WEEKDAY_LABELS.map((day) => (
                    <Text key={day} style={styles.weekDay}>
                      {day}
                    </Text>
                  ))}
                </View>

                {calendarRows.map((row, rowIndex) => (
                  <View key={`row-${rowIndex}`} style={styles.weekRow}>
                    {row.map((cell) => (
                      <View
                        key={`${cell.getFullYear()}-${cell.getMonth()}-${cell.getDate()}`}
                        style={styles.dayCell}
                      >
                        <View
                          style={[
                            styles.dayCircle,
                            scheduleList.some(
                              (game) =>
                                game.date.getFullYear() ===
                                  cell.getFullYear() &&
                                game.date.getMonth() === cell.getMonth() &&
                                game.date.getDate() === cell.getDate(),
                            ) && styles.dayEvent,
                            new Date().getFullYear() === cell.getFullYear() &&
                              new Date().getMonth() === cell.getMonth() &&
                              new Date().getDate() === cell.getDate() &&
                              styles.dayToday,
                          ]}
                        >
                          <Text
                            style={[
                              styles.dayText,
                              cell.getMonth() !== monthDate.getMonth() &&
                                styles.dayDim,
                            ]}
                          >
                            {cell.getDate()}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                ))}
              </Animated.View>

              <TouchableOpacity
                style={[
                  styles.calendarSideButton,
                  styles.calendarSideButtonRight,
                ]}
                onPress={() => runMonth(1)}
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
                <Text style={styles.cardEyebrow}>Lineup Schedule</Text>
                <Text style={styles.cardTitle}>
                  {teamName
                    ? `${teamName} 경기 일정 관리`
                    : "경기 일정 관리"}
                </Text>
              </View>
              <Text style={styles.listCountText}>
                {scheduleList.length}경기
              </Text>
            </View>

            {loading ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator size="small" color="#4a7c59" />
                <Text style={styles.loadingText}>
                  일정을 불러오는 중입니다.
                </Text>
              </View>
            ) : scheduleList.length === 0 ? (
              <Text style={styles.emptyText}>
                확인할 예정 경기가 없습니다.
              </Text>
            ) : (
              visibleSchedules.map((item) => (
                <View key={item.key} style={styles.listItem}>
                  <View style={styles.listMain}>
                    <View style={styles.listHeaderRow}>
                      <Text style={styles.listDate}>{item.dateText}</Text>
                      <Text style={styles.listTime}>{item.timeText}</Text>
                    </View>

                    <View style={styles.listMatchRow}>
                      <Text
                        style={styles.listOpponent}
                      >{`${item.teamName} vs ${item.opponent}`}</Text>
                      <TouchableOpacity
                        style={lineupButtonStyle}
                        onPress={() =>
                          navigation.navigate("Lineup", {
                            targetDate: item.scheduleDate,
                            id,
                          })
                        }
                      >
                        <Text style={lineupButtonTextStyle}>
                          라인업 짜기
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.listMeta}>
                      {item.isHome ? "홈 경기" : "원정 경기"}
                    </Text>
                  </View>
                </View>
              ))
            )}

            {scheduleList.length > visibleCount ? (
              <TouchableOpacity
                style={styles.moreButton}
                onPress={() => setVisibleCount((current) => current + 5)}
              >
                <Text style={styles.moreText}>더보기</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default DirectorScheduleScreen;
