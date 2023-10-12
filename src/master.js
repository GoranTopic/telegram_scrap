import proxyRotator from 'proxy-rotator-js';
import Checklist from "checklist-js";
import fs from 'fs';
import generateToken from './utils/generateToken.js';
import Storage from 'storing-me'
import RandomUserAgent from 'random-useragent';
import Slavery from 'slavery-js';

// salve
Slavery({
    host: 'localhost',
    port: 3000,
}).master( async master => {

    let cedula_prefix = process.argv[2];
    // let get the phone number from the params passed
    console.log('reading cedulas starting with: ', cedula_prefix);
    if(!cedula_prefix){
        console.log('Please enter a number from 01 - 24 or 30');
        process.exit(1);
    }

    // get proxies
    let proxies = new proxyRotator('./storage/proxies/proxyscrape_premium_http_proxies.txt', {
        returnAs: 'object',
    });

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
        path: `./storage/records/`,
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
        save_every_check: 1000,
    });
    console.log('checklist done');

    let proxy = proxies.next();
    let cedula = cedula_checklist.next();
    let token = generateToken();
    let userAgent = RandomUserAgent.getRandom();

    while(cedula) {
        console.log(`awaiting for slave...`);
        let slave = await master.getIdle();
        // send cedula to slave
        slave.run({proxy, cedula, token, userAgent})
            .then( async result => {
                await store.push(cedula.cedula, result);
                cedula_checklist.check(cedula);
                console.log(`cedula ${cedula.cedula} checked. ${cedula_checklist.valuesCount()}/${cedula_checklist._missing_values.length} `);
            }).catch( error => {
                console.log(`[${proxy.ip}][${cedula.cedula}] error`);
            })
        // update variables
        proxy = proxies.next();
        cedula = cedula_checklist.next();
        token = generateToken();
        userAgent = RandomUserAgent.getRandom();
    }
});

