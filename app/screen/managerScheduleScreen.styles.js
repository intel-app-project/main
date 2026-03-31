import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#faf6f0",
    width: "100%",
  },
  body: {
    flex: 1,
  },
  calendarSection: {
    paddingTop: 8,
    paddingBottom: 4,
  },
  listScroll: {
    flex: 1,
  },
  formContainer: {
    marginTop: 12, 
    paddingHorizontal: 24,
    paddingBottom: 4
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    color: "#705c30"
  },
  input: {
    height: 52,
    borderWidth: 2,
    borderColor: "rgba(74, 124, 89, 0.2)",
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    backgroundColor: "#faf6f0",
    fontSize: 15
  },
  calendarCard: {
    backgroundColor: "#f7f2ea",
    borderRadius: 16,
    padding: 13,
    marginBottom: 10,
    shadowColor: "#2e3230",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 2,
  },
  calendarTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  calendarTitle: {
    fontSize: 20,
    color: "#2e322f",
    fontWeight: "700",
  },
  todayButton: {
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
    width: 30,
    height: 30,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  dayEvent: {
    backgroundColor: "#e4ecd9",
  },
  dayToday: {
    borderWidth: 1.5,
    borderColor: "#4a7c59",
  },
  daySelected: {
    backgroundColor: "#c84747",
    borderColor: "#c84747",
  },
  dayText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#3a3f3b",
  },
  dayEventText: {
    color: "#2f8f4e",
  },
  daySelectedText: {
    color: "#fffdf9",
  },
  dayEventDot: {
    position: "absolute",
    bottom: 3,
    width: 4,
    height: 4,
    borderRadius: 999,
    backgroundColor: "#2f8f4e",
  },
  dayDim: {
    color: "#c1bcb4",
  },
  selectedDateText: {
    fontSize: 14,
    color: "#4a7c59",
    fontWeight: "700",
    marginBottom: 12,
  },
  todayDateText: {
    fontSize: 13,
    color: "#705c30",
    fontWeight: "600",
    marginBottom: 10,
  },
  calendarLegendRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -4,
    marginBottom: 2,
  },
  calendarLegendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 4,
    marginBottom: 6,
  },
  calendarLegendSwatch: {
    width: 10,
    height: 10,
    borderRadius: 999,
    marginRight: 6,
    backgroundColor: "#d7d1c7",
  },
  calendarLegendToday: {
    backgroundColor: "#fffdf9",
    borderWidth: 1.5,
    borderColor: "#4a7c59",
  },
  calendarLegendSelected: {
    backgroundColor: "#c84747",
  },
  calendarLegendEvent: {
    backgroundColor: "#e4ecd9",
  },
  calendarLegendText: {
    fontSize: 12,
    color: "#6f6a62",
    fontWeight: "600",
  },
  teamSelectorBlock: {
    flex: 1,
    marginRight: 8,
  },
  teamDropdownTrigger: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  teamSelectorLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4a7c59",
    marginBottom: 4,
  },
  teamDropdownTriggerOpen: {
    borderColor: "#4a7c59",
  },
  teamDropdownText: {
    fontSize: 13,
    color: "#8a7a55",
    fontWeight: "600",
  },
  teamDropdownTextSelected: {
    color: "#303a31",
    fontWeight: "700",
  },
  teamDropdownIcon: {
    fontSize: 12,
    color: "#8a7a55",
    marginLeft: 12,
  },
  teamDropdownMenu: {
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: "#fffdf9",
    borderWidth: 1,
    borderColor: "rgba(112, 92, 48, 0.1)",
    overflow: "hidden",
  },
  teamDropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(112, 92, 48, 0.08)",
  },
  homeTeamOptionAccent: {
    backgroundColor: "rgba(74, 124, 89, 0.06)",
    borderColor: "rgba(74, 124, 89, 0.15)",
  },
  awayTeamOptionAccent: {
    backgroundColor: "rgba(112, 92, 48, 0.06)",
    borderColor: "rgba(112, 92, 48, 0.15)",
  },
  teamDropdownItemSelected: {
    backgroundColor: "rgba(74, 124, 89, 0.08)",
  },
  teamDropdownItemText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4b5563",
  },
  teamDropdownItemTextSelected: {
    color: "#303a31",
    fontWeight: "700",
  },
  teamOptionEmpty: {
    fontSize: 12,
    color: "#8a7a55",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  formActionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  submitButton: {
    height: 52,
    backgroundColor: "#4a7c59",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  submitButtonDisabled: {
    backgroundColor: "rgba(74, 124, 89, 0.4)",
  },
  submitButtonText: {
    color: "#faf6f0",
    fontSize: 14,
    fontWeight: "bold",
  },
  submitButtonCompact: {
    flex: 0.75,
    height: 44,
    marginTop: 18,
    marginLeft: 0,
    paddingHorizontal: 10,
  },
  divider: {
    height: 2,
    backgroundColor: "rgba(58, 91, 68, 0.1)",
    marginVertical: 10,
    marginHorizontal: 4
  },
  listContainer: {
    flex: 1,
    width: "100%"
  },
  listContent: {
    paddingBottom: 28,
    paddingHorizontal: 24,
    flexGrow: 1,
  },
  itemCard: {
    padding: 12,
    borderRadius: 18,
    backgroundColor: "#fffdf9",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(112, 92, 48, 0.1)",
    shadowColor: "#2e3230",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
    overflow: "hidden",
  },
  cardAccent: {
    height: 3,
    marginHorizontal: -12,
    marginTop: -12,
    marginBottom: 10,
    backgroundColor: "#4a7c59",
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerMain: {
    flex: 1,
    paddingRight: 8,
  },
  gameTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2f8f4e',
  },
  headerBadge: {
    fontSize: 11,
    fontWeight: "700",
    color: "#2f8f4e",
    backgroundColor: "rgba(74, 124, 89, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(74, 124, 89, 0.16)",
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  deleteButton: {
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: 10,
    backgroundColor: "rgba(112, 92, 48, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(112, 92, 48, 0.16)",
  },
  deleteButtonText: {
    fontSize: 11,
    color: "#705c30",
    fontWeight: "700",
  },
  itemText: {
    fontSize: 16,
    color: "#4b5563",
  },
  matchupRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: "#f7f1e7",
  },
  teamPill: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  homeTeamPill: {
    backgroundColor: "rgba(255, 255, 255, 0.75)",
    borderColor: "rgba(74, 124, 89, 0.12)",
  },
  awayTeamPill: {
    backgroundColor: "rgba(255, 255, 255, 0.75)",
    borderColor: "rgba(112, 92, 48, 0.12)",
  },
  teamLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#4a7c59",
    marginBottom: 2,
    letterSpacing: 0.6,
  },
  teamName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2f8f4e",
  },
  vsText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#2f8f4e",
    marginHorizontal: 8,
  },
  cardDivider: {
    height: 1,
    backgroundColor: "rgba(112, 92, 48, 0.1)",
    marginVertical: 10,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  metaBlock: {
    flex: 1,
    paddingRight: 8,
  },
  emptyText: {
    fontSize: 16,
    color: "#6b7280",
    marginTop: 20,
    textAlign: "center",
  },
  errorText: {
    fontSize: 16,
    color: "#705c30",
    marginTop: 20,
    textAlign: "center",
  },
  loadingIndicator: {
    marginTop: 24,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: 10,
    backgroundColor: "#4a7c59",
    borderWidth: 1,
    borderColor: "#4a7c59",
    marginRight: 6,
  },
  editButtonText: {
    fontSize: 11,
    color: "#fffdf9",
    fontWeight: "700",
  },
  updateButton: {
    backgroundColor: "#705c30",
  },
  cancelButton: {
    height: 52,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  cancelButtonText: {
    color: "#6b7280",
    fontSize: 16,
    fontWeight: "600",
  },
  updatedAtText: {
    fontSize: 11,
    color: "#4a7c59",
  },
  updatedAtPlaceholder: {
    fontSize: 11,
    color: "#b0b7bd",
  }
});
