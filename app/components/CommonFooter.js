import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const CommonFooter = ({ state, navigation, Id, userPosition }) => {
  console.log("[CommonFooter] Received Id:", Id);
  const insets = useSafeAreaInsets();
  const [position, setPosition] = useState(userPosition);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
      setPosition(userPosition);
      setLoading(false);

    const fetchMemberPosition = async () => {
      if (!Id) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("member")
          .select("Primary_Position")
          .eq("Id", Id) 
          .single();

        setPosition(data.Primary_Position);
      } catch (err) {
        console.error("Error fetching position in Footer:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMemberPosition();
  }, [Id]);

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
    <View style={[styles.container, { paddingBottom: insets.bottom || 10 }]}>
      {tabs.map((tab) => {
        // Tab.Navigator 모드일 경우 state 사용, 아니면 prop의 activeTab 사용 (fallback)
        const isFocused = state 
          ? state.routes[state.index].name === tab.screen
          : false;

        const handlePress = () => {
          if (state && navigation) {
            // Tab.Navigator 모드
            navigation.navigate(tab.screen, { id: Id });
          } else {
            // 구스택 모드 (비추천, 마이그레이션용)
            navigation.navigate(tab.screen, { id: Id });
          }
        };

        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.tabButton}
            onPress={handlePress}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={tab.icon}
              size={24}
              color={isFocused ? "#4a7c59" : "#a0a0a0"}
            />
            <Text style={[styles.tabLabel, isFocused && styles.activeTabLabel]}>
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
