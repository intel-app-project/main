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

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH - 24; // Based on 12px horizontal padding

const PlayerDetailScreen = ({navigation, route}) => {
  const { id } = route.params;
  const targetId = id; 


  const [loading, setLoading] = useState(true);
  const [member, setMember] = useState(null);
  const [team, setTeam] = useState(null);
  const [activeMode, setActiveMode] = useState("HITTER");
  const [canPitch, setCanPitch] = useState(false);
  const [canBat, setCanBat] = useState(false);
  const [recentGames, setRecentGames] = useState([]);

  const [hitterStats, setHitterStats] = useState({
    contact: 0, power: 0, speed: 0, eye: 0, clutch: 0,
    avg: ".000", hr: 0, rbi: 0, ops: ".000", obp: ".000", slg: ".000",
    hits: 0, ab: 0, bb: 0, k: 0
  });

  const [pitcherStats, setPitcherStats] = useState({
    dominance: 0, control: 0, stamina: 0, stability: 0, resilience: 0,
    era: "0.00", whip: "0.00", k9: "0.0", avgSpeed: 0,
    ip: "0.0", kSum: 0, bbSum: 0, hitsAllowed: 0
  });

  useEffect(() => {
    fetchPlayerData();
  }, [id]);

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate("Director"); 
    }
  };

  const fetchPlayerData = async () => {
    try {
      setLoading(true);
      // Reset previous states to prevent stale data
      setMember(null);
      setTeam(null);
      setRecentGames([]);
      setHitterStats({
        contact: 0, power: 0, speed: 0, eye: 0, clutch: 0,
        avg: ".000", hr: 0, rbi: 0, ops: ".000", obp: ".000", slg: ".000",
        hits: 0, ab: 0, bb: 0, k: 0
      });
      setPitcherStats({
        dominance: 0, control: 0, stamina: 0, stability: 0, resilience: 0,
        era: "0.00", whip: "0.00", k9: "0.0", avgSpeed: 0,
        ip: "0.0", kSum: 0, bbSum: 0, hitsAllowed: 0
      });

      if (targetId === undefined || targetId === null) {
        throw new Error("사용자 식별 정보가 없습니다.");
      }

      let query = supabase.from("member").select("*");
      
      const isStringId = typeof targetId === "string" && targetId.startsWith("user");
      
      if (isStringId) {
        query = query.eq("User_ID", targetId);
      } else {
        query = query.eq("Id", targetId);
      }

      const { data: memberData, error: memberError } = await query.single();

      if (memberError) throw memberError;


      setMember(memberData);

      if (memberData.Team) {
        const { data: teamData } = await supabase
          .from("team")
          .select("*")
          .eq("id", memberData.Team)
          .single();
        setTeam(teamData);
      }

      const { data: allGames, error: gamesError } = await supabase
        .from("game")
        .select("*")
        .or(`batter_id.eq.${memberData.Id},pitcher_id.eq.${memberData.Id}`)
        .order('date', { ascending: false });

      if (allGames && allGames.length > 0) {
        setRecentGames(allGames.slice(0, 5));
        
        // Use Number() to ensure type consistency, especially for ID 0
        const battingGames = allGames.filter(g => Number(g.batter_id) === Number(memberData.Id));
        const pitchingGames = allGames.filter(g => Number(g.pitcher_id) === Number(memberData.Id));

        // Set capabilities based on Is_Pitcher flag
        // Pitchers can see both hitter/pitcher stats, others only hitter
        const isPitcher = memberData.Is_Pitcher === 1;
        setCanPitch(isPitcher);
        setCanBat(true); 

        calculateHitterStats(battingGames, memberData);
        calculatePitcherStats(pitchingGames, memberData);

        // Set default mode based on Is_Pitcher
        setActiveMode(isPitcher ? "PITCHER" : "HITTER");
      } else if (memberData.Is_Pitcher === 1) {
        setCanPitch(true);
        setActiveMode("PITCHER");
      }
    } catch (error) {
      console.error("Error fetching player data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateHitterStats = (games, currentMemberData) => {
    if (!games || games.length === 0) {
      setHitterStats({
        contact: 0, power: 0, speed: 0, eye: 0, clutch: 0,
        avg: ".000", hr: 0, rbi: 0, ops: ".000", obp: ".000", slg: ".000",
        hits: 0, ab: 0, bb: 0, k: 0
      });
      return;
    }
    let hits = 0, ab = 0, hr = 0, dbl = 0, tpl = 0, bb = 0, hbp = 0, k = 0, rbi = 0;
    let rispAB = 0, rispHits = 0;

    games.forEach((g) => {
      const res = g.result;
      const isHit = ["안타", "2루타", "3루타", "홈런", "적시타"].some(s => res.includes(s));
      const ignoreAB = ["볼넷", "사구", "희생번트", "희생플라이"].some(s => res.includes(s));
      const isRISP = g.bases_before >= 10;

      if (isHit) {
        hits++;
        if (res.includes("홈런")) hr++;
        if (res.includes("2루타")) dbl++;
        if (res.includes("3루타")) tpl++;
        if (isRISP) rispHits++;
      }
      
      if (!ignoreAB) {
        ab++;
        if (res.includes("삼진")) k++;
        if (isRISP) rispAB++;
      }

      if (res.includes("볼넷")) bb++;
      if (res.includes("사구")) hbp++;
      rbi += (g.runs_scored_on_play || 0);
    });

    const avg = ab > 0 ? hits / ab : 0;
    const obp = (ab + bb + hbp) > 0 ? (hits + bb + hbp) / (ab + bb + hbp) : 0;
    const slg = ab > 0 ? (hits - dbl - tpl - hr + dbl*2 + tpl*3 + hr*4) / ab : 0;
    const clutch = rispAB > 0 ? rispHits / rispAB : 0;

    const activeMember = currentMemberData || member;
    setHitterStats({
      contact: Math.min(100, Math.round(avg * 250)),
      power: Math.min(100, Math.round(slg * 150)),
      speed: 0, 
      eye: Math.min(100, Math.round((bb / (games.length || 1)) * 400)),
      clutch: Math.min(100, Math.round(clutch * 200)),
      avg: avg.toFixed(3),
      obp: obp.toFixed(3),
      slg: slg.toFixed(3),
      ops: (obp + slg).toFixed(3),
      hr, rbi, hits, ab, bb, k
    });
  };

  const calculatePitcherStats = (games, currentMemberData) => {
    if (!games || games.length === 0) {
      setPitcherStats({
        dominance: 0, control: 0, stamina: 0, stability: 0, resilience: 0,
        era: "0.00", whip: "0.00", k9: "0.0", avgSpeed: 0,
        ip: "0.0", kSum: 0, bbSum: 0, hitsAllowed: 0
      });
      return;
    }
    let r = 0, outs = 0, h = 0, bb = 0, k = 0, rispAB = 0, rispHits = 0;

    games.forEach(g => {
      r += (g.runs_scored_on_play || 0);
      outs += (g.outs_after - g.outs_before);
      const res = g.result;
      if (["안타", "2루타", "3루타", "홈런"].some(s => res.includes(s))) {
        h++;
        if (g.bases_before >= 10) rispHits++;
      }
      if (res.includes("볼넷") || res.includes("사구")) bb++;
      if (res.includes("삼진")) k++;
      if (g.bases_before >= 10) rispAB++;
    });

    const ipFull = Math.floor(outs / 3);
    const ipPart = outs % 3;
    const ipStr = `${ipFull}.${ipPart}`;
    const ipDec = outs / 3 || 0.1;
    
    const era = (r * 9) / ipDec;
    const whip = (h + bb) / ipDec;
    const k9 = (k * 9) / ipDec;
    const resilienceBase = rispAB > 0 ? 1 - (rispHits / rispAB) : (games.length > 0 ? 1 : 0);

    setPitcherStats({
      dominance: Math.max(0, Math.min(100, Math.round(k9 * 10))),
      control: games.length > 0 ? Math.max(0, Math.min(100, Math.round(100 - (bb / games.length) * 200))) : 0,
      stamina: Math.max(0, Math.min(100, Math.round(ipDec * 15))),
      stability: games.length > 0 ? Math.max(0, Math.min(100, Math.round(100 - era * 8))) : 0,
      resilience: Math.max(0, Math.round(resilienceBase * 100)),
      era: games.length > 0 ? era.toFixed(2) : "0.00",
      whip: games.length > 0 ? whip.toFixed(2) : "0.00",
      k9: games.length > 0 ? k9.toFixed(1) : "0.0",
      ip: ipStr,
      kSum: k,
      bbSum: bb,
      hitsAllowed: h,
      avgSpeed: 0
    });

    const activeMember = currentMemberData || member;
    if (activeMember) {
      console.log(`[DEBUG] Stats for ID ${activeMember.Id}:`, {
        bb,
        games: games.length,
        control: games.length > 0 ? Math.max(0, Math.min(100, Math.round(100 - (bb / games.length) * 200))) : 0
      });
    }
  };

  const RadarChart = ({ data, activeRole }) => {
    const size = CARD_WIDTH - 24; 
    const center = size / 2;
    const radius = size * 0.32; 
    
    // Mapping labels to data keys
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
      
      {canPitch && canBat && (
        <View style={styles.header}>
          <View style={styles.modeToggleContainer}>
            <TouchableOpacity 
              style={[styles.modeToggleButton, activeMode === "PITCHER" && styles.modeToggleButtonActive]}
              onPress={() => setActiveMode("PITCHER")}
            >
              <Text style={[styles.modeToggleText, activeMode === "PITCHER" && styles.modeToggleTextActive]}>투수</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.modeToggleButton, activeMode === "HITTER" && styles.modeToggleButtonActive]}
              onPress={() => setActiveMode("HITTER")}
            >
              <Text style={[styles.modeToggleText, activeMode === "HITTER" && styles.modeToggleTextActive]}>타자</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <Text style={styles.largeTeamName}>TEAM {team?.name || "TERRA"}</Text>
          <View style={styles.heroMainRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroNumber}>#{member?.Num || "00"}</Text>
              <Text style={styles.heroName} numberOfLines={1} adjustsFontSizeToFit>{member?.Name}</Text>
            </View>
            <View 
              style={[
                styles.orderBadgeContainer, 
                (activeMode !== "HITTER" || !member?.Batting_Order_Default) && styles.orderBadgeContainerHidden
              ]}
            >
              <Text style={styles.orderBadgeText}>타석 {member?.Batting_Order_Default || "-"}</Text>
            </View>
          </View>
          <View style={styles.badgeContainer}>
            <View style={styles.positionBadge}>
              <Text style={styles.positionBadgeText}>{member?.Primary_Position}</Text>
            </View>
            <View style={styles.infoBadge}>
              <Text style={styles.infoBadgeText}>
                {canPitch && canBat ? "투타 겸업" : member?.Is_Pitcher ? "투수" : (member?.Primary_Position === "감독" || member?.Primary_Position === "기록원") ? "스태프" : "타자"}
              </Text>
            </View>
          </View>
          
          {team?.trait && (
            <View style={{ marginTop: 16, padding: 12, backgroundColor: "rgba(74, 124, 89, 0.05)", borderRadius: 8 }}>
              <Text style={{ fontSize: 12, color: "#4a7c59", fontWeight: "800", marginBottom: 4 }}>TEAM PHILOSOPHY</Text>
              <Text style={{ fontSize: 13, color: "#705c30", lineHeight: 18 }}>{team.trait}</Text>
            </View>
          )}
        </View>

        {(member?.Primary_Position === "감독" || member?.Primary_Position === "기록원") ? (
          <View style={[styles.card, { padding: 40, alignItems: "center" }]}>
             <MaterialCommunityIcons name="shield-account" size={64} color="#4a7c59" />
             <Text style={{ marginTop: 16, fontSize: 18, fontWeight: "700", color: "#2e3230" }}>{member.Primary_Position} 프로필</Text>
             <Text style={{ marginTop: 8, fontSize: 14, color: "#705c30", textAlign: "center" }}>팀의 운영과 기록을 담당하는 공식 스태프입니다. 선수 데이터 집계 대상에서 제외됩니다.</Text>
          </View>
        ) : (
          <>
            <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{activeMode === "HITTER" ? "시즌 성적 분석" : "투구 실적 분석"}</Text>
          <Text style={styles.sectionSubtitle}>{activeMode === "HITTER" ? "타격 퍼포먼스" : "투구 효율성"}</Text>
        </View>

        <RadarChart 
          data={activeMode === "HITTER" ? hitterStats : pitcherStats} 
          activeRole={activeMode}
        />

        <View style={styles.statGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>{activeMode === "HITTER" ? "타율 (AVG)" : "방어율 (ERA)"}</Text>
            <View>
              <Text style={styles.statValueLarge}>{activeMode === "HITTER" ? hitterStats.avg : pitcherStats.era}</Text>
              <View style={styles.statIndicator} />
            </View>
          </View>
          <View style={styles.secondaryStatCard}>
            <Text style={styles.statLabel}>{activeMode === "HITTER" ? "OPS / 홈런" : "WHIP / 탈삼진"}</Text>
            <View style={styles.statValueContainer}>
              <Text style={styles.statValue}>{activeMode === "HITTER" ? hitterStats.ops : pitcherStats.whip}</Text>
              <Text style={[styles.statValue, { marginLeft: 10 }]}>{activeMode === "HITTER" ? hitterStats.hr : pitcherStats.kSum}</Text>
              <Text style={styles.statUnit}>{activeMode === "HITTER" ? "HR" : "K"}</Text>
            </View>
          </View>
        </View>

        <View style={styles.detailStatGrid}>
          <Text style={[styles.statLabel, { marginBottom: 12 }]}>상세 지표</Text>
          {activeMode === "HITTER" ? (
            <>
              <DetailRow label="출루율 (OBP)" value={hitterStats.obp} />
              <DetailRow label="장타율 (SLG)" value={hitterStats.slg} />
              <DetailRow label="안타 / 타수" value={`${hitterStats.hits} / ${hitterStats.ab}`} />
              <DetailRow label="볼넷 / 삼진" value={`${hitterStats.bb} / ${hitterStats.k}`} />
              <DetailRow label="타점 (RBI)" value={hitterStats.rbi} />
            </>
          ) : (
            <>
              <DetailRow label="이닝 (IP)" value={pitcherStats.ip} />
              <DetailRow label="9이닝당 삼진 (K/9)" value={pitcherStats.k9} />
              <DetailRow label="피안타" value={pitcherStats.hitsAllowed} />
              <DetailRow label="사사구 (BB+HBP)" value={pitcherStats.bbSum} />
              <DetailRow label="평균구속" value={`${pitcherStats.avgSpeed} km/h`} />
            </>
          )}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>최근 경기 기록</Text>
          <Text style={styles.sectionSubtitle}>최근 5경기 결과</Text>
        </View>

        <View style={styles.gameLogCard}>
           {recentGames.length > 0 ? (
             <>
               <View style={{ marginBottom: 16, borderBottomWidth: 1, borderBottomColor: "#f0f0f0", paddingBottom: 8 }}>
                 <Text style={[styles.statLabel, { fontSize: 13, marginBottom: 0 }]}>
                    최근 {recentGames.length}경기 누적 합계
                 </Text>
               </View>
               <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 10 }}>
                 {activeMode === "HITTER" ? (
                   <>
                     {[
                       { label: "안타", key: "hits" },
                       { label: "홈런", key: "hr" },
                       { label: "타점", key: "rbi" },
                       { label: "볼넷", key: "bb" },
                       { label: "삼진", key: "k" }
                     ].map(item => {
                        let val = 0;
                        recentGames.forEach(g => {
                          if (g.batter_id === member.Id) {
                            const res = g.result || "";
                            if (item.key === "hits" && ["안타", "2루타", "3루타", "홈런", "적시타"].some(s => res.includes(s))) val++;
                            if (item.key === "hr" && res.includes("홈런")) val++;
                            if (item.key === "rbi") val += (g.runs_scored_on_play || 0);
                            if (item.key === "bb" && (res.includes("볼넷") || res.includes("사구"))) val++;
                            if (item.key === "k" && res.includes("삼진")) val++;
                          }
                        });
                        return <SummaryItem key={item.key} label={item.label} value={val} />;
                     })}
                     <View style={{ flex: 1, minWidth: "30%" }} /> 
                   </>
                 ) : (
                   <>
                     {[
                       { label: "이닝", key: "outs" },
                       { label: "탈삼진", key: "k" },
                       { label: "볼넷", key: "bb" },
                       { label: "자책점", key: "r" }
                     ].map(item => {
                        let val = 0;
                        recentGames.forEach(g => {
                           const res = g.result || "";
                           if (g.pitcher_id === member.Id) {
                             if (item.key === "outs") val += (g.outs_after - g.outs_before);
                             if (item.key === "k" && res.includes("삼진")) val++;
                             if (item.key === "bb" && (res.includes("볼넷") || res.includes("사구"))) val++;
                             if (item.key === "r") val += (g.runs_scored_on_play || 0);
                           }
                        });
                        const displayVal = item.key === "outs" ? `${Math.floor(val/3)}.${val%3}` : val;
                        return <SummaryItem key={item.key} label={item.label} value={displayVal} />;
                     })}
                     <View style={{ flex: 1, minWidth: "30%" }} />
                     <View style={{ flex: 1, minWidth: "30%" }} />
                   </>
                 )}
               </View>
             </>
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

const DetailRow = ({ label, value }) => (
  <View style={styles.detailStatRow}>
    <Text style={styles.detailStatLabel}>{label}</Text>
    <Text style={styles.detailStatValue}>{value}</Text>
  </View>
);

export default PlayerDetailScreen;
