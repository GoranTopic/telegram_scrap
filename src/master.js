import fs from "fs";
import Checklist from "checklist-js";
import Slavery from 'slavery-js';
import ProxyRotator from 'proxy-rotator-js'

// salve
Slavery({
    port: 3003,
    host: 'localhost', //'192.168.50.132',
    timeout: 1000 * 60 *10,
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
    let sessions = new Checklist(sessions_files, { 
        recalc_on_check: true,
        enquque: false,
        shuffle: true,
        save: false,
    });
    // read cedulas
    let cedulas = fs.readFileSync(cedulas_path, "utf8").split("\n");
    // make checklist
    console.log('making checklist...');
    let cedula_checklist = new Checklist(cedulas, { 
        name: `cedulas_${cedulas_prefix}`,
        path: './storage/checklists/',
        enqueue: false,
        recalc_on_check: false,
        save_every_check: 100,
    });
    console.log('checklist made');
    console.log('awaiting slaves');
    // get new cedula and session
    let cedula = cedula_checklist.next();
    // loop on all cedulas
    while(cedula){
        console.log('unused sessions:',sessions._missing_values.length)
        console.log('used sessions:',sessions.valuesDone())
        // get idel slave
        let slave = await master.getIdle();
        // if slave has session
        let hasSession = await slave.has_done('telegram client setup');
        if( hasSession ){
            // send cedula to slave
            cedula = cedula_checklist.next();
            console.log(`sending cedula ${cedula} to slave`);
            slave.run(cedula, 'cedula')
                .then( ({result, cedula})  => {
                    if(result){ // result is true if cedula is valid
                        if(cedula === undefined){
                            throw new Error('cedula is undefined');
                        }
                        // add one to 
                        cedula_checklist.check(cedula);
                        // print the state of the cheklist
                        console.log(`cedula ${cedula} checked, ${cedula_checklist._values.length}/${cedula_checklist.missingLeft()} left`);
                    }
                }).catch( err => {
                    let old_session = slave.current_session;
                    // change sessions
                    let new_session = sessions.next()
                    sessions.uncheck(old_session);
                    sessions.check(new_session);
                    slave.current_session = new_session;
                    slave.run(new_session, 'telegram client setup')
                        .catch( err => {
                            console.log('error setting up session');
                            console.log(err);
                        });
                });
        }else{ // if slave has no session
            console.log('no session');
            let session = sessions.next();
            if(!session){
                console.log('no session left');
                process.exit(1);
            }
            sessions.check(session);
            slave.current_session = session
            slave.run(session, 'telegram client setup')
                .catch( err => {;
                    console.log('error setting up session');
                    console.log(err);
                });
        };
    }
    // if no cedula left
    console.log('no cedula left');
});


