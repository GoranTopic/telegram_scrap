import { TelegramClient, Api } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import input from "input";
import fs from 'fs';
// dot env
import dotenv from "dotenv";
dotenv.config();

const cne_bot = "Cneecuador_bot";

// make api into a nuber
const app_apiId = Number(process.env.API_ID);
// get the api hash
const app_apiHash = process.env.API_HASH;


const setup_telegram_client = async (session_file, slave) => {
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
}

export default setup_telegram_client;
