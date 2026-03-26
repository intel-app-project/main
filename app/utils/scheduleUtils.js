import { API_BASE_URL } from "../constants/commonConstants";
import {
  ATTENDANCE_OPTIONS,
  SCHEDULE_API_ENDPOINT,
} from "../constants/scheduleConstants";

export const pick = (obj, keys) => {
  if (!obj) return null;
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null && obj[key] !== "") {
      return obj[key];
    }
  }
  return null;
};

export const findMemberByUserId = (members, userId) =>
  members.find(
    (member) =>
      String(pick(member, ["User_ID", "user_id"]) || "").trim() === userId,
  );

export const parseJsonField = (value) => {
  if (typeof value !== "string") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

export const getAttendanceValue = (value, memberId) => {
  const parsedValue = parseJsonField(value);
  const normalizedMemberId = String(memberId ?? "").trim();

  if (!normalizedMemberId) {
    return null;
  }

  if (parsedValue === null || parsedValue === undefined) {
    return null;
  }

  if (Array.isArray(parsedValue)) {
    for (const item of parsedValue) {
      const nestedValue = getAttendanceValue(item, normalizedMemberId);
      if (nestedValue !== null) {
        return nestedValue;
      }
    }
    return null;
  }

  if (typeof parsedValue === "object") {
    if (Object.prototype.hasOwnProperty.call(parsedValue, normalizedMemberId)) {
      const attendanceValue = Number(parsedValue[normalizedMemberId]);
      return Number.isNaN(attendanceValue) ? null : attendanceValue;
    }

    for (const nestedValue of Object.values(parsedValue)) {
      const resolvedValue = getAttendanceValue(nestedValue, normalizedMemberId);
      if (resolvedValue !== null) {
        return resolvedValue;
      }
    }
  }

  return null;
};

export const toDate = (value) => {
  if (!value) return null;

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  const rawValue = String(value).trim();

  if (/^\d{8}$/.test(rawValue)) {
    const year = rawValue.substring(0, 4);
    const month = rawValue.substring(4, 6);
    const day = rawValue.substring(6, 8);
    const date = new Date(`${year}-${month}-${day}T00:00:00`);
    if (!Number.isNaN(date.getTime())) {
      return date;
    }
  }

  const candidateValues = [
    rawValue,
    rawValue.replace(" ", "T"),
    rawValue.replace(/\./g, "-").replace(" ", "T"),
    rawValue.replace(/\//g, "-").replace(" ", "T"),
    rawValue
      .replace(/년\s*/g, "-")
      .replace(/월\s*/g, "-")
      .replace(/일\s*/g, " ")
      .replace(/\./g, ":")
      .trim()
      .replace(" ", "T"),
  ];

  for (const candidate of candidateValues) {
    const date = new Date(candidate);
    if (!Number.isNaN(date.getTime())) {
      return date;
    }
  }

  return null;
};

export const startOfDay = (date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());
export const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);

export const toDateKey = (date) =>
  [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");

export const formatDateText = (date) => `${date.getMonth() + 1}월 ${date.getDate()}일`;
export const formatCalendarMonth = (date) =>
  `${date.getFullYear()}년 ${date.getMonth() + 1}월`;

export const formatTimeText = (date) => {
  const hour = date.getHours();
  const minute = String(date.getMinutes()).padStart(2, "0");
  const isPm = hour >= 12;
  const displayHour = hour % 12 || 12;
  return `${isPm ? "오후" : "오전"} ${displayHour}:${minute}`;
};

export const buildCalendarRows = (monthDate) => {
  const monthStart = startOfMonth(monthDate);
  const gridStart = new Date(monthStart);
  gridStart.setDate(monthStart.getDate() - monthStart.getDay());

  const rows = [];

  for (let weekIndex = 0; weekIndex < 6; weekIndex += 1) {
    const row = [];

    for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
      const cellDate = new Date(gridStart);
      cellDate.setDate(gridStart.getDate() + weekIndex * 7 + dayIndex);

      row.push({
        key: toDateKey(cellDate),
        label: String(cellDate.getDate()),
        dateKey: toDateKey(cellDate),
        isCurrentMonth: cellDate.getMonth() === monthDate.getMonth(),
      });
    }

    rows.push(row);
  }

  return rows;
};

export const formatTeamLabel = (teamId, fallbackLabel) => {
  if (teamId === null || teamId === undefined || teamId === "") {
    return fallbackLabel;
  }

  return `팀 ${teamId}`;
};

export const buildTeamNameMap = (teams) =>
  teams.reduce((result, team) => {
    const teamId = pick(team, ["Id", "id"]);
    const teamName = pick(team, ["Name", "name"]);

    if (teamId !== null && teamId !== undefined && teamName) {
      result[String(teamId)] = String(teamName);
    }

    return result;
  }, {});

export const resolveTeamName = (teamNameMap, teamId, fallbackLabel) => {
  if (teamId !== null && teamId !== undefined && teamId !== "") {
    const mappedName = teamNameMap[String(teamId)];
    if (mappedName) {
      return mappedName;
    }
  }

  return formatTeamLabel(teamId, fallbackLabel);
};

export const getAttendanceStatus = (attendanceValue) => {
  if (attendanceValue === 1) {
    return "attending";
  }

  if (attendanceValue === 0) {
    return "absent";
  }

  return "pending";
};

export const getAttendanceOption = (status) =>
  ATTENDANCE_OPTIONS.find((option) => option.key === status) ||
  ATTENDANCE_OPTIONS[1];

export const getGameKey = (game) =>
  `${game.scheduleId ?? game.scheduleDate}-${game.teamName}-${game.opponent}`;

export const getAttendanceBadgePalette = (status) => {
  const option = getAttendanceOption(status);

  return {
    option,
    backgroundColor: `${option.color}18`,
    borderColor: `${option.color}55`,
  };
};

export const mergeAttendanceStatus = (currentStatus, nextStatus) => {
  const priority = {
    attending: 3,
    absent: 2,
    pending: 1,
  };

  return priority[nextStatus] > priority[currentStatus]
    ? nextStatus
    : currentStatus;
};

export const isActiveSchedule = (row) => !pick(row, ["deleted_at", "deletedAt"]);

export const matchScheduleForUser = (row, member) => {
  const homeTeamId = pick(row, ["home", "home_team"]);
  const awayTeamId = pick(row, ["away", "away_team"]);
  const memberTeamId = pick(member, ["Team", "team"]);
  const memberId = pick(member, ["Id", "id"]);
  const homeAttendance = getAttendanceValue(row?.home_member, memberId);
  const awayAttendance = getAttendanceValue(row?.away_member, memberId);
  const hasAttendanceInfo = homeAttendance !== null || awayAttendance !== null;
  const matchByHomeTeam =
    memberTeamId !== null &&
    memberTeamId !== undefined &&
    String(homeTeamId || "") === String(memberTeamId);
  const matchByAwayTeam =
    memberTeamId !== null &&
    memberTeamId !== undefined &&
    String(awayTeamId || "") === String(memberTeamId);
  const isHome =
    matchByHomeTeam || (!matchByAwayTeam && homeAttendance !== null);
  const attendanceSide = isHome ? "home" : "away";
  const attendanceValue = isHome ? homeAttendance : awayAttendance;

  return {
    matched: matchByHomeTeam || matchByAwayTeam || hasAttendanceInfo,
    isHome,
    homeTeamId,
    awayTeamId,
    homeAttendance,
    awayAttendance,
    attendanceSide,
    attendanceValue,
  };
};

export const normalizeSchedule = (row, scheduleContext, member, teamNameMap) => {
  const dateValue = pick(row, [
    "date",
    "start_time",
    "start_at",
    "game_date",
    "match_date",
    "scheduled_at",
  ]);
  const date = toDate(dateValue);
  if (!date) return null;

  const homeTeamId =
    scheduleContext?.homeTeamId ?? pick(row, ["home", "home_team"]);
  const awayTeamId =
    scheduleContext?.awayTeamId ?? pick(row, ["away", "away_team"]);
  const isHome = Boolean(scheduleContext?.isHome);
  const memberTeamId = pick(member, ["Team", "team"]);
  const myTeamId = isHome ? homeTeamId : (awayTeamId ?? memberTeamId);
  const opponentTeamId = isHome ? awayTeamId : homeTeamId;

  const teamName =
    pick(
      row,
      isHome ? ["home_name", "team_name"] : ["away_name", "team_name"],
    ) || resolveTeamName(teamNameMap, myTeamId, "우리 팀");
  const opponent =
    pick(
      row,
      isHome
        ? ["away_name", "opponent", "opponent_team", "away_team"]
        : ["home_name", "opponent", "opponent_team", "home_team"],
    ) || resolveTeamName(teamNameMap, opponentTeamId, "상대팀 미정");

  return {
    scheduleId: pick(row, ["id", "Id"]),
    scheduleDate: String(pick(row, ["date", "game_date", "match_date"]) || ""),
    date,
    opponent,
    teamName,
    stadiumName: "수원 KT wiz Park",
    isHome,
    attendanceSide:
      scheduleContext?.attendanceSide || (isHome ? "home" : "away"),
    attendanceStatus: getAttendanceStatus(scheduleContext?.attendanceValue),
    dateText: formatDateText(date),
    timeText: formatTimeText(date),
  };
};

export const summarizeUpcomingGame = (item) => ({
  scheduleId: item.scheduleId,
  scheduleDate: item.scheduleDate,
  dateText: item.dateText,
  teamName: item.teamName,
  opponent: item.opponent,
  timeText: item.timeText,
  attendanceStatus: item.attendanceStatus,
  attendanceSide: item.attendanceSide,
});

export const buildCalendarAttendanceMap = (games) =>
  games.reduce((result, item) => {
    const dateKey = toDateKey(item.date);
    const currentStatus = result[dateKey] || "pending";
    result[dateKey] = mergeAttendanceStatus(
      currentStatus,
      item.attendanceStatus,
    );
    return result;
  }, {});

export const buildNormalizedSchedules = (scheduleRows, member, teamNameMap) => {
  const todayStart = startOfDay(new Date()).getTime();

  return scheduleRows
    .filter(isActiveSchedule)
    .map((row) => ({
      row,
      scheduleContext: matchScheduleForUser(row, member),
    }))
    .filter((item) => item.scheduleContext.matched)
    .map((item) =>
      normalizeSchedule(item.row, item.scheduleContext, member, teamNameMap),
    )
    .filter(Boolean)
    .filter((item) => item.date.getTime() >= todayStart)
    .sort((a, b) => a.date.getTime() - b.date.getTime());
};

export const resolveMember = async (memberRes, normalizedUserId) => {
  if (memberRes.ok) {
    const memberJson = await memberRes.json();
    return memberJson?.member || memberJson;
  }

  const fallbackMemberRes = await fetch(`${API_BASE_URL}/api/member`);
  if (!fallbackMemberRes.ok) {
    throw new Error(
      `member API 오류: ${memberRes.status}/${fallbackMemberRes.status}`,
    );
  }

  const membersJson = await fallbackMemberRes.json();
  const members = Array.isArray(membersJson) ? membersJson : [];
  return findMemberByUserId(members, normalizedUserId) || null;
};

export const deleteSchedule = async (id) => {
  const response = await fetch(`${API_BASE_URL}${SCHEDULE_API_ENDPOINT}/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error(`HTTP 오류 ${response.status}`);
  }
  return response.json();
};

export const saveSchedule = async (data, editingId) => {
  const url = editingId
    ? `${API_BASE_URL}${SCHEDULE_API_ENDPOINT}/${editingId}`
    : `${API_BASE_URL}${SCHEDULE_API_ENDPOINT}`;
  
  const method = editingId ? "PUT" : "POST";

  const response = await fetch(url, {
    method: method,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`HTTP 상태 코드 ${response.status}`);
  }
  return response.json();
};

export const resetScheduleForm = (setters) => {
  const { setEditingId, setDate, setHome, setAway } = setters;
  setEditingId(null);
  setDate("");
  setHome("");
  setAway("");
};
