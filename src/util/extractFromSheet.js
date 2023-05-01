const fs = require('fs');

var parser = new (require('simple-excel-to-json').XlsParser)();
var doc = parser.parseXls2Json('res/spreadsheets/latest.DeepwokenInfoSpreadsheet.xlsx');
const headers = [
    "Talents",
    "Mantras",
    "Weapons",
    "Outfits",
    "MYSTIC",
    "Enchants",
    "Sheet7",
    "Credits",
    "Meta"
]

if (fs.existsSync('res/raw_data/latest.data.json')) {
    const latestData = fs.readFileSync('res/raw_data/latest.data.json', { encoding: 'utf8', flag: 'r' })
    // Copy over latest data to a timestamped version incase we need backups

}


fs.writeFileSync('res/raw_data/latest.data.json', JSON.stringify(prepareDoc(doc), null, "\t"))

function prepareDoc(doc) {
    doc = addHeaders(doc)
    doc = mergeEmptyEntries(doc)

    return doc
}

function addHeaders(array) {
    let data = {}

    for (var i = 0, length = array.length; i < length + 1 /* Extra one to add on the 'Meta'*/; i++) {
        data[headers[i]] = array[i]
    }


    data["Meta"] = { "date_created": `${getFormattedTimestamp()}` }

    return data
}

function mergeEmptyEntries(dict) {

    for (var headerIndex = 0, length = Object.keys(dict).length; headerIndex < length; headerIndex++) {
        const header = headers[headerIndex]
        const headerData = dict[header]

        if (header == 'Meta' || header == undefined) continue;

        var lastEntry

        for (var i = 0, length = headerData.length; i < length; i++) {
            const entry = headerData[i]

            // If this is the first entry
            if (!lastEntry) {
                lastEntry = entry
            } 
            // If lastEntry is valid
            else {
                // If entry is a description to lastEntry
                if (lastEntry.Name != "" && entry.Name == "") {
                    lastEntry.Description += "\n" + entry.Description 

                    // Add empty
                    headerData[i] = {}
                } else if (lastEntry.Name != "" && entry.Name != "") {
                    lastEntry = entry
                }
            }
        }

        // Remove empties
        for (var i = 0, length = headerData.length; i < length; i++) {
            if (headerData[i] == undefined) continue;
            if (Array.isArray(headerData[i])) continue;

            if (Object.keys(headerData[i]).length === 0) {
                headerData.splice(i, 1)
                i--
            }
        }
    }

    return dict
}

function getFormattedTimestamp() {
    var dateObj = new Date();
    var month = dateObj.getUTCMonth() + 1; //months from 1-12
    var day = dateObj.getUTCDate();
    var year = dateObj.getUTCFullYear();

    return `${year}-${month}-${day}`
}