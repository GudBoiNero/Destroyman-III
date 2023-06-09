const { CommandInteraction, SlashCommandBuilder } = require('discord.js')

// https://stackoverflow.com/questions/1584370/how-to-merge-two-arrays-in-javascript-and-de-duplicate-items
function arrayUnique(array) {
    var a = array.concat();
    for(var i=0; i<a.length; ++i) {
        for(var j=i+1; j<a.length; ++j) {
            if(a[i] === a[j])
                a.splice(j--, 1);
        }
    }

    return a;
}

module.exports = {
    Requirements: { // Talents and Mantras are always the same (they should be at least)
        "Talents": [
            "power", 
            "strength", 
            "fortitude", 
            "agility", 
            "intelligence", 
            "willpower", 
            "charisma", 
            "flamecharm", 
            "frostdraw", 
            "thundercall", 
            "galebreathe", 
            "shadowcast", 
            "ironsing", // :eyes:
            "medium_wep", 
            "heavy_wep", 
            "light_wep"
        ],
        "Mantras": [
            "power", 
            "strength", 
            "fortitude", 
            "agility", 
            "intelligence", 
            "willpower", 
            "charisma", 
            "flamecharm", 
            "frostdraw", 
            "thundercall", 
            "galebreathe", 
            "shadowcast", 
            "ironsing", // can't believe it's real (5/20/2023) - pssst. it's not real *yet*...
            "medium_wep", 
            "heavy_wep", 
            "light_wep"
        ],
        "Weapons": [
            "power", 
            "strength", 
            "fortitude", 
            "agility", 
            "intelligence", 
            "willpower", 
            "charisma", 
            "flamecharm", 
            "frostdraw", 
            "thundercall", 
            "galebreathe", 
            "shadowcast", 
            "medium_wep", 
            "heavy_wep", 
            "light_wep",
            "damage",
            // "max_damage", // whenever this isn't null uncomment it
            "penetration",
            "chip",
            "weight",
            "range", 
            "swing_speed",
            "endlag"
        ],
        "Outfits": [
            "power", 
            "strength", 
            "fortitude", 
            "agility", 
            "intelligence", 
            "willpower", 
            "charisma"
        ]
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
                option.setName(`${name}`).setDescription(`Int Range of ${name}. Check /help for more info.`)
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
        getRanges = (reqNames) => {
            let result = {}
            for (let index = 0; index < reqNames.length; index++) {
                const reqName = reqNames[index];
                const option = this.getOption(reqName)

                if (!option) continue

                // Check if the value is a range
                if (option.value.includes(':')) {
                    let reqRange = option.value.split(':')
                    // !isNaN prevents it from thinking 0 == false in this case
                    if (!isNaN(parseInt(reqRange[0])) && !isNaN(parseInt(reqRange[1]))) {
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
                } else if (!isNaN(parseInt(option.value))) {
                    result[reqName] = parseInt(option.value)
                }
            }
            return result
        }
    },
}