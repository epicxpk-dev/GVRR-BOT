const { SlashCommandBuilder } = require("discord.js");
const { formatMoney, moveMoney } = require("../economy");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("withdraw")
    .setDescription("Move money from your bank to your wallet.")
    .addIntegerOption((option) =>
      option.setName("amount").setDescription("Amount to withdraw.").setMinValue(1).setRequired(true)
    ),

  async execute(interaction) {
    const amount = interaction.options.getInteger("amount");
    const result = moveMoney(interaction.guildId, interaction.user.id, "bank", amount);
    if (!result.ok) {
      await interaction.reply({ content: result.reason, ephemeral: true });
      return;
    }

    await interaction.reply(`Withdrew **${formatMoney(amount)}** into your wallet.`);
  }
};
