import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { API_BASE_URL } from "../constants/commonConstants";

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
                    <ActivityIndicator size="large" color="#ffb599" />
                </View>
            ) : schedules.length === 0 ? (
                <View style={styles.center}>
                    <Text style={styles.emptyText}>예정된 경기가 없습니다.</Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <Text style={styles.subTitle}>감독님 팀(Team {teamId})의 예정된 경기 목록입니다.</Text>
                    {schedules.map((item) => (
                        <TouchableOpacity 
                            key={item.id} 
                            style={styles.card}
                            onPress={() => navigation.navigate("Lineup", { targetDate: item.date })}
                        >
                            <View style={styles.cardLeft}>
                                <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 5}}>
                                    <Text style={styles.dateText}>{formatDate(item.date)}</Text>
                                    <View style={[styles.tag, item.home === teamId ? styles.homeTag : styles.awayTag]}>
                                        <Text style={styles.tagText}>{item.home === teamId ? "HOME" : "AWAY"}</Text>
                                    </View>
                                </View>
                                <Text style={styles.matchText}>
                                    {item.home === teamId ? `vs Team ${item.away}` : `at Team ${item.home}`}
                                </Text>
                            </View>
                            <Text style={styles.arrow}>〉</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#121212",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
        backgroundColor: "#1a1a1a",
    },
    backBtn: {
        fontSize: 24,
        color: "#fff",
        marginRight: 15,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#fff",
    },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    scrollContent: {
        padding: 20,
    },
    subTitle: {
        color: "rgba(255,255,255,0.6)",
        fontSize: 14,
        marginBottom: 20,
    },
    card: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#1e1e1e",
        borderRadius: 12,
        padding: 20,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: "rgba(255,181,153,0.2)",
    },
    cardLeft: {
        flex: 1,
    },
    dateText: {
        color: "#ffb599",
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 5,
    },
    matchText: {
        color: "#fff",
        fontSize: 14,
        opacity: 0.8,
    },
    arrow: {
        color: "rgba(255,181,153,0.5)",
        fontSize: 20,
    },
    emptyText: {
        color: "rgba(255,255,255,0.4)",
        fontSize: 16,
    },
    tag: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        marginLeft: 10,
    },
    homeTag: {
        backgroundColor: "rgba(255,181,153,0.2)",
    },
    awayTag: {
        backgroundColor: "rgba(100,149,237,0.2)",
    },
    tagText: {
        fontSize: 10,
        fontWeight: "bold",
        color: "#fff",
    }
});

export default DirectorScheduleScreen;
