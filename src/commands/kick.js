const { PermissionFlagsBits, SlashCommandBuilder } = require("discord.js");
const { sendModLog } = require("../logger");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Kick a member from the server.")
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption((option) => option.setName("user").setDescription("User to kick.").setRequired(true))
    .addStringOption((option) => option.setName("reason").setDescription("Reason for the kick.").setMaxLength(500).setRequired(false)),

  async execute(interaction) {
    const user = interaction.options.getUser("user");
    const reason = interaction.options.getString("reason") || "No reason provided.";
    const member = await interaction.guild.members.fetch(user.id);

    await member.kick(reason);

    await sendModLog(interaction, {
      action: "Kick",
      moderator: interaction.user,
      target: user,
      reason
    });

    await interaction.reply({ content: `${user.tag} has been kicked.`, ephemeral: true });
  }
};
