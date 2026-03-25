import { StyleSheet, View } from "react-native";
import { useState } from "react";
import LoginScreen from "./screen/loginScreen";
import RecorderScreen from "./screen/recorderScreen";
import HistoryScreen from "./screen/historyScreen";

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
