const { SlashCommandBuilder } = require("discord.js");
const { getUnpaidCitation, markCitationPaid } = require("../citations");
const { citationPaidEmbed } = require("../embeds");
const { formatMoney, removeWalletMoney } = require("../economy");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("pay-citation")
    .setDescription("Pay one of your active citations from your wallet.")
    .addStringOption((option) =>
      option.setName("citation_id").setDescription("Citation ID. Leave blank to pay your oldest unpaid citation.").setRequired(false)
    ),

  async execute(interaction) {
    const citationId = interaction.options.getString("citation_id");
    const citation = getUnpaidCitation(interaction.guildId, interaction.user.id, citationId);
    if (!citation) {
      await interaction.reply({ content: "I could not find an unpaid citation for you.", ephemeral: true });
      return;
    }

    const payment = removeWalletMoney(interaction.guildId, interaction.user.id, citation.fine);
    if (!payment.ok) {
      await interaction.reply({ content: `${payment.reason} You need **${formatMoney(citation.fine)}** in your wallet to pay this citation.`, ephemeral: true });
      return;
    }

    const paid = markCitationPaid(interaction.guildId, interaction.user.id, citation.id);
    await interaction.reply({
      embeds: [citationPaidEmbed({ citation: paid, civilian: interaction.user, formatMoney })]
    });
  }
};
