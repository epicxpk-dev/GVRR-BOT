const { ChannelType, PermissionFlagsBits, SlashCommandBuilder } = require("discord.js");
const { developerRoleId, highCommandRoleId } = require("../config");

function canUseSay(interaction) {
  return interaction.member.roles.cache.has(developerRoleId)
    || interaction.member.roles.cache.has(highCommandRoleId)
    || interaction.memberPermissions.has(PermissionFlagsBits.Administrator);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("say")
    .setDescription("Make the bot send a message.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption((option) =>
      option.setName("message").setDescription("What should the bot say?").setMaxLength(1900).setRequired(true)
    )
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("Where should the bot send it?")
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        .setRequired(false)
    ),

  async execute(interaction) {
    if (!canUseSay(interaction)) {
      await interaction.reply({ content: "Only High Command or management can use this command.", ephemeral: true });
      return;
    }

    const message = interaction.options.getString("message");
    const channel = interaction.options.getChannel("channel") || interaction.channel;

    await channel.send({
      content: message,
      allowedMentions: { parse: ["users", "roles"] }
    });

    await interaction.reply({ content: `Message sent in ${channel}.`, ephemeral: true });
  }
};
