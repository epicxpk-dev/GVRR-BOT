const { EmbedBuilder } = require("discord.js");
const { botDescription, brandEmoji, brandName, earlyAccessEmoji, embedColor, guidelinesArrowEmoji, guidelinesEmoji, quotaInformationEmoji, quotaLeaderboardEmoji, roleplayInfoEmoji, startupStarEmoji, successEmoji, supportTitleEmoji } = require("./config");
const { getBotSettings } = require("./storage");

function appearance() {
  return getBotSettings("global");
}

function activeEmbedColor() {
  return appearance().embedColor || embedColor;
}

function activeTerminateColor() {
  return appearance().terminateColor || 0x8b0000;
}

function activeBrandName() {
  return appearance().brandName || brandName;
}

function baseEmbed() {
  return new EmbedBuilder()
    .setColor(activeEmbedColor())
    .setFooter({ text: activeBrandName() })
    .setTimestamp();
}

function setupEmbed(title, description) {
  return baseEmbed()
    .setTitle(title)
    .setDescription(description);
}

function ticketPanelEmbed() {
  return baseEmbed()
    .setTitle(`${supportTitleEmoji} Greenville Roleplay Rural, Support Directory ${supportTitleEmoji}`)
    .setDescription([
      "Welcome to the **Greenville Roleplay Rural Support Directory**. This area is for members who need assistance through General Support, Civilian Report, or Staff Report tickets. If you are experiencing an issue in the community, please choose the correct ticket category below.",
      "",
      "> **General Assistance:**",
      `${guidelinesArrowEmoji} Use this ticket for **questions** about server rules, sessions, perks, partnership requests, or application support. This ticket is not for reporting another member.`,
      "",
      "> **Civilian Report:**",
      `${guidelinesArrowEmoji} Use this ticket to report a **Civilian** who may be breaking the rules. Please gather proof where possible so High Command can review the situation and take suitable action.`,
      "",
      "> **Staff Report:**",
      `${guidelinesArrowEmoji} Use this ticket to report a **Staff Member** who may be breaking expectations or acting incorrectly. Please include clear evidence so High Command can investigate properly.`,
      "",
      `${guidelinesArrowEmoji} **Please Note:** If you do not respond to your ticket within **24 Hours**, it may be automatically closed. Processing support tickets may take between **2-3 Hours**.`
    ].join("\n"))
    .setImage("attachment://assistance-banner.png");
}

function ticketOpenedEmbed({ typeLabel }) {
  return baseEmbed()
    .setTitle(`Greenville Roleplay Rural, ${typeLabel}`)
    .setDescription([
      "Thank you for opening a ticket. A **Greenville Roleplay Rural** staff member will claim this ticket within the next **24 hours**.",
      "",
      "Please remain respectful while using this ticket, and make sure you explain your issue clearly so our team can help as quickly as possible.",
      "",
      "```",
      "Ping Yourself:",
      "Question/Concern:",
      "Extra Information:",
      "```"
    ].join("\n"));
}

function sessionStartEmbed({ host, requiredReactions, notes }) {
  return baseEmbed()
    .setTitle(`${brandEmoji} Greenville Roleplay Rural, Session Startup ${brandEmoji}`)
    .setDescription([
      `${guidelinesArrowEmoji} A new Greenville Roleplay Rural session is being hosted by ${host}.`,
      "Please make sure you have read the server information, checked your vehicle is allowed, and are ready to follow the host's instructions during the session.",
      "",
      `${guidelinesArrowEmoji} The host has requested **${requiredReactions}+** reactions before the session link is released.`,
      "",
      "**Session Information**",
      `${guidelinesArrowEmoji} **Host:** ${host}`,
      `${guidelinesArrowEmoji} **Required Reactions:** ${requiredReactions}`,
      `${guidelinesArrowEmoji} **Notes:** ${notes || "No extra notes provided."}`,
      "",
      `React with ${successEmoji} to show that you are ready to attend.`
    ].join("\n"))
    .setImage("attachment://session-startup.png");
}

