const { incomeRewards, quotaRequirements, sessionHostRoleId } = require("./config");
const { getEconomy, saveEconomy } = require("./storage");

const workCooldownMs = 30 * 60 * 1000;
const incomeCooldownMs = 24 * 60 * 60 * 1000;

function getGuildEconomy(guildId) {
  const economy = getEconomy();
  economy[guildId] ||= {};
  return { economy, guildEconomy: economy[guildId] };
}

function getAccount(guildEconomy, userId) {
  guildEconomy[userId] ||= {
    wallet: 0,
    bank: 0,
    lastWorkAt: 0,
    lastIncomeAt: 0
  };
  return guildEconomy[userId];
}

function formatMoney(amount) {
  return `$${Math.max(0, Math.floor(amount)).toLocaleString()}`;
}

function memberIncomeAmount(member) {
  const roles = member.roles.cache;
  if (quotaRequirements.ownership.roleIds.some((roleId) => roles.has(roleId))) return incomeRewards.ownership;
  if (quotaRequirements.highRank.roleIds.some((roleId) => roles.has(roleId))) return incomeRewards.highRank;
  if (quotaRequirements.middleRank.roleIds.some((roleId) => roles.has(roleId))) return incomeRewards.middleRank;
  if (quotaRequirements.lowRank.roleIds.some((roleId) => roles.has(roleId))) return incomeRewards.lowRank;
  if (roles.has(sessionHostRoleId)) return incomeRewards.staffTeam;
  return incomeRewards.civilian;
}

function getBalance(guildId, userId) {
  const { guildEconomy } = getGuildEconomy(guildId);
  const account = getAccount(guildEconomy, userId);
  return { ...account, total: account.wallet + account.bank };
}

function work(guildId, userId) {
  const { economy, guildEconomy } = getGuildEconomy(guildId);
  const account = getAccount(guildEconomy, userId);
  const now = Date.now();
  const remaining = workCooldownMs - (now - account.lastWorkAt);
  if (remaining > 0) return { ok: false, remaining };

  const earned = Math.floor(80 + Math.random() * 141);
  account.wallet += earned;
  account.lastWorkAt = now;
  saveEconomy(economy);
  return { ok: true, earned, account };
}

function claimIncome(member) {
  const { economy, guildEconomy } = getGuildEconomy(member.guild.id);
  const account = getAccount(guildEconomy, member.id);
  const now = Date.now();
  const remaining = incomeCooldownMs - (now - account.lastIncomeAt);
  if (remaining > 0) return { ok: false, remaining };

  const amount = memberIncomeAmount(member);
  account.wallet += amount;
  account.lastIncomeAt = now;
  saveEconomy(economy);
  return { ok: true, amount, account };
}

function moveMoney(guildId, userId, from, amount) {
  const { economy, guildEconomy } = getGuildEconomy(guildId);
  const account = getAccount(guildEconomy, userId);
  const safeAmount = Math.floor(amount);
  if (safeAmount <= 0) return { ok: false, reason: "Amount must be above 0." };

  if (from === "wallet") {
    if (account.wallet < safeAmount) return { ok: false, reason: "You do not have enough money in your wallet." };
    account.wallet -= safeAmount;
    account.bank += safeAmount;
  } else {
    if (account.bank < safeAmount) return { ok: false, reason: "You do not have enough money in your bank." };
    account.bank -= safeAmount;
    account.wallet += safeAmount;
  }

  saveEconomy(economy);
  return { ok: true, account };
}

function payUser(guildId, fromUserId, toUserId, amount) {
  const { economy, guildEconomy } = getGuildEconomy(guildId);
  const from = getAccount(guildEconomy, fromUserId);
  const to = getAccount(guildEconomy, toUserId);
  const safeAmount = Math.floor(amount);
  if (safeAmount <= 0) return { ok: false, reason: "Amount must be above 0." };
  if (from.wallet < safeAmount) return { ok: false, reason: "You do not have enough money in your wallet." };

  from.wallet -= safeAmount;
  to.wallet += safeAmount;
  saveEconomy(economy);
  return { ok: true, from, to };
}

function editMoney(guildId, userId, accountName, amount) {
  const { economy, guildEconomy } = getGuildEconomy(guildId);
  const account = getAccount(guildEconomy, userId);
  const safeAmount = Math.floor(amount);
  account[accountName] = Math.max(0, account[accountName] + safeAmount);
  saveEconomy(economy);
  return account;
}

function removeWalletMoney(guildId, userId, amount) {
  const { economy, guildEconomy } = getGuildEconomy(guildId);
  const account = getAccount(guildEconomy, userId);
  const safeAmount = Math.floor(amount);
  if (safeAmount <= 0) return { ok: false, reason: "Amount must be above 0." };
  if (account.wallet < safeAmount) return { ok: false, reason: "You do not have enough money in your wallet." };

  account.wallet -= safeAmount;
  saveEconomy(economy);
  return { ok: true, account };
}

module.exports = {
  claimIncome,
  editMoney,
  formatMoney,
  getBalance,
  memberIncomeAmount,
  moveMoney,
  payUser,
  removeWalletMoney,
  work
};
