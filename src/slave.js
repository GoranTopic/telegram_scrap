import Slavery from 'slavery-js';
import puppeteer from 'puppeteer-core';
import fs from 'fs';

// dot env
import dotenv from "dotenv";
dotenv.config();

// target domain
let domain = 'https://lugarvotacion.cne.gob.ec/';

// get the api for captchan solver
const captchanio = process.env.API_KEY

// get the chat
Slavery({
    numberOfSlaves: 1,
    port: 3000,
    host: 'localhost'
}).slave({ 
    'login': async (proxy, slave) => {
        console.log('opening browser with proxy');
        // make the browser
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        // go to the domain
        page.goto(domain);
        // save page
        slave['page'] = page;
        // query cedula
        return true;
    },
    'query_cedula': async (cedula, slave) => {
        // get the page
        const page = slave['page'];
        //
        await page.type('.search-box__input', 'automate beyond recorder');

        return buffer;
    }
});

