const { TelegramClient, Api } = require("telegram");
const { StringSession } = require("telegram/sessions/index.js");
const input = require("input");
const fs = require("fs");
const path = require('node:path')
// dot env
const dotenv = require("dotenv").config();

(async () => {
    while (true) {
        try {
            // make directory struct,
            // make direcotru for any os

            fs.mkdirSync(path.join('storage', 'sessions'), { recursive: true });
            // make api into a nuber

            const app_apiId = Number(21119061)
            // get the api hash
            const app_apiHash = '079b9d558352c2d31513ce58e1c2f2ab'

            // let get the phone number from the params passed
            const phone_number = await input.text("entra numero de celular con codigo de pais: (ex: +593xxxxxxxxx):")
            console.log('initilizing with phone: ', phone_number);

            let phone_session_id = '';
            // get slave session id from memory or not
            if (fs.existsSync(path.join('storage', 'sessions', `${phone_number}.session`))) {
                console.log(`Found session for ${phone_number}`);
                phone_session_id = fs.readFileSync(path.join('storage', 'sessions', `${phone_number}.session`), 'utf8');
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
                phoneCode: async () => await input.text("Entra el codigo de confirmacion que fue enviado al app de telegram: "),
                onError: (err) => console.log(err),
            });

            // you shoudl now be logged in
            console.log("You should now be connected.");

            // save the session key
            fs.writeFileSync(`./storage/sessions/${phone_number}.session`,
                client.session.save() // Save this string to avoid logging in again
            );

            let cedula = '0916576796';

            const cne_bot = "Cneecuador_bot";
            // query cedula
            await client.sendMessage(cne_bot, { message: cedula });
            // wait for response
            let hasResponded = false;
            // seconds waited
            let seconds = 0;
            console.log(` waiting for response...`);
            while (!hasResponded) { // while sever has not responded
                // get last two messages
                let messages = await client.getMessages(cne_bot, {
                    //filter: Api.InputMessagesFilterPhotos,
                    limit: 2, // limit of two messages
                    id: [1, 2], // get the last two messages
                })
                // wait for one second with set timeout
                await new Promise(r => setTimeout(r, 1 * 1000));
                // if the last message is the one we sent, then wait for a new message
                if (messages[0] && messages[0].message === cedula) {
                    process.stdout.write('.');
                    seconds++;
                    hasResponded = false;
                    //else if we got the geo location and image
                } else if (messages[0].geo && messages[1].media) {
                    // print newline
                    console.log('');
                    console.log(`got geo location and image`);
                    console.log('Exito!');
                    hasResponded = true;
                } else if (messages[0].media && messages[1].message === cedula) {
                    // print newline
                    console.log('Exito!');
                    hasResponded = true;
                } else if (messages[0].message === 'https://www.cne.gob.ec/miembros-de-las-juntas-receptoras-del-voto/'
                    && messages[1].message === 'Consulte los puntos habilitados donde puede capacitarse:') {
                    console.log('Exito!');
                    hasResponded = true;
                    if (seconds > 30) {
                        console.log(`waited for too long`);
                        throw new Error('Error: no se pudo obtener la informacion');
                    }
                }
            }
        } catch (e) {
            console.error(e);
        }
    }
})();