import React from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import * as DocumentPicker from "expo-document-picker";

const API_BASE_URL = "http://172.30.1.84:8000";
const CSV_UPLOAD_ENDPOINT = "/upload-csv";

const RecorderScreen = () => {
  const uploadCsvToServer = async (selectedFile) => {
    const file = {
      uri: selectedFile.uri,
      name: selectedFile.name || "upload.csv",
      type: selectedFile.mimeType || "text/csv",
    };

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE_URL}${CSV_UPLOAD_ENDPOINT}`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 404 || response.status === 405) {
        throw new Error(
          `ENDPOINT_ERROR: HTTP ${response.status} (${CSV_UPLOAD_ENDPOINT}) ${errorText}`,
        );
      }
      throw new Error(
        `HTTP ${response.status} (${CSV_UPLOAD_ENDPOINT}) ${errorText}`,
      );
    }

    return { endpoint: CSV_UPLOAD_ENDPOINT };
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

        <TouchableOpacity style={styles.uploadButton} onPress={handlePickCsv}>
          <Text style={styles.uploadButtonText}>CSV 업로드</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default RecorderScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    padding: 16,
    gap: 50,
  },
  title: {
    fontSize: 32,
    textAlign: "center",
    fontWeight: "700",
    color: "#111827",
  },
  uploadButton: {
    height: 44,
    borderRadius: 8,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
  },
  uploadButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
});
