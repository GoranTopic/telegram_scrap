import fs from 'fs';

const scrap_cedula = async (cedula, slave) => {
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
        await new Promise(r => setTimeout(r, 3 * 1000));
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
            return { result: true, seconds: seconds };
        }else if(messages[0].media && messages[1].message === cedula){
            // print newline
            console.log('');
            console.log(`[${number}] got image`);
            // download the photo
            let image_buffer = await client.downloadMedia(messages[0], { progressCallback : console.log })
            // save image
            fs.writeFileSync(`./storage/images/${cedula}.png`, image_buffer);
            // return true
            return { result: true, seconds: seconds };
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
            // return true
            return { result: true, seconds: seconds };
        }else if(messages[0].message === 'La información de consulta de lugar de votación para ciudadanos que residen en el exterior estará disponible próximamente.'){
            // return false
            return { result: true, seconds: seconds };
        } else {
            console.error(`[${number}] got unexpected response`);
            console.log(messages[0].message);
            // return false
            return { result: false, seconds: seconds };
        }
        if(seconds > 30){
            console.log(`[${number}] waited for too long`);
            return { result: false, seconds: seconds };
        }
    }
}

export default scrap_cedula;
