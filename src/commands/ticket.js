const path = require("node:path");
const { AttachmentBuilder, PermissionFlagsBits, SlashCommandBuilder } = require("discord.js");
const { supportChannelId } = require("../config");
const { ticketPanelEmbed } = require("../embeds");
const { ticketButtons } = require("../tickets");
const { requireDeveloper } = require("../developer-guard");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("Ticket commands.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addSubcommand((subcommand) =>
      subcommand
        .setName("panel")
        .setDescription("Post the ticket panel.")
    ),

  async execute(interaction) {
    if (!(await requireDeveloper(interaction))) return;

    const channel = await interaction.client.channels.fetch(supportChannelId).catch(() => null);
    if (!channel?.isTextBased()) {
      await interaction.reply({ content: "I could not find the assistance channel.", ephemeral: true });
      return;
    }

    const bannerPath = path.join(__dirname, "..", "..", "assets", "assistance-banner.png");
    const banner = new AttachmentBuilder(bannerPath, { name: "assistance-banner.png" });

    await channel.send({
      embeds: [ticketPanelEmbed()],
      files: [banner],
      components: [ticketButtons()]
    });

    await interaction.reply({ content: `Ticket panel posted in ${channel}.`, ephemeral: true });
  }
};
