import proxyRotator from 'proxy-rotator-js';
import Checklist from "checklist-js";
import fs from 'fs';
import axios from 'axios';
import generateToken from './utils/generateToken.js';
import Storage from 'storing-me'
import RandomUserAgent from 'random-useragent';

// get proxies
let proxies = new proxyRotator('./storage/proxies/proxyscrape_premium_http_proxies.txt', {
    returnAs: 'object',
});

// target domain
let domain = 'https://lugarvotacion.cne.gob.ec/';
let endpoint = 'https://lugarvotacion.cne.gob.ec/CneApiWs/api/ConsultaVotacionDomicilioElectoral2021'
let cedula_prefix = '01';


// read lines from and format it 
let cedulas_dob = fs
    .readFileSync(`./storage/cedulas/cedula_dob_${cedula_prefix}.txt`, 'utf8')
    .split('\n')
    .map(cedula => ({ cedula: cedula.split(',')[0], dob: cedula.split(',')[1] }));

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

let proxy = proxies.next();
let cedula = cedula_checklist.next();
let token = generateToken();
let userAgent = RandomUserAgent.getRandom();

while(cedula) {

    console.log(`[${proxy.ip}][${cedula.cedula}] querying...`);

    try {
        let response = await axios.post(endpoint, {
            "cedula": cedula.cedula,
            "nombre": cedula.dob,
            "ip": proxy.ip,
            "recaptcharesponse": token,
            headers: {
                'User-Agent': userAgent
            }
        }, {
            proxy: {
                host: proxy.ip, 
                port: proxy.port,
                protocol: 'http'
            }
        });

        await store.push(cedula.cedula, response.data);
        cedula_checklist.check(cedula);
        console.log(`cedula ${cedula.cedula} checked. ${cedula_checklist.valuesCount()}/${cedula_checklist._missing_values.length} `);
    } catch (e) {
        console.log(`[${proxy.ip}][${cedula.cedula}] error`);
    }
    // update variables
    proxy = proxies.next();
    cedula = cedula_checklist.next();
    token = generateToken();
    userAgent = RandomUserAgent.getRandom();
}
