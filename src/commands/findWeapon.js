const { SlashCommandBuilder, EmbedBuilder, SlashCommandSubcommandBuilder } = require('discord.js')
const { getSheet } = require('../util/queryData')
const { PagesBuilder, PagesManager } = require('discord.js-pages');
const { replaceAll } = require('../util/replaceAll');
const { Requirements, QueryHelper, setRequirements, capitalize } = require('../util/findUtil')

const pagesManager = new PagesManager();

module.exports = {
    data: ((builder) => {
        builder.setName('find_weapon')
            .setDescription('Find a certain weapon.')
            .addStringOption(option =>
                option.setName('name')
                    .setDescription('The name to search for...'))

        setRequirements(builder, Requirements.Weapons)

        return builder
    })(new SlashCommandBuilder()),
    async execute(interaction) {
        const helper = new QueryHelper(interaction)
        const sheetName = 'weapon'

        pagesManager.middleware(interaction);

        const pages = []
        const validEntries = []

        const sheet = getSheet(sheetName + 's')
        const reqs = helper.getRanges(Requirements.Weapons)

        // Determine entries
        for (let entryIndex = 0; entryIndex < sheet.length; entryIndex++) {
            const entry = sheet[entryIndex];
            let valid = true

            if (!helper.testQueryHeader(entry, 'name', 'weapon')) valid = false;

            for (let reqIndex = 0; reqIndex < Object.keys(reqs).length; reqIndex++) {
                const reqName = Object.keys(reqs)[reqIndex]
                const optionReq = reqs[reqName]
                const entryReq = parseFloat(entry["reqs"][reqName] | entry["stats"][reqName])

                if (entryReq == NaN) continue;

                // Check if req is a range 
                if (!helper.testRangeOrEquality(entryReq, optionReq.min, optionReq.max, optionReq)) valid = false;
            
            }

            if (valid) validEntries.push(entry)
        }

        // Create Pages
        pageCount = Math.ceil(validEntries.length)
        for (let pageIndex = 0; pageIndex < pageCount; pageIndex++) {
            const entry = validEntries[pageIndex];
            if (!entry) continue;

            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle(`Weapon: ${entry['weapon']} `)
                .setTimestamp()
                .addFields(
                    { name: 'Attribute', value: '```' + entry['attribute'] + '```', inline: true },
                    { name: 'Description:', value: '```' + `${entry['description']}` + '```' }
                )

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

