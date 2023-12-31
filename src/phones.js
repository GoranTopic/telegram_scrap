import { TelegramClient, Api } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import input from "input";
import Slavery from 'slavery-js';
import wait from 'waiting-for-js';
import fs from 'fs';
// dot env
import dotenv from "dotenv";
dotenv.config();

const cne_bot = "Cneecuador_bot";

// make api into a nuber
const app_apiId = Number(process.env.API_ID);
// get the api hash
const app_apiHash = process.env.API_HASH;

// get the chat
Slavery({
    numberOfSlaves: 24,
    port: 3003,
    host: 'localhost',
}).slave( {
    // this will set up tthe telegram client
    'telegram client setup': async (session_file, slave) => {
        // get slave session id from memory or not
        console.log('opeing session:', session_file);
        let session;
        if(fs.existsSync(`./storage/sessions/${session_file}`)){
            console.log(`Found session for ${session_file}`);
            session = fs.readFileSync(`./storage/sessions/${session_file}`, 'utf8');
            slave.set('phone_session_file', session_file.split('.')[0]);
            slave.set('phone_session_id', session);
        }else{
            console.log(`No session found for ${session_file}`);
            throw new Error('No session found');
        }

        // fill this later with the value from session.save()
        const stringSession = new StringSession(session); 

        // make client
        console.log("Making telegram client...");
        const client = new TelegramClient(stringSession, app_apiId, app_apiHash, {
            connectionRetries: 5,
        });

        let phone_number = session_file.split('.')[0];
        // login with client
        console.log("starting telegram client...");
        
        try{
            await client.start({ 
                phoneNumber: phone_number,
                //password: async () => await input.text("Please enter your password: "),
                phoneCode: async () => await input.text("Please enter the code you received: "),
                onError: (err) => console.log(err),
                timeout: 1000,
            });
        }catch(err){
            console.log(err);
            throw new Error('Error logging in');
        }

        console.log("storeing telegram client...");
        //saving telegram client 
        slave.set('client', client);

        console.log("saving telegram client...");
        // save the session key
        fs.writeFileSync(`./storage/sessions/${session_file}`,
            client.session.save() // Save this string to avoid logging in again
        );
        return true;
    },

    'cedula': async (cedula, slave) => {
        let number = slave.get('phone_session_file');
        console.log(`[${number}] scrapping cedula: `, cedula);
        // get the client
        let client = slave.get('client');
        // query cedula
        await client.sendMessage(cne_bot, { message: cedula });
        // wait for response
        let hasResponded = false;
        // seconds waited
        let seconds = 0;
        console.log(`[${number}] waiting for cedula response`);
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
                console.log(`[${number}] got image and geo`);
                // download the photo
                let image_buffer = await client.downloadMedia(messages[1], { progressCallback : console.log })
                // get the geo location
                let geo_loc = messages[0].geo
                // delete the accessHash so that it can be serialized
                delete geo_loc.accessHash
                // save image
                fs.writeFileSync(`./storage/images/${cedula}.png`, image_buffer);
                console.log(`[${number}] geo_loc: `, geo_loc);
                // save geo loc js object
                fs.writeFileSync(`./storage/geo_locs/${cedula}.json`, JSON.stringify(geo_loc));
                // return true
                return { result: true, seconds, cedula };
            }else if(messages[0].media && messages[1].message === cedula){
                // print newline
                console.log('');
                console.log(`[${number}] got only image`);
                // download the photo
                let image_buffer = await client.downloadMedia(messages[0], { progressCallback : console.log })
                // save image
                fs.writeFileSync(`./storage/images/${cedula}.png`, image_buffer);
                // return true
                return { result: true, seconds, cedula };
            }else if(messages[0].message === 'https://www.cne.gob.ec/miembros-de-las-juntas-receptoras-del-voto/' ){
                console.log('');
                console.log(`[${number}] got Designacion a la junta`);
                // get past two messages
                let new_messages = await client.getMessages( cne_bot, { 
                    //filter: Api.InputMessagesFilterPhotos,
                    limit: 4, // limit of two messages
                    id: [3, 4], // get the last two messages
                })   
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
                // return true
                return { result: true, seconds, cedula };
            }else if(messages[0].message === 'La información de consulta de lugar de votación para ciudadanos que residen en el exterior estará disponible próximamente.'){
                // return false
                return { result: true, seconds, cedula };
            } else {
                console.error(`[${number}] Something went wrong`);
                console.log(`[${number}] cedula: ${cedula}`, messages[0].message);
                // return false
                return { result: false, seconds, cedula };
            }
            if(seconds > 60){
                console.log('timeout');
                return { result: false, seconds, cedula };
            }
        }
    }

});

