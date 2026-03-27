/* ==========================================
 * 1. 임포트 및 설정
 * ========================================== */
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Polygon, Text as SvgText } from "react-native-svg";
import { styles } from "./playerDetailScreen.styles";
import { supabase } from "../lib/supabase";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import PlayerFooter from "../components/PlayerFooter";
import CommonHeader from "../components/CommonHeader";

/* ==========================================
 * 2. 상수 및 초기 상태 정의
 * ========================================== */
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH - 24; // Based on 12px horizontal padding
const INITIAL_HITTER_STATS = {
  contact: 0, power: 0, speed: 0, eye: 0, clutch: 0,
  avg: ".000", hr: 0, rbi: 0, ops: ".000", obp: ".000", slg: ".000",
  hits: 0, ab: 0, bb: 0, k: 0
};
const INITIAL_PITCHER_STATS = {
  dominance: 0, control: 0, stamina: 0, stability: 0, resilience: 0,
  era: "0.00", whip: "0.00", k9: "0.0", avgSpeed: 0,
  ip: "0.0", kSum: 0, bbSum: 0, hitsAllowed: 0
};

const INITIAL_HITTER_ACC = { 
  hits: 0, ab: 0, hr: 0, dbl: 0, tpl: 0, bb: 0, hbp: 0, k: 0, rbi: 0, 
  rispAB: 0, rispHits: 0 
};
const INITIAL_PITCHER_ACC = { 
  r: 0, outs: 0, h: 0, bb: 0, k: 0, rispAB: 0, rispHits: 0 
};

/* ==========================================
 * 3. 유틸리티 함수 (스탯 계산 로직)
 * ========================================== */
const STAT_UTILS = {
  clamp: (val, min = 0, max = 100) => Math.max(min, Math.min(max, Math.round(val))),
  
  // Hitter Radar
  calcHitterContact: (avg) => STAT_UTILS.clamp(avg * 250),
  calcHitterPower: (slg) => STAT_UTILS.clamp(slg * 150),
  calcHitterEye: (bb, games) => STAT_UTILS.clamp((bb / (games || 1)) * 400),
  calcHitterClutch: (clutch) => STAT_UTILS.clamp(clutch * 200),
  
  // Pitcher Radar
  calcPitcherDominance: (k9) => STAT_UTILS.clamp(k9 * 10),
  calcPitcherControl: (bb, games) => (games > 0 ? STAT_UTILS.clamp(100 - (bb / games) * 200) : 0),
  calcPitcherStamina: (ipDec) => STAT_UTILS.clamp(ipDec * 15),
  calcPitcherStability: (era, games) => (games > 0 ? STAT_UTILS.clamp(100 - era * 8) : 0),
  calcPitcherResilience: (res) => STAT_UTILS.clamp(res * 100),
  
  // Formatters
  toAvg: (val) => val.toFixed(3),
  toEra: (val) => val.toFixed(2),
  toK9: (val) => val.toFixed(1),
};

/* ==========================================
 * 4. 메인 컴포넌트: PlayerDetailScreen
 * ========================================== */
