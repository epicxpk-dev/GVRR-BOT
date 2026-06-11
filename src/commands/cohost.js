const { PermissionFlagsBits, SlashCommandBuilder } = require("discord.js");
const { getGuildSettings, getSessions, saveSessions } = require("../storage");
const { sessionCohostEmbed } = require("../embeds");
const { getActiveSessionForGuild } = require("../sessions");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("cohost")
    .setDescription("Add a co-host to the active session.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The member co-hosting this session.")
        .setRequired(true)
    ),

  async execute(interaction) {
    const settings = getGuildSettings(interaction.guildId);
    if (!settings.sessionChannelId) {
      await interaction.reply({ content: "Run `/setup channels` before using session commands.", ephemeral: true });
      return;
    }

    const active = getActiveSessionForGuild(interaction.guildId);
    if (!active) {
      await interaction.reply({ content: "There is no active session to add a co-host to.", ephemeral: true });
      return;
    }

    const [messageId, session] = active;
    const member = interaction.options.getMember("user");
    if (!member) {
      await interaction.reply({ content: "I could not find that member.", ephemeral: true });
      return;
    }

    const sessions = getSessions();
    const cohostIds = new Set(session.cohostIds || []);
    cohostIds.add(member.id);
    sessions[messageId] = {
      ...session,
      cohostIds: Array.from(cohostIds)
    };
    saveSessions(sessions);

    const channel = await interaction.client.channels.fetch(session.channelId || settings.sessionChannelId);
    await channel.send({
      content: `${member}`,
      embeds: [sessionCohostEmbed({ member })],
      allowedMentions: { users: [member.id] }
    });

    await interaction.reply({ content: `${member} has been added as a co-host.`, ephemeral: true });
  }
};