function sessionSetupEmbed({ host }) {
  return baseEmbed()
    .setTitle(`${startupStarEmoji} Greenville Roleplay Rural, Session Setup ${startupStarEmoji}`)
    .setDescription([
      `${guidelinesArrowEmoji} The required reactions have been reached, and ${host} is now setting the session up.`,
      "",
      `${guidelinesArrowEmoji} If you have any questions, please ask the co-host or another available staff member while the host prepares the session.`,
      "",
      `${guidelinesArrowEmoji} Setup can take up to **10 minutes**, so please be patient in the meantime.`
    ].join("\n"));
}

function earlyAccessEmbed({ roleId }) {
  return baseEmbed()
    .setTitle(`${earlyAccessEmoji} Greenville Roleplay Rural, Session Early Access ${earlyAccessEmoji}`)
    .setDescription([
      `${guidelinesArrowEmoji} Early Access has now been opened for this session.`,
      roleId ? `${guidelinesArrowEmoji} <@&${roleId}> may join using the session button below.` : `${guidelinesArrowEmoji} Approved early access members may join using the session button below.`,
      "",
      `${guidelinesArrowEmoji} Please join calmly, follow staff instructions, and do not disturb the host while the session is being prepared.`,
      "",
      `${guidelinesArrowEmoji} Press **Session Link** below to join.`
    ].join("\n"))
    .setImage("attachment://early-access.png");
}

function sessionReleaseEmbed({ host, robloxLink, notes }) {
  return baseEmbed()
    .setTitle(`${brandEmoji} Greenville Roleplay Rural, Session Released ${brandEmoji}`)
    .setDescription([
      `${guidelinesArrowEmoji} The session hosted by ${host} has now been released.`,
      "When joining, please spawn your vehicle carefully, park in the correct area, and wait for further instructions from the host or staff team.",
      "",
      "**Session Information**",
      `${guidelinesArrowEmoji} **Peace Time:** Strict`,
      `${guidelinesArrowEmoji} **Emergency Services:** Active`,
      `${guidelinesArrowEmoji} **Session Notes:** ${notes || "None"}`,
      "",
      `${guidelinesArrowEmoji} Press **Session Link** below to join.`
    ].join("\n"))
    .setImage("attachment://session-released.png");
}

function reInvitesEmbed({ host, robloxLink, notes }) {
  return baseEmbed()
    .setTitle(`${earlyAccessEmoji} Greenville Roleplay Rural, Re-Invites ${earlyAccessEmoji}`)
    .setDescription([
      `${guidelinesArrowEmoji} Re-invites are now open for the active Greenville Roleplay Rural session.`,
      "",
      `${guidelinesArrowEmoji} **Host:** ${host}`,
      `${guidelinesArrowEmoji} **Session Link:** Press the button below to join.`,
      `${guidelinesArrowEmoji} **Notes:** ${notes || "No extra notes provided."}`,
      "",
      `${guidelinesArrowEmoji} If you disconnected, crashed, or missed the first release, you may rejoin using the link above.`,
      `${guidelinesArrowEmoji} Please spawn calmly, follow staff instructions, and avoid interrupting the session host.`
    ].join("\n"))
    .setImage("attachment://re-invites.png");
}

function sessionEndEmbed({ host, startAt, endAt, notes }) {
  const durationMs = Math.max(0, endAt - startAt);
  const minutes = Math.floor(durationMs / 60000);
  const startUnix = Math.floor(startAt / 1000);
  const endUnix = Math.floor(endAt / 1000);

  return baseEmbed()
    .setTitle(`${brandEmoji} Greenville Roleplay Rural, Session Concluded ${brandEmoji}`)
    .setDescription([
      `${guidelinesArrowEmoji} The Greenville Roleplay Rural session hosted by ${host} has now concluded.`,
      "Thank you to everyone who attended. Please wait for the next session announcement before continuing roleplay activity.",
      "",
      "**Session Information**",
      `${guidelinesArrowEmoji} **Host:** ${host}`,
      `${guidelinesArrowEmoji} **Start Time:** <t:${startUnix}:t>`,
      `${guidelinesArrowEmoji} **End Time:** <t:${endUnix}:t>`,
      `${guidelinesArrowEmoji} **Duration:** ${minutes}m`,
      `${guidelinesArrowEmoji} **Notes:** ${notes || "No notes provided."}`
    ].join("\n"))
    .setImage("attachment://session-over.png");
}

