# Development
Coming soon.
# Setup
- Go to [nodejs.org](https://nodejs.org/en/download) and download Node.js. Make sure to get v18.6.0 or above.
- Create a `config.json` file inside of `src`. And create two entries within a JSON dictionary-
    ```json
    {
        /**** DELETE ALL COMMENTS IN THIS FILE BEFORE RUNNING ****/
        "CLIENT_TOKEN": "T0ta11Y.RaNd0MNUM83Rs", // Your bot's token
        "CLIENT_ID": "012345679999", // Your bot's client ID
        "AUTHORIZED_USERS": [ // Which users are allowed to manually update and refresh the data of the bot.
            "111111111111111" // Your user ID
        ],
        "GITHUB_PRIVATE_KEY": "T0ta11Y.RaNd0MNUM83Rs19184839",
        "REFRESH_DATA": true, // Whether or not the bot refreshes data on startup
        "ALLOW_UPDATING": true // Whether or not the bot will update on /update
    }
    ```
- Ensure that `config.json` is added to .gitignore to prevent security issues. (By default it should always be inside of .gitignore)
- Go to [Discord Applications](https://discord.com/developers/applications) and create a Bot for yourself. 
- Open your command prompt or terminal and `cd` to the location of the bot's folder. (Wherever you have placed it)
- Run `node .` and the bot will start up.

# Notes
- DO **NOT** EDIT `parseConfig.json` unless you know what you're doing. 

