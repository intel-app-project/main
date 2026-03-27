import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_BASE_URL } from "../constants/commonConstants";
import {
  MEMBER_API_ENDPOINT,
  SCHEDULE_API_ENDPOINT,
  TEAM_API_ENDPOINT,
} from "../constants/scheduleConstants";
import {
  buildNormalizedSchedules,
  buildTeamNameMap,
  parseJsonField,
  pick,
  resolveMember,
} from "../utils/scheduleUtils";
import CommonHeader from "../components/CommonHeader";
import PlayerFooter from "../components/PlayerFooter";
import { styles } from "./myGame.styles";

const EMPTY_LINEUP = {
  defense: {},
  batting: [],
};

const normalizeLineup = (value) => {
  const parsed = parseJsonField(value);

  if (!parsed || typeof parsed !== "object") {
    return EMPTY_LINEUP;
  }

  if (parsed.defense || parsed.batting) {
    return {
      defense:
        parsed.defense && typeof parsed.defense === "object"
          ? parsed.defense
          : {},
      batting: Array.isArray(parsed.batting) ? parsed.batting : [],
    };
  }

  return {
    defense: parsed,
    batting: [],
  };
};

const buildLineupPlayers = (lineup, members) => {
  const names = [];

  const pushName = (value) => {
    if (!value || typeof value !== "string") {
      return;
    }

    const trimmed = value.trim();
    if (!trimmed || names.includes(trimmed)) {
      return;
    }

    names.push(trimmed);
  };

  lineup.batting.forEach(pushName);

  Object.entries(lineup.defense).forEach(([position, value]) => {
    if (position === "BENCH") {
      return;
    }
    pushName(value);
  });

  if (Array.isArray(lineup.defense.BENCH)) {
    lineup.defense.BENCH.forEach(pushName);
  }

  return names.map((name, index) => {
    const member = (Array.isArray(members) ? members : []).find(
      (item) => String(item?.Name || item?.name || "").trim() === name,
    );

    const number = pick(member, ["Num", "num"]);
    const position =
      pick(member, ["Primary_Position", "primary_position"]) || "미정";

    return {
      id: `${name}-${index}`,
      name,
      meta: `${number ? `#${number} · ` : ""}${position}`,
    };
  });
};

const pickTargetSchedule = (scheduleRows, scheduleId, targetDate, fallbackGame) =>
  (Array.isArray(scheduleRows) ? scheduleRows : []).find((row) => {
    if (scheduleId != null && String(row?.id) === String(scheduleId)) {
      return true;
    }

    if (targetDate && String(row?.date) === String(targetDate)) {
      return true;
    }

    if (
      fallbackGame?.scheduleId != null &&
      String(row?.id) === String(fallbackGame.scheduleId)
    ) {
      return true;
    }

    return (
      fallbackGame?.scheduleDate &&
      String(row?.date) === String(fallbackGame.scheduleDate)
    );
  }) || null;

const PositionSlot = ({ pos, name, highlight }) => (
  <View style={[styles.slot, highlight && styles.slotHighlight]}>
    <Text style={styles.slotPos}>{pos}</Text>
    <Text style={styles.slotName}>{name || "---"}</Text>
  </View>
);

