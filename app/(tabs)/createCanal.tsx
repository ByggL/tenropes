import { StyleSheet, Text, View } from "react-native";

export default function ConnectionPage() {
  const hasError: boolean = false;

  return (
    <View style={styles.container}>
      <Text style={styles.titles}>Create channel</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  titles: {
    fontWeight: "bold",
    fontSize: 20,
  },
  textInputs: {
    color: "rgba(0, 0, 0, 1)",
  },
  errorMessage: {
    color: "red",
    fontSize: 10,
  },
});
