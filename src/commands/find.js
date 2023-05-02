const { SlashCommandBuilder, SlashCommandSubcommandBuilder } = require('discord.js')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('find')
        
        .addSubcommand(subcommand => 
            subcommand.setName('talent')
                .setDescription('Find a certain talent.')
                .addStringOption(option => 
                    option.setName('name')
                        .setDescription('The name to search for...')))
        .addSubcommand(subcommand => 
            subcommand.setName('mantra')
                .setDescription('Find a certain mantra.')
                .addStringOption(option => 
                    option.setName('name')
                        .setDescription('The name to search for...')))
        .addSubcommand(subcommand => 
            subcommand.setName('weapon')
                .setDescription('Find a certain weapon.')
                .addStringOption(option => 
                    option.setName('name')
                        .setDescription('The name to search for...')))
        .addSubcommand(subcommand => 
            subcommand.setName('mystic')
                .setDescription('Find a certain mystic option.')
                .addStringOption(option => 
                    option.setName('name')
                        .setDescription('The name to search for...')))
        .addSubcommand(subcommand => 
            subcommand.setName('enchant')
                .setDescription('Find a certain enchant.')
                .addStringOption(option => 
                    option.setName('name')
                        .setDescription('The name to search for...')))

                
        .setDescription('Replies with the details of your talent, based on the input.'),
    async execute(interaction) {
        await interaction.reply('Pong!')
    }
}

