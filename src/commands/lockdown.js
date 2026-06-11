const { ChannelType, PermissionFlagsBits, SlashCommandBuilder } = require("discord.js");
const { ownerUserId } = require("../config");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("lockdown")
    .setDescription("Owner-only server lockdown controls.")
    .addStringOption((option) =>
      option
        .setName("mode")
        .setDescription("Turn lockdown on or off.")
        .setRequired(true)
        .addChoices(
          { name: "on", value: "on" },
          { name: "off", value: "off" }
        )
    ),

  async execute(interaction) {
    if (interaction.user.id !== ownerUserId) {
      await interaction.reply({
        content: "Only the bot owner can use this command.",
        ephemeral: true
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    const mode = interaction.options.getString("mode");
    const shouldLock = mode === "on";
    const everyone = interaction.guild.roles.everyone;
    const channels = interaction.guild.channels.cache.filter((channel) =>
      [ChannelType.GuildText, ChannelType.GuildAnnouncement, ChannelType.GuildForum].includes(channel.type)
    );

    let updated = 0;
    for (const channel of channels.values()) {
      await channel.permissionOverwrites.edit(everyone, {
        SendMessages: shouldLock ? false : null,
        CreatePublicThreads: shouldLock ? false : null,
        CreatePrivateThreads: shouldLock ? false : null,
        SendMessagesInThreads: shouldLock ? false : null
      }).then(() => {
        updated += 1;
      }).catch(console.error);
    }

    await interaction.editReply(
      shouldLock
        ? `Lockdown enabled. ${updated} channel(s) were locked.`
        : `Lockdown disabled. ${updated} channel(s) were unlocked.`
    );
  }
};
