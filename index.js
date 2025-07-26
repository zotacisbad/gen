const { Client, GatewayIntentBits, SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');
const express = require('express');
const fs = require('fs');
const path = require('path');

// Initialize Discord client with required intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
  ],
});

// Authorized user ID
const AUTHORIZED_USER = '1370374701318410290';

// In-memory storage for categories and accounts
const categories = [
  'roblox', 'paypal', 'onlyfans', 'steam', 'crunchyroll', 'supercell',
  'netflix', 'spotify', 'amazon', 'discord', 'fortnite', 'minecraft', 'UHQ',
];
const accounts = {
  roblox: [], paypal: [], onlyfans: [], steam: [], crunchyroll: [], supercell: [],
  netflix: [], spotify: [], amazon: [], discord: [], fortnite: [], minecraft: [], UHQ: []
};

// Set up Express for health check
const app = express();
const port = process.env.PORT || 10000;
app.get('/health', (req, res) => {
  res.status(200).send(`Bot is running. Discord client status: ${client.isReady() ? 'Online' : 'Offline'}`);
});
app.listen(port, () => {
  console.log(`Health check server running on port ${port}`);
});

// Helper function to send logs to your DM
async function sendLogToDM(userId, message) {
  try {
    if (!client.isReady()) {
      console.error('Cannot send DM: Bot is not logged in.');
      return;
    }
    const user = await client.users.fetch(userId);
    await user.send(message);
  } catch (error) {
    console.error('Failed to send DM log:', error.message);
  }
}

// Helper function to parse text file based on category
function parseAccountFile(content, category) {
  const lines = content.split('\n').filter(line => line.trim());
  const parsedAccounts = [];
  for (const line of lines) {
    if (category === 'roblox') {
      if (line.includes('URL:') || line.includes('Username:')) continue;
      const [username, password] = line.split(':');
      if (username && password) parsedAccounts.push({ username, password });
    } else if (category === 'paypal') {
      const [email, rest] = line.split(':');
      const [password, balance] = rest.split(' — ');
      if (email && password) parsedAccounts.push({ email, password, balance: balance || '0' });
    } else if (category === 'crunchyroll') {
      const [email, rest] = line.split(':');
      const [password, details] = rest.split(' | ');
      if (email && password) parsedAccounts.push({ email, password, details: details || '' });
    } else if (category === 'supercell') {
      const [email, rest] = line.split(':');
      const [password, details] = rest.split(' | ');
      if (email && password) parsedAccounts.push({ email, password, details: details || '' });
    } else if (category === 'netflix') {
      const [email, rest] = line.split(':');
      const [password, plan] = rest.split(' | ');
      if (email && password) parsedAccounts.push({ email, password, plan: plan || 'standard' });
    } else if (category === 'spotify') {
      const [email, password] = line.split(':');
      if (email && password) parsedAccounts.push({ email, password });
    } else if (category === 'amazon') {
      const [email, rest] = line.split(':');
      const [password, balance] = rest.split(' | ');
      if (email && password) parsedAccounts.push({ email, password, balance: balance || '0' });
    } else if (category === 'discord') {
      const [email, password] = line.split(':');
      if (email && password) parsedAccounts.push({ email, password });
    } else if (category === 'fortnite') {
      const [username, password] = line.split(':');
      if (username && password) parsedAccounts.push({ username, password });
    } else if (category === 'minecraft') {
      const [username, password] = line.split(':');
      if (username && password) parsedAccounts.push({ username, password });
    } else {
      parsedAccounts.push({ raw: line });
    }
  }
  return parsedAccounts;
}

// Helper function to generate an account
function generateAccount(category) {
  if (accounts[category].length === 0) return 'No accounts available in this category.';
  const account = accounts[category].shift();
  return JSON.stringify(account, null, 2);
}

