const { ownerUserId } = require("./config");
const { getOwnerPingWarnings, saveOwnerPingWarnings } = require("./storage");

const timeoutMs = 10 * 60 * 1000;

async function handleOwnerPing(message) {
  if (!message.guild || message.author.bot) return;
  if (message.author.id === ownerUserId) return;
  if (message.reference) return;
  if (!message.mentions.users.has(ownerUserId)) return;

  const warnings = getOwnerPingWarnings();
  const guildWarnings = warnings[message.guild.id] || {};
  const currentCount = guildWarnings[message.author.id] || 0;
  const nextCount = currentCount + 1;

  guildWarnings[message.author.id] = nextCount;
  warnings[message.guild.id] = guildWarnings;
  saveOwnerPingWarnings(warnings);

  if (nextCount === 1) {
    await message.reply({
      content: `${message.author}, please do not ping Charxlie directly. Open a support ticket if you need help. If you do this again, you will receive a 10 minute timeout.`,
      allowedMentions: { users: [message.author.id] }
    });
    return;
  }

  const member = await message.guild.members.fetch(message.author.id).catch(() => null);
  if (!member || !member.moderatable) {
    await message.reply({
      content: `${message.author}, you have already been warned not to ping Charxlie. I could not timeout you automatically, so staff will handle this.`,
      allowedMentions: { users: [message.author.id] }
    });
    return;
  }

  await member.timeout(timeoutMs, "Repeatedly pinged Charxlie after being warned.");
  await message.reply({
    content: `${message.author} has been timed out for 10 minutes for repeatedly pinging Charxlie.`,
    allowedMentions: { users: [message.author.id] }
  });
}

module.exports = { handleOwnerPing };
