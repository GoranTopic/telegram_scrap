import { TelegramClient, Api } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import fs from 'fs';
import input from "input";
// dot env
import dotenv from "dotenv";
dotenv.config();

// make api into a nuber
const app_apiId = Number(process.env.API_ID);
// get the api hash
const app_apiHash = process.env.API_HASH;

const connect_client = async number => {
        let phone_session_id = '';
        // get slave session id from memory or not
        if(fs.existsSync(`./storage/sessions/${number}.session`)){
            console.log(`Found session for ${number}`);
            phone_session_id = fs.readFileSync(`./storage/sessions/${number}.session`, 'utf8');
        }

        // fill this later with the value from session.save()
        const stringSession = new StringSession(phone_session_id); 

        // make client
        console.log("Making telegram client...");
        let client = new TelegramClient(stringSession, app_apiId, app_apiHash, {
            connectionRetries: 5,
        });

        // login with client
        await client.start({ 
            phoneNumber: number,
            //password: async () => await input.text("Please enter your password: "),
            phoneCode: async () => await input.text("Please enter the code you received: "),
            onError: (err) => console.log(err),
        });

        // you shoudl now be logged in
        console.log("You should now be connected to", number);

        // save the session key
        fs.writeFileSync(`./storage/sessions/${number}.session`, 
            client.session.save() // Save this string to avoid logging in again
        );

    return client;
}


export default connect_client;