function sessionTerminatedEmbed({ moderator, reason }) {
  return new EmbedBuilder()
    .setColor(activeTerminateColor())
    .setTitle(`${brandEmoji} Greenville Roleplay Rural, Session Terminated ${brandEmoji}`)
    .setDescription([
      `${guidelinesArrowEmoji} ${moderator} has terminated the session.`,
      "",
      `${guidelinesArrowEmoji} **Reason/Notes:** ${reason || "No reason provided."}`,
      "",
      `${guidelinesArrowEmoji} This session will not count towards quota. Please wait for High Command or HR before continuing session activity.`
    ].join("\n"))
    .setFooter({ text: activeBrandName() })
    .setTimestamp();
}

function sessionCohostEmbed({ member }) {
  return baseEmbed()
    .setTitle(`${brandEmoji} Greenville Roleplay Rural, Session Co-Host ${brandEmoji}`)
    .setDescription([
      `${guidelinesArrowEmoji} ${member} is now co-hosting this session.`,
      "",
      `${guidelinesArrowEmoji} If you have any questions or need support during the session, please contact the co-host instead of interrupting the main host.`,
      `${guidelinesArrowEmoji} Please continue following all host and staff instructions while roleplaying.`
    ].join("\n"));
}

function sessionSupervisingEmbed({ member }) {
  return baseEmbed()
    .setTitle(`${quotaInformationEmoji} Greenville Roleplay Rural, Session Supervision ${quotaInformationEmoji}`)
    .setDescription([
      `${guidelinesArrowEmoji} ${member} is now supervising this session.`,
      "",
      `${guidelinesArrowEmoji} Staff should follow their guidance while the session is active.`,
      `${guidelinesArrowEmoji} If an issue needs High Command review, please direct it to the supervising member.`
    ].join("\n"));
}

function roleplayOneStartupEmbed() {
  return baseEmbed()
    .setTitle(`${startupStarEmoji} Greenville Roleplay Rural, Startup One ${startupStarEmoji}`)
    .setDescription([
      "Welcome to **Greenville Roleplay Rural's** startup one channel. This area is used by our Staff Department to prepare and host organised roleplay sessions for civilians.",
      "",
      "Before taking part in any Roblox sessions, please make sure you are in the Roblox group and have read through our community guidelines, server information, and in-game expectations."
    ].join("\n"));
}

function roleplayOneInfoEmbed() {
  return baseEmbed()
    .setTitle(`${roleplayInfoEmoji} Roleplay Information`)
    .setDescription([
      "Please familiarise yourself with our server rules and regulations before joining a session. This helps keep roleplays organised, fair, and enjoyable for everyone.",
      "",
      `${guidelinesArrowEmoji} Register your vehicle(s) in the correct vehicle registration area before using them in sessions.`,
      `${guidelinesArrowEmoji} Make sure you have the correct roles for your vehicle and check restricted vehicle information when needed.`,
      `${guidelinesArrowEmoji} Ensure you are a verified civilian and have completed any required checkpoint before leaving spawn.`,
      `${guidelinesArrowEmoji} Listen carefully to the session host and staff team during roleplays.`
    ].join("\n"));
}

function roleplayOneBannerEmbed() {
  return baseEmbed()
    .setImage("attachment://roleplay-1-banner.png");
}

function guidelinesBannerEmbed() {
  return baseEmbed()
    .setImage("attachment://guidelines-banner.png");
}

function guidelinesIntroEmbed() {
  return baseEmbed()
    .setTitle(`${guidelinesEmoji} Greenville Roleplay Rural, Server Regulations ${guidelinesEmoji}`)
    .setDescription([
      "Welcome to **Greenville Roleplay Rural**. We are a Greenville roleplay community focused on creating a smooth, professional, and enjoyable civilian roleplay experience.",
      "",
      "We encourage all members to review these guidelines carefully and take some time to understand the resources available in our community before attending sessions."
    ].join("\n"));
}

