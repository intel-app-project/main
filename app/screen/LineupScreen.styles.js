import { StyleSheet, Dimensions } from "react-native";

const { width } = Dimensions.get("window");

export const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#faf6f0", // Warm cream
    paddingTop: 50 
  },
  centered: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center", 
    backgroundColor: "#faf6f0" 
  },
  scrollContent: { 
    paddingBottom: 40 
  },
  
  // Tab Styles
  tabContainer: { 
    flexDirection: 'row', 
    paddingHorizontal: 20, 
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(46, 50, 48, 0.08)",
  },
  tab: { 
    flex: 1, 
    paddingVertical: 14, 
    alignItems: 'center', 
    borderBottomWidth: 3, 
    borderBottomColor: 'transparent' 
  },
  activeTab: { 
    borderBottomColor: '#4a7c59' 
  },
  tabText: { 
    color: 'rgba(46, 50, 48, 0.4)', 
    fontSize: 15, 
    fontWeight: 'bold' 
  },
  activeTabText: { 
    color: '#4a7c59' 
  },

  fieldSection: { 
    padding: 20 
  },
  fieldCard: { 
    backgroundColor: "#ffffff", 
    borderRadius: 20, 
    padding: 24, 
    alignItems: "center",
    // Soft shadow
    shadowColor: "#2e3230",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 3,
  },
  sectionTitle: { 
    color: "#4a7c59", 
    fontSize: 15, 
    fontWeight: "bold", 
    marginBottom: 20, 
    alignSelf: 'flex-start' 
  },
  diamond: { 
    width: '100%', 
    alignItems: 'center' 
  },
  row: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    width: '100%', 
    marginVertical: 8 
  },
  slot: { 
    padding: 10, 
    alignItems: 'center', 
    minWidth: 70,
    borderRadius: 10,
    backgroundColor: 'rgba(74, 124, 89, 0.03)',
  },
  slotHighlight: { 
    backgroundColor: 'rgba(74, 124, 89, 0.1)', 
    borderWidth: 1,
    borderColor: 'rgba(74, 124, 89, 0.2)',
  },
  slotPos: { 
    color: "#705c30", // Warm amber
    fontSize: 11, 
    fontWeight: "bold",
    marginBottom: 4,
  },
  slotName: { 
    color: "#2e3230", 
    fontSize: 14, 
    fontWeight: "bold" 
  },
  
  // Batting List Styles
  battingSection: { 
    padding: 20 
  },
  battingList: { 
    backgroundColor: "#ffffff", 
    borderRadius: 20, 
    padding: 20,
    shadowColor: "#2e3230",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 3,
  },
  battingRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 14, 
    borderBottomWidth: 1, 
    borderBottomColor: 'rgba(46, 50, 48, 0.05)' 
  },
  battingRowActive: { 
    backgroundColor: 'rgba(74, 124, 89, 0.05)', 
    borderRadius: 12 
  },
  battingOrder: { 
    color: '#4a7c59', 
    fontSize: 16, 
    fontWeight: 'bold', 
    width: 40 
  },
  battingName: { 
    color: '#2e3230', 
    fontSize: 17, 
    flex: 1 
  },
  battingEmpty: { 
    color: 'rgba(46, 50, 48, 0.3)', 
    fontSize: 14 
  },

  rosterSection: { 
    padding: 20 
  },
  memberCard: { 
    backgroundColor: "#ffffff", 
    borderRadius: 15, 
    padding: 20, 
    marginBottom: 16,
    shadowColor: "#2e3230",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  memberName: { 
    color: "#2e3230", 
    fontSize: 17, 
    fontWeight: "bold", 
    marginBottom: 16,
  },
  posButtons: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 8 
  },
  posBtn: { 
    paddingHorizontal: 10, 
    paddingVertical: 8, 
    backgroundColor: 'rgba(46, 50, 48, 0.05)', 
    borderRadius: 8, 
    minWidth: 40, 
    alignItems: 'center' 
  },
  posBtnActive: { 
    backgroundColor: '#4a7c59' 
  },
  posBtnText: { 
    color: "#2e3230", 
    fontSize: 12,
    fontWeight: '600',
  },
  posBtnTextActive: {
    color: "#ffffff",
  },
  saveBtn: { 
    margin: 20, 
    backgroundColor: "#4a7c59", 
    padding: 18, 
    borderRadius: 12, 
    alignItems: "center",
    shadowColor: "#4a7c59",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: { 
    color: "#ffffff", 
    fontSize: 18, 
    fontWeight: "bold" 
  }
});
