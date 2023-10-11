
import axios from 'axios';
import dotenv from "dotenv";
dotenv.config();


// get the api for captchan solver
let CAPTCHA_SOLVER_API_KEY = '60d5483f-651a68f659d711.91849319';

let submitEndpoint = 'https://api.captchas.io/in.php'   
let checkEndpoint = 'https://api.captchas.io/res.php'

const postData = {
    key: CAPTCHA_SOLVER_API_KEY,
    method: 'textcaptcha',
    textcaptcha: 'What color is the sky?', 
}


// get the response from 2captcha
let response = await axios.post(submitEndpoint, 
    postData,
)

console.log('response:', response);

// get captcha id
let captchaID = (response.data.includes('OK')) ? response.data.split('|')[1] : null;
console.log('captchaID:', captchaID);
// if we got a null ID, then we have an error
if (captchaID === null) console.error('Error getting captcha ID');

