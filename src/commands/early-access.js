const path = require("node:path");
const {
  AttachmentBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder
} = require("discord.js");
const { developerRoleId, highCommandRoleId, sessionHostRoleId } = require("../config");
const { earlyAccessEmbed } = require("../embeds");
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
    .setName("early-access")
    .setDescription("Release early access for the active session."),

  async execute(interaction) {
    if (!canUseSessionCommand(interaction)) {
      await interaction.reply({ content: "Only Staff Team members can release early access.", ephemeral: true });
      return;
    }

    const settings = getGuildSettings(interaction.guildId);
    const active = getActiveSessionForGuild(interaction.guildId);
    if (!active) {
      await interaction.reply({ content: "There is no active session for early access.", ephemeral: true });
      return;
    }

    const [messageId, savedSession] = active;
    const session = await refreshSessionReactionState(interaction.client, messageId) || savedSession;
    if (!session.reactionsMet) {
      await interaction.reply({ content: `The session needs **${session.requiredReactions}** reactions before early access can be released.`, ephemeral: true });
      return;
    }
    if (session.earlyAccessSent) {
      await interaction.reply({ content: "Early access has already been released for this session.", ephemeral: true });
      return;
    }
    if (!isValidSessionLink(session.robloxLink)) {
      await interaction.reply({ content: "The saved Roblox link is missing or invalid. Start the session again with a full `https://...` Roblox private server link.", ephemeral: true });
      return;
    }

    const channel = await interaction.client.channels.fetch(session.channelId || settings.sessionChannelId);
    const roleId = settings.earlyAccessRoleId;
    const banner = new AttachmentBuilder(
      path.join(__dirname, "..", "..", "assets", "early-access.png"),
      { name: "early-access.png" }
    );

    await channel.send({
      content: roleId ? `<@&${roleId}>` : undefined,
      embeds: [earlyAccessEmbed({ roleId })],
      components: [sessionLinkButton(messageId)],
      files: [banner],
      allowedMentions: roleId ? { roles: [roleId] } : { parse: [] }
    });

    const sessions = getSessions();
    sessions[messageId] = {
      ...session,
      earlyAccessSent: true
    };
    saveSessions(sessions);

    await interaction.reply({ content: `Early access posted in ${channel}.`, ephemeral: true });
  }
};
