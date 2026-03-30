import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  PanResponder,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_BASE_URL } from "../constants/commonConstants";
import {
  ATTENDANCE_OPTIONS,
  MEMBER_API_ENDPOINT,
  SCHEDULE_API_ENDPOINT,
  TEAM_API_ENDPOINT,
  WEEKDAY_LABELS,
} from "../constants/scheduleConstants";
import { styles } from "./playerScheduleScreen.styles";
import CommonHeader from "../components/CommonHeader";
import CommonFooter from "../components/CommonFooter";

const PlayerScheduleScreen = ({ route }) => {
  const { id } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");
  const [memberId, setMemberId] = useState(null);
  const [memberTeamName, setMemberTeamName] = useState("");
  const [scheduleList, setScheduleList] = useState([]);
  const [visibleCount, setVisibleCount] = useState(5);
  const [monthDate, setMonthDate] = useState(new Date());
  const [openedKey, setOpenedKey] = useState("");
  const [savingKey, setSavingKey] = useState("");
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        if (mounted) {
          setLoading(true);
          setErrorText("");
          setScheduleList([]);
          setVisibleCount(5);
          setOpenedKey("");
        }

        const [memberRes, scheduleRes, teamRes] = await Promise.all([
          fetch(`${API_BASE_URL}${MEMBER_API_ENDPOINT}/${id}`),
          fetch(`${API_BASE_URL}${SCHEDULE_API_ENDPOINT}`),
          fetch(`${API_BASE_URL}${TEAM_API_ENDPOINT}`),
        ]);

        if (!scheduleRes.ok)
          throw new Error(`schedule API error: ${scheduleRes.status}`);
        if (!teamRes.ok) throw new Error(`team API error: ${teamRes.status}`);

        let member = null;

        if (memberRes.ok) {
          const memberJson = await memberRes.json();
          member = memberJson?.member ? memberJson.member : memberJson;
        } else {
          const allMemberRes = await fetch(
            `${API_BASE_URL}${MEMBER_API_ENDPOINT}`,
          );
          if (!allMemberRes.ok)
            throw new Error(`member API error: ${allMemberRes.status}`);
          const members = await allMemberRes.json();
          if (Array.isArray(members)) {
            for (let i = 0; i < members.length; i += 1) {
              if (
                String(members[i]?.Id ?? "").trim() ===
                  String(id ?? "").trim() ||
                String(members[i]?.User_ID ?? "").trim() ===
                  String(id ?? "").trim()
              ) {
                member = members[i];
                break;
              }
            }
          }
        }

        if (!member) throw new Error("사용자 정보를 찾을 수 없습니다.");

        const scheduleRows = await scheduleRes.json();
        const teamRows = await teamRes.json();
        const teamNameMap = {};
        const nextList = [];
        const today = new Date();
        const startToday = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
        ).getTime();

        if (Array.isArray(teamRows)) {
          for (let i = 0; i < teamRows.length; i += 1) {
            teamNameMap[String(teamRows[i]?.id ?? "")] = String(
              teamRows[i]?.name ?? "",
            );
          }
        }

        if (Array.isArray(scheduleRows)) {
          for (let i = 0; i < scheduleRows.length; i += 1) {
            const row = scheduleRows[i];
            if (row?.deleted_at) continue;

            let date = null;
            if (
              typeof row?.date === "string" &&
              /^\d{8}$/.test(row.date.trim())
            ) {
              date = new Date(
                Number(row.date.slice(0, 4)),
                Number(row.date.slice(4, 6)) - 1,
                Number(row.date.slice(6, 8)),
              );
            } else if (row?.date) {
              date = new Date(row.date);
            }

            if (!date || Number.isNaN(date.getTime())) continue;
            if (date.getTime() < startToday) continue;

            let homeMember = row?.home_member;
            let awayMember = row?.away_member;

            if (typeof homeMember === "string") {
              try {
                homeMember = JSON.parse(homeMember);
              } catch {
                homeMember = {};
              }
            }
            if (typeof awayMember === "string") {
              try {
                awayMember = JSON.parse(awayMember);
              } catch {
                awayMember = {};
              }
            }

            if (
              String(row?.home ?? "") !== String(member?.Team ?? "") &&
              String(row?.away ?? "") !== String(member?.Team ?? "") &&
              (!homeMember ||
                homeMember[String(member?.Id ?? "")] === undefined) &&
              (!awayMember ||
                awayMember[String(member?.Id ?? "")] === undefined)
            ) {
              continue;
            }

            const isHome =
              String(row?.home ?? "") === String(member?.Team ?? "") ||
              (homeMember &&
                homeMember[String(member?.Id ?? "")] !== undefined);
            const side = isHome ? "home" : "away";
            const value = isHome
              ? homeMember && homeMember[String(member?.Id ?? "")] !== undefined
                ? Number(homeMember[String(member?.Id ?? "")])
                : null
              : awayMember && awayMember[String(member?.Id ?? "")] !== undefined
                ? Number(awayMember[String(member?.Id ?? "")])
                : null;

            nextList.push({
              key: `${row?.id ?? row?.date}-${row?.home}-${row?.away}`,
              scheduleId: row?.id ?? null,
              scheduleDate: row?.date ?? "",
              isHome,
              attendanceSide: side,
              attendanceStatus:
                value === 1 ? "attending" : value === 0 ? "absent" : "pending",
              date,
              dateText: `${date.getMonth() + 1}월 ${date.getDate()}일`,
              timeText: `${date.getHours() === 0 ? 12 : date.getHours() > 12 ? date.getHours() - 12 : date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`,
              teamName: isHome
                ? teamNameMap[String(row?.home ?? "")] ||
                  `TEAM ${row?.home ?? ""}`
                : teamNameMap[String(row?.away ?? "")] ||
                  `TEAM ${row?.away ?? ""}`,
              opponent: isHome
                ? teamNameMap[String(row?.away ?? "")] ||
                  `TEAM ${row?.away ?? ""}`
                : teamNameMap[String(row?.home ?? "")] ||
                  `TEAM ${row?.home ?? ""}`,
            });
          }
        }

        nextList.sort((a, b) => a.date.getTime() - b.date.getTime());

        if (mounted) {
          setMemberId(member?.Id ?? null);
          setMemberTeamName(teamNameMap[String(member?.Team ?? "")] || "");
          setScheduleList(nextList);
          if (nextList.length > 0) {
            setMonthDate(
              new Date(
                nextList[0].date.getFullYear(),
                nextList[0].date.getMonth(),
                1,
              ),
            );
          } else {
            setMonthDate(new Date(today.getFullYear(), today.getMonth(), 1));
          }
        }
      } catch (error) {
        console.error("[PlayerScheduleScreen] load failed", error);
        if (mounted)
          setErrorText(error.message || "일정을 불러오지 못했습니다.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [id]);

  const calendarRows = useMemo(() => {
    const rows = [];
    const first = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const start = new Date(first);
    start.setDate(first.getDate() - first.getDay());

    for (let week = 0; week < 6; week += 1) {
      const row = [];
      for (let day = 0; day < 7; day += 1) {
        const cell = new Date(start);
        cell.setDate(start.getDate() + week * 7 + day);
        row.push(cell);
      }
      rows.push(row);
    }
    return rows;
  }, [monthDate]);

  const visibleSchedules = useMemo(
    () => scheduleList.slice(0, visibleCount),
    [scheduleList, visibleCount],
  );

  const runMonth = (offset) => {
    const direction = offset > 0 ? -1 : 1;
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: 18 * direction,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0.55,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setMonthDate(
        (current) =>
          new Date(current.getFullYear(), current.getMonth() + offset, 1),
      );
      translateX.setValue(-18 * direction);
      opacity.setValue(0.55);
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 0,
          duration: 160,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 160,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dx) > 20 &&
          Math.abs(gesture.dx) > Math.abs(gesture.dy),
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dx >= 50) runMonth(-1);
          if (gesture.dx <= -50) runMonth(1);
        },
      }),
    [],
  );

  const updateAttendance = async (item, status) => {
    try {
      setSavingKey(item.key);
      setErrorText("");

      const response = await fetch(`${API_BASE_URL}/api/schedule/attendance`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schedule_id: item.scheduleId,
          schedule_date: item.scheduleDate,
          member_id: memberId,
          side: item.attendanceSide,
          status,
        }),
      });

      const result = await response.json();
      if (!response.ok)
        throw new Error(
          result?.detail || `attendance API error: ${response.status}`,
        );

      setScheduleList((current) =>
        current.map((game) =>
          game.key === item.key ? { ...game, attendanceStatus: status } : game,
        ),
      );
      setOpenedKey("");
    } catch (error) {
      console.error("[PlayerScheduleScreen] attendance failed", error);
      setErrorText(error.message || "참석 여부를 저장하지 못했습니다.");
    } finally {
      setSavingKey("");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <CommonHeader title="playerScheduleScreen" />
      <View style={styles.body}>
        <View style={styles.calendarSection}>
          <View
            style={[styles.card, styles.calendarCard]}
            {...panResponder.panHandlers}
          >
            <Text style={styles.cardEyebrow}>Schedule Calendar</Text>
            <View style={styles.calendarTopRow}>
              <Text
                style={styles.cardTitle}
              >{`${monthDate.getFullYear()}년 ${monthDate.getMonth() + 1}월`}</Text>
              <TouchableOpacity
                style={styles.todayButton}
                onPress={() =>
                  setMonthDate(
                    new Date(
                      new Date().getFullYear(),
                      new Date().getMonth(),
                      1,
                    ),
                  )
                }
              >
                <Text style={styles.todayButtonText}>오늘</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.calendarBody}>
              <TouchableOpacity
                style={[
                  styles.calendarSideButton,
                  styles.calendarSideButtonLeft,
                ]}
                onPress={() => runMonth(-1)}
              >
                <Text style={styles.calendarSideArrow}>‹</Text>
              </TouchableOpacity>

              <Animated.View style={{ transform: [{ translateX }], opacity }}>
                <View style={styles.weekHeader}>
                  {WEEKDAY_LABELS.map((day) => (
                    <Text key={day} style={styles.weekDay}>
                      {day}
                    </Text>
                  ))}
                </View>

                {calendarRows.map((row, rowIndex) => (
                  <View key={`row-${rowIndex}`} style={styles.weekRow}>
                    {row.map((cell) => (
                      <View
                        key={`${cell.getFullYear()}-${cell.getMonth()}-${cell.getDate()}`}
                        style={styles.dayCell}
                      >
                        <View
                          style={[
                            styles.dayCircle,
                            scheduleList.some(
                              (game) =>
                                game.date.getFullYear() ===
                                  cell.getFullYear() &&
                                game.date.getMonth() === cell.getMonth() &&
                                game.date.getDate() === cell.getDate(),
                            ) && styles.dayEvent,
                            scheduleList.some(
                              (game) =>
                                game.date.getFullYear() ===
                                  cell.getFullYear() &&
                                game.date.getMonth() === cell.getMonth() &&
                                game.date.getDate() === cell.getDate() &&
                                game.attendanceStatus === "attending",
                            ) && styles.dayEventAttending,
                            scheduleList.some(
                              (game) =>
                                game.date.getFullYear() ===
                                  cell.getFullYear() &&
                                game.date.getMonth() === cell.getMonth() &&
                                game.date.getDate() === cell.getDate() &&
                                game.attendanceStatus === "pending",
                            ) && styles.dayEventPending,
                            scheduleList.some(
                              (game) =>
                                game.date.getFullYear() ===
                                  cell.getFullYear() &&
                                game.date.getMonth() === cell.getMonth() &&
                                game.date.getDate() === cell.getDate() &&
                                game.attendanceStatus === "absent",
                            ) && styles.dayEventAbsent,
                            new Date().getFullYear() === cell.getFullYear() &&
                              new Date().getMonth() === cell.getMonth() &&
                              new Date().getDate() === cell.getDate() &&
                              styles.dayToday,
                          ]}
                        >
                          <Text
                            style={[
                              styles.dayText,
                              cell.getMonth() !== monthDate.getMonth() &&
                                styles.dayDim,
                            ]}
                          >
                            {cell.getDate()}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                ))}
              </Animated.View>

              <TouchableOpacity
                style={[
                  styles.calendarSideButton,
                  styles.calendarSideButtonRight,
                ]}
                onPress={() => runMonth(1)}
              >
                <Text style={styles.calendarSideArrow}>›</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <ScrollView
          style={styles.listScroll}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}

          <View style={styles.card}>
            <View style={styles.listTitleRow}>
              <View>
                <Text style={styles.cardEyebrow}>Attendance</Text>
                <Text style={styles.cardTitle}>
                  {memberTeamName
                    ? `${memberTeamName} 경기 일정 관리`
                    : "경기 일정 관리"}
                </Text>
              </View>
              <Text style={styles.listCountText}>
                {scheduleList.length}경기
              </Text>
            </View>

            {loading ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator size="small" color="#4a7c59" />
                <Text style={styles.loadingText}>
                  일정을 불러오는 중입니다.
                </Text>
              </View>
            ) : scheduleList.length === 0 ? (
              <Text style={styles.emptyText}>확인할 예정 경기가 없습니다.</Text>
            ) : (
              visibleSchedules.map((item) => (
                <View key={item.key} style={styles.listItem}>
                  <View style={styles.listMain}>
                    <View style={styles.listHeaderRow}>
                      <Text style={styles.listDate}>{item.dateText}</Text>
                      <Text style={styles.listTime}>{item.timeText}</Text>
                    </View>

                    <View style={styles.listMatchRow}>
                      <Text
                        style={styles.listOpponent}
                      >{`${item.teamName} vs ${item.opponent}`}</Text>
                      <TouchableOpacity
                        style={[
                          styles.attendanceBadge,
                          styles.attendanceBadgeInline,
                          {
                            backgroundColor:
                              item.attendanceStatus === "attending"
                                ? "#d9f1df"
                                : item.attendanceStatus === "absent"
                                  ? "#f4dada"
                                  : "#d9d5cf",
                            borderColor:
                              item.attendanceStatus === "attending"
                                ? "#2f8f4e55"
                                : item.attendanceStatus === "absent"
                                  ? "#c8474755"
                                  : "#8f8f8f55",
                          },
                        ]}
                        onPress={() =>
                          setOpenedKey((current) =>
                            current === item.key ? "" : item.key,
                          )
                        }
                      >
                        <Text
                          style={[
                            styles.attendanceBadgeIcon,
                            {
                              color:
                                item.attendanceStatus === "attending"
                                  ? "#2f8f4e"
                                  : item.attendanceStatus === "absent"
                                    ? "#c84747"
                                    : "#8f8f8f",
                            },
                          ]}
                        >
                          {item.attendanceStatus === "attending"
                            ? "O"
                            : item.attendanceStatus === "absent"
                              ? "X"
                              : "-"}
                        </Text>
                        <Text
                          style={[
                            styles.attendanceBadgeText,
                            {
                              color:
                                item.attendanceStatus === "attending"
                                  ? "#2f8f4e"
                                  : item.attendanceStatus === "absent"
                                    ? "#c84747"
                                    : "#8f8f8f",
                            },
                          ]}
                        >
                          {item.attendanceStatus === "attending"
                            ? "참석"
                            : item.attendanceStatus === "absent"
                              ? "불참"
                              : "미응답"}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.listMeta}>
                      {item.isHome ? "홈 경기" : "원정 경기"}
                    </Text>
                  </View>

                  <View style={styles.attendanceWrap}>
                    {openedKey === item.key ? (
                      <View style={styles.attendanceOptionRow}>
                        {ATTENDANCE_OPTIONS.map((option) => (
                          <TouchableOpacity
                            key={`${item.key}-${option.key}`}
                            style={[
                              styles.attendanceOptionButton,
                              item.attendanceStatus === option.key &&
                                styles.attendanceOptionButtonSelected,
                            ]}
                            onPress={() => updateAttendance(item, option.key)}
                            disabled={savingKey === item.key}
                          >
                            <Text
                              style={[
                                styles.attendanceOptionIcon,
                                { color: option.color },
                              ]}
                            >
                              {option.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    ) : null}
                    {savingKey === item.key ? (
                      <Text style={styles.savingText}>저장 중...</Text>
                    ) : null}
                  </View>
                </View>
              ))
            )}

            {scheduleList.length > visibleCount ? (
              <TouchableOpacity
                style={styles.moreButton}
                onPress={() => setVisibleCount((current) => current + 5)}
              >
                <Text style={styles.moreText}>더보기</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </ScrollView>
      </View>
      <CommonFooter activeTab="PlayerSchedule" />
    </SafeAreaView>
  );
};

export default PlayerScheduleScreen;
