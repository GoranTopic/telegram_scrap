import fs from "fs";
import Checklist from "checklist-js";
import Slavery from 'slavery-js';
import ProxyRotator from 'proxy-rotator-js'

// salve
Slavery({
    port: 3000,
    host: 'localhost',
    timeout: 1000 * 60, // 1 minute
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
    // get all file in the sessions folder
    let sessions_files = fs.readdirSync('./storage/sessions/');
    let sessions = new ProxyRotator(sessions_files)
    // read cedulas
    let cedulas = fs.readFileSync(cedulas_path, "utf8").split("\n");
    // make checklist
    console.log('making checklist...');
    let cedula_checklist = new Checklist(cedulas, { 
        name: `cedulas_${cedulas_prefix}`,
        path: './storage/checklists/',
    });
    console.log('checklist made');
    console.log('awaiting slaves');
    // get new cedula and session
    let cedula = cedula_checklist.next();
    // loop on all cedulas
    while(cedula){
        // get idel slave
        let slave = await master.getIdle();
        // if slave has session
        let hasNumber = await slave.has_done('set number');
        if( hasNumber ){
            // send cedula to slave
            console.log(`sending cedula ${cedula} to slave`);
            slave.run(cedula, 'cedula')
                .then( result => {
                    console.log(`cedula ${cedula} returned ${result}`);
                    if(result){ // result is true if cedula is valid
                        cedula_checklist.check(cedula);
                        // print the state of the cheklist
                        console.log(`cedula ${cedula} checked, ${cedula_checklist._values.length}/${cedula_checklist.missingLeft()} left`);
                    // get new cedula
                    cedula = cedula_checklist.next();
                    }
                }).catch( err => {
                    console.log('error: ', err);
                });
        }else{ // if slave has no session
            console.log('setting number to slave');
            let number = sessions.next().split(':')[0].split('.')[0];
            if(!number) console.error('no session left');
            sessions.setDead(number + '.session:undefined');
            slave.run(number, 'set number');
        };
    }
    // if no cedula left
    console.log('no cedula left');
});


