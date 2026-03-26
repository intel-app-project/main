import { Text, View, TouchableOpacity } from 'react-native';
import { styles } from "./DirectorScreen.styles";

const DirectorScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.roleText}>감독</Text>
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


