import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";

const API_BASE_URL = "http://172.30.1.83:8000";
const CSV_UPLOAD_ENDPOINT = "/api/testpost";

const RecorderScreen = ({ onNavigate }) => {
  const uploadCsvToServer = async (selectedFile) => {
    console.log("1. 서버 업로드 시작 - 파일 정보:", selectedFile.name);

    const file = {
      uri: selectedFile.uri,
      name: selectedFile.name || "upload.csv",
      type: selectedFile.mimeType || "text/csv",
    };

    console.log("2. FormData 생성 중...");
    const formData = new FormData();
    formData.append("file", file);

    console.log(
      "3. Fetch 요청 보냄 - URL:",
      `${API_BASE_URL}${CSV_UPLOAD_ENDPOINT}`,
    );
    try {
      const response = await fetch(`${API_BASE_URL}${CSV_UPLOAD_ENDPOINT}`, {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
          "Content-Type": "multipart/form-data",
        },
      });
      console.log("4. 서버 응답 수신 - 상태 코드:", response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("5. 서버 응답 오류 내용:", errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      const result = await response.json();
      console.log("6. 업로드 성공! 결과:", result);
      return { endpoint: CSV_UPLOAD_ENDPOINT, ...result };
    } catch (fetchError) {
      console.error("서버 통신 실패(네트워크 오류):", fetchError);
      throw fetchError;
    }
  };

  const openCsvPicker = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "text/csv",
          "application/csv",
          "application/vnd.ms-excel",
          "text/comma-separated-values",
        ],
        copyToCacheDirectory: true,
        multiple: false,
      });

      console.log("csv result =======>", result);

      if (result.canceled) {
        Alert.alert("취소됨", "CSV 파일 선택이 취소되었습니다.");
        return;
      }

      const selected = result.assets?.[0];
      if (!selected) {
        Alert.alert("선택 오류", "CSV 파일 정보를 확인할 수 없습니다.");
        return;
      }

      // CSV 파일 내용 읽기
      try {
        const content = await FileSystem.readAsStringAsync(selected.uri, {
          encoding: "utf8",
        });
        console.log("CSV 파일 내용 시작 ======================");
        console.log(content);
        console.log("CSV 파일 내용 끝 ========================");
      } catch (readError) {
        console.error("파일 읽기 오류:", readError);
      }

      Alert.alert("업로드 중", `선택한 파일: ${selected.name}`);
      const uploadResult = await uploadCsvToServer(selected);

      Alert.alert(
        "업로드 완료",
        `서버(${uploadResult.endpoint})에 CSV 파일 업로드가 완료되었습니다.`,
      );
    } catch (error) {
      console.log("csv pick/upload error =======>", error);
      const errorMessage = error?.message || "";

      if (errorMessage.includes("ENDPOINT_ERROR:")) {
        Alert.alert(
          "경로 오류",
          "업로드 API 경로가 잘못된 것 같습니다. 경로를 확인해 주세요.",
        );
        return;
      }

      if (errorMessage.includes("Network request failed")) {
        Alert.alert(
          "네트워크 오류",
          "서버에 연결할 수 없습니다. 서버 주소와 네트워크 상태를 확인해 주세요.",
        );
        return;
      }

      Alert.alert("오류", "CSV 파일 업로드 중 문제가 발생했습니다.");
    }
  };

  const handlePickCsv = () => {
    Alert.alert(
      "파일 권한",
      "CSV 파일을 선택하려면 파일 접근을 허용해 주세요.",
      [
        {
          text: "허용",
          onPress: openCsvPicker,
        },
        {
          text: "거부",
          style: "cancel",
          onPress: () => {
            Alert.alert("거부됨", "파일 접근 권한이 거부되었습니다.");
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>경기 내용</Text>
        <Text style={styles.subtitle}>파일을 선택하여 분석을 시작하세요</Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.uploadButton} 
            onPress={handlePickCsv}
            activeOpacity={0.8}
          >
            <Text style={styles.uploadButtonText}>CSV 업로드</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.historyButton}
            onPress={() => onNavigate("history")}
            activeOpacity={0.8}
          >
            <Text style={styles.historyButtonText}>경기 내역 보기</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={() => onNavigate("login")}
            activeOpacity={0.7}
          >
            <Text style={styles.logoutButtonText}>로그아웃</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default RecorderScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#faf6f0", // Background (Warm cream)
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 24,
    // Soft Elevation (Shadow)
    shadowColor: "#2e3230",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 4,
    alignItems: "stretch",
  },
  title: {
    fontSize: 28,
    textAlign: "center",
    fontWeight: "700",
    color: "#4a7c59", // Primary (Forest green)
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
    color: "#705c30", // Tertiary (Warm amber)
    marginBottom: 32,
  },
  buttonContainer: {
    gap: 12, // Breathable spacing
  },
  uploadButton: {
    height: 52,
    borderRadius: 12,
    backgroundColor: "#4a7c59", // Primary (Forest green)
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#4a7c59",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  uploadButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  historyButton: {
    height: 52,
    borderRadius: 12,
    backgroundColor: "#705c30", // Tertiary (Warm amber)
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#705c30",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  historyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  logoutButton: {
    height: 52,
    borderRadius: 12,
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: "#4a7c59",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  logoutButtonText: {
    color: "#4a7c59",
    fontSize: 16,
    fontWeight: "700",
  },
});
