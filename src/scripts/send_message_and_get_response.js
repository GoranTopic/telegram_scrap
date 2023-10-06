import fs from 'fs';
import connect_client from './connect_client.js';


let send_message_and_get_response = async (cedula, client, number=null) => {

    const cne_bot = "Cneecuador_bot";

    console.log(`[${number}] scrapping cedula: `, cedula);
    // query cedula
    console.log(`[${number}] sending cedula to cne bot`);
    let result = await client.sendMessage(cne_bot, { message: cedula });
    // wait for response
    let hasResponded = false;
    let seconds = 0;
    let restart_after_seconds = 30;
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
            return true;
        }else if(messages[0].media && messages[1].message === cedula){
            // print newline
            console.log('');
            console.log(`[${number}] got image only`);
            // download the photo
            let image_buffer = await client.downloadMedia(messages[0], { progressCallback : console.log })
            // save image
            fs.writeFileSync(`./storage/images/${cedula}.png`, image_buffer);
            // return true
            return true;
        }else if(messages[0].message === 'https://www.cne.gob.ec/miembros-de-las-juntas-receptoras-del-voto/'
            && messages[1].message === 'Consulte los puntos habilitados donde puede capacitarse:' ){
            console.log('');
            console.log(`[${number}] got Designacion a la junta`);
            // get past two messages
            let new_messages = await client.getMessages( cne_bot, { 
                //filter: Api.InputMessagesFilterPhotos,
                limit: 4, // limit of two messages
                id: [3, 4], // get the last two messages
            })   
            console.log(`[${number}] new_messages: `, new_messages);
            // download the photo
            let image_buffer = await client.downloadMedia(new_messages[3], { progressCallback : console.log })
            // get the geo location
            let geo_loc = new_messages[2]?.media?.geo
            // delete the accessHash so that it can be serialized
            if(geo_loc) delete geo_loc.accessHash
            // save image
            fs.writeFileSync(`./storage/images/${cedula}.png`, image_buffer);
            // save geo loc js object
            if(geo_loc) fs.writeFileSync(`./storage/geo_locs/${cedula}.json`, JSON.stringify(geo_loc));
            // return true
            return true;
        }else if(messages[0].message === 
'La información de consulta de lugar de votación para ciudadanos que residen en el exterior estará disponible próximamente.' ) {
            console.log('');
            console.log(`[${number}] got extrangero`);
            // return false
            return false;
        } else {
            console.error(`[${number}] got unknown response`);
            console.log(messages);
            // return false
            return false;
        }
        if( seconds > restart_after_seconds ){
            console.log('');
            console.log(`[${number}] timeout`);
            console.log(`[${number}] rconnecting...`);
            seconds = 0;
            let client = await connect_client(number);
            return await send_message_and_get_response(client, cedula, number)
        }
    }
}


export default send_message_and_get_response
