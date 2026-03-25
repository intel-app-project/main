import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { supabase } from '../lib/supabase';

// 한국어 설정
LocaleConfig.locales['ko'] = {
  monthNames: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
  monthNamesShort: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
  dayNames: ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'],
  dayNamesShort: ['일', '월', '화', '수', '목', '금', '토'],
  today: '오늘'
};
LocaleConfig.defaultLocale = 'ko';

const ScheduleScreen = ({ onNavigate, user }) => {
  const [schedules, setSchedules] = useState([]);
  const [teams, setTeams] = useState({});
  const [markedDates, setMarkedDates] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // 데이터 불러오기
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. 일정 데이터 조회
      const { data: scheduleData, error: scheduleError } = await supabase
        .from('schedule')
        .select('*')
        .is('deleted_at', null)
        .order('date', { ascending: true });

      if (scheduleError) throw scheduleError;

      // 2. 팀 정보 조회
      const { data: teamData, error: teamError } = await supabase
        .from('team')
        .select('id, name');

      if (!teamError && teamData) {
        const teamMap = {};
        teamData.forEach(t => teamMap[t.id] = t.name);
        setTeams(teamMap);
      }

      setSchedules(scheduleData);
      processMarkedDates(scheduleData);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      Alert.alert('오류', '일정을 불러오는 중 문제가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [user.Id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 달력 마킹 처리
  const processMarkedDates = (data) => {
    const marks = {};
    data.forEach((item) => {
      const dateStr = formatDate(item.date);
      const isDone = item.done === 1;
      const attendance = item.home_member ? item.home_member[user.Id] : undefined;

      if (isDone) {
        // 지난 게임: 회색 동그라미
        marks[dateStr] = {
          customStyles: {
            container: { backgroundColor: '#d1d5db', borderRadius: 100 },
            text: { color: 'white' }
          }
        };
      } else {
        // 예정 게임
        let bgColor = '#d1d5db'; // 미응답 (-) (Default: grey)
        if (attendance === 1) bgColor = '#4a7c59'; // 참석 (O) (Green)
        else if (attendance === 0) bgColor = '#b83230'; // 불참 (X) (Red)
        
        marks[dateStr] = {
          customStyles: {
            container: { 
              backgroundColor: bgColor, 
              borderRadius: 100 
            },
            text: { color: 'white' }
          }
        };
      }
    });

    // 오늘 날짜 표시 추가 (일정이 없는 날이어도 오늘임을 알 수 있게)
    const todayStr = new Date().toISOString().split('T')[0];
    if (!marks[todayStr]) {
      marks[todayStr] = {
        customStyles: {
          container: { 
            borderWidth: 1.5,
            borderColor: '#4a7c59', 
            borderRadius: 100 
          },
          text: { color: '#4a7c59', fontWeight: 'bold' }
        }
      };
    }

    setMarkedDates(marks);
  };

  // 날짜 형식 변환 (20250303 -> 2025-03-03)
  const formatDate = (dateStr) => {
    if (!dateStr || dateStr.length !== 8) return dateStr;
    return `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
  };

  // 출석 체크 처리
  const handleAttendance = async (status) => {
    if (!selectedSchedule) return;

    try {
      const currentHomeMember = selectedSchedule.home_member || {};
      const updatedHomeMember = { ...currentHomeMember, [user.Id]: status };

      const { error } = await supabase
        .from('schedule')
        .update({ home_member: updatedHomeMember })
        .eq('id', selectedSchedule.id);

      if (error) throw error;

      setModalVisible(false);
      fetchData(); // 데이터 갱신
    } catch (error) {
      console.error('Error updating attendance:', error);
      Alert.alert('오류', '출석 체크 처리 중 문제가 발생했습니다.');
    }
  };

  const renderScheduleItem = ({ item }) => {
    const isDone = item.done === 1;
    if (isDone) return null; // 예정된 일정만 리스트에 표시

    const dateStr = formatDate(item.date);
    const attendance = item.home_member ? item.home_member[user.Id] : undefined;

    const homeTeam = teams[item.home] || '정기';
    const awayTeam = teams[item.away] || '경기';

    return (
      <TouchableOpacity 
        style={styles.scheduleItem}
        onPress={() => {
          setSelectedSchedule(item);
          setModalVisible(true);
        }}
      >
        <View style={styles.dateBadge}>
          <Text style={styles.dateText}>{dateStr.substring(5)}</Text>
        </View>
        <View style={styles.scheduleInfo}>
          <Text style={styles.scheduleTitle}>{homeTeam} vs {awayTeam}</Text>
          <Text style={styles.scheduleStatus}>
            {attendance === 1 ? '참석' : attendance === 0 ? '불참' : '미응답'}
          </Text>
        </View>
        <View style={[
          styles.statusIndicator, 
          { backgroundColor: attendance === 1 ? '#4a7c59' : attendance === 0 ? '#b83230' : '#d1d5db' }
        ]}>
          <Text style={styles.indicatorText}>
            {attendance === 1 ? 'O' : attendance === 0 ? 'X' : '-'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Schedule</Text>
        <TouchableOpacity onPress={() => onNavigate('login')}>
          <Text style={styles.logoutBtn}>Logout</Text>
        </TouchableOpacity>
      </View>

      <Calendar
        theme={{
          backgroundColor: '#faf6f0',
          calendarBackground: '#faf6f0',
          selectedDayBackgroundColor: '#4a7c59',
          todayTextColor: '#4a7c59',
          arrowColor: '#4a7c59',
          monthTextColor: '#2e3230',
          textSectionTitleColor: '#705c30',
        }}
        markingType={'custom'}
        markedDates={markedDates}
      />

      <View style={styles.listSection}>
        <Text style={styles.listTitle}>Upcoming Games</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#4a7c59" style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            data={schedules.filter(s => {
              const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
              return s.done === 0 && s.date >= today;
            })}
            renderItem={renderScheduleItem}
            keyExtractor={(item) => item.date}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={<Text style={styles.emptyText}>예정된 일정이 없습니다.</Text>}
          />
        )}
      </View>

      {/* 출석 체크 모달 */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>참석 여부 확인</Text>
            <Text style={styles.modalVs}>
              {selectedSchedule && `${teams[selectedSchedule.home] || ''} vs ${teams[selectedSchedule.away] || ''}`}
            </Text>
            <Text style={styles.modalDate}>{selectedSchedule && formatDate(selectedSchedule.date)}</Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.absentBtn]} 
                onPress={() => handleAttendance(0)}
              >
                <Text style={styles.modalBtnText}>불참</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.presentBtn]} 
                onPress={() => handleAttendance(1)}
              >
                <Text style={styles.modalBtnText}>참석</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default ScheduleScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#faf6f0',
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginTop: 40,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4a7c59',
    fontFamily: 'Literata',
  },
  logoutBtn: {
    color: '#666',
    fontSize: 14,
  },
  listSection: {
    flex: 1,
    padding: 20,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2e3230',
    marginBottom: 15,
  },
  listContent: {
    paddingBottom: 20,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  dateBadge: {
    width: 50,
    height: 50,
    backgroundColor: '#f0e8db',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#705c30',
  },
  scheduleInfo: {
    flex: 1,
    marginLeft: 15,
  },
  scheduleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2e3230',
  },
  scheduleStatus: {
    fontSize: 13,
    color: '#74796e',
    marginTop: 2,
  },
  statusIndicator: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicatorText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 30,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2e3230',
    marginBottom: 10,
  },
  modalDate: {
    fontSize: 16,
    color: '#705c30',
    marginBottom: 25,
  },
  modalVs: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4a7c59',
    marginBottom: 4,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  modalBtn: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
    minWidth: 100,
    alignItems: 'center',
  },
  modalBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  presentBtn: {
    backgroundColor: '#4a7c59',
  },
  absentBtn: {
    backgroundColor: '#b83230',
  }
});
