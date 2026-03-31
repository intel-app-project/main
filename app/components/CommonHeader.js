import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";

const CommonHeader = ({ title }) => {
  const navigation = useNavigation();

  return (
    <View style={[styles.topBar, { paddingTop: 10 }]}>
      <Text style={styles.topBarTitle}>{title}</Text>
      {title === "playerDetailScreen" && <TouchableOpacity
        style={styles.topBarTitle}
        onPress={() => navigation.reset({
          index: 0,
          routes: [{ name: "Login" }],
        })}
      >
        <Text style={styles.topBarTitle}>로그아웃</Text>
      </TouchableOpacity>}
    </View>
  );
};

const styles = StyleSheet.create({
  topBar: {
    paddingHorizontal: 18,
    paddingBottom: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f4efe6",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(74, 124, 89, 0.08)",
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(74, 124, 89, 0.08)",
  },
  iconText: {
    color: "#705c30",
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 18,
  },
  topBarTitle: {
    color: "#705c30",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2,
  },
});

export default CommonHeader;
