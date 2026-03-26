import "react-native-gesture-handler";
import React from "react";
import { StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import LoginScreen from "./screen/loginScreen";
import ManagerScheduleScreen from "./screen/managerScheduleScreen";
import DirectorScreen from "./screen/DirectorScreen";
import PlayerScheduleScreen from "./screen/playerScheduleScreen";
import GameDetailScreen from "./screen/gameDetailScreen";
import LineupScreen from "./screen/LineupScreen";
import DirectorScheduleScreen from "./screen/DirectorScheduleScreen";

const Stack = createStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator 
          initialRouteName="Login"
          screenOptions={{
            headerShown: false
          }}
        >
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Director" component={DirectorScreen} />
          <Stack.Screen name="DirectorSchedule" component={DirectorScheduleScreen} />
          <Stack.Screen name="PlayerSchedule" component={PlayerScheduleScreen} />
          <Stack.Screen name="ManagerSchedule" component={ManagerScheduleScreen} />
          <Stack.Screen name="GameDetail" component={GameDetailScreen} />
          <Stack.Screen name="Lineup" component={LineupScreen} />
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
