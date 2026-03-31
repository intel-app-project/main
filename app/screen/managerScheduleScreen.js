import { useEffect, useMemo, useState } from "react";
import { Text, View, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from "react-native";

import { styles } from "./managerScheduleScreen.styles";
import CommonHeader from "../components/CommonHeader";
import { SafeAreaView } from "react-native-safe-area-context";
import { 
  deleteSchedule, 
  saveSchedule, 
  buildCalendarRows,
  resetScheduleForm 
} from "../utils/scheduleUtils";
import { API_BASE_URL } from "../constants/commonConstants";
import { SCHEDULE_API_ENDPOINT, WEEKDAY_LABELS } from "../constants/scheduleConstants";
import { supabase } from "../lib/supabase"; // 팀 이름을 변환하기 위해 supabase 호출 추가

const ManagerScheduleScreen = ({ navigation }) => {
  const [schedules, setSchedules] = useState([]); // 서버에서 불러온 전체 일정 목록을 저장하는 배열
  const [loading, setLoading] = useState(true); // 화면 첫 로딩 및 데이터 갱신 시 로딩 스피너 표시 여부
  const [error, setError] = useState(null); // API 통신 중 발생한 에러 메시지 저장
  const [teams, setTeams] = useState([]);
  const [teamMap, setTeamMap] = useState({}); // 팀 ID와 팀 이름을 매칭하는 객체 상태 (예: { 1: "야구팀", 2: "축구팀" })

  const todayDateKey = [
    new Date().getFullYear(),
    String(new Date().getMonth() + 1).padStart(2, "0"),
    String(new Date().getDate()).padStart(2, "0"),
  ].join("-");

  // Form State (신규 등록 및 수정 폼에 사용되는 상태들)
  const [date, setDate] = useState(todayDateKey); // 경기 날짜 입력값 (YYYYMMDD 형식 등)
  const [home, setHome] = useState(""); // 홈팀 ID (숫자)
  const [away, setAway] = useState(""); // 원정팀 ID (숫자)
  const [submitting, setSubmitting] = useState(false); // 폼 제출 버튼 연타 방지 및 로딩 상태
  const [editingDate, setEditingDate] = useState(null); // 현재 '수정 모드'인지 판별 (수정 중인 항목의 날짜를 ID 대용으로 가짐)
  const [openSelector, setOpenSelector] = useState(null);
  const [monthDate, setMonthDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));

  useEffect(() => {
    fetchSchedules();
    fetchTeams(); // 컴포넌트 마운트 시 팀 정보도 함께 가져옴
  }, []);

  // 1. 서버에서 팀 전체 목록을 가져와 ID-이름 맵으로 만드는 함수
  const fetchTeams = async () => {
    try {
      const { data, error } = await supabase.from("team").select("id, name");
      if (error) {
        throw error;
      }

      if (data) {
        const sortedTeams = [...data].sort((a, b) => String(a.name).localeCompare(String(b.name), "ko"));
        setTeams(sortedTeams);

        // [ { id: 1, name: "A팀" }, ... ] 배열을 { 1: "A팀", 2: "B팀" } 형태로 매핑!
        const mapping = {};
        sortedTeams.forEach(t => { mapping[t.id] = t.name; });
        setTeamMap(mapping);
      }
    } catch (e) {
      console.log("팀 목록 로드 오류", e);
    }
  };

  // 경기 날짜 서식 수정 함수
  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return dateStr;

    const normalized = String(dateStr).replace(/-/g, "");
    if (normalized.length !== 8) return dateStr;

    const year = normalized.slice(0, 4);
    const month = parseInt(normalized.slice(4, 6), 10);
    const day = parseInt(normalized.slice(6, 8), 10);
    return `${year}년 ${month}월 ${day}일`;
  };

  const toCompactDate = (dateStr) => String(dateStr || "").replace(/-/g, "");

  const toMonthStart = (dateStr) => {
    const normalized = toCompactDate(dateStr);

    if (!normalized || !/^\d{8}$/.test(normalized)) {
      const today = new Date();
      return new Date(today.getFullYear(), today.getMonth(), 1);
    }

    return new Date(
      Number(normalized.slice(0, 4)),
      Number(normalized.slice(4, 6)) - 1,
      1,
    );
  };

  const calendarRows = useMemo(() => buildCalendarRows(monthDate), [monthDate]);
  const scheduledDateSet = useMemo(
    () => new Set(schedules.map((item) => {
      const compactDate = toCompactDate(item.date);
      return compactDate
        ? `${compactDate.slice(0, 4)}-${compactDate.slice(4, 6)}-${compactDate.slice(6, 8)}`
        : "";
    })),
    [schedules],
  );




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
      
      // 기기의 현재 날짜를 YYYYMMDD 형식의 문자열로 생성합니다.
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const currentDateStr = `${year}${month}${day}`;

      // 생성된 현재 날짜와 비교하여 향후 예정된 경기만 필터링합니다.
      const upcomingSchedules = data.filter(item => {
        if (!item.date) return false;
        return item.date >= currentDateStr;
      });

      setSchedules(upcomingSchedules);
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
      Alert.alert("입력 오류", "날짜와 홈팀, 원정팀을 모두 선택해주세요.");
      return;
    }

    if (date < todayDateKey) {
      Alert.alert("입력 오류", "지난 날짜에는 경기를 등록할 수 없습니다.");
      return;
    }

    if (home === away) {
      Alert.alert("입력 오류", "홈팀과 원정팀은 서로 다른 팀이어야 합니다.");
      return;
    }

    setSubmitting(true);
    try {
      // 2. 서버로 전송할 Request Body 데이터 구성 (문자열을 숫자로 변환)
      const payload = {
        date: toCompactDate(date),
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
    const normalizedDate = `${String(item.date).slice(0, 4)}-${String(item.date).slice(4, 6)}-${String(item.date).slice(6, 8)}`;
    setEditingDate(item.date); // 수정 모드로 진입하기 위해 키값 저장
    setDate(normalizedDate);
    setHome(item.home.toString());
    setAway(item.away.toString());
    setMonthDate(toMonthStart(item.date));
  };

  // 폼 하단의 '수정 취소' 버튼 클릭 시, 입력값 초기화 및 신규 등록 모드로 복귀
  const handleCancelEdit = () => {
    resetScheduleForm({ 
      setEditingDate, 
      setDate: () => setDate(todayDateKey), 
      setHome, 
      setAway 
    });
    setOpenSelector(null);
    setMonthDate(toMonthStart(""));
  };

  const handleSelectCalendarDate = (dateKey) => {
    setDate(dateKey);
    setMonthDate(toMonthStart(dateKey));
  };

  const renderTeamSelector = (key, label, selectedTeamId, onSelect, accentStyle) => {
    const isOpen = openSelector === key;
    const selectedLabel = selectedTeamId ? teamMap[selectedTeamId] || `ID ${selectedTeamId}` : "";

    return (
      <View style={styles.teamSelectorBlock}>
        <Text style={styles.teamSelectorLabel}>{label}</Text>
        <TouchableOpacity
          style={[styles.teamDropdownTrigger, accentStyle, isOpen && styles.teamDropdownTriggerOpen]}
          onPress={() => setOpenSelector(isOpen ? null : key)}
        >
          <Text
            style={[
              styles.teamDropdownText,
              selectedLabel && styles.teamDropdownTextSelected,
            ]}
          >
            {selectedLabel || label}
          </Text>
          <Text style={styles.teamDropdownIcon}>{isOpen ? "▲" : "▼"}</Text>
        </TouchableOpacity>

        {isOpen && (
          <View style={styles.teamDropdownMenu}>
            {teams.length === 0 ? (
              <Text style={styles.teamOptionEmpty}>팀 목록을 불러오는 중입니다.</Text>
            ) : (
              teams.map((team) => {
                const teamId = String(team.id);
                const isSelected = selectedTeamId === teamId;

                return (
                  <TouchableOpacity
                    key={teamId}
                    style={[
                      styles.teamDropdownItem,
                      isSelected && styles.teamDropdownItemSelected,
                    ]}
                    onPress={() => {
                      onSelect(teamId);
                      setOpenSelector(null);
                    }}
                  >
                    <Text
                      style={[
                        styles.teamDropdownItemText,
                        isSelected && styles.teamDropdownItemTextSelected,
                      ]}
                    >
                      {team.name}
                    </Text>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}
      </View>
    );
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
        <View style={styles.cardAccent} />
        <View style={styles.cardHeader}>
          <View style={styles.headerMain}>
            <Text style={styles.gameTitle}>{formatDisplayDate(item.date)}</Text>
          </View>
        </View>

        <View style={styles.matchupRow}>
          <View style={[styles.teamPill, styles.homeTeamPill]}>
            <Text style={styles.teamLabel}>HOME</Text>
            <Text style={styles.teamName}>{teamMap[item.home]}</Text>
          </View>
          <Text style={styles.vsText}>VS</Text>
          <View style={[styles.teamPill, styles.awayTeamPill]}>
            <Text style={styles.teamLabel}>AWAY</Text>
            <Text style={styles.teamName}>{teamMap[item.away]}</Text>
          </View>
        </View>

        <View style={styles.cardDivider} />

        <View style={styles.cardFooter}>
          <View style={styles.metaBlock}>
            {item.updated_at ? (
              <Text style={styles.updatedAtText}>수정 {new Date(item.updated_at).toLocaleString('ko-KR')}</Text>
            ) : (
              <Text style={styles.updatedAtPlaceholder}>수정 기록 없음</Text>
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
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <CommonHeader title="managerScheduleScreen" />
      <View style={styles.body}>
        <View style={styles.calendarSection}>
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>신규 일정 등록</Text>
            <View style={styles.calendarCard}>
              <View style={styles.calendarTopRow}>
                <Text style={styles.calendarTitle}>
                  {`${monthDate.getFullYear()}년 ${monthDate.getMonth() + 1}월`}
                </Text>
                <TouchableOpacity
                  style={styles.todayButton}
                  onPress={() => {
                    handleSelectCalendarDate(todayDateKey);
                  }}
                >
                  <Text style={styles.todayButtonText}>오늘</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.calendarBody}>
                <TouchableOpacity
                  style={[styles.calendarSideButton, styles.calendarSideButtonLeft]}
                  onPress={() =>
                    setMonthDate(
                      (current) =>
                        new Date(current.getFullYear(), current.getMonth() - 1, 1),
                    )
                  }
                >
                  <Text style={styles.calendarSideArrow}>‹</Text>
                </TouchableOpacity>

                <View>
                  <View style={styles.weekHeader}>
                    {WEEKDAY_LABELS.map((day) => (
                      <Text key={day} style={styles.weekDay}>
                        {day}
                      </Text>
                    ))}
                  </View>

                  {calendarRows.map((row, rowIndex) => (
                    <View key={`row-${rowIndex}`} style={styles.weekRow}>
                      {row.map((cell) => {
                        const isCurrentMonth = cell.isCurrentMonth;
                        const isSelected = date === cell.dateKey;
                        const hasSchedule = scheduledDateSet.has(cell.dateKey);
                        const isToday = cell.dateKey === todayDateKey;

                        return (
                          <TouchableOpacity
                            key={cell.dateKey}
                            style={styles.dayCell}
                            onPress={() => handleSelectCalendarDate(cell.dateKey)}
                          >
                            <View
                              style={[
                                styles.dayCircle,
                                hasSchedule && styles.dayEvent,
                                isToday && styles.dayToday,
                                isSelected && styles.daySelected,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.dayText,
                                  !isCurrentMonth && styles.dayDim,
                                  hasSchedule && styles.dayEventText,
                                  isSelected && styles.daySelectedText,
                                ]}
                              >
                                {cell.label}
                              </Text>
                              {hasSchedule && !isSelected ? (
                                <View style={styles.dayEventDot} />
                              ) : null}
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  style={[styles.calendarSideButton, styles.calendarSideButtonRight]}
                  onPress={() =>
                    setMonthDate(
                      (current) =>
                        new Date(current.getFullYear(), current.getMonth() + 1, 1),
                    )
                  }
                >
                  <Text style={styles.calendarSideArrow}>›</Text>
                </TouchableOpacity>
              </View>
            </View>

            
            <View style={styles.calendarLegendRow}>
              <View style={styles.calendarLegendItem}>
                <View style={[styles.calendarLegendSwatch, styles.calendarLegendToday]} />
                <Text style={styles.calendarLegendText}>오늘 날짜</Text>
              </View>
              <View style={styles.calendarLegendItem}>
                <View style={[styles.calendarLegendSwatch, styles.calendarLegendSelected]} />
                <Text style={styles.calendarLegendText}>선택 날짜</Text>
              </View>
              <View style={styles.calendarLegendItem}>
                <View style={[styles.calendarLegendSwatch, styles.calendarLegendEvent]} />
                <Text style={styles.calendarLegendText}>예정 경기</Text>
              </View>
              <Text style={styles.dateText}>
                오늘 날짜: {formatDisplayDate(todayDateKey)} | 선택 날짜: {formatDisplayDate(date)}
              </Text>
            </View>
          </View>
        </View>

        <ScrollView
          style={styles.listScroll}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formContainer}>
            <View style={styles.formActionRow}>
              {renderTeamSelector("home", "홈팀", home, setHome, styles.homeTeamOptionAccent)}
              {renderTeamSelector("away", "원정팀", away, setAway, styles.awayTeamOptionAccent)}
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  styles.submitButtonCompact,
                  submitting && styles.submitButtonDisabled,
                  editingDate && styles.updateButton,
                ]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                <Text style={styles.submitButtonText}>
                  {submitting ? (editingDate ? "수정 중..." : "등록 중...") : (editingDate ? "수정 완료" : "등록")}
                </Text>
              </TouchableOpacity>
            </View>

            {editingDate && (
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancelEdit}
              >
                <Text style={styles.cancelButtonText}>수정 취소</Text>
              </TouchableOpacity>
            )}

            <View style={styles.divider} />
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#2563eb" style={styles.loadingIndicator} />
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : schedules.length === 0 ? (
            <Text style={styles.emptyText}>데이터가 없습니다.</Text>
          ) : (
            schedules.map((item, index) => (
              <View key={item.date ? item.date.toString() : index.toString()}>
                {renderItem({ item })}
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default ManagerScheduleScreen;


