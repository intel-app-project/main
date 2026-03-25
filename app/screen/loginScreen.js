import {
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
} from "react-native";
import React, { useState } from "react";

const LoginScreen = ({ onLogin }) => {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [errorText, setErrorText] = useState("");

  const handleLogin = () => {
    const trimmedUserId = userId.trim();

    if (!trimmedUserId) {
      setErrorText("Please enter an ID.");
      return;
    }

    setErrorText("");
    onLogin?.(trimmedUserId);
  };

  return (
    <View style={styles.container}>
      <View style={styles.box}>
        <View style={styles.field}>
          <Text style={styles.label}>ID</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Enter ID"
            value={userId}
            onChangeText={setUserId}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Enter password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}

        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Confirm</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  box: {
    width: "100%",
    maxWidth: 360,
    gap: 12,
  },
  field: {
    width: "100%",
  },
  label: {
    marginBottom: 6,
    fontWeight: "600",
  },
  textInput: {
    width: "100%",
    height: 44,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
  },
  button: {
    marginTop: 4,
    height: 44,
    backgroundColor: "#4A90D9",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
  errorText: {
    color: "#a23d3d",
    fontSize: 12,
  },
});
