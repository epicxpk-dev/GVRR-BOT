const {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionFlagsBits,
  StringSelectMenuBuilder
} = require("discord.js");
const { closedTicketsChannelId, developerRoleId, highCommandRoleId, ticketTypes } = require("./config");
const { getGuildSettings } = require("./storage");
const { ticketOpenedEmbed } = require("./embeds");

function ticketButtons() {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("ticket:create")
      .setPlaceholder("Select a ticket category...")
      .addOptions(
        Object.entries(ticketTypes).map(([id, type]) => ({
          label: type.label,
          description: type.description,
          value: id,
          emoji: type.emoji
        }))
      )
  );
}

function ticketActionButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("ticket:claim")
      .setLabel("Claim Ticket")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId("ticket:unclaim")
      .setLabel("Unclaim Ticket")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("ticket:close")
      .setLabel("Close Ticket")
      .setStyle(ButtonStyle.Danger)
  );
}

async function handleTicketButton(interaction) {
  if (interaction.isStringSelectMenu() && interaction.customId === "ticket:create") {
    await createTicket(interaction, interaction.values[0]);
    return;
  }

  const [, action, typeId] = interaction.customId.split(":");

  if (action === "create") {
    await createTicket(interaction, typeId);
    return;
  }

  if (action === "claim") {
    await claimTicket(interaction);
    return;
  }

  if (action === "unclaim") {
    await unclaimTicket(interaction);
    return;
  }

  if (action === "close") {
    await closeTicket(interaction);
  }
}

