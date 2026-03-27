import React, { useEffect, useState } from "react";
import { View, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Text } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { API_BASE_URL } from "../constants/commonConstants";
import { POSITIONS, INITIAL_LINEUP, BATTING_ORDERS } from "../constants/scheduleConstants";
import { parseJsonField } from "../utils/scheduleUtils";
import { styles } from "./LineupScreen.styles";
import DirectorFooter from "../components/DirectorFooter";


const LineupScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { targetDate = "20260909" } = route.params || {};

  const [schedule, setSchedule] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [attendees, setAttendees] = useState([]);
  const [lineup, setLineup] = useState(INITIAL_LINEUP);
  
  const [activeTab, setActiveTab] = useState('defense'); // 'defense' | 'batting'
  const [selectedBattingIdx, setSelectedBattingIdx] = useState(null);

  useEffect(() => {
    fetchData();
  }, [targetDate]);

  const fetchData = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    try {
      setLoading(true);
      const schedRes = await fetch(`${API_BASE_URL}/api/schedule/date/${targetDate}`, {
        signal: controller.signal
      });
      if (!schedRes.ok) throw new Error(`일정 로드 실패 (${schedRes.status})`);
      const schedData = await schedRes.json();
      
      if (schedData && schedData.length > 0) {
        const currentSched = schedData[0];
        setSchedule(currentSched);

        const memRes = await fetch(`${API_BASE_URL}/api/member`, {
          signal: controller.signal
        });
        if (!memRes.ok) throw new Error(`멤버 로드 실패 (${memRes.status})`);
        const memData = await memRes.json();
        setMembers(memData);

        const homeMemberStatus = parseJsonField(currentSched.home_member) || {};
        let attendingIds = [];
        if (Array.isArray(homeMemberStatus)) {
          attendingIds = homeMemberStatus.map(item => {
            if (typeof item === 'object' && item !== null) {
              return (item.id || item.User_ID || item.member_id || "").toString();
            }
            return item.toString();
          });
        } else {
          attendingIds = Object.keys(homeMemberStatus).filter(id => 
              homeMemberStatus[id] === 1 || homeMemberStatus[id] === "1"
          );
        }
        
        const attendingMembers = memData.filter(m => {
          const mId = m.Id || m.id || m.User_ID; 
          return mId && attendingIds.includes(mId.toString());
        });
        setAttendees(attendingMembers);

        if (currentSched.lineup) {
            let rawLineup = parseJsonField(currentSched.lineup);
            if (rawLineup && !rawLineup.defense && !rawLineup.batting) {
                rawLineup = { defense: rawLineup, batting: Array(9).fill(null) };
            }
            if (rawLineup.defense && !Array.isArray(rawLineup.defense.BENCH)) {
                const oldBench = rawLineup.defense.BENCH;
                rawLineup.defense.BENCH = oldBench ? [oldBench] : [];
            }
            setLineup(rawLineup || INITIAL_LINEUP);
        }
      } else {
          Alert.alert("알림", `${targetDate} 경기를 찾을 수 없습니다.`);
      }
    } catch (e) {
      console.error("데이터 로드 오류:", e);
      if (e.name === 'AbortError') Alert.alert("연결 지연", "서버 응답 시간이 초과되었습니다.");
      else Alert.alert("오류", `데이터를 불러오는 중 문제가 발생했습니다: ${e.message}`);
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!schedule) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/schedule/${targetDate}/lineup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lineup)
      });
      if (response.ok) Alert.alert("성공", "라인업이 저장되었습니다.");
      else throw new Error("저장 실패");
    } catch (e) {
      Alert.alert("실패", "라인업 저장 중 오류가 발생했습니다.");
    }
  };

  const assignMember = (posOrIdx, member) => {
    const memberName = (member.Name || member.name || member.User_ID || "").toString().trim();
    
    setLineup(prev => {
      const newLineup = JSON.parse(JSON.stringify(prev));
      
      if (activeTab === 'defense') {
        const isBench = posOrIdx === 'BENCH';
        Object.keys(newLineup.defense).forEach(key => {
          if (key !== 'BENCH' && newLineup.defense[key] === memberName) {
            newLineup.defense[key] = null;
          }
        });
        
        if (!isBench) {
            newLineup.defense.BENCH = (newLineup.defense.BENCH || []).filter(name => name !== memberName);
            newLineup.defense[posOrIdx] = memberName;
        } else {
            if ((newLineup.defense.BENCH || []).includes(memberName)) {
                newLineup.defense.BENCH = newLineup.defense.BENCH.filter(name => name !== memberName);
            } else {
                if (!newLineup.defense.BENCH) newLineup.defense.BENCH = [];
                newLineup.defense.BENCH.push(memberName);
            }
        }
      } else {
        if (selectedBattingIdx === null) {
            Alert.alert("알림", "설정할 타순(1~9)을 먼저 선택해주세요.");
            return prev;
        }
        
        const isDefender = Object.keys(newLineup.defense).some(k => k !== 'BENCH' && (lineup.defense[k] || "").toString().trim() === memberName);
        const hasDH = !!(newLineup.defense.DH && newLineup.defense.DH.toString().trim() !== "");
        const isPitcher = (newLineup.defense.P || "").toString().trim() === memberName;
        
        const isEligible = isDefender && !(hasDH && isPitcher);
        
        if (!isEligible) {
            if (hasDH && isPitcher) {
                Alert.alert("제한", "지명타자(DH)가 설정된 경우 투수는 타순에 들어갈 수 없습니다.");
            } else {
                Alert.alert("제한", "수비 포지션(또는 DH)이 지정된 선수만 타순에 들어갈 수 있습니다.");
            }
            return prev;
        }

        newLineup.batting = newLineup.batting.map(name => name === memberName ? null : name);
        newLineup.batting[selectedBattingIdx] = memberName;
      }

      const hasDH_Final = !!(newLineup.defense.DH && newLineup.defense.DH.toString().trim() !== "");
      const activeHitters = new Set(
        Object.keys(newLineup.defense)
          .filter(k => k !== 'BENCH')
          .filter(k => !(hasDH_Final && k === 'P')) 
          .map(k => (newLineup.defense[k] || "").toString().trim())
          .filter(n => n !== "")
      );
      
      newLineup.batting = newLineup.batting.map(name => {
          const trimmedName = (name || "").toString().trim();
          return (trimmedName !== "" && activeHitters.has(trimmedName)) ? name : null;
      });

      return newLineup;
    });
  };

  const handleAutoBench = () => {
    setLineup(prev => {
      const newLineup = JSON.parse(JSON.stringify(prev));
      const currentAssignedNames = new Set(
          Object.keys(newLineup.defense)
            .filter(k => k !== 'BENCH')
            .map(k => (newLineup.defense[k] || "").toString().trim())
            .filter(n => n !== "")
      );
      
      if (!newLineup.defense.BENCH) newLineup.defense.BENCH = [];

      attendees.forEach(member => {
          const name = (member.Name || member.name || member.User_ID || "").toString().trim();
          if (name !== "" && !currentAssignedNames.has(name) && !newLineup.defense.BENCH.includes(name)) {
              newLineup.defense.BENCH.push(name);
          }
      });

      const hasDH = !!(newLineup.defense.DH && newLineup.defense.DH.toString().trim() !== "");
      const activeHitters = new Set(
        Object.keys(newLineup.defense)
          .filter(k => k !== 'BENCH')
          .filter(k => !(hasDH && k === 'P'))
          .map(k => (newLineup.defense[k] || "").toString().trim())
          .filter(n => n !== "")
      );
      
      newLineup.batting = newLineup.batting.map(name => {
          const trimmedName = (name || "").toString().trim();
          return (trimmedName !== "" && activeHitters.has(trimmedName)) ? name : null;
      });

      return newLineup;
    });
    Alert.alert("완료", "배정되지 않은 인원을 모두 후보로 등록했습니다.");
  };

  const isMemberAssigned = (member) => {
    const memberName = (member.Name || member.name || member.User_ID || "").toString().trim();
    if (activeTab === 'defense') {
        const isPos = Object.keys(lineup.defense).filter(k => k !== 'BENCH').some(k => (lineup.defense[k] || "").toString().trim() === memberName);
        const isBench = (lineup.defense.BENCH || []).includes(memberName);
        return isPos || isBench;
    } else {
        return lineup.batting.some(name => (name || "").toString().trim() === memberName);
    }
  };

  const getAssignedKey = (member) => {
    const memberName = (member.Name || member.name || member.User_ID || "").toString().trim();
    if (activeTab === 'defense') {
        const pos = Object.keys(lineup.defense).find(key => key !== 'BENCH' && (lineup.defense[key] || "").toString().trim() === memberName);
        if (pos) return pos;
        if ((lineup.defense.BENCH || []).includes(memberName)) return "후보";
        return null;
    } else {
        const idx = lineup.batting.findIndex(name => (name || "").toString().trim() === memberName);
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
    <View style={styles.container}>
      <DirectorFooter activeTab="leagueGameSchedule" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>라인업 구성 ({targetDate})</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'defense' && styles.activeTab]} 
          onPress={() => setActiveTab('defense')}
        >
          <Text style={[styles.tabText, activeTab === 'defense' && styles.activeTabText]}>수비 위치</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'batting' && styles.activeTab]} 
          onPress={() => setActiveTab('batting')}
        >
          <Text style={[styles.tabText, activeTab === 'batting' && styles.activeTabText]}>타순 설정</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {activeTab === 'defense' ? (
          <View style={styles.fieldSection}>
            <View style={styles.fieldCard}>
              <View style={{flexDirection: 'row', justifyContent: 'space-between', width: '100%'}}>
                  <Text style={styles.sectionTitle}>Defensive Alignment</Text>
                  <TouchableOpacity onPress={handleAutoBench} style={{backgroundColor: 'rgba(74, 124, 89, 0.1)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 5}}>
                      <Text style={{color: '#4a7c59', fontSize: 10, fontWeight: 'bold'}}>나머지 인원 일괄 후보 등록</Text>
                  </TouchableOpacity>
              </View>
              <View style={styles.diamond}>
                  <PositionSlot pos="CF" name={lineup.defense.CF} />
                  <View style={styles.row}>
                      <PositionSlot pos="LF" name={lineup.defense.LF} />
                      <PositionSlot pos="RF" name={lineup.defense.RF} />
                  </View>
                  <View style={styles.row}>
                      <PositionSlot pos="SS" name={lineup.defense.SS} />
                      <PositionSlot pos="2B" name={lineup.defense["2B"]} />
                  </View>
                  <View style={styles.row}>
                      <PositionSlot pos="3B" name={lineup.defense["3B"]} />
                      <PositionSlot pos="1B" name={lineup.defense["1B"]} />
                  </View>
                  <PositionSlot pos="P" name={lineup.defense.P} highlight />
                  <PositionSlot pos="C" name={lineup.defense.C} />
                  <View style={{marginTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(46, 50, 48, 0.08)', width: '100%', alignItems: 'center', paddingTop: 10}}>
                    <PositionSlot pos="DH" name={lineup.defense.DH} />
                  </View>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.battingSection}>
            <View style={styles.battingList}>
              <Text style={styles.sectionTitle}>Batting Order (1-9)</Text>
              {BATTING_ORDERS.map((order, idx) => (
                <TouchableOpacity 
                  key={order} 
                  style={[styles.battingRow, selectedBattingIdx === idx && styles.battingRowActive]}
                  onPress={() => setSelectedBattingIdx(idx)}
                >
                  <Text style={styles.battingOrder}>{order}</Text>
                  {lineup.batting[idx] ? (
                    <Text style={styles.battingName}>{lineup.batting[idx]}</Text>
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
          {attendees.map(member => {
            const memberName = (member.Name || member.name || member.User_ID || "").toString().trim();
            const isDefender = Object.keys(lineup.defense).some(k => k !== 'BENCH' && (lineup.defense[k] || "").toString().trim() === memberName);
            const hasDH = !!(lineup.defense.DH && lineup.defense.DH.toString().trim() !== "");
            const isPitcher = (lineup.defense.P || "").toString().trim() === memberName;
            
            const isEligibleForBatting = isDefender && !(hasDH && isPitcher);
            const assignedPos = getAssignedKey(member);

            return (
              <View key={member.Id || member.id || member.User_ID} style={styles.memberCard}>
                <Text style={styles.memberName}>
                  {member.Name || member.name || member.User_ID}
                  {activeTab === 'defense' && (
                      <Text style={{color: 'rgba(46, 50, 48, 0.5)', fontSize: 12}}> ({member.Primary_Position || '미정'})</Text>
                  )}
                  <Text style={{color: '#705c30', fontSize: 13}}> [{assignedPos || "미배정"}]</Text>
                </Text>
                <View style={styles.posButtons}>
                  {activeTab === 'defense' ? (
                    POSITIONS.map(pos => {
                      const isActive = pos === 'BENCH' 
                        ? (lineup.defense.BENCH || []).includes(memberName) 
                        : (lineup.defense[pos] || "").toString().trim() === memberName;
                      return (
                        <TouchableOpacity 
                          key={pos} 
                          onPress={() => assignMember(pos, member)}
                          style={[styles.posBtn, isActive && styles.posBtnActive]}
                        >
                          <Text style={[styles.posBtnText, isActive && styles.posBtnTextActive]}>{pos}</Text>
                        </TouchableOpacity>
                      );
                    })
                  ) : (
                    <TouchableOpacity 
                      disabled={!isEligibleForBatting}
                      onPress={() => assignMember(null, member)}
                      style={[
                        styles.posBtn, 
                        lineup.batting.some(n => (n || "").toString().trim() === memberName) && styles.posBtnActive, 
                        !isEligibleForBatting && {backgroundColor: 'rgba(46, 50, 48, 0.05)', opacity: 0.5},
                        {paddingHorizontal: 20}
                      ]}
                    >
                      <Text style={[
                        styles.posBtnText, 
                        lineup.batting.some(n => (n || "").toString().trim() === memberName) && styles.posBtnTextActive, 
                        !isEligibleForBatting && {color: 'rgba(46, 50, 48, 0.3)'}
                      ]}>
                        {isEligibleForBatting ? "배정" : (hasDH && isPitcher ? "DH사용됨" : "수비필요")}
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
      <DirectorFooter activeTab="leagueGameSchedule" />
    </View>
  );
};

const PositionSlot = ({ pos, name, highlight }) => (
  <View style={[styles.slot, highlight && styles.slotHighlight]}>
    <Text style={styles.slotPos}>{pos}</Text>
    <Text style={styles.slotName}>{name || "---"}</Text>
  </View>
);

export default LineupScreen;
