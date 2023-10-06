import Slavery from 'slavery-js';
import connect_client from './scripts/connect_client.js';
import send_message_and_get_response from './scripts/send_message_and_get_response.js'

// let connect_client get the phone number from the params passed
const number = process.argv[2];
console.log('initilizing with phone once: ', number);
if(!number){
    console.log('Please pass the phone number as a param');
    process.exit(1);
}

// get the chat
Slavery({
    numberOfSlaves: 1,
    port: 3000,
    host: 'localhost'
}).slave(async (cedula, salve) => {
    let client = await connect_client(number);
    if(!client) console.log('clien id not found');
    return await send_message_and_get_response(cedula, client, number)
});

