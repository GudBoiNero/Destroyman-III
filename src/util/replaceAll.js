module.exports = {
    /**
     * @param {String} string 
     * @param {String} searchString 
     * @param {String} replaceString 
     * @returns {String}
     */
    replaceAll(string, searchString, replaceString) {
        // While string has searchValue- call String.replace
        while (string.includes(searchString)) {
            string = string.replace(searchString, replaceString)
        }
        return string
    },
    /**
     * @param {String} string 
     * @param {Array<String>} searchList 
     * @param {String} replaceString 
     * @returns {String}
     */
    replaceAllInList(string, searchList, replaceString) {
        // For all in searchList replaceAll 
        for (let index = 0, length = searchList.length; index < length; index++) {
            string = module.exports.replaceAll(string, searchList[index], replaceString)
        }
        return string
    }
}