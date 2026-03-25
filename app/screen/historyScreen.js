import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";

const API_BASE_URL = "http://172.30.1.84:8000";
const GAME_API_ENDPOINT = "/api/game";

const HistoryScreen = ({ onNavigate }) => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(`${API_BASE_URL}${GAME_API_ENDPOINT}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (!response.ok) {
         throw new Error(`HTTP 오류 ${response.status}`);
      }
      const data = await response.json();
      setGames(data);
    } catch (e) {
      clearTimeout(timeoutId);
      console.log("경기 내역 로드 오류", e);
      if (e.name === 'AbortError') {
        setError("서버 응답이 5초를 초과했습니다. 백엔드 IP 주소와 실행 상태를 확인해 주세요.");
      } else {
        setError("서버에 연결할 수 없거나 요청 중 문제가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => {
    // 날짜 등이 있다면 예쁘게 포맷팅할 수 있지만, 현재는 전체 데이터를 카드로 보여줌
    return (
      <View style={styles.itemCard}>
        <View style={styles.cardHeader}>
           <Text style={styles.gameTitle}>경기 ID: {item.id}</Text>
           {item.created_at && <Text style={styles.gameDate}>{new Date(item.created_at).toLocaleDateString()}</Text>}
        </View>
        <Text style={styles.itemText} numberOfLines={3}>{JSON.stringify(item, null, 2)}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>경기 내역</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#2563eb" style={{ flex: 1 }} />
      ) : error ? (
         <Text style={styles.errorText}>{error}</Text>
      ) : games.length === 0 ? (
        <Text style={styles.emptyText}>데이터가 없습니다.</Text>
      ) : (
        <FlatList
          data={games}
          keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
          renderItem={renderItem}
          style={styles.list}
          contentContainerStyle={styles.listContent}
        />
      )}

      <TouchableOpacity style={styles.backButton} onPress={() => onNavigate('recorder')}>
         <Text style={styles.backButtonText}>돌아가기</Text>
      </TouchableOpacity>
    </View>
  );
};

export default HistoryScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
    paddingTop: 60,
    width: "100%",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 20,
    color: "#1f2937",
    paddingHorizontal: 24,
  },
  list: {
    width: "100%",
  },
  listContent: {
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  itemCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#fff",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  itemText: {
    fontSize: 14,
    color: "#4b5563",
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    paddingBottom: 4,
  },
  gameTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  gameDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  emptyText: {
    fontSize: 16,
    color: "#6b7280",
    marginTop: 40,
    textAlign: "center",
  },
  errorText: {
    fontSize: 16,
    color: "#ef4444",
    marginTop: 40,
    textAlign: "center",
  },
  backButton: {
    marginHorizontal: 24,
    height: 52,
    borderRadius: 12,
    backgroundColor: "#4b5563",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 40,
    marginTop: 10,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  }
});
