const { PermissionFlagsBits, SlashCommandBuilder } = require("discord.js");
const { sendModLog } = require("../logger");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("unban")
    .setDescription("Unban a user by ID.")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addStringOption((option) => option.setName("user_id").setDescription("Discord user ID to unban.").setRequired(true))
    .addStringOption((option) => option.setName("reason").setDescription("Reason for the unban.").setMaxLength(500).setRequired(false)),

  async execute(interaction) {
    const userId = interaction.options.getString("user_id");
    const reason = interaction.options.getString("reason") || "No reason provided.";

    await interaction.guild.members.unban(userId, reason);

    await sendModLog(interaction, {
      action: "Unban",
      moderator: interaction.user,
      target: userId,
      reason
    });

    await interaction.reply({ content: `User ID ${userId} has been unbanned.`, ephemeral: true });
  }
};
