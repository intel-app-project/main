import {
  Text,
  TextInput,
  View,
  TouchableOpacity,
  Alert,
  Modal,
  FlatList,
} from "react-native";
import { useState } from "react";
import { supabase } from "../lib/supabase";

import { styles } from "./loginScreen.styles";

const LoginScreen = ({ navigation }) => {
  const [userId, setUserId] = useState("");
  const [userPw, setUserPw] = useState("");
  const [selectedId, setSelectedId] = useState(0);
  const [showPicker, setShowPicker] = useState(false);

  const userIds = Array.from({ length: 84 }, (_, i) => i);


  const handleLogin = async () => {
    if (!userId || !userPw) {
      Alert.alert("알림", "아이디와 비밀번호를 모두 입력해주세요.");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("member")
        .select("Id, User_ID, User_PW, Primary_Position")
        .eq("User_ID", userId)
        .single();

      if (error) {
        console.error("Supabase Error:", error);
        Alert.alert("오류", "아이디 확인 중 문제가 발생했습니다.");
        return;
      }

      if (!data) {
        Alert.alert("오류", "ID가 존재하지 않습니다.");
        return;
      }

      if (data.User_PW !== userPw) {
        Alert.alert("오류", "비밀번호가 일치하지 않습니다.");
        return;
      }

      // 로그인 성공 - 권한별 분기
      const position = data.Primary_Position;

      if (position === "감독") {
        navigation.navigate("myGame", { id: data.Id });
      } else if (position === "기록원") {
        navigation.navigate("ManagerSchedule", { id: data.Id });
      } else {
        navigation.navigate("myGame", { id: data.Id });
      }
    } catch (err) {
      Alert.alert("오류", "로그인 처리 중 문제가 발생했습니다.");
      console.error(err);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.box}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Enter your details to continue</Text>
        
        <View style={styles.field}>
          <Text style={styles.label}>ID</Text>
          <TextInput 
            style={styles.textInput} 
            placeholder="Enter ID" 
            placeholderTextColor="#a09b8e"
            value={userId}
            onChangeText={setUserId}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Enter password"
            placeholderTextColor="#a09b8e"
            secureTextEntry
            value={userPw}
            onChangeText={setUserPw}
          />
        </View>

        <TouchableOpacity 
          style={styles.button}
          onPress={handleLogin}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Confirm</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.pickerButton}
          onPress={() => setShowPicker(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.pickerButtonText}>Select User ID: {selectedId}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.button}
          onPress={() => navigation.navigate("PlayerSchedule", { id: selectedId })}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Quick Login</Text>
        </TouchableOpacity>

        <Modal
          visible={showPicker}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowPicker(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay} 
            activeOpacity={1} 
            onPress={() => setShowPicker(false)}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Choose User ID</Text>
              <FlatList
                data={userIds}
                keyExtractor={(item) => item.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.idItem,
                      selectedId === item && styles.selectedIdItem
                    ]}
                    onPress={() => {
                      setSelectedId(item);
                      setShowPicker(false);
                    }}
                  >
                    <Text style={[
                      styles.idText,
                      selectedId === item && styles.selectedIdText
                    ]}>
                      User ID: {item}
                    </Text>
                  </TouchableOpacity>
                )}
                showsVerticalScrollIndicator={false}
              />
            </View>
          </TouchableOpacity>
        </Modal>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => navigation.navigate("ManagerSchedule")}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Manager Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
export default LoginScreen;


