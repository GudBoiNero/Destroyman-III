const { SlashCommandBuilder, EmbedBuilder, SlashCommandSubcommandBuilder } = require('discord.js')
const { getSheet } = require('../util/queryData')
const { PagesBuilder, PagesManager } = require('discord.js-pages');
const { replaceAll } = require('../util/replaceAll');

const talentReqNames = ["power", "strength", "fortitude", "agility", "intelligence", "willpower", "charisma", "flamecharm", "frostdraw", "thundercall", "galebreathe", "shadowcast", "medium_wep", "heavy_wep", "light_wep"]
const mantraReqNames = ["power", "strength", "fortitude", "agility", "intelligence", "willpower", "charisma", "flamecharm", "frostdraw", "thundercall", "galebreathe", "shadowcast", "medium_wep", "heavy_wep", "light_wep"]
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
        .addSubcommand(subcommand => {
            subcommand.setName('mantra')
                .setDescription('Find a certain mantra.')
                .addStringOption(option =>
                    option.setName('mantra_name')
                        .setDescription('The name to search for...'));

            // Exact Reqs
            for (let index = 0; index < mantraReqNames.length; index++) {
                const name = mantraReqNames[index];

                subcommand.addStringOption(option =>
                    option.setName(`${name}`).setDescription(`Maximum requirement of ${name}. int:int to denote minimum / maximum.`)
                )
            }

            return subcommand
        })
        // Weapon
        .addSubcommand(subcommand =>
            subcommand.setName('weapon')
                .setDescription('Find a certain weapon.')
                .addStringOption(option =>
                    option.setName('weapon_name')
                        .setDescription('The name to search for...')))
        // Outfit        
        .addSubcommand(subcommand =>
            subcommand.setName('outfit')
                .setDescription('Find a certain weapon.')
                .addStringOption(option =>
                    option.setName('outfit_name')
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
                        .setDescription('The name to search for...')))

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
            case 'talent': {
                const sheet = getSheet(sheetName + 's')
                const reqs = getReqs(talentReqNames)

                // Determine entries
                for (let index = 0; index < sheet.length; index++) {
                    const entry = sheet[index];
                    let valid = true

                    /**
                     * @param {String} groupName 
                     * @param {Function} testFunc
                     * @param {Function} reduceFunc 
                     */
                    const testGroupHeaders = (entry, groupName, testFunc, reduceFunc) => {
                        if (entry[groupName]) {
                            for (let index = 0; index < Object.keys(reqs).length; index++) {
                                const headerName = Object.keys(reqs)[index]
                                const optionReq = reqs[headerName]
                                const entryReq = parseInt(entry[groupName][headerName])

                                // Check if req is a range 
                                if (testFunc.call(entryReq, optionReq.min, optionReq.max, optionReq)) reduceFunc.call()
                            }
                        }
                    }

                    // Reduce to testHeaders
                    // Check if it meets reqs OR even has 'reqs' as a value
                    if (entry["reqs"]) {
                        for (let reqIndex = 0; reqIndex < Object.keys(reqs).length; reqIndex++) {
                            const reqName = Object.keys(reqs)[reqIndex]
                            const optionReq = reqs[reqName]
                            const entryReq = parseInt(entry["reqs"][reqName])

                            // Check if req is a range 
                            if (!testRangeOrEquality(entryReq, optionReq.min, optionReq.max, optionReq)) valid = false;
                        }
                    }

                    if (!testQueryHeader(entry, 'talent_name', 'talent')) valid = false;
                    if (!testQueryHeader(entry, 'category', 'category'))  valid = false;
                    if (!testQueryHeader(entry, 'description', 'description')) valid = false;
                    if (!testQueryHeader(entry, 'rarity', 'rarity')) valid = false;

                    if (valid) {
                        validEntries.push(entry)
                    }
                }

                // Create pages
                pageCount = Math.ceil(validEntries.length / 5)
                for (let pageIndex = 0; pageIndex < pageCount; pageIndex++) {
                    // Display the first five entries
                    for (let entryIndex = 0; entryIndex < 5; entryIndex++) {
                        const entry = validEntries[entryIndex + (pageIndex * 5)];

                        if (!entry) continue;

                        const talentName = entry[sheetName]

                        const embed = new EmbedBuilder()
                            .setColor(0x0099FF)
                            .setTitle(`Talent: ${talentName}`)
                            .setTimestamp()
                            .addFields(
                                { name: 'Description:', value: '```' + `${entry['description']}` + '```' },
                                { name: 'Category:', value: '```' + `${entry['category']}` + '```', inline: true },
                                { name: 'Rarity:', value: '```' + `${entry['rarity']}` + '```', inline: true },
                                //{ name: 'Requirements:', value: '```'+`${entry['formatted_reqs']}`+'```' },
                            )
                            .setFooter({ text: `Displaying ${validEntries.length >= 5 ? 5 : validEntries.length} of ${validEntries.length} results.` });

                        // Set requirements

                        const capitalize = (word) => {
                            const lower = word.toLowerCase();
                            return word.charAt(0).toUpperCase() + lower.slice(1);
                        }

                        let reqResults = ''
                        for (let reqIndex = 0; reqIndex < Object.keys(entry["reqs"]).length; reqIndex++) {
                            const reqName = Object.keys(entry["reqs"])[reqIndex];

                            if (!parseInt(entry["reqs"][reqName]) > 0) continue;

                            reqResults += `${replaceAll(capitalize(reqName), '_', ' ')}: ${entry["reqs"][reqName]}\n`
                        }

                        if (reqResults != '') embed.addFields({ name: 'Requirements', value: '```' + `${reqResults}` + '```' })

                        pages.push(embed)
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

