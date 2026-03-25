import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator, TextInput, Alert } from "react-native";

const API_BASE_URL = "http://172.30.1.84:8000";
const SCHEDULE_API_ENDPOINT = "/api/schedule";

const ScheduleScreen = ({ onNavigate }) => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form State
  const [date, setDate] = useState("");
  const [home, setHome] = useState("");
  const [away, setAway] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}${SCHEDULE_API_ENDPOINT}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (!response.ok) {
         throw new Error(`HTTP 오류 ${response.status}`);
      }
      const data = await response.json();
      setSchedules(data);
    } catch (e) {
      clearTimeout(timeoutId);
      console.log("일정 목록 로드 오류", e);
      if (e.name === 'AbortError') {
        setError("서버 응답이 5초를 초과했습니다. 백엔드 IP 주소를 확인해 주세요.");
      } else {
        setError("서버에 연결할 수 없거나 요청 중 문제가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!date || !home || !away) {
      Alert.alert("입력 오류", "날짜, 홈팀, 원정팀 입력값을 확인해주세요.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        date: date,
        home: parseInt(home, 10),
        away: parseInt(away, 10)
      };

      const response = await fetch(`${API_BASE_URL}${SCHEDULE_API_ENDPOINT}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP 상태 코드 ${response.status}`);
      }
      
      const result = await response.json();
      Alert.alert("등록 성공", "일정이 성공적으로 등록되었습니다.");
      
      setDate("");
      setHome("");
      setAway("");
      
      fetchSchedules(); // 목록 즉시 갱신
    } catch (e) {
      console.error("일정 등록 오류:", e);
      Alert.alert("등록 실패", "일정 등록 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderItem = ({ item }) => {
    return (
      <View style={styles.itemCard}>
         <View style={styles.cardHeader}>
            <Text style={styles.gameTitle}>경기 날짜: {item.date}</Text>
            {item.done === 1 ? (
               <Text style={styles.doneText}>완료</Text>
            ) : (
               <Text style={styles.upcomingText}>예정</Text>
            )}
         </View>
         <Text style={styles.itemText}>홈팀 ID: {item.home} / 원정팀 ID: {item.away}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>경기 일정 관리</Text>

      {/* 등록 폼 */}
      <View style={styles.formContainer}>
         <Text style={styles.formTitle}>신규 일정 등록</Text>
         <TextInput
            style={styles.input}
            placeholder="경기 날짜 (예: 20250310)"
            value={date}
            onChangeText={setDate}
         />
         <TextInput
            style={styles.input}
            placeholder="홈팀 ID (숫자)"
            value={home}
            onChangeText={setHome}
            keyboardType="numeric"
         />
         <TextInput
            style={styles.input}
            placeholder="원정팀 ID (숫자)"
            value={away}
            onChangeText={setAway}
            keyboardType="numeric"
         />
         <TouchableOpacity 
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]} 
            onPress={handleSubmit} 
            disabled={submitting}
         >
            <Text style={styles.submitButtonText}>{submitting ? "등록 중..." : "일정 등록"}</Text>
         </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      {/* 목록 리스트 */}
      <View style={styles.listContainer}>
        {loading ? (
          <ActivityIndicator size="large" color="#2563eb" style={{ flex: 1 }} />
        ) : error ? (
           <Text style={styles.errorText}>{error}</Text>
        ) : schedules.length === 0 ? (
          <Text style={styles.emptyText}>데이터가 없습니다.</Text>
        ) : (
          <FlatList
            data={schedules}
            keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>

      <TouchableOpacity style={styles.backButton} onPress={() => onNavigate('recorder')}>
         <Text style={styles.backButtonText}>돌아가기</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ScheduleScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#faf6f0",
    paddingTop: 60,
    width: "100%",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#4a7c59",
    paddingHorizontal: 24,
    marginBottom: 10,
  },
  formContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    color: "#705c30"
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: "rgba(74, 124, 89, 0.2)",
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    backgroundColor: "#faf6f0",
    fontSize: 15
  },
  submitButton: {
    height: 52,
    backgroundColor: "#4a7c59",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  submitButtonDisabled: {
    backgroundColor: "rgba(74, 124, 89, 0.4)",
  },
  submitButtonText: {
    color: "#faf6f0",
    fontSize: 16,
    fontWeight: "bold",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(74, 124, 89, 0.1)",
    marginVertical: 10,
    marginHorizontal: 24
  },
  listContainer: {
    flex: 1,
    width: "100%"
  },
  listContent: {
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  itemCard: {
    padding: 24,
    borderRadius: 12,
    backgroundColor: "#faf6f0",
    marginBottom: 16,
    shadowColor: "#2e3230",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(74, 124, 89, 0.1)',
    paddingBottom: 4,
  },
  gameTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#303a31',
  },
  doneText: {
    fontSize: 14,
    color: '#4a7c59',
    fontWeight: '700'
  },
  upcomingText: {
    fontSize: 14,
    color: '#705c30',
    fontWeight: '700'
  },
  itemText: {
    fontSize: 14,
    color: "#4b5563",
  },
  emptyText: {
    fontSize: 16,
    color: "#6b7280",
    marginTop: 40,
    textAlign: "center",
  },
  errorText: {
    fontSize: 16,
    color: "#705c30",
    marginTop: 40,
    textAlign: "center",
  },
  backButton: {
    marginHorizontal: 24,
    height: 52,
    borderRadius: 12,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#4a7c59",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 40,
    marginTop: 10,
  },
  backButtonText: {
    color: "#4a7c59",
    fontSize: 16,
    fontWeight: "700",
  }
});
