const { SlashCommandBuilder, CommandInteraction, EmbedBuilder } = require('discord.js')
const { AUTHORIZED_USERS } = require('../config.json')
const { fetchData } = require('../util/fetchData.js')
const commandInfo = require('../../res/data/command.info.json')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('refresh_data')
        .setDescription(commandInfo.refresh_data.description),
    /**
     * 
     * @param { CommandInteraction } interaction 
     */
    async execute(interaction) {
        const user = interaction.user;
        const userId = user.id;

        await interaction.deferReply({ephemeral: true})
        if (AUTHORIZED_USERS.includes(userId)) {
            await interaction.editReply({ embeds: [new EmbedBuilder().setTitle('Fetching Google Sheet...').setTimestamp()] })
            try {
                await fetchData()
                const successEmbed = new EmbedBuilder().setTitle('Successfully Fetched Data!')
                        .setColor('Green')
                        .setFooter({text: 'Written to `latest.data.json`.'})
                        .setTimestamp()

                    await interaction.editReply({ embeds: [successEmbed] })
            } catch (error) {
                console.error(error)
                await interaction.editReply({ 
                    embeds: [new EmbedBuilder().setTitle('An error occurred!')
                    .addFields({ name: 'err', value: err })
                    .setTimestamp()
                    .setColor('Red')
                    ] 
                })
            }
        } else {
            await interaction.editReply({ 
                embeds: [
                    new EmbedBuilder().setTitle('You are not an authorized user!')
                    .setTimestamp()
                    .setColor('Red')
                ] 
            })
        }
    }
}