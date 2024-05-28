# Telegram Redmine Notification Bot

## Project Overview
Redmine Telegram Notification is a Telegram bot designed to notify users about updates and status changes of issues in Redmine. Developed for personal use, this project can be utilized by others, and feedback is greatly appreciated. <br>
For any inquiries or suggestions, reach out via Telegram: [@danek_kulikov](https://t.me/danek_kulikov)

## Table of Contents
- [Development Rules](#development-rules)
- [Installation](#installation)
- [Configuration](#configuration)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [Running the Bot](#running-the-bot)
- [Functionality](#functionality)

## Development Rules

1. For a new feature or fix, create a branch from `Main` with a descriptive name, for example: `fixCalendarApi`.
2. Test to ensure everything is working fine, then create a PR to merge this branch into the `Dev` branch.
3. Verify in the `Dev` branch that everything is working correctly, possibly checking all the functionality with someone else, and then create a PR to merge `Dev` into `Main`.
4. You are awesome (broke everything again).

## Installation

To get started with BIV Redmine Notification Bot, clone the repository and install the dependencies.

```shell
git clone https://github.com/zonder12120/redmine-telegram-notification.git
```

```shell
cd redmine-telegram-notification
```

```
npm install
```

## Setting up Prettier

### Visual Studio Code
1. Install the Prettier extension (Prettier - Code formatter) from the extensions marketplace.
2. In Visual Studio Code settings, set Prettier as the default formatter: `File` > `Preferences` > `Settings` > `Text Editor` > `Formatting`.

### WebStorm
1. In WebStorm settings, follow this path: `Settings` > `Languages & Frameworks` > `JavaScript` > `Prettier`.
2. Select the `manual configuration` option, and the package path should be automatically detected.
3. Check the `Run Reformat code action` and `Run on save` options.

## Configuration
Create a `.env` file in the root directory of the project with the following environment variables:
- `TELEGRAM_BOT_TOKEN`: The token for your Telegram bot.
- `CHAT_ID`: The chat ID where the bot will send notifications.
- `REDMINE_API_KEY`: Your API key for Redmine.
- `BASE_URL`: Base URL for your Redmine instance like https://redmine.your-company.com

**ATTENTION, CUSTOM RUSSIAN HOLIDAY CALENDAR IN USE!** <br>
If you are not from Russia, you can find an API for your country's calendar. I don't think there would be any difficulties with that.

Example `.env` file:
```dotenv
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
CHAT_ID=your_chat_id
REDMINE_API_KEY=your_redmine_api_key
BASE_URL=https://redmine.your-company.com
```
**GOOGLE_CALENDAR_KEY** - well-known key for accessing a custom Google calendar, this is present in the `config.ts`. You can use any other API to obtain holiday days, this is done in the file `time.ts`.

## Available Scripts
In the project directory, you can run:

`npm run build`
Compiles the TypeScript files into JavaScript.

`npm start`
Compiles the TypeScript files and starts the bot.

`npm test`
Runs tests (not specified).

## Project Structure
The project structure includes the following key files:

- **config.ts:** Handles the configuration by loading environment variables.
- **redmine.ts:** Contains functions to interact with the Redmine API.
- **time.ts:** Functions to handle date and time, including working hours and holidays.
- **notifications.ts:** Handles sending notifications via Telegram.
- **telegram.ts:** Utility functions to send messages via the Telegram bot.
- **app.ts:** Main application file, initializes and runs the bot.

## Running the Bot
Before running the bot, ensure the environment variables are set correctly in the .env file. Then, build and start the bot using the following commands:
```Shell
npm run build
```

```Shell
npm start
```
The bot will start running, checking for updates every minute, and sending notifications for new issues, status updates, and comments.

## Functionality

### Issue Management
- **Fetching Issues:** Retrieves the list of current issues from Redmine.
- **Ignoring Certain Issues:** Certain issues can be ignored based on their ID.
- **Filtering Updates:** Filters issues based on status and tracks updates.

### Notifications
Various types of notifications are sent via Telegram:
- **New Issues:** Notifies about newly added issues.
- **Status Updates:** Notifies when the status of an issue changes.
- **Comments:** Notifies when a comment is added to an issue.
- **Delayed Notifications:** Collects notifications during non-working hours and sends them during working hours.

### Time Management
- **Work Time Check:** Verifies if the current time falls within working hours.
- **Holidays:** Integrates with Google Calendar to check for holidays.

### Utility Functions
- Date Formatting: Formats the current date and time for consistent logging.
- Error Handling: Logs errors with timestamps.

Feel free to contribute, fork, or suggest improvements. Your feedback is valuable in making this bot more efficient and user-friendly. For further assistance or to report issues, please contact via Telegram: [@danek_kulikov](https://t.me/danek_kulikov)

For a full explanation of the code and more detailed instructions, please refer to each file's comments and functions within the codebase.
