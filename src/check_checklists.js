import fs from "fs";
import Checklist from "checklist-js";
/* will just update the checklist depending on the files that are in the folder storage/images/ */


// a list from 1 to 30
let cedulas_prefix = [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
17, 18, 19, 20, 21, 22, 23, 24, 30 ]

// read every file in the cedulas/ folder

// for every file make a checklist


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

