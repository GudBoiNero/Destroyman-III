const { SlashCommandBuilder, EmbedBuilder, SlashCommandSubcommandBuilder } = require('discord.js')
const { getSheet } = require('../util/queryData')
const { PagesBuilder, PagesManager } = require('discord.js-pages');
const { replaceAll } = require('../util/replaceAll');
const { Requirements } = require('../util/requirements')

const pagesManager = new PagesManager();

module.exports = {
    data: ((builder) => {
        builder.setName('find_talent')
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
            .setDescription('Replies with data based on the input.')

        // Exact Reqs
        for (let index = 0; index < Requirements.Talents.length; index++) {
            const name = Requirements.Talents[index];

            builder.addStringOption(option =>
                option.setName(`${name}`).setDescription(`Maximum requirement of ${name}. int:int to denote minimum / maximum.`)
            )
        }

        return builder
    })(new SlashCommandBuilder()),
    async execute(interaction) {
        const options = interaction.options
        const sheetName = 'talent'

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
        const sheet = getSheet(sheetName + 's')
        const reqs = getReqs(Requirements.Talents)

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
                    if (!testRangeOrEquality(entryReq, optionReq.min, optionReq.max, optionReq)) valid = false;
                }
            }

            if (!testQueryHeader(entry, 'talent_name', 'talent')) valid = false;
            if (!testQueryHeader(entry, 'category', 'category')) valid = false;
            if (!testQueryHeader(entry, 'description', 'description')) valid = false;
            if (!testQueryHeader(entry, 'rarity', 'rarity')) valid = false;

            if (valid) validEntries.push(entry)
        }

        // Create pages
        for (let entryIndex = 0; entryIndex < validEntries.length; entryIndex++) {
            const entry = validEntries[entryIndex];

            if (!entry) continue;

            const entryName = entry[sheetName]

            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle(`Talent: ${entryName}`)
                .setTimestamp()
                .addFields(
                    { name: 'Description:', value: '```' + `${entry['description']}` + '```' },
                    { name: 'Category:', value: '```' + `${entry['category']}` + '```', inline: true },
                    { name: 'Rarity:', value: '```' + `${entry['rarity']}` + '```', inline: true }
                )

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

