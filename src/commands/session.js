const path = require("node:path");
const { AttachmentBuilder, PermissionFlagsBits, SlashCommandBuilder } = require("discord.js");
const { civilianRoleId, developerRoleId, highCommandRoleId, minimumQuotaSessionMinutes, roleplayOnePreserveMessageIds, sessionTestingChannelId } = require("../config");
const { getGuildSettings } = require("../storage");
const { sessionStartEmbed, sessionEndEmbed, sessionTerminatedEmbed, roleplayOneInfoEmbed, roleplayOneStartupEmbed } = require("../embeds");
const { addStartupReaction, clearActiveSession, getActiveSessionForGuild, refreshSessionReactionState, saveActiveSession } = require("../sessions");
const { recordVerifiedSession } = require("../quota");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("end-session")
    .setDescription("End the active Greenville Roleplay Rural session.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption((option) =>
      option.setName("notes").setDescription("Session ending notes.").setMaxLength(500).setRequired(false)
    ),

  async execute(interaction) {
    const settings = getGuildSettings(interaction.guildId);

    if (!canTerminateSession(interaction)) {
      await interaction.reply({ content: "Only High Command or HR can terminate sessions.", ephemeral: true });
      return;
    }

    if (!settings.sessionChannelId) {
      await interaction.reply({ content: "Run `/setup channels` before using session commands.", ephemeral: true });
      return;
    }

    await endSession(interaction, settings);
  }
};

async function startSession(interaction, settings) {
  const active = getActiveSessionForGuild(interaction.guildId);
  if (active) {
    await interaction.reply({ content: "There is already an active session. End it before starting a new one.", ephemeral: true });
    return;
  }

  const requiredReactions = interaction.options.getInteger("required_reactions");
  const robloxLink = interaction.options.getString("roblox_link");
  const notes = interaction.options.getString("notes") || "";
  const channel = await interaction.client.channels.fetch(sessionTestingChannelId || settings.sessionChannelId);
  const pingRoleIds = [civilianRoleId];
  const startupBanner = new AttachmentBuilder(
    path.join(__dirname, "..", "..", "assets", "session-startup.png"),
    { name: "session-startup.png" }
  );

  const message = await channel.send({
    content: pingRoleIds.length ? pingRoleIds.map((roleId) => `<@&${roleId}>`).join(" ") : undefined,
    embeds: [
      sessionStartEmbed({
        host: interaction.user,
        requiredReactions,
        notes
      })
    ],
    files: [startupBanner],
    allowedMentions: pingRoleIds.length ? { roles: pingRoleIds } : { parse: [] }
  });

  saveActiveSession({
    guildId: interaction.guildId,
    channelId: channel.id,
    messageId: message.id,
    hostId: interaction.user.id,
    startAt: Date.now(),
    requiredReactions,
    robloxLink,
    notes,
    reactionsMet: false,
    reactedUserIds: [],
    setupMessageSent: false,
    earlyAccessSent: false
  });

  await addStartupReaction(message);
  watchStartupReactions(interaction.client, message.id);

  await interaction.reply({ content: `Session startup posted in ${channel}.`, ephemeral: true });
}

function watchStartupReactions(client, messageId) {
  let checks = 0;
  setTimeout(() => refreshSessionReactionState(client, messageId).catch(console.error), 1500);
  const interval = setInterval(async () => {
    checks += 1;
    try {
      const session = await refreshSessionReactionState(client, messageId);
      if (!session || session.reactionsMet || session.endedAt || checks >= 36) {
        clearInterval(interval);
      }
    } catch (error) {
      console.error("Could not refresh startup reactions", error);
      if (checks >= 36) clearInterval(interval);
    }
  }, 5000);
}

async function endSession(interaction, settings, options = {}) {
  const active = getActiveSessionForGuild(interaction.guildId);
  if (!active) {
    await interaction.reply({ content: "There is no active session to end.", ephemeral: true });
    return;
  }

  const [messageId, session] = active;
  const notes = options.terminationReason || interaction.options.getString("notes") || session.notes || "";
  const endAt = Date.now();
  const channel = await interaction.client.channels.fetch(session.channelId || settings.sessionChannelId);

  if (options.terminated) {
    await channel.send({
      embeds: [
        sessionTerminatedEmbed({
          moderator: `<@${interaction.user.id}>`,
          reason: notes
        })
      ],
      allowedMentions: { users: [interaction.user.id] }
    });
  } else {
    const sessionOverBanner = new AttachmentBuilder(
      path.join(__dirname, "..", "..", "assets", "session-over.png"),
      { name: "session-over.png" }
    );

    await channel.send({
      embeds: [
        sessionEndEmbed({
          host: `<@${session.hostId}>`,
          startAt: session.startAt,
          endAt,
          notes
        })
      ],
      files: [sessionOverBanner]
    });
  }

  await purgeRoleplayOneChannel(interaction, settings);

  if (!options.terminated) {
    const counted = recordVerifiedSession({
      guildId: interaction.guildId,
      sessionId: messageId,
      hostId: session.hostId,
      participantIds: session.cohostIds || [],
      startAt: session.startAt,
      endAt,
      notes
    });
    session.countedForQuota = counted;
  }

  clearActiveSession(interaction.guildId, messageId);

  await interaction.reply({
    content: options.terminated
      ? `Session terminated in ${channel}. This session will not count for quota.`
      : session.countedForQuota === false
      ? `Session ended in ${channel}. It was under ${minimumQuotaSessionMinutes} minutes, so it will not count for quota.`
      : `Session ended in ${channel}.`,
    ephemeral: true
  });
}

async function purgeRoleplayOneChannel(interaction, settings) {
  const roleplayOneChannelId = settings.roleplayOneChannelId || require("../config").roleplayOneChannelId;
  if (!roleplayOneChannelId) return;

  const roleplayChannel = await interaction.client.channels.fetch(roleplayOneChannelId).catch(() => null);
  if (!roleplayChannel?.isTextBased()) return;

  const messages = await roleplayChannel.messages.fetch({ limit: 100 });
  const preserveMessageIds = new Set(roleplayOnePreserveMessageIds || []);
  const purgeableMessages = messages.filter((message) =>
    !preserveMessageIds.has(message.id) && message.author.id !== interaction.client.user.id
  );
  if (purgeableMessages.size) {
    await roleplayChannel.bulkDelete(purgeableMessages, true).catch(console.error);
  }
}

function canTerminateSession(interaction) {
  return interaction.member.roles.cache.has(highCommandRoleId)
    || interaction.member.roles.cache.has(developerRoleId)
    || interaction.memberPermissions.has(PermissionFlagsBits.Administrator);
}

module.exports.startSession = startSession;
module.exports.endSession = endSession;
module.exports.canTerminateSession = canTerminateSession;
