import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const PlayerFooter = ({ activeTab }) => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { id, isDirector } = route.params || {};
  const currentUserId = id;

  const tabs = [
    {
      id: "MyGame",
      label: "내경기",
      icon: "baseball",
      screen: "myGame",
    },
    {
      id: "TeamSchedule",
      label: "일정관리",
      icon: "calendar-month",
      screen: "PlayerSchedule",
    },
    {
      id: "LeagueSchedule",
      label: "라인업",
      icon: "account-group",
      screen: "TeamInfo",
    },
    {
      id: "leagueGameSchedule",
      label: "리그일정",
      icon: "format-list-bulleted",
      screen: "leagueGameSchedule",
    },
    {
      id: "UserInfo",
      label: "내정보",
      icon: "account",
      screen: "PlayerDetail",
    },
  ];

  const handlePress = (tab) => {
    // push를 사용하여 매번 새로운 인스턴스를 생성함으로써 params 유실 방지
    navigation.push(tab.screen, {
      id: currentUserId,
      // isDirector가 있으면 다음 화면에도 전달 (감독 식별용)
      ...(isDirector ? { isDirector: true } : {}),
      ...(tab.extraParams || {}),
    });
  };

  return (
    <View
      style={[
        styles.container,
        { height: 60 + insets.bottom, paddingBottom: insets.bottom || 10 },
      ]}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.tabButton}
            onPress={() => handlePress(tab)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={tab.icon}
              size={24}
              color={isActive ? "#4a7c59" : "#a0a0a0"}
            />
            <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#faf6f0",
    borderTopWidth: 1,
    borderTopColor: "rgba(74, 124, 89, 0.1)",
    justifyContent: "space-around",
    alignItems: "center",
    shadowColor: "rgba(46, 50, 48, 1)",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 10,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 10,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#a0a0a0",
    marginTop: 4,
  },
  activeTabLabel: {
    color: "#4a7c59",
    fontWeight: "800",
  },
});

export default PlayerFooter;