const PlayerDetailScreen = ({navigation, route}) => {
  const { id } = route.params;

  // --- 4.1. 상태 관리 ---
  const [loading, setLoading] = useState(true);
  const [member, setMember] = useState(null);
  const [team, setTeam] = useState(null);
  const [recentGames, setRecentGames] = useState([]);
  const [hitterStats, setHitterStats] = useState(INITIAL_HITTER_STATS);
  const [pitcherStats, setPitcherStats] = useState(INITIAL_PITCHER_STATS);

  // --- 4.2. 라이프사이클 및 데이터 페칭 ---
  useEffect(() => {
    fetchPlayerData();
  }, [id]);

  const fetchPlayerData = async () => {
    try {
      setLoading(true);
      setHitterStats(INITIAL_HITTER_STATS);
      setPitcherStats(INITIAL_PITCHER_STATS);

      const { data: memberData } = await supabase
        .from("member")
        .select("*")
        .eq("Id", id)
        .single();

      setMember(memberData);

      const { data: teamData } = await supabase
        .from("team")
        .select("*")
        .eq("id", memberData.Team)
        .single();
      setTeam(teamData);

      const { data: allGames } = await supabase
        .from("game")
        .select("*")
        .or(`batter_id.eq.${memberData.Id},pitcher_id.eq.${memberData.Id}`)
        .order('date', { ascending: false });

      if (allGames && allGames.length > 0) {
        setRecentGames(allGames.slice(0, 5));
        
        const battingGames = allGames.filter(game => Number(game.batter_id) === Number(memberData.Id));
        const pitchingGames = allGames.filter(game => Number(game.pitcher_id) === Number(memberData.Id));

        calculateHitterStats(battingGames, memberData);
        calculatePitcherStats(pitchingGames, memberData);
      }
    } catch (error) {
      console.error("Error fetching player data:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- 4.3. 통계 분석 로직 ---
  const calculateHitterStats = (games, currentMemberData) => {
    !games && setHitterStats(INITIAL_HITTER_STATS);
    
    const acc = { ...INITIAL_HITTER_ACC };

    games.forEach((game) => {
      const res = game.result;
      const isHit = ["안타", "2루타", "3루타", "홈런", "적시타"].some(s => res.includes(s));
      const ignoreAB = ["볼넷", "사구", "희생번트", "희생플라이"].some(s => res.includes(s));
      const isRISP = game.bases_before >= 10;

      if (isHit) {
        acc.hits++;
        if (res.includes("홈런")) acc.hr++;
        if (res.includes("2루타")) acc.dbl++;
        if (res.includes("3루타")) acc.tpl++;
        if (isRISP) acc.rispHits++;
      }
      
      if (!ignoreAB) {
        acc.ab++;
        if (res.includes("삼진")) acc.k++;
        if (isRISP) acc.rispAB++;
      }

      if (res.includes("볼넷")) acc.bb++;
      if (res.includes("사구")) acc.hbp++;
      acc.rbi += (game.runs_scored_on_play || 0);
    });

    const avg = acc.ab > 0 ? acc.hits / acc.ab : 0;
    const obp = (acc.ab + acc.bb + acc.hbp) > 0 ? (acc.hits + acc.bb + acc.hbp) / (acc.ab + acc.bb + acc.hbp) : 0;
    const slg = acc.ab > 0 ? (acc.hits - acc.dbl - acc.tpl - acc.hr + acc.dbl*2 + acc.tpl*3 + acc.hr*4) / acc.ab : 0;
    const clutch = acc.rispAB > 0 ? acc.rispHits / acc.rispAB : 0;

    setHitterStats({
      contact: STAT_UTILS.calcHitterContact(avg),
      power: STAT_UTILS.calcHitterPower(slg),
      speed: 0, 
      eye: STAT_UTILS.calcHitterEye(acc.bb, games.length),
      clutch: STAT_UTILS.calcHitterClutch(clutch),
      avg: STAT_UTILS.toAvg(avg),
      obp: STAT_UTILS.toAvg(obp),
      slg: STAT_UTILS.toAvg(slg),
      ops: STAT_UTILS.toAvg(obp + slg),
      hr: acc.hr, rbi: acc.rbi, hits: acc.hits, ab: acc.ab, bb: acc.bb, k: acc.k
    });
  };

  const calculatePitcherStats = (games, currentMemberData) => {
    if (!games || games.length === 0) {
      setPitcherStats(INITIAL_PITCHER_STATS);
      return;
    }
    const acc = { ...INITIAL_PITCHER_ACC };

    games.forEach(g => {
      acc.r += (g.runs_scored_on_play || 0);
      acc.outs += (g.outs_after - g.outs_before);
      const res = g.result;
      if (["안타", "2루타", "3루타", "홈런"].some(s => res.includes(s))) {
        acc.h++;
        if (g.bases_before >= 10) acc.rispHits++;
      }
      if (res.includes("볼넷") || res.includes("사구")) acc.bb++;
      if (res.includes("삼진")) acc.k++;
      if (g.bases_before >= 10) acc.rispAB++;
    });

    const ipFull = Math.floor(acc.outs / 3);
    const ipPart = acc.outs % 3;
    const ipStr = `${ipFull}.${ipPart}`;
    const ipDec = acc.outs / 3 || 0.1;
    
    const era = (acc.r * 9) / ipDec;
    const whip = (acc.h + acc.bb) / ipDec;
    const k9 = (acc.k * 9) / ipDec;
    const resilienceBase = acc.rispAB > 0 ? 1 - (acc.rispHits / acc.rispAB) : (games.length > 0 ? 1 : 0);

    setPitcherStats({
      dominance: STAT_UTILS.calcPitcherDominance(k9),
      control: STAT_UTILS.calcPitcherControl(acc.bb, games.length),
      stamina: STAT_UTILS.calcPitcherStamina(ipDec),
      stability: STAT_UTILS.calcPitcherStability(era, games.length),
      resilience: STAT_UTILS.calcPitcherResilience(resilienceBase),
      era: games.length > 0 ? STAT_UTILS.toEra(era) : "0.00",
      whip: games.length > 0 ? STAT_UTILS.toEra(whip) : "0.00",
      k9: games.length > 0 ? STAT_UTILS.toK9(k9) : "0.0",
      ip: ipStr,
      kSum: acc.k,
      bbSum: acc.bb,
      hitsAllowed: acc.h,
      avgSpeed: 0
    });

    const activeMember = currentMemberData || member;
    if (activeMember) {
      console.log(`[DEBUG] Stats for ID ${activeMember.Id}:`, {
        bb: acc.bb,
        games: games.length,
        control: games.length > 0 ? Math.max(0, Math.min(100, Math.round(100 - (acc.bb / games.length) * 200))) : 0
      });
    }
  };

  // --- 4.4. 내부 UI 컴포넌트 ---
  const RadarChart = ({ data, activeRole }) => {
    const size = CARD_WIDTH - 24; 
    const center = size / 2;
    const radius = size * 0.32; 
    
    const config = activeRole === "HITTER" 
      ? [
          { label: "정확성", key: "contact" },
          { label: "장타력", key: "power" },
          { label: "기동력", key: "speed" },
          { label: "선구안", key: "eye" },
          { label: "클러치", key: "clutch" }
        ]
      : [
          { label: "구위", key: "dominance" },
          { label: "제구", key: "control" },
          { label: "스테미나", key: "stamina" },
          { label: "안정성", key: "stability" },
          { label: "위기관리", key: "resilience" }
        ];

    const getCoordinates = (value, index) => {
      const angle = (Math.PI * 2 * index) / 5 - Math.PI / 2;
      const r = (radius * Math.max(8, value)) / 100;
      return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) };
    };

    return (
      <View style={styles.radarCard}>
        <Svg width={size} height={size}>
          {[0.2, 0.4, 0.6, 0.8, 1].map((step) => (
            <Polygon
              key={step}
              points={config.map((_, i) => {
                const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
                const r = radius * step;
                return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
              }).join("\n")}
              fill="none"
              stroke="rgba(74, 124, 89, 0.1)"
              strokeWidth="1"
            />
          ))}
          <Polygon
            points={config.map((p, i) => {
              const coords = getCoordinates(data[p.key], i);
              return `${coords.x},${coords.y}`;
            }).join(" ")}
            fill="rgba(74, 124, 89, 0.12)"
            stroke="#4a7c59"
            strokeWidth="2.5"
          />
          {config.map((p, i) => {
            const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
            const r = radius + 10; 
            const lx = center + r * Math.cos(angle);
            const ly = center + r * Math.sin(angle) + 5;

            let anchor = "middle";
            if (Math.cos(angle) > 0.1) anchor = "start";
            else if (Math.cos(angle) < -0.1) anchor = "end";

            return (
              <React.Fragment key={p.label}>
                <SvgText
                  x={lx}
                  y={ly}
                  fill="#705c30"
                  fontSize="11"
                  fontWeight="800"
                  textAnchor={anchor}
                >
                  {p.label}
                </SvgText>
                <SvgText
                  x={lx}
                  y={ly + 13}
                  fill="#4a7c59"
                  fontSize="10"
                  fontWeight="700"
                  textAnchor={anchor}
                >
                  {Math.max(0, Math.round(data[p.key]))}
                </SvgText>
              </React.Fragment>
            );
          })}
        </Svg>
      </View>
    );
  };

  const SummaryItem = ({ label, value }) => (
    <View style={{ flex: 1, minWidth: "30%", marginBottom: 8 }}>
      <Text style={[styles.statLabel, { fontSize: 11, color: "#705c30", marginBottom: 2, textAlign: "center" }]}>{label}</Text>
      <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "center" }}>
        <Text style={[styles.statValue, { fontSize: 20, fontWeight: "800", color: "#4a7c59" }]}>{value}</Text>
        <Text style={{ fontSize: 10, color: "#4a7c59", marginLeft: 2 }}>{label === "이닝" ? "" : label === "자책점" ? "점" : "개"}</Text>
      </View>
    </View>
  );

  // --- 4.5. 메인 렌더링 ---
  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center" }]}>
        <ActivityIndicator size="large" color="#4a7c59" />
      </View>
    );
  }

  if (!member) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <MaterialCommunityIcons name="alert-circle-outline" size={64} color="#705c30" />
        <Text style={{ marginTop: 16, fontSize: 16, color: "#705c30", fontWeight: "600" }}>유저 정보를 불러올 수 없습니다.</Text>
        <TouchableOpacity 
          style={[styles.actionButton, { marginTop: 24 }]} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.actionButtonText}>뒤로 가기</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <CommonHeader title="playerDetailScreen" />
      
      <ScrollView contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <Text style={styles.largeTeamName}>TEAM : {team?.name}</Text>
          <View style={styles.heroMainRow}>
            <View style={{ flex: 1 }}>
              {member.Num ? <Text style={styles.heroNumber}>#{member.Num}</Text> : <Text style={styles.heroNumber}>감독</Text>}
              <Text style={styles.heroName} numberOfLines={1} adjustsFontSizeToFit>{member.Name}</Text>
            </View>
            <View 
              style={[
                styles.orderBadgeContainer, 
                !member.Batting_Order_Default && styles.orderBadgeContainerHidden
              ]}
            >
              <Text style={styles.orderBadgeText}>타석 {member.Batting_Order_Default || "-"}</Text>
            </View>
          </View>
          {member.Positions && (
            <View style={styles.badgeContainer}>
              <View style={styles.infoBadge}>
                <Text style={styles.infoBadgeText}>
                  {member.Is_Pitcher === 1 ? "투타 겸업" : "타자"}
                </Text>
              </View>
              <View style={styles.positionBadge}>
                <Text style={styles.positionBadgeText}>주 포지션: {member.Primary_Position}</Text>
              </View>
            </View>
          )}
        </View>

        {(member.Primary_Position === "감독" || member.Primary_Position === "기록원") ? (
          <View style={[styles.card, { padding: 40, alignItems: "center" }]}>
            <MaterialCommunityIcons name="shield-account" size={64} color="#4a7c59" />
            <Text style={{ marginTop: 16, fontSize: 18, fontWeight: "700", color: "#2e3230" }}>{member.Primary_Position} 프로필</Text>
            <Text style={{ marginTop: 8, fontSize: 14, color: "#705c30", textAlign: "center" }}>팀의 운영과 기록을 담당하는 공식 스태프입니다. 선수 데이터 집계 대상에서 제외됩니다.</Text>
          </View>
        ) : (
          <>
            {/* 타자 성적 섹션 */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>타자 성적 분석</Text>
              <Text style={styles.sectionSubtitle}>타격 퍼포먼스</Text>
            </View>

            <RadarChart data={hitterStats} activeRole="HITTER" />

            <View style={styles.statGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>타율 (AVG)</Text>
                <View>
                  <Text style={styles.statValueLarge}>{hitterStats.avg}</Text>
                  <View style={styles.statIndicator} />
                </View>
              </View>
              <View style={styles.secondaryStatCard}>
                <Text style={styles.statLabel}>OPS / 홈런</Text>
                <View style={styles.statValueContainer}>
                  <Text style={styles.statValue}>{hitterStats.ops}</Text>
                  <Text style={[styles.statValue, { marginLeft: 10 }]}>{hitterStats.hr}</Text>
                  <Text style={styles.statUnit}>HR</Text>
                </View>
              </View>
            </View>

            <View style={styles.detailStatGrid}>
              <Text style={[styles.statLabel, { marginBottom: 12 }]}>상세 지표</Text>
              <DetailRow label="출루율 (OBP)" value={hitterStats.obp} />
              <DetailRow label="장타율 (SLG)" value={hitterStats.slg} />
              <DetailRow label="안타 / 타수" value={`${hitterStats.hits} / ${hitterStats.ab}`} />
              <DetailRow label="볼넷 / 삼진" value={`${hitterStats.bb} / ${hitterStats.k}`} />
              <DetailRow label="타점 (RBI)" value={hitterStats.rbi} />
            </View>

            {/* 투수 성적 섹션 (겸업인 경우) */}
            {member.Is_Pitcher === 1 && (
              <>
                <View style={[styles.sectionHeader, { marginTop: 32 }]}>
                  <Text style={styles.sectionTitle}>투수 성적 분석</Text>
                  <Text style={styles.sectionSubtitle}>투구 효율성</Text>
                </View>

                <RadarChart data={pitcherStats} activeRole="PITCHER" />

                <View style={styles.statGrid}>
                  <View style={styles.statCard}>
                    <Text style={styles.statLabel}>방어율 (ERA)</Text>
                    <View>
                      <Text style={styles.statValueLarge}>{pitcherStats.era}</Text>
                      <View style={styles.statIndicator} />
                    </View>
                  </View>
                  <View style={styles.secondaryStatCard}>
                    <Text style={styles.statLabel}>WHIP / 탈삼진</Text>
                    <View style={styles.statValueContainer}>
                      <Text style={styles.statValue}>{pitcherStats.whip}</Text>
                      <Text style={[styles.statValue, { marginLeft: 10 }]}>{pitcherStats.kSum}</Text>
                      <Text style={styles.statUnit}>K</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.detailStatGrid}>
                  <Text style={[styles.statLabel, { marginBottom: 12 }]}>상세 지표</Text>
                  <DetailRow label="이닝 (IP)" value={pitcherStats.ip} />
                  <DetailRow label="9이닝당 삼진 (K/9)" value={pitcherStats.k9} />
                  <DetailRow label="피안타" value={pitcherStats.hitsAllowed} />
                  <DetailRow label="사사구 (BB+HBP)" value={pitcherStats.bbSum} />
                  <DetailRow label="평균구속" value={`${pitcherStats.avgSpeed} km/h`} />
                </View>
              </>
            )}

            {/* 최근 경기 기록 */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>최근 경기 기록</Text>
              <Text style={styles.sectionSubtitle}>최근 5경기 결과</Text>
            </View>

            <View style={styles.gameLogCard}>
               {recentGames.length > 0 ? (
                 <View style={{ gap: 20 }}>
                   <View>
                     <Text style={{ fontSize: 13, color: "#705c30", fontWeight: "700", marginBottom: 10, paddingLeft: 4 }}>타격 지표</Text>
                     <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 10 }}>
                       {[
                         { label: "안타", key: "hits" },
                         { label: "홈런", key: "hr" },
                         { label: "타점", key: "rbi" },
                         { label: "볼넷", key: "bb" },
                         { label: "삼진", key: "k" }
                       ].map(item => {
                          let val = 0;
                          recentGames.forEach(game => {
                            if (game.batter_id === member.Id) {
                              const res = game.result || "";
                              if (item.key === "hits" && ["안타", "2루타", "3루타", "홈런", "적시타"].some(s => res.includes(s))) val++;
                              if (item.key === "hr" && res.includes("홈런")) val++;
                              if (item.key === "rbi") val += (game.runs_scored_on_play || 0);
                              if (item.key === "bb" && (res.includes("볼넷") || res.includes("사구"))) val++;
                              if (item.key === "k" && res.includes("삼진")) val++;
                            }
                          });
                          return <SummaryItem key={item.key} label={item.label} value={val} />;
                       })}
                       <View style={{ flex: 1, minWidth: "30%" }} />
                     </View>
                   </View>

                   {member.Is_Pitcher === 1 && (
                     <View style={{ borderTopWidth: 1, borderTopColor: "rgba(112, 92, 48, 0.1)", paddingTop: 16 }}>
                       <Text style={{ fontSize: 13, color: "#705c30", fontWeight: "700", marginBottom: 10, paddingLeft: 4 }}>투구 지표</Text>
                       <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 10 }}>
                         {[
                           { label: "이닝", key: "outs" },
                           { label: "탈삼진", key: "k" },
                           { label: "볼넷", key: "bb" },
                           { label: "자책점", key: "r" }
                         ].map(item => {
                            let val = 0;
                            recentGames.forEach(game => {
                               const res = game.result || "";
                               if (game.pitcher_id === member.Id) {
                                 if (item.key === "outs") val += (game.outs_after - game.outs_before);
                                 if (item.key === "k" && res.includes("삼진")) val++;
                                 if (item.key === "bb" && (res.includes("볼넷") || res.includes("사구"))) val++;
                                 if (item.key === "r") val += (game.runs_scored_on_play || 0);
                               }
                            });
                            const displayVal = item.key === "outs" ? `${Math.floor(val/3)}.${val%3}` : val;
                            return <SummaryItem key={item.key} label={item.label} value={displayVal} />;
                         })}
                         <View style={{ flex: 1, minWidth: "30%" }} />
                         <View style={{ flex: 1, minWidth: "30%" }} />
                       </View>
                     </View>
                   )}
                 </View>
               ) : (
                 <Text style={[styles.gameLogText, { padding: 10, textAlign: "left", color: "#705c30" }]}>최근 기록된 경기가 없습니다.</Text>
               )}
            </View>
          </>
        )}
      </ScrollView>

      <PlayerFooter activeTab="UserInfo" />
    </SafeAreaView>
  );
};

/* ==========================================
 * 5. 전역 헬퍼 컴포넌트
 * ========================================== */
const DetailRow = ({ label, value }) => (
  <View style={styles.detailStatRow}>
    <Text style={styles.detailStatLabel}>{label}</Text>
    <Text style={styles.detailStatValue}>{value}</Text>
  </View>
);

export default PlayerDetailScreen;
