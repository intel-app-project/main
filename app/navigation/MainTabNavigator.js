import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { supabase } from "../lib/supabase";

// 화면들 임포트
import MyGameScreen from "../screen/myGameScreen";
import TeamInfoScreen from "../screen/teamInfoScreen";
import PlayerDetailScreen from "../screen/playerDetailScreen";
import PlayerScheduleScreen from "../screen/playerScheduleScreen";
import LeagueGameScheduleScreen from "../screen/leagueGameScheduleScreen";
import DirectorScheduleScreen from "../screen/directorScheduleScreen";
import LineupScreen from "../screen/lineupScreen";
import ManagerScheduleScreen from "../screen/managerScheduleScreen";
import CommonFooter from "../components/CommonFooter";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// 각 탭별 스택 내비게이터
const MyGameStack = ({ route }) => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen
      name="MyGameHome"
      component={MyGameScreen}
      initialParams={route.params}
    />
    <Stack.Screen name="Lineup" component={LineupScreen} />
    <Stack.Screen name="ManagerSchedule" component={ManagerScheduleScreen} />
    <Stack.Screen name="PlayerDetail" component={PlayerDetailScreen} />
  </Stack.Navigator>
);

const ScheduleStack = ({ route }) => {
  const { id, position } = route.params;
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {position === "감독" ? (
        <Stack.Screen
          name="DirectorSchedule"
          component={DirectorScheduleScreen}
          initialParams={{ id }}
        />
      ) : (
        <Stack.Screen
          name="PlayerSchedule"
          component={PlayerScheduleScreen}
          initialParams={{ id }}
        />
      )}
      <Stack.Screen name="Lineup" component={LineupScreen} />
    </Stack.Navigator>
  );
};

const TeamStack = ({ route }) => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen
      name="TeamInfoHome"
      component={TeamInfoScreen}
      initialParams={route.params}
    />
    <Stack.Screen name="PlayerDetail" component={PlayerDetailScreen} />
  </Stack.Navigator>
);

const LeagueStack = ({ route }) => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen
      name="LeagueGameScheduleHome"
      component={LeagueGameScheduleScreen}
      initialParams={route.params}
    />
  </Stack.Navigator>
);

const ProfileStack = ({ route }) => {
  console.log("[ProfileStack] Params:", route.params);
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="PlayerDetailHome"
        component={PlayerDetailScreen}
        initialParams={route.params}
      />
    </Stack.Navigator>
  );
};

const MainTabNavigator = ({ route }) => {
  const { id } = route.params;
  const [position, setPosition] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMemberPosition = async () => {
      try {
        console.log("[MainTabNavigator] Fetching position for ID:", id);
        const { data, error } = await supabase
          .from("member")
          .select("Primary_Position")
          .eq("Id", id)
          .single();

        if (error) {
          const { data: data2, error: error2 } = await supabase
            .from("member")
            .select("Primary_Position")
            .eq("ID", id)
            .single();

          if (data2) {
            console.log(
              "[MainTabNavigator] Position found (ID):",
              data2.Primary_Position,
            );
            setPosition(data2.Primary_Position);
          } else {
            console.error("[MainTabNavigator] Fetch error:", error);
          }
        } else if (data) {
          console.log(
            "[MainTabNavigator] Position found:",
            data.Primary_Position,
          );
          setPosition(data.Primary_Position);
        }
      } catch (err) {
        console.error("Error fetching position in Nav:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMemberPosition();
  }, [id]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#4a7c59" />
      </View>
    );
  }

  const isDirector = position === "감독";
  const isManager = position === "기록원";

  return (
    <Tab.Navigator
      tabBar={(props) =>
        isManager ? null : (
          <CommonFooter {...props} Id={id} userPosition={position} />
        )
      }
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen
        name="MyGame"
        component={MyGameStack}
        initialParams={{ id }}
      />

      {isDirector ? (
        <Tab.Screen
          name="DirectorSchedule"
          component={ScheduleStack}
          initialParams={{ id, position }}
        />
      ) : (
        <>
          <Tab.Screen
            name="PlayerSchedule"
            component={ScheduleStack}
            initialParams={{ id, position }}
          />
          <Tab.Screen
            name="LeagueGameSchedule"
            component={LeagueStack}
            initialParams={{ id }}
          />
        </>
      )}

      <Tab.Screen
        name="TeamInfo"
        component={TeamStack}
        initialParams={{ id }}
      />
      <Tab.Screen
        name="PlayerDetail"
        component={ProfileStack}
        initialParams={{ id }}
      />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;
