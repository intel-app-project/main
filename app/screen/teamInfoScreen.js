import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import PlayerFooter from "../components/PlayerFooter";

const TeamInfoScreen = ({ navigation, route }) => {
  const { id } = route.params || {};
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>팀정보</Text>
        <Text style={styles.placeholder}>준비 중인 서비스입니다.</Text>
      </View>
      <PlayerFooter activeTab="TeamInfo" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#faf6f0",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#2e3230",
    fontFamily: "serif",
    marginBottom: 8,
  },
  placeholder: {
    fontSize: 16,
    color: "#705c30",
  },
});

export default TeamInfoScreen;