function guidelinesRulesEmbed() {
  return baseEmbed()
    .setTitle(`${guidelinesEmoji} Server Guidelines`)
    .setDescription([
      `**Rule 1 ${guidelinesArrowEmoji} Respectful Conduct:**`,
      "Treat every member with respect. Harassment, discrimination, hate speech, or personal attacks are not permitted.",
      "",
      `**Rule 2 ${guidelinesArrowEmoji} No Spamming:**`,
      "Avoid repeated messages, irrelevant content, or anything that disrupts the channel's purpose.",
      "",
      `**Rule 3 ${guidelinesArrowEmoji} Appropriate Content:**`,
      "Do not post sexual, violent, NSFW, or age-inappropriate content. Keep all channels safe and comfortable.",
      "",
      `**Rule 4 ${guidelinesArrowEmoji} No Advertising:**`,
      "Do not promote other servers, services, websites, or content without permission from management.",
      "",
      `**Rule 5 ${guidelinesArrowEmoji} Roleplay Standards:**`,
      "Follow session host instructions, drive realistically, use appropriate vehicles, and keep roleplay fair for everyone.",
      "",
      `**Rule 6 ${guidelinesArrowEmoji} No Exploiting or Cheating:**`,
      "Exploits, hacks, cheats, or abusing game bugs are strictly forbidden.",
      "",
      `**Rule 7 ${guidelinesArrowEmoji} No Impersonation:**`,
      "Do not impersonate staff, management, public figures, or other members.",
      "",
      `**Rule 8 ${guidelinesArrowEmoji} Staff Compliance:**`,
      "Follow staff instructions. If you disagree with a decision, open a support ticket calmly.",
      "",
      `**Rule 9 ${guidelinesArrowEmoji} Member Verification:**`,
      "Members must follow verification and role requirements before taking part in sessions.",
      "",
      `**Rule 10 ${guidelinesArrowEmoji} Discord Terms of Service:**`,
      "Ensure that you follow Discord Terms of Service at all times within our server. Breaking Terms of Service may result in moderation action and a report to Discord if required.",
      "",
      "Warm Regards,",
      "**Charxlie**",
      "Administrative Overseer"
    ].join("\n"));
}

function guidelinesResourcesEmbed() {
  return baseEmbed()
    .setTitle(`${guidelinesArrowEmoji} Greenville Roleplay Rural - Resources:`)
    .setDescription([
      "- **Greenville Roleplay Rural Official Link:** [Discord Server](https://discord.gg/a4rHQNEgUT)",
      "- **Greenville Roleplay Rural Roblox Group:** [Roblox Group](https://www.roblox.com/communities/475725193/Greenville-Roleplay-Rural#!/about)",
      "- **Greenville Roleplay Rural TikTok Page:** Coming soon",
      "- **Support:** Please open a support ticket if you have any questions."
    ].join("\n"));
}

function modLogEmbed({ action, moderator, target, reason }) {
  return baseEmbed()
    .setTitle(`Moderation: ${action}`)
    .setDescription([
      `- Moderator: ${moderator}`,
      `- Target: ${target}`,
      `- Reason: ${reason || "No reason provided."}`
    ].join("\n"));
}

function leaveOfAbsenceEmbed({ member, reason, length, requestedReturn, imageUrl }) {
  const returnUnix = Math.floor(requestedReturn.getTime() / 1000);
  const avatarUrl = member.user.displayAvatarURL({ extension: "png", size: 256 });

  const embed = baseEmbed()
    .setTitle("New Leave of Absence Request")
    .setDescription([
      `${guidelinesArrowEmoji} **Staff Member:** ${member} (${member.id})`,
      `${guidelinesArrowEmoji} **Reason:** ${reason}`,
      `${guidelinesArrowEmoji} **Duration:** ${length}`,
        `${guidelinesArrowEmoji} **Requested Return:** <t:${returnUnix}:F> (<t:${returnUnix}:R>)`
      ].join("\n"))
    .setThumbnail(avatarUrl);

  if (imageUrl) {
    embed.setImage(imageUrl);
  }

  return embed;
}

function boostNotificationEmbed({ member, boostCount, tierName, perkSummary }) {
  return baseEmbed()
    .setTitle(`${brandEmoji} Greenville Roleplay Rural | Boost Notification`)
    .setDescription([
      `${guidelinesArrowEmoji} Thank you, ${member}. Your server boost has been received and your booster perks have been updated automatically.`,
      "",
      `${guidelinesArrowEmoji} **Boosts Recorded:** ${boostCount}`,
      `${guidelinesArrowEmoji} **Booster Tier:** ${tierName}`,
      `${guidelinesArrowEmoji} **Perks Applied:** ${perkSummary}`,
      "",
      `${guidelinesArrowEmoji} If a perk has not appeared correctly, please open an **assistance** ticket and our staff team will review it for you.`
    ].join("\n"))
    .setThumbnail(member.user.displayAvatarURL({ extension: "png", size: 256 }));
}

