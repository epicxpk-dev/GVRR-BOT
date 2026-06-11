const { SlashCommandBuilder } = require("discord.js");
const { claimIncome, formatMoney } = require("../economy");

function formatRemaining(ms) {
  const hours = Math.ceil(ms / 3600000);
  return `${hours} hour${hours === 1 ? "" : "s"}`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("claim-income")
    .setDescription("Claim your daily role income."),

  async execute(interaction) {
    const result = claimIncome(interaction.member);
    if (!result.ok) {
      await interaction.reply({ content: `You can claim income again in **${formatRemaining(result.remaining)}**.`, ephemeral: true });
      return;
    }

    await interaction.reply(`${interaction.user} claimed **${formatMoney(result.amount)}** income.`);
  }
};
