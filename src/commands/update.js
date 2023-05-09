const { SlashCommandBuilder, CommandInteraction, } = require('discord.js')
const { AUTHORIZED_USERS } = require('../config.json')
const { exec } = require('child_process')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('update')
        .setDescription('Pulls new data from the github repo, and restarts the bot.'),
    /**
     * 
     * @param { CommandInteraction } interaction 
     */
    async execute(interaction) {
        const user = interaction.user;
        const userId = user.id;

        await interaction.deferReply({ephemeral: true})
        if (AUTHORIZED_USERS.includes(userId)) {
            await interaction.editReply('Pulling from repo...')
            try {
                const update = exec('bash ../../update.sh', (error, stdout, stderr) => {
                    console.log(stdout);
                    console.log(stderr);
                    if (error !== null) {
                        console.log(`exec error: ${error}`);
                    }
                });

                await interaction.editReply('Successfully updated!')
            } catch {
                await interaction.editReply('An error occurred while fetching updating...')
            }
        } else {
            await interaction.editReply('You are not an authorized user!')
        }
    }
}