function contributorEmbed({ member }) {
  return baseEmbed()
    .setTitle(`${brandEmoji} Server Representative ${brandEmoji}`)
    .setDescription([
      `${guidelinesArrowEmoji} Thank you, ${member}, for representing **Greenville Roleplay Rural** in your Discord status.`,
      "",
      `${guidelinesArrowEmoji} You have received the **Server Contributor** role as a small thank-you for helping support and advertise the community.`,
      "",
      `${guidelinesArrowEmoji} To keep these perks active, keep **/GVRR** somewhere in your custom status.`
    ].join("\n"))
    .setThumbnail(member.user.displayAvatarURL({ extension: "png", size: 256 }));
}

function welcomeBannerEmbed() {
  return baseEmbed()
    .setImage("attachment://welcome-banner.png");
}

function welcomeInfoEmbed() {
  return baseEmbed()
    .setTitle(`${brandEmoji} Welcome to Greenville Roleplay Rural ${brandEmoji}`)
    .setDescription([
      `${guidelinesArrowEmoji} Welcome to **Greenville Roleplay Rural**. We are glad to have you in the community.`,
      "",
      `${guidelinesArrowEmoji} Please take a few minutes to read our guidelines, check the server information, and make sure you understand the roleplay expectations before joining sessions.`,
      "",
      `${guidelinesArrowEmoji} Need help? Open an assistance ticket and our staff team will support you as soon as possible.`,
      "",
      `${guidelinesArrowEmoji} We hope you enjoy your time here and help keep the community professional, friendly, and fun.`
    ].join("\n"));
}

function memberWelcomeEmbed({ member }) {
  return baseEmbed()
    .setTitle(`${brandEmoji} New Member Joined ${brandEmoji}`)
    .setDescription([
      `${guidelinesArrowEmoji} Welcome ${member} to **Greenville Roleplay Rural**.`,
      "",
      `${guidelinesArrowEmoji} Please read the server information and guidelines before taking part in any roleplay sessions.`,
      `${guidelinesArrowEmoji} If you have questions, our support team can help through the assistance channel.`
    ].join("\n"))
    .setThumbnail(member.user.displayAvatarURL({ extension: "png", size: 256 }))
    .setImage("attachment://welcome-banner.png");
}

function quotaLoggedEmbed({ member, minutes, totalMinutes, quotaGroup, notes, formatDuration }) {
  const requiredText = quotaGroup.minutes > 0 ? formatDuration(quotaGroup.minutes) : "Exempt";
  const progressText = quotaGroup.minutes > 0
    ? `${formatDuration(totalMinutes)} / ${requiredText}`
    : `${formatDuration(totalMinutes)} logged`;

  return baseEmbed()
    .setTitle(`${quotaInformationEmoji} Session Quota Logged`)
    .setDescription([
      `${guidelinesArrowEmoji} **Staff Member:** ${member}`,
      `${guidelinesArrowEmoji} **Quota Group:** ${quotaGroup.name}`,
      `${guidelinesArrowEmoji} **Session Time:** ${formatDuration(minutes)}`,
      `${guidelinesArrowEmoji} **Quota Progress:** ${progressText}`,
      `${guidelinesArrowEmoji} **Notes:** ${notes || "No notes provided."}`
    ].join("\n"));
}

function quotaLeaderboardEmbed({ rows, formatDuration }) {
  const description = rows.length
    ? rows.slice(0, 25).map((row, index) => {
      const topMarker = index === 0 ? `${quotaLeaderboardEmoji} ` : "";
      const name = row.displayName || `<@${row.userId}>`;
      return `${topMarker}**${name}:** \`${formatDuration(row.totalMinutes)}\``;
    }).join("\n")
    : "No session logs have been submitted yet.";

  return baseEmbed()
    .setTitle(`${quotaLeaderboardEmoji} Active Staff Leaderboard`)
    .setDescription([
      "Quota records are updated automatically whenever a staff member submits `/sessionlog`. Members marked as LOA or quota-exempt are hidden from this board.",
      "",
      description
    ].join("\n"));
}

