const { SlashCommandBuilder } = require("discord.js");
const { baseEmbed } = require("../embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("membercount")
    .setDescription("Show the server member count."),

  async execute(interaction) {
    const guild = interaction.guild;
    await guild.members.fetch().catch(() => null);

    const totalMembers = guild.memberCount;
    const humans = guild.members.cache.filter((member) => !member.user.bot).size;
    const bots = guild.members.cache.filter((member) => member.user.bot).size;

    await interaction.reply({
      embeds: [
        baseEmbed()
          .setTitle("Greenville Roleplay Rural Member Count")
          .setDescription([
            `**Total Members:** ${totalMembers}`,
            `**Members:** ${humans}`,
            `**Bots:** ${bots}`
          ].join("\n"))
      ]
    });
  }
};
