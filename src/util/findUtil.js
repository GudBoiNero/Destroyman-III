const { CommandInteraction, SlashCommandBuilder } = require('discord.js')

module.exports = {
    Requirements: {
        "Talents": ["power", "strength", "fortitude", "agility", "intelligence", "willpower", "charisma", "flamecharm", "frostdraw", "thundercall", "galebreathe", "shadowcast", "medium_wep", "heavy_wep", "light_wep"],
        "Mantras": ["power", "strength", "fortitude", "agility", "intelligence", "willpower", "charisma", "flamecharm", "frostdraw", "thundercall", "galebreathe", "shadowcast", "medium_wep", "heavy_wep", "light_wep"],
        "Weapons": ["power", "strength", "fortitude", "agility", "intelligence", "willpower", "charisma", "flamecharm", "frostdraw", "thundercall", "galebreathe", "shadowcast", "medium_wep", "heavy_wep", "light_wep"],
        "Outfits": ["power", "strength", "fortitude", "agility", "intelligence", "willpower", "charisma"]
    },
    /**
     * 
     * @param {String} word 
     * @returns {String}
     */
    capitalize(word) {
        const lower = word.toLowerCase();
        return word.charAt(0).toUpperCase() + lower.slice(1);
    },
    /**
     * 
     * @param {SlashCommandBuilder} builder 
     */
    setRequirements(builder, requirements) {
        for (let index = 0; index < requirements.length; index++) {
            const name = requirements[index];

            builder.addStringOption(option =>
                option.setName(`${name}`).setDescription(`Maximum requirement of ${name}. int:int to denote minimum / maximum.`)
            )
        }
    },
    QueryHelper: class QueryHelper {
        /**
         * 
         * @param {CommandInteraction} interaction 
         */
        constructor(interaction) {
            this.interaction = interaction
            this.options = this.interaction.options
            return this
        }
        /**
         * @param {String} name 
         * @returns {any}
         */
        getOption = (name) => {
            for (let index = 0; index < this.options._hoistedOptions.length; index++) {
                const option = this.options._hoistedOptions[index];
                if (option.name == name) return option
            }
        }

        /**
         * @param {Number} val 
         * @param {Number} min 
         * @param {Number} max 
         * @returns {Boolean}
         */
        testRange = (val, min, max) => val >= min && val <= max;

        /**
         * @param {Number} val 
         * @param {Number} min 
         * @param {Number} max 
         * @param {Number} exact 
         * @returns {Boolean}
         */
        testRangeOrEquality = (val, min, max, exact) => this.testRange(val, min, max) || val == exact;

        /**
         * 
         * @param {String} optionName 
         * @param {String} valueName 
         * @returns {Boolean}
         */
        testQueryHeader = (entry, optionName, valueName) => {
            if (this.getOption(optionName) != undefined) {
                const value = this.getOption(optionName).value.toLowerCase()
                return (entry[valueName].toLowerCase()).includes(value);
            } else return true
        }

        /**
         * 
         * @param {String[]} reqNames 
         * @returns 
         */
        getReqs = (reqNames) => {
            let result = {}
            for (let index = 0; index < reqNames.length; index++) {
                const reqName = reqNames[index];
                const option = this.getOption(reqName)

                if (!option) continue

                // Check if the value is a range
                if (option.value.includes(':')) {
                    let reqRange = option.value.split(':')
                    if (parseInt(reqRange[0]) && parseInt(reqRange[1])) {
                        result[reqName] = {
                            min: Math.min(parseInt(reqRange[0]), parseInt(reqRange[1])),
                            max: Math.max(parseInt(reqRange[0]), parseInt(reqRange[1]))
                        }
                    }
                }
                // If not, check if the input is actually a number
                else if (option.value.includes('-') || option.value.includes('+')) {
                    // Check if there is a + or - after number
                    const value = parseInt(option.value)
                    const opp = option.value[value.toString().length]
                    if (opp == '+') {
                        result[reqName] = {
                            min: value,
                            max: 10000
                        }
                    } else {
                        result[reqName] = {
                            min: 0,
                            max: value
                        }
                    }
                } else if (parseInt(option.value)) {
                    result[reqName] = parseInt(option.value)
                }
            }
            return result
        }
    },
}