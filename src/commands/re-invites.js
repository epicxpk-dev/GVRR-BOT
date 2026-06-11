const path = require("node:path");
const { AttachmentBuilder, PermissionFlagsBits, SlashCommandBuilder } = require("discord.js");
const { civilianRoleId, developerRoleId, highCommandRoleId, sessionHostRoleId } = require("../config");
const { reInvitesEmbed } = require("../embeds");
const { getGuildSettings, getSessions, saveSessions } = require("../storage");
const { getActiveSessionForGuild, sessionLinkButton } = require("../sessions");

function isValidSessionLink(url) {
  return typeof url === "string" && /^https?:\/\//i.test(url);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("re-invites")
    .setDescription("Post a re-invites announcement for the active session.")
    .addStringOption((option) =>
      option
        .setName("roblox_link")
        .setDescription("Roblox private server link for re-invites.")
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("notes")
        .setDescription("Extra notes for re-invites.")
        .setMaxLength(500)
        .setRequired(false)
    ),

  async execute(interaction) {
    const canUse = interaction.member.roles.cache.has(sessionHostRoleId)
      || interaction.member.roles.cache.has(highCommandRoleId)
      || interaction.member.roles.cache.has(developerRoleId)
      || interaction.memberPermissions.has(PermissionFlagsBits.Administrator);

    if (!canUse) {
      await interaction.reply({ content: "Only Staff Team members can post re-invites.", ephemeral: true });
      return;
    }

    const settings = getGuildSettings(interaction.guildId);
    const active = getActiveSessionForGuild(interaction.guildId);
    if (!active) {
      await interaction.reply({ content: "There is no active session to post re-invites for.", ephemeral: true });
      return;
    }

    const [messageId, session] = active;
    const channel = await interaction.client.channels.fetch(session.channelId || settings.sessionChannelId);
    const robloxLink = interaction.options.getString("roblox_link") || session.robloxLink;
    const notes = interaction.options.getString("notes") || session.notes || "";
    if (!isValidSessionLink(robloxLink)) {
      await interaction.reply({ content: "Please provide a full Roblox private server link starting with `https://`.", ephemeral: true });
      return;
    }

    if (robloxLink !== session.robloxLink) {
      const sessions = getSessions();
      if (sessions[messageId]) {
        sessions[messageId].robloxLink = robloxLink;
        saveSessions(sessions);
      }
    }

    const banner = new AttachmentBuilder(
      path.join(__dirname, "..", "..", "assets", "re-invites.png"),
      { name: "re-invites.png" }
    );

    await channel.send({
      content: `<@&${civilianRoleId}>`,
      embeds: [
        reInvitesEmbed({
          host: `<@${session.hostId}>`,
          robloxLink,
          notes
        })
      ],
      components: [
        sessionLinkButton(messageId)
      ],
      files: [banner],
      allowedMentions: { roles: [civilianRoleId] }
    });

    await interaction.reply({ content: `Re-invites posted in ${channel}.`, ephemeral: true });
  }
};
