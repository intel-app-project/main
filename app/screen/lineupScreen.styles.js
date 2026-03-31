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
    padding: 10 
  },
  fieldCard: { 
    backgroundColor: "#ffffff", 
    borderRadius: 20, 
    padding: 2, 
    alignItems: "center",
    // 부드러운 그림자 효과
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
    marginBottom: 12, // 제목 아래 여백 살짝 조정
    alignSelf: 'flex-start' 
  },
  autoBenchBtn: {
    backgroundColor: "#4a7c59",
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#4a7c59",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  autoBenchBtnText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "bold",
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
  
  // --- 야구장 필드 스타일 (참조 이미지 기반 고도화) ---
  fieldContainer: {
    width: width - 40,
    height: (width - 40) * 1.1, // 가로 대비 세로 비율 설정
    backgroundColor: '#1d3557', // 배경색 (이미지와 유사한 딥블루)
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    marginVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stadiumFan: {
    // 부채꼴 형태의 외야 잔디
    width: (width - 40) * 1.6,
    height: (width - 40) * 1.6,
    backgroundColor: '#76c893', // 밝은 잔디 연두색
    borderRadius: (width - 40) * 0.8,
    position: 'absolute',
    top: -((width - 40) * 0.4),
    transform: [{ rotate: '45deg' }],
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  infieldDirtSemi: {
    // 반원 형태의 내야 흙 영역
    position: 'absolute',
    bottom: '5%',
    width: (width - 40) * 0.75,
    height: (width - 40) * 0.75,
    backgroundColor: '#f4a261', // 따뜻한 황토색
    borderRadius: (width - 40) * 0.375,
    alignSelf: 'center',
  },
  diamondBaseLines: {
    // 다이아몬드 베이스 라인 및 내야 잔디 영역
    position: 'absolute',
    bottom: '12%',
    width: (width - 40) * 0.40, // 다이아몬드 크기 (0.48 -> 0.40 축소됨)
    height: (width - 40) * 0.40,
    borderWidth: 4,
    borderColor: '#ffffff', // 흰색 베이스 라인
    transform: [{ rotate: '45deg' }],
    backgroundColor: '#52b788', // 내야 안쪽 잔디 녹색
  },
  pitcherMoundDirt: {
    // 투수 마운드 영역
    position: 'absolute',
    top: '60%', // 마운드 높이 조절 시 이 값을 수정하세요
    left: '40%',
    width: '20%',
    height: '20%',
    backgroundColor: '#e76f51', // 마운드 흙 색상
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moundPlate: {
    // 투수 판
    width: '60%',
    height: '15%',
    backgroundColor: '#ffffff',
  },
  baseMarker: {
    // 베이스 마커(흰색 사각형) 공통 스타일
    position: 'absolute',
    width: 14,
    height: 14,
    backgroundColor: '#ffffff',
    transform: [{ rotate: '45deg' }],
    zIndex: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  // --- 각 베이스별 정밀 좌표 (다이아몬드 꼭짓점에 밀착) ---
  base1B: {
    bottom: '31.1%', 
    right: '21.7%', 
    marginRight: -7, // 마커 너비의 절반만큼 보정
  },
  base2B: {
    bottom: '56.8%', 
    alignSelf: 'center',
    marginBottom: -7,
  },
  base3B: {
    bottom: '31.1%',
    left: '21.7%',
    marginLeft: -7,
  },
  baseHome: {
    // 홈 플레이트 (45도 회전된 사각형 활용)
    position: 'absolute',
    bottom: '5.4%',
    alignSelf: 'center',
    width: 20,
    height: 20,
    backgroundColor: '#ffffff',
    transform: [{ rotate: '45deg' }],
  },

  // --- 선수 포지션별 상세 좌표 (스타디움 모드 전용) ---
  // 모든 위치는 bottom(하단) 기준으로 설정되어 지형과 함께 움직입니다.
  posP:  { position: 'absolute', bottom: '25%', alignSelf: 'center' }, // 투수
  posC:  { position: 'absolute', bottom: '3%', alignSelf: 'center' }, // 포수
  pos1B: { position: 'absolute', bottom: '38%', right: '5%' }, // 1루수
  pos2B: { position: 'absolute', bottom: '50%', right: '24%' }, // 2루수
  pos3B: { position: 'absolute', bottom: '38%', left: '5%' }, // 3루수
  posSS: { position: 'absolute', bottom: '50%', left: '25%' }, // 유격수
  posLF: { position: 'absolute', bottom: '70%', left: '12%' }, // 좌익수
  posCF: { position: 'absolute', bottom: '82%', alignSelf: 'center' }, // 중견수
  posRF: { position: 'absolute', bottom: '70%', right: '12%' }, // 우익수
  posDH: { position: 'absolute', bottom: '15%', right: '5%' }, // 지명타자 (사이드 배치)

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
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  
  // Batting List Styles (Redesigned as Vertical columns)
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
  memberName: { 
    color: "#2e3230", 
    fontSize: 17, 
    fontWeight: "bold", 
    marginBottom: 8, // Reduced from 16 since it's now inside memberTextWrap
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
  posButtons: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 8,
    justifyContent: 'flex-end',
    maxWidth: '65%',
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
