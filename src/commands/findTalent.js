const { SlashCommandBuilder } = require('discord.js')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('find_talent')

        .addStringOption(option =>
            option.setName('search_type')
                .setDescription('The element to search to determine your talent.')
                .setRequired(true)
                .addChoices(
                    { name: 'Name', value: 'search_names' },
                    { name: 'Description', value: 'search_desc' },
                ))
                
        .setDescription('Replies with the details of your talent, based on the input.'),
    async execute(interaction) {
        await interaction.reply('Pong!')
    }
}

