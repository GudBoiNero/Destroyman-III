const { SlashCommandBuilder, EmbedBuilder } = require('discord.js')
const { getSheet } = require('../util/queryData')
const { PagesBuilder, PagesManager } = require('discord.js-pages');
const { replaceAll } = require('../util/replaceAll');
const { Requirements, QueryHelper, setRequirements, capitalize } = require('../util/findUtil')
const commandInfo = require('../../res/data/command.info.json')

const pagesManager = new PagesManager();

module.exports = {
    data: ((builder) => {
        builder.setName('find_weapon')
            .setDescription(commandInfo.find_weapon.description)
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

            let statResults = ''
            for (let statIndex = 0; statIndex < Object.keys(entry["stats"]).length; statIndex++) {
                const statName = Object.keys(entry["stats"])[statIndex];

                if (entry["stats"][statName] == "" || entry["stats"][statName] == "0" || entry["stats"][statName] == 0) continue;

                statResults += `${replaceAll(capitalize(statName), '_', ' ')}: ${entry["stats"][statName]}\n`
            }

            if (statResults != '') embed.addFields({ name: 'Stats', value: '```' + `${statResults}` + '```', inline: true })


            let reqResults = ''
            for (let reqIndex = 0; reqIndex < Object.keys(entry["reqs"]).length; reqIndex++) {
                const reqName = Object.keys(entry["reqs"])[reqIndex];

                if (!parseInt(entry["reqs"][reqName]) > 0 || parseInt(entry["reqs"][reqName] == NaN)) continue;

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

