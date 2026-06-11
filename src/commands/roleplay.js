const path = require("node:path");
const { AttachmentBuilder, PermissionFlagsBits, SlashCommandBuilder } = require("discord.js");
const { roleplayOneChannelId } = require("../config");
const { roleplayOneBannerEmbed, roleplayOneInfoEmbed, roleplayOneStartupEmbed } = require("../embeds");
const { requireDeveloper } = require("../developer-guard");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("roleplay")
    .setDescription("Roleplay channel panels.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((subcommand) =>
      subcommand
        .setName("panel")
        .setDescription("Post the Roleplay 1 information panel.")
    ),

  async execute(interaction) {
    if (!(await requireDeveloper(interaction))) return;

    const channel = await interaction.client.channels.fetch(roleplayOneChannelId).catch(() => null);
    if (!channel?.isTextBased()) {
      await interaction.reply({ content: "I could not find the Roleplay 1 channel.", ephemeral: true });
      return;
    }

    const bannerPath = path.join(__dirname, "..", "..", "assets", "roleplay-1-banner.png");
    const banner = new AttachmentBuilder(bannerPath, { name: "roleplay-1-banner.png" });

    await channel.send({
      embeds: [roleplayOneBannerEmbed()],
      files: [banner]
    });

    await channel.send({
      embeds: [roleplayOneStartupEmbed(), roleplayOneInfoEmbed()]
    });

    await interaction.reply({
      content: `Roleplay 1 panel posted in ${channel}.`,
      ephemeral: true
    });
  }
};
