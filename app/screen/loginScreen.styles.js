import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    flex: 1,
    backgroundColor: "#faf6f0", // Background (Warm cream)
    alignItems: "center",
    justifyContent: "center",
  },
  box: {
    width: "100%",
    maxWidth: 360,
    padding: 24,
    backgroundColor: "#faf6f0",
    borderRadius: 12,
    gap: 16,
    // Soft Elevation
    shadowColor: "#2e3230",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#4a7c59", // Primary (Forest green)
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#705c30", // Tertiary (Warm amber)
    textAlign: "center",
    marginBottom: 12,
  },
  field: {
    width: "100%",
  },
  label: {
    marginBottom: 8,
    fontWeight: "600",
    color: "#705c30", // Tertiary (Warm amber)
    fontSize: 14,
  },
  textInput: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderColor: "rgba(74, 124, 89, 0.2)", // Primary at low opacity
    borderRadius: 12, // Rounded corners
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    color: "#2e3230",
  },
  button: {
    marginTop: 8,
    height: 52,
    backgroundColor: "#4a7c59", // Primary (Forest green)
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12, // Large border-radius
    shadowColor: "#4a7c59",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: 0.5,
  },
  errorText: {
    color: "#a23d3d",
    fontSize: 12,
  },
});