function quotaInfoEmbed({ quotaRequirements }) {
  const lowRankOrder = [
    "1426658744946921540",
    "1426658744946921541",
    "1426658744959500378"
  ];
  const middleRankOrder = [
    "1513095123695698091",
    "1426658744959500379",
    "1426658744959500380"
  ];
  const highCommandOrder = [
    "1426658744959500387",
    "1426658744959500385",
    "1426658744959500384",
    "1426658744959500383",
    "1426658744959500382"
  ];
  const ownershipOrder = [
    "1426658744959500386",
    "1426658744984539158",
    "1426658744984539162",
    "1426658744959500381"
  ];

  const roleLines = (roleIds, requirement) =>
    roleIds.map((roleId) => `${guidelinesArrowEmoji} <@&${roleId}> - **${requirement}**`).join("\n");

  return baseEmbed()
    .setTitle(`${quotaInformationEmoji} Greenville Roleplay Rural, Quota Information`)
    .setDescription([
      "Staff quotas help keep **Greenville Roleplay Rural** active, organised, and fair for everyone. Each staff member is expected to log their hosted or co-hosted session time after every session.",
      "",
      `${guidelinesArrowEmoji} Quotas are checked from submitted \`/sessionlog\` records.`,
      `${guidelinesArrowEmoji} Staff who are on LOA or marked quota-exempt will not appear on the active leaderboard.`,
      `${guidelinesArrowEmoji} If your time looks wrong, contact High Command so it can be reviewed.`,
      "",
      "**Low Rank**",
      roleLines(lowRankOrder, "3 hours"),
      "",
      "**Middle Rank**",
      roleLines(middleRankOrder, "4 hours"),
      "",
      "**High Command**",
      roleLines(highCommandOrder, "4 hours"),
      "",
      "**Ownership**",
      `${guidelinesArrowEmoji} <@&${ownershipOrder[0]}> - **Handling server issues & partnerships**`,
      `${guidelinesArrowEmoji} <@&${ownershipOrder[1]}> - **Handling server issues & partnerships**`,
      `${guidelinesArrowEmoji} <@&${ownershipOrder[2]}> - **Exempt**`,
      `${guidelinesArrowEmoji} <@&${ownershipOrder[3]}> - **Exempt**`,
      "",
      "**Exempt Roles**",
      `${guidelinesArrowEmoji} <@&1426658744946921537> - **LOA / hidden from quota**`,
      `${guidelinesArrowEmoji} <@&1512147853466665180> - **Quota exempt**`
    ].join("\n"));
}

function staffStrikeDmEmbed({ moderator, reason, evidence, notes }) {
  return baseEmbed()
    .setTitle(`${guidelinesEmoji} Greenville Roleplay Rural, Staff Strike`)
    .setDescription([
      `${guidelinesArrowEmoji} You have received a staff strike in **Greenville Roleplay Rural**.`,
      "",
      `${guidelinesArrowEmoji} **Issued By:** ${moderator}`,
      `${guidelinesArrowEmoji} **Reason:** ${reason}`,
      `${guidelinesArrowEmoji} **Evidence:** ${evidence}`,
      `${guidelinesArrowEmoji} **Notes:** ${notes || "No extra notes provided."}`,
      "",
      `${guidelinesArrowEmoji} Please review this carefully and speak with High Command if you believe this needs to be discussed.`
    ].join("\n"));
}

function balanceEmbed({ member, balance, formatMoney }) {
  return baseEmbed()
    .setTitle(`${brandEmoji} Greenville Roleplay Rural, Economy`)
    .setDescription([
      `${guidelinesArrowEmoji} **Member:** ${member}`,
      `${guidelinesArrowEmoji} **Wallet:** ${formatMoney(balance.wallet)}`,
      `${guidelinesArrowEmoji} **Bank:** ${formatMoney(balance.bank)}`,
      `${guidelinesArrowEmoji} **Total:** ${formatMoney(balance.total)}`
    ].join("\n"))
    .setThumbnail(member.user.displayAvatarURL({ extension: "png", size: 256 }));
}

