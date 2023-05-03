const fs = require('fs')

module.exports = {
    getSheet(name) {
        const data = fs.readFileSync('res/raw_data/latest.data.json', { encoding: 'utf8', flag: 'r' })
        const sheet = JSON.parse(data)[name]

        return sheet
    }
}