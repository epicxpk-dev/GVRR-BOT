const { EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } = require("discord.js");
const { brandName, developerRoleId, embedColor, ownerUserId } = require("../config");
const { getBotSettings, updateBotSettings } = require("../storage");

function canEditBot(interaction) {
  return interaction.user.id === ownerUserId
    || interaction.member.roles.cache.has(developerRoleId)
    || interaction.memberPermissions.has(PermissionFlagsBits.Administrator);
}

function parseHexColor(value) {
  const clean = value.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return null;
  return Number.parseInt(clean, 16);
}

function formatHexColor(value) {
  return `#${Number(value).toString(16).padStart(6, "0")}`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("edit")
    .setDescription("Edit bot appearance settings.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((subcommand) =>
      subcommand
        .setName("embed-colour")
        .setDescription("Change the main embed colour.")
        .addStringOption((option) =>
          option
            .setName("hex")
            .setDescription("Example: #abdff0")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("terminate-colour")
        .setDescription("Change the terminated-session embed colour.")
        .addStringOption((option) =>
          option
            .setName("hex")
            .setDescription("Example: #8b0000")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("brand-name")
        .setDescription("Change the embed footer brand name.")
        .addStringOption((option) =>
          option
            .setName("name")
            .setDescription("New footer name.")
            .setMaxLength(100)
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("reset")
        .setDescription("Reset bot appearance settings back to default.")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("view")
        .setDescription("View current bot appearance settings.")
    ),

  async execute(interaction) {
    if (!canEditBot(interaction)) {
      await interaction.reply({ content: "Only Charxlie, the developer role, or administrators can edit bot settings.", ephemeral: true });
      return;
    }

    const subcommand = interaction.options.getSubcommand();
    let settings = getBotSettings("global");

    if (subcommand === "embed-colour") {
      const color = parseHexColor(interaction.options.getString("hex"));
      if (color === null) {
        await interaction.reply({ content: "Please use a valid hex colour, like `#abdff0`.", ephemeral: true });
        return;
      }
      settings = updateBotSettings("global", { embedColor: color });
      await interaction.reply({ content: `Main embed colour changed to **${formatHexColor(settings.embedColor)}**.`, ephemeral: true });
      return;
    }

    if (subcommand === "terminate-colour") {
      const color = parseHexColor(interaction.options.getString("hex"));
      if (color === null) {
        await interaction.reply({ content: "Please use a valid hex colour, like `#8b0000`.", ephemeral: true });
        return;
      }
      settings = updateBotSettings("global", { terminateColor: color });
      await interaction.reply({ content: `Terminated-session embed colour changed to **${formatHexColor(settings.terminateColor)}**.`, ephemeral: true });
      return;
    }

    if (subcommand === "brand-name") {
      settings = updateBotSettings("global", { brandName: interaction.options.getString("name") });
      await interaction.reply({ content: `Embed footer brand name changed to **${settings.brandName}**.`, ephemeral: true });
      return;
    }

    if (subcommand === "reset") {
      settings = updateBotSettings("global", {
        embedColor,
        terminateColor: 0x8b0000,
        brandName
      });
      await interaction.reply({ content: "Bot appearance settings reset to default.", ephemeral: true });
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(settings.embedColor || embedColor)
      .setTitle("Greenville Roleplay Rural, Bot Appearance")
      .setDescription([
        `**Main Embed Colour:** ${formatHexColor(settings.embedColor || embedColor)}`,
        `**Terminate Embed Colour:** ${formatHexColor(settings.terminateColor || 0x8b0000)}`,
        `**Footer Brand Name:** ${settings.brandName || brandName}`
      ].join("\n"));

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
