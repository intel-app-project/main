import { StyleSheet, Dimensions } from "react-native";

const { width } = Dimensions.get("window");

export const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    height: 80,
    backgroundColor: "#faf6f0",
    borderTopWidth: 1,
    borderTopColor: "rgba(74, 124, 89, 0.1)",
    paddingBottom: 20, // Bottom inset for safe area
    justifyContent: "space-around",
    alignItems: "center",
    shadowColor: "rgba(46, 50, 48, 1)",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 10,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 10,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#a0a0a0",
    marginTop: 4,
  },
  activeTabLabel: {
    color: "#4a7c59",
    fontWeight: "800",
  },
});
