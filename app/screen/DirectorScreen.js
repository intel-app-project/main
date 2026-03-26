import React from 'react';
import { Text, View, TouchableOpacity } from 'react-native';
import { styles } from "./DirectorScreen.styles";

const DirectorScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.roleText}>감독</Text>
      <TouchableOpacity 
        style={styles.button} 
        onPress={() => navigation.navigate('ManagerSchedule')}
      >
        <Text style={styles.buttonText}>일정 관리</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("DirectorSchedule")}
      >
        <Text style={styles.buttonText}>라인업 관리</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Login')}
      >
        <Text style={styles.buttonText}>로그아웃</Text>
      </TouchableOpacity>
    </View>
  );
};

export default DirectorScreen;
