import { ActivityIndicator, ScrollView, Text, View, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { SvgUri } from "react-native-svg";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_BASE_URL } from "../constants/commonConstants";
import {
  MEMBER_API_ENDPOINT,
  SCHEDULE_API_ENDPOINT,
  TEAM_API_ENDPOINT,
} from "../constants/scheduleConstants";
import { styles } from "./myGameScreen.styles";
import CommonHeader from "../components/CommonHeader";
import { useEffect, useState } from "react";

const PositionSlot = ({ pos, name, idValue, loginId, highlight }) => {
  const navigation = useNavigation();
  return (
    <TouchableOpacity 
      style={[styles.slotStadium, highlight && styles.slotHighlightStadium]}
      onPress={() => {
        if (idValue) {
          navigation.navigate("PlayerDetail", {
            id: idValue,
            loginId: loginId
          });
        }
      }}
      disabled={!idValue}
    >
      {name && (
        <View style={styles.slotAvatarContainer}>
          <SvgUri
            uri={`https://api.dicebear.com/9.x/adventurer/svg?seed=${name}`}
            width="100%"
            height="100%"
          />
        </View>
      )}
      <View style={styles.slotBottomRow}>
        <Text
          style={[
            styles.slotNameStadium,
            highlight && styles.slotNameHighlightStadium,
          ]}
          numberOfLines={1}
        >
          {name || "---"}
        </Text>
        <Text style={styles.slotPosStadium}>{pos}</Text>
      </View>
    </TouchableOpacity>
  );
};

const MyGameScreen = ({ route }) => {
  const navigation = useNavigation();
  const { id, targetDate } = route.params;
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

        const isHome = selected?.home === member?.Team;
        const rawLineupData = isHome 
          ? selected?.home_lineup 
          : selected?.away_lineup;

        let lineup = parseJson(rawLineupData);
        if (lineup && !lineup.defense && !lineup.batting) {
          lineup = { defense: lineup, batting: Array(9).fill(null) };
        }
        if (!lineup || !lineup.defense) {
          lineup = { defense: {}, batting: Array(9).fill(null) };
        }

        const currentMemberMap = parseJson(
          isHome ? selected?.home_member : selected?.away_member,
        );

        const roster = (members || [])
          .filter((m) => m.Team === member.Team && currentMemberMap[m.Id])
          .map((m) => ({
            id: m.Id,
            name: m.Name,
            meta: `#${m.Num} · ${m.Primary_Position}`,
          }));

        roster.sort((a, b) => a.name.localeCompare(b.name, "ko"));

        const getNameById = (mId) => {
          if (!mId) return null;
          const mem = (members || []).find(m => String(m.Id) === String(mId));
          return mem?.Name || null;
        };

        const defensePlayers = {};
        if (lineup.defense) {
          Object.keys(lineup.defense).forEach((pos) => {
            if (pos !== "BENCH") {
              const mId = lineup.defense[pos];
              defensePlayers[pos] = {
                name: getNameById(mId),
                id: mId
              };
            }
          });
        }

        const benchNames = (lineup.defense?.BENCH || [])
          .map((id) => getNameById(id))
          .filter((n) => n);

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
            defense: defensePlayers,
            bench: benchNames,
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
  }, [id, targetDate]);

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
                        name={matchData.defense?.P?.name}
                        idValue={matchData.defense?.P?.id}
                        loginId={id}
                        highlight={matchData.defense?.P?.id === id}
                      />
                    </View>
                    <View style={styles.posC}>
                      <PositionSlot
                        pos="C"
                        name={matchData.defense?.C?.name}
                        idValue={matchData.defense?.C?.id}
                        loginId={id}
                        highlight={matchData.defense?.C?.id === id}
                      />
                    </View>
                    <View style={styles.pos1B}>
                      <PositionSlot
                        pos="1B"
                        name={matchData.defense?.["1B"]?.name}
                        idValue={matchData.defense?.["1B"]?.id}
                        loginId={id}
                        highlight={matchData.defense?.["1B"]?.id === id}
                      />
                    </View>
                    <View style={styles.pos2B}>
                      <PositionSlot
                        pos="2B"
                        name={matchData.defense?.["2B"]?.name}
                        idValue={matchData.defense?.["2B"]?.id}
                        loginId={id}
                        highlight={matchData.defense?.["2B"]?.id === id}
                      />
                    </View>
                    <View style={styles.pos3B}>
                      <PositionSlot
                        pos="3B"
                        name={matchData.defense?.["3B"]?.name}
                        idValue={matchData.defense?.["3B"]?.id}
                        loginId={id}
                        highlight={matchData.defense?.["3B"]?.id === id}
                      />
                    </View>
                    <View style={styles.posSS}>
                      <PositionSlot
                        pos="SS"
                        name={matchData.defense?.SS?.name}
                        idValue={matchData.defense?.SS?.id}
                        loginId={id}
                        highlight={matchData.defense?.SS?.id === id}
                      />
                    </View>
                    <View style={styles.posLF}>
                      <PositionSlot
                        pos="LF"
                        name={matchData.defense?.LF?.name}
                        idValue={matchData.defense?.LF?.id}
                        loginId={id}
                        highlight={matchData.defense?.LF?.id === id}
                      />
                    </View>
                    <View style={styles.posCF}>
                      <PositionSlot
                        pos="CF"
                        name={matchData.defense?.CF?.name}
                        idValue={matchData.defense?.CF?.id}
                        loginId={id}
                        highlight={matchData.defense?.CF?.id === id}
                      />
                    </View>
                    <View style={styles.posRF}>
                      <PositionSlot
                        pos="RF"
                        name={matchData.defense?.RF?.name}
                        idValue={matchData.defense?.RF?.id}
                        loginId={id}
                        highlight={matchData.defense?.RF?.id === id}
                      />
                    </View>
                    <View style={styles.posDH}>
                      <PositionSlot
                        pos="DH"
                        name={matchData.defense?.DH?.name}
                        idValue={matchData.defense?.DH?.id}
                        loginId={id}
                        highlight={matchData.defense?.DH?.id === id}
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
                  <View style={styles.rosterGrid}>
                    {matchData.roster.map((item) => (
                      <TouchableOpacity 
                        key={item.id} 
                        style={styles.playerCard}
                        onPress={() => navigation.navigate("PlayerDetail", { id: item.id, loginId: id })}
                      >
                        <View style={styles.playerAvatarContainer}>
                          <SvgUri
                            uri={`https://api.dicebear.com/9.x/adventurer/svg?seed=${item.name}`}
                            width="100%"
                            height="100%"
                          />
                        </View>
                        <Text style={styles.playerName} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Text style={styles.playerMeta} numberOfLines={1}>
                          {item.meta}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
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
    </SafeAreaView>
  );
};

export default MyGameScreen;
