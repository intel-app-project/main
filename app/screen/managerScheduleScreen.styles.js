import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#faf6f0",
    width: "100%",
  },
  formContainer: {
    marginTop: 12, 
    paddingHorizontal: 24,
    paddingBottom: 12
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
    fontSize: 16,
    fontWeight: "bold",
  },
  divider: {
    height: 2,
    backgroundColor: "rgba(58, 91, 68, 0.1)",
    marginVertical: 10,
    marginHorizontal: 24
  },
  listContainer: {
    flex: 1,
    width: "100%"
  },
  listContent: {
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  itemCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#faf6f0",
    marginBottom: 8,
    shadowColor: "#2e3230",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(74, 124, 89, 0.1)',
    paddingBottom: 4,
  },
  gameTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#303a31',
  },
  doneText: {
    fontSize: 14,
    color: '#4a7c59',
    fontWeight: '700'
  },
  upcomingText: {
    fontSize: 14,
    color: '#705c30',
    fontWeight: '700'
  },
  deleteButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "rgba(112, 92, 48, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(112, 92, 48, 0.2)",
  },
  deleteButtonText: {
    fontSize: 12,
    color: "#705c30",
    fontWeight: "700",
  },
  itemText: {
    fontSize: 16,
    color: "#4b5563",
  },
  emptyText: {
    fontSize: 16,
    color: "#6b7280",
    marginTop: 40,
    textAlign: "center",
  },
  errorText: {
    fontSize: 16,
    color: "#705c30",
    marginTop: 40,
    textAlign: "center",
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "rgba(74, 124, 89, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(74, 124, 89, 0.2)",
    marginRight: 8,
  },
  editButtonText: {
    fontSize: 12,
    color: "#4a7c59",
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
    fontSize: 10,
    color: "#9ca3af",
    marginTop: 16,
    textAlign: 'right'
  }
});
