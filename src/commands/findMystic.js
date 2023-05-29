const { SlashCommandBuilder, EmbedBuilder } = require('discord.js')
const { getSheet } = require('../util/queryData')
const { PagesBuilder, PagesManager } = require('discord.js-pages');
const { QueryHelper } = require('../util/findUtil')
const commandInfo = require('../../res/data/command.info.json')

const pagesManager = new PagesManager();

module.exports = {
    data: ((builder) => {
        builder.setName('find_mystic')
            .setDescription(commandInfo.find_mystic.description)
            .addStringOption(option =>
                option.setName('category')
                    .setDescription('The category to search for...'))
            .addStringOption(option =>
                option.setName('attribute')
                    .setDescription('The attribute to search for...'))
            .addStringOption(option =>
                option.setName('dialogue')
                    .setDescription('The dialogue to search for...'))

        return builder
    })(new SlashCommandBuilder()),
    async execute(interaction) {
        const helper = new QueryHelper(interaction)
        const sheetName = 'mystic'

        pagesManager.middleware(interaction);

        const pages = []
        const validEntries = []

        const sheet = getSheet(sheetName)

        // Determine entries
        for (let entryIndex = 0; entryIndex < sheet.length; entryIndex++) {
            const entry = sheet[entryIndex];
            let valid = true

            if (!helper.testQueryHeader(entry, 'category', 'category')) valid = false;
            if (!helper.testQueryHeader(entry, 'dialogue', 'dialogue')) valid = false;
            if (!helper.testQueryHeader(entry, 'attribute', 'attribute')) valid = false;

            if (valid) validEntries.push(entry)
        }

        // Create Pages
        pageCount = Math.ceil(validEntries.length)
        for (let pageIndex = 0; pageIndex < pageCount; pageIndex++) {
            const entry = validEntries[pageIndex];
            if (!entry) continue;

            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle(`Mystic: ${entry['category']} `)
                .setTimestamp()
                .addFields(
                    { name: 'Attribute', value: '```' + entry['attribute'] + '```', inline: true },
                    { name: 'Description:', value: '```' + `${entry['dialogue']}` + '```' }
                )
                .setImage('https://i.stack.imgur.com/Fzh0w.png') // adds extra width
            
            // Display all talents within category
            let talents = getSheet('talents')
            let categoryTalents = (() => {
                const talentsByRarity = {}
                let result = ''
                talents.forEach(talent => { 
                    if (talent['category'] == entry['category']) {
                        if (talentsByRarity[talent['rarity'].toLowerCase()]) {
                            talentsByRarity[talent['rarity'].toLowerCase()].push(talent['talent'])
                        } else {
                            talentsByRarity[talent['rarity'].toLowerCase()] = [talent['talent']]
                        }
                    }
                });

                const sortedTalentsByRarity = {}
                Object.keys(talentsByRarity).sort().forEach(key => {
                    sortedTalentsByRarity[key] = talentsByRarity[key]
                })

                Object.keys(sortedTalentsByRarity).forEach(rarity => {
                    result += `${rarity.toUpperCase()}:\n`
                    sortedTalentsByRarity[rarity].forEach(talent => {
                        result += `> ${talent} \n`
                    })
                })

                return result
            })()
            
            if (categoryTalents) {
                embed.addFields( {name: 'Talents', value: '```'+categoryTalents+'```'} )
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

