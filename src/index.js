require("dotenv").config();

const {
  ActivityType,
  Client,
  Collection,
  GatewayIntentBits,
  Partials
} = require("discord.js");
const { loadCommands } = require("./command-loader");
const { handleOwnerPing } = require("./anti-ping");
const { handleBoostMessage, handleMemberBoostUpdate } = require("./boost-rewards");
const { handleLeaveOfAbsenceButton } = require("./loa");
const { handlePresenceUpdate } = require("./representative");
const { handleReaction, handleSessionButton } = require("./sessions");
const { handleTicketButton } = require("./tickets");
const { handleGuildMemberAdd } = require("./welcome");

if (!process.env.DISCORD_TOKEN) {
  console.error("Missing DISCORD_TOKEN in .env");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildPresences
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

client.commands = new Collection(loadCommands());

client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}`);
  await updatePresence(client);
  setInterval(() => updatePresence(client).catch(console.error), 10 * 60 * 1000);
});

client.on("interactionCreate", async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      await command.execute(interaction);
      return;
    }

    if ((interaction.isButton() && interaction.customId.startsWith("ticket:")) || (interaction.isStringSelectMenu() && interaction.customId.startsWith("ticket:"))) {
      await handleTicketButton(interaction);
      return;
    }

    if (interaction.isButton() && interaction.customId.startsWith("session:")) {
      await handleSessionButton(interaction);
      return;
    }

    if (interaction.isButton() && interaction.customId.startsWith("loa:")) {
      await handleLeaveOfAbsenceButton(interaction);
    }
  } catch (error) {
    console.error(error);
    const message = "Something went wrong while running that action.";
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp({ content: message, ephemeral: true });
    } else {
      await interaction.reply({ content: message, ephemeral: true });
    }
  }
});

client.on("messageReactionAdd", async (reaction, user) => {
  try {
    await handleReaction(reaction, user);
  } catch (error) {
    console.error(error);
  }
});

client.on("messageCreate", async (message) => {
  try {
    await handleBoostMessage(message);
    await handleOwnerPing(message);
  } catch (error) {
    console.error(error);
  }
});

client.on("guildMemberUpdate", async (oldMember, newMember) => {
  try {
    await handleMemberBoostUpdate(oldMember, newMember);
  } catch (error) {
    console.error(error);
  }
});

client.on("presenceUpdate", async (oldPresence, newPresence) => {
  try {
    await handlePresenceUpdate(oldPresence, newPresence);
  } catch (error) {
    console.error(error);
  }
});

client.on("guildMemberAdd", async (member) => {
  try {
    await handleGuildMemberAdd(member);
  } catch (error) {
    console.error(error);
  }
});

client.login(process.env.DISCORD_TOKEN);

async function updatePresence(client) {
  const guildId = process.env.GUILD_ID;
  const guild = guildId ? await client.guilds.fetch(guildId).catch(() => null) : client.guilds.cache.first();
  const memberCount = guild?.memberCount;
  const statusText = memberCount
    ? `${memberCount.toLocaleString()} members in GVRR`
    : "Greenville Roleplay Rural";

  client.user.setPresence({
    activities: [{ name: statusText, type: ActivityType.Watching }],
    status: "online"
  });
}