const MyGameScreen = ({ navigation, route }) => {
  const { id, scheduleId = null, targetDate = null } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");
  const [matchData, setMatchData] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadMatchData = async () => {
      try {
        setLoading(true);
        setErrorText("");

        const [memberRes, scheduleRes, teamRes, membersRes] = await Promise.all([
          fetch(`${API_BASE_URL}${MEMBER_API_ENDPOINT}/${id}`),
          fetch(`${API_BASE_URL}${SCHEDULE_API_ENDPOINT}`),
          fetch(`${API_BASE_URL}${TEAM_API_ENDPOINT}`),
          fetch(`${API_BASE_URL}${MEMBER_API_ENDPOINT}`),
        ]);

        if (!scheduleRes.ok) {
          throw new Error(`schedule API error: ${scheduleRes.status}`);
        }
        if (!teamRes.ok) {
          throw new Error(`team API error: ${teamRes.status}`);
        }
        if (!membersRes.ok) {
          throw new Error(`member API error: ${membersRes.status}`);
        }

        const [scheduleRows, teamRows, memberRows] = await Promise.all([
          scheduleRes.json(),
          teamRes.json(),
          membersRes.json(),
        ]);

        const member = await resolveMember(memberRes, id);
        if (!member) {
          throw new Error("사용자 정보를 찾을 수 없습니다.");
        }

        const teamNameMap = buildTeamNameMap(
          Array.isArray(teamRows) ? teamRows : [],
        );
        const normalizedGames = buildNormalizedSchedules(
          Array.isArray(scheduleRows) ? scheduleRows : [],
          member,
          teamNameMap,
        );
        const fallbackGame = normalizedGames[0] || null;

        if (!fallbackGame && !scheduleId && !targetDate) {
          throw new Error("표시할 내 경기가 없습니다.");
        }

        const targetSchedule = pickTargetSchedule(
          scheduleRows,
          scheduleId,
          targetDate,
          fallbackGame,
        );

        if (!targetSchedule) {
          throw new Error("경기 정보를 찾을 수 없습니다.");
        }

        const lineup = normalizeLineup(targetSchedule.lineup);
        const myGame =
          normalizedGames.find(
            (game) => String(game.scheduleId) === String(targetSchedule.id),
          ) ||
          normalizedGames.find(
            (game) => String(game.scheduleDate) === String(targetSchedule.date),
          ) ||
          fallbackGame;

        const homeTeamName =
          teamNameMap[String(targetSchedule.home)] ||
          `TEAM ${targetSchedule.home}`;
        const awayTeamName =
          teamNameMap[String(targetSchedule.away)] ||
          `TEAM ${targetSchedule.away}`;

        if (isMounted) {
          setMatchData({
            dateText: myGame?.dateText || String(targetSchedule.date || ""),
            timeText: myGame?.timeText || "",
            homeTeamName,
            awayTeamName,
            stadiumName: myGame?.stadiumName || "경기장 정보 없음",
            isHome:
              String(pick(member, ["Team", "team"])) ===
              String(targetSchedule.home),
            lineup,
            lineupPlayers: buildLineupPlayers(lineup, memberRows),
          });
        }
      } catch (error) {
        console.error("[MyGameScreen] load failed", error);
        if (isMounted) {
          setMatchData(null);
          setErrorText(
            error.message || "내 경기 정보를 불러오지 못했습니다.",
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadMatchData();

    return () => {
      isMounted = false;
    };
  }, [id, scheduleId, targetDate]);

  const benchPlayers = Array.isArray(matchData?.lineup?.defense?.BENCH)
    ? matchData.lineup.defense.BENCH
    : [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <CommonHeader title="myGame" />

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#4a7c59" />
          <Text style={styles.loadingText}>내 경기 정보를 불러오는 중입니다.</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}

          {matchData ? (
            <>
              <View style={styles.card}>
                <Text style={styles.cardEyebrow}>Next Match</Text>
                <Text style={styles.vsTitle}>
                  {matchData.homeTeamName} vs {matchData.awayTeamName}
                </Text>

                <View style={styles.matchMetaBlock}>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>경기 일정</Text>
                    <Text style={styles.metaValue}>{matchData.dateText}</Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>시작 시간</Text>
                    <Text style={styles.metaValue}>
                      {matchData.timeText || "시간 정보 없음"}
                    </Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>구분</Text>
                    <Text style={styles.metaValue}>
                      {matchData.isHome ? "홈 경기" : "원정 경기"}
                    </Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>경기장</Text>
                    <Text style={styles.metaValue}>{matchData.stadiumName}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardEyebrow}>Lineup</Text>
                <Text style={styles.cardTitle}>Defensive Alignment</Text>

                <View style={styles.fieldCard}>
                  <View style={styles.diamond}>
                    <PositionSlot pos="CF" name={matchData.lineup.defense.CF} />
                    <View style={styles.fieldRow}>
                      <PositionSlot pos="LF" name={matchData.lineup.defense.LF} />
                      <PositionSlot pos="RF" name={matchData.lineup.defense.RF} />
                    </View>
                    <View style={styles.fieldRow}>
                      <PositionSlot pos="SS" name={matchData.lineup.defense.SS} />
                      <PositionSlot
                        pos="2B"
                        name={matchData.lineup.defense["2B"]}
                      />
                    </View>
                    <View style={styles.fieldRow}>
                      <PositionSlot
                        pos="3B"
                        name={matchData.lineup.defense["3B"]}
                      />
                      <PositionSlot
                        pos="1B"
                        name={matchData.lineup.defense["1B"]}
                      />
                    </View>
                    <PositionSlot
                      pos="P"
                      name={matchData.lineup.defense.P}
                      highlight
                    />
                    <PositionSlot pos="C" name={matchData.lineup.defense.C} />
                    <View style={styles.dhWrap}>
                      <PositionSlot pos="DH" name={matchData.lineup.defense.DH} />
                    </View>
                  </View>
                </View>

                <View style={styles.sectionBlock}>
                  <Text style={styles.sectionTitle}>Bench</Text>
                  {benchPlayers.length ? (
                    <Text style={styles.benchText}>{benchPlayers.join(", ")}</Text>
                  ) : (
                    <Text style={styles.emptyText}>등록된 벤치 선수가 없습니다.</Text>
                  )}
                </View>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardEyebrow}>Players</Text>
                <Text style={styles.cardTitle}>라인업 선수명</Text>

                {matchData.lineupPlayers.length ? (
                  matchData.lineupPlayers.map((player) => (
                    <View key={player.id} style={styles.playerCard}>
                      <View>
                        <Text style={styles.playerName}>{player.name}</Text>
                        <Text style={styles.playerMeta}>{player.meta}</Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyText}>표시할 선수명이 없습니다.</Text>
                )}
              </View>
            </>
          ) : null}

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>뒤로가기</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
      <PlayerFooter activeTab="MyGame" />
    </SafeAreaView>
  );
};

export default MyGameScreen;
