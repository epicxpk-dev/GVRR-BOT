const { contributorRoleId, contributorStatusText } = require("./config");
const { contributorEmbed } = require("./embeds");

function hasContributorStatus(member) {
  const text = contributorStatusText.toLowerCase();
  return member.presence?.activities?.some((activity) => {
    const values = [activity.name, activity.state, activity.details]
      .filter(Boolean)
      .map((value) => value.toLowerCase());

    return values.some((value) => value.includes(text));
  }) || false;
}

async function giveContributorRole(member, channel) {
  if (!member || member.user.bot) return false;
  if (member.roles.cache.has(contributorRoleId)) return true;
  if (!hasContributorStatus(member)) return false;

  await member.roles.add(contributorRoleId, "User has /GVRR in their status.");

  if (channel?.isTextBased()) {
    await channel.send({
      embeds: [contributorEmbed({ member })]
    }).catch(console.error);
  }

  return true;
}

async function handlePresenceUpdate(_oldPresence, newPresence) {
  const member = newPresence.member;
  if (!member) return;
  await giveContributorRole(member, null).catch(console.error);
}

module.exports = {
  giveContributorRole,
  handlePresenceUpdate,
  hasContributorStatus
};
