const { minimumQuotaSessionMinutes, quotaIgnoreRoleIds, quotaRequirements } = require("./config");
const fs = require("node:fs");
const path = require("node:path");
const storage = require("./storage");

const quotaLogsPath = path.join(__dirname, "..", "data", "quota-logs.json");
const sessionVerificationsPath = path.join(__dirname, "..", "data", "session-verifications.json");

function ensureQuotaDataDir() {
  fs.mkdirSync(path.dirname(quotaLogsPath), { recursive: true });
}

function readQuotaLogs() {
  if (typeof storage.getQuotaLogs === "function") {
    return storage.getQuotaLogs();
  }

  ensureQuotaDataDir();
  if (!fs.existsSync(quotaLogsPath)) return {};

  try {
    return JSON.parse(fs.readFileSync(quotaLogsPath, "utf8"));
  } catch (error) {
    console.error("Could not read data/quota-logs.json", error);
    return {};
  }
}

function writeQuotaLogs(quotaLogs) {
  if (typeof storage.saveQuotaLogs === "function") {
    storage.saveQuotaLogs(quotaLogs);
    return;
  }

  ensureQuotaDataDir();
  fs.writeFileSync(quotaLogsPath, `${JSON.stringify(quotaLogs, null, 2)}\n`);
}

function readSessionVerifications() {
  if (typeof storage.getSessionVerifications === "function") {
    return storage.getSessionVerifications();
  }

  fs.mkdirSync(path.dirname(sessionVerificationsPath), { recursive: true });
  if (!fs.existsSync(sessionVerificationsPath)) return {};

  try {
    return JSON.parse(fs.readFileSync(sessionVerificationsPath, "utf8"));
  } catch (error) {
    console.error("Could not read data/session-verifications.json", error);
    return {};
  }
}

function writeSessionVerifications(sessionVerifications) {
  if (typeof storage.saveSessionVerifications === "function") {
    storage.saveSessionVerifications(sessionVerifications);
    return;
  }

  fs.mkdirSync(path.dirname(sessionVerificationsPath), { recursive: true });
  fs.writeFileSync(sessionVerificationsPath, `${JSON.stringify(sessionVerifications, null, 2)}\n`);
}

function parseSessionTime(input, now = new Date()) {
  const cleaned = input.trim();
  const timeMatch = cleaned.match(/^(\d{1,2}):(\d{2})$/);
  if (timeMatch) {
    const date = new Date(now);
    date.setHours(Number(timeMatch[1]), Number(timeMatch[2]), 0, 0);
    return date;
  }

  const parsed = new Date(cleaned);
  if (!Number.isNaN(parsed.getTime())) return parsed;
  return null;
}

function formatDuration(minutes) {
  const safeMinutes = Math.max(0, Math.floor(minutes));
  const hours = Math.floor(safeMinutes / 60);
  const mins = safeMinutes % 60;
  return `${hours}h ${mins}m`;
}

function currentQuotaWeek() {
  const now = new Date();
  const start = new Date(now);
  const day = start.getDay() || 7;
  start.setDate(start.getDate() - day + 1);
  start.setHours(0, 0, 0, 0);
  return start.toISOString().slice(0, 10);
}

function addSessionLog({ guildId, userId, startAt, endAt, notes }) {
  let end = endAt;
  if (end <= startAt) {
    end = new Date(end.getTime() + 24 * 60 * 60 * 1000);
  }

  const minutes = Math.max(1, Math.round((end - startAt) / 60000));
  const quotaLogs = readQuotaLogs();
  const guildLogs = quotaLogs[guildId] || {};
  const week = currentQuotaWeek();
  const userLog = guildLogs[userId] || { totalMinutes: 0, logs: [] };

  userLog.totalMinutes += minutes;
  userLog.logs.push({
    startAt: startAt.toISOString(),
    endAt: end.toISOString(),
    minutes,
    notes: notes || "",
    loggedAt: new Date().toISOString()
  });

  guildLogs[userId] = userLog;
  quotaLogs[guildId] = guildLogs;
  writeQuotaLogs(quotaLogs);

  return {
    week,
    minutes,
    totalMinutes: userLog.totalMinutes
  };
}

