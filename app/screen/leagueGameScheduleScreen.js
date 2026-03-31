import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  ImageBackground,
  PanResponder,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_BASE_URL } from "../constants/commonConstants";
import {
  SCHEDULE_API_ENDPOINT,
  TEAM_API_ENDPOINT,
  GAME_API_ENDPOINT,
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
const STADIUM_NAME = "수원 KT 위즈파크";
const STADIUM_IMAGE_URI =
  "https://i.namu.wiki/i/s5el6DSDQjJetZbb2WxKe-H8PtDQ6dfeZuMSKUtyro-XpSYN-lY2F-baCLWr_IqPi6nTTNQpa5zjc18gyN5xX01x2hKrAn65EKGflZmbyF1C5-hjFB2Te6mPOGzUeimD3AwO-qVSNz_C8nQSgaaozA.webp";
const MESSAGE_NO_NEAREST = "표시할 예정 경기가 없습니다.";
const MESSAGE_LOAD_ERROR = "리그 경기 일정을 불러오지 못했습니다.";
const MESSAGE_NO_UPCOMING = "예정된 경기 일정이 없습니다.";
const MESSAGE_LOAD_MORE = "더 보기";
const MESSAGE_GAME_UNIT = "경기";
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

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

const formatNearestDate = (date) => {
  if (!date) {
    return "";
  }

  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${month}.${day}`;
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

// matchDate(Date 객체)를 LineupScreen에서 사용하는 YYYYMMDD 문자열로 변환
const toYYYYMMDD = (date) => {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
};

/**
 * 플레이별 경기 데이터(gameRows)로부터 경기별/팀별 총 득점을 합산합니다.
 * 리턴 구조: { "YYYYMMDD": { "teamId": totalScore } }
 */
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

  // 해당 날짜에 Game 테이블의 플레이 기록이 아예 없는지 확인
  const isScoreValid = !!scoreMap[dateKey];

  // scoreMap이 존재하는 경우 일치하는 날짜와 팀 ID의 합산 점수를 사용
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
    isScoreValid,
  };
};

const LeagueGameScheduleScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");
  const [games, setGames] = useState([]);
  const [activeTab, setActiveTab] = useState("FUTURE"); // 'PAST' or 'FUTURE'
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);
  const scheduleTranslateX = useRef(new Animated.Value(0)).current;
  const scheduleOpacity = useRef(new Animated.Value(1)).current;
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
          throw new Error(`schedule API 오류: ${scheduleRes.status}`);
        }

        if (!teamRes.ok) {
          throw new Error(`team API 오류: ${teamRes.status}`);
        }

        if (!gameRes.ok) {
          console.warn(
            "game API를 불러오는 데 실패했습니다. 점수가 0으로 표시될 수 있습니다.",
          );
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

        if (isMounted) {
          setGames(normalizedGames);
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

  // 탭에 따라 필터링 및 정합 정렬된 경기 리스트
  const filteredGames = useMemo(() => {
    if (activeTab === "FUTURE") {
      return games
        .filter((g) => g.matchDate >= today)
        .sort((a, b) => a.matchDate.getTime() - b.matchDate.getTime());
    } else {
      return games
        .filter((g) => g.matchDate < today)
        .sort((a, b) => b.matchDate.getTime() - a.matchDate.getTime());
    }
  }, [games, activeTab, today]);

  const nearestGame = useMemo(() => {
    return (
      games
        .filter((g) => g.matchDate >= today)
        .sort((a, b) => a.matchDate.getTime() - b.matchDate.getTime())[0] ||
      null
    );
  }, [games, today]);

  const visibleGames = useMemo(
    () => filteredGames.slice(0, visibleCount),
    [filteredGames, visibleCount],
  );
  const hasMoreGames = visibleCount < filteredGames.length;

  const handleLoadMore = () => {
    setVisibleCount((current) =>
      Math.min(current + LOAD_MORE_COUNT, filteredGames.length),
    );
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
    [activeTab],
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <CommonHeader title="leagueGameScheduleScreen" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <Text style={styles.heroEyebrow}>STADIUM</Text>
          <Text style={styles.heroTitle}>리그 구장</Text>

          <ImageBackground
            source={{ uri: STADIUM_IMAGE_URI }}
            style={styles.heroImageSlot}
            imageStyle={styles.heroImage}
          >
            <View style={styles.heroImageOverlay} />
            <View style={styles.heroBottomLabel}>
              <Text style={styles.heroBottomLabelText}>{STADIUM_NAME}</Text>
            </View>
          </ImageBackground>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionEyebrow}>NEXT MATCH</Text>
          <Text style={styles.sectionTitle}>이번 경기</Text>

          {loading ? (
            <ActivityIndicator
              size="large"
              color="#4a7c59"
              style={styles.loader}
            />
          ) : errorText ? (
            <Text style={styles.errorText}>{errorText}</Text>
          ) : nearestGame ? (
            <View style={styles.nearestCard}>
              <Text style={styles.nearestMatchText}>
                {nearestGame.home} <Text style={styles.vsText}>vs</Text>{" "}
                {nearestGame.away}
              </Text>
              <Text style={styles.nearestDateText}>
                {formatNearestDate(nearestGame.matchDate)}
              </Text>
            </View>
          ) : (
            <Text style={styles.emptyText}>{MESSAGE_NO_NEAREST}</Text>
          )}
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionEyebrow}>MATCH SCHEDULE</Text>
              <Text style={styles.sectionTitle}>
                {activeTab === "FUTURE" ? "남은 경기 일정" : "지난 경기 기록"}
              </Text>
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

          {/* 카테고리 전환 탭 */}
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
                        key={game.matchDate.getTime().toString()}
                        style={[
                          styles.scheduleItem,
                          activeTab === "FUTURE" &&
                            index === 0 &&
                            styles.scheduleItemHighlight,
                        ]}
                      >
                        {/* 번호 + 경기 정보 가로 배치 */}
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
                                    ? `${game.homeScore} 대 ${game.awayScore}`
                                    : "우천 취소"}
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
                    : "과거 경기 기록이 없습니다."}
                </Text>
              )}
            </Animated.View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default LeagueGameScheduleScreen;
