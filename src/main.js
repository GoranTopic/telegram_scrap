import { chromium } from 'playwright';
import captchaSolver from './captchan/captchas.io.js';

// dot env
import dotenv from "dotenv";
dotenv.config();

// get the api for captchan solver
const CAPTCHA_SOLVER_API_KEY = process.env.CAPTCHA_SOLVER_API_KEY;

if(CAPTCHA_SOLVER_API_KEY === undefined)
    throw new Error('CAPTCHA_SOLVER_API_KEY is not defined');

// target domain
let domain = 'https://lugarvotacion.cne.gob.ec/';
let cedula = '0916576796';
let dob = '12/11/1992';

const browser = await chromium.launch({
    headless: false,
});

// open a new page
const page = await browser.newPage();
// go to the domain
page.goto(domain);
// wait for the page to load
await page.waitForSelector('iframe');
console.log('recaptcha loaded');
// write cedula
await page.fill('#mat-input-0', cedula);
// write dob
await page.fill('#mat-input-1', dob);
// await for captcha to be solved
let isSolved = await captchaSolver(page, CAPTCHA_SOLVER_API_KEY);
// click on the button with class mat-raised-button mat-primary
if(isSolved) console.log('captcha solved');


/*
// click on the button
console.log('captcha solved');
await page.getByText('Consulta')[1].click();


// wait for the page idle 
await page.waitForLoadState('networkidle');

// get result
let result = await page.$('.swal2-content');
console.log(await result.innerText());
*/
