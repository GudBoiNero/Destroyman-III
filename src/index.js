const fs = require('node:fs');
const path = require('node:path');
const jsdom = require('jsdom');
const { JSDOM } = jsdom
const { consoleColors } = require('../src/util/consoleColors.js')
const { replaceAll, replaceAllInList } = require('../src/util/replaceAll.js')

const { Client, GatewayIntentBits, Collection, Events, REST, Routes } = require('discord.js')
const { CLIENT_TOKEN, CLIENT_ID } = require('./config.json');
const { GROUPING, REPLACEMENTS, REMOVE } = require('./parseConfig.json');

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

	try { await fetchData() }
	catch (err) {
		console.error(err);
		console.log(consoleColors.FG_RED + `Unable to fetch data!`);
	}
})


async function fetchData() {
	console.log(consoleColors.FG_MAGENTA + 'Fetching Spreadsheet...')

	const parsedData = {}
	const response = await fetch("https://docs.google.com/spreadsheets/d/1AKC_KhnCe44gtWmfI2cmKjvIDbTfC0ACfP15Z7UauvU/htmlview")

	if (!response.ok) { return console.error(response.statusText) }

	const html = await response.text()
	const parser = new DOMParser();
	const doc = parser.parseFromString(html, 'text/html');

	//#region sheet_collection
	console.log(consoleColors.FG_MAGENTA + 'Collecting Sheets...')
	const sheetsViewport = doc.getElementById('sheets-viewport').childNodes
	const sheets = (() => {
		const temp = []
		for (var i = 0, length = sheetsViewport.length; i < length; i++) {
			const id = sheetsViewport[i].id
			const sheetButton = doc.getElementById(`sheet-button-${id}`)

			temp.push({ 'name': sheetButton.textContent.toLowerCase(), 'id': id, 'element': doc.getElementById(id) })
		}
		return temp
	})()
	//#endregion

	//#region parse_data
	console.log(consoleColors.FG_MAGENTA + 'Parsing Data...')
	// Parse data in sheets and add to parsedData
	for (var sheetIndex = 0, sheetsLength = sheets.length; sheetIndex < sheetsLength; sheetIndex++) {
		const sheetData = sheets[sheetIndex]
		const sheet = sheetData.element
		const sheetContent = sheet.getElementsByClassName('waffle')[0].childNodes[1] // Grabs <tbody> of <table class="waffle"...>

		//console.log(consoleColors.FG_GRAY + `| Parsing '${sheetData.name.toLowerCase()}' Sheet...`)

		const data = []

		// Parse and grab content
		const rows = sheetContent.childNodes

		// Grab the key values for each column (Name, Reqs, etc)
		const keys = ((headers) => {
			const temp = []
			for (var headerIndex = 0, headerLength = headers.length; headerIndex < headerLength; headerIndex++) {
				let header = headers[headerIndex]

				if (header == headers[0]) continue; // Skip irrelevant header (1)

				header = header.textContent.toLowerCase()
				header = replaceAll(header, ' ', '_')

				temp.push(header)
			}
			return temp
		})(sheetData.name != "outfits" ? rows[0].childNodes : rows[1].childNodes) // Outfits tabs first row is not what we need

		// Starts at 1 to prevent parsing data from headers
		for (var rowIndex = 1, rowsLength = rows.length; rowIndex < rowsLength; rowIndex++) {
			var cellData = {}

			const row = rows[rowIndex]
			const rowContent = row.childNodes
			for (var colIndex = 1, rowWidth = rowContent.length; colIndex < rowWidth; colIndex++) {
				const cell = rowContent.item(colIndex)
				const header = keys[colIndex - 1]

				if (cell.nodeName == 'TH') {
					cellData = null
					continue
				} // Skip if cell is header

				let content = cell.textContent
				content = replaceAllInList(content, ['(', ')', '.', '?'], '')

				if (header == '' || header in REMOVE[sheetData.name]) continue;

				// Get header name and add cell content to cellData[header]'s value
				cellData[header] = content
			}

			if (!cellData) continue

			// Check whether or not the cell is a spacer
			if (!(() => {
				// Check if *all* values in cellData are ''
				for (const key in cellData) {
					if (Object.hasOwnProperty.call(cellData, key)) {
						const value = cellData[key];
						if (value != '') return true;
					}
				}
				return false
			})()) continue;

			data.push(cellData)
		}

		//console.log(consoleColors.FG_GRAY + `| ${rows.length} Entries`)

		parsedData[sheetData.name] = data
	}

	//#endregion

	//#region config
	// Apply REPLACEMENTS and GROUPING from parseConfig.json
	for (var sheetIndex = 0, sheetLength = Object.keys(parsedData).length; sheetIndex < sheetLength; sheetIndex++) {
		const sheetName = Object.keys(parsedData)[sheetIndex]
		const sheetData = parsedData[sheetName]

		// Replacements
		for (var entryIndex = 0, sheetDataLength = sheetData.length; entryIndex < sheetDataLength; entryIndex++) {
			let entry = sheetData[entryIndex]

			const replacements = REPLACEMENTS[sheetName]
			for (var replacementsIndex = 0, replacementsLength = Object.keys(replacements).length; replacementsIndex < replacementsLength; replacementsIndex++) {
				// Get key
				const propertyName = Object.keys(replacements)[replacementsIndex]
				// Get value
				const replacementName = replacements[propertyName]

				// Check if entry has the propertyName
				if (propertyName in entry) {
					entry[replacementName] = entry[propertyName]

					entry = Object.keys(entry)
						.filter(key => key != propertyName)
						.reduce((acc, key) => {
							acc[key] = entry[key];
							return acc;
						}, {});
				}
			}

			// Update new info
			sheetData[entryIndex] = entry
		}

		// Grouping
		for (var entryIndex = 0, sheetDataLength = sheetData.length; entryIndex < sheetDataLength; entryIndex++) {
			const entry = sheetData[entryIndex]
			const sheetGrouping = GROUPING[sheetName]

			Object.keys(sheetGrouping).forEach(sheetGroupName => {
				let group = {}
				const sheetGroup = sheetGrouping[sheetGroupName]
				sheetGroup.forEach(sheetProp => {
					if (Object.keys(entry).includes(sheetProp)) {
						group[sheetProp] = entry[sheetProp]
						delete entry[sheetProp]
					}
				})
				entry[sheetGroupName] = group
			});
		}
	}

	//#endregion

	// Write to file
	const dataFilePath = 'res/raw_data/latest.data.json'
	fs.writeFileSync(dataFilePath, JSON.stringify(parsedData, null, "\t"))
	console.log(consoleColors.FG_MAGENTA + `Written to '${dataFilePath}'!`)
}


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