export const SCHEDULE_API_ENDPOINT = "/api/schedule";
export const TEAM_API_ENDPOINT = "/api/team";
export const MEMBER_API_ENDPOINT = "/api/member";
export const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];
export const STADIUM_LINK_URL = "https://www.ktwiz.co.kr/wizpark/location";
export const ATTENDANCE_OPTIONS = [
  { key: "attending", label: "O", text: "참석", color: "#2f8f4e" },
  { key: "pending", label: "-", text: "미응답", color: "#8f8f8f" },
  { key: "absent", label: "X", text: "불참", color: "#c84747" },
];

export const POSITIONS = [
  "P",
  "C",
  "1B",
  "2B",
  "3B",
  "SS",
  "LF",
  "CF",
  "RF",
  "DH",
  "BENCH",
];

export const BATTING_ORDERS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export const INITIAL_LINEUP = {
  defense: {
    P: null,
    C: null,
    "1B": null,
    "2B": null,
    "3B": null,
    SS: null,
    LF: null,
    CF: null,
    RF: null,
    DH: null,
    BENCH: [],
  },
  batting: Array(9).fill(null),
};