async function createTicket(interaction, typeId) {
  const settings = getGuildSettings(interaction.guildId);
  const type = ticketTypes[typeId];

  if (!type) {
    await interaction.reply({ content: "That ticket type no longer exists.", ephemeral: true });
    return;
  }

  const staffRoleId = settings.staffRoleId || developerRoleId;
  const supportRoleId = typeId === "staff_report" ? highCommandRoleId : staffRoleId;

  if (!settings.ticketCategoryId || !supportRoleId) {
    await interaction.reply({
      content: "Tickets are not fully set up yet. Run `/setup channels` first.",
      ephemeral: true
    });
    return;
  }

  const safeName = `${type.label}-${interaction.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, "-").slice(0, 90);
  const channel = await interaction.guild.channels.create({
    name: safeName,
    type: ChannelType.GuildText,
    parent: settings.ticketCategoryId,
    topic: `owner=${interaction.user.id};type=${typeId};claimed=none`,
    permissionOverwrites: [
      {
        id: interaction.guild.roles.everyone.id,
        deny: [PermissionFlagsBits.ViewChannel]
      },
      {
        id: interaction.user.id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
      },
      {
        id: supportRoleId,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
      },
      {
        id: highCommandRoleId,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
      },
      {
        id: developerRoleId,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
      }
    ]
  });

  const mentionRoles = [...new Set([supportRoleId, highCommandRoleId, developerRoleId])];
  await channel.send({
    content: `<@${interaction.user.id}> ${mentionRoles.map((roleId) => `<@&${roleId}>`).join(" ")}`,
    embeds: [ticketOpenedEmbed({ typeLabel: type.label })],
    components: [ticketActionButtons()],
    allowedMentions: { users: [interaction.user.id], roles: mentionRoles }
  });

  await interaction.reply({ content: `Your ticket has been opened: ${channel}`, ephemeral: true });
}

function parseTicketTopic(topic = "") {
  return Object.fromEntries(
    topic.split(";")
      .map((part) => part.split("="))
      .filter(([key, value]) => key && value)
      .map(([key, value]) => [key.trim(), value.trim()])
  );
}

async function claimTicket(interaction) {
  const settings = getGuildSettings(interaction.guildId);
  const staffRoleId = settings.staffRoleId || developerRoleId;
  const ticket = parseTicketTopic(interaction.channel.topic);
  const canClaim = interaction.member.roles.cache.has(staffRoleId)
    || interaction.member.roles.cache.has(highCommandRoleId)
    || interaction.member.roles.cache.has(developerRoleId)
    || interaction.memberPermissions.has(PermissionFlagsBits.ManageChannels);

  if (!ticket.owner || !ticket.type) {
    await interaction.reply({ content: "This does not look like a ticket channel.", ephemeral: true });
    return;
  }

  if (!canClaim) {
    await interaction.reply({ content: "Only staff can claim tickets.", ephemeral: true });
    return;
  }

  if (ticket.claimed && ticket.claimed !== "none") {
    await interaction.reply({ content: `This ticket is already claimed by <@${ticket.claimed}>.`, ephemeral: true });
    return;
  }

  await interaction.channel.permissionOverwrites.edit(interaction.user.id, {
    ViewChannel: true,
    SendMessages: true,
    ReadMessageHistory: true
  });

  if (settings.staffRoleId && settings.staffRoleId !== highCommandRoleId && settings.staffRoleId !== developerRoleId) {
    await interaction.channel.permissionOverwrites.edit(settings.staffRoleId, {
      ViewChannel: false
    }).catch(console.error);
  }

  await interaction.channel.setTopic(`owner=${ticket.owner};type=${ticket.type};claimed=${interaction.user.id}`);
  await interaction.reply(`${interaction.user} has claimed this ticket.`);
}

async function unclaimTicket(interaction) {
  const settings = getGuildSettings(interaction.guildId);
  const ticket = parseTicketTopic(interaction.channel.topic);
  const canUnclaim = ticket.claimed === interaction.user.id
    || interaction.member.roles.cache.has(highCommandRoleId)
    || interaction.member.roles.cache.has(developerRoleId)
    || interaction.memberPermissions.has(PermissionFlagsBits.ManageChannels);

  if (!ticket.owner || !ticket.type) {
    await interaction.reply({ content: "This does not look like a ticket channel.", ephemeral: true });
    return;
  }

  if (!ticket.claimed || ticket.claimed === "none") {
    await interaction.reply({ content: "This ticket is not currently claimed.", ephemeral: true });
    return;
  }

  if (!canUnclaim) {
    await interaction.reply({ content: "Only the claimer, High Command, or management can unclaim this ticket.", ephemeral: true });
    return;
  }

  if (settings.staffRoleId && ticket.type !== "staff_report") {
    await interaction.channel.permissionOverwrites.edit(settings.staffRoleId, {
      ViewChannel: true,
      SendMessages: true,
      ReadMessageHistory: true
    }).catch(console.error);
  }

  await interaction.channel.setTopic(`owner=${ticket.owner};type=${ticket.type};claimed=none`);
  await interaction.reply(`${interaction.user} has unclaimed this ticket.`);
}

async function closeTicket(interaction) {
  const settings = getGuildSettings(interaction.guildId);
  const staffRoleId = settings.staffRoleId || developerRoleId;
  const canClose = interaction.member.roles.cache.has(staffRoleId)
    || interaction.member.roles.cache.has(highCommandRoleId)
    || interaction.member.roles.cache.has(developerRoleId)
    || interaction.memberPermissions.has(PermissionFlagsBits.ManageChannels);

  if (!canClose) {
    await interaction.reply({ content: "Only staff can close tickets.", ephemeral: true });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  const messages = await interaction.channel.messages.fetch({ limit: 100 });
  const lines = messages
    .sort((a, b) => a.createdTimestamp - b.createdTimestamp)
    .map((message) => `[${message.createdAt.toISOString()}] ${message.author.tag}: ${message.cleanContent || "(embed/attachment)"}`);
  lines.unshift(`Ticket closed by ${interaction.user.tag} (${interaction.user.id}) at ${new Date().toISOString()}`);

  const transcript = Buffer.from(lines.join("\n"), "utf8");
  const attachment = new AttachmentBuilder(transcript, {
    name: `${interaction.channel.name}-transcript.txt`
  });

  const transcriptChannelId = settings.transcriptChannelId || closedTicketsChannelId;
  if (transcriptChannelId) {
    const transcriptChannel = await interaction.client.channels.fetch(transcriptChannelId);
    await transcriptChannel.send({
      content: `Transcript for ${interaction.channel.name}\nClosed by: ${interaction.user} (${interaction.user.tag})`,
      files: [attachment]
    });
  }

  await interaction.editReply("Ticket closed. This channel will be deleted in 5 seconds.");
  setTimeout(() => {
    interaction.channel.delete(`Ticket closed by ${interaction.user.tag}`).catch(console.error);
  }, 5000);
}

module.exports = {
  ticketButtons,
  handleTicketButton
};
