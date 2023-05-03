const { SlashCommandBuilder, SlashCommandSubcommandBuilder } = require('discord.js')
const { getSheet } = require('../util/queryData')
const reqNames = ["power", "strength", "fortitude", "agility", "intelligence", "willpower", "charisma", "flamecharm", "frostdraw", "thundercall", "galebreathe", "shadowcast", "medium_wep", "heavy_wep", "light_wep"]

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
                        .addChoices({name: 'common', value: 'common'}, {name: 'rare', value: 'rare'}, {name: 'advanced', value: 'advanced'})
                        .setDescription('The rarity to search for...'))
                .addBooleanOption(option =>
                    option.setName('multiple').setDescription('Whether or not the command returns multiple results.'))

            // Exact Reqs
            for (let index = 0; index < reqNames.length; index++) {
                const name = reqNames[index];
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
                    option.setName('name').setRequired(true)
                        .setDescription('The name to search for...'))
                .addBooleanOption(option =>
                    option.setName('multiple').setRequired(true)
                        .setDescription('Whether or not you want multiple results.')))

        // Weapon
        .addSubcommand(subcommand =>
            subcommand.setName('weapon')
                .setDescription('Find a certain weapon.')
                .addStringOption(option =>
                    option.setName('name').setRequired(true)
                        .setDescription('The name to search for...'))
                .addBooleanOption(option =>
                    option.setName('multiple').setRequired(true)
                        .setDescription('Whether or not you want multiple results.')))

        // Outfit        
        .addSubcommand(subcommand =>
            subcommand.setName('outfit')
                .setDescription('Find a certain weapon.')
                .addStringOption(option =>
                    option.setName('name').setRequired(true)
                        .setDescription('The name to search for...'))
                .addBooleanOption(option =>
                    option.setName('multiple').setRequired(true)
                        .setDescription('Whether or not you want multiple results.')))

        // Mystic
        .addSubcommand(subcommand =>
            subcommand.setName('mystic')
                .setDescription('Find a certain mystic option.')
                .addStringOption(option =>
                    option.setName('name').setRequired(true)
                        .setDescription('The name to search for...'))
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
        })(reqNames)

        const validEntries = []
        switch (sheetName) {
            case 'talent': {
                const sheet = getSheet(sheetName + 's')

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
        await interaction.reply('Querying...')
    }
}

