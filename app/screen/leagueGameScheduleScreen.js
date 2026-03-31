import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  PanResponder,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_BASE_URL } from "../constants/commonConstants";
import {
  GAME_API_ENDPOINT,
  SCHEDULE_API_ENDPOINT,
  TEAM_API_ENDPOINT,
} from "../constants/scheduleConstants";
import { styles } from "./leagueGameScheduleScreen.styles";
import CommonHeader from "../components/CommonHeader";

const INITIAL_VISIBLE_COUNT = 8;
const LOAD_MORE_COUNT = 3;
const SWIPE_START_THRESHOLD = 6;
const SWIPE_THRESHOLD = 10;
const TAB_TRANSITION_OFFSET = 22;
const TAB_TRANSITION_DURATION = 220;
const HORIZONTAL_SWIPE_MAX_ANGLE = 30;
const MAX_VERTICAL_TO_HORIZONTAL_RATIO = Math.tan(
  (HORIZONTAL_SWIPE_MAX_ANGLE * Math.PI) / 180,
);
const DRAG_FOLLOW_LIMIT = 42;
const MESSAGE_LOAD_ERROR = "Failed to load league schedule.";
const MESSAGE_NO_UPCOMING = "No upcoming matches.";
const MESSAGE_LOAD_MORE = "Load More";
const MESSAGE_GAME_UNIT = " games";
const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

const pick = (obj, keys) => {
  if (!obj) {
    return null;
  }

  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null && obj[key] !== "") {
      return obj[key];
    }
  }

  return null;
};

