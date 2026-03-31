import { useState, useCallback } from "react";
import {
  View,
  ScrollView,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { API_BASE_URL } from "../constants/commonConstants";
import { INITIAL_LINEUP } from "../constants/scheduleConstants";
import { parseJsonField } from "../utils/scheduleUtils";
import { styles } from "./teamInfoScreen.styles";
import CommonHeader from "../components/CommonHeader";
import { SvgUri } from "react-native-svg";

const TeamInfoScreen = ({ route }) => {
  const navigation = useNavigation();
  const { id: routeId, isDirector } = route.params;
  const id = Number(routeId);

  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [bestLineup, setBestLineup] = useState(INITIAL_LINEUP);
  const [teamInfo, setTeamInfo] = useState(null);

  useFocusEffect(
    useCallback(() => {
      fetchTeamData();
    }, [])
  );

  const fetchTeamData = async () => {
    try {
      setLoading(true);

      // 1. 모든 멤버 정보 가져오기
      const memRes = await fetch(`${API_BASE_URL}/api/member`);
      if (!memRes.ok) throw new Error("멤버 데이터를 불러오지 못했습니다.");
      const memData = await memRes.json();

      // 2. 현재 로그인한 사용자의 팀(Team ID) 식별
      // route.params.id는 Id(숫자 PK)임
      const currentUser = memData.find((m) => m.Id === id);
      const myTeamId = currentUser?.Team;

      // 3. 팀 정보 가져오기 (특정 팀 ID 기준)
      if (myTeamId) {
        const teamRes = await fetch(`${API_BASE_URL}/api/team/${myTeamId}`);
        if (teamRes.ok) {
          const teamData = await teamRes.json();
          setTeamInfo(teamData);

          // 5. 팀 테이블의 best_member 데이터 우선 사용
          if (teamData?.best_member) {
            let parsed = parseJsonField(teamData.best_member);
            // 구조 보정
            if (parsed && !parsed.defense) {
              parsed = { defense: parsed, batting: [] };
            }
            setBestLineup(parsed || INITIAL_LINEUP);
          }
        }
      }

      // 4. 소속 팀원만 필터링 및 정렬
      if (myTeamId) {
        const teamMembers = memData.filter((m) => m.Team === myTeamId);
        const sortedMembers = teamMembers.sort((a, b) => {
          const numA = parseInt(a.Num || "0", 10);
          const numB = parseInt(b.Num || "0", 10);
          return numA - numB;
        });
        setMembers(sortedMembers);
      }
    } catch (error) {
      console.error("[TeamInfoScreen] Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  // ID를 기반으로 멤버 정보를 가져오는 헬퍼 함수
  const getMemberById = (id) => {
    if (!id) return null;
    return members.find((m) => m.Id === id);
  };

  const PositionSlot = ({ pos, idValue }) => {
    const member = getMemberById(idValue);
    const displayName = member ? member.Name : "---";

    return (
      <TouchableOpacity 
        style={styles.slotStadium}
        onPress={() => {
          if (idValue) {
            navigation.navigate("PlayerDetail", {
              id: idValue,
              loginId: id,
              isDirector,
            });
          }
        }}
        activeOpacity={0.7}
      >
        {member && (
          <View style={styles.slotAvatarContainer}>
            <SvgUri
              uri={`https://api.dicebear.com/9.x/adventurer/svg?seed=${displayName}`}
              width="100%"
              height="100%"
            />
          </View>
        )}
        <View style={styles.slotBottomRow}>
          <Text style={styles.slotNameStadium} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={styles.slotPosStadium}>{pos}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <CommonHeader title="팀 정보" />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#4a7c59" />
          <Text style={{ marginTop: 12, color: "#4a7c59" }}>
            팀 정보를 불러오는 중...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <CommonHeader title="TeamInfoScreen" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 최상단: 팀 기본 정보 섹션 */}
        <View style={styles.teamInfoSection} >
          <View style={styles.teamInfoCard}>
            <View style={styles.teamLogoPlaceholder}>
              {teamInfo?.emblem ? (
                <SvgUri
                  uri={teamInfo.emblem}
                  width={50}
                  height={50}
                  preserveAspectRatio="xMidYMid meet"
                />
              ) : (
                <Text style={styles.teamLogoText}>
                  {teamInfo?.name ? teamInfo.name[0] : "T"}
                </Text>
              )}
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
              {isDirector ? (
                <TouchableOpacity 
                   onPress={() => navigation.navigate("BestMember", { id })}
                   style={[styles.badge, { backgroundColor: '#4a7c59' }]}
                >
                  <Text style={[styles.badgeText, { color: '#fff' }]}>관리하기</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>BEST 10</Text>
                </View>
              )}
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
              <View style={styles.posP}>
                <PositionSlot pos="P" idValue={bestLineup.defense.P} />
              </View>
              <View style={styles.posC}>
                <PositionSlot pos="C" idValue={bestLineup.defense.C} />
              </View>
              <View style={styles.pos1B}>
                <PositionSlot pos="1B" idValue={bestLineup.defense["1B"]} />
              </View>
              <View style={styles.pos2B}>
                <PositionSlot pos="2B" idValue={bestLineup.defense["2B"]} />
              </View>
              <View style={styles.pos3B}>
                <PositionSlot pos="3B" idValue={bestLineup.defense["3B"]} />
              </View>
              <View style={styles.posSS}>
                <PositionSlot pos="SS" idValue={bestLineup.defense.SS} />
              </View>
              <View style={styles.posLF}>
                <PositionSlot pos="LF" idValue={bestLineup.defense.LF} />
              </View>
              <View style={styles.posCF}>
                <PositionSlot pos="CF" idValue={bestLineup.defense.CF} />
              </View>
              <View style={styles.posRF}>
                <PositionSlot pos="RF" idValue={bestLineup.defense.RF} />
              </View>
              <View style={styles.posDH}>
                <PositionSlot pos="DH" idValue={bestLineup.defense.DH} />
              </View>
            </View>
          </View>
        </View>

        {/* 하단: 팀 전체 멤버 리스트 */}
        <View style={styles.listSection}>
          <View style={styles.listCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>전체 멤버</Text>
              <Text style={{ fontSize: 13, color: "rgba(46, 50, 48, 0.4)" }}>
                {members.length}명 대기 중
              </Text>
            </View>

            {members.length > 0 ? (
              <View style={styles.rosterGrid}>
                {members.map((member) => (
                  <TouchableOpacity
                    key={member.Id}
                    style={styles.playerCard}
                    onPress={() =>
                      navigation.navigate("PlayerDetail", {
                        id: member.Id,
                        loginId: id,
                        isDirector,
                      })
                    }
                  >
                    <View style={styles.playerAvatarContainer}>
                      <SvgUri
                        uri={`https://api.dicebear.com/9.x/adventurer/svg?seed=${member.Name}`}
                        width="100%"
                        height="100%"
                      />
                    </View>
                    <Text style={styles.playerNameText} numberOfLines={1}>
                      {member.Name}
                    </Text>
                    <Text style={styles.playerMeta} numberOfLines={1}>
                      #{member.Num || "00"} · {member.Primary_Position || "미정"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyText}>소속된 멤버가 없습니다.</Text>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default TeamInfoScreen;
