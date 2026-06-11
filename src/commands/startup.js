const { PermissionFlagsBits, SlashCommandBuilder } = require("discord.js");
const { developerRoleId, highCommandRoleId, sessionHostRoleId } = require("../config");
const { getGuildSettings } = require("../storage");
const { startSession } = require("./session");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("startup")
    .setDescription("Start a Greenville Roleplay Rural session.")
    .addIntegerOption((option) =>
      option.setName("required_reactions").setDescription("How many reactions are needed before Early Access opens?").setMinValue(1).setMaxValue(100).setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("roblox_link").setDescription("Roblox private server link to reveal after reactions.").setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("notes").setDescription("Extra session notes.").setMaxLength(500).setRequired(false)
    ),

  async execute(interaction) {
    const settings = getGuildSettings(interaction.guildId);

    const canHost = interaction.member.roles.cache.has(sessionHostRoleId)
      || interaction.member.roles.cache.has(highCommandRoleId)
      || interaction.member.roles.cache.has(developerRoleId)
      || interaction.memberPermissions.has(PermissionFlagsBits.Administrator);

    if (!canHost) {
      await interaction.reply({ content: "Only Staff Team members can start sessions.", ephemeral: true });
      return;
    }

    if (!settings.sessionChannelId) {
      await interaction.reply({ content: "Run `/setup channels` before using startup commands.", ephemeral: true });
      return;
    }

    await startSession(interaction, settings);
  }
};
