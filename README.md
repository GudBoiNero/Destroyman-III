# Setup

### Node.js
Go to [nodejs.org](https://nodejs.org/en/download) and download Node.js.
Make sure to get v18.6.0 or above.

#### Bot Configuration
Create a `config.json` file inside of `src`. And create two entries within a JSON dictionary-
```json
{
    "CLIENT_TOKEN": "T0ta11Y.RaNd0MNUM83Rs",
    "CLIENT_ID": "012345679999",
    "AUTHORIZED_USERS": [
        "111111111111111"
    ],
    "GITHUB_PRIVATE_KEY": "T0ta11Y.RaNd0MNUM83Rs19184839",
    "REFRESH_DATA": true
}
```
Ensure that `config.json` is added to .gitignore to prevent security issues.

#### Running the Bot
Go to [Discord Applications](https://discord.com/developers/applications) and create a Bot for yourself. 
Open your command prompt or terminal and `cd` to the location of the bot's folder. (Wherever you have placed it)
Run `node .` and the bot will start up.

# Notes

### JSON
- If JSON is mad about comments not being permitted- Check [this](https://stackoverflow.com/questions/47834825/in-vs-code-disable-error-comments-are-not-permitted-in-json) out.

- Ensure that within `parseConfig.json` all `sheet_specific` entries are lowercase. The parser will automatically convert all parsed headers to lowercase, so if your entries are uppercase they will not correctly replace things.
