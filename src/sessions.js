const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { getSessions, saveSessions } = require("./storage");
const { successEmoji, successEmojiId } = require("./config");
const { sessionSetupEmbed } = require("./embeds");

const successEmojiName = successEmoji.match(/^<a?:([^:]+):\d+>$/)?.[1] || successEmoji;
const fallbackSuccessEmoji = "\u2705";
const activeSessionsByGuild = new Map();

function sessionLinkButton(sessionMessageId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`session:link:${sessionMessageId}`)
      .setLabel("Session Link")
      .setStyle(ButtonStyle.Success)
  );
}

function activeSessionKey(guildId) {
  return `active:${guildId}`;
}

function saveActiveSession(session) {
  activeSessionsByGuild.set(session.guildId, session);

  const sessions = getSessions();
  sessions[session.messageId] = session;
  sessions[activeSessionKey(session.guildId)] = session.messageId;
  saveSessions(sessions);

  console.log(`Saved active session ${session.messageId} for guild ${session.guildId}`);
}

function clearActiveSession(guildId, messageId) {
  activeSessionsByGuild.delete(guildId);

  const sessions = getSessions();
  delete sessions[messageId];
  delete sessions[activeSessionKey(guildId)];
  saveSessions(sessions);

  console.log(`Cleared active session ${messageId} for guild ${guildId}`);
}

async function handleReaction(reaction, user) {
  if (user.bot) return;
  if (reaction.partial) await reaction.fetch();
  if (reaction.message.partial) await reaction.message.fetch();

  const sessions = getSessions();
  const session = sessions[reaction.message.id];

  if (!session) return;
  if (!isSuccessReaction(reaction)) return;

  await refreshSessionReactionState(reaction.message.client, reaction.message.id);
}

function isSuccessReaction(reaction) {
  return reaction.emoji.id === successEmojiId
    || reaction.emoji.name === successEmojiId
    || reaction.emoji.name === successEmojiName
    || reaction.emoji.name === fallbackSuccessEmoji;
}

function findSuccessReaction(message) {
  const exactReaction = message.reactions.cache.find((reaction) => isSuccessReaction(reaction));
  if (exactReaction) return exactReaction;

  return message.reactions.cache.find((reaction) => reaction.me)
    || message.reactions.cache.first()
    || null;
}

async function addStartupReaction(message) {
  const emojiOptions = [successEmoji, successEmojiId, fallbackSuccessEmoji];

  for (const emoji of emojiOptions) {
    try {
      await message.react(emoji);
      console.log(`Added startup reaction using ${emoji}`);
      return emoji;
    } catch (error) {
      console.error(`Could not add startup reaction with ${emoji}`, error.message);
    }
  }

  return null;
}

async function refreshSessionReactionState(client, sessionMessageId) {
  const sessions = getSessions();
  const session = sessions[sessionMessageId];
  if (!session) return null;

  const channel = await client.channels.fetch(session.channelId).catch(() => null);
  const message = await channel?.messages.fetch(session.messageId).catch(() => null);
  const successReaction = message ? findSuccessReaction(message) : null;
  if (!message || !successReaction) return session;

  const users = await successReaction.users.fetch().catch(() => null);
  const reactedUserIds = users
    ? users.filter((reactUser) => !reactUser.bot).map((reactUser) => reactUser.id)
    : session.reactedUserIds || [];
  const visibleCount = Math.max(0, (successReaction.count || 0) - (successReaction.me ? 1 : 0));
  const count = Math.max(reactedUserIds.length, visibleCount);

  session.reactedUserIds = reactedUserIds;
  console.log(`Session ${sessionMessageId} has ${count}/${session.requiredReactions} reactions`);

  if (session.reactionsMet || count < session.requiredReactions) {
    sessions[sessionMessageId] = session;
    sessions[activeSessionKey(session.guildId)] = sessionMessageId;
    saveSessions(sessions);
    activeSessionsByGuild.set(session.guildId, session);
    return session;
  }

  session.reactionsMet = true;
  sessions[sessionMessageId] = session;
  sessions[activeSessionKey(session.guildId)] = sessionMessageId;
  saveSessions(sessions);
  activeSessionsByGuild.set(session.guildId, session);

  if (!session.setupMessageSent) {
    await message.channel.send({
      embeds: [sessionSetupEmbed({ host: `<@${session.hostId}>` })],
      allowedMentions: { users: [session.hostId] }
    });

    const latestSessions = getSessions();
    if (latestSessions[sessionMessageId]) {
      latestSessions[sessionMessageId].setupMessageSent = true;
      latestSessions[activeSessionKey(session.guildId)] = sessionMessageId;
      saveSessions(latestSessions);
      activeSessionsByGuild.set(session.guildId, latestSessions[sessionMessageId]);
      return latestSessions[sessionMessageId];
    }
  }

  return session;
}

function getActiveSessionForGuild(guildId) {
  const memorySession = activeSessionsByGuild.get(guildId);
  if (memorySession && !memorySession.endedAt) {
    return [memorySession.messageId, memorySession];
  }

  const sessions = getSessions();
  const messageId = sessions[activeSessionKey(guildId)];
  if (messageId && sessions[messageId] && !sessions[messageId].endedAt) {
    activeSessionsByGuild.set(guildId, sessions[messageId]);
    return [messageId, sessions[messageId]];
  }

  const active = Object.entries(sessions).find(([key, session]) =>
    !key.startsWith("active:")
    && session
    && typeof session === "object"
    && session.guildId === guildId
    && !session.endedAt
  );

  if (active) activeSessionsByGuild.set(guildId, active[1]);
  return active;
}

async function hasUserReactedToSession(interaction, session) {
  if (session.reactedUserIds?.includes(interaction.user.id)) return true;

  const channel = await interaction.client.channels.fetch(session.channelId).catch(() => null);
  const message = await channel?.messages.fetch(session.messageId).catch(() => null);
  const successReaction = message ? findSuccessReaction(message) : null;
  if (!successReaction) return false;

  const users = await successReaction.users.fetch().catch(() => null);
  if (!users) return false;

  const reactedUserIds = users.filter((reactUser) => !reactUser.bot).map((reactUser) => reactUser.id);
  const sessions = getSessions();
  if (sessions[session.messageId]) {
    sessions[session.messageId].reactedUserIds = reactedUserIds;
    sessions[activeSessionKey(session.guildId)] = session.messageId;
    saveSessions(sessions);
  }

  return reactedUserIds.includes(interaction.user.id);
}

async function handleSessionButton(interaction) {
  const [, action, sessionMessageId] = interaction.customId.split(":");
  if (action !== "link") return;

  const sessions = getSessions();
  const session = sessions[sessionMessageId];
  if (!session || session.endedAt) {
    await interaction.reply({ content: "This session link is no longer available.", ephemeral: true });
    return;
  }

  const reacted = await hasUserReactedToSession(interaction, session);
  if (!reacted) {
    await interaction.reply({
      content: `You need to react with ${successEmoji} on the startup message before using this session link.`,
      ephemeral: true
    });
    return;
  }

  await interaction.reply({
    content: `Here is the private server link:\n${session.robloxLink}`,
    ephemeral: true
  });
}

module.exports = {
  addStartupReaction,
  clearActiveSession,
  getActiveSessionForGuild,
  handleReaction,
  handleSessionButton,
  refreshSessionReactionState,
  saveActiveSession,
  sessionLinkButton
};
