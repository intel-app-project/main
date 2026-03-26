import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ImageBackground,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_BASE_URL } from "../constants/commonConstants";
import {
  SCHEDULE_API_ENDPOINT,
  TEAM_API_ENDPOINT,
} from "../constants/scheduleConstants";
import { styles } from "./leagueGameScheduleScreen.styles";

const INITIAL_VISIBLE_COUNT = 8;
const LOAD_MORE_COUNT = 3;
const STADIUM_NAME = "수원 KT 위즈파크";
const STADIUM_IMAGE_URI =
  "https://i.namu.wiki/i/s5el6DSDQjJetZbb2WxKe-H8PtDQ6dfeZuMSKUtyro-XpSYN-lY2F-baCLWr_IqPi6nTTNQpa5zjc18gyN5xX01x2hKrAn65EKGflZmbyF1C5-hjFB2Te6mPOGzUeimD3AwO-qVSNz_C8nQSgaaozA.webp";
const MESSAGE_NEXT_MATCH = "최근 경기";
const MESSAGE_NO_NEAREST = "표시할 예정 경기가 없습니다.";
const MESSAGE_UPCOMING = "남은 경기 일정";
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

const normalizeSchedule = (row, teamNameMap) => {
  const matchDate = toDate(
    pick(row, ["date", "match_date", "game_date", "scheduled_at"]),
  );

  if (!matchDate) {
    return null;
  }

  const home = pick(row, ["home", "home_team"]);
  const away = pick(row, ["away", "away_team"]);

  return {
    id: String(pick(row, ["id", "Id"]) || `${home}-${away}-${matchDate}`),
    home: getTeamName(teamNameMap, home, "HOME"),
    away: getTeamName(teamNameMap, away, "AWAY"),
    matchDate,
  };
};

const LeagueGameScheduleScreen = () => {
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");
  const [games, setGames] = useState([]);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);

  useEffect(() => {
    let isMounted = true;

    const loadSchedules = async () => {
      try {
        if (isMounted) {
          setLoading(true);
          setErrorText("");
          setVisibleCount(INITIAL_VISIBLE_COUNT);
        }

        const [scheduleRes, teamRes] = await Promise.all([
          fetch(`${API_BASE_URL}${SCHEDULE_API_ENDPOINT}`),
          fetch(`${API_BASE_URL}${TEAM_API_ENDPOINT}`),
        ]);

        if (!scheduleRes.ok) {
          throw new Error(`schedule API 오류: ${scheduleRes.status}`);
        }

        if (!teamRes.ok) {
          throw new Error(`team API 오류: ${teamRes.status}`);
        }

        const [scheduleRows, teamRows] = await Promise.all([
          scheduleRes.json(),
          teamRes.json(),
        ]);

        const teamNameMap = buildTeamNameMap(teamRows);
        const today = startOfToday();
        const normalizedGames = (
          Array.isArray(scheduleRows) ? scheduleRows : []
        )
          .map((row) => normalizeSchedule(row, teamNameMap))
          .filter(Boolean)
          .filter((game) => game.matchDate >= today)
          .sort((a, b) => a.matchDate.getTime() - b.matchDate.getTime());

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

  const nearestGame = games[0] || null;
  const visibleGames = useMemo(
    () => games.slice(0, visibleCount),
    [games, visibleCount],
  );
  const hasMoreGames = visibleCount < games.length;

  const handleLoadMore = () => {
    setVisibleCount((current) =>
      Math.min(current + LOAD_MORE_COUNT, games.length),
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
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
          <Text style={styles.sectionEyebrow}>Recent Match</Text>
          <Text style={styles.sectionTitle}>{MESSAGE_NEXT_MATCH}</Text>

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
              <Text style={styles.sectionEyebrow}>Remaining Matches</Text>
              <Text style={styles.sectionTitle}>{MESSAGE_UPCOMING}</Text>
            </View>
            {!loading && games.length > 0 ? (
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>
                  {games.length}
                  {MESSAGE_GAME_UNIT}
                </Text>
              </View>
            ) : null}
          </View>

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
                    key={game.id}
                    style={[
                      styles.scheduleItem,
                      index === 0 && styles.scheduleItemHighlight,
                    ]}
                  >
                    <View style={styles.scheduleIndexBadge}>
                      <Text style={styles.scheduleIndexText}>
                        {String(index + 1).padStart(2, "0")}
                      </Text>
                    </View>

                    <View style={styles.scheduleMain}>
                      <Text style={styles.scheduleMatchText}>
                        {game.home} vs {game.away}
                      </Text>
                      <Text style={styles.scheduleDateText}>
                        {formatScheduleDate(game.matchDate)}
                      </Text>
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
            <Text style={styles.emptyText}>{MESSAGE_NO_UPCOMING}</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default LeagueGameScheduleScreen;
