import React, { useEffect, useState } from "react";
import {
  View,
  ScrollView,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { API_BASE_URL } from "../constants/commonConstants";
import { INITIAL_LINEUP } from "../constants/scheduleConstants";
import { parseJsonField } from "../utils/scheduleUtils";
import { styles } from "./TeamInfoScreen.styles";
import CommonHeader from "../components/CommonHeader";
import DirectorFooter from "../components/DirectorFooter";
import PlayerFooter from "../components/PlayerFooter";


const TeamInfoScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { id, isDirector } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [bestLineup, setBestLineup] = useState(INITIAL_LINEUP);
  const [teamInfo, setTeamInfo] = useState(null); // 팀 기본 정보(이름, trait)

  useEffect(() => {
    fetchTeamData();
  }, []);

  const fetchTeamData = async () => {
    try {
      setLoading(true);
      
      // 1. 모든 멤버 정보 가져오기
      const memRes = await fetch(`${API_BASE_URL}/api/member`);
      if (!memRes.ok) throw new Error("멤버 데이터를 불러오지 못했습니다.");
      const memData = await memRes.json();
      
      // 2. 현재 로그인한 사용자의 팀(Team ID) 식별
      // route.params.id는 Id(숫자) 또는 User_ID(문자열)일 수 있음
      const currentUser = memData.find(m => 
        (m.Id && m.Id.toString() === id?.toString()) || 
        (m.User_ID && m.User_ID === id)
      );

      const myTeamId = currentUser?.Team;

      // 3. 팀 정보 가져오기
      const teamRes = await fetch(`${API_BASE_URL}/api/team`);
      if (teamRes.ok) {
        const teamListData = await teamRes.json();
        const currentTeam = teamListData.find(t => t.id === myTeamId);
        setTeamInfo(currentTeam);
      }
      
      // 4. 소속 팀원만 필터링 (팀이 없는 경우는 제외)
      const teamMembers = myTeamId 
        ? memData.filter(m => m.Team === myTeamId)
        : [];

      // 정렬: 번호(Num) 순으로 정렬 (숫자 변환 필요)
      const sortedMembers = teamMembers.sort((a, b) => {
        const numA = parseInt(a.Num || "0", 10);
        const numB = parseInt(b.Num || "0", 10);
        return numA - numB;
      });
      setMembers(sortedMembers);

      // 5. 'BEST' 키워드로 저장된 베스트 라인업 가져오기
      const lineupRes = await fetch(`${API_BASE_URL}/api/schedule/date/BEST`);
      if (lineupRes.ok) {
        const lineupData = await lineupRes.json();
        if (lineupData && lineupData.length > 0) {
          const bestSched = lineupData[0];
          // 본인의 팀이 홈이면 home_lineup, 어웨이면 away_lineup 사용
          const bestLineupRaw = (bestSched.home === myTeamId) 
            ? bestSched.home_lineup 
            : (bestSched.away === myTeamId ? bestSched.away_lineup : (bestSched.home_lineup || bestSched.away_lineup));
            
          if (bestLineupRaw) {
            setBestLineup(parseJsonField(bestLineupRaw));
          }
        }
      }
    } catch (error) {
      console.error("[TeamInfoScreen] Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  // ID를 이름으로 변환하는 헬퍼 함수
  const getNameById = (id) => {
    if (!id) return "---";
    // teamMembers뿐만 아니라 전체 멤버(또는 현재 불러온 members)에서 검색
    const member = members.find(m => 
      (m.Id && m.Id.toString() === id.toString()) || 
      (m.User_ID && m.User_ID === id.toString())
    );
    return member ? (member.Name || member.name) : id;
  };

  const PositionSlot = ({ pos, idValue }) => (
    <View style={styles.slotStadium}>
      <Text style={styles.slotPosStadium}>{pos}</Text>
      <Text style={styles.slotNameStadium} numberOfLines={1}>
        {getNameById(idValue)}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <CommonHeader title="팀 정보" />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#4a7c59" />
          <Text style={{ marginTop: 12, color: "#4a7c59" }}>팀 정보를 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <CommonHeader title="TeamInfoScreen" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* 최상단: 팀 기본 정보 섹션 */}
        <View style={styles.teamInfoSection}>
          <View style={styles.teamInfoCard}>
            <View style={styles.teamLogoPlaceholder}>
              <Text style={styles.teamLogoText}>
                {teamInfo?.name ? teamInfo.name[0] : "T"}
              </Text>
            </View>
            <View style={styles.teamTextContainer}>
              <Text style={styles.teamName}>
                {teamInfo?.name || "소속 팀 없음"}
              </Text>
              <Text style={styles.teamTrait}>
                {teamInfo?.trait || "팀 설명이 등록되지 않았습니다."}
              </Text>
            </View>
          </View>
        </View>

        {/* 상단: 베스트 라인업 (야구장 UI) */}
        <View style={styles.fieldSection}>
          <View style={styles.fieldCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>베스트 라인업</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>BEST 9</Text>
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

              {/* 포지션 배치 (ID 기반 렌더링) */}
              <View style={styles.posP}><PositionSlot pos="P" idValue={bestLineup.defense.P} /></View>
              <View style={styles.posC}><PositionSlot pos="C" idValue={bestLineup.defense.C} /></View>
              <View style={styles.pos1B}><PositionSlot pos="1B" idValue={bestLineup.defense["1B"]} /></View>
              <View style={styles.pos2B}><PositionSlot pos="2B" idValue={bestLineup.defense["2B"]} /></View>
              <View style={styles.pos3B}><PositionSlot pos="3B" idValue={bestLineup.defense["3B"]} /></View>
              <View style={styles.posSS}><PositionSlot pos="SS" idValue={bestLineup.defense.SS} /></View>
              <View style={styles.posLF}><PositionSlot pos="LF" idValue={bestLineup.defense.LF} /></View>
              <View style={styles.posCF}><PositionSlot pos="CF" idValue={bestLineup.defense.CF} /></View>
              <View style={styles.posRF}><PositionSlot pos="RF" idValue={bestLineup.defense.RF} /></View>
              <View style={styles.posDH}><PositionSlot pos="DH" idValue={bestLineup.defense.DH} /></View>
            </View>
          </View>
        </View>

        {/* 하단: 팀 전체 멤버 리스트 */}
        <View style={styles.listSection}>
          <View style={styles.listCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>전체 멤버</Text>
              <Text style={{ fontSize: 13, color: "rgba(46, 50, 48, 0.4)" }}>{members.length}명 대기 중</Text>
            </View>

            {members.length > 0 ? (
              members.map((member) => (
                <TouchableOpacity 
                  key={member.Id || member.id || member.User_ID} 
                  style={styles.memberItem}
                  onPress={() => navigation.navigate("PlayerDetail", { id: member.Id || member.User_ID, isDirector })}
                >
                  <View style={styles.memberInfo}>
                    <View style={styles.memberAvatar}>
                      <Text style={styles.memberAvatarText}>
                        {(member.Name || member.name || "P")[0]}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.memberName}>{member.Name || member.name}</Text>
                      <Text style={styles.memberPos}>{member.Primary_Position || "미지정"}</Text>
                    </View>
                  </View>
                  <Text style={styles.memberNum}>#{member.Num || "00"}</Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.emptyText}>소속된 멤버가 없습니다.</Text>
            )}
          </View>
        </View>

      </ScrollView>

      {/* Footer 분기처리 */}
      {isDirector ? (
        <DirectorFooter activeTab="LeagueSchedule" />
      ) : (
        <PlayerFooter activeTab="LeagueSchedule" />
      )}
    </SafeAreaView>
  );
};

export default TeamInfoScreen;
