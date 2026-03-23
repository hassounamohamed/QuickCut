import { StyleSheet, Text, View } from "react-native";

export default function AppointmentsScreen() {
  return (
    <View style={styles.container}>
      <Text>Appointments</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
