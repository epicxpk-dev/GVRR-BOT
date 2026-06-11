const { SlashCommandBuilder } = require("discord.js");
const { formatMoney, work } = require("../economy");

function formatRemaining(ms) {
  const minutes = Math.ceil(ms / 60000);
  return `${minutes} minute${minutes === 1 ? "" : "s"}`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("work")
    .setDescription("Work a shift to earn wallet money."),

  async execute(interaction) {
    const result = work(interaction.guildId, interaction.user.id);
    if (!result.ok) {
      await interaction.reply({ content: `You can work again in **${formatRemaining(result.remaining)}**.`, ephemeral: true });
      return;
    }

    await interaction.reply(`${interaction.user} worked a shift and earned **${formatMoney(result.earned)}**.`);
  }
};
