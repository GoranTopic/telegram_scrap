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

// get the chat
Slavery({
    numberOfSlaves: 1,
    port: 3003,
    host: 'localhost', //'192.168.50.132',
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
            throw new Error(`No session found for ${session_file}`);
        }

        // fill this later with the value from session.save()
        const stringSession = new StringSession(session); 

        try{
            // make client
            console.log("Making telegram client...");
            const client = new TelegramClient(stringSession, app_apiId, app_apiHash, {
                connectionRetries: 5,
            });

            let phone_number = session_file.split('.')[0];
            // login with client
            console.log("starting telegram client...");

            await client.start({ 
                phoneNumber: phone_number,
                //password: async () => await input.text("Please enter your password: "),
                phoneCode: async () => await input.text("Please enter the code you received: "),
                onError: (err) => console.log(err),
                timeout: 1000,
            });

            console.log("storeing telegram client...");
            //saving telegram client 
            slave.set('client', client);

            console.log("saving telegram client...");
            // save the session key
            fs.writeFileSync(`./storage/sessions/${session_file}`,
                client.session.save() // Save this string to avoid logging in again
            );
            return true;
        } catch(err) {
            console.error('Caught error:', err);
            throw new Error('Error in telegram client setup');
        }
    },

    'cedula': async (cedula, slave) => {
        let number = slave.get('phone_session_file');
        console.log(`[${number}] is scrapping cedula: ${cedula}`);
        // get the client
        let client = slave.get('client');
        // query cedula
        await client.sendMessage(cne_bot, { message: cedula });
        // wait for response
        let hasResponded = false;
        // seconds waited
        let seconds = 0;
        console.log(`[${number}] waiting for response...`);
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
                console.log(`[${number}] got geo location and image`);
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
                console.log(`[${number}] got image`);
                // download the photo
                let image_buffer = await client.downloadMedia(messages[0], { progressCallback : console.log })
                // save image
                fs.writeFileSync(`./storage/images/${cedula}.png`, image_buffer);
                // return true
                return { result: true, seconds, cedula };
            }else if(messages[0].message === 'https://www.cne.gob.ec/miembros-de-las-juntas-receptoras-del-voto/'){
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
                return { result: true, seconds: seconds };
            } else {
                console.error(`[${number}] got unexpected response`);
                console.log(`[${number}] cedula: ${cedula}`, messages[0].message);
                // return false
                return { result: false, seconds, cedula };
            }
            if(seconds > 60){
                console.log(`[${number}] waited for too long`);
                return { result: false, seconds, cedula };
            }
        }
    }

});

