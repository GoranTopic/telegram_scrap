import fs from 'fs';
import path from 'path';

const directoryPath = './storage/cedulas/';

let cedulas_with_dob = [];


let files = fs.readdirSync(directoryPath);
files = files.filter(file => file.startsWith('cedula_dob'));

for (let file of files) {
    const content = fs.readFileSync(path.join(directoryPath, file), 'utf8').split('\n');
    // reade number of cedula
    console.log('cedula: ', file);
    console.log('number: ', content.length);
}

