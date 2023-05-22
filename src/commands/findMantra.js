const { SlashCommandBuilder, EmbedBuilder, SlashCommandSubcommandBuilder } = require('discord.js')
const { getSheet } = require('../util/queryData')
const { PagesBuilder, PagesManager } = require('discord.js-pages');
const { replaceAll } = require('../util/replaceAll');
const { Requirements, QueryHelper, setRequirements, capitalize } = require('../util/findUtil')

const pagesManager = new PagesManager();

module.exports = {
    data: ((builder) => {
        builder.setName('find_mantra')
            .setDescription('Find a certain mantra.')
            .addStringOption(option =>
                option.setName('name')
                    .setDescription('The name to search for...'))
            .addStringOption(option =>
                option.setName('stars')
                    .setDescription('The name to search for...'))


        // Exact Reqs
        setRequirements(builder, Requirements.Mantras)

        return builder
    })(new SlashCommandBuilder()),
    async execute(interaction) {
        const helper = new QueryHelper(interaction)
        const sheetName = 'mantra'

        pagesManager.middleware(interaction);

        const pages = []
        const validEntries = []

        const sheet = getSheet(sheetName + 's')
        const reqs = helper.getRanges(Requirements.Talents)

        // Determine entries
        for (let entryIndex = 0; entryIndex < sheet.length; entryIndex++) {
            const entry = sheet[entryIndex];
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

            let starReq = helper.getRanges(['stars'])['stars']
            if (starReq != undefined) {
                if (!helper.testRangeOrEquality(entry['stars'] == '0' ? 0 : parseInt(entry['stars']), starReq.min, starReq.max, starReq)) valid = false;
            }

            if (!helper.testQueryHeader(entry, 'name', 'mantra')) valid = false;

            if (valid) validEntries.push(entry)
        }

        // Create Pages
        pageCount = Math.ceil(validEntries.length)
        for (let pageIndex = 0; pageIndex < pageCount; pageIndex++) {
            const entry = validEntries[pageIndex];
            if (!entry) continue;

            const getStars = () => {
                if (!entry['stars']) return ''

                const star = '★'
                let result = ''
                for (let i = 0; i < parseInt(entry['stars']); i++) {
                    result += star
                }
                return result
            }

            const entryName = entry[sheetName]
            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle(`Mantra: ${entryName} ` + getStars())
                .setTimestamp()
                .addFields(
                    { name: 'Description:', value: '```' + `${entry['description']}` + '```' },
                    { name: 'Category', value: '```' + entry['category'] + '```', inline: true }
                )

            if (entry['gif']) {
                embed.setImage(entry['gif'])
            }
            
            if (entry['type']) {
                embed.addFields({name: 'Mantra Type', value: '```' + `${entry['type']}` + '```', inline: true})
            }

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

            if (reqResults != '') embed.addFields({ name: 'Requirements', value: '```' + `${reqResults}` + '```', inline: true })

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

