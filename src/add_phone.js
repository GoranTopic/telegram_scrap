import { TelegramClient, Api } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import input from "input";
import fs from 'fs';
// dot env
import dotenv from "dotenv";
dotenv.config();

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


let phone_session_id = '';
// get slave session id from memory or not
if(fs.existsSync(`./storage/sessions/${phone_number}.session`)){
    console.log(`Found session for ${phone_number}`);
    phone_session_id = fs.readFileSync(`./storage/sessions/${phone_number}.session`, 'utf8');
}

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
	//password: async () => await input.text("Please enter your password: "),
	phoneCode: async () => await input.text("Please enter the code you received: "),
	onError: (err) => console.log(err),
});

// you shoudl now be logged in
console.log("You should now be connected.");

// save the session key
fs.writeFileSync(`./storage/sessions/${phone_number}.session`, 
	client.session.save() // Save this string to avoid logging in again
);

const cne_bot = "Cneecuador_bot";
// query cedula
await client.sendMessage(cne_bot, { message: cedula });
// wait for response
let hasResponded = false;
// seconds waited
let seconds = 0;
console.log(` waiting for response...`);
while(!hasResponded){ // while sever has not responded
    // get last two messages
    let messages = await client.getMessages( cne_bot, { 
        //filter: Api.InputMessagesFilterPhotos,
        limit: 2, // limit of two messages
        id: [1, 2], // get the last two messages
    })
    // wait for one second with set timeout
    await new Promise(r => setTimeout(r, 1 * 1000));
    // if the last message is the one we sent, then wait for a new message
    if(messages[0]?.message === cedula){
        process.stdout.write('.');
        seconds++;
        hasResponded = false;
        //else if we got the geo location and image
    }else if(messages[0].geo && messages[1].media){
        // print newline
        console.log('');
        console.log(`got geo location and image`);
        // download the photo
        let image_buffer = await client.downloadMedia(messages[1], { progressCallback : console.log })
        // get the geo location
        let geo_loc = messages[0].geo
        // delete the accessHash so that it can be serialized
        delete geo_loc.accessHash
        // save image
        fs.writeFileSync(`./storage/images/${cedula}.png`, image_buffer);
        console.log(`geo_loc: `, geo_loc);
        // save geo loc js object
        fs.writeFileSync(`./storage/geo_locs/${cedula}.json`, JSON.stringify(geo_loc));
        break;
    }else if(messages[0].media && messages[1].message === cedula){
        // print newline
        console.log('');
        console.log(` got image`);
        // download the photo
        let image_buffer = await client.downloadMedia(messages[0], { progressCallback : console.log })
        // save image
        fs.writeFileSync(`./storage/images/${cedula}.png`, image_buffer);
        break;
    }else if(messages[0].message === 'https://www.cne.gob.ec/miembros-de-las-juntas-receptoras-del-voto/'
        && messages[1].message === 'Consulte los puntos habilitados donde puede capacitarse:' ){
        console.log('');
        console.log(` got Designacion a la junta`);
        // get past two messages
        let new_messages = await client.getMessages( cne_bot, { 
            //filter: Api.InputMessagesFilterPhotos,
            limit: 4, // limit of two messages
            id: [3, 4], // get the last two messages
        })   
        console.log(new_messages);
        // download the photo
        let image_buffer = await client.downloadMedia(new_messages[3], { progressCallback : console.log })
        // get the geo location
        let geo_loc = new_messages[2].media.geo
        // delete the accessHash so that it can be serialized
        delete geo_loc.accessHash
        // save image
        fs.writeFileSync(`./storage/images/${cedula}.png`, image_buffer);
        // save geo loc js object
        fs.writeFileSync(`./storage/geo_locs/${cedula}.json`, JSON.stringify(geo_loc));
        break;
    }else if(messages[0].message === 'La información de consulta de lugar de votación para ciudadanos que residen en el exterior estará disponible próximamente.'){
    } else {
        console.error(` got unexpected response`);
        console.log(messages[0].message);
        break;
    }
    if(seconds > 30){
        console.log(`waited for too long`);
        break;
    }

    // exit process
    process.exit(1);
}

