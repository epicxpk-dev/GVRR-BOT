const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  SlashCommandBuilder
} = require("discord.js");
const { highCommandRoleId, leaveOfAbsenceChannelId } = require("../config");
const { leaveOfAbsenceEmbed } = require("../embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("leave-of-absence")
    .setDescription("Submit a leave of absence request.")
    .addStringOption((option) =>
      option.setName("reason").setDescription("Why are you requesting leave?").setMaxLength(500).setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("length").setDescription("How long? Example: 1d, 1w, 1m").setMaxLength(10).setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("image_url").setDescription("Optional image URL for the request.").setMaxLength(500).setRequired(false)
    ),

  async execute(interaction) {
    const reason = interaction.options.getString("reason");
    const length = interaction.options.getString("length").toLowerCase().replace(/\s/g, "");
    const imageUrl = interaction.options.getString("image_url");
    const durationMs = parseLength(length);

    if (!durationMs) {
      await interaction.reply({
        content: "Please use a valid length like `1d`, `1w`, or `1m`.",
        ephemeral: true
      });
      return;
    }

    const requestedReturn = new Date(Date.now() + durationMs);

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`loa:accept:${interaction.user.id}`)
        .setLabel("Accept")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`loa:decline:${interaction.user.id}`)
        .setLabel("Decline")
        .setStyle(ButtonStyle.Danger)
    );

    const channel = await interaction.client.channels.fetch(leaveOfAbsenceChannelId).catch(() => null);
    if (!channel?.isTextBased()) {
      await interaction.reply({
        content: "I could not find the leave of absence channel.",
        ephemeral: true
      });
      return;
    }

    await channel.send({
      content: `<@&${highCommandRoleId}>`,
      embeds: [
        leaveOfAbsenceEmbed({
          member: interaction.member,
          reason,
          length,
          requestedReturn,
          imageUrl
        })
      ],
      components: [buttons],
      allowedMentions: { roles: [highCommandRoleId] }
    });

    await interaction.reply({
      content: `Your leave of absence request has been sent to ${channel}.`,
      ephemeral: true
    });
  }
};

function parseLength(length) {
  const match = length.match(/^(\d+)(d|w|m)$/);
  if (!match) return null;

  const amount = Number(match[1]);
  const unit = match[2];
  if (!amount || amount < 1 || amount > 12) return null;

  const day = 24 * 60 * 60 * 1000;
  if (unit === "d") return amount * day;
  if (unit === "w") return amount * 7 * day;
  if (unit === "m") return amount * 30 * day;
  return null;
}
