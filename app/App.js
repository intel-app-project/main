import { StyleSheet, View } from "react-native";
import { useState } from "react";
import LoginScreen from "./screen/loginScreen";
import PlayerScheduleScreen from "./screen/playerScheduleScreen";
import GameDetailScreen from "./screen/gameDetail";

export default function App() {
  const [loginUserId, setLoginUserId] = useState("");
  const [currentScreen, setCurrentScreen] = useState("schedule");

  return (
    <View style={styles.container}>
      {loginUserId ? (
        currentScreen === "gameDetail" ? (
          <GameDetailScreen onBack={() => setCurrentScreen("schedule")} />
        ) : (
          <PlayerScheduleScreen
            loginUserId={loginUserId}
            onLogout={() => {
              setLoginUserId("");
              setCurrentScreen("schedule");
            }}
            onOpenGameDetail={() => setCurrentScreen("gameDetail")}
          />
        )
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
