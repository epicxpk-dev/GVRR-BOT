const { SlashCommandBuilder } = require("discord.js");
const { ownerUserId, quotaInformationChannelId, quotaLeaderboardChannelId, quotaRequirements } = require("../config");
const { quotaInfoEmbed } = require("../embeds");
const { resetQuotaLogs } = require("../quota");
const { refreshQuotaLeaderboard, sendOrUpdateQuotaMessage } = require("../quota-panel");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("quota")
    .setDescription("Quota commands.")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("leaderboard")
        .setDescription("Show or reset the active staff leaderboard.")
        .addBooleanOption((option) =>
          option
            .setName("reset")
            .setDescription("Clear all quota records before updating the leaderboard.")
            .setRequired(false)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("info")
        .setDescription("Show staff quota information.")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("reset")
        .setDescription("Reset all active quota leaderboard records.")
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    if (interaction.user.id !== ownerUserId) {
      await interaction.editReply("Only Charxlie can update or reset the quota leaderboard.");
      return;
    }

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "leaderboard") {
      const shouldReset = interaction.options.getBoolean("reset") || false;
      if (shouldReset) {
        resetQuotaLogs(interaction.guildId);
      }

      const result = await refreshQuotaLeaderboard(interaction.client, interaction.guild);

      if (!result) {
        await interaction.editReply("I could not find the quota leaderboard channel.");
        return;
      }
      if (result.failedSend) {
        await interaction.editReply(`I found ${result.channel}, but I could not send the leaderboard there. Check the bot has Send Messages and Embed Links permissions in that channel.`);
        return;
      }

      await interaction.editReply(
        shouldReset
          ? `Quota leaderboard records reset and the saved leaderboard was updated in ${result.channel}.`
          : result.repaired
          ? `Quota leaderboard was missing, so I posted a new saved one in ${result.channel}.`
          : `Quota leaderboard updated in ${result.channel}.`
      );
      return;
    }

    if (subcommand === "info") {
      const result = await sendOrUpdateQuotaMessage({
        client: interaction.client,
        guildId: interaction.guildId,
        channelId: quotaInformationChannelId,
        panelKey: "information",
        embeds: [quotaInfoEmbed({ quotaRequirements })]
      });

      if (!result) {
        await interaction.editReply("I could not find the quota information channel.");
        return;
      }
      if (result.failedSend) {
        await interaction.editReply(`I found ${result.channel}, but I could not send quota information there. Check the bot has Send Messages and Embed Links permissions in that channel.`);
        return;
      }

      await interaction.editReply(
        result.repaired
          ? `Quota information was missing, so I posted a new saved one in ${result.channel}.`
          : `Quota information updated in ${result.channel}.`
      );
      return;
    }

    resetQuotaLogs(interaction.guildId);
    const result = await refreshQuotaLeaderboard(interaction.client, interaction.guild);

    if (!result) {
      await interaction.editReply("I could not find the quota leaderboard channel.");
      return;
    }
    if (result.failedSend) {
      await interaction.editReply(`I found ${result.channel}, but I could not send the leaderboard there. Check the bot has Send Messages and Embed Links permissions in that channel.`);
      return;
    }

    await interaction.editReply(`Quota leaderboard records reset and the saved leaderboard was updated in ${result.channel}.`);
  }
};
