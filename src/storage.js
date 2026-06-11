const fs = require("node:fs");
const path = require("node:path");

const dataDir = path.join(__dirname, "..", "data");

function ensureDataDir() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function filePath(name) {
  ensureDataDir();
  return path.join(dataDir, `${name}.json`);
}

function readJson(name, fallback) {
  const target = filePath(name);
  if (!fs.existsSync(target)) {
    return fallback;
  }

  try {
    return JSON.parse(fs.readFileSync(target, "utf8"));
  } catch (error) {
    console.error(`Could not read data/${name}.json`, error);
    return fallback;
  }
}

function writeJson(name, value) {
  fs.writeFileSync(filePath(name), `${JSON.stringify(value, null, 2)}\n`);
}

function getGuildSettings(guildId) {
  const settings = readJson("settings", {});
  return settings[guildId] || {};
}

function updateGuildSettings(guildId, patch) {
  const settings = readJson("settings", {});
  settings[guildId] = {
    ...(settings[guildId] || {}),
    ...patch
  };
  writeJson("settings", settings);
  return settings[guildId];
}

function getSessions() {
  return readJson("sessions", {});
}

function saveSessions(sessions) {
  writeJson("sessions", sessions);
}

function getWarnings() {
  return readJson("warnings", {});
}

function saveWarnings(warnings) {
  writeJson("warnings", warnings);
}

function getOwnerPingWarnings() {
  return readJson("owner-ping-warnings", {});
}

function saveOwnerPingWarnings(warnings) {
  writeJson("owner-ping-warnings", warnings);
}

function getBoostRewards() {
  return readJson("boost-rewards", {});
}

function saveBoostRewards(boostRewards) {
  writeJson("boost-rewards", boostRewards);
}

function getQuotaLogs() {
  return readJson("quota-logs", {});
}

function saveQuotaLogs(quotaLogs) {
  writeJson("quota-logs", quotaLogs);
}

function getSessionVerifications() {
  return readJson("session-verifications", {});
}

function saveSessionVerifications(sessionVerifications) {
  writeJson("session-verifications", sessionVerifications);
}

function getQuotaPanels() {
  return readJson("quota-panels", {});
}

function saveQuotaPanels(quotaPanels) {
  writeJson("quota-panels", quotaPanels);
}

function getEconomy() {
  return readJson("economy", {});
}

function saveEconomy(economy) {
  writeJson("economy", economy);
}

function getCitations() {
  return readJson("citations", {});
}

function saveCitations(citations) {
  writeJson("citations", citations);
}

function getPsDatabase() {
  return readJson("ps-database", {});
}

function savePsDatabase(psDatabase) {
  writeJson("ps-database", psDatabase);
}

function getBotSettings(guildId) {
  const botSettings = readJson("bot-settings", {});
  return botSettings[guildId] || {};
}

function updateBotSettings(guildId, patch) {
  const botSettings = readJson("bot-settings", {});
  botSettings[guildId] = {
    ...(botSettings[guildId] || {}),
    ...patch
  };
  writeJson("bot-settings", botSettings);
  return botSettings[guildId];
}

module.exports = {
  getBotSettings,
  getGuildSettings,
  updateGuildSettings,
  getSessions,
  saveSessions,
  getWarnings,
  saveWarnings,
  getOwnerPingWarnings,
  saveOwnerPingWarnings,
  getBoostRewards,
  saveBoostRewards,
  getQuotaLogs,
  saveQuotaLogs,
  getSessionVerifications,
  saveSessionVerifications,
  getQuotaPanels,
  saveQuotaPanels,
  getEconomy,
  saveEconomy,
  getCitations,
  saveCitations,
  getPsDatabase,
  updateBotSettings,
  savePsDatabase
};
