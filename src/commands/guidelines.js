const path = require("node:path");
const { AttachmentBuilder, PermissionFlagsBits, SlashCommandBuilder } = require("discord.js");
const { guidelinesChannelId } = require("../config");
const { guidelinesBannerEmbed, guidelinesIntroEmbed, guidelinesResourcesEmbed, guidelinesRulesEmbed } = require("../embeds");
const { requireDeveloper } = require("../developer-guard");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("guidelines")
    .setDescription("Community guidelines panel.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((subcommand) =>
      subcommand
        .setName("panel")
        .setDescription("Post the community guidelines panel.")
    ),

  async execute(interaction) {
    if (!(await requireDeveloper(interaction))) return;

    const channel = await interaction.client.channels.fetch(guidelinesChannelId).catch(() => null);
    if (!channel?.isTextBased()) {
      await interaction.reply({ content: "I could not find the community guidelines channel.", ephemeral: true });
      return;
    }

    const bannerPath = path.join(__dirname, "..", "..", "assets", "guidelines-banner.png");
    const banner = new AttachmentBuilder(bannerPath, { name: "guidelines-banner.png" });

    await channel.send({
      embeds: [guidelinesBannerEmbed()],
      files: [banner]
    });

    await channel.send({
      embeds: [guidelinesIntroEmbed(), guidelinesRulesEmbed(), guidelinesResourcesEmbed()]
    });

    await interaction.reply({
      content: `Community guidelines panel posted in ${channel}.`,
      ephemeral: true
    });
  }
};