// Create slash commands
client.on('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);
  const commands = [
    new SlashCommandBuilder()
      .setName('restock')
      .setDescription('Restock accounts for a category')
      .setDefaultMemberPermissions(0),
    new SlashCommandBuilder()
      .setName('stock')
      .setDescription('Check account stock for all categories'),
    new SlashCommandBuilder()
      .setName('generate')
      .setDescription('Generate an account from a category'),
    new SlashCommandBuilder()
      .setName('panel')
      .setDescription('Create a generation panel in a channel')
      .setDefaultMemberPermissions(0),
  ];
  try {
    await client.application.commands.set(commands);
    console.log('Slash commands registered.');
    await sendLogToDM(AUTHORIZED_USER, `Bot started successfully as ${client.user.tag} at ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })}.`);
  } catch (error) {
    console.error('Failed to register commands:', error.message);
    await sendLogToDM(AUTHORIZED_USER, `Error registering commands: ${error.message}`);
  }
});

// Handle interactions
client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand() && !interaction.isStringSelectMenu() && !interaction.isButton()) return;

  const { user } = interaction;

  if (interaction.isCommand()) {
    const { commandName } = interaction;

    if (commandName === 'restock') {
      if (user.id !== AUTHORIZED_USER) {
        await interaction.reply({ content: 'You are not authorized to use this command.', ephemeral: true });
        return;
      }
      const row = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('select_category_restock')
          .setPlaceholder('Select a category')
          .addOptions(categories.map(cat => ({ label: cat, value: cat })))
      );
      await interaction.reply({ content: 'Please select a category to restock:', components: [row], ephemeral: true });
      await sendLogToDM(AUTHORIZED_USER, `${user.tag} initiated /restock command at ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })}.`);
    } else if (commandName === 'stock') {
      const stockList = categories.map(cat => `${cat}: ${accounts[cat].length} accounts`).join('\n');
      await interaction.reply({ content: `**Current Stock:**\n${stockList || 'No accounts available.'}`, ephemeral: true });
      await sendLogToDM(AUTHORIZED_USER, `${user.tag} used /stock command at ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })}.\nOutput:\n${stockList}`);
    } else if (commandName === 'generate') {
      const row = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('generate_category')
          .setPlaceholder('Select a category')
          .addOptions(categories.map(cat => ({ label: cat, value: cat })))
      );
      await interaction.reply({ content: 'Please select a category to generate an account:', components: [row], ephemeral: true });
      await sendLogToDM(AUTHORIZED_USER, `${user.tag} initiated /generate command at ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })}.`);
    } else if (commandName === 'panel') {
      if (user.id !== AUTHORIZED_USER) {
        await interaction.reply({ content: 'You are not authorized to use this command.', ephemeral: true });
        return;
      }
      const channels = interaction.guild.channels.cache
        .filter(ch => ch.type === ChannelType.GuildText)
        .map(ch => ({ label: ch.name, value: ch.id }));
      const row = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('select_channel_panel')
          .setPlaceholder('Select a channel')
          .addOptions(channels)
      );
      await interaction.reply({ content: 'Please select a channel for the generation panel:', components: [row], ephemeral: true });
      await sendLogToDM(AUTHORIZED_USER, `${user.tag} initiated /panel command at ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })}.`);
    }
  } else if (interaction.isStringSelectMenu()) {
    const { customId, values } = interaction;
    if (customId === 'select_category_restock') {
      if (user.id !== AUTHORIZED_USER) {
        await interaction.reply({ content: 'You are not authorized to perform this action.', ephemeral: true });
        return;
      }
      const category = values[0];
      await interaction.reply({ content: `Please upload a text file for ${category}.`, ephemeral: true });
      const filter = m => m.author.id === user.id && m.attachments.size > 0;
      const collector = interaction.channel.createMessageCollector({ filter, time: 60000, max: 1 });

      collector.on('collect', async m => {
        const attachment = m.attachments.first();
        if (!attachment.name.endsWith('.txt')) {
          await m.reply({ content: 'Please upload a .txt file.', ephemeral: true });
          await sendLogToDM(AUTHORIZED_USER, `${user.tag} uploaded invalid file for ${category} restock at ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })}.`);
          return;
        }
        try {
          const response = await fetch(attachment.url);
          const text = await response.text();
          const parsed = parseAccountFile(text, category);
          accounts[category].push(...parsed);
          await m.reply({ content: `Successfully restocked ${parsed.length} accounts for ${category}.`, ephemeral: true });
          await sendLogToDM(AUTHORIZED_USER, `${user.tag} restocked ${parsed.length} accounts for ${category} at ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })}.`);
        } catch (error) {
          await m.reply({ content: 'Error processing the file. Please try again.', ephemeral: true });
          await sendLogToDM(AUTHORIZED_USER, `${user.tag} encountered error restocking ${category}: ${error.message}`);
        }
      });

      collector.on('end', collected => {
        if (!collected.size) {
          interaction.followUp({ content: 'No file uploaded in time.', ephemeral: true });
          sendLogToDM(AUTHORIZED_USER, `${user.tag} failed to upload a file for ${category} restock in time at ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })}.`);
        }
      });
    } else if (customId === 'generate_category' || customId === 'panel_generate') {
      const category = values[0];
      const account = generateAccount(category);
      await interaction.reply({ content: `**Generated Account (${category}):**\n\`\`\`json\n${account}\n\`\`\``, ephemeral: true });
      await sendLogToDM(AUTHORIZED_USER, `${user.tag} generated an account from ${category} at ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })}: ${account}`);
    } else if (customId === 'select_channel_panel') {
      if (user.id !== AUTHORIZED_USER) {
        await interaction.reply({ content: 'You are not authorized to perform this action.', ephemeral: true });
        return;
      }
      const channelId = values[0];
      const channel = interaction.guild.channels.cache.get(channelId);
      if (!channel) {
        await interaction.reply({ content: 'Invalid channel selected.', ephemeral: true });
        await sendLogToDM(AUTHORIZED_USER, `${user.tag} selected an invalid channel for /panel at ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })}.`);
        return;
      }

      const generateMenu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('panel_generate')
          .setPlaceholder('Generate an Account')
          .addOptions(categories.map(cat => ({ label: cat, value: cat })))
      );

      const stockButton = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('panel_stock')
          .setLabel('Stock')
          .setStyle(ButtonStyle.Primary)
      );

      const helpButton = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('panel_help')
          .setLabel('Help')
          .setStyle(ButtonStyle.Secondary)
      );

      try {
        await channel.send({
          content: '**Account Generator Panel**\nUse the dropdown to generate an account, or click the buttons below for stock or help.',
          components: [generateMenu, stockButton, helpButton],
        });
        await interaction.reply({ content: `Generation panel created in ${channel.name}.`, ephemeral: true });
        await sendLogToDM(AUTHORIZED_USER, `${user.tag} created a generation panel in ${channel.name} at ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })}.`);
      } catch (error) {
        await interaction.reply({ content: 'Error creating panel. Check bot permissions.', ephemeral: true });
        await sendLogToDM(AUTHORIZED_USER, `${user.tag} failed to create panel in ${channel.name}: ${error.message}`);
      }
    }
  } else if (interaction.isButton()) {
    const { customId } = interaction;
    if (customId === 'panel_stock') {
      const stockList = categories.map(cat => `${cat}: ${accounts[cat].length} accounts`).join('\n');
      await interaction.reply({ content: `**Current Stock:**\n${stockList || 'No accounts available.'}`, ephemeral: true });
      await sendLogToDM(AUTHORIZED_USER, `${user.tag} checked stock via panel at ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })}: ${stockList}`);
    } else if (customId === 'panel_help') {
      const helpMessage = `**Account Generator Help**
- **Generate an Account**: Use the dropdown to select a category and receive account details.
- **/restock**: (Admin only) Upload a text file to restock accounts for a category.
- **/stock**: View the number of accounts in each category.
- **/generate**: Generate an account directly via command.
- **/panel**: (Admin only) Create a panel like this one in a chosen channel.
Contact the bot owner for issues.`;
      await interaction.reply({ content: helpMessage, ephemeral: true });
      await sendLogToDM(AUTHORIZED_USER, `${user.tag} viewed help via panel at ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })}.`);
    }
  }
});

// Check for token and login
const TOKEN = process.env.TOKEN;
if (!TOKEN) {
  console.error('Error: TOKEN environment variable is not set.');
  process.exit(1);
}
client.login(TOKEN).catch(async error => {
  console.error('Failed to login:', error.message);
  await sendLogToDM(AUTHORIZED_USER, `Bot failed to login: ${error.message}`);
});
