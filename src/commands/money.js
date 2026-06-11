const { SlashCommandBuilder } = require("discord.js");
const { ownerUserId } = require("../config");
const { editMoney, formatMoney, getBalance } = require("../economy");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("money")
    .setDescription("Owner-only money management.")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("add")
        .setDescription("Add money to a member.")
        .addUserOption((option) =>
          option.setName("user").setDescription("Member to edit.").setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("account")
            .setDescription("Where to add the money.")
            .setRequired(true)
            .addChoices(
              { name: "Wallet", value: "wallet" },
              { name: "Bank", value: "bank" }
            )
        )
        .addIntegerOption((option) =>
          option.setName("amount").setDescription("Amount to add.").setMinValue(1).setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("remove")
        .setDescription("Remove money from a member.")
        .addUserOption((option) =>
          option.setName("user").setDescription("Member to edit.").setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("account")
            .setDescription("Where to remove the money.")
            .setRequired(true)
            .addChoices(
              { name: "Wallet", value: "wallet" },
              { name: "Bank", value: "bank" }
            )
        )
        .addIntegerOption((option) =>
          option.setName("amount").setDescription("Amount to remove.").setMinValue(1).setRequired(true)
        )
    ),

  async execute(interaction) {
    if (interaction.user.id !== ownerUserId) {
      await interaction.reply({ content: "Only Charxlie can edit member money.", ephemeral: true });
      return;
    }

    const subcommand = interaction.options.getSubcommand();
    const user = interaction.options.getUser("user");
    const account = interaction.options.getString("account");
    const amount = interaction.options.getInteger("amount");
    const signedAmount = subcommand === "remove" ? -amount : amount;

    editMoney(interaction.guildId, user.id, account, signedAmount);
    const balance = getBalance(interaction.guildId, user.id);

    await interaction.reply({
      content: `${subcommand === "remove" ? "Removed" : "Added"} **${formatMoney(amount)}** ${subcommand === "remove" ? "from" : "to"} ${user}'s ${account}. Wallet: **${formatMoney(balance.wallet)}**, Bank: **${formatMoney(balance.bank)}**.`,
      ephemeral: true
    });
  }
};
