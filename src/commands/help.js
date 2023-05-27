const { SlashCommandBuilder, EmbedBuilder, CommandInteraction } = require('discord.js')
const fs = require('fs')
const commandInfo = JSON.parse(fs.readFileSync('res/data/command.info.json', {encoding: 'utf-8'}))

console.log(commandInfo)

module.exports = {
    data: new SlashCommandBuilder().setName('help')
        .setDescription('Describes what certain commands do.')
        .addStringOption(option => option.setName('command')
            .setDescription('Which command would you like to know about?')
            .addChoices(
            {name: 'find_enchant', value: 'find_enchant'},
            {name: 'find_mantra', value: 'find_mantra'},
            {name: 'find_mystic', value: 'find_mystic'},
            {name: 'find_outfit', value: 'find_outfit'},
            {name: 'find_talent', value: 'find_talent'},
            {name: 'find_weapon', value: 'find_weapon'},
            {name: 'refresh_data', value: 'refresh_data'},
            {name: 'update', value: 'update'}
        )),
    /**
     * 
     * @param {CommandInteraction} interaction 
     */
    async execute(interaction) {
        const helpCommandOption = interaction.options.get('command')

        if (helpCommandOption) {
            var helpCommandName = helpCommandOption.value
        }

        await interaction.deferReply({ephemeral: true})

        const embed = new EmbedBuilder().setTitle('Help Menu')
            .setColor('Green')
        if (!helpCommandName) {
            embed.addFields(
                {name: 'Description', value: '**/help** will display a helpful guide on how to use each individual command! **If some guides do not work, or do not make sense. Please DM GudBoiNero#6650!**'},
                {name: 'Guide', value: 'To use /help- you can either use the command barebones or use the `command` option to display help info about other commands. Each option corresponds to a command that the bot has. Using any of the `find_x` commands will display all entries if used without any options.'},
                {name: 'Keywords and Notes', value: `- **String Query:** This means to check if a string is within a string. For example: 'llo wo' is within 'hello world'. \n- **Int Range:** This is a range of numbers used within many different commands. There are a few different ways to use them. ${"`"}50:100${"`"} is a range from 50 to 100. ${"`"}30+${"`"} is a range from 30 to 100. and ${"`"}60-${"`"} is a range from 0 to 60.\n- **Req Range:** A list of Int Ranges.`}
                )
                .setTimestamp()

        } else {
            embed.setTitle(`Help Menu [${helpCommandName}]`)
                .addFields(
                    {name: 'Description', value: commandInfo[helpCommandName]['description']},
                    {name: 'Guide', value: commandInfo[helpCommandName]['guide']},
                )
        }

        await interaction.editReply({embeds: [embed]})
    }
}