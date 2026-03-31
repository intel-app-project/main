import { useEffect, useState } from "react";
import { Text, View, FlatList, TouchableOpacity, ActivityIndicator, TextInput, Alert } from "react-native";

import { styles } from "./managerScheduleScreen.styles";
import CommonHeader from "../components/CommonHeader";
import { SafeAreaView } from "react-native-safe-area-context";
import { 
  deleteSchedule, 
  saveSchedule, 
  resetScheduleForm 
} from "../utils/scheduleUtils";
import { API_BASE_URL } from "../constants/commonConstants";
import { SCHEDULE_API_ENDPOINT } from "../constants/scheduleConstants";
import { supabase } from "../lib/supabase"; // 팀 이름을 변환하기 위해 supabase 호출 추가

const ManagerScheduleScreen = ({ navigation }) => {
  const [schedules, setSchedules] = useState([]); // 서버에서 불러온 전체 일정 목록을 저장하는 배열
  const [loading, setLoading] = useState(true); // 화면 첫 로딩 및 데이터 갱신 시 로딩 스피너 표시 여부
  const [error, setError] = useState(null); // API 통신 중 발생한 에러 메시지 저장
  const [teamMap, setTeamMap] = useState({}); // 팀 ID와 팀 이름을 매칭하는 객체 상태 (예: { 1: "야구팀", 2: "축구팀" })

  // Form State (신규 등록 및 수정 폼에 사용되는 상태들)
  const [date, setDate] = useState(""); // 경기 날짜 입력값 (YYYYMMDD 형식 등)
  const [home, setHome] = useState(""); // 홈팀 ID (숫자)
  const [away, setAway] = useState(""); // 원정팀 ID (숫자)
  const [submitting, setSubmitting] = useState(false); // 폼 제출 버튼 연타 방지 및 로딩 상태
  const [editingDate, setEditingDate] = useState(null); // 현재 '수정 모드'인지 판별 (수정 중인 항목의 날짜를 ID 대용으로 가짐)

  useEffect(() => {
    fetchSchedules();
    fetchTeams(); // 컴포넌트 마운트 시 팀 정보도 함께 가져옴
  }, []);

  // 1. 서버에서 팀 전체 목록을 가져와 ID-이름 맵으로 만드는 함수
  const fetchTeams = async () => {
    try {
      const { data, error } = await supabase.from("team").select("id, name");
      if (data) {
        // [ { id: 1, name: "A팀" }, ... ] 배열을 { 1: "A팀", 2: "B팀" } 형태로 매핑!
        const mapping = {};
        data.forEach(t => { mapping[t.id] = t.name; });
        setTeamMap(mapping);
      }
    } catch (e) {
      console.log("팀 목록 로드 오류", e);
    }
  };

  // 경기 날짜 서식 수정 함수
  const formatDisplayDate = (dateStr) => {
  if (!dateStr || dateStr.length !== 8) return dateStr;
  const year = dateStr.slice(0, 4);
  const month = parseInt(dateStr.slice(4, 6), 10); // 03월을 3월로 앞의 0을 뺌
  const day = parseInt(dateStr.slice(6, 8), 10); // 10일
  return `${year}년 ${month}월 ${day}일`;
};



  // 서버로부터 일정 데이터를 받아와서 화면을 갱신하는 함수
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

  // [등록/수정] 버튼 클릭 이벤트 핸들러
  const handleSubmit = async () => {
    // 1. 필수 입력값 누락 검사
    if (!date || !home || !away) {
      Alert.alert("입력 오류", "날짜, 홈팀, 원정팀 입력값을 확인해주세요.");
      return;
    }

    setSubmitting(true);
    try {
      // 2. 서버로 전송할 Request Body 데이터 구성 (문자열을 숫자로 변환)
      const payload = {
        date: date,
        home: parseInt(home, 10),
        away: parseInt(away, 10)
      };

      // 3. API 요청 (editingDate가 있으면 '수정(PUT)', 없으면 '신규 등록(POST)' 처리됨)
      await saveSchedule(payload, editingDate);
      
      Alert.alert(
        editingDate ? "수정 성공" : "등록 성공", 
        editingDate ? "일정이 성공적으로 수정되었습니다." : "일정이 성공적으로 등록되었습니다."
      );
      
      handleCancelEdit();
      fetchSchedules();
    } catch (e) {
      console.error(editingDate ? "일정 수정 오류:" : "일정 등록 오류:", e);
      Alert.alert(
        editingDate ? "수정 실패" : "등록 실패", 
        editingDate ? "일정 수정 중 오류가 발생했습니다." : "일정 등록 중 오류가 발생했습니다."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // 리스트에서 '수정' 버튼 클릭 시, 폼(Form)에 해당 일정 데이터를 채워 넣음
  const handleEdit = (item) => {
    setEditingDate(item.date); // 수정 모드로 진입하기 위해 키값 저장
    setDate(item.date);
    setHome(item.home.toString());
    setAway(item.away.toString());
  };

  // 폼 하단의 '수정 취소' 버튼 클릭 시, 입력값 초기화 및 신규 등록 모드로 복귀
  const handleCancelEdit = () => {
    resetScheduleForm({ setEditingDate, setDate, setHome, setAway });
  };

  // 지정한 날짜의 일정을 삭제하는 함수 (재차 확인하는 경고창 띄움)
  const handleDelete = (date) => {
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
              await deleteSchedule(date);
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

   // FlatList에 들어갈 각각의 일정 카드 컴포넌트를 정의하는 렌더링 함수
   const renderItem = ({ item }) => {
    return (
      <View style={styles.itemCard}>
         <View style={styles.cardHeader}>
            <View>
<Text style={styles.gameTitle}>경기 날짜 : {formatDisplayDate(item.date)}</Text>
              {item.done === 1 ? (
                <Text style={styles.doneText}>완료</Text>
              ) : (
                <Text style={styles.upcomingText}>예정된 경기</Text>
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
                  onPress={() => handleDelete(item.date)}
                >
                  <Text style={styles.deleteButtonText}>삭제</Text>
                </TouchableOpacity>
             </View>
          </View>
          {/* 팀 ID 대신 매핑된 팀 이름 띄우기 (만약 매핑 안 되면 ID 번호로 떨어짐) */}
          <Text style={styles.itemText}>
            홈팀 : {teamMap[item.home] || `${item.home}`}  🆚  원정팀 : {teamMap[item.away] || `${item.away}`}
          </Text>
          {item.updated_at && (
            <Text style={styles.updatedAtText}>최근 수정: {new Date(item.updated_at).toLocaleString('ko-KR')}</Text>
          )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <CommonHeader title="managerScheduleScreen" />

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
             style={[styles.submitButton, submitting && styles.submitButtonDisabled, editingDate && styles.updateButton]} 
             onPress={handleSubmit} 
             disabled={submitting}
          >
             <Text style={styles.submitButtonText}>
               {submitting ? (editingDate ? "수정 중..." : "등록 중...") : (editingDate ? "일정 수정 완료" : "일정 등록")}
             </Text>
          </TouchableOpacity>
          {editingDate && (
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
            keyExtractor={(item, index) => item.date ? item.date.toString() : index.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>

    </SafeAreaView>
  );
};

export default ManagerScheduleScreen;


