const { Client, GatewayIntentBits, SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, ChannelType, EmbedBuilder } = require('discord.js');
const express = require('express');
const fs = require('fs').promises;
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
  'netflix', 'spotify', 'amazon', 'discord', 'fortnite', 'minecraft',
  'UHQ', 'Linkden', 'Ubisoft', 'Playstation', 'Activision', 'Xbox',
  'riotgames', 'tradingview', 'creditcards'
];
let accounts = {};

async function loadStock() {
  const stockFile = path.join(__dirname, 'stock.json');
  try {
    const data = await fs.readFile(stockFile, 'utf8');
    accounts = JSON.parse(data);
    categories.forEach(cat => {
      if (!accounts[cat]) accounts[cat] = [];
    });
  } catch (error) {
    console.log('No stock file found or error loading, initializing empty accounts:', error.message);
    accounts = Object.fromEntries(categories.map(cat => [cat, []]));
    await saveStock();
  }
}

async function saveStock() {
  const stockFile = path.join(__dirname, 'stock.json');
  try {
    await fs.writeFile(stockFile, JSON.stringify(accounts, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving stock:', error.message);
  }
}

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
    } else if (category === 'UHQ') {
      const [username, password] = line.split(':');
      if (username && password) parsedAccounts.push({ username, password });
    } else if (category === 'Linkden') {
      const [email, password] = line.split(':');
      if (email && password) parsedAccounts.push({ email, password });
    } else if (category === 'Ubisoft') {
      const [username, password] = line.split(':');
      if (username && password) parsedAccounts.push({ username, password });
    } else if (category === 'Playstation') {
      const [email, password] = line.split(':');
      if (email && password) parsedAccounts.push({ email, password });
    } else if (category === 'Activision') {
      const [username, password] = line.split(':');
      if (username && password) parsedAccounts.push({ username, password });
    } else if (category === 'Xbox') {
      const [email, password] = line.split(':');
      if (email && password) parsedAccounts.push({ email, password });
    } else if (category === 'riotgames') {
      const [username, password] = line.split(':');
      if (username && password) parsedAccounts.push({ username, password });
    } else if (category === 'tradingview') {
      const [email, password] = line.split(':');
      if (email && password) parsedAccounts.push({ email, password });
    } else if (category === 'creditcards') {
      const parts = line.split(' | ');
      const account = {};
      for (const part of parts) {
        const [key, value] = part.split(' = ');
        if (key === 'card_no') {
          account[key] = value.split(', ').map(num => num.trim());
        } else if (key && value) {
          account[key] = value;
        }
      }
      if (account.first_name && account.last_name && account.card_no) {
        parsedAccounts.push(account);
      }
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
  saveStock();
  return JSON.stringify(account, null, 2);
}

// Create slash commands
client.on('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);
  await loadStock();
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

  const { user, channel } = interaction;

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
          .setPlaceholder('Select a category (optional)')
          .addOptions(categories.map(cat => ({ label: cat.charAt(0).toUpperCase() + cat.slice(1), value: cat })))
      );
      await interaction.reply({ content: 'Upload one or more text files (e.g., paypal.txt) to restock. Select a category to filter, or leave blank for auto-detection:', components: [row], ephemeral: true });
      await sendLogToDM(AUTHORIZED_USER, `${user.tag} initiated /restock command at ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })}.`);
    } else if (commandName === 'stock') {
      const stockList = categories.map(cat => `${cat.charAt(0).toUpperCase() + cat.slice(1)}: ${accounts[cat].length} accounts`).join('\n');
      await interaction.reply({ content: `**Current Stock:**\n${stockList || 'No accounts available.'}`, ephemeral: true });
      await sendLogToDM(AUTHORIZED_USER, `${user.tag} used /stock command at ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })}.\nOutput:\n${stockList}`);
    } else if (commandName === 'generate') {
      const row = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('generate_category')
          .setPlaceholder('Select a category')
          .addOptions(categories.map(cat => ({ label: cat.charAt(0).toUpperCase() + cat.slice(1), value: cat })))
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
      const selectedCategory = values[0] || null;
      await interaction.reply({ content: `Please upload one or more text files (e.g., ${selectedCategory || 'any_category'}.txt) to restock ${selectedCategory ? selectedCategory : 'all matching categories'}:`, ephemeral: true });
      const filter = m => m.author.id === user.id && m.attachments.size > 0;
      const collector = interaction.channel.createMessageCollector({ filter, time: 60000, max: 1 });

      collector.on('collect', async m => {
        const attachments = m.attachments;
        let totalAdded = 0;
        const processedFiles = new Set();

        for (const attachment of attachments.values()) {
          if (!attachment.name.endsWith('.txt')) {
            await m.reply({ content: `Skipping ${attachment.name}: Not a .txt file.`, ephemeral: true });
            continue;
          }
          if (processedFiles.has(attachment.name)) {
            await m.reply({ content: `Skipping duplicate file ${attachment.name}.`, ephemeral: true });
            continue;
          }
          processedFiles.add(attachment.name);

          try {
            const response = await fetch(attachment.url);
            const text = await response.text();
            const fileCategory = attachment.name.replace('.txt', '').toLowerCase();
            if (categories.includes(fileCategory)) {
              if (!selectedCategory || fileCategory === selectedCategory) {
                const parsed = parseAccountFile(text, fileCategory);
                accounts[fileCategory].push(...parsed);
                totalAdded += parsed.length;
                await saveStock();
              } else {
                await m.reply({ content: `${attachment.name} skipped: Does not match selected category ${selectedCategory}.`, ephemeral: true });
              }
            } else {
              await m.reply({ content: `${attachment.name} filename does not match a valid category.`, ephemeral: true });
            }
          } catch (error) {
            await m.reply({ content: `Error processing ${attachment.name}: ${error.message}`, ephemeral: true });
          }
        }
        if (totalAdded > 0) {
          await m.reply({ content: `Successfully restocked ${totalAdded} accounts across uploaded files.`, ephemeral: true });
          await sendLogToDM(AUTHORIZED_USER, `${user.tag} restocked ${totalAdded} accounts at ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })}.`);
        } else {
          await m.reply({ content: 'No valid accounts were restocked.', ephemeral: true });
        }
      });

      collector.on('end', collected => {
        if (!collected.size) {
          interaction.followUp({ content: 'No files uploaded in time.', ephemeral: true });
          sendLogToDM(AUTHORIZED_USER, `${user.tag} failed to upload files for restock in time at ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })}.`);
        }
      });
    } else if (customId === 'generate_category' || customId === 'panel_generate') {
      const category = values[0];
      const account = generateAccount(category);
      if (account !== 'No accounts available in this category.') {
        await user.send(`**Generated ${category.toUpperCase()} Account:**\n\`\`\`json\n${account}\n\`\`\``);
        await channel.send(`@${user.tag} A ${category} account has been sent to your DMs`);
        await sendLogToDM(AUTHORIZED_USER, `${user.tag} generated an account from ${category} at ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })}: ${account}`);
      } else {
        await interaction.reply({ content: account, ephemeral: true });
      }
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
          .setPlaceholder('Select a Category')
          .setMaxValues(1)
          .addOptions(categories.map(cat => ({ label: cat.charAt(0).toUpperCase() + cat.slice(1), value: cat })))
      );

      const actionRow1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('panel_stock')
          .setLabel('View Stock')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('panel_refresh')
          .setLabel('Refresh Stock')
          .setStyle(ButtonStyle.Secondary)
      );

      const actionRow2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('panel_help')
          .setLabel('Help')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('panel_clear')
          .setLabel('Clear Logs')
          .setStyle(ButtonStyle.Danger)
      );

      const embed = new EmbedBuilder()
        .setTitle('Account Generator Panel')
        .setDescription('Welcome to the enhanced account generator! Use the dropdown to generate an account or click the buttons below for additional actions.')
        .addFields(
          { name: 'Categories', value: categories.map(c => c.charAt(0).toUpperCase() + c.slice(1)).join(', '), inline: true },
          { name: 'Stock Status', value: 'Click "View Stock" to check availability.', inline: true }
        )
        .setColor('#00ff00')
        .setThumbnail('https://i.imgur.com/AfFp7pu.png') // Placeholder image URL
        .setTimestamp()
        .setFooter({ text: 'Powered by Your Bot', iconURL: 'https://i.imgur.com/AfFp7pu.png' });

      try {
        await channel.send({ embeds: [embed], components: [generateMenu, actionRow1, actionRow2] });
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
      const stockList = categories.map(cat => `${cat.charAt(0).toUpperCase() + cat.slice(1)}: ${accounts[cat].length} accounts`).join('\n');
      await interaction.reply({ content: `**Current Stock:**\n${stockList || 'No accounts available.'}`, ephemeral: true });
      await sendLogToDM(AUTHORIZED_USER, `${interaction.user.tag} checked stock via panel at ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })}: ${stockList}`);
    } else if (customId === 'panel_refresh') {
      await interaction.reply({ content: 'Stock refreshed. Use "View Stock" to check the latest counts.', ephemeral: true });
      await sendLogToDM(AUTHORIZED_USER, `${interaction.user.tag} refreshed stock via panel at ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })}.`);
    } else if (customId === 'panel_help') {
      const helpMessage = `**Account Generator Help**
- **Generate an Account**: Use the dropdown to select a category and receive account details in DMs.
- **/restock**: (Admin only) Upload text files (e.g., paypal.txt) to restock categories.
- **/stock**: View the number of accounts in each category.
- **/generate**: Generate an account directly via command.
- **/panel**: (Admin only) Create a panel like this one in a chosen channel.
- **Buttons**: View Stock, Refresh Stock, Help, Clear Logs (admin only).
Contact the bot owner for issues.`;
      await interaction.reply({ content: helpMessage, ephemeral: true });
      await sendLogToDM(AUTHORIZED_USER, `${interaction.user.tag} viewed help via panel at ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })}.`);
    } else if (customId === 'panel_clear' && user.id === AUTHORIZED_USER) {
      categories.forEach(cat => accounts[cat] = []);
      await saveStock();
      await interaction.reply({ content: 'All account stocks have been cleared.', ephemeral: true });
      await sendLogToDM(AUTHORIZED_USER, `${interaction.user.tag} cleared all account stocks via panel at ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })}.`);
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

client.on('ready', () => {
  console.log('Bot is fully ready and stock is loaded.');
});
