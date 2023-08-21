const TelegramBot = require('node-telegram-bot-api');

// Replace 'YOUR_API_TOKEN' with your actual bot's API token
const API_TOKEN = '6621600500:AAHvdymmp75wbgiA0Hvoafg--ZUOiixOQ78';

// Create a new bot instance
const bot = new TelegramBot(API_TOKEN, { polling: false });  // Set polling to true if you want to receive updates

function sendMessagetoUser(chatId, messageText) {
    bot.sendMessage(chatId, messageText)
        .then(() => {
            console.log('Message sent successfully');
        })
        .catch((error) => {
            console.error('Error sending message:', error);
        });
}

// Replace 'USER_CHAT_ID' with the actual user's chat ID
const userChatId = 'USER_CHAT_ID';
const message = 'Hello! This is a message from your Telegram bot.';

sendMessagetoUser(userChatId, message);

