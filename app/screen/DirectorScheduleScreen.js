import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { API_BASE_URL } from "../constants/commonConstants";
import { styles } from "./DirectorScheduleScreen.styles";

const DirectorScheduleScreen = () => {
    const navigation = useNavigation();
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const teamId = 1; // 현재 1팀 감독으로 가정

    useEffect(() => {
        fetchSchedules();
    }, []);

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
        </View>
    );
};

export default DirectorScheduleScreen;
