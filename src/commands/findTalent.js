const { SlashCommandBuilder, EmbedBuilder } = require('discord.js')
const { getSheet } = require('../util/queryData')
const { PagesBuilder, PagesManager } = require('discord.js-pages');
const { replaceAll } = require('../util/replaceAll');
const { Requirements, QueryHelper, setRequirements, capitalize } = require('../util/findUtil')
const commandInfo = require('../../res/data/command.info.json')

const pagesManager = new PagesManager();

module.exports = {
    data: ((builder) => {
        builder.setName('find_talent')
            .setDescription(commandInfo.find_talent.description)
            .addStringOption(option =>
                option.setName('name')
                    .setDescription('The name to search for...'))
            .addStringOption(option =>
                option.setName('category')
                    .setDescription('The category to search in...'))
            .addStringOption(option =>
                option.setName('description')
                    .setDescription('The description to search for...'))
            .addStringOption(option =>
                option.setName('type')
                    .addChoices({ name: 'common', value: 'common' }, { name: 'rare', value: 'rare' }, { name: 'advanced', value: 'advanced' }, { name: 'oath', value: 'oath' })
                    .setDescription('The type of card to search for...'))
            .setDescription('Replies with data based on the input.')

        // Exact Reqs
        setRequirements(builder, Requirements.Talents)

        return builder
    })(new SlashCommandBuilder()),
    async execute(interaction) {
        const helper = new QueryHelper(interaction)
        const sheetName = 'talent'

        pagesManager.middleware(interaction);

        const pages = []
        const validEntries = []

        const sheet = getSheet(sheetName + 's')
        const reqs = helper.getRanges(Requirements.Talents)

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

                    if (entryReq == NaN) continue;
                    
                    // Check if req is a range 
                    if (!helper.testRangeOrEquality(entryReq, optionReq.min, optionReq.max, optionReq)) valid = false;
                }
            }

            if (!helper.testQueryHeader(entry, 'name', 'talent')) valid = false;
            if (!helper.testQueryHeader(entry, 'category', 'category')) valid = false;
            if (!helper.testQueryHeader(entry, 'description', 'description')) valid = false;
            if (!helper.testQueryHeader(entry, 'type', 'rarity')) valid = false;

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
                    { name: 'Type:', value: '```' + `${entry['rarity']}` + '```', inline: true }
                )

            // Set requirements

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

