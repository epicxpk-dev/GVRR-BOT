const { SlashCommandBuilder } = require("discord.js");
const { ownerUserId } = require("../config");
const { quotaLoggedEmbed } = require("../embeds");
const { addSessionLog, consumeVerifiedSession, formatDuration, getQuotaGroup, parseSessionTime } = require("../quota");
const { refreshQuotaLeaderboard } = require("../quota-panel");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("sessionlog")
    .setDescription("Log your hosted or co-hosted session time.")
    .addStringOption((option) =>
      option.setName("start_time").setDescription("Start time, example: 18:30").setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("end_time").setDescription("End time, example: 20:15").setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("notes").setDescription("Session notes.").setMaxLength(500).setRequired(false)
    ),

  async execute(interaction) {
    const startTime = interaction.options.getString("start_time");
    const endTime = interaction.options.getString("end_time");
    const notes = interaction.options.getString("notes") || "";
    const startAt = parseSessionTime(startTime);
    const endAt = parseSessionTime(endTime);

    if (!startAt || !endAt) {
      await interaction.reply({
        content: "Please use times like `18:30` and `20:15`.",
        ephemeral: true
      });
      return;
    }

    const quotaGroup = getQuotaGroup(interaction.member);
    if (!quotaGroup) {
      await interaction.reply({
        content: "You are currently marked as LOA/exempt, so you do not need to submit quota logs.",
        ephemeral: true
      });
      return;
    }

    if (interaction.user.id !== ownerUserId) {
      const verifiedSession = consumeVerifiedSession({
        guildId: interaction.guildId,
        userId: interaction.user.id,
        startAt,
        endAt
      });

      if (!verifiedSession) {
        await interaction.reply({
          content: "I could not verify that you hosted a real ended session with those times. Please log the same start/end time as the session the bot recorded, or ask High Command to review it.",
          ephemeral: true
        });
        return;
      }
    }

    const result = addSessionLog({
      guildId: interaction.guildId,
      userId: interaction.user.id,
      startAt,
      endAt,
      notes
    });

    await interaction.reply({
      embeds: [
        quotaLoggedEmbed({
          member: interaction.member,
          minutes: result.minutes,
          totalMinutes: result.totalMinutes,
          quotaGroup,
          notes,
          formatDuration
        })
      ],
      ephemeral: true
    });

    await refreshQuotaLeaderboard(interaction.client, interaction.guild).catch(console.error);
  }
};
