const { PermissionFlagsBits, SlashCommandBuilder } = require("discord.js");
const { ownerUserId, publicServicesRoleId } = require("../config");
const { removeCitation } = require("../citations");

function canUsePublicServices(interaction) {
  return interaction.user.id === ownerUserId
    || interaction.member.roles.cache.has(publicServicesRoleId)
    || interaction.memberPermissions.has(PermissionFlagsBits.Administrator);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("removecitation")
    .setDescription("Remove a citation record from a civilian. Public Services only.")
    .addUserOption((option) =>
      option.setName("civilian").setDescription("Civilian with the citation.").setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("citation_id").setDescription("Citation ID to remove.").setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("reason").setDescription("Why this citation is being removed.").setMaxLength(500).setRequired(true)
    ),

  async execute(interaction) {
    if (!canUsePublicServices(interaction)) {
      await interaction.reply({ content: "Only Public Services members can remove citations.", ephemeral: true });
      return;
    }

    const civilian = interaction.options.getUser("civilian");
    const citationId = interaction.options.getString("citation_id");
    const reason = interaction.options.getString("reason");
    const citation = removeCitation({
      guildId: interaction.guildId,
      userId: civilian.id,
      citationId,
      removedBy: interaction.user.id,
      reason
    });

    if (!citation) {
      await interaction.reply({ content: "I could not find that citation.", ephemeral: true });
      return;
    }

    await interaction.reply({
      content: `Citation \`${citation.id}\` for ${civilian} has been removed. Reason: **${reason}**`,
      ephemeral: true
    });
  }
};
