const { PermissionFlagsBits, SlashCommandBuilder } = require("discord.js");
const { ownerUserId, publicServicesRoleId } = require("../config");
const { addPsRecord } = require("../citations");
const { psRecordEmbed } = require("../embeds");
const { formatMoney } = require("../economy");

function canUsePublicServices(interaction) {
  return interaction.user.id === ownerUserId
    || interaction.member.roles.cache.has(publicServicesRoleId)
    || interaction.memberPermissions.has(PermissionFlagsBits.Administrator);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("databaseadd")
    .setDescription("Add an incident to the Public Services database.")
    .addStringOption((option) =>
      option
        .setName("department")
        .setDescription("Public Services department.")
        .setRequired(true)
        .addChoices(
          { name: "Greenville Police Department", value: "Greenville Police Department" },
          { name: "Outagamie Sheriff's Office", value: "Outagamie Sheriff's Office" },
          { name: "Wisconsin State Patrol", value: "Wisconsin State Patrol" },
          { name: "Fire & Rescue", value: "Fire & Rescue" }
        )
    )
    .addUserOption((option) =>
      option.setName("owner").setDescription("Civilian or vehicle owner.").setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("vehicle_model").setDescription("Vehicle model.").setMaxLength(100).setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("vehicle_color").setDescription("Vehicle color.").setMaxLength(60).setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("vehicle_plate").setDescription("Vehicle plate.").setMaxLength(40).setRequired(true)
    )
    .addIntegerOption((option) =>
      option.setName("total_amount_due").setDescription("Total amount due.").setMinValue(0).setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("department_name").setDescription("Department name/signature.").setMaxLength(120).setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("location").setDescription("Incident location.").setMaxLength(200).setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("arrestations").setDescription("Arrestation details, or None.").setMaxLength(300).setRequired(false)
    )
    .addStringOption((option) =>
      option.setName("additional_notes").setDescription("Additional database notes.").setMaxLength(600).setRequired(false)
    )
    .addStringOption((option) =>
      option.setName("recipient_signature").setDescription("Recipient signature.").setMaxLength(100).setRequired(false)
    ),

  async execute(interaction) {
    if (!canUsePublicServices(interaction)) {
      await interaction.reply({ content: "Only Public Services members can add database records.", ephemeral: true });
      return;
    }

    const owner = interaction.options.getUser("owner");
    const record = addPsRecord({
      guildId: interaction.guildId,
      department: interaction.options.getString("department"),
      ownerId: owner.id,
      vehicleModel: interaction.options.getString("vehicle_model"),
      vehicleColor: interaction.options.getString("vehicle_color"),
      vehiclePlate: interaction.options.getString("vehicle_plate"),
      totalAmountDue: interaction.options.getInteger("total_amount_due"),
      departmentName: interaction.options.getString("department_name"),
      location: interaction.options.getString("location"),
      arrestations: interaction.options.getString("arrestations") || "None",
      additionalNotes: interaction.options.getString("additional_notes") || "",
      recipientSignature: interaction.options.getString("recipient_signature") || "",
      officerId: interaction.user.id
    });

    await interaction.reply({
      embeds: [psRecordEmbed({ record, officer: interaction.user, owner, formatMoney })]
    });
  }
};
