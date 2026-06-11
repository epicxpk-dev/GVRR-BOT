const { SlashCommandBuilder } = require("discord.js");
const { formatMoney, payUser } = require("../economy");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("pay")
    .setDescription("Pay another member from your wallet.")
    .addUserOption((option) =>
      option.setName("user").setDescription("Member to pay.").setRequired(true)
    )
    .addIntegerOption((option) =>
      option.setName("amount").setDescription("Amount to pay.").setMinValue(1).setRequired(true)
    ),

  async execute(interaction) {
    const user = interaction.options.getUser("user");
    const amount = interaction.options.getInteger("amount");

    if (user.bot || user.id === interaction.user.id) {
      await interaction.reply({ content: "You must choose another real member to pay.", ephemeral: true });
      return;
    }

    const result = payUser(interaction.guildId, interaction.user.id, user.id, amount);
    if (!result.ok) {
      await interaction.reply({ content: result.reason, ephemeral: true });
      return;
    }

    await interaction.reply(`${interaction.user} paid ${user} **${formatMoney(amount)}**.`);
  }
};
