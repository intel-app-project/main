import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React from "react";

const GameDetail = ({ onBack }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backButtonText}>뒤로</Text>
      </TouchableOpacity>
      <Text style={styles.title}>gameDetail</Text>
    </View>
  );
};

export default GameDetail;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  backButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#d4ccc0",
    backgroundColor: "#fdf9f3",
    marginTop: 16,
  },
  backButtonText: {
    color: "#4a7c59",
    fontSize: 14,
    fontWeight: "700",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2e322f",
  },
});
