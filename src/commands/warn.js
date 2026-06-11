const { PermissionFlagsBits, SlashCommandBuilder } = require("discord.js");
const { getWarnings, saveWarnings } = require("../storage");
const { sendModLog } = require("../logger");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Warn a member.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((option) => option.setName("user").setDescription("User to warn.").setRequired(true))
    .addStringOption((option) => option.setName("reason").setDescription("Reason for the warning.").setMaxLength(500).setRequired(true)),

  async execute(interaction) {
    const user = interaction.options.getUser("user");
    const reason = interaction.options.getString("reason");
    const warnings = getWarnings();
    const guildWarnings = warnings[interaction.guildId] || {};
    const userWarnings = guildWarnings[user.id] || [];

    userWarnings.push({
      moderatorId: interaction.user.id,
      reason,
      createdAt: Date.now()
    });

    guildWarnings[user.id] = userWarnings;
    warnings[interaction.guildId] = guildWarnings;
    saveWarnings(warnings);

    await sendModLog(interaction, {
      action: "Warn",
      moderator: interaction.user,
      target: user,
      reason
    });

    await interaction.reply({ content: `${user.tag} has been warned. They now have ${userWarnings.length} warning(s).`, ephemeral: true });
  }
};