const toDate = (value) => {
  if (!value) {
    return null;
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  const rawValue = String(value).trim();

  if (/^\d{8}$/.test(rawValue)) {
    const year = rawValue.slice(0, 4);
    const month = rawValue.slice(4, 6);
    const day = rawValue.slice(6, 8);
    const parsed = new Date(`${year}-${month}-${day}T00:00:00`);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  const parsed = new Date(rawValue.replace(" ", "T"));
  if (!Number.isNaN(parsed.getTime())) {
    return parsed;
  }

  return null;
};

const startOfToday = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

const buildTeamNameMap = (teams) =>
  (Array.isArray(teams) ? teams : []).reduce((result, team) => {
    const id = pick(team, ["Id", "id"]);
    const name = pick(team, ["Name", "name"]);

    if (id !== null && id !== undefined && name) {
      result[String(id)] = String(name);
    }

    return result;
  }, {});

const getTeamName = (teamNameMap, teamId, fallbackLabel) => {
  if (teamId !== null && teamId !== undefined && teamId !== "") {
    return teamNameMap[String(teamId)] || `${fallbackLabel} ${teamId}`;
  }

  return fallbackLabel;
};

const formatScheduleDate = (date) => {
  if (!date) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}.${month}.${day} (${WEEKDAYS[date.getDay()]})`;
};

const aggregateScores = (gameRows) => {
  const map = {};
  if (!Array.isArray(gameRows)) return map;

  gameRows.forEach((row) => {
    const d = pick(row, ["date", "match_date", "game_date"]);
    if (!d) return;

    const dateKey = String(d);
    const battingTeam = String(pick(row, ["batting_team"]) || "");
    const runs = parseInt(pick(row, ["runs_scored_on_play"]) || "0", 10);

    if (dateKey && battingTeam) {
      if (!map[dateKey]) map[dateKey] = {};
      if (!map[dateKey][battingTeam]) map[dateKey][battingTeam] = 0;
      map[dateKey][battingTeam] += runs;
    }
  });

  return map;
};

const normalizeSchedule = (row, teamNameMap, scoreMap = {}) => {
  const dateValue = pick(row, [
    "date",
    "match_date",
    "game_date",
    "scheduled_at",
  ]);
  const matchDate = toDate(dateValue);

  if (!matchDate) {
    return null;
  }

  const dateKey = String(dateValue || "");
  const home = pick(row, ["home", "home_team"]);
  const away = pick(row, ["away", "away_team"]);

  const homeScore =
    scoreMap[dateKey]?.[String(home)] ??
    pick(row, ["home_score", "score_home", "HomeScore", "HOME_SCORE"]);

  const awayScore =
    scoreMap[dateKey]?.[String(away)] ??
    pick(row, ["away_score", "score_away", "AwayScore", "AWAY_SCORE"]);

  return {
    home: getTeamName(teamNameMap, home, "HOME"),
    away: getTeamName(teamNameMap, away, "AWAY"),
    homeScore:
      homeScore !== null && homeScore !== undefined ? String(homeScore) : "0",
    awayScore:
      awayScore !== null && awayScore !== undefined ? String(awayScore) : "0",
    matchDate,
    isScoreValid: !!scoreMap[dateKey],
  };
};

const LeagueGameScheduleScreen = () => {
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");
  const [games, setGames] = useState([]);
  const [activeTab, setActiveTab] = useState("FUTURE");
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);
  const [monthDate, setMonthDate] = useState(new Date());
  const scheduleTranslateX = useRef(new Animated.Value(0)).current;
  const scheduleOpacity = useRef(new Animated.Value(1)).current;
  const calendarTranslateX = useRef(new Animated.Value(0)).current;
  const calendarOpacity = useRef(new Animated.Value(1)).current;
  const swipeHandledRef = useRef(false);

  const animateTabTransition = (direction) => {
    scheduleTranslateX.setValue(direction * TAB_TRANSITION_OFFSET);
    scheduleOpacity.setValue(0.78);

    Animated.parallel([
      Animated.timing(scheduleTranslateX, {
        toValue: 0,
        duration: TAB_TRANSITION_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(scheduleOpacity, {
        toValue: 1,
        duration: TAB_TRANSITION_DURATION,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const resetDragPosition = () => {
    Animated.spring(scheduleTranslateX, {
      toValue: 0,
      useNativeDriver: true,
      speed: 16,
      bounciness: 4,
    }).start();
    Animated.timing(scheduleOpacity, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  const switchTab = (nextTab, direction = 0) => {
    if (activeTab === nextTab) {
      resetDragPosition();
      return;
    }

    setVisibleCount(INITIAL_VISIBLE_COUNT);
    setActiveTab(nextTab);
    animateTabTransition(direction || (nextTab === "FUTURE" ? -1 : 1));
  };

  useEffect(() => {
    let isMounted = true;

    const loadSchedules = async () => {
      try {
        if (isMounted) {
          setLoading(true);
          setErrorText("");
          setVisibleCount(INITIAL_VISIBLE_COUNT);
        }

        const [scheduleRes, teamRes, gameRes] = await Promise.all([
          fetch(`${API_BASE_URL}${SCHEDULE_API_ENDPOINT}`),
          fetch(`${API_BASE_URL}${TEAM_API_ENDPOINT}`),
          fetch(`${API_BASE_URL}${GAME_API_ENDPOINT}`),
        ]);

        if (!scheduleRes.ok) {
          throw new Error(`schedule API error: ${scheduleRes.status}`);
        }

        if (!teamRes.ok) {
          throw new Error(`team API error: ${teamRes.status}`);
        }

        const [scheduleRows, teamRows, gameRows] = await Promise.all([
          scheduleRes.json(),
          teamRes.json(),
          gameRes.ok ? gameRes.json() : [],
        ]);

        const teamNameMap = buildTeamNameMap(teamRows);
        const scoreMap = aggregateScores(gameRows);

        const normalizedGames = (
          Array.isArray(scheduleRows) ? scheduleRows : []
        )
          .map((row) => normalizeSchedule(row, teamNameMap, scoreMap))
          .filter(Boolean);

        const firstUpcomingGame = normalizedGames
          .filter((game) => game.matchDate >= startOfToday())
          .sort((a, b) => a.matchDate.getTime() - b.matchDate.getTime())[0];

        if (isMounted) {
          setGames(normalizedGames);
          setMonthDate(
            firstUpcomingGame
              ? new Date(
                  firstUpcomingGame.matchDate.getFullYear(),
                  firstUpcomingGame.matchDate.getMonth(),
                  1,
                )
              : new Date(),
          );
        }
      } catch (error) {
        console.error("[LeagueGameScheduleScreen] load failed", error);
        if (isMounted) {
          setGames([]);
          setErrorText(error.message || MESSAGE_LOAD_ERROR);
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
  }, []);

  const today = startOfToday();

  const filteredGames = useMemo(() => {
    if (activeTab === "FUTURE") {
      return games
        .filter((g) => g.matchDate >= today)
        .sort((a, b) => a.matchDate.getTime() - b.matchDate.getTime());
    }

    return games
      .filter((g) => g.matchDate < today)
      .sort((a, b) => b.matchDate.getTime() - a.matchDate.getTime());
  }, [games, activeTab, today]);

  const visibleGames = useMemo(
    () => filteredGames.slice(0, visibleCount),
    [filteredGames, visibleCount],
  );
  const hasMoreGames = visibleCount < filteredGames.length;

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

  const handleLoadMore = () => {
    setVisibleCount((current) =>
      Math.min(current + LOAD_MORE_COUNT, filteredGames.length),
    );
  };

  const runMonth = (offset) => {
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
      setMonthDate(
        (current) =>
          new Date(current.getFullYear(), current.getMonth() + offset, 1),
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

  const tabSwipeResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponderCapture: (_, gestureState) =>
          Math.abs(gestureState.dx) > SWIPE_START_THRESHOLD &&
          Math.abs(gestureState.dy) <=
            Math.abs(gestureState.dx) * MAX_VERTICAL_TO_HORIZONTAL_RATIO,
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dx) > SWIPE_START_THRESHOLD &&
          Math.abs(gestureState.dy) <=
            Math.abs(gestureState.dx) * MAX_VERTICAL_TO_HORIZONTAL_RATIO,
        onPanResponderGrant: () => {
          swipeHandledRef.current = false;
          scheduleOpacity.setValue(0.97);
        },
        onPanResponderMove: (_, gestureState) => {
          if (swipeHandledRef.current) {
            return;
          }

          const nextTranslate = Math.max(
            -DRAG_FOLLOW_LIMIT,
            Math.min(DRAG_FOLLOW_LIMIT, gestureState.dx * 0.62),
          );

          scheduleTranslateX.setValue(nextTranslate);
          const dragOpacity = 1 - Math.min(Math.abs(nextTranslate) / 220, 0.08);
          scheduleOpacity.setValue(dragOpacity);

          if (gestureState.dx <= -SWIPE_THRESHOLD) {
            swipeHandledRef.current = true;
            switchTab("FUTURE", -1);
            return;
          }

          if (gestureState.dx >= SWIPE_THRESHOLD) {
            swipeHandledRef.current = true;
            switchTab("PAST", 1);
          }
        },
        onPanResponderRelease: (_, gestureState) => {
          if (swipeHandledRef.current) {
            swipeHandledRef.current = false;
            return;
          }

          if (gestureState.dx <= -SWIPE_THRESHOLD) {
            switchTab("FUTURE", -1);
            return;
          }

          if (gestureState.dx >= SWIPE_THRESHOLD) {
            switchTab("PAST", 1);
            return;
          }

          resetDragPosition();
        },
        onPanResponderTerminate: () => {
          swipeHandledRef.current = false;
          resetDragPosition();
        },
      }),
    [activeTab, scheduleOpacity, scheduleTranslateX],
  );

  const calendarPanResponder = useMemo(
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
    [calendarOpacity, calendarTranslateX],
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <CommonHeader title="leagueGameScheduleScreen" />

      <View style={styles.body}>
        <View style={styles.calendarSection}>
          <View
            style={[styles.sectionCard, styles.calendarCard]}
            {...calendarPanResponder.panHandlers}
          >
            <Text style={styles.sectionEyebrow}>Schedule Calendar</Text>

            <View style={styles.calendarTopRow}>
              <Text
                style={styles.calendarTitle}
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

              <Animated.View
                style={{
                  transform: [{ translateX: calendarTranslateX }],
                  opacity: calendarOpacity,
                }}
              >
                <View style={styles.weekHeader}>
                  {WEEKDAYS.map((day) => (
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
                            games.some(
                              (game) =>
                                game.matchDate.getFullYear() ===
                                  cell.getFullYear() &&
                                game.matchDate.getMonth() === cell.getMonth() &&
                                game.matchDate.getDate() === cell.getDate(),
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
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionEyebrow}>Match schedule</Text>
                <Text style={styles.sectionTitle}>{"경기 일정"}</Text>
              </View>
              {!loading && filteredGames.length > 0 ? (
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>
                    {filteredGames.length}
                    {MESSAGE_GAME_UNIT}
                  </Text>
                </View>
              ) : null}
            </View>

            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[
                  styles.tabButton,
                  activeTab === "PAST" && styles.activeTab,
                ]}
                onPress={() => switchTab("PAST")}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === "PAST" && styles.activeTabText,
                  ]}
                >
                  PAST MATCHES
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.tabButton,
                  activeTab === "FUTURE" && styles.activeTab,
                ]}
                onPress={() => switchTab("FUTURE")}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === "FUTURE" && styles.activeTabText,
                  ]}
                >
                  FUTURE MATCHES
                </Text>
              </TouchableOpacity>
            </View>

            <View {...tabSwipeResponder.panHandlers}>
              <Animated.View
                style={{
                  transform: [{ translateX: scheduleTranslateX }],
                  opacity: scheduleOpacity,
                }}
              >
                {loading ? (
                  <ActivityIndicator
                    size="large"
                    color="#4a7c59"
                    style={styles.loader}
                  />
                ) : errorText ? (
                  <Text style={styles.errorText}>{errorText}</Text>
                ) : visibleGames.length > 0 ? (
                  <>
                    <View style={styles.scheduleList}>
                      {visibleGames.map((game, index) => (
                        <View
                          key={`${game.matchDate.getTime()}-${index}`}
                          style={[
                            styles.scheduleItem,
                            activeTab === "FUTURE" &&
                              index === 0 &&
                              styles.scheduleItemHighlight,
                          ]}
                        >
                          <View style={styles.scheduleItemRow}>
                            <View style={styles.scheduleIndexBadge}>
                              <Text style={styles.scheduleIndexText}>
                                {String(index + 1).padStart(2, "0")}
                              </Text>
                            </View>

                            <View style={styles.scheduleMain}>
                              <Text
                                style={[
                                  styles.scheduleMatchText,
                                  activeTab === "FUTURE" &&
                                    index === 0 &&
                                    styles.scheduleMatchTextHighlight,
                                ]}
                              >
                                {game.home} vs {game.away}
                              </Text>
                              <View style={styles.scheduleDateRow}>
                                <Text style={styles.scheduleDateText}>
                                  {formatScheduleDate(game.matchDate)}
                                </Text>
                                {activeTab === "PAST" ? (
                                  <Text style={styles.scheduleScoreText}>
                                    {game.isScoreValid
                                      ? `${game.homeScore} : ${game.awayScore}`
                                      : "Canceled"}
                                  </Text>
                                ) : null}
                              </View>
                            </View>
                          </View>
                        </View>
                      ))}
                    </View>

                    {hasMoreGames ? (
                      <Pressable
                        style={styles.loadMoreButton}
                        onPress={handleLoadMore}
                      >
                        <Text style={styles.loadMoreButtonText}>
                          {MESSAGE_LOAD_MORE}
                        </Text>
                      </Pressable>
                    ) : null}
                  </>
                ) : (
                  <Text style={styles.emptyText}>
                    {activeTab === "FUTURE"
                      ? MESSAGE_NO_UPCOMING
                      : "No past matches."}
                  </Text>
                )}
              </Animated.View>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default LeagueGameScheduleScreen;
