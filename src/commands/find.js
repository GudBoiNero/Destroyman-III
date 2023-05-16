const { SlashCommandBuilder, EmbedBuilder, SlashCommandSubcommandBuilder } = require('discord.js')
const { getSheet } = require('../util/queryData')
const { PagesBuilder, PagesManager } = require('discord.js-pages');
const { replaceAll } = require('../util/replaceAll');

const Requirements = {
    "Talents": ["power", "strength", "fortitude", "agility", "intelligence", "willpower", "charisma", "flamecharm", "frostdraw", "thundercall", "galebreathe", "shadowcast", "medium_wep", "heavy_wep", "light_wep"],
    "Mantras": ["power", "strength", "fortitude", "agility", "intelligence", "willpower", "charisma", "flamecharm", "frostdraw", "thundercall", "galebreathe", "shadowcast", "medium_wep", "heavy_wep", "light_wep"],
    "Weapons": ["power", "strength", "fortitude", "agility", "intelligence", "willpower", "charisma", "flamecharm", "frostdraw", "thundercall", "galebreathe", "shadowcast", "medium_wep", "heavy_wep", "light_wep"],
    "Outfits": ["power", "strength", "fortitude", "agility", "intelligence", "willpower", "charisma"],
}

const OutfitResistances = ["physical_resistance", "slash_resistance", "blunt_resistance", "elemental_resistance", "flame_resistance", "ice_resistance", "thunder_resistance", "wind_resistance", "shadow_resistance"]

const pagesManager = new PagesManager();

/**
 * @param {SlashCommandSubcommandBuilder} subcommand 
 * @param {Array<String>} orderByOptions
 */
const setSubcommandOrder = (subcommand, orderByOptions) => {
    subcommand.addStringOption(option => {
        option.setName('order_by').setDescription('Which value to order the results by.')

        for (let index = 0; index < orderByOptions.length; index++) {
            const header = orderByOptions[index];
            option.addChoices({ name: header, value: header })
        }
    })
    return subcommand
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('find')
        // Weapon
        .addSubcommand(subcommand =>
            subcommand.setName('weapon')
                .setDescription('Find a certain weapon.')
                .addStringOption(option =>
                    option.setName('weapon_name')
                        .setDescription('The name to search for...')))
        // Mystic
        .addSubcommand(subcommand =>
            subcommand.setName('mystic')
                .setDescription('Find a certain mystic option.')
                .addStringOption(option =>
                    option.setName('category')
                        .setDescription("The category in mystic's dialogue to search for...")))
        // Enchant
        .addSubcommand(subcommand =>
            subcommand.setName('enchant')
                .setDescription('Find a certain enchant.')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('The name to search for...'))
                .addStringOption(option =>
                    option.setName('type')
                        .setDescription('The type to search for...')
                        .addChoices({ name: 'weapon', value: 'weapon'}, { name: 'armor', value: 'armor'}))
                .addStringOption(option =>
                    option.setName('description')
                        .setDescription('The description to search for...')))

        .setDescription('Replies with data based on the input.'),
    async execute(interaction) {
        const options = interaction.options
        const sheetName = options._subcommand

        pagesManager.middleware(interaction);

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

        /**
         * @param {Number} val 
         * @param {Number} min 
         * @param {Number} max 
         * @returns {Boolean}
         */
        const testRange = (val, min, max) => val >= min && val <= max;

        /**
         * @param {Number} val 
         * @param {Number} min 
         * @param {Number} max 
         * @param {Number} exact 
         * @returns {Boolean}
         */
        const testRangeOrEquality = (val, min, max, exact) => testRange(val, min, max) || val == exact;

        /**
         * 
         * @param {String} optionName 
         * @param {String} valueName 
         * @returns {Boolean}
         */
        const testQueryHeader = (entry, optionName, valueName) => {
            if (getOption(optionName) != undefined) {
                const value = getOption(optionName).value.toLowerCase()
                return (entry[valueName].toLowerCase()).includes(value);
            } else return true
        }

        const pages = []
        const validEntries = []
        let pageCount = 0

        const getReqs = (reqNames) => {
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
                } else if (option.value.includes('-') || option.value.includes('+')) {
                    // Check if there is a + or - after number
                    const value = parseInt(option.value)
                    const opp = option.value[value.toString().length]
                    if (opp == '+') {
                        result[reqName] = {
                            min: value,
                            max: 100
                        }
                    } else {
                        result[reqName] = {
                            min: 0,
                            max: value
                        }
                    }
                } else if (parseInt(option.value)) {
                    result[reqName] = parseInt(option.value)
                }
            }
            return result
        }

        switch (sheetName) {
            case 'weapon': {
                const sheet = getSheet(sheetName + 's')

            } break;
            case 'mystic': {
                const sheet = getSheet(sheetName)

            } break;
            case 'outfit': {
                const sheet = getSheet(sheetName + 's')

                // Determine entries
                for (let entryIndex = 0; entryIndex < sheet.length; entryIndex++) {
                    const entry = sheet[entryIndex];
                    let valid = true

                    if (!testQueryHeader(entry, 'name', 'name')) valid = false;
                    if (!testQueryHeader(entry, 'description', 'description')) valid = false;
                    if (!testQueryHeader(entry, 'type', 'type')) valid = false;

                    if (valid) validEntries.push(entry)
                }

                // Create Pages
                pageCount = Math.ceil(validEntries.length)
                for (let pageIndex = 0; pageIndex < pageCount; pageIndex++) {
                    const entry = validEntries[pageIndex];

                    if (!entry) continue;

                    const entryName = entry['name']
                    const embed = new EmbedBuilder()
                        .setColor(0x0099FF)
                        .setTitle(`Enchant: ${entryName} `)
                        .setTimestamp()
                        .addFields(
                            { name: 'Description:', value: '```' + `${entry['description']}` + '```', inline:true }
                        )

                    if (entry['gif']) {
                        embed.setImage(entry['gif'])
                    }

                    pages.push(embed)
                }

            } break;
        case 'enchant': {
                const sheet = getSheet(sheetName + 's')

                // Determine entries
                for (let entryIndex = 0; entryIndex < sheet.length; entryIndex++) {
                    const entry = sheet[entryIndex];
                    let valid = true

                    if (!testQueryHeader(entry, 'name', 'name')) valid = false;
                    if (!testQueryHeader(entry, 'description', 'description')) valid = false;
                    if (!testQueryHeader(entry, 'type', 'type')) valid = false;

                    if (valid) validEntries.push(entry)
                }

                // Create Pages
                pageCount = Math.ceil(validEntries.length)
                for (let pageIndex = 0; pageIndex < pageCount; pageIndex++) {
                    const entry = validEntries[pageIndex];

                    if (!entry) continue;

                    const entryName = entry['name']
                    const embed = new EmbedBuilder()
                        .setColor(0x0099FF)
                        .setTitle(`Enchant: ${entryName} `)
                        .setTimestamp()
                        .addFields(
                            { name: 'Description:', value: '```' + `${entry['description']}` + '```', inline:true }
                        )

                    if (entry['gif']) {
                        embed.setImage(entry['gif'])
                    }

                    pages.push(embed)
                }

            } break;
        }

        // Check whether or not the query returned an entry or more
        if (validEntries[0] == undefined) return await interaction.reply(`**Query returned null.**`)

        const result = new PagesBuilder(interaction)
            .setTitle('Global title')
            .setColor('Green')
            .setDefaultButtons(['first', 'back', 'next', 'last'])

        for (let index = 0; index < pages.length; index++) {
            const page = pages[index];
            result.addPages(page)
        }

        result.build()
    }
}

