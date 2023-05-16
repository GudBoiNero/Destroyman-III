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
                option.setName('mantra_name')
                    .setDescription('The name to search for...'));

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
        const reqs = helper.getReqs(Requirements.Talents)

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

            if (!helper.testQueryHeader(entry, 'mantra_name', 'mantra')) valid = false;

            if (valid) validEntries.push(entry)
        }

        // Create Pages
        pageCount = Math.ceil(validEntries.length / 5)
        for (let pageIndex = 0; pageIndex < pageCount; pageIndex++) {
            // Display the first five entries
            for (let entryIndex = 0; entryIndex < 5; entryIndex++) {
                const entry = validEntries[entryIndex + (pageIndex * 5)];
                if (!entry) continue;

                const stars = () => {
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
                    .setTitle(`Mantra: ${entryName} ` + stars())
                    .setTimestamp()
                    .addFields(
                        { name: 'Description:', value: '```' + `${entry['description']}` + '```' },
                        { name: 'Category', value: '```' + entry['category'] + '```', inline: true }
                    )

                if (entry['gif']) {
                    embed.setImage(entry['gif'])
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

