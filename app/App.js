import { StyleSheet, View } from "react-native";
import { useState } from "react";
import LoginScreen from "./screen/loginScreen";
import RecorderScreen from "./screen/recorderScreen";
import HistoryScreen from "./screen/historyScreen";
import DirectorScreen from "./screen/DirectorScreen";
import PlayerScreen from "./screen/PlayerScreen";
import ManagerScheduleScreen from "./screen/managerScheduleScreen";

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('login');

  return (
    <View style={styles.container}>
      {currentScreen === 'login' ? (
        <LoginScreen onNavigate={setCurrentScreen} />
      ) : currentScreen === 'recorder' ? (
        <RecorderScreen onNavigate={setCurrentScreen} />
      ) : currentScreen === 'history' ? (
        <HistoryScreen onNavigate={setCurrentScreen} />
      ) : currentScreen === 'director' ? (
        <DirectorScreen onNavigate={setCurrentScreen} />
      ) : currentScreen === 'player' ? (
        <PlayerScreen onNavigate={setCurrentScreen} />
      ) : currentScreen === 'managerSchedule' ? (
        <ManagerScheduleScreen onNavigate={setCurrentScreen} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});
