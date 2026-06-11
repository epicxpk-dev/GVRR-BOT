require("dotenv").config();

const { REST, Routes } = require("discord.js");
const { loadCommands } = require("./command-loader");

const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env;

if (!DISCORD_TOKEN || !CLIENT_ID || !GUILD_ID) {
  console.error("Missing DISCORD_TOKEN, CLIENT_ID, or GUILD_ID in .env");
  process.exit(1);
}

const commands = [...loadCommands().values()].map((command) => command.data.toJSON());
const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);

(async () => {
  try {
    console.log(`Registering ${commands.length} slash commands...`);
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
    console.log("Slash commands registered.");
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
