import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { styles } from "./PlayerFooter.styles";

const DirectorFooter = ({ activeTab }) => {
  const navigation = useNavigation();
  const route = useRoute();
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
      screen: "LeagueSchedule",
    },
    {
      id: "leagueGameSchedule",
      label: "리그일정",
      icon: "format-list-bulleted",
      screen: "leagueGameSchedule",
    },
    {
      id: "UserInfo",
      label: "유저정보",
      icon: "account",
      screen: "PlayerDetail",
    },
  ];

  const handlePress = (tab) => {
    navigation.navigate(tab.screen, { id: currentUserId });
  };

  return (
    <View style={styles.container}>
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

export default DirectorFooter;
