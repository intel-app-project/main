import { StyleSheet, Dimensions } from "react-native";

const { width } = Dimensions.get("window");

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#faf6f0", // Warm cream
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#faf6f0",
  },
  scrollContent: {
    padding: 24,
  },
  subTitle: {
    color: "#705c30", // Warm amber
    fontSize: 15,
    marginBottom: 24,
    lineHeight: 22,
    opacity: 0.8,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#2e3230",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 2,
  },
  cardTop: {
    // 쪸대마치 정보 영역
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  cardLeft: {
    flex: 1,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  dateText: {
    color: "#4a7c59", // Forest green
    fontSize: 18,
    fontWeight: "bold",
  },
  matchText: {
    color: "#2e3230",
    fontSize: 16,
    opacity: 0.7,
  },
  arrow: {
    color: "#4a7c59",
    fontSize: 20,
    opacity: 0.5,
    marginLeft: 10,
  },
  emptyText: {
    color: "#705c30",
    fontSize: 16,
    opacity: 0.5,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 12,
  },
  homeTag: {
    backgroundColor: "rgba(74, 124, 89, 0.1)", // Forest green tint
  },
  awayTag: {
    backgroundColor: "rgba(112, 92, 48, 0.1)", // Warm amber tint
  },
  tagText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#4a7c59",
  },
  awayTagText: {
    color: "#705c30",
  },
  lineupBtn: {
    // 라인업 짜기 버튼
    backgroundColor: "#4a7c59",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  lineupBtnText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 15,
  },
});
