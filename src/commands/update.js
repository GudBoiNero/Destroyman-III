const { SlashCommandBuilder, CommandInteraction, EmbedBuilder } = require('discord.js')
const { AUTHORIZED_USERS, GITHUB_PRIVATE_KEY } = require('../config.json')
const { exec } = require('child_process')
const { consoleColors } = require('../util/consoleColors')
 
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
                exec(`bash update.sh ${GITHUB_PRIVATE_KEY}`, async (error, stdout, stderr) => {
                    console.log(consoleColors.FG_MAGENTA+'Updating...')
                    console.log(consoleColors.FG_GRAY+stdout);
                    console.log(consoleColors.FG_GRAY+stderr);
                    
                    if (error !== null) {
                        console.log(`exec error: ${consoleColors.FG_RED+error}`);
                    }

                    const embed = new EmbedBuilder().setTitle('Successfully Updated!')
                        .addFields(
                            { name: 'stdout', value:'```'+`${stdout}`+'```' },
                            { name: 'stderr', value:'```'+`${stderr}`+'```' }
                        ).setTimestamp()

                    await interaction.editReply({embeds: [embed]})
                });
            } catch {
                await interaction.editReply('An error occurred while fetching updating...')
            }
        } else {
            await interaction.editReply('You are not an authorized user!')
        }
    }
}