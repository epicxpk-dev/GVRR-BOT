const { getGuildSettings } = require("./storage");
const { modLogEmbed } = require("./embeds");

async function sendModLog(interaction, payload) {
  const settings = getGuildSettings(interaction.guildId);
  if (!settings.modLogChannelId) return;

  const channel = await interaction.client.channels.fetch(settings.modLogChannelId).catch(() => null);
  if (!channel) return;

  await channel.send({ embeds: [modLogEmbed(payload)] });
}

module.exports = { sendModLog };
