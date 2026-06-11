const { PermissionFlagsBits, SlashCommandBuilder } = require("discord.js");
const { getGuildSettings } = require("../storage");
const { canTerminateSession, endSession } = require("./session");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("terminate-session")
    .setDescription("Terminate the active session. High Command/HR only.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption((option) =>
      option.setName("reason").setDescription("Why is this session being terminated?").setMaxLength(500).setRequired(false)
    ),

  async execute(interaction) {
    if (!canTerminateSession(interaction)) {
      await interaction.reply({ content: "Only High Command or HR can terminate sessions.", ephemeral: true });
      return;
    }

    const settings = getGuildSettings(interaction.guildId);
    if (!settings.sessionChannelId) {
      await interaction.reply({ content: "Run `/setup channels` before using session commands.", ephemeral: true });
      return;
    }

    await endSession(interaction, settings, {
      terminated: true,
      terminationReason: interaction.options.getString("reason") || ""
    });
  }
};
