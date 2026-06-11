const fs = require("node:fs");
const path = require("node:path");
const { quotaLeaderboardChannelId, quotaRequirements } = require("./config");
const { quotaLeaderboardEmbed } = require("./embeds");
const { formatDuration, getLeaderboard, getQuotaGroup } = require("./quota");

const quotaPanelsPath = path.join(__dirname, "..", "data", "quota-panels.json");

function readQuotaPanels() {
  fs.mkdirSync(path.dirname(quotaPanelsPath), { recursive: true });
  if (!fs.existsSync(quotaPanelsPath)) return {};

  try {
    return JSON.parse(fs.readFileSync(quotaPanelsPath, "utf8"));
  } catch (error) {
    console.error("Could not read data/quota-panels.json", error);
    return {};
  }
}

function writeQuotaPanels(quotaPanels) {
  fs.mkdirSync(path.dirname(quotaPanelsPath), { recursive: true });
  fs.writeFileSync(quotaPanelsPath, `${JSON.stringify(quotaPanels, null, 2)}\n`);
}

async function buildVisibleQuotaRows(guild) {
  const rows = getLeaderboard(guild.id);
  const visibleRows = [];

  for (const row of rows) {
    const member = await guild.members.fetch(row.userId).catch(() => null);
    const quotaGroup = member ? getQuotaGroup(member) : quotaRequirements.lowRank;
    if (!quotaGroup) continue;

    visibleRows.push({
      ...row,
      quotaGroup,
      displayName: member?.displayName || `User ${row.userId}`
    });
  }

  return visibleRows;
}

async function sendOrUpdateQuotaMessage({ client, guildId, channelId, panelKey, embeds }) {
  const channel = await client.channels.fetch(channelId).catch(() => null);
  if (!channel?.isTextBased()) return null;

  const quotaPanels = readQuotaPanels();
  const guildPanels = quotaPanels[guildId] || {};
  const savedMessageId = guildPanels[panelKey];

  if (savedMessageId) {
    const savedMessage = await channel.messages.fetch(savedMessageId).catch(() => null);
    if (savedMessage) {
      await savedMessage.edit({ embeds }).catch(() => null);
      return { channel, message: savedMessage, repaired: false };
    }
  }

  const message = await channel.send({ embeds }).catch(() => null);
  if (!message) return { channel, message: null, failedSend: true };

  guildPanels[panelKey] = message.id;
  quotaPanels[guildId] = guildPanels;
  writeQuotaPanels(quotaPanels);
  return { channel, message, repaired: true };
}

async function refreshQuotaLeaderboard(client, guild) {
  const visibleRows = await buildVisibleQuotaRows(guild);
  return sendOrUpdateQuotaMessage({
    client,
    guildId: guild.id,
    channelId: quotaLeaderboardChannelId,
    panelKey: "leaderboard",
    embeds: [quotaLeaderboardEmbed({ rows: visibleRows, formatDuration })]
  });
}

module.exports = {
  buildVisibleQuotaRows,
  refreshQuotaLeaderboard,
  sendOrUpdateQuotaMessage
};
