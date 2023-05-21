const fs = require('node:fs');
const path = require('node:path');
const jsdom = require('jsdom');
const { JSDOM } = jsdom
const { consoleColors } = require('../src/util/consoleColors.js')
const { fetchData } = require('./util/fetchData.js')

const { Client, GatewayIntentBits, Collection, Events, REST, Routes } = require('discord.js')
const { CLIENT_TOKEN, CLIENT_ID, REFRESH_DATA } = require('./config.json');

const client = new Client({ intents: GatewayIntentBits.Guilds })

global.DOMParser = new JSDOM().window.DOMParser

// Command Initialization
const commands = [];
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);

	commands.push(command.data.toJSON());

	if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command);
	} else {
		console.log(consoleColors.FG_RED + `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}


client.on(Events.ClientReady, async () => {
	console.log(consoleColors.FG_GREEN + 'Ready!')

	if (REFRESH_DATA) {
		try {
			await fetchData()
		}
		catch (err) {
			console.error(err);
			console.log(consoleColors.FG_RED + `Unable to fetch data!`);
		}
	}
})


client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
})


// Construct and prepare an instance of the REST module
const rest = new REST().setToken(CLIENT_TOKEN);

// and deploy your commands!
(async () => {
	try {
		console.log(consoleColors.FG_GRAY + `Started refreshing ${commands.length} application (/) commands.`);

		// The put method is used to fully refresh all commands in the guild with the current set
		await rest.put(
			Routes.applicationCommands(CLIENT_ID),
			{ body: commands },
		);

		console.log(consoleColors.FG_GRAY + `Successfully reloaded ${commands.length} application (/) commands.`);
	} catch (error) {
		// And of course, make sure you catch and log any errors!
		console.error(error);
	}
})();

client.login(CLIENT_TOKEN)