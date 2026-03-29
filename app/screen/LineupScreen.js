import React, { useEffect, useState } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Text,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { API_BASE_URL } from "../constants/commonConstants";
import {
  POSITIONS,
  INITIAL_LINEUP,
  BATTING_ORDERS,
} from "../constants/scheduleConstants";
import { parseJsonField } from "../utils/scheduleUtils";
import { styles } from "./lineupScreen.styles";
import CommonFooter from "../components/CommonFooter";
import CommonHeader from "../components/CommonHeader";
import { SafeAreaView } from "react-native-safe-area-context";

const LineupScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { targetDate = "20260909", id } = route.params || {}; // id: 사용자 ID (Id 또는 User_ID)

  const [schedule, setSchedule] = useState(null); // 해당 날짜의 경기 일정 데이터
  const [members, setMembers] = useState([]); // 전체 팀원 목록
  const [loading, setLoading] = useState(true); // 로딩 상태 관리
  const [attendees, setAttendees] = useState([]); // 투표에서 '참석(1)'으로 응답한 인원들
  const [lineup, setLineup] = useState(INITIAL_LINEUP); // 현재 화면에 표시/수정 중인 라인업 데이터

  const [isHome, setIsHome] = useState(true); // 현재 사용자가 홈팀인지 여부
  const [myTeamId, setMyTeamId] = useState(null); // 사용자의 소속 팀 ID

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

        // 현재 로그인 사용자(id) 정보 찾기
        const currentUser = memData.find(
          (m) =>
            (m.Id && m.Id.toString() === id?.toString()) ||
            (m.User_ID && m.User_ID === id),
        );
        const teamId = currentUser?.Team;
        setMyTeamId(teamId);

        // 홈/어웨이 판별
        const homeSide = currentSched.home === teamId;
        setIsHome(homeSide);

        // 해당 팀의 참석자 리스트 (home_member 또는 away_member)
        const memberStatusColumn = homeSide
          ? currentSched.home_member
          : currentSched.away_member;
        const memberStatus = parseJsonField(memberStatusColumn) || {};

        let attendingIds = [];
        if (Array.isArray(memberStatus)) {
          attendingIds = memberStatus.map((item) => {
            if (typeof item === "object" && item !== null) {
              return (
                item.id ||
                item.User_ID ||
                item.member_id ||
                ""
              ).toString();
            }
            return item.toString();
          });
        } else {
          attendingIds = Object.keys(memberStatus).filter(
            (mid) => memberStatus[mid] === 1 || memberStatus[mid] === "1",
          );
        }

        const attendingMembers = memData.filter((m) => {
          const mId = m.Id || m.id || m.User_ID;
          return mId && attendingIds.includes(mId.toString());
        });
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
  const getNameById = (id) => {
    if (!id) return "---";
    const member = members.find(
      (m) =>
        (m.Id && m.Id.toString() === id.toString()) ||
        (m.User_ID && m.User_ID === id.toString()),
    );
    return member ? member.Name || member.name : id;
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

  // --- 핵심 로직: 선수 배정 함수 (ID 기반 저장 - 숫자형 선호) ---
  const assignMember = (posOrIdx, member) => {
    // Id가 있으면 숫자로, 없으면 User_ID 사용
    const mId = member.Id ? Number(member.Id) : member.User_ID;
    const sId = mId?.toString();

    setLineup((prev) => {
      const newLineup = JSON.parse(JSON.stringify(prev));

      // 1. 수비 위치 설정 모드일 때
      if (activeTab === "defense") {
        const isBench = posOrIdx === "BENCH";

        // 중복 배정 방지: 이미 다른 포지션에 있었다면 비움
        Object.keys(newLineup.defense).forEach((key) => {
          if (key !== "BENCH" && newLineup.defense[key]?.toString() === sId) {
            newLineup.defense[key] = null;
          }
        });

        if (!isBench) {
          // 주전 포지션(P, C, 1B 등)에 배정할 경우 후보 명단에서 제거
          newLineup.defense.BENCH = (newLineup.defense.BENCH || []).filter(
            (id) => id?.toString() !== sId,
          );
          newLineup.defense[posOrIdx] = mId;
        } else {
          // 후보(BENCH)로 등록할 경우 토글 방식 (이미 있으면 제거, 없으면 추가)
          const currentBench = newLineup.defense.BENCH || [];
          if (currentBench.some((id) => id?.toString() === sId)) {
            newLineup.defense.BENCH = currentBench.filter(
              (id) => id?.toString() !== sId,
            );
          } else {
            if (!newLineup.defense.BENCH) newLineup.defense.BENCH = [];
            newLineup.defense.BENCH.push(mId);
          }
        }
      }
      // 2. 타순 설정 모드일 때
      else {
        if (selectedBattingIdx === null) {
          Alert.alert("알림", "설정할 타순(1~9)을 먼저 선택해주세요.");
          return prev;
        }

        // 타순 배정 조건 확인 (지명타자 규칙 등)
        const isDefender = Object.keys(newLineup.defense).some(
          (k) => k !== "BENCH" && newLineup.defense[k]?.toString() === sId,
        );
        const hasDH = !!(
          newLineup.defense.DH && newLineup.defense.DH.toString().trim() !== ""
        );
        const isPitcher = newLineup.defense.P?.toString() === sId;

        const isEligible = isDefender && !(hasDH && isPitcher); // 지명타자가 있으면 투수는 타격 불가

        if (!isEligible) {
          if (hasDH && isPitcher) {
            Alert.alert(
              "제한",
              "지명타자(DH)가 설정된 경우 투수는 타순에 들어갈 수 없습니다.",
            );
          } else {
            Alert.alert(
              "제한",
              "수비 포지션(또는 DH)이 지정된 선수만 타순에 들어갈 수 있습니다.",
            );
          }
          return prev;
        }

        // 이미 다른 타순에 있었다면 이전 타순 비움
        newLineup.batting = newLineup.batting.map((id) =>
          id?.toString() === sId ? null : id,
        );
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
        const stringId = id?.toString();
        return stringId && activeHitterIds.has(stringId) ? id : null;
      });

      return newLineup;
    });
  };

  const handleAutoBench = () => {
    setLineup((prev) => {
      const newLineup = JSON.parse(JSON.stringify(prev));
      const currentAssignedIds = new Set(
        Object.keys(newLineup.defense)
          .filter((k) => k !== "BENCH")
          .map((k) => newLineup.defense[k]?.toString())
          .filter((id) => id && id !== ""),
      );

      if (!newLineup.defense.BENCH) newLineup.defense.BENCH = [];

      attendees.forEach((member) => {
        const mId = member.Id ? Number(member.Id) : member.User_ID;
        if (
          mId &&
          !currentAssignedIds.has(mId.toString()) &&
          !newLineup.defense.BENCH.some(
            (bid) => bid?.toString() === mId.toString(),
          )
        ) {
          newLineup.defense.BENCH.push(mId);
        }
      });

      const hasDH = !!(
        newLineup.defense.DH && newLineup.defense.DH.toString().trim() !== ""
      );
      const activeHitterIds = new Set(
        Object.keys(newLineup.defense)
          .filter((k) => k !== "BENCH")
          .filter((k) => !(hasDH && k === "P"))
          .map((k) => newLineup.defense[k]?.toString())
          .filter((id) => id && id !== ""),
      );

      newLineup.batting = newLineup.batting.map((id) => {
        const stringId = id?.toString();
        return stringId && activeHitterIds.has(stringId) ? id : null;
      });

      return newLineup;
    });
    Alert.alert("완료", "배정되지 않은 인원을 모두 후보로 등록했습니다.");
  };

  const isMemberAssigned = (member) => {
    const mId = member.Id ? Number(member.Id) : member.User_ID;
    if (!mId) return false;
    const sId = mId.toString();

    if (activeTab === "defense") {
      const isPos = Object.keys(lineup.defense)
        .filter((k) => k !== "BENCH")
        .some((k) => lineup.defense[k]?.toString() === sId);
      const isBench = (lineup.defense.BENCH || []).some(
        (bid) => bid?.toString() === sId,
      );
      return isPos || isBench;
    } else {
      return lineup.batting.some((id) => id?.toString() === sId);
    }
  };

  const getAssignedKey = (member) => {
    const mId = member.Id ? Number(member.Id) : member.User_ID;
    if (!mId) return null;
    const sId = mId.toString();

    if (activeTab === "defense") {
      const pos = Object.keys(lineup.defense).find(
        (key) => key !== "BENCH" && lineup.defense[key]?.toString() === sId,
      );
      if (pos) return pos;
      if ((lineup.defense.BENCH || []).some((bid) => bid?.toString() === sId))
        return "후보";
      return null;
    } else {
      const idx = lineup.batting.findIndex((id) => id?.toString() === sId);
      return idx !== -1 ? `${idx + 1}번` : null;
    }
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
            <View style={styles.fieldCard}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  width: "100%",
                }}
              >
                <Text style={styles.sectionTitle}>Defensive Alignment</Text>
                <TouchableOpacity
                  onPress={handleAutoBench}
                  style={{
                    backgroundColor: "rgba(74, 124, 89, 0.1)",
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 5,
                  }}
                >
                  <Text
                    style={{
                      color: "#4a7c59",
                      fontSize: 10,
                      fontWeight: "bold",
                    }}
                  >
                    나머지 인원 일괄 후보 등록
                  </Text>
                </TouchableOpacity>
              </View>

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

                {/* 각 포지션 슬롯 배치 (ID를 이름으로 변환) */}
                <View style={styles.posP}>
                  <PositionSlot
                    pos="P"
                    name={getNameById(lineup.defense.P)}
                    stadium
                  />
                </View>
                <View style={styles.posC}>
                  <PositionSlot
                    pos="C"
                    name={getNameById(lineup.defense.C)}
                    stadium
                  />
                </View>
                <View style={styles.pos1B}>
                  <PositionSlot
                    pos="1B"
                    name={getNameById(lineup.defense["1B"])}
                    stadium
                  />
                </View>
                <View style={styles.pos2B}>
                  <PositionSlot
                    pos="2B"
                    name={getNameById(lineup.defense["2B"])}
                    stadium
                  />
                </View>
                <View style={styles.pos3B}>
                  <PositionSlot
                    pos="3B"
                    name={getNameById(lineup.defense["3B"])}
                    stadium
                  />
                </View>
                <View style={styles.posSS}>
                  <PositionSlot
                    pos="SS"
                    name={getNameById(lineup.defense.SS)}
                    stadium
                  />
                </View>
                <View style={styles.posLF}>
                  <PositionSlot
                    pos="LF"
                    name={getNameById(lineup.defense.LF)}
                    stadium
                  />
                </View>
                <View style={styles.posCF}>
                  <PositionSlot
                    pos="CF"
                    name={getNameById(lineup.defense.CF)}
                    stadium
                  />
                </View>
                <View style={styles.posRF}>
                  <PositionSlot
                    pos="RF"
                    name={getNameById(lineup.defense.RF)}
                    stadium
                  />
                </View>

                {/* 지명타자(DH) 배치 */}
                <View style={styles.posDH}>
                  <PositionSlot
                    pos="DH"
                    name={getNameById(lineup.defense.DH)}
                    stadium
                  />
                </View>
              </View>
            </View>
          </View>
        ) : (
          /* 타순 설정 탭 */
          <View style={styles.battingSection}>
            <View style={styles.battingList}>
              <Text style={styles.sectionTitle}>Batting Order (1-9)</Text>
              {BATTING_ORDERS.map((order, idx) => (
                <TouchableOpacity
                  key={order}
                  style={[
                    styles.battingRow,
                    selectedBattingIdx === idx && styles.battingRowActive,
                  ]}
                  onPress={() => setSelectedBattingIdx(idx)}
                >
                  <Text style={styles.battingOrder}>{order}</Text>
                  {lineup.batting[idx] ? (
                    <Text style={styles.battingName}>
                      {getNameById(lineup.batting[idx])}
                    </Text>
                  ) : (
                    <Text style={styles.battingEmpty}>선수를 선택해주세요</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={styles.rosterSection}>
          <Text style={styles.sectionTitle}>참석자 명단 (Status=1)</Text>
          {attendees.map((member) => {
            const mId = member.Id ? Number(member.Id) : member.User_ID;
            const sId = mId?.toString();
            const isDefender = Object.keys(lineup.defense).some(
              (k) => k !== "BENCH" && lineup.defense[k]?.toString() === sId,
            );
            const hasDH = !!(
              lineup.defense.DH && lineup.defense.DH.toString().trim() !== ""
            );
            const isPitcher = lineup.defense.P?.toString() === sId;

            const isEligibleForBatting = isDefender && !(hasDH && isPitcher);
            const assignedPos = getAssignedKey(member);

            return (
              <View
                key={member.Id || member.id || member.User_ID}
                style={styles.memberCard}
              >
                <Text style={styles.memberName}>
                  {member.Name || member.name || member.User_ID}
                  {activeTab === "defense" && (
                    <Text
                      style={{ color: "rgba(46, 50, 48, 0.5)", fontSize: 12 }}
                    >
                      {" "}
                      ({member.Primary_Position || "미정"})
                    </Text>
                  )}
                  <Text style={{ color: "#705c30", fontSize: 13 }}>
                    {" "}
                    [{assignedPos || "미배정"}]
                  </Text>
                </Text>
                <View style={styles.posButtons}>
                  {activeTab === "defense" ? (
                    POSITIONS.map((pos) => {
                      const isActive =
                        pos === "BENCH"
                          ? (lineup.defense.BENCH || []).some(
                              (bid) => bid?.toString() === sId,
                            )
                          : lineup.defense[pos]?.toString() === sId;
                      return (
                        <TouchableOpacity
                          key={pos}
                          onPress={() => assignMember(pos, member)}
                          style={[
                            styles.posBtn,
                            isActive && styles.posBtnActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.posBtnText,
                              isActive && styles.posBtnTextActive,
                            ]}
                          >
                            {pos}
                          </Text>
                        </TouchableOpacity>
                      );
                    })
                  ) : (
                    <TouchableOpacity
                      disabled={!isEligibleForBatting}
                      onPress={() => assignMember(null, member)}
                      style={[
                        styles.posBtn,
                        lineup.batting.some((id) => id?.toString() === sId) &&
                          styles.posBtnActive,
                        !isEligibleForBatting && {
                          backgroundColor: "rgba(46, 50, 48, 0.05)",
                          opacity: 0.5,
                        },
                        { paddingHorizontal: 20 },
                      ]}
                    >
                      <Text
                        style={[
                          styles.posBtnText,
                          lineup.batting.some((id) => id?.toString() === sId) &&
                            styles.posBtnTextActive,
                          !isEligibleForBatting && {
                            color: "rgba(46, 50, 48, 0.3)",
                          },
                        ]}
                      >
                        {isEligibleForBatting
                          ? "배정"
                          : hasDH && isPitcher
                            ? "DH사용됨"
                            : "수비필요"}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>라인업 저장하기</Text>
        </TouchableOpacity>
      </ScrollView>
      <CommonFooter activeTab="Lineup" />
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
    <Text style={[styles.slotPos, stadium && styles.slotPosStadium]}>
      {pos}
    </Text>
    <Text
      style={[styles.slotName, stadium && styles.slotNameStadium]}
      numberOfLines={1}
    >
      {name || "---"}
    </Text>
  </View>
);

export default LineupScreen;
