import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import React from 'react';

const PlayerScreen = ({ onNavigate }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.roleText}>선수</Text>
      <TouchableOpacity 
        style={styles.button} 
        onPress={() => onNavigate('login')}
      >
        <Text style={styles.buttonText}>로그아웃</Text>
      </TouchableOpacity>
    </View>
  );
};

export default PlayerScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#faf6f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#705c30',
  },
  button: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#705c30',
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
  }
});
