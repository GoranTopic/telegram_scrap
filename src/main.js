import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import input from "input";
import fs from "fs";
import Checklist from "checklist-js";
// dot env
import dotenv from "dotenv";
dotenv.config();

/* this is the test of the telegram help */

const apiHash = process.env.API_HASH;

// make api into a nuber
const apiId = Number(process.env.API_ID);
const stringSession = new StringSession("1AQAOMTQ5LjE1NC4xNzUuNTEBu4HugkJMM/D80NewrlGU/ZvoM6mb/Pa8T1VfHiu7StrHp4fNEXuhnkDLNMhP6vVnVcIU0vqTSErGJGk6IN4JTEEu3z4CklItzc2d3rDqTAuUOkA/Xm+dlrCrKGAJI5tsypAf2SEoTmwxubbLp+SPKjPfr77f+H0qINzNNM9TLRe6mUrqcYTWmO7QbzSgkVHV7mBIiOgogirCiJR65hyy7acGxQYPPlWyBjo1+TfP3JqeWYdwd9/1hILkhXXKokgjsorslgWwjQpyk+IlgitegitdbMs6DABq1CEEPTmqQXMwgmWgyt37GMpME9Pbu6KUAyiyndgMdPNEWm6UN27D+uM="); // fill this later with the value from session.save()

// let cedulas path 
const cedulas_path = "./storage/cedulas/cedulas_09.txt";

// read cedulas
let cedulas = fs.readFileSync(cedulas_path, "utf8").split("\n");

// make checklist
console.log('making checklist...');
let cedula_checklist = new Checklist(cedulas);
console.log('checklist made!');

// make client
console.log("Loading interactive example...");
const client = new TelegramClient(stringSession, apiId, apiHash, {
	connectionRetries: 5,
});
	
await client.start({ 
	phoneNumber: async () => await input.text("Please enter your number: "),
	password: async () => await input.text("Please enter your password: "),
	phoneCode: async () =>
	await input.text("Please enter the code you received: "),
	onError: (err) => console.log(err),
});

console.log("You should now be connected."); // save the session key
new StringSession( client.session.save() ); // Save this string to avoid logging in again


// get new cedula
let cedula = cedula_checklist.next();
console.log('cedula_checklist: ', cedula_checklist.next());

while(true){
	// query cedula
	await client.sendMessage("Cneecuador_bot", { message: cedula });

	// check cedula off
	cedula_checklist.check(cedula);

	// waiting for a random second between 5 to 10 seconds
	let seconds = Math.floor(Math.random() * 5) + 5;
	console.log('waiting for: ', seconds, ' seconds');
	await new Promise(r => setTimeout(r, seconds * 1000));

	// get new cedula
	cedula = cedula_checklist.next();
}

