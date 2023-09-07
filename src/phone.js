import { TelegramClient, Api } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import input from "input";
import Slavery from 'slavery-js';
import fs from 'fs';
// dot env
import dotenv from "dotenv";
dotenv.config();

const cne_bot = "Cneecuador_bot";

// make api into a nuber
const app_apiId = Number(process.env.API_ID);
// get the api hash
const app_apiHash = process.env.API_HASH;

// let get the phone number from the params passed
const phone_number = process.argv[2];
console.log('initilizing with phone: ', phone_number);
if(!phone_number){
    console.log('Please pass the phone number as a param');
    process.exit(1);
}


// get slave session id from memory or not
const phone_session_id = (fs.existsSync(`./storage/${phone_number}.session`)) ?
fs.readFileSync(`./storage/${phone_number}.session`, 'utf8') : '';

// fill this later with the value from session.save()
const stringSession = new StringSession(phone_session_id); 

// make client
console.log("Making telegram client...");
const client = new TelegramClient(stringSession, app_apiId, app_apiHash, {
	connectionRetries: 5,
});

// login with client
await client.start({ 
	phoneNumber: phone_number,
	password: async () => await input.text("Please enter your password: "),
	phoneCode: async () =>
	await input.text("Please enter the code you received: "),
	onError: (err) => console.log(err),
});

// you shoudl now be logged in
console.log("You should now be connected.");

// save the session key
fs.writeFileSync(`./storage/sessions_ids/${phone_number}.session`, 
	client.session.save() // Save this string to avoid logging in again
);


// get the chat
Slavery({
	numberOfSlaves: 1,
	port: 3000,
	host: 'localhost'
}).slave( async cedula => {
	console.log('scrapping cedula: ', cedula);
	// query cedula
	await client.sendMessage(cne_bot, { message: cedula });
	// wait from 0 to 50 seconds
	let seconds = Math.floor(Math.random() * 50);
	console.log('waiting for: ', seconds, ' seconds');
	await new Promise(r => setTimeout(r, seconds * 1000));
	// get photo message
	const messages = await client.getMessages( cne_bot,
		{ limit: 1, filter: Api.InputMessagesFilterPhotos }
	)
	console.log(messages.total)
	// the order could be accending or descending
	let message = messages[0];
	// download the photo
	const buffer = await client.downloadMedia( message,
		{ progressCallback : console.log } 
	)
	// send the master back to the master
	return buffer;
});

