import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { API_BASE_URL } from "../constants/commonConstants";
import { supabase } from "../lib/supabase";
import { styles } from "./DirectorScheduleScreen.styles";
import DirectorFooter from "../components/DirectorFooter";


const DirectorScheduleScreen = ({navigation, route}) => {
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [teamId, setTeamId] = useState(null);

    useEffect(() => {
        fetchTeamInfo();
    }, []);

    const fetchTeamInfo = async () => {
        try {
            const { id } = route.params || {};
            if (!id) {
                console.error("No ID provided in route params");
                setLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from("member")
                .select("Team")
                .eq("ID", id)
                .single();

            if (error) {
                const { data: data2, error: error2 } = await supabase
                    .from("member")
                    .select("Team")
                    .eq("Id", id)
                    .single();
                
                if (error2) throw error2;
                setTeamId(data2.Team);
            } else {
                setTeamId(data.Team);
            }
        } catch (e) {
            console.error("Error fetching team info:", e);
            Alert.alert("오류", "팀 정보를 불러오지 못했습니다.");
            setLoading(false);
        }
    };

    useEffect(() => {
        if (teamId !== null) {
            fetchSchedules();
        }
    }, [teamId]);

    const fetchSchedules = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/api/schedule/team/${teamId}`);
            if (!response.ok) throw new Error("일정 로드 실패");
            const data = await response.json();
            setSchedules(data);
        } catch (e) {
            Alert.alert("오류", "경기 일정을 불러오지 못했습니다.");
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr || dateStr.length !== 8) return dateStr;
        return `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
    };

    return (
        <View style={styles.container}>
            <DirectorFooter activeTab="leagueGameSchedule" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backBtn}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>라인업 관리 - 경기 선택</Text>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#4a7c59" />
                </View>
            ) : schedules.length === 0 ? (
                <View style={styles.center}>
                    <Text style={styles.emptyText}>예정된 경기가 없습니다.</Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <Text style={styles.subTitle}>감독님 팀(Team {teamId})의 예정된 경기 목록입니다.</Text>
                    {schedules.map((item) => {
                        const isHome = item.home === teamId;
                        return (
                            <TouchableOpacity 
                                key={item.id} 
                                style={styles.card}
                                onPress={() => navigation.navigate("Lineup", { targetDate: item.date })}
                            >
                                <View style={styles.cardLeft}>
                                    <View style={styles.dateContainer}>
                                        <Text style={styles.dateText}>{formatDate(item.date)}</Text>
                                        <View style={[styles.tag, isHome ? styles.homeTag : styles.awayTag]}>
                                            <Text style={[styles.tagText, !isHome && styles.awayTagText]}>
                                                {isHome ? "HOME" : "AWAY"}
                                            </Text>
                                        </View>
                                    </View>
                                    <Text style={styles.matchText}>
                                        {isHome ? `vs Team ${item.away}` : `at Team ${item.home}`}
                                    </Text>
                                </View>
                                <Text style={styles.arrow}>〉</Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            )}
            <DirectorFooter activeTab="leagueGameSchedule" />
        </View>
    );
};

export default DirectorScheduleScreen;
