import proxyRotator from 'proxy-rotator-js';
import Checklist from "checklist-js";
import fs from 'fs';
import path from 'path';
import papa from 'papaparse';
import axios from 'axios';
import generateToken from './utils/generateToken.js';


// read lines from file
//let lines = fs.readFileSync('./storage/cedulas/part_aa', 'utf-8')

//console.log('Total lines: ', lines.length);


/*
// target domain
let domain = 'https://lugarvotacion.cne.gob.ec/';
let endpoint = 'https://lugarvotacion.cne.gob.ec/CneApiWs/api/ConsultaVotacionDomicilioElectoral2021'
let cedula = '0916576796';
let dob = '12/11/1992';
*/

const directoryPath = './storage/cedulas/';

let cedulas_with_dob = [];


const files = fs.readdirSync(directoryPath);
const partFiles = files.filter(file => file.startsWith('part_'));

for (let file of partFiles) {
    const content = fs.readFileSync(path.join(directoryPath, file), 'utf8');
    //console.log(`Content of ${file}:`);
    //console.log(content);
    content.split('\n').forEach(line => {
        if (line.length > 0) {
            const [number, cedula, dob] = line.split(',');
            cedulas_with_dob.push({ cedula, dob });
        }
    });
    //console.log('----------------------');
}
console.log("All files have been read!");
// Your logic after reading all files goes here.

console.log('Total cedulas: ', cedulas_with_dob.length);

cedulas_with_dob = cedulas_with_dob.map(c => {
    if(c.cedula.length === 9) {
        c.cedula = '0' + c.cedula;
    }
    return c;
});

// get al the cedulas that start with 01 to 30
let prefixes = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10',
    '11', '12', '13', '14', '15', '16', '17', '18', '19', '20',
    '21', '22', '23', '24', '25', '26', '27', '28', '29', '30'];

let cedulas = {}

for (let prefix of prefixes) {
    cedulas[prefix] = cedulas_with_dob.filter(c => c.cedula.startsWith(prefix));
    console.log(`Total cedulas with prefix ${prefix}: `, cedulas[prefix].length);
    // make a file with the cedulas that start with prefix
    fs.writeFileSync(`./storage/cedulas/cedula_dob_${prefix}.txt`, cedulas[prefix].map(c => `${c.cedula},${c.dob}`).join('\n'));
}


// add of the lenghts of the cedulas that start with 01 to 30
let total = 0;
for (let c of Object.keys(cedulas)) {
    total += cedulas[c].length;
}
console.log('Total cedulas: ', total);










