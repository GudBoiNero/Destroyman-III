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
Ensure that `config.json` is added to .gitignore to prevent security issues. (By default it should always be inside of .gitignore)

#### Running the Bot
Go to [Discord Applications](https://discord.com/developers/applications) and create a Bot for yourself. 
Open your command prompt or terminal and `cd` to the location of the bot's folder. (Wherever you have placed it)
Run `node .` and the bot will start up.

# Notes
- DO **NOT** EDIT `parseConfig.json`.

