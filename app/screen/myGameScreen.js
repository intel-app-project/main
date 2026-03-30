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
import { styles } from "./myGameScreen.styles";
import CommonHeader from "../components/CommonHeader";

const PositionSlot = ({ pos, name, highlight }) => (
  <View style={[styles.slot, highlight ? styles.slotHighlight : null]}>
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
    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);
        setErrorText("");

        const [scheduleRes, teamRes, membersRes] = await Promise.all([
          fetch(`${API_BASE_URL}${SCHEDULE_API_ENDPOINT}`),
          fetch(`${API_BASE_URL}${TEAM_API_ENDPOINT}`),
          fetch(`${API_BASE_URL}${MEMBER_API_ENDPOINT}`),
        ]);

        if (!scheduleRes.ok)
          throw new Error(`schedule API error: ${scheduleRes.status}`);
        if (!teamRes.ok) throw new Error(`team API error: ${teamRes.status}`);
        if (!membersRes.ok)
          throw new Error(`member API error: ${membersRes.status}`);

        const schedules = await scheduleRes.json();
        const teams = await teamRes.json();
        const members = await membersRes.json();

        const member = members.find(
          (me) => String(me?.Id).trim() === String(id).trim(),
        );

        const today = new Date();
        const startToday = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
        ).getTime();

        const parseDate = (d) =>
          d ? new Date(d.slice(0, 4), d.slice(4, 6) - 1, d.slice(6, 8)) : null;

        const selected = schedules.find((row) => {
          if (row?.deleted_at) return false;
          if (targetDate && String(row.date) === String(targetDate))
            return true;

          const rowDate = parseDate(row.date);
          return (
            rowDate &&
            rowDate.getTime() >= startToday &&
            (row.home === member.Team || row.away === member.Team)
          );
        });

        const homeTeamName = teams.find(
          (t) => String(t.id) === String(selected?.home),
        )?.name;
        const awayTeamName = teams.find(
          (t) => String(t.id) === String(selected?.away),
        )?.name;

        const matchDate = parseDate(selected?.date);

        const parseJson = (j) => {
          try {
            return typeof j === "string" ? JSON.parse(j || "{}") : j || {};
          } catch {
            return {};
          }
        };

        let lineup = parseJson(selected?.lineup);
        if (!lineup.defense) lineup = { defense: lineup, batting: [] };

        const isHome = String(selected?.home) === String(member?.Team);
        const currentMemberMap = parseJson(
          isHome ? selected?.home_member : selected?.away_member,
        );

        const roster = (members || [])
          .filter(
            (m) =>
              String(m?.Team) === String(member?.Team) &&
              currentMemberMap[String(m?.Id)],
          )
          .map((m, i) => ({
            id: String(m?.Id),
            name: String(m?.Name),
            meta: `#${m.Num} · ${m?.Primary_Position ?? "미정"}`,
          }));

        roster.sort((a, b) => a.name.localeCompare(b.name, "ko"));

        if (mounted) {
          setMatchData({
            dateText: matchDate
              ? `${matchDate.getMonth() + 1}월 ${matchDate.getDate()}일`
              : String(selected?.date),
            timeText: "12:00",
            homeTeamName: homeTeamName,
            awayTeamName: awayTeamName,
            stadiumName: "수원 KT 위즈파크",
            isHome: String(selected?.home) === String(member?.Team),
            defense: lineup.defense,
            bench: Array.isArray(lineup.defense?.BENCH)
              ? lineup.defense.BENCH
              : [],
            roster,
          });
        }
      } catch (error) {
        console.error("[MyGameScreen] load failed", error);
        if (mounted) {
          setMatchData(null);
          setErrorText(error.message || "내 경기 정보를 불러오지 못했습니다.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [id, scheduleId, targetDate]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <CommonHeader title="myGame" />

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#4a7c59" />
          <Text style={styles.loadingText}>
            내 경기 정보를 불러오는 중입니다.
          </Text>
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
                <Text style={styles.cardEyebrow}>My Game</Text>
                <Text
                  style={styles.vsTitle}
                >{`${matchData.homeTeamName} vs ${matchData.awayTeamName}`}</Text>

                <View style={styles.matchMetaBlock}>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>경기 일정</Text>
                    <Text style={styles.metaValue}>{matchData.dateText}</Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>시작 시간</Text>
                    <Text style={styles.metaValue}>{matchData.timeText}</Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>구분</Text>
                    <Text style={styles.metaValue}>
                      {matchData.isHome ? "홈 경기" : "원정 경기"}
                    </Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>경기장</Text>
                    <Text style={styles.metaValue}>
                      {matchData.stadiumName}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardEyebrow}>Lineup</Text>
                <Text style={styles.cardTitle}>Defensive Alignment</Text>
                <View style={styles.fieldCard}>
                  <View style={styles.diamond}>
                    <PositionSlot pos="CF" name={matchData.defense?.CF} />
                    <View style={styles.fieldRow}>
                      <PositionSlot pos="LF" name={matchData.defense?.LF} />
                      <PositionSlot pos="RF" name={matchData.defense?.RF} />
                    </View>
                    <View style={styles.fieldRow}>
                      <PositionSlot pos="SS" name={matchData.defense?.SS} />
                      <PositionSlot pos="2B" name={matchData.defense?.["2B"]} />
                    </View>
                    <View style={styles.fieldRow}>
                      <PositionSlot pos="3B" name={matchData.defense?.["3B"]} />
                      <PositionSlot pos="1B" name={matchData.defense?.["1B"]} />
                    </View>
                    <PositionSlot
                      pos="P"
                      name={matchData.defense?.P}
                      highlight
                    />
                    <PositionSlot pos="C" name={matchData.defense?.C} />
                    <View style={styles.dhWrap}>
                      <PositionSlot pos="DH" name={matchData.defense?.DH} />
                    </View>
                  </View>
                </View>

                <View style={styles.sectionBlock}>
                  <Text style={styles.sectionTitle}>Bench</Text>
                  {matchData.bench.length > 0 ? (
                    <Text style={styles.benchText}>
                      {matchData.bench.join(", ")}
                    </Text>
                  ) : (
                    <Text style={styles.emptyText}>
                      등록된 벤치 선수가 없습니다.
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardEyebrow}>Roster</Text>
                <Text style={styles.cardTitle}>참석 선수 명단</Text>
                {matchData.roster.length > 0 ? (
                  matchData.roster.map((item) => (
                    <View key={item.id} style={styles.playerCard}>
                      <Text style={styles.playerName}>{item.name}</Text>
                      <Text style={styles.playerMeta}>{item.meta}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyText}>
                    불러올 선수 명단이 없습니다.
                  </Text>
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

    </SafeAreaView>
  );
};

export default MyGameScreen;
