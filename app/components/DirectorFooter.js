import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const DirectorFooter = ({ activeTab }) => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { id } = route.params || {};
  const currentUserId = id;

  const tabs = [
    {
      id: "TeamSchedule",
      label: "팀일정",
      icon: "calendar-month",
      screen: "PlayerSchedule",
    },
    {
      id: "LeagueSchedule",
      label: "팀정보",
      icon: "account-group",
      screen: "TeamInfo",
    },
    {
      id: "leagueGameSchedule",
      label: "리그일정",
      icon: "format-list-bulleted",
      screen: "leagueGameSchedule",
      extraParams: { isDirector: true }, // 감독 전용 파라미터
    },
    {
      id: "UserInfo",
      label: "유저정보",
      icon: "account",
      screen: "PlayerDetail",
    },
  ];

  const handlePress = (tab) => {
    // push: 스택에 항상 새 인스턴스를 쌓아 params가 이전 값에 merge되지 않도록 함
    // navigate는 이미 스택에 있는 화면의 params를 재사용해 isDirector가 유실될 수 있음
    navigation.push(tab.screen, {
      id: currentUserId,
      ...(tab.extraParams || {}),
    });
  };

  return (
    <View style={[styles.container, { height: 60 + insets.bottom, paddingBottom: insets.bottom || 10 }]}>
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

export default DirectorFooter;
