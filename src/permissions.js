const { PermissionsBitField } = require("discord.js");

function hasPermission(interaction, permission) {
  return interaction.memberPermissions?.has(permission);
}

function requirePermission(interaction, permission) {
  if (hasPermission(interaction, permission)) {
    return true;
  }

  const readable = permission.toString();
  interaction.reply({
    content: `You need the \`${readable}\` permission to use this command.`,
    ephemeral: true
  });
  return false;
}

module.exports = {
  PermissionsBitField,
  requirePermission
};
