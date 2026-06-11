const {
  ChannelType,
  PermissionFlagsBits,
  SlashCommandBuilder
} = require("discord.js");
const { updateGuildSettings } = require("../storage");
const { setupEmbed } = require("../embeds");
const { requireDeveloper } = require("../developer-guard");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setup")
    .setDescription("Set up bot channels and roles.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((subcommand) =>
      subcommand
        .setName("channels")
        .setDescription("Save channels used by the bot.")
        .addChannelOption((option) =>
          option.setName("sessions").setDescription("Session announcement channel.").addChannelTypes(ChannelType.GuildText).setRequired(true)
        )
        .addChannelOption((option) =>
          option.setName("ticket_category").setDescription("Category where tickets are created.").addChannelTypes(ChannelType.GuildCategory).setRequired(true)
        )
        .addChannelOption((option) =>
          option.setName("transcripts").setDescription("Channel for closed ticket transcripts.").addChannelTypes(ChannelType.GuildText).setRequired(true)
        )
        .addChannelOption((option) =>
          option.setName("mod_logs").setDescription("Channel for moderation logs.").addChannelTypes(ChannelType.GuildText).setRequired(true)
        )
        .addChannelOption((option) =>
          option.setName("roleplay_1").setDescription("Roleplay 1 channel to reset after sessions end.").addChannelTypes(ChannelType.GuildText).setRequired(false)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("roles")
        .setDescription("Save roles used by the bot.")
        .addRoleOption((option) =>
          option.setName("staff").setDescription("Role that can view and close tickets.").setRequired(true)
        )
        .addRoleOption((option) =>
          option.setName("early_access").setDescription("Role pinged when Early Access opens.").setRequired(true)
        )
        .addRoleOption((option) =>
          option.setName("session_ping").setDescription("Role pinged for session startup.").setRequired(true)
        )
    ),

  async execute(interaction) {
    if (!(await requireDeveloper(interaction))) return;

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "channels") {
      const sessions = interaction.options.getChannel("sessions");
      const ticketCategory = interaction.options.getChannel("ticket_category");
      const transcripts = interaction.options.getChannel("transcripts");
      const modLogs = interaction.options.getChannel("mod_logs");
      const roleplayOne = interaction.options.getChannel("roleplay_1");

      updateGuildSettings(interaction.guildId, {
        sessionChannelId: sessions.id,
        ticketCategoryId: ticketCategory.id,
        transcriptChannelId: transcripts.id,
        modLogChannelId: modLogs.id,
        roleplayOneChannelId: roleplayOne?.id
      });

      await interaction.reply({
        embeds: [setupEmbed("Channels Saved", `Sessions: ${sessions}\nTickets: ${ticketCategory.name}\nTranscripts: ${transcripts}\nMod Logs: ${modLogs}\nRoleplay 1: ${roleplayOne || "Not set"}`)],
        ephemeral: true
      });
      return;
    }

    const staff = interaction.options.getRole("staff");
    const earlyAccess = interaction.options.getRole("early_access");
    const sessionPing = interaction.options.getRole("session_ping");

    updateGuildSettings(interaction.guildId, {
      staffRoleId: staff.id,
      earlyAccessRoleId: earlyAccess.id,
      sessionPingRoleId: sessionPing.id
    });

    await interaction.reply({
      embeds: [setupEmbed("Roles Saved", `Staff: ${staff}\nEarly Access: ${earlyAccess}\nSession Ping: ${sessionPing}`)],
      ephemeral: true
    });
  }
};
