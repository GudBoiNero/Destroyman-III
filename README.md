# Setup

#### Bot Configuration
Create a `config.json` file inside of `src`. And create two entries within a JSON dictionary-
```json
{
    "CLIENT_TOKEN": "[YOUR_DISCORD_BOT_TOKEN]",
    "CLIENT_ID": "[YOUR_DISCORD_BOT_CLIENT_ID]"
}
```
Ensure that `config.json` is added to .gitignore to prevent security issues.

# Notes

#### JSON
- If JSON is mad about comments not being permitted- Check [this](https://stackoverflow.com/questions/47834825/in-vs-code-disable-error-comments-are-not-permitted-in-json) out.

- Ensure that within `parseConfig.json` all `sheet_specific` entries are lowercase. The parser will automatically convert all parsed headers to lowercase, so if your entries are uppercase they will not correctly replace things.
