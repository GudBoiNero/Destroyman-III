const { SlashCommandBuilder, EmbedBuilder, SlashCommandSubcommandBuilder } = require('discord.js')
const { getSheet } = require('../util/queryData')
const { PagesBuilder, PagesManager } = require('discord.js-pages');
const { replaceAll } = require('../util/replaceAll');
const { Requirements, QueryHelper, setRequirements, capitalize } = require('../util/findUtil')

const pagesManager = new PagesManager();

module.exports = {
    data: ((builder) => {
        builder.setName('find_enchant')
            .setDescription('Find a certain enchant.')
            .addStringOption(option =>
                option.setName('name')
                    .setDescription('The name to search for...'))
            .addStringOption(option =>
                option.setName('type')
                    .setDescription('The type to search for...')
                    .addChoices({ name: 'weapon', value: 'weapon' }, { name: 'armor', value: 'armor' }))
            .addStringOption(option =>
                option.setName('description')
                    .setDescription('The description to search for...'))

        return builder
    })(new SlashCommandBuilder()),
    async execute(interaction) {
        const helper = new QueryHelper(interaction)
        const sheetName = 'enchant'

        pagesManager.middleware(interaction);

        const pages = []
        const validEntries = []

        const sheet = getSheet(sheetName + 's')

        // Determine entries
        for (let entryIndex = 0; entryIndex < sheet.length; entryIndex++) {
            const entry = sheet[entryIndex];
            let valid = true

            if (!helper.testQueryHeader(entry, 'name', 'name')) valid = false;
            if (!helper.testQueryHeader(entry, 'type', 'type')) valid = false;
            if (!helper.testQueryHeader(entry, 'description', 'description')) valid = false;

            if (valid) validEntries.push(entry)
        }

        // Create Pages
        pageCount = Math.ceil(validEntries.length)
        for (let pageIndex = 0; pageIndex < pageCount; pageIndex++) {
            const entry = validEntries[pageIndex];
            if (!entry) continue;

            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle(`Enchant: ${entry['name']} `)
                .setTimestamp()
                .addFields(
                    { name: 'Description:', value: '```' + `${entry['description']}` + '```' },
                )
            
            if (entry['gif']) {
                embed.setImage(entry['gif'])
            }

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

