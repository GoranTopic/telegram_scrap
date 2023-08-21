import fs from "fs";
import Checklist from "checklist-js";
import Slavery from 'slavery-js';

// salve
Slavery({
	port: 3000,
	host: 'localhost',
}).master( async master => {
	// let cedulas path 
	const cedulas_path = "./storage/cedulas/cedulas_09.txt";
	// read cedulas
	let cedulas = fs.readFileSync(cedulas_path, "utf8").split("\n");
	// make checklist
	console.log('making checklist...');
	let cedula_checklist = new Checklist(cedulas, { save_every_check: 1, });
	console.log('checklist made');
	// get new cedula
	let cedula = cedula_checklist.next();
	// loop on all cedulas
	while(cedula){
		// get idel slave
		let slave = await master.getIdle();
		// send cedula to slave
		slave.run(cedula).then( image_buffer => {
			console.log(`cedula ${cedula} recived!`);
			// save image
			fs.writeFileSync(`./storage/images/${cedula}.png`, image_buffer);
			// check cedula off
			cedula_checklist.check(cedula);
			// get new cedula
			cedula = cedula_checklist.next();
		});
	}
});

