import "react-native-gesture-handler";
import { StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import LoginScreen from "./screen/loginScreen";
import ManagerScheduleScreen from "./screen/managerScheduleScreen";
import PlayerScheduleScreen from "./screen/playerScheduleScreen";
import PlayerDetailScreen from "./screen/playerDetailScreen";
import LeagueGameScheduleScreen from "./screen/leagueGameScheduleScreen";
import LineupScreen from "./screen/lineupScreen";
import MyGameScreen from "./screen/myGame";
import TeamInfoScreen from "./screen/teamInfoScreen";
import DirectorScheduleScreen from "./screen/directorScheduleScreen";

const Stack = createStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator 
          initialRouteName="Login"
          screenOptions={{
            headerShown: false,
          }}
        >
          {/* 로그인 화면 */}
          <Stack.Screen name="Login" component={LoginScreen} />

          {/* 내경기 화면 */}
          <Stack.Screen name="MyGame" component={MyGameScreen} />

          {/* 팀정보 화면 */}
          <Stack.Screen name="TeamInfo" component={TeamInfoScreen} />

          {/* 리그일정 화면 */}
          <Stack.Screen name="LeagueGameSchedule" component={LeagueGameScheduleScreen} />
          <Stack.Screen name="DirectorSchedule" component={DirectorScheduleScreen} />

          {/* 내정보 화면 */}
          <Stack.Screen name="PlayerDetail" component={PlayerDetailScreen} />

          {/* 일정관리 화면 */}
          <Stack.Screen name="PlayerSchedule" component={PlayerScheduleScreen} />

          {/* 라인업 화면 */}
          <Stack.Screen name="Lineup" component={LineupScreen} />

          {/* 기록원 화면 */}
          <Stack.Screen name="ManagerSchedule" component={ManagerScheduleScreen} />
          
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});
