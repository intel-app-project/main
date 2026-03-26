import { Text, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { styles } from "./gameDetailScreen.styles";

const GameDetail = () => {
  const navigation = useNavigation();
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>뒤로</Text>
      </TouchableOpacity>
      <Text style={styles.title}>gameDetail</Text>
    </View>
  );
};

export default GameDetail;


