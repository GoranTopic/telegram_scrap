import Checklist from "checklist-js";
import fs from 'fs';
import axios from 'axios';
import generateToken from './utils/generateToken.js';
import Storage from 'storing-me'
import RandomUserAgent from 'random-useragent';

// get the endpoint
let endpoint = 'https://lugarvotacion.cne.gob.ec/CneApiWs/api/ConsultaVotacionDomicilioElectoral2021'


let cedula_prefix = process.argv[2];
// let get the phone number from the params passed
console.log('reading cedulas starting with: ', cedula_prefix);
if(!cedula_prefix){
    console.log('Please enter a number from 01 - 24 or 30');
    process.exit(1);
}

// read lines from and format it 
let cedulas_dob = fs
    .readFileSync(`./storage/cedulas/cedula_dob_${cedula_prefix}.txt`, 'utf8')
    .split('\n')
    // remove any undefined cedula
    .filter(cedula => cedula.cedula !== undefined)
    .filter(cedula => cedula.cedula !== null)
    .map(cedula => ({ cedula: cedula.split(',')[0], dob: cedula.split(',')[1] }))

// traslat date of birth to format DD/MM/YYYY from 1938-06-14T00:00:00.000000000Z
cedulas_dob = cedulas_dob
    .map(cedula => ({ cedula: cedula.cedula, dob: cedula.dob.split('T')[0].split('-').reverse().join('') }));

console.log('making storage...');
let storage = new Storage({ 
    type: 'json',
    storagePath: `./storage/records/`,
    keyValue: true,
});
let store = await storage.open(`records_${cedula_prefix}`);
console.log('storage done');

console.log('making checklist...');
let cedula_checklist = new Checklist(cedulas_dob, { 
    name: `cedulas_dob_${cedula_prefix}`,
    path: './storage/checklists/',
    enqueue: false,
    recalc_on_check: false,
    save_every_check: 1,
});
console.log('checklist done');

// set intevale to make requests every 1 second
let interval = setInterval(() => {
    // check if all cedulas have been checked
    // get the next proxy and cedula to check
    let cedula = cedula_checklist.next();
    let token = generateToken();
    let userAgent = RandomUserAgent.getRandom();
    if (!cedula?.cedula) {
        console.log('all cedulas checked');
        clearInterval(interval);
        return;
    }

    // make the request
    make_request(cedula, token, userAgent);

}, 0.1);


let make_request = (cedula, token, userAgent) => 
    // make the request
    axios.post(endpoint, {
        "cedula": cedula.cedula,
        "nombre": cedula.dob,
        "recaptcharesponse": token,
        headers: {
            'User-Agent': userAgent
        }
    }).then( async result  => {
        await store.push(cedula.cedula, result.data);
        cedula_checklist.check(cedula);
        console.log(`cedula ${cedula.cedula} checked. ${cedula_checklist.valuesCount()}/${cedula_checklist._missing_values.length} `);
    }).catch( error => {
        if (error.response.status === 403 ) 
            console.log(`[${cedula.cedula}] querying...${error.response.status}`);
        else 
            console.log(`[${cedula.cedula}] error`);
    })

