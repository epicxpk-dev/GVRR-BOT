const { MessageType } = require("discord.js");
const { boostNotificationChannelId, boosterRoleRewards } = require("./config");
const { boostNotificationEmbed } = require("./embeds");
const { getBoostRewards, saveBoostRewards } = require("./storage");

const boostMessageTypes = new Set([
  MessageType.GuildBoost,
  MessageType.GuildBoostTier1,
  MessageType.GuildBoostTier2,
  MessageType.GuildBoostTier3
]);

async function handleBoostMessage(message) {
  if (!message.guild || !boostMessageTypes.has(message.type)) return;

  const member = message.member || await message.guild.members.fetch(message.author.id).catch(() => null);
  if (!member) return;

  await processBoost(member, message.channel);
}

async function handleMemberBoostUpdate(oldMember, newMember) {
  if (oldMember.premiumSince || !newMember.premiumSince) return;

  const configuredChannel = boostNotificationChannelId
    ? await newMember.client.channels.fetch(boostNotificationChannelId).catch(() => null)
    : null;
  const channel = configuredChannel?.isTextBased()
    ? configuredChannel
    : newMember.guild.systemChannel;

  await processBoost(newMember, channel);
}

async function processBoost(member, channel) {
  const boostRewards = getBoostRewards();
  const guildRewards = boostRewards[member.guild.id] || {};
  const memberRewards = guildRewards[member.id] || { count: 0, lastNoticeAt: 0 };
  const now = Date.now();

  if (now - memberRewards.lastNoticeAt < 5000) return;

  const boostCount = memberRewards.count + 1;
  guildRewards[member.id] = {
    count: boostCount,
    lastNoticeAt: now
  };
  boostRewards[member.guild.id] = guildRewards;
  saveBoostRewards(boostRewards);

  const { roles, tierName, perkSummary } = getRewardsForBoostCount(boostCount);
  await addRewardRoles(member, roles);

  if (channel?.isTextBased()) {
    await channel.send({
      embeds: [
        boostNotificationEmbed({
          member,
          boostCount,
          tierName,
          perkSummary
        })
      ]
    });
  }
}

function getRewardsForBoostCount(boostCount) {
  const roles = [
    boosterRoleRewards.earlyAccess,
    boosterRoleRewards.bannedVehicleExempt,
    boosterRoleRewards.imagePermissions
  ];
  const perks = ["Early Access", "Banned Vehicle Exempt", "Image Permissions"];
  let tierName = "Tier 1 Booster";

  if (boostCount >= 2) {
    roles.push(boosterRoleRewards.slottedVehicleExempt);
    perks.push("Slotted Vehicle Exempt");
    tierName = "Tier 2 Booster";
  }

  if (boostCount >= 3) {
    roles.push(boosterRoleRewards.allVehicleExempt);
    perks.push("All Vehicle Exempt");
    tierName = "Tier 3+ Booster";
  }

  return {
    roles: [...new Set(roles.filter(Boolean))],
    tierName,
    perkSummary: perks.join(", ")
  };
}

async function addRewardRoles(member, roleIds) {
  for (const roleId of roleIds) {
    if (member.roles.cache.has(roleId)) continue;
    await member.roles.add(roleId, "Automatic booster perk reward").catch(console.error);
  }
}

module.exports = {
  handleBoostMessage,
  handleMemberBoostUpdate
};
