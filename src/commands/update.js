const { SlashCommandBuilder, CommandInteraction, EmbedBuilder } = require('discord.js')
const { AUTHORIZED_USERS, GITHUB_PRIVATE_KEY, ALLOW_UPDATING } = require('../config.json')
const { exec } = require('child_process')
const { consoleColors } = require('../util/consoleColors')
const commandInfo = require('../../res/data/command.info.json')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('update')
        .setDescription(commandInfo.update.description),
    /**
     * 
     * @param { CommandInteraction } interaction 
     */
    async execute(interaction) {
        const user = interaction.user;
        const userId = user.id;

        await interaction.deferReply({ ephemeral: true })

        if (!ALLOW_UPDATING) {
            return await interaction.editReply({ 
                embeds: [
                    new EmbedBuilder().setTitle('Update Failed!')
                    .setFooter({text: 'Updating has been disabled!'})
                    .setTimestamp()
                    .setColor('Red')
                ] 
            })
        }

        if (AUTHORIZED_USERS.includes(userId)) {
            await interaction.editReply({ embeds: [new EmbedBuilder().setTitle('Updating...').setTimestamp()] })
            try {
                exec(`bash src/update.sh ${GITHUB_PRIVATE_KEY}`, async (error, stdout, stderr) => {
                    console.log(consoleColors.FG_MAGENTA + 'Updating...')

                    console.log(consoleColors.FG_BLUE+stdout)

                    if (error !== null) {
                        console.log(consoleColors.FG_RED +`exec error: ${error}`);
                    }

                    const successEmbed = new EmbedBuilder().setTitle('Successfully Updated!')
                        .setColor('Green')
                        .setFooter({text: 'The changes will not apply until the bot has been restarted.'})
                        .setTimestamp()

                    await interaction.editReply({ embeds: [successEmbed] })
                });
                exec(`node .`)
                interaction.client.destroy()
            } catch (err) {
                await interaction.editReply({ 
                    embeds: [new EmbedBuilder().setTitle('Update Failed!')
                    .setFooter({text: 'An error occurred.'})
                    .addFields({ name: 'err', value: err })
                    .setTimestamp()
                    .setColor('Red')
                    ] 
                })
            }
        } else {
            await interaction.editReply({ 
                embeds: [
                    new EmbedBuilder().setTitle('Update Failed!')
                    .setFooter({text: 'You are not an authorized user!'})
                    .setTimestamp()
                    .setColor('Red')
                ] 
            })
        }
    }
}