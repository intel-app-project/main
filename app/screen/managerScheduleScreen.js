import { useEffect, useState } from "react";
import { Text, View, FlatList, TouchableOpacity, ActivityIndicator, TextInput, Alert } from "react-native";

import { styles } from "./managerScheduleScreen.styles";
import { 
  deleteSchedule, 
  saveSchedule, 
  resetScheduleForm 
} from "../utils/scheduleUtils";
import { API_BASE_URL } from "../constants/commonConstants";
import { SCHEDULE_API_ENDPOINT } from "../constants/scheduleConstants";

const ManagerScheduleScreen = ({ navigation }) => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form State
  const [date, setDate] = useState("");
  const [home, setHome] = useState("");
  const [away, setAway] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null); // 수정 중인 항목의 ID

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

      await saveSchedule(payload, editingId);
      
      Alert.alert(
        editingId ? "수정 성공" : "등록 성공", 
        editingId ? "일정이 성공적으로 수정되었습니다." : "일정이 성공적으로 등록되었습니다."
      );
      
      handleCancelEdit();
      fetchSchedules();
    } catch (e) {
      console.error(editingId ? "일정 수정 오류:" : "일정 등록 오류:", e);
      Alert.alert(
        editingId ? "수정 실패" : "등록 실패", 
        editingId ? "일정 수정 중 오류가 발생했습니다." : "일정 등록 중 오류가 발생했습니다."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setDate(item.date);
    setHome(item.home.toString());
    setAway(item.away.toString());
  };

  const handleCancelEdit = () => {
    resetScheduleForm({ setEditingId, setDate, setHome, setAway });
  };

  const handleDelete = (id) => {
    Alert.alert(
      "일정 삭제",
      "정말로 이 일정을 삭제하시겠습니까?",
      [
        { text: "취소", style: "cancel" },
        { 
          text: "삭제", 
          style: "destructive", 
          onPress: async () => {
            try {
              await deleteSchedule(id);
              Alert.alert("삭제 완료", "일정이 성공적으로 삭제되었습니다.");
              fetchSchedules();
            } catch (e) {
              console.error("삭제 오류:", e);
              Alert.alert("삭제 실패", "일정 삭제 중 문제가 발생했습니다.");
            }
          }
        }
      ]
    );
  };

   const renderItem = ({ item }) => {
    return (
      <View style={styles.itemCard}>
         <View style={styles.cardHeader}>
            <View>
              <Text style={styles.gameTitle}>경기 날짜: {item.date}</Text>
              {item.done === 1 ? (
                <Text style={styles.doneText}>완료</Text>
              ) : (
                <Text style={styles.upcomingText}>예정</Text>
              )}
            </View>
             <View style={styles.actionButtons}>
               <TouchableOpacity 
                 style={styles.editButton} 
                 onPress={() => handleEdit(item)}
               >
                 <Text style={styles.editButtonText}>수정</Text>
               </TouchableOpacity>
               <TouchableOpacity 
                 style={styles.deleteButton} 
                 onPress={() => handleDelete(item.id)}
               >
                 <Text style={styles.deleteButtonText}>삭제</Text>
               </TouchableOpacity>
             </View>
          </View>
          <Text style={styles.itemText}>홈팀 ID: {item.home} / 원정팀 ID: {item.away}</Text>
          {item.updated_at && (
            <Text style={styles.updatedAtText}>최근 수정: {new Date(item.updated_at).toLocaleString('ko-KR')}</Text>
          )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>!!경기 일정 관리</Text>

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
             style={[styles.submitButton, submitting && styles.submitButtonDisabled, editingId && styles.updateButton]} 
             onPress={handleSubmit} 
             disabled={submitting}
          >
             <Text style={styles.submitButtonText}>
               {submitting ? (editingId ? "수정 중..." : "등록 중...") : (editingId ? "일정 수정 완료" : "일정 등록")}
             </Text>
          </TouchableOpacity>
          {editingId && (
            <TouchableOpacity 
               style={styles.cancelButton} 
               onPress={handleCancelEdit}
            >
               <Text style={styles.cancelButtonText}>수정 취소</Text>
            </TouchableOpacity>
          )}
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

      <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('Login')}>
         <Text style={styles.backButtonText}>돌아가기</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ManagerScheduleScreen;


