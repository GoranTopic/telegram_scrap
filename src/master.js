import fs from "fs";
import Checklist from "checklist-js";
import Slavery from 'slavery-js';

// salve
Slavery({
    port: 3000,
    host: 'localhost',
}).master( async master => {
    // let cedulas path 
    let cedulas_prefix = process.argv[2];
    // let get the phone number from the params passed
    console.log('reading cedulas starting with: ', cedulas_prefix);
    if(!cedulas_prefix){
        console.log('Please enter a number from 01 - 24 or 30');
        process.exit(1);
    }
    // get cedulas path   
    const cedulas_path = `./storage/cedulas/cedulas_${cedulas_prefix}.txt`;
    // read cedulas
    let cedulas = fs.readFileSync(cedulas_path, "utf8").split("\n");
    // make checklist
    console.log('making checklist...');
    let cedula_checklist = new Checklist(cedulas, { 
        name: `cedulas_${cedulas_prefix}`,
        path: './storage/checklists/',
        save_every_check: 50, 
    });
    console.log('checklist made');
    console.log('awaiting slaves');
    // get new cedula
    let cedula = cedula_checklist.next();
    // loop on all cedulas
    while(cedula){
        // get idel slave
        let slave = await master.getIdle();
        // send cedula to slave
        slave.run(cedula).then( is_success => {
            if(is_success){
                // check cedula off
                cedula_checklist.check(cedula);
                // print the state of the cheklist
                console.log(`cedula ${cedula} checked, ${cedula_checklist.missingLeft()}/${cedula_checklist._values.length} left`);
            }
            // get new cedula
            cedula = cedula_checklist.next();
        })
    };
});

