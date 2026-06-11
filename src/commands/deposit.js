const { SlashCommandBuilder } = require("discord.js");
const { formatMoney, moveMoney } = require("../economy");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("deposit")
    .setDescription("Move money from your wallet to your bank.")
    .addIntegerOption((option) =>
      option.setName("amount").setDescription("Amount to deposit.").setMinValue(1).setRequired(true)
    ),

  async execute(interaction) {
    const amount = interaction.options.getInteger("amount");
    const result = moveMoney(interaction.guildId, interaction.user.id, "wallet", amount);
    if (!result.ok) {
      await interaction.reply({ content: result.reason, ephemeral: true });
      return;
    }

    await interaction.reply(`Deposited **${formatMoney(amount)}** into your bank.`);
  }
};
