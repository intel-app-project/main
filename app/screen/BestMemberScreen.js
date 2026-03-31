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
import { SafeAreaView } from "react-native-safe-area-context";
import { API_BASE_URL } from "../constants/commonConstants";
import {
  POSITIONS,
  INITIAL_LINEUP,
  BATTING_ORDERS,
} from "../constants/scheduleConstants";
import { parseJsonField } from "../utils/scheduleUtils";
import { styles } from "./bestMemberScreen.styles";
import CommonHeader from "../components/CommonHeader";

const BestMemberScreen = ({ route, navigation }) => {
  const { id: routeId } = route.params;
  const id = Number(routeId);

  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  
  // 상태 구조: { defense: { P: id, ... }, batting: [ id, ... ] }
  const [bestMember, setBestMember] = useState({
    defense: INITIAL_LINEUP.defense,
    batting: Array(9).fill(null),
  });

  const [activeTab, setActiveTab] = useState("defense"); // 'defense' | 'batting'
  const [selectedBattingIdx, setSelectedBattingIdx] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // 1. 멤버 정보 가져오기
      const memRes = await fetch(`${API_BASE_URL}/api/member`);
      if (!memRes.ok) throw new Error("멤버 로드 실패");
      const memData = await memRes.json();
      setMembers(memData);

      // 2. 현재 사용자 정보 및 팀 확인
      const user = memData.find((m) => m.Id === id);
      setCurrentUser(user);
      
      if (user && user.Team) {
        // 3. 팀 정보 가져오기
        const teamRes = await fetch(`${API_BASE_URL}/api/team/${user.Team}`);
        if (!teamRes.ok) throw new Error("팀 로드 실패");
        const teamData = await teamRes.json();
        setTeam(teamData);

        // 4. 기존 best_member 데이터 파싱 및 구조 보정
        if (teamData?.best_member) {
          let parsed = parseJsonField(teamData.best_member);
          
          // 구조 보정: { defense, batting } 형태가 아니라면 이전 수비 데이터로 간주
          if (!parsed.defense && !parsed.batting) {
            parsed = {
              defense: parsed,
              batting: Array(9).fill(null)
            };
          } else if (!parsed.defense) {
            parsed.defense = INITIAL_LINEUP.defense;
          } else if (!parsed.batting) {
            parsed.batting = Array(9).fill(null);
          }

          // BENCH 배열 보정
          if (parsed.defense && !Array.isArray(parsed.defense.BENCH)) {
            parsed.defense.BENCH = parsed.defense.BENCH ? [parsed.defense.BENCH] : [];
          }
          
          setBestMember(parsed);
        }
      }
    } catch (e) {
      console.error("데이터 로드 오류:", e);
      Alert.alert("오류", "데이터를 불러오는 중 문제가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!currentUser || currentUser.Primary_Position !== "감독") {
      return Alert.alert("권한 없음", "감독 직책만 저장할 수 있습니다.");
    }
    if (!team) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/team/${team.id}/best_member`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bestMember),
        }
      );
      if (response.ok) {
        Alert.alert("성공", "팀 베스트 멤버가 저장되었습니다.", [
          { text: "확인", onPress: () => navigation.goBack() },
        ]);
      } else {
        throw new Error("저장 실패");
      }
    } catch (e) {
      Alert.alert("실패", "데이터 저장 중 오류가 발생했습니다.");
    }
  };

  const assignMember = (posOrIdx, member) => {
    if (currentUser?.Primary_Position !== "감독") return;

    const mId = member.Id;
    setBestMember((prev) => {
      const newData = JSON.parse(JSON.stringify(prev));

      if (activeTab === "defense") {
        const isBench = posOrIdx === "BENCH";

        // 중복 방지: 다른 포지션에서 제거
        Object.keys(newData.defense).forEach((k) => {
          if (k !== "BENCH" && newData.defense[k] === mId) newData.defense[k] = null;
        });

        if (!isBench) {
          newData.defense.BENCH = (newData.defense.BENCH || []).filter(id => id !== mId);
          newData.defense[posOrIdx] = mId;
        } else {
          const bench = newData.defense.BENCH || [];
          newData.defense.BENCH = bench.includes(mId) 
            ? bench.filter(id => id !== mId) 
            : [...bench, mId];
        }
      } else {
        // 타순 설정 탭
        if (selectedBattingIdx === null) {
          Alert.alert("알림", "설정할 타순을 먼저 선택해주세요.");
          return prev;
        }

        // 수비 포지션이 있는 선수인지 확인 (수비가 있어야 타석에 설 수 있음)
        const isDefender = Object.keys(newData.defense).some(k => k !== "BENCH" && newData.defense[k] === mId);
        const hasDH = !!(newData.defense.DH && newData.defense.DH !== "");
        const isPitcher = newData.defense.P === mId;

        if (!isDefender) {
          Alert.alert("제한", "수비 포지션이 지정된 선수만 타순 배정이 가능합니다.");
          return prev;
        }

        if (hasDH && isPitcher) {
          Alert.alert("제한", "지명타자(DH) 사용 시 투수는 타격할 수 없습니다.");
          return prev;
        }

        // 중복 타순 제거 후 할당
        newData.batting = newData.batting.map(id => id === mId ? null : id);
        newData.batting[selectedBattingIdx] = mId;
      }

      // --- 자동 동기화: 수비에서 빠진 선수가 타순에 남아있으면 제거 ---
      const currentDH = !!(newData.defense.DH && newData.defense.DH !== "");
      const eligibleHitterIds = new Set(
        Object.keys(newData.defense)
          .filter(k => k !== "BENCH" && !(currentDH && k === "P"))
          .map(k => newData.defense[k])
          .filter(id => id)
      );

      newData.batting = newData.batting.map(id => id && eligibleHitterIds.has(id) ? id : null);

      return newData;
    });
  };

  const handleAutoBench = () => {
    setBestMember((prev) => {
      const newData = JSON.parse(JSON.stringify(prev));
      const assigned = new Set(Object.keys(newData.defense).filter(k => k !== "BENCH").map(k => String(newData.defense[k] || "")));
      const bench = newData.defense.BENCH || [];

      teamMembers.forEach(m => {
        if (m.Id && !assigned.has(String(m.Id)) && !bench.includes(m.Id)) bench.push(m.Id);
      });
      newData.defense.BENCH = [...bench];
      return newData;
    });
    Alert.alert("완료", "배정되지 않은 인원을 후보로 등록했습니다.");
  };

  const getAssignedKey = (mId) => {
    if (!mId) return null;
    if (activeTab === "defense") {
      const pos = Object.keys(bestMember.defense).find(k => k !== "BENCH" && bestMember.defense[k] === mId);
      if (pos) return pos;
      if ((bestMember.defense.BENCH || []).includes(mId)) return "후보";
    } else {
      const idx = bestMember.batting.indexOf(mId);
      if (idx !== -1) return `${idx + 1}번`;
    }
    return null;
  };

  const getNameById = (mid) => {
    if (!mid) return "---";
    const member = members.find((m) => m.Id === mid);
    return member ? member.Name : "---";
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4a7c59" />
      </View>
    );
  }

  const isDirector = currentUser?.Primary_Position === "감독";
  const teamMembers = members.filter(
    (m) => m.Team === currentUser?.Team && m.Primary_Position !== "감독",
  );

  return (
    <SafeAreaView style={styles.container}>
      <CommonHeader title="Team Best Member" />
      
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "defense" && styles.activeTab]}
          onPress={() => setActiveTab("defense")}
        >
          <Text style={[styles.tabText, activeTab === "defense" && styles.activeTabText]}>수비 설정</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "batting" && styles.activeTab]}
          onPress={() => setActiveTab("batting")}
        >
          <Text style={[styles.tabText, activeTab === "batting" && styles.activeTabText]}>타순 설정</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerSection}>
          <Text style={styles.headerTitle}>{team?.name || "우리 팀"}</Text>
          <Text style={styles.headerSubtitle}>팀 전체의 고정 베스트 라인업 관리</Text>
        </View>

        {!isDirector ? (
          <View style={styles.accessDenied}>
            <Text style={styles.deniedText}>
              팀 베스트 멤버 설정은 {"\n"}감독 직책만 가능합니다.
            </Text>
          </View>
        ) : (
          <>
            {activeTab === "defense" ? (
              <View style={styles.fieldSection}>
                <Text style={styles.sectionTitle}>베스트 야구장 배치</Text>
                <View style={styles.fieldCard}>
                  <View style={styles.fieldContainer}>
                    <View style={styles.stadiumFan} />
                    <View style={styles.infieldDirtSemi} />
                    <View style={styles.diamondBaseLines} />
                    <View style={[styles.baseMarker, styles.base2B]} />
                    <View style={[styles.baseMarker, styles.base1B]} />
                    <View style={[styles.baseMarker, styles.base3B]} />
                    <View style={styles.baseHome} />
                    <View style={styles.pitcherMoundDirt}><View style={styles.moundPlate} /></View>

                    {POSITIONS.filter(p => p !== "BENCH").map(pos => (
                      <View key={pos} style={styles[`pos${pos}`]}>
                        <PositionSlot
                          pos={pos}
                          name={getNameById(bestMember.defense[pos])}
                        />
                      </View>
                    ))}
                  </View>
                </View>
                <TouchableOpacity onPress={handleAutoBench} style={styles.autoBenchBtn}>
                  <Text style={styles.autoBenchBtnText}>배정되지 않은 인원 일괄 후보 등록</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.battingSection}>
                <Text style={styles.sectionTitle}>베스트 타순 보드</Text>
                <View style={styles.battingBoard}>
                  {BATTING_ORDERS.map((order, idx) => {
                    const mId = bestMember.batting[idx];
                    const name = getNameById(mId);
                    const isSelected = selectedBattingIdx === idx;
                    return (
                      <TouchableOpacity
                        key={order}
                        style={[styles.battingColumn, isSelected && styles.battingColumnActive]}
                        onPress={() => setSelectedBattingIdx(idx)}
                      >
                        <Text style={styles.battingOrderNum}>{order}</Text>
                        {mId ? (
                          <Text style={styles.battingVerticalName}>{name.split("").join("\n")}</Text>
                        ) : (
                          <Text style={styles.battingVerticalEmpty}>{"빈\n슬\n롯"}</Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            <View style={styles.rosterSection}>
              <Text style={styles.sectionTitle}>전체 팀원 목록</Text>
              <View style={styles.rosterCard}>
                {teamMembers.map((m, idx) => {
                  const assignedPos = getAssignedKey(m.Id);
                  const isLast = idx === teamMembers.length - 1;
                  const isHitterEligible = activeTab === "batting" && 
                    Object.keys(bestMember.defense).some(k => k !== "BENCH" && bestMember.defense[k] === m.Id);

                  return (
                    <View key={m.Id} style={[styles.memberRow, isLast && { borderBottomWidth: 0 }]}>
                      <View style={styles.memberInfoWrap}>
                        <View style={styles.memberAvatarContainer}>
                          <SvgUri uri={`https://api.dicebear.com/9.x/adventurer/svg?seed=${m.Name}`} width="100%" height="100%" />
                        </View>
                        <View style={styles.memberTextWrap}>
                          <Text style={styles.memberName}>{m.Name}</Text>
                          <Text style={styles.memberPosition}>{m.Primary_Position || "미정"}</Text>
                          {assignedPos && <Text style={styles.assignedInfo}>[{assignedPos}]</Text>}
                        </View>
                      </View>

                      <View style={styles.posButtons}>
                        {activeTab === "defense" ? (
                          POSITIONS.map((pos) => {
                            const isActive = pos === "BENCH" 
                              ? (bestMember.defense.BENCH || []).includes(m.Id) 
                              : bestMember.defense[pos] === m.Id;
                            return (
                              <TouchableOpacity key={pos} onPress={() => assignMember(pos, m)} style={[styles.posBtn, isActive && styles.posBtnActive]}>
                                <Text style={[styles.posBtnText, isActive && styles.posBtnTextActive]}>{pos}</Text>
                              </TouchableOpacity>
                            );
                          })
                        ) : (
                          <TouchableOpacity
                            onPress={() => assignMember(null, m)}
                            disabled={!isHitterEligible}
                            style={[
                              styles.posBtn,
                              isHitterEligible && !bestMember.batting.includes(m.Id) && styles.posBtnActive,
                              bestMember.batting.includes(m.Id) && { backgroundColor: "#e0e0e0" },
                              !isHitterEligible && { opacity: 0.3 },
                            ]}
                          >
                            <Text
                              style={[
                                styles.posBtnText,
                                isHitterEligible && !bestMember.batting.includes(m.Id) && styles.posBtnTextActive,
                                bestMember.batting.includes(m.Id) && { color: "#777" },
                              ]}
                            >
                              {bestMember.batting.includes(m.Id) ? "배정완료" : "배정필요"}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnText}>베스트 멤버 설정 저장하기</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// 콤팩트 슬롯 컴포넌트
const PositionSlot = ({ pos, name }) => (
  <View style={styles.slotStadium}>
    {name && name !== "---" && (
      <View style={styles.slotAvatarContainer}>
        <SvgUri uri={`https://api.dicebear.com/9.x/adventurer/svg?seed=${name}`} width="100%" height="100%" />
      </View>
    )}
    <View style={styles.slotBottomRow}>
      <Text style={styles.slotNameStadium} numberOfLines={1}>{name || "---"}</Text>
      <Text style={styles.slotPosStadium}>{pos}</Text>
    </View>
  </View>
);

export default BestMemberScreen;
