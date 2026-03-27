import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const CommonFooter = ({ activeTab }) => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { id } = route.params || {};
  const [position, setPosition] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMemberPosition = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("member")
          .select("Primary_Position")
          .eq("Id", id) 
          .single();

        if (error) {
          console.error("Error fetching member position:", error);
        } else if (data) {
          setPosition(data.Primary_Position);
        }
      } catch (err) {
        console.error("Unexpected error fetching position:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMemberPosition();
  }, [id]);

  const handlePress = (tab) => {
    navigation.push(tab.screen, {
      id: id,
      ...(tab.extraParams || {}),
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, { height: 60 + insets.bottom, justifyContent: 'center' }]}>
        <ActivityIndicator size="small" color="#4a7c59" />
      </View>
    );
  }

  const tabs = position === "감독" ?
      [
        { id: "MyGame", label: "팀일정", icon: "calendar-month", screen: "MyGame" },
        { id: "TeamInfo", label: "팀정보", icon: "account-group", screen: "TeamInfo" },
        { id: "DirectorSchedule", label: "리그일정", icon: "format-list-bulleted", screen: "DirectorSchedule" },
        { id: "PlayerDetail", label: "유저정보", icon: "account", screen: "PlayerDetail" },
      ]
    : [
        { id: "MyGame", label: "내경기", icon: "baseball", screen: "MyGame" },
        { id: "PlayerSchedule", label: "일정관리", icon: "calendar-month", screen: "PlayerSchedule" },
        { id: "TeamInfo", label: "팀정보", icon: "account-group", screen: "TeamInfo" },
        { id: "LeagueGameSchedule", label: "리그일정", icon: "format-list-bulleted", screen: "LeagueGameSchedule" },
        { id: "PlayerDetail", label: "내정보", icon: "account", screen: "PlayerDetail" },
      ];

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

export default CommonFooter;
