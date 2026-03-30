import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_BASE_URL } from "../constants/commonConstants";
import {
  MEMBER_API_ENDPOINT,
  SCHEDULE_API_ENDPOINT,
  TEAM_API_ENDPOINT,
} from "../constants/scheduleConstants";
import { styles } from "./myGameScreen.styles";
import CommonHeader from "../components/CommonHeader";
import CommonFooter from "../components/CommonFooter";

const PositionSlot = ({ pos, name, highlight }) => (
  <View style={[styles.slotStadium, highlight && styles.slotHighlightStadium]}>
    <Text style={styles.slotPosStadium}>{pos}</Text>
    <Text
      style={[
        styles.slotNameStadium,
        highlight && styles.slotNameHighlightStadium,
      ]}
      numberOfLines={1}
    >
      {name || "---"}
    </Text>
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

        const member = members.find((m) => m?.Id === id);

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
          if (targetDate && row.date === targetDate) return true;

          const rowDate = parseDate(row.date);
          return (
            rowDate &&
            rowDate.getTime() >= startToday &&
            (row.home === member.Team || row.away === member.Team)
          );
        });

        const homeTeamName = teams.find((t) => t.id === selected?.home)?.name;
        const awayTeamName = teams.find((t) => t.id === selected?.away)?.name;

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

        const isHome = selected?.home === member?.Team;
        const currentMemberMap = parseJson(
          isHome ? selected?.home_member : selected?.away_member,
        );

        const roster = (members || [])
          .filter((m) => m?.Team === member?.Team && currentMemberMap[m?.Id])
          .map((m) => ({
            id: m?.Id,
            name: m?.Name,
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
            isHome: selected?.home === member?.Team,
            playerName: member.Name,
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

              {/* 수비 라인업 영역 (teamInfo와 동일한 큰 틀 적용) */}
              <View style={styles.fieldSection}>
                <View style={styles.fieldCard}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>라인업</Text>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>BEST 10</Text>
                    </View>
                  </View>

                  <View style={styles.fieldContainer}>
                    {/* 야구장 배경 요소 유지 */}
                    <View style={styles.stadiumFan} />
                    <View style={styles.infieldDirtSemi} />
                    <View style={styles.diamondBaseLines} />
                    <View style={[styles.baseMarker, styles.base2B]} />
                    <View style={[styles.baseMarker, styles.base1B]} />
                    <View style={[styles.baseMarker, styles.base3B]} />
                    <View style={styles.baseHome} />
                    <View style={styles.pitcherMoundDirt}>
                      <View style={styles.moundPlate} />
                    </View>

                    {/* 포지션 배치 (teamInfo와 동일한 위치 적용) */}
                    <View style={styles.posP}>
                      <PositionSlot
                        pos="P"
                        name={matchData.defense?.P}
                        highlight={
                          matchData.defense?.P === matchData.playerName
                        }
                      />
                    </View>
                    <View style={styles.posC}>
                      <PositionSlot
                        pos="C"
                        name={matchData.defense?.C}
                        highlight={
                          matchData.defense?.C === matchData.playerName
                        }
                      />
                    </View>
                    <View style={styles.pos1B}>
                      <PositionSlot
                        pos="1B"
                        name={matchData.defense?.["1B"]}
                        highlight={
                          matchData.defense?.["1B"] === matchData.playerName
                        }
                      />
                    </View>
                    <View style={styles.pos2B}>
                      <PositionSlot
                        pos="2B"
                        name={matchData.defense?.["2B"]}
                        highlight={
                          matchData.defense?.["2B"] === matchData.playerName
                        }
                      />
                    </View>
                    <View style={styles.pos3B}>
                      <PositionSlot
                        pos="3B"
                        name={matchData.defense?.["3B"]}
                        highlight={
                          matchData.defense?.["3B"] === matchData.playerName
                        }
                      />
                    </View>
                    <View style={styles.posSS}>
                      <PositionSlot
                        pos="SS"
                        name={matchData.defense?.SS}
                        highlight={
                          matchData.defense?.SS === matchData.playerName
                        }
                      />
                    </View>
                    <View style={styles.posLF}>
                      <PositionSlot
                        pos="LF"
                        name={matchData.defense?.LF}
                        highlight={
                          matchData.defense?.LF === matchData.playerName
                        }
                      />
                    </View>
                    <View style={styles.posCF}>
                      <PositionSlot
                        pos="CF"
                        name={matchData.defense?.CF}
                        highlight={
                          matchData.defense?.CF === matchData.playerName
                        }
                      />
                    </View>
                    <View style={styles.posRF}>
                      <PositionSlot
                        pos="RF"
                        name={matchData.defense?.RF}
                        highlight={
                          matchData.defense?.RF === matchData.playerName
                        }
                      />
                    </View>
                    <View style={styles.posDH}>
                      <PositionSlot
                        pos="DH"
                        name={matchData.defense?.DH}
                        highlight={
                          matchData.defense?.DH === matchData.playerName
                        }
                      />
                    </View>
                  </View>

                  {/* 벤치 섹션 */}
                  <View
                    style={[
                      styles.sectionBlock,
                      { width: "100%", marginTop: 20 },
                    ]}
                  >
                    <Text style={styles.sectionTitle}>후보 선수</Text>
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
        </ScrollView>
      )}
      <CommonFooter activeTab="MyGame" />
    </SafeAreaView>
  );
};

export default MyGameScreen;
