import { StyleSheet, Dimensions } from "react-native";

const { width } = Dimensions.get("window");

export const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#faf6f0", // Warm cream
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
  headerSection: {
    padding: 20,
    backgroundColor: "#ffffff",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 0,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4a7c59",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#8f887e",
    fontWeight: "600",
  },

  // Tab Styles
  tabContainer: { 
    flexDirection: 'row', 
    paddingHorizontal: 20, 
    backgroundColor: "#ffffff",
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
    padding: 10, 
    alignItems: "center",
    shadowColor: "#2e3230",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 3,
  },
  sectionTitle: { 
    color: "#4a7c59", 
    fontSize: 16, 
    fontWeight: "bold", 
    marginBottom: 15,
    alignSelf: 'flex-start' 
  },
  autoBenchBtn: {
    backgroundColor: "rgba(74, 124, 89, 0.1)",
    marginTop: 15,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  autoBenchBtnText: {
    color: "#4a7c59",
    fontSize: 13,
    fontWeight: "bold",
  },

  // --- 야구장 필드 스타일 ---
  fieldContainer: {
    width: width - 60,
    height: (width - 60) * 1.1,
    backgroundColor: '#1d3557',
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stadiumFan: {
    width: (width - 60) * 1.6,
    height: (width - 60) * 1.6,
    backgroundColor: '#76c893',
    borderRadius: (width - 60) * 0.8,
    position: 'absolute',
    top: -((width - 60) * 0.4),
    transform: [{ rotate: '45deg' }],
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  infieldDirtSemi: {
    position: 'absolute',
    bottom: '5%',
    width: (width - 60) * 0.75,
    height: (width - 60) * 0.75,
    backgroundColor: '#f4a261',
    borderRadius: (width - 60) * 0.375,
    alignSelf: 'center',
  },
  diamondBaseLines: {
    position: 'absolute',
    bottom: '12%',
    width: (width - 60) * 0.40,
    height: (width - 60) * 0.40,
    borderWidth: 4,
    borderColor: '#ffffff',
    transform: [{ rotate: '45deg' }],
    backgroundColor: '#52b788',
  },
  pitcherMoundDirt: {
    position: 'absolute',
    top: '60%',
    left: '40%',
    width: '20%',
    height: '20%',
    backgroundColor: '#e76f51',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moundPlate: {
    width: '60%',
    height: '15%',
    backgroundColor: '#ffffff',
  },
  baseMarker: {
    position: 'absolute',
    width: 12,
    height: 12,
    backgroundColor: '#ffffff',
    transform: [{ rotate: '45deg' }],
    zIndex: 5,
  },
  base1B: { bottom: '31.1%', right: '21.7%', marginRight: -6 },
  base2B: { bottom: '56.8%', alignSelf: 'center', marginBottom: -6 },
  base3B: { bottom: '31.1%', left: '21.7%', marginLeft: -6 },
  baseHome: {
    position: 'absolute',
    bottom: '5.4%',
    alignSelf: 'center',
    width: 16,
    height: 16,
    backgroundColor: '#ffffff',
    transform: [{ rotate: '45deg' }],
  },

  // 포지션별 좌표
  posP:  { position: 'absolute', bottom: '25%', alignSelf: 'center' },
  posC:  { position: 'absolute', bottom: '3%', alignSelf: 'center' },
  pos1B: { position: 'absolute', bottom: '38%', right: '5%' },
  pos2B: { position: 'absolute', bottom: '50%', right: '24%' },
  pos3B: { position: 'absolute', bottom: '38%', left: '5%' },
  posSS: { position: 'absolute', bottom: '50%', left: '25%' },
  posLF: { position: 'absolute', bottom: '70%', left: '12%' },
  posCF: { position: 'absolute', bottom: '82%', alignSelf: 'center' },
  posRF: { position: 'absolute', bottom: '70%', right: '12%' },
  posDH: { position: 'absolute', bottom: '15%', right: '5%' },

  slotStadium: {
    paddingHorizontal: 6,
    paddingVertical: 5,
    alignItems: "center",
    minWidth: 55,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 1)",
    borderWidth: 1.5,
    borderColor: "#1d3557",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  slotAvatarContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#f0f7f2",
    overflow: "hidden",
    marginBottom: 4,
    borderWidth: 1.2,
    borderColor: "rgba(74, 124, 89, 0.1)",
  },
  slotBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  slotNameStadium: {
    fontSize: 10,
    fontWeight: "800",
    color: "#1d3557",
  },
  slotPosStadium: {
    fontSize: 7.5,
    fontWeight: "900",
    color: "#e76f51",
    backgroundColor: "rgba(231, 111, 81, 0.1)",
    paddingHorizontal: 3,
    paddingVertical: 0.5,
    borderRadius: 3,
  },

  // Batting Order Styles
  battingSection: { 
    padding: 20 
  },
  battingBoard: { 
    backgroundColor: "#ffffff", 
    borderRadius: 20, 
    paddingVertical: 16,
    paddingHorizontal: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    shadowColor: "#2e3230",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 3,
  },
  battingColumn: {
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
    width: (width - 56) / 9,
  },
  battingColumnActive: {
    backgroundColor: 'rgba(74, 124, 89, 0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(74, 124, 89, 0.3)',
  },
  battingOrderNum: {
    color: '#4a7c59',
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 10,
  },
  battingVerticalName: {
    color: '#2e3230',
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 18,
    width: 20,
  },
  battingVerticalEmpty: {
    color: 'rgba(46, 50, 48, 0.3)',
    fontSize: 10,
    textAlign: 'center',
    width: 20,
  },

  // Roster Styles
  rosterSection: { 
    padding: 20 
  },
  rosterCard: {
    backgroundColor: "#ffffff", 
    borderRadius: 20, 
    paddingVertical: 8,
    shadowColor: "#2e3230",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
  },
  memberRow: { 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(46, 50, 48, 0.04)',
  },
  memberInfoWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  memberAvatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(74, 124, 89, 0.05)",
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "rgba(74, 124, 89, 0.1)",
  },
  memberTextWrap: {
    flex: 1,
  },
  memberName: { 
    color: "#2e3230", 
    fontSize: 16, 
    fontWeight: "bold", 
  },
  memberPosition: {
    color: "rgba(46, 50, 48, 0.5)",
    fontSize: 12,
    marginTop: 2,
  },
  assignedInfo: {
    color: "#705c30",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 2,
  },
  posButtons: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 6,
    justifyContent: 'flex-end',
    maxWidth: '60%',
  },
  posBtn: { 
    paddingHorizontal: 8, 
    paddingVertical: 6, 
    backgroundColor: 'rgba(46, 50, 48, 0.05)', 
    borderRadius: 6, 
    minWidth: 36, 
    alignItems: 'center' 
  },
  posBtnActive: { 
    backgroundColor: '#4a7c59' 
  },
  posBtnText: { 
    color: "#2e3230", 
    fontSize: 11,
    fontWeight: '700',
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
  },
  accessDenied: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  deniedText: {
    fontSize: 16,
    color: '#8f887e',
    textAlign: 'center',
    lineHeight: 24,
  },
  // Generic slot (if needed)
  slot: {
    padding: 8,
    alignItems: 'center',
    borderRadius: 8,
  }
});
