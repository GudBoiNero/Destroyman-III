const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js')
const { getSheet } = require('../util/queryData')
const { PagesBuilder, PagesManager } = require('discord.js-pages');
const { replaceAll } = require('../util/replaceAll');
const { Requirements, QueryHelper, setRequirements, capitalize } = require('../util/findUtil');
const OutfitResistances = ["physical_resistance", "slash_resistance", "blunt_resistance", "elemental_resistance", "flame_resistance", "ice_resistance", "thunder_resistance", "wind_resistance", "shadow_resistance"]
const pagesManager = new PagesManager();

module.exports = {
    data: ((builder) => {
        builder.setName('find_outfit')
            .setDescription('Find a certain outfit.')
            .addStringOption(option =>
                option.setName('name')
                    .setDescription('The name to search for...'))
            .addStringOption(option =>
                option.setName('durability')
                    .setDescription('The name to search for...'))
            .addStringOption(option =>
                option.setName('ether_regen')
                    .setDescription('The name to search for...'))
            .addStringOption(option =>
                option.setName('extra_stealth')
                    .setDescription('The name to search for...'))
            .addStringOption(option =>
                option.setName('cost')
                    .setDescription('The name to search for...'))

        // Exact Reqs
        setRequirements(builder, Requirements.Outfits)
        setRequirements(builder, OutfitResistances)

        return builder
    })(new SlashCommandBuilder()),
    async execute(interaction) {
        const helper = new QueryHelper(interaction)
        const sheetName = 'outfit'

        pagesManager.middleware(interaction);

        const pages = []
        const validEntries = []

        const sheet = getSheet(sheetName + 's')
        const reqs = helper.getRanges(Requirements.Outfits)
        const resistanceReqs = helper.getRanges(OutfitResistances)

        // Determine entries
        for (let entryIndex = 0; entryIndex < sheet.length; entryIndex++) {
            const entry = sheet[entryIndex];
            let valid = true

            if (!helper.testQueryHeader(entry, 'name', 'outfit')) valid = false;

            let req = helper.getRanges(['cost'])['cost']
            if (req && entry['cost']) {
                if (!helper.testRangeOrEquality(parseInt(entry['cost']), req.min, req.max, req)) valid = false;
            } else if (req && !entry['cost']) { valid = false }

            if (entry['materials']) {
                const newMaterials = []
                const materials = (entry['materials']).split(',')
                for (let materialIndex = 0; materialIndex < materials.length; materialIndex++) {
                    let materialStr = (entry['materials']).split(',')[materialIndex];

                    // Remove empty text
                    if (materialStr == '') { 
                        materials.splice(materialIndex); 
                        continue; 
                    }

                    // Trim white space
                    materialStr = materialStr.trim()

                    let regex = new RegExp(/x(\d+)|(\d+)/)
                    let res = regex.exec(materialStr)
                    console.log(res)

                    if (!res || !res[0] || !res[1]) continue;

                    const material = {
                        mat: replaceAll(res.input, res[0], '').trim(),
                        amt: parseInt(res[1] | res[2])
                    }

                    newMaterials[materialIndex] = material
                }
                entry["materials"] = newMaterials
            }

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
            if (entry["resistances"]) {
                for (let reqIndex = 0; reqIndex < Object.keys(resistanceReqs).length; reqIndex++) {
                    const reqName = replaceAll(Object.keys(resistanceReqs)[reqIndex], '%', '')
                    const optionReq = resistanceReqs[reqName]
                    const entryReq = parseInt(entry["resistances"][reqName])

                    if (entryReq == NaN) continue;

                    // Check if req is a range 
                    if (!helper.testRangeOrEquality(entryReq, optionReq.min, optionReq.max, optionReq)) valid = false;
                }
            }

            if (valid) validEntries.push(entry)
        }

        // Create Pages
        pageCount = Math.ceil(validEntries.length)
        for (let pageIndex = 0; pageIndex < pageCount; pageIndex++) {
            const entry = validEntries[pageIndex];

            if (!entry) continue;

            const entryName = entry['outfit']
            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle(`Outfit: ${entryName} `)
                .setTimestamp()
                .addFields(
                    { name: 'Cost', value: '```'+`${entry['cost']} Notes`+'```', inline: true },
                    { name: 'Durability', value: '```'+`${entry['durability']}`+'```', inline: true },
                    { name: '\u000B', value: '\u000B' },
                    { name: 'Extra Stealth', value: '```'+`${entry['extra_stealth']}`+'```', inline: true },
                    { name: 'Ether Regen', value: '```'+`${entry['ether_regen']}`+'```', inline: true },
                )

            if (entry['image']) {
                embed.setThumbnail(entry['image'])
            }

            let matResults = ''
            const materials = entry['materials']
            console.log(materials)
            for (let matIndex = 0; matIndex < materials.length; matIndex++) {
                matResults += `${replaceAll(capitalize(materials[matIndex].mat), '_', ' ')}: ${materials[matIndex].amt}\n`
            }

            if (matResults) embed.addFields({name: 'Materials', value: '```'+`${matResults}`+'```'});

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

