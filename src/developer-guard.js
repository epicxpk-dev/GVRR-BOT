const { developerRoleId } = require("./config");

function isDeveloper(interaction) {
  return interaction.member?.roles?.cache?.has(developerRoleId);
}

async function requireDeveloper(interaction) {
  if (isDeveloper(interaction)) {
    return true;
  }

  await interaction.reply({
    content: "Only the high developer role can use this command.",
    ephemeral: true
  });
  return false;
}

module.exports = {
  requireDeveloper
};
