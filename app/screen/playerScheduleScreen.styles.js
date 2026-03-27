import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#faf6f0",
  },
  body: {
    flex: 1,
  },
  calendarSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  listScroll: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 110,
  },
  card: {
    backgroundColor: "#f7f2ea",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#2e3230",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 2,
  },
  calendarCard: {
    padding: 13,
    paddingBottom: 11,
  },
  cardEyebrow: {
    color: "#8c8478",
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 7,
  },
  cardTitle: {
    fontSize: 20,
    color: "#2e322f",
    fontWeight: "700",
    marginBottom: 20,
  },
  calendarTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  todayButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(74, 124, 89, 0.08)",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(74, 124, 89, 0.16)",
  },
  todayButtonText: {
    color: "#4a7c59",
    fontSize: 11,
    fontWeight: "800",
  },
  calendarBody: {
    position: "relative",
  },
  calendarSideButton: {
    position: "absolute",
    top: "50%",
    marginTop: -38,
    height: 76,
    width: 14,
    borderRadius: 10,
    backgroundColor: "#f7f2ea",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  calendarSideButtonLeft: {
    left: -8,
  },
  calendarSideButtonRight: {
    right: -8,
  },
  calendarSideArrow: {
    color: "#a6a29b",
    fontSize: 28,
    lineHeight: 40,
    fontWeight: "700",
    marginTop: -1,
  },
  weekHeader: {
    flexDirection: "row",
    marginBottom: 6,
  },
  weekDay: {
    width: `${100 / 7}%`,
    textAlign: "center",
    fontSize: 14,
    color: "#99948d",
    fontWeight: "700",
  },
  weekRow: {
    flexDirection: "row",
    marginBottom: 2,
  },
  dayCell: {
    width: `${100 / 7}%`,
    alignItems: "center",
  },
  dayCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  dayEvent: {
    backgroundColor: "#e4ecd9",
  },
  dayEventAttending: {
    backgroundColor: "#d9f1df",
  },
  dayEventPending: {
    backgroundColor: "#d9d5cf",
  },
  dayEventAbsent: {
    backgroundColor: "#f4dada",
  },
  dayToday: {
    borderWidth: 1,
    borderColor: "#7a9a74",
  },
  dayText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#3a3f3b",
  },
  dayDim: {
    color: "#c1bcb4",
  },
  errorText: {
    color: "#8b3f3f",
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 10,
  },
  listTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  listCountText: {
    color: "#7f786f",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 6,
  },
  loadingWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
  },
  loadingText: {
    color: "#6f6a62",
    fontSize: 13,
  },
  emptyText: {
    color: "#6f6a62",
    fontSize: 13,
    paddingVertical: 8,
  },
  listItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(112, 92, 48, 0.12)",
  },
  listMain: {
    gap: 6,
  },
  listMatchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  listHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  listDate: {
    color: "#8f887e",
    fontSize: 13,
    fontWeight: "700",
  },
  listTime: {
    color: "#4a7c59",
    fontSize: 13,
    fontWeight: "700",
  },
  listOpponent: {
    color: "#2f3431",
    fontSize: 17,
    fontWeight: "700",
    flex: 1,
  },
  listMeta: {
    color: "#9f988f",
    fontSize: 12,
    fontWeight: "600",
  },
  attendanceWrap: {
    marginTop: 8,
    alignItems: "flex-end",
    gap: 8,
  },
  attendanceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  attendanceBadgeInline: {
    flexShrink: 0,
  },
  attendanceBadgeIcon: {
    fontSize: 16,
    fontWeight: "800",
  },
  attendanceBadgeText: {
    fontSize: 14,
    fontWeight: "700",
  },
  attendanceOptionRow: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "flex-end",
  },
  attendanceOptionButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fdf9f3",
    borderWidth: 1,
    borderColor: "#ddd5c8",
  },
  attendanceOptionButtonSelected: {
    borderColor: "#7a9a74",
    backgroundColor: "#eef5e7",
  },
  attendanceOptionIcon: {
    fontSize: 13,
    fontWeight: "800",
  },
  savingText: {
    color: "#9f988f",
    fontSize: 12,
    fontWeight: "700",
  },
  moreButton: {
    marginTop: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d4ccc0",
    backgroundColor: "#fdf9f3",
    paddingVertical: 11,
    alignItems: "center",
  },
  moreText: {
    color: "#4a7c59",
    fontSize: 13,
    fontWeight: "700",
  },
});