function recordVerifiedSession({ guildId, sessionId, hostId, participantIds, startAt, endAt, notes }) {
  const sessionMinutes = Math.max(0, Math.floor((Number(endAt) - Number(startAt)) / 60000));
  if (sessionMinutes < minimumQuotaSessionMinutes) {
    return false;
  }

  const sessionVerifications = readSessionVerifications();
  const guildVerifications = sessionVerifications[guildId] || [];
  const uniqueParticipantIds = Array.from(new Set([hostId, ...(participantIds || [])].filter(Boolean)));

  for (const participantId of uniqueParticipantIds) {
    guildVerifications.push({
      sessionId,
      hostId: participantId,
      startAt: new Date(startAt).toISOString(),
      endAt: new Date(endAt).toISOString(),
      notes: notes || "",
      usedByLog: false,
      createdAt: new Date().toISOString()
    });
  }

  sessionVerifications[guildId] = guildVerifications.slice(-100);
  writeSessionVerifications(sessionVerifications);
  return true;
}

function consumeVerifiedSession({ guildId, userId, startAt, endAt }) {
  let submittedEnd = endAt;
  if (submittedEnd <= startAt) {
    submittedEnd = new Date(submittedEnd.getTime() + 24 * 60 * 60 * 1000);
  }

  const submittedMinutes = Math.max(1, Math.round((submittedEnd - startAt) / 60000));
  const sessionVerifications = readSessionVerifications();
  const guildVerifications = sessionVerifications[guildId] || [];
  const now = Date.now();
  const maxAgeMs = 7 * 24 * 60 * 60 * 1000;

  const index = guildVerifications.findIndex((session) => {
    if (session.usedByLog) return false;
    if (session.hostId !== userId) return false;

    const realStart = new Date(session.startAt);
    const realEnd = new Date(session.endAt);
    if (Number.isNaN(realStart.getTime()) || Number.isNaN(realEnd.getTime())) return false;
    if (now - realEnd.getTime() > maxAgeMs) return false;

    const realMinutes = Math.max(1, Math.round((realEnd - realStart) / 60000));
    const startsClose = Math.abs(startAt.getTime() - realStart.getTime()) <= 30 * 60 * 1000;
    const endsClose = Math.abs(submittedEnd.getTime() - realEnd.getTime()) <= 30 * 60 * 1000;
    const durationAllowed = submittedMinutes <= realMinutes + 15;

    return startsClose && endsClose && durationAllowed;
  });

  if (index === -1) {
    return null;
  }

  guildVerifications[index].usedByLog = true;
  guildVerifications[index].usedAt = new Date().toISOString();
  sessionVerifications[guildId] = guildVerifications;
  writeSessionVerifications(sessionVerifications);

  return guildVerifications[index];
}

function getLeaderboard(guildId) {
  const quotaLogs = readQuotaLogs();
  const guildLogs = quotaLogs[guildId] || {};
  return Object.entries(guildLogs)
    .map(([userId, log]) => ({
      userId,
      totalMinutes: log.totalMinutes || 0
    }))
    .sort((a, b) => b.totalMinutes - a.totalMinutes);
}

function resetQuotaLogs(guildId) {
  const quotaLogs = readQuotaLogs();
  quotaLogs[guildId] = {};
  writeQuotaLogs(quotaLogs);
}

function getQuotaGroup(member) {
  if (isQuotaIgnored(member)) return null;

  const groups = [
    quotaRequirements.ownership,
    quotaRequirements.highRank,
    quotaRequirements.middleRank,
    quotaRequirements.lowRank
  ];
  return groups.find((group) => group.roleIds.some((roleId) => member.roles.cache.has(roleId))) || quotaRequirements.lowRank;
}

function isQuotaIgnored(member) {
  return quotaIgnoreRoleIds.some((roleId) => member.roles.cache.has(roleId));
}

module.exports = {
  addSessionLog,
  currentQuotaWeek,
  formatDuration,
  getLeaderboard,
  getQuotaGroup,
  isQuotaIgnored,
  parseSessionTime,
  consumeVerifiedSession,
  recordVerifiedSession,
  resetQuotaLogs
};
