const path = require("node:path");
const {
  AttachmentBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder
} = require("discord.js");
const { civilianRoleId, developerRoleId, highCommandRoleId, sessionHostRoleId } = require("../config");
const { sessionReleaseEmbed } = require("../embeds");
const { getGuildSettings, getSessions, saveSessions } = require("../storage");
const { getActiveSessionForGuild, refreshSessionReactionState, sessionLinkButton } = require("../sessions");

function canUseSessionCommand(interaction) {
  return interaction.member.roles.cache.has(sessionHostRoleId)
    || interaction.member.roles.cache.has(highCommandRoleId)
    || interaction.member.roles.cache.has(developerRoleId)
    || interaction.memberPermissions.has(PermissionFlagsBits.Administrator);
}

function isValidSessionLink(url) {
  return typeof url === "string" && /^https?:\/\//i.test(url);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("release")
    .setDescription("Release the active session to civilians.")
    .addStringOption((option) =>
      option
        .setName("notes")
        .setDescription("Optional release notes.")
        .setMaxLength(500)
        .setRequired(false)
    ),

  async execute(interaction) {
    if (!canUseSessionCommand(interaction)) {
      await interaction.reply({ content: "Only Staff Team members can release sessions.", ephemeral: true });
      return;
    }

    const settings = getGuildSettings(interaction.guildId);
    const active = getActiveSessionForGuild(interaction.guildId);
    if (!active) {
      await interaction.reply({ content: "There is no active session to release.", ephemeral: true });
      return;
    }

    const [messageId, savedSession] = active;
    const session = await refreshSessionReactionState(interaction.client, messageId) || savedSession;
    if (!session.earlyAccessSent) {
      await interaction.reply({ content: "You must run `/early-access` before releasing the full session.", ephemeral: true });
      return;
    }
    if (session.releasedSent) {
      await interaction.reply({ content: "This session has already been released.", ephemeral: true });
      return;
    }
    if (!isValidSessionLink(session.robloxLink)) {
      await interaction.reply({ content: "The saved Roblox link is missing or invalid. Start the session again with a full `https://...` Roblox private server link.", ephemeral: true });
      return;
    }

    const notes = interaction.options.getString("notes") || session.notes || "";
    const channel = await interaction.client.channels.fetch(session.channelId || settings.sessionChannelId);
    const banner = new AttachmentBuilder(
      path.join(__dirname, "..", "..", "assets", "session-released.png"),
      { name: "session-released.png" }
    );

    await channel.send({
      content: `<@&${civilianRoleId}>`,
      embeds: [
        sessionReleaseEmbed({
          host: `<@${session.hostId}>`,
          robloxLink: session.robloxLink,
          notes
        })
      ],
      components: [sessionLinkButton(messageId)],
      files: [banner],
      allowedMentions: { roles: [civilianRoleId] }
    });

    const sessions = getSessions();
    sessions[messageId] = {
      ...session,
      releasedSent: true,
      notes
    };
    saveSessions(sessions);

    await interaction.reply({ content: `Session release posted in ${channel}.`, ephemeral: true });
  }
};
