const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js')
const { getSheet } = require('../util/queryData')
const talentReqNames = ["power", "strength", "fortitude", "agility", "intelligence", "willpower", "charisma", "flamecharm", "frostdraw", "thundercall", "galebreathe", "shadowcast", "medium_wep", "heavy_wep", "light_wep"]

module.exports = {
    data: new SlashCommandBuilder()
        .setName('find')

        // Talent
        .addSubcommand(subcommand => {
            subcommand.setName('talent')
                .setDescription('Find a certain talent.')
                .addStringOption(option =>
                    option.setName('talent_name')
                        .setDescription('The name to search for...'))
                .addStringOption(option =>
                    option.setName('category')
                        .setDescription('The category to search in...'))
                .addStringOption(option =>
                    option.setName('description')
                        .setDescription('The description to search for...'))
                .addStringOption(option =>
                    option.setName('rarity')
                        .addChoices({ name: 'common', value: 'common' }, { name: 'rare', value: 'rare' }, { name: 'advanced', value: 'advanced' })
                        .setDescription('The rarity to search for...'))
                .addBooleanOption(option =>
                    option.setName('multiple').setDescription('Whether or not the command returns multiple results.'))

            // Exact Reqs
            for (let index = 0; index < talentReqNames.length; index++) {
                const name = talentReqNames[index];
                subcommand.addStringOption(option =>
                    option.setName(`${name}`).setDescription(`Maximum requirement of ${name}. int:int to denote minimum / maximum.`)
                )
            }

            return subcommand
        })

        // Mantra
        .addSubcommand(subcommand =>
            subcommand.setName('mantra')
                .setDescription('Find a certain mantra.')
                .addStringOption(option =>
                    option.setName('mantra_name').setRequired(true)
                        .setDescription('The name to search for...'))
                .addBooleanOption(option =>
                    option.setName('multiple').setRequired(true)
                        .setDescription('Whether or not you want multiple results.')))

        // Weapon
        .addSubcommand(subcommand =>
            subcommand.setName('weapon')
                .setDescription('Find a certain weapon.')
                .addStringOption(option =>
                    option.setName('weapon_name').setRequired(true)
                        .setDescription('The name to search for...'))
                .addBooleanOption(option =>
                    option.setName('multiple').setRequired(true)
                        .setDescription('Whether or not you want multiple results.')))

        // Outfit        
        .addSubcommand(subcommand =>
            subcommand.setName('outfit')
                .setDescription('Find a certain weapon.')
                .addStringOption(option =>
                    option.setName('outfit_name').setRequired(true)
                        .setDescription('The name to search for...'))
                .addBooleanOption(option =>
                    option.setName('multiple').setRequired(true)
                        .setDescription('Whether or not you want multiple results.')))

        // Mystic
        .addSubcommand(subcommand =>
            subcommand.setName('mystic')
                .setDescription('Find a certain mystic option.')
                .addStringOption(option =>
                    option.setName('category').setRequired(true)
                        .setDescription("The category in mystic's dialogue to search for..."))
                .addBooleanOption(option =>
                    option.setName('multiple').setRequired(true)
                        .setDescription('Whether or not you want multiple results.')))

        // Enchant
        .addSubcommand(subcommand =>
            subcommand.setName('enchant')
                .setDescription('Find a certain enchant.')
                .addStringOption(option =>
                    option.setName('name').setRequired(true)
                        .setDescription('The name to search for...'))
                .addBooleanOption(option =>
                    option.setName('multiple').setRequired(true)
                        .setDescription('Whether or not you want multiple results.')))

        .setDescription('Replies with data based on the input.'),
    async execute(interaction) {
        const options = interaction.options
        const sheetName = options._subcommand

        /**
         * @param {String} name 
         * @returns {any}
         */
        const getOption = (name) => {
            for (let index = 0; index < options._hoistedOptions.length; index++) {
                const option = options._hoistedOptions[index];
                if (option.name == name) return option
            }
        }

        const entryName = getOption('name')
        const multiple = getOption('multiple') != undefined ? getOption('multiple').value : false
        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('Query Result:')
            .setTimestamp()

        const reqs = ((reqNames) => {
            let result = {}
            for (let index = 0; index < reqNames.length; index++) {
                const reqName = reqNames[index];
                const option = getOption(reqName)

                if (!option) continue

                // Check if the value is a range
                if (option.value.includes(':')) {
                    let reqRange = option.value.split(':')
                    if (parseInt(reqRange[0]) && parseInt(reqRange[1])) {
                        result[reqName] = {
                            min: Math.min(parseInt(reqRange[0]), parseInt(reqRange[1])),
                            max: Math.max(parseInt(reqRange[0]), parseInt(reqRange[1]))
                        }
                    }
                    // If not, check if the input is actually a number.
                } else if (parseInt(option.value)) {
                    result[reqName] = parseInt(option.value)
                }
            }
            return result
        })(talentReqNames)

        const validEntries = []
        switch (sheetName) {
            case 'talent': {
                const sheet = getSheet(sheetName + 's')

                // Determine entries
                for (let index = 0; index < sheet.length; index++) {
                    const entry = sheet[index];
                    let valid = true

                    // Check if it meets reqs OR even has 'reqs' as a value
                    if (entry["reqs"]) {
                        for (let reqIndex = 0; reqIndex < Object.keys(reqs).length; reqIndex++) {
                            const reqName = Object.keys(reqs)[reqIndex]
                            const optionReq = reqs[reqName]
                            const entryReq = parseInt(entry["reqs"][reqName])

                            // Check if req is a range 
                            if (optionReq["min"] || optionReq["max"]) {
                                if (!(entryReq >= optionReq.min && entryReq <= optionReq.max)) valid = false;
                            } else {
                                if (!(entryReq == optionReq)) valid = false;
                            }


                        }
                    }

                    if (getOption('talent_name') != undefined) {
                        const talentName = getOption('talent_name').value.toLowerCase()
                        if (!(entry["talent"].toLowerCase()).includes(talentName)) valid = false;
                    }
                    if (getOption('category') != undefined) {
                        const category = getOption('category').value.toLowerCase()
                        if (!(entry["category"].toLowerCase()).includes((category))) valid = false;
                    }
                    if (getOption('description') != undefined) {
                        const description = getOption('description').value.toLowerCase()
                        if (!(entry["description"].toLowerCase()).includes((description))) valid = false;
                    }
                    if (getOption('rarity') != undefined) {
                        const rarity = getOption('rarity').value.toLowerCase()
                        if (!(entry["rarity"].toLowerCase()).includes((rarity))) valid = false;
                    }


                    if (valid) {
                        validEntries.push(entry)
                    }
                }

                // Display the first five entries
                for (let index = 0; index < (validEntries.length < 5 ? validEntries.length : 5); index++) {
                    const entry = validEntries[index];
                    embed.addFields({ name: entry[sheetName], value: entry.description })
                }


                embed.setFooter({ text: `Displaying 5 of ${validEntries.length} results.` })
            } break;
            case 'mantra': {
                const sheet = getSheet(sheetName + 's')

            } break;
            case 'weapon': {
                const sheet = getSheet(sheetName + 's')

            } break;
            case 'mystic': {
                const sheet = getSheet(sheetName)

            } break;
            case 'outfit': {
                const sheet = getSheet(sheetName + 's')

            } break;
            case 'enchant': {
                const sheet = getSheet(sheetName + 's')

            } break;
        }

        console.log(validEntries)

        let pages = validEntries.length % 5 + (validEntries.length % 5 > 0 ? 1 : 0)
        let currPage = 1

        // Check whether or not the query returned an entry or more
        if (!validEntries[0]) return await interaction.reply(`**Query returned null.**`)

        // Send message
        const nextPage = new ButtonBuilder()
            .setCustomId('next_page')
            .setLabel('Next Page')
            .setDisabled(currPage >= pages)
            .setStyle(currPage < pages ? ButtonStyle.Primary : ButtonStyle.Secondary);

        const navbarLabel = new ButtonBuilder()
            .setCustomId('navbar_label')
            .setLabel(`${currPage} / ${pages}`)
            .setDisabled(true)
            .setStyle(ButtonStyle.Secondary);

        const lastPage = new ButtonBuilder()
            .setCustomId('last_page')
            .setLabel('Last Page')
            .setDisabled(currPage <= 1)
            .setStyle(currPage > 1 ? ButtonStyle.Primary : ButtonStyle.Secondary);

        const navbar = new ActionRowBuilder()
            .addComponents(lastPage, navbarLabel, nextPage);

        const response = await interaction.reply({ embeds: [embed], components: [navbar] })
        const collectorFilter = i => i.user.id === interaction.user.id;

        // Handling page buttons
        const buttonInteraction = await response.awaitMessageComponent({ filter: collectorFilter })

        switch ( buttonInteraction.customId ) {
            case 'last_page': {

            } break;
            case 'next_page': {

            } break;
        }
    }
}

