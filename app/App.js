import { StyleSheet, View } from "react-native";
import LoginScreen from "./screen/loginScreen";
import RecorderScreen from "./screen/recorderScreen";

export default function App() {
  return (
    <View style={styles.container}>
      <RecorderScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});
