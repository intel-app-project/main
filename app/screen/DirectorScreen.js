import React from 'react';
import { Text, View, TouchableOpacity } from 'react-native';
import { styles } from "./DirectorScreen.styles";
import DirectorFooter from "../components/DirectorFooter";
import CommonHeader from "../components/CommonHeader";
import { SafeAreaView } from "react-native-safe-area-context";

const DirectorScreen = ({ navigation, route }) => {
  const { id } = route.params || {};

  return (
    <SafeAreaView style={styles.container}>
      <CommonHeader title="DirectorScreen" />
      <DirectorFooter activeTab="leagueGameSchedule" />

      <Text style={styles.roleText}>감독</Text>
      
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("DirectorSchedule", { id })}
      >
        <Text style={styles.buttonText}>라인업 관리</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Login')}
      >
        <Text style={styles.buttonText}>로그아웃</Text>
      </TouchableOpacity>
      
      <DirectorFooter activeTab="leagueGameSchedule" />
    </SafeAreaView>
  );
};

export default DirectorScreen;
