const { PermissionFlagsBits, SlashCommandBuilder } = require("discord.js");
const { sendModLog } = require("../logger");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Ban a member from the server.")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption((option) => option.setName("user").setDescription("User to ban.").setRequired(true))
    .addStringOption((option) => option.setName("reason").setDescription("Reason for the ban.").setMaxLength(500).setRequired(false)),

  async execute(interaction) {
    const user = interaction.options.getUser("user");
    const reason = interaction.options.getString("reason") || "No reason provided.";
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    if (member) {
      await member.ban({ reason });
    } else {
      await interaction.guild.bans.create(user.id, { reason });
    }

    await sendModLog(interaction, {
      action: "Ban",
      moderator: interaction.user,
      target: user,
      reason
    });

    await interaction.reply({ content: `${user.tag} has been banned.`, ephemeral: true });
  }
};
