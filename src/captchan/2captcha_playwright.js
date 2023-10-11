// import axios 
import axios from 'axios';
// waiter
import wait from 'waiting-for-js';

const captcha_solver = async (page, twoCaptcha_api_key) => {
    /* this function will solve the captcha using 2captcha service
     * it takes a page and looks for the captcha element
     * then it will send the captcha to 2captcha service
     * checks for the response every n seconds
     * then it will fill the captcha element with the response
     * and return true
     */

    let checkEvery = 5; // seconds
    let submitEndpoint = 'http://2captcha.com/in.php';
    let checkEndpoint = 'http://2captcha.com/res.php';

	// get the domain from the page object
	const url = page.url();

	// wait gor captcha to be element to appear
	const iframeElement = await page.waitForSelector('iframe');

	// wait for short time
	await wait.for.shortTime()

	// Get the 'src' attribute value of the iframe element
	const iframeSrc = await iframeElement.getAttribute('src');

	// get key from src
	const captchanKey = iframeSrc.split('k=')[1].split('&')[0];

	// make endpoint
	const enpoint = `${submitEndpoint}?key=${twoCaptcha_api_key}&method=userrecaptcha&googlekey=${captchanKey}&pageurl=${url}`;

	// get the response from 2captcha
	let response = await axios.get(enpoint)

	// get captcha id
	let captchaID = (response.data.includes('OK')) ? response.data.split('|')[1] : null;
	console.log('captchaID:', captchaID);
	// if we got a null ID, then we have an error
	if (captchaID === null) console.error('Error getting captcha ID');

	// check if captcha is solved every 5 seconds
	let captchaToken = null;
	while (true) {
		// wait for 5 seconds
        await new Promise(r => setTimeout(r, checkEvery * 1000));
        // check if captcha is solved
		const captchaResponse = await axios.get(`${checkEndpoint}?key=${twoCaptcha_api_key}&action=get&id=${captchaID}`);
        // if captcha is solved, then break the loop
		if (captchaResponse.data.includes('OK')) {
			captchaToken = captchaResponse.data.split('|')[1];
			console.log('captchaToken:', captchaToken);
			break;
		}
	}

	// make the id g-recaptcha-response visible
	await page.evaluate( ({ captchaToken }) => {
		document.getElementById("g-recaptcha-response").innerHTML=captchaToken;	
	}, { captchaToken });

	return true

}



export default captcha_solver;


