import "dotenv/config";

import { Client, GatewayIntentBits } from "discord.js";
import { handleMemberJoin } from "./events/memberJoin";
import { handleMessageCreate } from "./events/messageCreate";
import { createClient } from "redis";
import { inactivityJob } from "./cron/inactivity";
import { handleAntiLinkDiscussions } from "./utils/antiLinkDiscussions";

export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMessages,
  ],
});

export const redisClient = createClient({
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT!),
  },
});

redisClient.on("error", (err) => {
  console.log("Redis error: " + err);
});
redisClient.on("ready", () => {
  console.log("Redis ready");
});

void redisClient.connect();

const BOT_TOKEN = process.env.BOT_TOKEN;

client.on("ready", () => {
  console.log(`Logged in as ${client.user?.tag}`);
});

client.on("guildMemberAdd", async (...params) => {
  try {
    await handleMemberJoin(...params);
  } catch (err) {
    console.log(err);
  }
});
client.on("messageCreate", async (msg) => {
  try {
    await handleMessageCreate(msg, client);
    await handleAntiLinkDiscussions(msg);
  } catch (err) {
    console.log(err);
  }
});

inactivityJob.start();

void client.login(BOT_TOKEN);
