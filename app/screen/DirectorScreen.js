import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import React from 'react';

const DirectorScreen = ({ onNavigate }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.roleText}>감독</Text>
      <TouchableOpacity 
        style={styles.button} 
        onPress={() => onNavigate('login')}
      >
        <Text style={styles.buttonText}>로그아웃</Text>
      </TouchableOpacity>
    </View>
  );
};

export default DirectorScreen;

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
    color: '#4a7c59',
  },
  button: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#4a7c59',
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
  }
});
