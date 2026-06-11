const { SlashCommandBuilder } = require("discord.js");
const { balanceEmbed } = require("../embeds");
const { formatMoney, getBalance } = require("../economy");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("balance")
    .setDescription("Check your economy balance.")
    .addUserOption((option) =>
      option.setName("user").setDescription("Member to check.").setRequired(false)
    ),

  async execute(interaction) {
    const member = interaction.options.getMember("user") || interaction.member;
    const balance = getBalance(interaction.guildId, member.id);
    await interaction.reply({ embeds: [balanceEmbed({ member, balance, formatMoney })] });
  }
};
