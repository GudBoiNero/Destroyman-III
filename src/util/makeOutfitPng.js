const fs = require('fs')
const { createCanvas, loadImage, registerFont, Image } = require('canvas')

registerFont('./res/fonts/fondamento_regular.ttf', { family: 'Fondamento-Regular' })

const width = 800
const height = 400
const theme = {
    SheetTextColor: '#414434',
    BackgroundColor: '#2c3033'
}

module.exports = {
    /**
     * @description Returns an absolute path of the resulting image. Or `null` if an error occured.
     * @param {String} path A path to the image file
     * @param {Object} data 
     * @returns {String}
     */
    makeOutfitPng(path, data = {}) {
        const canvas = createCanvas(width, height)
        const ctx = canvas.getContext('2d')

        let backgroundImage = new Image()
        backgroundImage.src = './res/images/outfit_background.png'
        ctx.drawImage(backgroundImage, 0, 0, width, height)

        try {
            loadImage(path).then(image => {
                ctx.drawImage(image, 427, 29, image.naturalWidth, image.naturalHeight)

                const buffer = canvas.toBuffer('image/png')
                fs.writeFileSync('./res/images/result.png', buffer)
            })
        }
        catch {
            return 'res/images/failed.png'
        }

        return 'res/images/result.png'
    }
}