// WIP

const secret = "FfaF4gs%a7Hh4^gds68!#hGG";

const http = require('http');
const crypto = require('crypto');

module.exports = {
    initWebhook() {
        http.createServer(function (req, res) {
            req.on('data', function(chunk) {
                let sig = "sha1=" + crypto.createHmac('sha1', secret).update(chunk.toString()).digest('hex');
    
                console.log(req.headers['x-hub-signature'] == sig, req)
                if (req.headers['x-hub-signature'] == sig) {
                    // Run update.js
                }
            });
    
            res.end();
        }).listen(25100);
        // test again
    }
}