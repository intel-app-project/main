import { StyleSheet, View } from "react-native";
import { useState } from "react";
import LoginScreen from "./screen/loginScreen";
import RecorderScreen from "./screen/recorderScreen";
import HistoryScreen from "./screen/historyScreen";
import DirectorScreen from "./screen/DirectorScreen";
import PlayerScreen from "./screen/PlayerScreen";
import ScheduleScreen from "./screen/ScheduleScreen";

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('login');
  const [user, setUser] = useState(null);

  const handleNavigate = (screen, userData = null) => {
    if (userData) setUser(userData);
    setCurrentScreen(screen);
  };

  return (
    <View style={styles.container}>
      {currentScreen === 'login' ? (
        <LoginScreen onNavigate={handleNavigate} />
      ) : currentScreen === 'recorder' ? (
        <RecorderScreen onNavigate={handleNavigate} />
      ) : currentScreen === 'history' ? (
        <HistoryScreen onNavigate={handleNavigate} />
      ) : currentScreen === 'director' ? (
        <DirectorScreen onNavigate={handleNavigate} />
      ) : currentScreen === 'player' ? (
        <ScheduleScreen onNavigate={handleNavigate} user={user} />
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
