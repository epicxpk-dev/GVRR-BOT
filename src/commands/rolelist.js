const { PermissionFlagsBits, SlashCommandBuilder } = require("discord.js");
const { developerRoleId, highCommandRoleId } = require("../config");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rolelist")
    .setDescription("Show server role names and IDs.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  async execute(interaction) {
    const allowed = interaction.member.roles.cache.has(developerRoleId)
      || interaction.member.roles.cache.has(highCommandRoleId)
      || interaction.memberPermissions.has(PermissionFlagsBits.Administrator);

    if (!allowed) {
      await interaction.reply({ content: "Only High Command or management can use this command.", ephemeral: true });
      return;
    }

    const roles = interaction.guild.roles.cache
      .filter((role) => role.id !== interaction.guild.id)
      .sort((a, b) => b.position - a.position)
      .map((role) => `${role.name}: ${role.id}`);

    const chunks = [];
    let current = "";
    for (const line of roles) {
      if (`${current}\n${line}`.length > 1800) {
        chunks.push(current);
        current = line;
      } else {
        current = current ? `${current}\n${line}` : line;
      }
    }
    if (current) chunks.push(current);

    await interaction.reply({
      content: `Role list:\n\`\`\`\n${chunks.shift() || "No roles found."}\n\`\`\``,
      ephemeral: true
    });

    for (const chunk of chunks.slice(0, 4)) {
      await interaction.followUp({
        content: `\`\`\`\n${chunk}\n\`\`\``,
        ephemeral: true
      });
    }
  }
};