function citationIssuedEmbed({ citation, civilian, issuer, formatMoney }) {
  return baseEmbed()
    .setTitle(`${guidelinesEmoji} Greenville Roleplay Rural, Citation Issued ${guidelinesEmoji}`)
    .setDescription([
      `${guidelinesArrowEmoji} **Citation ID:** \`${citation.id}\``,
      `${guidelinesArrowEmoji} **Civilian:** ${civilian}`,
      `${guidelinesArrowEmoji} **Issuer:** ${issuer}`,
      `${guidelinesArrowEmoji} **Department:** ${citation.department}`,
      `${guidelinesArrowEmoji} **Offense:** ${citation.offense}`,
      `${guidelinesArrowEmoji} **Count:** ${citation.count}`,
      `${guidelinesArrowEmoji} **Fine:** ${formatMoney(citation.fine)}`,
      `${guidelinesArrowEmoji} **Location:** ${citation.location || "Not provided"}`,
      "",
      `${roleplayInfoEmoji} **Notice:** The civilian may pay this citation with \`/pay-citation\`. Unpaid citations may be reviewed by Public Services.`
    ].join("\n"));
}

function citationPaidEmbed({ citation, civilian, formatMoney }) {
  return baseEmbed()
    .setTitle(`${successEmoji} Citation Paid`)
    .setDescription([
      `${guidelinesArrowEmoji} **Civilian:** ${civilian}`,
      `${guidelinesArrowEmoji} **Citation ID:** \`${citation.id}\``,
      `${guidelinesArrowEmoji} **Amount Paid:** ${formatMoney(citation.fine)}`,
      `${guidelinesArrowEmoji} **Status:** Paid`
    ].join("\n"));
}

function psRecordEmbed({ record, officer, owner, formatMoney }) {
  return baseEmbed()
    .setTitle(`${brandEmoji} Public Services Database Entry`)
    .setDescription([
      `${guidelinesArrowEmoji} **Record ID:** \`${record.id}\``,
      `${guidelinesArrowEmoji} **Department:** ${record.department}`,
      `${guidelinesArrowEmoji} **Officer:** ${officer}`,
      `${guidelinesArrowEmoji} **Owner/Civilian:** ${owner}`,
      `${guidelinesArrowEmoji} **Vehicle:** ${record.vehicleColor} ${record.vehicleModel}`,
      `${guidelinesArrowEmoji} **Plate:** ${record.vehiclePlate}`,
      `${guidelinesArrowEmoji} **Amount Due:** ${formatMoney(record.totalAmountDue)}`,
      `${guidelinesArrowEmoji} **Location:** ${record.location}`,
      `${guidelinesArrowEmoji} **Arrestations:** ${record.arrestations}`,
      `${guidelinesArrowEmoji} **Notes:** ${record.additionalNotes || "No extra notes."}`,
      `${guidelinesArrowEmoji} **Signature:** ${record.recipientSignature || "Not signed"}`
    ].join("\n"));
}

module.exports = {
  baseEmbed,
  setupEmbed,
  ticketPanelEmbed,
  ticketOpenedEmbed,
  sessionStartEmbed,
  sessionSetupEmbed,
  earlyAccessEmbed,
  sessionReleaseEmbed,
  reInvitesEmbed,
  sessionEndEmbed,
  sessionTerminatedEmbed,
  sessionCohostEmbed,
  sessionSupervisingEmbed,
  roleplayOneBannerEmbed,
  roleplayOneStartupEmbed,
  roleplayOneInfoEmbed,
  guidelinesBannerEmbed,
  guidelinesIntroEmbed,
  guidelinesRulesEmbed,
  guidelinesResourcesEmbed,
  leaveOfAbsenceEmbed,
  boostNotificationEmbed,
  contributorEmbed,
  welcomeBannerEmbed,
  welcomeInfoEmbed,
  memberWelcomeEmbed,
  quotaLoggedEmbed,
  quotaLeaderboardEmbed,
  quotaInfoEmbed,
  staffStrikeDmEmbed,
  balanceEmbed,
  citationIssuedEmbed,
  citationPaidEmbed,
  psRecordEmbed,
  modLogEmbed
};
