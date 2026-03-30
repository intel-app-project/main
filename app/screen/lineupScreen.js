import { useEffect, useState } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Text,
} from "react-native";
import { SvgUri } from "react-native-svg";
import { API_BASE_URL } from "../constants/commonConstants";
import {
  POSITIONS,
  INITIAL_LINEUP,
  BATTING_ORDERS,
} from "../constants/scheduleConstants";
import { parseJsonField } from "../utils/scheduleUtils";
import { styles } from "./lineupScreen.styles";
import CommonHeader from "../components/CommonHeader";
import { SafeAreaView } from "react-native-safe-area-context";

const LineupScreen = ({route}) => {
  const { targetDate, id: routeId } = route.params;
  const id = Number(routeId);

  const [schedule, setSchedule] = useState(null); // 해당 날짜의 경기 일정 데이터
  const [members, setMembers] = useState([]); // 전체 팀원 목록
  const [loading, setLoading] = useState(true); // 로딩 상태 관리
  const [attendees, setAttendees] = useState([]); // 투표에서 '참석(1)'으로 응답한 인원들
  const [lineup, setLineup] = useState(INITIAL_LINEUP); // 현재 화면에 표시/수정 중인 라인업 데이터

  const [isHome, setIsHome] = useState(true); // 현재 사용자가 홈팀인지 여부

  const [activeTab, setActiveTab] = useState("defense"); // 현재 활성화된 탭 ('defense' 또는 'batting')
  const [selectedBattingIdx, setSelectedBattingIdx] = useState(null); // 타순 설정 시 선택된 번호 (0~8)

  useEffect(() => {
    fetchData();
  }, [targetDate]);

  const fetchData = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    try {
      setLoading(true);
      const schedRes = await fetch(
        `${API_BASE_URL}/api/schedule/date/${targetDate}`,
        {
          signal: controller.signal,
        },
      );
      if (!schedRes.ok) throw new Error(`일정 로드 실패 (${schedRes.status})`);
      const schedData = await schedRes.json();

      if (schedData && schedData.length > 0) {
        const currentSched = schedData[0];
        setSchedule(currentSched);

        // 멤버 정보 및 내 팀 ID 가져오기
        const memRes = await fetch(`${API_BASE_URL}/api/member`, {
          signal: controller.signal,
        });
        if (!memRes.ok) throw new Error(`멤버 로드 실패 (${memRes.status})`);
        const memData = await memRes.json();
        setMembers(memData);

        // 현재 로그인 사용자 정보 찾기 및 팀 식별
        const currentUser = memData.find((m) => m.Id === id);
        const teamId = currentUser?.Team;
        const homeSide = currentSched.home === teamId;
        
        setIsHome(homeSide);

        // 참석자 리스트 가공
        const memberStatus = parseJsonField(homeSide ? currentSched.home_member : currentSched.away_member) || {};
        const attendingIds = Array.isArray(memberStatus)
          ? memberStatus.map(item => Number(item?.Id || item))
          : Object.keys(memberStatus).filter(mid => Number(memberStatus[mid]) === 1).map(mid => Number(mid));

        const attendingMembers = memData.filter(
          (m) =>
            m.Id &&
            attendingIds.includes(m.Id) &&
            m.Primary_Position !== "감독",
        );
        setAttendees(attendingMembers);

        // 해당 팀의 라인업 로드 (home_lineup 또는 away_lineup)
        const rawLineupData = homeSide
          ? currentSched.home_lineup
          : currentSched.away_lineup;
        if (rawLineupData) {
          let rawLineup = parseJsonField(rawLineupData);
          if (rawLineup && !rawLineup.defense && !rawLineup.batting) {
            rawLineup = { defense: rawLineup, batting: Array(9).fill(null) };
          }
          if (rawLineup.defense && !Array.isArray(rawLineup.defense.BENCH)) {
            const oldBench = rawLineup.defense.BENCH;
            rawLineup.defense.BENCH = oldBench ? [oldBench] : [];
          }
          setLineup(rawLineup || INITIAL_LINEUP);
        } else {
          setLineup(INITIAL_LINEUP);
        }
      } else {
        Alert.alert("알림", `${targetDate} 경기를 찾을 수 없습니다.`);
      }
    } catch (e) {
      console.error("데이터 로드 오류:", e);
      if (e.name === "AbortError")
        Alert.alert("연결 지연", "서버 응답 시간이 초과되었습니다.");
      else
        Alert.alert(
          "오류",
          `데이터를 불러오는 중 문제가 발생했습니다: ${e.message}`,
        );
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  // --- ID를 이름으로 변환하는 헬퍼 함수 ---
  const getNameById = (mid) => {
    if (!mid) return "---";
    const member = members.find((m) => m.Id === mid);
    return member ? member.Name : mid;
  };

  // --- 데이터 저장 함수 ---
  const handleSave = async () => {
    if (!schedule) return;
    try {
      const side = isHome ? "home" : "away";
      const response = await fetch(
        `${API_BASE_URL}/api/schedule/${targetDate}/lineup?side=${side}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(lineup),
        },
      );
      if (response.ok) Alert.alert("성공", "라인업이 저장되었습니다.");
      else throw new Error("저장 실패");
    } catch (e) {
      Alert.alert("실패", "라인업 저장 중 오류가 발생했습니다.");
    }
  };

  // --- 핵심 로직: 선수 배정 함수 ---
  const assignMember = (posOrIdx, member) => {
    const mId = member.Id;

    setLineup((prev) => {
      const newLineup = JSON.parse(JSON.stringify(prev));

      if (activeTab === "defense") {
        const isBench = posOrIdx === "BENCH";

        // 중복 방지: 다른 포지션에서 제거
        Object.keys(newLineup.defense).forEach((k) => {
          if (k !== "BENCH" && newLineup.defense[k] === mId) newLineup.defense[k] = null;
        });

        if (!isBench) {
          newLineup.defense.BENCH = (newLineup.defense.BENCH || []).filter(id => id !== mId);
          newLineup.defense[posOrIdx] = mId;
        } else {
          const bench = newLineup.defense.BENCH || [];
          newLineup.defense.BENCH = bench.includes(mId) 
            ? bench.filter(id => id !== mId) 
            : [...bench, mId];
        }
          } else {
        if (selectedBattingIdx === null) return Alert.alert("알림", "설정할 타순을 먼저 선택해주세요."), prev;

        const isDefender = Object.keys(newLineup.defense).some(k => k !== "BENCH" && newLineup.defense[k] === mId);
        const hasDH = !!(newLineup.defense.DH && String(newLineup.defense.DH).trim());
        const isPitcher = newLineup.defense.P === mId;

        if (!(isDefender && !(hasDH && isPitcher))) {
          Alert.alert("제한", (hasDH && isPitcher) ? "지명타자 설정 시 투수는 타격 불가합니다." : "수비 포지션이 지정된 선수만 가능합니다.");
          return prev;
        }

        newLineup.batting = newLineup.batting.map(id => id === mId ? null : id);
        newLineup.batting[selectedBattingIdx] = mId;
      }

      // --- 후처리: 수비 라인업에서 빠진 선수가 타순에 남아있지 않도록 동기화 ---
      const hasDH_Final = !!(
        newLineup.defense.DH && newLineup.defense.DH.toString().trim() !== ""
      );
      const activeHitterIds = new Set(
        Object.keys(newLineup.defense)
          .filter((k) => k !== "BENCH")
          .filter((k) => !(hasDH_Final && k === "P"))
          .map((k) => newLineup.defense[k]?.toString())
          .filter((id) => id && id !== ""),
      );

      newLineup.batting = newLineup.batting.map((id) => {
        return id && activeHitterIds.has(String(id)) ? id : null;
      });

      return newLineup;
    });
  };

  const handleAutoBench = () => {
    setLineup((prev) => {
      const newLineup = JSON.parse(JSON.stringify(prev));
      const assigned = new Set(Object.keys(newLineup.defense).filter(k => k !== "BENCH").map(k => String(newLineup.defense[k] || "")));
      const bench = newLineup.defense.BENCH || [];

      attendees.forEach(m => {
        if (m.Id && !assigned.has(String(m.Id)) && !bench.includes(m.Id)) bench.push(m.Id);
      });
      newLineup.defense.BENCH = [...bench];

      const hasDH = !!(newLineup.defense.DH && String(newLineup.defense.DH).trim());
      const hitters = new Set(Object.keys(newLineup.defense).filter(k => k !== "BENCH" && !(hasDH && k === "P")).map(k => String(newLineup.defense[k] || "")));
      newLineup.batting = newLineup.batting.map(id => hitters.has(String(id || "")) ? id : null);

      return newLineup;
    });
    Alert.alert("완료", "배정되지 않은 인원을 모두 후보로 등록했습니다.");
  };

  const getAssignedKey = (m) => {
    if (!m.Id) return null;
    if (activeTab === "defense") {
      const pos = Object.keys(lineup.defense).find(k => k !== "BENCH" && lineup.defense[k] === m.Id);
      return pos || ((lineup.defense.BENCH || []).includes(m.Id) ? "후보" : null);
    }
    const idx = lineup.batting.indexOf(m.Id);
      return idx !== -1 ? `${idx + 1}번` : null;
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4a7c59" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <CommonHeader title="LineupScreen" />
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "defense" && styles.activeTab]}
          onPress={() => setActiveTab("defense")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "defense" && styles.activeTabText,
            ]}
          >
            수비 위치
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "batting" && styles.activeTab]}
          onPress={() => setActiveTab("batting")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "batting" && styles.activeTabText,
            ]}
          >
            타순 설정
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 수비 위치 탭 */}
        {activeTab === "defense" ? (
          <View style={styles.fieldSection}>
            <Text style={styles.sectionTitle}>Defensive Alignment</Text>
            <View style={styles.fieldCard}>
              {/* 야구장 시각화 레이어 시작 */}
              <View style={styles.fieldContainer}>
                {/* 부채꼴 외야 잔디 배경 */}
                <View style={styles.stadiumFan} />

                {/* 반원 형태의 내야 흙 영역 */}
                <View style={styles.infieldDirtSemi} />

                {/* 다이아몬드 베이스 라인 및 내야 잔디 */}
                <View style={styles.diamondBaseLines} />

                {/* 흰색 베이스 마커 (2루, 1루, 3루) */}
                <View style={[styles.baseMarker, styles.base2B]} />
                <View style={[styles.baseMarker, styles.base1B]} />
                <View style={[styles.baseMarker, styles.base3B]} />
                <View style={styles.baseHome} />

                {/* 투수 마운드 */}
                <View style={styles.pitcherMoundDirt}>
                  <View style={styles.moundPlate} />
                </View>

                {/* 각 포지션 슬롯 배치: POSITIONS 상수를 활용한 자동 매핑 */}
                {POSITIONS.filter(p => p !== "BENCH").map(pos => (
                  <View key={pos} style={styles[`pos${pos}`]}>
                  <PositionSlot
                      pos={pos}
                      name={getNameById(lineup.defense[pos])}
                    stadium
                  />
                </View>
                ))}
              </View>
            </View>
            <TouchableOpacity onPress={handleAutoBench} style={styles.autoBenchBtn}>
              <Text style={styles.autoBenchBtnText}>나머지 인원 일괄 후보 등록</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* 타순 설정 탭 - 일본식 메뉴판 스타일 */
          <View style={styles.battingSection}>
            <Text style={styles.sectionTitle}>Batting Order Board</Text>
            <View style={styles.battingBoard}>
              {BATTING_ORDERS.map((order, idx) => {
                const memberId = lineup.batting[idx];
                const name = getNameById(memberId);
                const isSelected = selectedBattingIdx === idx;
                
                return (
                  <TouchableOpacity
                    key={order}
                    style={[
                      styles.battingColumn,
                      isSelected && styles.battingColumnActive,
                    ]}
                    onPress={() => setSelectedBattingIdx(idx)}
                  >
                    <Text style={styles.battingOrderNum}>{order}</Text>
                    {memberId ? (
                      <Text style={styles.battingVerticalName}>
                        {name.split("").join("\n")}
                      </Text>
                    ) : (
                      <Text style={styles.battingVerticalEmpty}>
                        {"빈\n슬\n롯"}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        <View style={styles.rosterSection}>
          <Text style={styles.sectionTitle}>참석 명단</Text>
          <View style={styles.rosterCard}>
            {attendees.map((m, idx) => {
              const assignedPos = getAssignedKey(m);
              const hasDH = !!(lineup.defense.DH && String(lineup.defense.DH).trim());
              const isP = lineup.defense.P === m.Id;
              const isEligible = Object.keys(lineup.defense).some(k => k !== "BENCH" && lineup.defense[k] === m.Id) && !(hasDH && isP);
              const isLast = idx === attendees.length - 1;

              return (
                <View key={m.Id} style={[styles.memberRow, isLast && { borderBottomWidth: 0 }]}>
                  <View style={styles.memberInfoWrap}>
                    <View style={styles.memberAvatarContainer}>
                      <SvgUri
                        uri={`https://api.dicebear.com/9.x/adventurer/svg?seed=${m.Name}`}
                        width="100%"
                        height="100%"
                      />
                    </View>
                    <View style={styles.memberTextWrap}>
                      <Text style={styles.memberName}>
                        {m.Name}
                        {activeTab === "defense" && (
                          <Text
                            style={{
                              color: "rgba(46, 50, 48, 0.5)",
                              fontSize: 12,
                            }}
                          >
                            {" "}
                            ({m.Primary_Position || "미정"})
                          </Text>
                        )}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.posButtons}>
                    {activeTab === "defense" ? (
                      POSITIONS.map((pos) => {
                        const isActive = pos === "BENCH" ? (lineup.defense.BENCH || []).includes(m.Id) : lineup.defense[pos] === m.Id;
                        return (
                          <TouchableOpacity key={pos} onPress={() => assignMember(pos, m)} style={[styles.posBtn, isActive && styles.posBtnActive]}>
                            <Text style={[styles.posBtnText, isActive && styles.posBtnTextActive]}>{pos}</Text>
                          </TouchableOpacity>
                        );
                      })
                    ) : (
                      <TouchableOpacity
                        disabled={!isEligible}
                        onPress={() => assignMember(null, m)}
                        style={[
                          styles.posBtn,
                          (!lineup.batting.includes(m.Id) && isEligible) && styles.posBtnActive, 
                          !isEligible && { backgroundColor: "rgba(46, 50, 48, 0.05)", opacity: 0.5 }
                        ]}
                      >
                        <Text style={[styles.posBtnText, (!lineup.batting.includes(m.Id) && isEligible) && styles.posBtnTextActive, !isEligible && { color: "rgba(46, 50, 48, 0.3)" }]}>
                          {lineup.batting.includes(m.Id) ? "배정 완료" : (isEligible ? "배정 필요" : (hasDH && isP ? "DH사용됨" : "수비필요"))}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>라인업 저장하기</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const PositionSlot = ({ pos, name, highlight, stadium }) => (
  <View
    style={[
      styles.slot,
      highlight && styles.slotHighlight,
      stadium && styles.slotStadium,
    ]}
  >
    {stadium && name && name !== "---" ? (
      <>
        <View style={styles.slotAvatarContainer}>
          <SvgUri
            uri={`https://api.dicebear.com/9.x/adventurer/svg?seed=${name}`}
            width="100%"
            height="100%"
          />
        </View>
        <View style={styles.slotBottomRow}>
          <Text style={[styles.slotName, styles.slotNameStadium]} numberOfLines={1}>
            {name}
          </Text>
          <Text style={[styles.slotPos, styles.slotPosStadium]}>{pos}</Text>
        </View>
      </>
    ) : (
      <>
        <Text style={[styles.slotPos, stadium && styles.slotPosStadium]}>
          {pos}
        </Text>
        {name && name !== "---" && (
          <View style={styles.slotAvatarContainer}>
            <SvgUri
              uri={`https://api.dicebear.com/9.x/adventurer/svg?seed=${name}`}
              width="100%"
              height="100%"
            />
          </View>
        )}
        <Text
          style={[styles.slotName, stadium && styles.slotNameStadium]}
          numberOfLines={1}
        >
          {name || "---"}
        </Text>
      </>
    )}
  </View>
);

export default LineupScreen;
