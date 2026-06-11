const { ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require("discord.js");
const { developerRoleId, highCommandRoleId } = require("./config");

function canReviewLoa(interaction) {
  return interaction.member.roles.cache.has(highCommandRoleId)
    || interaction.member.roles.cache.has(developerRoleId)
    || interaction.memberPermissions.has(PermissionFlagsBits.Administrator);
}

async function handleLeaveOfAbsenceButton(interaction) {
  if (!canReviewLoa(interaction)) {
    await interaction.reply({ content: "Only High Command or HR can review leave of absence requests.", ephemeral: true });
    return;
  }

  const [, action, requesterId] = interaction.customId.split(":");
  const accepted = action === "accept";
  const disabledButtons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`loa:accept:${requesterId}`)
      .setLabel("Accept")
      .setStyle(ButtonStyle.Success)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId(`loa:decline:${requesterId}`)
      .setLabel("Decline")
      .setStyle(ButtonStyle.Danger)
      .setDisabled(true)
  );

  await interaction.update({ components: [disabledButtons] });
  await interaction.followUp({
    content: `<@${requesterId}> your leave of absence request has been **${accepted ? "accepted" : "declined"}** by ${interaction.user}.`,
    allowedMentions: { users: [requesterId] }
  });
}

module.exports = { handleLeaveOfAbsenceButton };
