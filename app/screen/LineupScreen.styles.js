import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#001710", paddingTop: 50 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#001710" },
  header: { flexDirection: "row", alignItems: "center", padding: 20 },
  backBtn: { color: "#ffb599", fontSize: 24, marginRight: 20 },
  headerTitle: { color: "#ffb599", fontSize: 18, fontWeight: "bold" },
  scrollContent: { paddingBottom: 40 },
  
  // Tab Styles
  tabContainer: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 10 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: '#ffb599' },
  tabText: { color: 'rgba(255,181,153,0.5)', fontSize: 14, fontWeight: 'bold' },
  activeTabText: { color: '#ffb599' },

  fieldSection: { padding: 20 },
  fieldCard: { backgroundColor: "#0f3c2f", borderRadius: 20, padding: 20, alignItems: "center" },
  sectionTitle: { color: "#ffb599", fontSize: 14, fontWeight: "bold", marginBottom: 15, alignSelf: 'flex-start' },
  diamond: { width: '100%', alignItems: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginVertical: 5 },
  slot: { padding: 5, alignItems: 'center', minWidth: 60 },
  slotHighlight: { backgroundColor: 'rgba(255,181,153,0.2)', borderRadius: 10 },
  slotPos: { color: "#ffb599", fontSize: 10, fontWeight: "bold" },
  slotName: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  
  // Batting List Styles
  battingSection: { padding: 20 },
  battingList: { backgroundColor: "#0f3c2f", borderRadius: 20, padding: 15 },
  battingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,181,153,0.1)' },
  battingRowActive: { backgroundColor: 'rgba(255,181,153,0.1)', borderRadius: 10 },
  battingOrder: { color: '#ffb599', fontSize: 14, fontWeight: 'bold', width: 30 },
  battingName: { color: '#fff', fontSize: 16, flex: 1 },
  battingEmpty: { color: 'rgba(255,255,255,0.3)', fontSize: 14 },

  rosterSection: { padding: 20 },
  memberCard: { backgroundColor: "#0f3c2f", borderRadius: 15, padding: 15, marginBottom: 10 },
  memberName: { color: "#fff", fontSize: 16, fontWeight: "bold", marginBottom: 10 },
  posButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  posBtn: { padding: 5, backgroundColor: '#00251b', borderRadius: 5, minWidth: 35, alignItems: 'center' },
  posBtnActive: { backgroundColor: '#ffb599' },
  posBtnText: { color: "#fff", fontSize: 10 },
  saveBtn: { margin: 20, backgroundColor: "#ffb599", padding: 15, borderRadius: 10, alignItems: "center" },
  saveBtnText: { color: "#5a1c00", fontSize: 18, fontWeight: "bold" }
});
