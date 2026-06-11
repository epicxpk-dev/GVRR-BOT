const { PermissionFlagsBits, SlashCommandBuilder } = require("discord.js");
const { getGuildSettings } = require("../storage");
const { sessionSupervisingEmbed } = require("../embeds");
const { getActiveSessionForGuild } = require("../sessions");
const { canTerminateSession } = require("./session");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("supervising")
    .setDescription("Announce who is supervising the active session. HR+ only.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The HR+ member supervising this session.")
        .setRequired(true)
    ),

  async execute(interaction) {
    if (!canTerminateSession(interaction)) {
      await interaction.reply({ content: "Only HR or High Command can announce session supervision.", ephemeral: true });
      return;
    }

    const settings = getGuildSettings(interaction.guildId);
    if (!settings.sessionChannelId) {
      await interaction.reply({ content: "Run `/setup channels` before using session commands.", ephemeral: true });
      return;
    }

    const active = getActiveSessionForGuild(interaction.guildId);
    if (!active) {
      await interaction.reply({ content: "There is no active session to supervise.", ephemeral: true });
      return;
    }
    const [, session] = active;

    const member = interaction.options.getMember("user");
    if (!member) {
      await interaction.reply({ content: "I could not find that member.", ephemeral: true });
      return;
    }

    const channel = await interaction.client.channels.fetch(session.channelId || settings.sessionChannelId);
    await channel.send({
      content: `${member}`,
      embeds: [sessionSupervisingEmbed({ member })],
      allowedMentions: { users: [member.id] }
    });

    await interaction.reply({ content: `${member} has been announced as supervising this session.`, ephemeral: true });
  }
};
