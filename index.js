import { kpoloversGuildInfo } from "./kpolovers_info";

require("dotenv").config();
const { executeCommand, setLiputonTimers } = require("./commands.ts");
const { executeHelpCommand } = require("./help_commands.ts");
//const today = new Date();
//const ERRORLOG_FILE = `C:\\temp\\dcbot\\error_${today.getDate()}${today.getMonth()}${today.getFullYear()}.txt`;

// discord-setit

const { Events, Client, GatewayIntentBits } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.on(Events.ClientReady, async (c) => {
  console.log(`Logged in as ${c.user.tag}.`);

  const kpolovers = await c.guilds.fetch(kpoloversGuildInfo.id);

  const sandboxChannelId = kpoloversGuildInfo.channels.find(
    (x) => x.estimatedName === "sandbox"
  ).id;

  const zumpebotChannelId = kpoloversGuildInfo.channels.find(
    (x) => x.estimatedName === "zumpebot"
  )?.id;

  if (zumpebotChannelId) {
    const zumpebotChannel = await kpolovers.channels.fetch(zumpebotChannelId);
    setLiputonTimers(zumpebotChannel);
  }

  const sandboxChannel = await kpolovers.channels.fetch(sandboxChannelId);

  sandboxChannel.send("Listening sandbox...");
});

client.on(Events.MessageCreate, async (msg) => {
  const prefix = msg.content.substring(0, 1);

  if (prefix !== "!" && prefix !== "-") return;

  try {
    if (msg.content.includes("!help") || msg.content.includes("-help"))
      executeHelpCommand(msg);

    await executeCommand(msg, prefix);
  } catch (e) {
    //await fs.writeJSON(ERRORLOG_FILE, e.msg);
    console.error(e);
    msg.channel.send("Unknown error!");
  }
});

// eslint-disable-next-line no-undef
client.login(process.env.CLIENT_TOKEN);
