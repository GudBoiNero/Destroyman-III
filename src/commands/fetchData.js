const { SlashCommandBuilder, CommandInteraction, } = require('discord.js')
const { AUTHORIZED_USERS } = require('../config.json')
const { fetchData } = require('../util/fetchData.js')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('fetch_data')
        .setDescription('Refreshes the data of the bot. Useable only by authorized users.'),
    /**
     * 
     * @param { CommandInteraction } interaction 
     */
    async execute(interaction) {
        const user = interaction.user;
        const userId = user.id;

        await interaction.deferReply({ephemeral: true})
        if (AUTHORIZED_USERS.includes(userId)) {
            await interaction.editReply('Fetching Data...')
            try {
                await fetchData()
                await interaction.editReply('Successfully Fetched Data!')
            } catch (error) {
                console.error(error)
                await interaction.editReply('An error occurred while fetching data...')
            }
        } else {
            await interaction.editReply('You are not an authorized user!')
        }
    }
}