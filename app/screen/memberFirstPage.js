import {
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
} from "react-native";
import React from "react";

function memberFirstPage(isMember) {
  return (
    <View style={styles.container}>
      <View style={styles.box}>
      if(isMember){
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>다음화면으로</Text>
        </TouchableOpacity>
        }else if(isMember){
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>다음화면으로</Text>
          </TouchableOpacity>
        }else{
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>다음화면으로</Text>
          </TouchableOpacity>
        }
      </View>
    </View>
  );
}

export default memberFirstPage