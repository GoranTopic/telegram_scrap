import fs from 'fs';
import path from 'path';


// read lines from file
let lines = fs.readFileSync('./storage/cedulas/cedula_dob_170.txt', 'utf-8').split('\n');

console.log('Total lines: ', lines.length);

// print first 10 lines
console.log('First 10 lines: ', lines.slice(0, 10));

const directoryPath = './storage/cedulas/';


lines.forEach((line, index) => {
    for (let i = 0; i < 10; i++) {
        if (line.startsWith(`17${i}`)) {
            // write line to file
            fs.appendFileSync(path.join(directoryPath, `cedula_dob_17${i}.txt`), `${line}\n`);
        }
    }
});




