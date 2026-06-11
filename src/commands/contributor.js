const { SlashCommandBuilder } = require("discord.js");
const { contributorStatusText } = require("../config");
const { contributorEmbed } = require("../embeds");
const { giveContributorRole, hasContributorStatus } = require("../representative");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("contributor")
    .setDescription("Claim the Server Contributor role if you have /GVRR in your status."),

  async execute(interaction) {
    if (!hasContributorStatus(interaction.member)) {
      await interaction.reply({
        content: `Put **${contributorStatusText}** in your Discord custom status, then run this command again.`,
        ephemeral: true
      });
      return;
    }

    await giveContributorRole(interaction.member, null);
    await interaction.reply({
      embeds: [contributorEmbed({ member: interaction.member })],
      ephemeral: true
    });
  }
};
