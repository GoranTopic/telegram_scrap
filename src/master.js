import fs from "fs";
import Checklist from "checklist-js";
import Slavery from 'slavery-js';
import ProxyRotator from 'proxy-rotator-js'

// salve
Slavery({
    port: 3000,
    host: 'localhost',
}).master( async master => {
    // let cedulas path 
    let cedulas_prefix = process.argv[2];
    let proxies = new ProxyRotator( './storage/proxies/proxyscrape_premium_http_proxies.txt');
    // let get the phone number from the params passed
    if(!cedulas_prefix){
        console.log('Please enter a number from 01 - 24 or 30');
        process.exit(1);
    }
    // let get the cedulas path
    const cedulas_path = `./storage/cedulas/cedulas_${cedulas_prefix}.txt`;
    // read cedulas
    let cedulas = fs.readFileSync(cedulas_path, "utf8").split("\n");
    // make checklist
    console.log('making checklist...');
    let cedula_checklist = new Checklist(cedulas, { 
        name: `cedulas_${cedulas_prefix}`,
        path: './storage/checklists/',
        save_every_check: 100, 
    });
    console.log('checklist made');
    // get new cedula
    let cedula = cedula_checklist.next();
    let proxy = await proxies.next();
    // loop on all cedulas
    while(cedula){
        // get idel slave
        let slave = await master.getIdle();
        // send cedula to slave
        slave.run({proxy, cedula})
            .then( result => {
            console.log(`cedula ${cedula} done`);
            console.log(result);
            // check cedula off
            cedula_checklist.check(cedula);
            // get new cedula
            cedula = cedula_checklist.next();
        });
    }
});

