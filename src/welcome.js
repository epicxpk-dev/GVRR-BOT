const path = require("node:path");
const { AttachmentBuilder } = require("discord.js");
const { welcomeChannelId } = require("./config");
const { memberWelcomeEmbed } = require("./embeds");

function welcomeBannerAttachment() {
  return new AttachmentBuilder(
    path.join(__dirname, "..", "assets", "welcome-banner.png"),
    { name: "welcome-banner.png" }
  );
}

async function handleGuildMemberAdd(member) {
  const channel = await member.client.channels.fetch(welcomeChannelId).catch(() => null);
  if (!channel?.isTextBased()) return;

  await channel.send({
    content: `${member}`,
    embeds: [memberWelcomeEmbed({ member })],
    files: [welcomeBannerAttachment()],
    allowedMentions: { users: [member.id] }
  });
}

module.exports = {
  handleGuildMemberAdd,
  welcomeBannerAttachment
};
