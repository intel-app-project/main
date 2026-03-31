import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ImageBackground,
  ScrollView,
  Text,
  View,
} from "react-native";
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

const STADIUM_NAME = "Suwon KT Wiz Park";
const STADIUM_IMAGE_URI =
  "https://i.namu.wiki/i/s5el6DSDQjJetZbb2WxKe-H8PtDQ6dfeZuMSKUtyro-XpSYN-lY2F-baCLWr_IqPi6nTTNQpa5zjc18gyN5xX01x2hKrAn65EKGflZmbyF1C5-hjFB2Te6mPOGzUeimD3AwO-qVSNz_C8nQSgaaozA.webp";

const PositionSlot = ({ pos, name, highlight }) => (
  <View style={[styles.slotStadium, highlight && styles.slotHighlightStadium]}>
    {name ? (
      <View style={styles.slotAvatarContainer}>
        <SvgUri
          uri={`https://api.dicebear.com/9.x/adventurer/svg?seed=${name}`}
          width="100%"
          height="100%"
        />
      </View>
    ) : null}
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
  </View>
);

const parseDate = (rawDate) => {
  if (!rawDate) {
    return null;
  }

  if (typeof rawDate === "string" && /^\d{8}$/.test(rawDate.trim())) {
    return new Date(
      Number(rawDate.slice(0, 4)),
      Number(rawDate.slice(4, 6)) - 1,
      Number(rawDate.slice(6, 8)),
    );
  }

  const parsed = new Date(rawDate);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const parseJson = (value) => {
  try {
    return typeof value === "string" ? JSON.parse(value || "{}") : value || {};
  } catch {
    return {};
  }
};

const formatMonthDay = (date) => {
  if (!date) {
    return "";
  }

  return `${String(date.getMonth() + 1).padStart(2, "0")}.${String(
    date.getDate(),
  ).padStart(2, "0")}`;
};

const MyGameScreen = ({ route }) => {
  const navigation = useNavigation();
  const { id, targetDate } = route.params;
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");
  const [matchData, setMatchData] = useState(null);
  const [nearestGame, setNearestGame] = useState(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);
        setErrorText("");

        if (id === undefined || id === null) {
          throw new Error("Missing member id.");
        }

        const [scheduleRes, teamRes, membersRes] = await Promise.all([
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

        const schedules = await scheduleRes.json();
        const teams = await teamRes.json();
        const members = await membersRes.json();

        const member = (members || []).find((item) => item?.Id === id);
        if (!member) {
          throw new Error("Member not found.");
        }

        const teamNameById = {};
        (teams || []).forEach((team) => {
          const teamId = team?.id ?? team?.Id;
          const teamName = team?.name ?? team?.Name;
          if (teamId !== undefined && teamId !== null && teamName) {
            teamNameById[String(teamId)] = teamName;
          }
        });

        const today = new Date();
        const startToday = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
        ).getTime();

        const selected = (schedules || []).find((row) => {
          if (row?.deleted_at) return false;
          if (targetDate && row?.date === targetDate) return true;

          const rowDate = parseDate(row?.date);
          return (
            rowDate &&
            rowDate.getTime() >= startToday &&
            (row?.home === member?.Team || row?.away === member?.Team)
          );
        });

        const upcoming = (schedules || [])
          .filter((row) => {
            if (row?.deleted_at) return false;
            const rowDate = parseDate(row?.date);
            return rowDate && rowDate.getTime() >= startToday;
          })
          .sort((a, b) =>
            String(a?.date || "").localeCompare(String(b?.date || "")),
          )[0];

        const matchDate = parseDate(selected?.date);
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
          .filter(
            (item) => item?.Team === member?.Team && currentMemberMap[item?.Id],
          )
          .map((item) => ({
            id: item.Id,
            name: item.Name,
            meta: `#${item.Num} ${item.Primary_Position}`,
          }));

        roster.sort((a, b) => a.name.localeCompare(b.name, "ko"));

        const getNameById = (memberId) => {
          if (!memberId) return null;
          const found = (members || []).find(
            (item) => String(item.Id) === String(memberId),
          );
          return found?.Name || null;
        };

        const defenseNames = {};
        Object.keys(lineup.defense || {}).forEach((pos) => {
          if (pos !== "BENCH") {
            defenseNames[pos] = getNameById(lineup.defense[pos]);
          }
        });

        const benchNames = (lineup.defense?.BENCH || [])
          .map((memberId) => getNameById(memberId))
          .filter(Boolean);

        if (mounted) {
          setNearestGame(
            upcoming
              ? {
                  home:
                    teamNameById[String(upcoming.home)] ||
                    `TEAM ${upcoming.home ?? ""}`,
                  away:
                    teamNameById[String(upcoming.away)] ||
                    `TEAM ${upcoming.away ?? ""}`,
                  dateText: formatMonthDay(parseDate(upcoming.date)),
                }
              : null,
          );

          setMatchData(
            selected
              ? {
                  dateText: matchDate
                    ? formatMonthDay(matchDate)
                    : String(selected?.date),
                  timeText: "12:00",
                  homeTeamName:
                    teamNameById[String(selected?.home)] ||
                    `TEAM ${selected?.home ?? ""}`,
                  awayTeamName:
                    teamNameById[String(selected?.away)] ||
                    `TEAM ${selected?.away ?? ""}`,
                  stadiumName: STADIUM_NAME,
                  isHome,
                  playerName: member.Name,
                  defense: defenseNames,
                  bench: benchNames,
                  roster,
                }
              : null,
          );
        }
      } catch (error) {
        console.error("[MyGameScreen] load failed", error);
        if (mounted) {
          setNearestGame(null);
          setMatchData(null);
          setErrorText(error.message || "Failed to load my game data.");
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
  }, [id, targetDate]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <CommonHeader title="myGame" />

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#4a7c59" />
          <Text style={styles.loadingText}>Loading match data.</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroCard}>
            <Text style={styles.heroEyebrow}>STADIUM</Text>
            <Text style={styles.heroTitle}>League Stadium</Text>

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

          <View style={styles.card}>
            <Text style={styles.cardEyebrow}>NEXT MATCH</Text>
            <Text style={styles.cardTitle}>League Next Match</Text>

            {nearestGame ? (
              <View style={styles.nearestCard}>
                <Text style={styles.nearestMatchText}>
                  {nearestGame.home} <Text style={styles.vsText}>vs</Text>{" "}
                  {nearestGame.away}
                </Text>
                <Text style={styles.nearestDateText}>
                  {nearestGame.dateText}
                </Text>
              </View>
            ) : (
              <Text style={styles.emptyText}>No upcoming match.</Text>
            )}
          </View>

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
                    <Text style={styles.metaLabel}>Date</Text>
                    <Text style={styles.metaValue}>{matchData.dateText}</Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Start Time</Text>
                    <Text style={styles.metaValue}>{matchData.timeText}</Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Type</Text>
                    <Text style={styles.metaValue}>
                      {matchData.isHome ? "Home" : "Away"}
                    </Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Stadium</Text>
                    <Text style={styles.metaValue}>
                      {matchData.stadiumName}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.fieldSection}>
                <View style={styles.fieldCard}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Lineup</Text>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>BEST 10</Text>
                    </View>
                  </View>

                  <View style={styles.fieldContainer}>
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

                  <View
                    style={[
                      styles.sectionBlock,
                      { width: "100%", marginTop: 20 },
                    ]}
                  >
                    <Text style={styles.sectionTitle}>Bench</Text>
                    {matchData.bench.length > 0 ? (
                      <Text style={styles.benchText}>
                        {matchData.bench.join(", ")}
                      </Text>
                    ) : (
                      <Text style={styles.emptyText}>No bench players.</Text>
                    )}
                  </View>
                </View>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardEyebrow}>Roster</Text>
                <Text style={styles.cardTitle}>Available Players</Text>
                {matchData.roster.length > 0 ? (
                  <View style={styles.rosterGrid}>
                    {matchData.roster.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        style={styles.playerCard}
                        onPress={() =>
                          navigation.navigate("PlayerDetail", {
                            id: item.id,
                            loginId: id,
                          })
                        }
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
                  <Text style={styles.emptyText}>No roster data.</Text>
                )}
              </View>
            </>
          ) : (
            <View style={styles.card}>
              <Text style={styles.emptyText}>No match selected.</Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default MyGameScreen;
