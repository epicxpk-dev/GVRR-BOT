const { PermissionFlagsBits, SlashCommandBuilder } = require("discord.js");
const { ownerUserId, publicServicesRoleId } = require("../config");
const { addCitation } = require("../citations");
const { citationIssuedEmbed } = require("../embeds");
const { formatMoney } = require("../economy");

function canUsePublicServices(interaction) {
  return interaction.user.id === ownerUserId
    || interaction.member.roles.cache.has(publicServicesRoleId)
    || interaction.memberPermissions.has(PermissionFlagsBits.Administrator);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("citation")
    .setDescription("Issue a citation to a civilian. Public Services only.")
    .addUserOption((option) =>
      option.setName("civilian").setDescription("Civilian receiving the citation.").setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("offense").setDescription("Offense or code violated.").setMaxLength(500).setRequired(true)
    )
    .addIntegerOption((option) =>
      option.setName("fine").setDescription("Fine amount.").setMinValue(1).setRequired(true)
    )
    .addIntegerOption((option) =>
      option.setName("count").setDescription("Citation count.").setMinValue(1).setRequired(false)
    )
    .addStringOption((option) =>
      option.setName("department").setDescription("Department issuing the citation.").setMaxLength(100).setRequired(false)
    )
    .addStringOption((option) =>
      option.setName("location").setDescription("Incident location.").setMaxLength(200).setRequired(false)
    )
    .addStringOption((option) =>
      option.setName("evidence").setDescription("Evidence link or proof note.").setMaxLength(500).setRequired(false)
    )
    .addStringOption((option) =>
      option.setName("notes").setDescription("Additional notes.").setMaxLength(500).setRequired(false)
    ),

  async execute(interaction) {
    if (!canUsePublicServices(interaction)) {
      await interaction.reply({ content: "Only Public Services members can issue citations.", ephemeral: true });
      return;
    }

    const civilian = interaction.options.getUser("civilian");
    const citation = addCitation({
      guildId: interaction.guildId,
      civilianId: civilian.id,
      issuerId: interaction.user.id,
      offense: interaction.options.getString("offense"),
      count: interaction.options.getInteger("count") || 1,
      fine: interaction.options.getInteger("fine"),
      department: interaction.options.getString("department") || "Public Services",
      location: interaction.options.getString("location") || "Not provided",
      evidence: interaction.options.getString("evidence") || "",
      notes: interaction.options.getString("notes") || ""
    });

    await interaction.reply({
      content: `${civilian}`,
      embeds: [citationIssuedEmbed({ citation, civilian, issuer: interaction.user, formatMoney })],
      allowedMentions: { users: [civilian.id] }
    });
  }
};
