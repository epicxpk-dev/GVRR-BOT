const { PermissionFlagsBits, SlashCommandBuilder } = require("discord.js");
const { staffStrikeDmEmbed } = require("../embeds");
const { sendModLog } = require("../logger");
const { canTerminateSession } = require("./session");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("strike")
    .setDescription("Issue a staff strike. HR+ only.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The staff member receiving the strike.")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("Reason for the strike.")
        .setMaxLength(500)
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("evidence")
        .setDescription("Evidence for the strike, such as a link or short proof note.")
        .setMaxLength(800)
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("notes")
        .setDescription("Extra notes for the staff member.")
        .setMaxLength(800)
        .setRequired(false)
    ),

  async execute(interaction) {
    if (!canTerminateSession(interaction)) {
      await interaction.reply({ content: "Only HR or High Command can issue staff strikes.", ephemeral: true });
      return;
    }

    const target = interaction.options.getUser("user");
    const reason = interaction.options.getString("reason");
    const evidence = interaction.options.getString("evidence");
    const notes = interaction.options.getString("notes") || "";

    const dmEmbed = staffStrikeDmEmbed({
      moderator: interaction.user,
      reason,
      evidence,
      notes
    });

    const dm = await target.send({ embeds: [dmEmbed] }).then(() => true).catch(() => false);

    await sendModLog(interaction, {
      action: "Staff Strike",
      moderator: interaction.user,
      target,
      reason: [
        reason,
        `Evidence: ${evidence}`,
        notes ? `Notes: ${notes}` : "Notes: None",
        `DM Sent: ${dm ? "Yes" : "No"}`
      ].join("\n")
    });

    await interaction.reply({
      content: dm
        ? `${target} has been striked and was sent a DM.`
        : `${target} has been striked, but I could not DM them. The strike was still logged.`,
      ephemeral: true
    });
  }
};
