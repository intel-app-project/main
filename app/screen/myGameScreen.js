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
import CommonHeader from "../components/CommonHeader";
import PlayerFooter from "../components/PlayerFooter";
import { styles } from "./myGameScreen.styles";

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

        const [memberRes, scheduleRes, teamRes, membersRes] = await Promise.all(
          [
            fetch(`${API_BASE_URL}${MEMBER_API_ENDPOINT}/${id}`),
            fetch(`${API_BASE_URL}${SCHEDULE_API_ENDPOINT}`),
            fetch(`${API_BASE_URL}${TEAM_API_ENDPOINT}`),
            fetch(`${API_BASE_URL}${MEMBER_API_ENDPOINT}`),
          ],
        );

        if (!scheduleRes.ok)
          throw new Error(`schedule API error: ${scheduleRes.status}`);
        if (!teamRes.ok) throw new Error(`team API error: ${teamRes.status}`);
        if (!membersRes.ok)
          throw new Error(`member API error: ${membersRes.status}`);

        let member = null;

        if (memberRes.ok) {
          const memberJson = await memberRes.json();
          member = memberJson?.member ? memberJson.member : memberJson;
        }

        const schedules = await scheduleRes.json();
        const teams = await teamRes.json();
        const members = await membersRes.json();

        if (!member && Array.isArray(members)) {
          for (let i = 0; i < members.length; i += 1) {
            if (
              String(members[i]?.Id ?? "").trim() === String(id ?? "").trim() ||
              String(members[i]?.User_ID ?? "").trim() ===
                String(id ?? "").trim()
            ) {
              member = members[i];
              break;
            }
          }
        }

        if (!member) throw new Error("사용자 정보를 찾을 수 없습니다.");

        let selected = null;
        const today = new Date();
        const startToday = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
        ).getTime();

        if (Array.isArray(schedules)) {
          for (let i = 0; i < schedules.length; i += 1) {
            const row = schedules[i];
            if (row?.deleted_at) continue;

            if (
              scheduleId !== null &&
              String(row?.id ?? "") === String(scheduleId)
            ) {
              selected = row;
              break;
            }

            if (targetDate && String(row?.date ?? "") === String(targetDate)) {
              selected = row;
              break;
            }

            let date = null;
            if (
              typeof row?.date === "string" &&
              /^\d{8}$/.test(row.date.trim())
            ) {
              date = new Date(
                Number(row.date.slice(0, 4)),
                Number(row.date.slice(4, 6)) - 1,
                Number(row.date.slice(6, 8)),
              );
            } else if (row?.date) {
              date = new Date(row.date);
            }

            if (!date || Number.isNaN(date.getTime())) continue;
            if (date.getTime() < startToday) continue;

            if (
              String(row?.home ?? "") === String(member?.Team ?? "") ||
              String(row?.away ?? "") === String(member?.Team ?? "")
            ) {
              selected = row;
              break;
            }

            let homeMember = row?.home_member;
            let awayMember = row?.away_member;

            if (typeof homeMember === "string") {
              try {
                homeMember = JSON.parse(homeMember);
              } catch {
                homeMember = {};
              }
            }
            if (typeof awayMember === "string") {
              try {
                awayMember = JSON.parse(awayMember);
              } catch {
                awayMember = {};
              }
            }

            if (
              (homeMember &&
                homeMember[String(member?.Id ?? "")] !== undefined) ||
              (awayMember && awayMember[String(member?.Id ?? "")] !== undefined)
            ) {
              selected = row;
              break;
            }
          }
        }

        if (!selected) throw new Error("표시할 내 경기가 없습니다.");

        let homeTeamName = "";
        let awayTeamName = "";

        if (Array.isArray(teams)) {
          for (let i = 0; i < teams.length; i += 1) {
            if (String(teams[i]?.id ?? "") === String(selected?.home ?? ""))
              homeTeamName = String(teams[i]?.name ?? "");
            if (String(teams[i]?.id ?? "") === String(selected?.away ?? ""))
              awayTeamName = String(teams[i]?.name ?? "");
          }
        }

        let date = null;
        if (
          typeof selected?.date === "string" &&
          /^\d{8}$/.test(selected.date.trim())
        ) {
          date = new Date(
            Number(selected.date.slice(0, 4)),
            Number(selected.date.slice(4, 6)) - 1,
            Number(selected.date.slice(6, 8)),
          );
        } else if (selected?.date) {
          date = new Date(selected.date);
        }

        let lineup = selected?.lineup;
        if (typeof lineup === "string") {
          try {
            lineup = JSON.parse(lineup);
          } catch {
            lineup = {};
          }
        }
        if (!lineup || typeof lineup !== "object") lineup = {};
        if (!lineup.defense) lineup = { defense: lineup, batting: [] };
        if (!lineup.defense || typeof lineup.defense !== "object")
          lineup.defense = {};

        let currentMemberMap =
          String(selected?.home ?? "") === String(member?.Team ?? "")
            ? selected?.home_member
            : selected?.away_member;
        if (typeof currentMemberMap === "string") {
          try {
            currentMemberMap = JSON.parse(currentMemberMap);
          } catch {
            currentMemberMap = {};
          }
        }

        const roster = [];
        if (
          currentMemberMap &&
          typeof currentMemberMap === "object" &&
          Array.isArray(members)
        ) {
          for (let i = 0; i < members.length; i += 1) {
            if (String(members[i]?.Team ?? "") !== String(member?.Team ?? ""))
              continue;
            if (currentMemberMap[String(members[i]?.Id ?? "")] === undefined)
              continue;
            roster.push({
              id: String(members[i]?.Id ?? i),
              name: String(members[i]?.Name ?? members[i]?.name ?? ""),
              meta: `${members[i]?.Num ? `#${members[i].Num} · ` : ""}${members[i]?.Primary_Position ?? "미정"}`,
            });
          }
        }

        roster.sort((a, b) => a.name.localeCompare(b.name, "ko"));

        if (mounted) {
          setMatchData({
            dateText: date
              ? `${date.getMonth() + 1}월 ${date.getDate()}일`
              : String(selected?.date ?? ""),
            timeText: date
              ? `${date.getHours() === 0 ? 12 : date.getHours() > 12 ? date.getHours() - 12 : date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`
              : "",
            homeTeamName: homeTeamName || `TEAM ${selected?.home ?? ""}`,
            awayTeamName: awayTeamName || `TEAM ${selected?.away ?? ""}`,
            stadiumName: "경기장 정보 없음",
            isHome: String(selected?.home ?? "") === String(member?.Team ?? ""),
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
                    <Text style={styles.metaValue}>수원 KT 위즈파크</Text>
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

      <PlayerFooter activeTab="MyGame" />
    </SafeAreaView>
  );
};

export default MyGameScreen;
