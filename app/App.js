import { StyleSheet, View } from "react-native";
import { useState } from "react";
import LoginScreen from "./screen/loginScreen";
import PlayerScheduleScreen from "./screen/playerScheduleScreen";

export default function App() {
  const [loginUserId, setLoginUserId] = useState("");

  return (
    <View style={styles.container}>
      {loginUserId ? (
        <PlayerScheduleScreen loginUserId={loginUserId} onLogout={() => setLoginUserId("")} />
      ) : (
        <LoginScreen onLogin={setLoginUserId} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});
