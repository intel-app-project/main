import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Image,
  Alert,
  Linking,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Polygon, Text as SvgText, SvgUri } from "react-native-svg";
import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library";
import { styles } from "./playerDetailScreen.styles";
import { supabase } from "../lib/supabase";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import CommonHeader from "../components/CommonHeader";
import { API_BASE_URL } from "../constants/commonConstants";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH - 24; // Based on 12px horizontal padding

const PlayerDetailScreen = ({ navigation, route }) => {
  const { id, loginId } = route.params;
  const isOwner = Number(loginId) === Number(id);
  console.log(
    `[PlayerDetailScreen] ViewID: ${id}, LoginID: ${loginId}, isOwner: ${isOwner}`,
  );

  const [loading, setLoading] = useState(true);
  const [member, setMember] = useState(null);
  const [team, setTeam] = useState(null);
  const [activeMode, setActiveMode] = useState("HITTER");
  const [canPitch, setCanPitch] = useState(false);
  const [canBat, setCanBat] = useState(false);
  const [recentGames, setRecentGames] = useState([]);
  const [reviewText, setReviewText] = useState("");
  const [reviewIssues, setReviewIssues] = useState([]);
  const [reviewLoading, setReviewLoading] = useState(false);

  const [prLoading, setPrLoading] = useState(false);
  const [prImage, setPrImage] = useState(null);

  const [hitterStats, setHitterStats] = useState({
    contact: 0,
    power: 0,
    speed: 0,
    eye: 0,
    clutch: 0,
    avg: ".000",
    hr: 0,
    rbi: 0,
    ops: ".000",
    obp: ".000",
    slg: ".000",
    hits: 0,
    ab: 0,
    bb: 0,
    k: 0,
  });

  const [pitcherStats, setPitcherStats] = useState({
    dominance: 0,
    control: 0,
    stamina: 0,
    stability: 0,
    resilience: 0,
    era: "0.00",
    whip: "0.00",
    k9: "0.0",
    avgSpeed: 0,
    ip: "0.0",
    kSum: 0,
    bbSum: 0,
    hitsAllowed: 0,
  });

  // 미리보기 및 카드 합성 상태
  const [previewVisible, setPreviewVisible] = useState(false);
  const [finalCardImage, setFinalCardImage] = useState(null);

  useEffect(() => {
    if (id !== undefined) {
      fetchPlayerData();
    }
  }, [id]);

  const fetchPlayerData = async () => {
    try {
      setLoading(true);
      // Reset previous states to prevent stale data
      setMember(null);
      setTeam(null);
      setRecentGames([]);
      setReviewText("");
      setReviewIssues([]);
      setPrImage(null);
      setHitterStats({
        contact: 0,
        power: 0,
        speed: 0,
        eye: 0,
        clutch: 0,
        avg: ".000",
        hr: 0,
        rbi: 0,
        ops: ".000",
        obp: ".000",
        slg: ".000",
        hits: 0,
        ab: 0,
        bb: 0,
        k: 0,
      });
      setPitcherStats({
        dominance: 0,
        control: 0,
        stamina: 0,
        stability: 0,
        resilience: 0,
        era: "0.00",
        whip: "0.00",
        k9: "0.0",
        avgSpeed: 0,
        ip: "0.0",
        kSum: 0,
        bbSum: 0,
        hitsAllowed: 0,
      });

      const query = supabase.from("member").select("*").eq("Id", id);
      const { data: memberData } = await query.single();

      setMember(memberData);
      if (memberData.Picture) {
        setPrImage(memberData.Picture);
      }

      if (memberData.Team) {
        const { data: teamData } = await supabase
          .from("team")
          .select("*")
          .eq("id", memberData.Team)
          .single();
        setTeam(teamData);
      }

      const { data: allGames } = await supabase
        .from("game")
        .select("*")
        .or(`batter_id.eq.${memberData.Id},pitcher_id.eq.${memberData.Id}`)
        .order("date", { ascending: false });

      if (allGames && allGames.length > 0) {
        setRecentGames(allGames.slice(0, 5));

        // Use Number() to ensure type consistency, especially for ID 0
        const battingGames = allGames.filter(
          (g) => Number(g.batter_id) === Number(memberData.Id),
        );
        const pitchingGames = allGames.filter(
          (g) => Number(g.pitcher_id) === Number(memberData.Id),
        );

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

      await fetchReview(memberData.Id);
    } catch (error) {
      console.error("Error fetching player data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReview = async (memberId) => {
    try {
      setReviewLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/review/${memberId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.detail || "review load failed");
      }

      setReviewText(data?.review || "");
      setReviewIssues(data?.issues || []);
    } catch (error) {
      console.error("Error fetching review:", error);
      setReviewText("리뷰를 아직 불러오지 못했습니다.");
      setReviewIssues([]);
    } finally {
      setReviewLoading(false);
    }
  };

  const generatePRCard = async () => {
    const LOG_TAG = "[playerDetailScreen.js > generatePRCard]";
    try {
      console.log(`${LOG_TAG} 시작...`);
      setPrLoading(true);
      setPrImage(null);

      const seed = member.Name;
      const issueString =
        reviewIssues && reviewIssues.length > 0
          ? reviewIssues.join(" ")
          : "뛰어난 선수입니다.";
      const promptInput = `선수 이름: ${seed}, 선수 아바타: https://api.dicebear.com/9.x/adventurer/png?seed=${seed}, 특징: ${issueString}`;

      console.log(
        `${LOG_TAG} 1단계: Gemini 프롬프트 생성 요청 중... (Input: ${seed})`,
      );
      const geminiUrl = `${API_BASE_URL}/api/gemini?prompt=${encodeURIComponent(promptInput)}`;
      const geminiRes = await fetch(geminiUrl);
      console.log(`${LOG_TAG} Gemini 응답 상태: ${geminiRes.status}`);

      if (!geminiRes.ok) {
        const errBody = await geminiRes.text();
        console.error(`${LOG_TAG} Gemini API 오류 상세:`, errBody);
        throw new Error(`Gemini 서버 오류 (Status: ${geminiRes.status})`);
      }

      const geminiData = await geminiRes.json();
      const generatedPrompt = geminiData.result;

      if (!generatedPrompt) {
        throw new Error("Gemini로부터 프롬프트를 받지 못했습니다.");
      }
      console.log(
        `${LOG_TAG} 2단계: Gemini 프롬프트 획득 완료. 이미지 생성 요청 중...`,
      );

      const bananaUrl = `${API_BASE_URL}/api/banana?banana=${encodeURIComponent(generatedPrompt)}`;
      const bananaRes = await fetch(bananaUrl);
      console.log(`${LOG_TAG} Banana 응답 상태: ${bananaRes.status}`);

      if (!bananaRes.ok) {
        const errBody = await bananaRes.text();
        console.error(`${LOG_TAG} Banana API 오류 상세:`, errBody);
        throw new Error(`이미지 서버 오류 (Status: ${bananaRes.status})`);
      }

      const bananaData = await bananaRes.json();
      if (!bananaData.result || bananaData.result.length < 100) {
        throw new Error("유효하지 않은 이미지 데이터입니다.");
      }

      console.log(`${LOG_TAG} 3단계: 이미지 생성 성공. DB 저장 중...`);
      setPrImage(bananaData.result);

      // DB에 저장
      try {
        const dbRes = await fetch(`${API_BASE_URL}/api/member`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: member.Id,
            data: { Picture: bananaData.result },
          }),
        });
        console.log(`${LOG_TAG} DB 저장 완료 (Status: ${dbRes.status})`);
      } catch (dbError) {
        console.error(`${LOG_TAG} DB 저장 중 무시 가능한 오류:`, dbError);
      }

      console.log(`${LOG_TAG} 모든 과정 성공적으로 완료!`);
    } catch (e) {
      console.error(`${LOG_TAG} 예외 발생!!!:`, e.message);
      Alert.alert(
        "생성 실패",
        `문제가 발생했습니다: ${e.message}\n백엔드 콘솔 로그를 확인해 주세요.`,
      );
    } finally {
      setPrLoading(false);
    }
  };

  // 1. 카드 미리보기 생성 (백엔드 합성 요청 및 모달 표시)
  const handlePreviewCard = async () => {
    if (!prImage) return;
    try {
      setPrLoading(true);

      const cardRes = await fetch(`${API_BASE_URL}/api/make_card`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: prImage,
          member: member,
          team: team,
          stats: activeMode === "HITTER" ? hitterStats : pitcherStats,
          active_mode: activeMode,
        }),
      });

      if (!cardRes.ok) {
        throw new Error("카드 합성 서버 오류");
      }

      const cardData = await cardRes.json();
      setFinalCardImage(cardData.result);
      setPreviewVisible(true);
    } catch (e) {
      console.error("Preview Error:", e);
      Alert.alert("미리보기 실패", "카드를 생성하는 중 오류가 발생했습니다.");
    } finally {
      setPrLoading(false);
    }
  };

  // 2. 실제 갤러리 저장 로직
  const handleSaveToLibrary = async () => {
    if (!finalCardImage) return;
    try {
      setPrLoading(true);

      // 권한 상태 확인
      const { status, canAskAgain } = await MediaLibrary.getPermissionsAsync();

      if (status !== "granted") {
        if (canAskAgain) {
          const { status: newStatus } =
            await MediaLibrary.requestPermissionsAsync();
          if (newStatus !== "granted") {
            Alert.alert(
              "권한 거부",
              "나만의 카드를 저장하기 위해서는 갤러리 접근 권한이 필요합니다.",
            );
            return;
          }
        } else {
          Alert.alert("권한 설정 필요", "갤러리 접근 권한을 허용해 주세요.");
          return;
        }
      }

      const filename =
        FileSystem.documentDirectory +
        `pr_card_${member?.Name}_${Date.now()}.jpg`;
      await FileSystem.writeAsStringAsync(filename, finalCardImage, {
        encoding: FileSystem.EncodingType.Base64,
      });

      await MediaLibrary.saveToLibraryAsync(filename);
      Alert.alert("저장 완료", "사진첩에 안전하게 저장되었습니다! ✨");
    } catch (e) {
      console.error("Save Error:", e);
      Alert.alert("저장 실패", "이미지를 저장하는 중 오류가 발생했습니다.");
    } finally {
      setPrLoading(false);
    }
  };

  const calculateHitterStats = (games, currentMemberData) => {
    if (!games || games.length === 0) {
      setHitterStats({
        contact: 0,
        power: 0,
        speed: 0,
        eye: 0,
        clutch: 0,
        avg: ".000",
        hr: 0,
        rbi: 0,
        ops: ".000",
        obp: ".000",
        slg: ".000",
        hits: 0,
        ab: 0,
        bb: 0,
        k: 0,
      });
      return;
    }
    let hits = 0,
      ab = 0,
      hr = 0,
      dbl = 0,
      tpl = 0,
      bb = 0,
      hbp = 0,
      k = 0,
      rbi = 0;
    let rispAB = 0,
      rispHits = 0;

    games.forEach((g) => {
      const res = g.result;
      const isHit = ["안타", "2루타", "3루타", "홈런", "적시타"].some((s) =>
        res.includes(s),
      );
      const ignoreAB = ["볼넷", "사구", "희생번트", "희생플라이"].some((s) =>
        res.includes(s),
      );
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
      rbi += g.runs_scored_on_play || 0;
    });

    const avg = ab > 0 ? hits / ab : 0;
    const obp = ab + bb + hbp > 0 ? (hits + bb + hbp) / (ab + bb + hbp) : 0;
    const slg =
      ab > 0 ? (hits - dbl - tpl - hr + dbl * 2 + tpl * 3 + hr * 4) / ab : 0;
    const clutch = rispAB > 0 ? rispHits / rispAB : 0;

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
      hr,
      rbi,
      hits,
      ab,
      bb,
      k,
    });
  };

  const calculatePitcherStats = (games, currentMemberData) => {
    if (!games || games.length === 0) {
      setPitcherStats({
        dominance: 0,
        control: 0,
        stamina: 0,
        stability: 0,
        resilience: 0,
        era: "0.00",
        whip: "0.00",
        k9: "0.0",
        avgSpeed: 0,
        ip: "0.0",
        kSum: 0,
        bbSum: 0,
        hitsAllowed: 0,
      });
      return;
    }
    let r = 0,
      outs = 0,
      h = 0,
      bb = 0,
      k = 0,
      rispAB = 0,
      rispHits = 0;

    games.forEach((g) => {
      r += g.runs_scored_on_play || 0;
      outs += g.outs_after - g.outs_before;
      const res = g.result;
      if (["안타", "2루타", "3루타", "홈런"].some((s) => res.includes(s))) {
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
    const resilienceBase =
      rispAB > 0 ? 1 - rispHits / rispAB : games.length > 0 ? 1 : 0;

    setPitcherStats({
      dominance: Math.max(0, Math.min(100, Math.round(k9 * 10))),
      control:
        games.length > 0
          ? Math.max(
              0,
              Math.min(100, Math.round(100 - (bb / games.length) * 200)),
            )
          : 0,
      stamina: Math.max(0, Math.min(100, Math.round(ipDec * 15))),
      stability:
        games.length > 0
          ? Math.max(0, Math.min(100, Math.round(100 - era * 8)))
          : 0,
      resilience: Math.max(0, Math.round(resilienceBase * 100)),
      era: games.length > 0 ? era.toFixed(2) : "0.00",
      whip: games.length > 0 ? whip.toFixed(2) : "0.00",
      k9: games.length > 0 ? k9.toFixed(1) : "0.0",
      ip: ipStr,
      kSum: k,
      bbSum: bb,
      hitsAllowed: h,
      avgSpeed: 0,
    });
  };

  const RadarChart = ({ data, activeRole }) => {
    const size = CARD_WIDTH - 24;
    const center = size / 2;
    const radius = size * 0.32;

    // Mapping labels to data keys
    const config =
      activeRole === "HITTER"
        ? [
            { label: "정확성", key: "contact" },
            { label: "장타력", key: "power" },
            { label: "기동력", key: "speed" },
            { label: "선구안", key: "eye" },
            { label: "클러치", key: "clutch" },
          ]
        : [
            { label: "구위", key: "dominance" },
            { label: "제구", key: "control" },
            { label: "스테미나", key: "stamina" },
            { label: "안정성", key: "stability" },
            { label: "위기관리", key: "resilience" },
          ];

    const getCoordinates = (value, index) => {
      const angle = (Math.PI * 2 * index) / 5 - Math.PI / 2;
      const r = (radius * Math.max(8, value)) / 100;
      return {
        x: center + r * Math.cos(angle),
        y: center + r * Math.sin(angle),
      };
    };

    return (
      <View style={styles.radarCard}>
        <Svg width={size} height={size}>
          {[0.2, 0.4, 0.6, 0.8, 1].map((step) => (
            <Polygon
              key={step}
              points={config
                .map((_, i) => {
                  const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
                  const r = radius * step;
                  return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
                })
                .join("\n")}
              fill="none"
              stroke="rgba(74, 124, 89, 0.1)"
              strokeWidth="1"
            />
          ))}
          <Polygon
            points={config
              .map((p, i) => {
                const coords = getCoordinates(data[p.key], i);
                return `${coords.x},${coords.y}`;
              })
              .join(" ")}
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
      <Text
        style={[
          styles.statLabel,
          {
            fontSize: 11,
            color: "#705c30",
            marginBottom: 2,
            textAlign: "center",
          },
        ]}
      >
        {label}
      </Text>
      <View
        style={{
          flexDirection: "row",
          alignItems: "baseline",
          justifyContent: "center",
        }}
      >
        <Text
          style={[
            styles.statValue,
            { fontSize: 20, fontWeight: "800", color: "#4a7c59" },
          ]}
        >
          {value}
        </Text>
        <Text style={{ fontSize: 10, color: "#4a7c59", marginLeft: 2 }}>
          {label === "이닝" ? "" : label === "자책점" ? "점" : "개"}
        </Text>
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
      <SafeAreaView
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <MaterialCommunityIcons
          name="alert-circle-outline"
          size={64}
          color="#705c30"
        />
        <Text
          style={{
            marginTop: 16,
            fontSize: 16,
            color: "#705c30",
            fontWeight: "600",
          }}
        >
          유저 정보를 불러올 수 없습니다.
        </Text>
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
              style={[
                styles.modeToggleButton,
                activeMode === "PITCHER" && styles.modeToggleButtonActive,
              ]}
              onPress={() => setActiveMode("PITCHER")}
            >
              <Text
                style={[
                  styles.modeToggleText,
                  activeMode === "PITCHER" && styles.modeToggleTextActive,
                ]}
              >
                투수
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modeToggleButton,
                activeMode === "HITTER" && styles.modeToggleButtonActive,
              ]}
              onPress={() => setActiveMode("HITTER")}
            >
              <Text
                style={[
                  styles.modeToggleText,
                  activeMode === "HITTER" && styles.modeToggleTextActive,
                ]}
              >
                타자
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroSection}>
          <Text style={styles.largeTeamName}>TEAM {team?.name || "TERRA"}</Text>
          <View style={styles.heroMainRow}>
            <View style={styles.heroAvatarContainer}>
              <SvgUri
                uri={`https://api.dicebear.com/9.x/adventurer/svg?seed=${member.Name}`}
                width="100%"
                height="100%"
              />
            </View>
            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text style={styles.heroNumber}>#{member?.Num || "00"}</Text>
              <Text
                style={styles.heroName}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {member.Name}
              </Text>
            </View>
            <View
              style={[
                styles.orderBadgeContainer,
                (activeMode !== "HITTER" || !member?.Batting_Order_Default) &&
                  styles.orderBadgeContainerHidden,
              ]}
            >
              <Text style={styles.orderBadgeText}>
                최적 타순 : {member?.Batting_Order_Default || "-"}번
              </Text>
            </View>
          </View>
          <View style={styles.badgeContainer}>
            <View style={styles.positionBadge}>
              <Text style={styles.positionBadgeText}>
                {member?.Primary_Position}
              </Text>
            </View>
            <View style={styles.infoBadge}>
              <Text style={styles.infoBadgeText}>
                {canPitch && canBat
                  ? "투타 겸업"
                  : member?.Is_Pitcher
                    ? "투수"
                    : member?.Primary_Position === "감독" ||
                        member?.Primary_Position === "기록원"
                      ? "스태프"
                      : "타자"}
              </Text>
            </View>
          </View>

          <View style={styles.reviewCard}>
            <Text style={styles.reviewEyebrow}>REVIEW</Text>
            {reviewLoading ? (
              <ActivityIndicator
                size="small"
                color="#4a7c59"
                style={styles.reviewLoader}
              />
            ) : (
              <Text style={styles.reviewText}>
                {reviewText || "리뷰가 아직 생성되지 않았습니다."}
              </Text>
            )}
          </View>

          <View style={styles.prCardContainer}>
            <View style={styles.prCardHeader}>
              <MaterialCommunityIcons
                name="magic-staff"
                size={20}
                color="#4a7c59"
              />
              <Text style={styles.prCardTitle}>Creative PR Factory</Text>
            </View>
            <Text style={{ fontSize: 13, color: "#705c30", marginBottom: 12 }}>
              선수의 최근 기록과 리뷰 데이터를 종합하여 NanoBanana AI가 나만의
              홍보 카드를 만들어 줍니다.
            </Text>

            {!prImage ? (
              <View>
                <View
                  style={[
                    styles.prImageContainer,
                    {
                      backgroundColor: "#fdf8e1",
                      justifyContent: "center",
                      alignItems: "center",
                      borderStyle: "dashed",
                      borderWidth: 1,
                      borderColor: "#e0d5b1",
                    },
                  ]}
                >
                  {prLoading ? (
                    <ActivityIndicator size="large" color="#4a7c59" />
                  ) : (
                    <>
                      <MaterialCommunityIcons
                        name="image-plus"
                        size={40}
                        color="#e0d5b1"
                      />
                      <Text
                        style={{
                          color: "#b0a688",
                          marginTop: 8,
                          fontSize: 14,
                          fontWeight: "600",
                        }}
                      >
                        카드 생성 전입니다
                      </Text>
                    </>
                  )}
                </View>
                {isOwner && (
                  <TouchableOpacity
                    style={[styles.prButton, prLoading && { opacity: 0.7 }]}
                    onPress={generatePRCard}
                    disabled={prLoading}
                  >
                    {prLoading ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <>
                        <MaterialCommunityIcons
                          name="auto-fix"
                          size={18}
                          color="#ffffff"
                        />
                        <Text style={styles.prButtonText}>카드 생성하기</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View>
                <View
                  style={[
                    styles.prImageContainer,
                    prLoading && { backgroundColor: "#f5f5f5", opacity: 0.5 },
                  ]}
                >
                  {prLoading && (
                    <View
                      style={{
                        position: "absolute",
                        zIndex: 1,
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <ActivityIndicator size="large" color="#4a7c59" />
                    </View>
                  )}
                  {prImage === "이미지 생성에 실패했습니다." ? (
                    <View
                      style={{
                        height: 300,
                        justifyContent: "center",
                        alignItems: "center",
                        padding: 20,
                      }}
                    >
                      <MaterialCommunityIcons
                        name="alert-circle-outline"
                        size={40}
                        color="#d9534f"
                      />
                      <Text
                        style={{
                          color: "#d9534f",
                          marginTop: 12,
                          textAlign: "center",
                          fontWeight: "600",
                        }}
                      >
                        이미지 생성에 실패했던 데이터입니다.{"\n"}다시 생성
                        버튼을 눌러주세요.
                      </Text>
                    </View>
                  ) : (
                    <Image
                      source={{ uri: `data:image/jpeg;base64,${prImage}` }}
                      style={styles.prImage}
                    />
                  )}
                </View>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <TouchableOpacity
                    style={[
                      styles.prButton,
                      { flex: 1 },
                      prLoading && { opacity: 0.7 },
                    ]}
                    onPress={handlePreviewCard}
                    disabled={prLoading}
                  >
                    {prLoading ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <>
                        <MaterialCommunityIcons
                          name="eye-outline"
                          size={18}
                          color="#ffffff"
                        />
                        <Text style={styles.prButtonText}>
                          선수 카드 미리보기
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                  {isOwner && (
                    <TouchableOpacity
                      style={[
                        styles.prButton,
                        { flex: 0.25, backgroundColor: "#8b9467" },
                        prLoading && { opacity: 0.7 },
                      ]}
                      onPress={generatePRCard}
                      disabled={prLoading}
                    >
                      <MaterialCommunityIcons
                        name="refresh"
                        size={18}
                        color="#ffffff"
                      />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
          </View>
        </View>

        {member?.Primary_Position === "감독" ||
        member?.Primary_Position === "기록원" ? (
          <View style={[styles.card, { padding: 40, alignItems: "center" }]}>
            <MaterialCommunityIcons
              name="shield-account"
              size={64}
              color="#4a7c59"
            />
            <Text
              style={{
                marginTop: 16,
                fontSize: 18,
                fontWeight: "700",
                color: "#2e3230",
              }}
            >
              {member.Primary_Position} 프로필
            </Text>
            <Text
              style={{
                marginTop: 8,
                fontSize: 14,
                color: "#705c30",
                textAlign: "center",
              }}
            >
              팀의 운영과 기록을 담당하는 공식 스태프입니다. 선수 데이터 집계
              대상에서 제외됩니다.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {activeMode === "HITTER" ? "시즌 성적 분석" : "투구 실적 분석"}
              </Text>
              <Text style={styles.sectionSubtitle}>
                {activeMode === "HITTER" ? "타격 퍼포먼스" : "투구 효율성"}
              </Text>
            </View>

            <RadarChart
              data={activeMode === "HITTER" ? hitterStats : pitcherStats}
              activeRole={activeMode}
            />

            <View style={styles.statGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>
                  {activeMode === "HITTER" ? "타율 (AVG)" : "방어율 (ERA)"}
                </Text>
                <View>
                  <Text style={styles.statValueLarge}>
                    {activeMode === "HITTER"
                      ? hitterStats.avg
                      : pitcherStats.era}
                  </Text>
                  <View style={styles.statIndicator} />
                </View>
              </View>
              <View style={styles.secondaryStatCard}>
                <Text style={styles.statLabel}>
                  {activeMode === "HITTER" ? "OPS / 홈런" : "WHIP / 탈삼진"}
                </Text>
                <View style={styles.statValueContainer}>
                  <Text style={styles.statValue}>
                    {activeMode === "HITTER"
                      ? hitterStats.ops
                      : pitcherStats.whip}
                  </Text>
                  <Text style={[styles.statValue, { marginLeft: 10 }]}>
                    {activeMode === "HITTER"
                      ? hitterStats.hr
                      : pitcherStats.kSum}
                  </Text>
                  <Text style={styles.statUnit}>
                    {activeMode === "HITTER" ? "HR" : "K"}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.detailStatGrid}>
              <Text style={[styles.statLabel, { marginBottom: 12 }]}>
                상세 지표
              </Text>
              {activeMode === "HITTER" ? (
                <>
                  <DetailRow label="출루율 (OBP)" value={hitterStats.obp} />
                  <DetailRow label="장타율 (SLG)" value={hitterStats.slg} />
                  <DetailRow
                    label="안타 / 타수"
                    value={`${hitterStats.hits} / ${hitterStats.ab}`}
                  />
                  <DetailRow
                    label="볼넷 / 삼진"
                    value={`${hitterStats.bb} / ${hitterStats.k}`}
                  />
                  <DetailRow label="타점 (RBI)" value={hitterStats.rbi} />
                </>
              ) : (
                <>
                  <DetailRow label="이닝 (IP)" value={pitcherStats.ip} />
                  <DetailRow
                    label="9이닝당 삼진 (K/9)"
                    value={pitcherStats.k9}
                  />
                  <DetailRow label="피안타" value={pitcherStats.hitsAllowed} />
                  <DetailRow
                    label="사사구 (BB+HBP)"
                    value={pitcherStats.bbSum}
                  />
                  <DetailRow
                    label="평균구속"
                    value={`${pitcherStats.avgSpeed} km/h`}
                  />
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
                  <View
                    style={{
                      marginBottom: 16,
                      borderBottomWidth: 1,
                      borderBottomColor: "#f0f0f0",
                      paddingBottom: 8,
                    }}
                  >
                    <Text
                      style={[
                        styles.statLabel,
                        { fontSize: 13, marginBottom: 0 },
                      ]}
                    >
                      최근 {recentGames.length}경기 누적 합계
                    </Text>
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      flexWrap: "wrap",
                      justifyContent: "space-between",
                      gap: 10,
                    }}
                  >
                    {activeMode === "HITTER" ? (
                      <>
                        {[
                          { label: "안타", key: "hits" },
                          { label: "홈런", key: "hr" },
                          { label: "타점", key: "rbi" },
                          { label: "볼넷", key: "bb" },
                          { label: "삼진", key: "k" },
                        ].map((item) => {
                          let val = 0;
                          recentGames.forEach((g) => {
                            if (g.batter_id === member.Id) {
                              const res = g.result || "";
                              if (
                                item.key === "hits" &&
                                [
                                  "안타",
                                  "2루타",
                                  "3루타",
                                  "홈런",
                                  "적시타",
                                ].some((s) => res.includes(s))
                              )
                                val++;
                              if (item.key === "hr" && res.includes("홈런"))
                                val++;
                              if (item.key === "rbi")
                                val += g.runs_scored_on_play || 0;
                              if (
                                item.key === "bb" &&
                                (res.includes("볼넷") || res.includes("사구"))
                              )
                                val++;
                              if (item.key === "k" && res.includes("삼진"))
                                val++;
                            }
                          });
                          return (
                            <SummaryItem
                              key={item.key}
                              label={item.label}
                              value={val}
                            />
                          );
                        })}
                        <View style={{ flex: 1, minWidth: "30%" }} />
                      </>
                    ) : (
                      <>
                        {[
                          { label: "이닝", key: "outs" },
                          { label: "탈삼진", key: "k" },
                          { label: "볼넷", key: "bb" },
                          { label: "자책점", key: "r" },
                        ].map((item) => {
                          let val = 0;
                          recentGames.forEach((g) => {
                            const res = g.result || "";
                            if (g.pitcher_id === member.Id) {
                              if (item.key === "outs")
                                val += g.outs_after - g.outs_before;
                              if (item.key === "k" && res.includes("삼진"))
                                val++;
                              if (
                                item.key === "bb" &&
                                (res.includes("볼넷") || res.includes("사구"))
                              )
                                val++;
                              if (item.key === "r")
                                val += g.runs_scored_on_play || 0;
                            }
                          });
                          const displayVal =
                            item.key === "outs"
                              ? `${Math.floor(val / 3)}.${val % 3}`
                              : val;
                          return (
                            <SummaryItem
                              key={item.key}
                              label={item.label}
                              value={displayVal}
                            />
                          );
                        })}
                        <View style={{ flex: 1, minWidth: "30%" }} />
                        <View style={{ flex: 1, minWidth: "30%" }} />
                      </>
                    )}
                  </View>
                </>
              ) : (
                <Text
                  style={[
                    styles.gameLogText,
                    { padding: 10, textAlign: "left", color: "#705c30" },
                  ]}
                >
                  최근 기록된 경기가 없습니다.
                </Text>
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* 카드 미리보기 모달 */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={previewVisible}
        onRequestClose={() => setPreviewVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>선수 카드 미리보기</Text>
              <TouchableOpacity onPress={() => setPreviewVisible(false)}>
                <MaterialCommunityIcons
                  name="close"
                  size={24}
                  color="#2e3230"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.modalImageWrapper}>
              {finalCardImage ? (
                <Image
                  source={{ uri: `data:image/jpeg;base64,${finalCardImage}` }}
                  style={styles.modalImage}
                  resizeMode="contain"
                />
              ) : (
                <View
                  style={[
                    styles.modalImage,
                    {
                      justifyContent: "center",
                      alignItems: "center",
                      backgroundColor: "#f5f5f5",
                    },
                  ]}
                >
                  <ActivityIndicator size="large" color="#4a7c59" />
                </View>
              )}
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={handleSaveToLibrary}
              >
                <MaterialCommunityIcons
                  name="download"
                  size={20}
                  color="#ffffff"
                />
                <Text style={styles.modalSaveButtonText}>갤러리에 저장</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setPreviewVisible(false)}
              >
                <Text style={styles.modalCloseButtonText}>닫기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
