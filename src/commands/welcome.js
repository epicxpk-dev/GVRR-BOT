const { PermissionFlagsBits, SlashCommandBuilder } = require("discord.js");
const { welcomeChannelId } = require("../config");
const { requireDeveloper } = require("../developer-guard");
const { welcomeBannerEmbed, welcomeInfoEmbed } = require("../embeds");
const { welcomeBannerAttachment } = require("../welcome");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("welcome")
    .setDescription("Welcome channel commands.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((subcommand) =>
      subcommand
        .setName("panel")
        .setDescription("Post the welcome information panel.")
    ),

  async execute(interaction) {
    if (!(await requireDeveloper(interaction))) return;

    const channel = await interaction.client.channels.fetch(welcomeChannelId).catch(() => null);
    if (!channel?.isTextBased()) {
      await interaction.reply({ content: "I could not find the welcome channel.", ephemeral: true });
      return;
    }

    await channel.send({
      embeds: [welcomeBannerEmbed()],
      files: [welcomeBannerAttachment()]
    });

    await channel.send({
      embeds: [welcomeInfoEmbed()]
    });

    await interaction.reply({ content: `Welcome panel posted in ${channel}.`, ephemeral: true });
  }
};
