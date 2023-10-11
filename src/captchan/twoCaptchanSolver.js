// import axios 
import axios from 'axios';
// waiter
import wait from 'waiting-for-js';

const captcha_solver = async (page, twoCaptcha_api_key) => {

	// if twoCaptcha_api_key is not defined, then return false
	if (!twoCaptcha_api_key){
		console.error('twoCaptcha_api_key is null');
		return false;
	}

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
	const enpoint = `http://2captcha.com/in.php?key=${twoCaptcha_api_key}&method=userrecaptcha&googlekey=${captchanKey}&pageurl=${url}`;

	// get the response from 2captcha
	let response = await axios.get(enpoint)

	// get captcha id
	let captchaID = (response.data.includes('OK')) ? response.data.split('|')[1] : null;
	
    // if we got a null ID, then we have an error
    if (captchaID === null){
        console.error('Error getting captcha ID');
        return false;
    }

	// check if captcha is solved every 5 seconds
	let captchaToken = null;
	while (true) {
		// wait for 5 seconds
		await wait.for.longTime();
		const captchaResponse = await axios.get(`http://2captcha.com/res.php?key=${twoCaptcha_api_key}&action=get&id=${captchaID}`);
		if (captchaResponse.data.includes('OK')) {
			captchaToken = captchaResponse.data.split('|')[1];
			//console.log('captchaToken:', captchaToken);
			break;
		}
	}

	// make the id g-recaptcha-response visible
	await page.evaluate( ({ captchaToken }) => {
		document.getElementById("g-recaptcha-response").innerHTML=captchaToken;	
	}, { captchaToken });

	return true

	/*  this code was used to run the callback function, but it is not needed. We can just puss the submit botton instead
	// let callback function, 
	let result = await page.evaluate( () => {
		if (typeof (___grecaptcha_cfg) !== 'undefined') {
			// eslint-disable-next-line camelcase, no-undef
			return Object.entries(___grecaptcha_cfg.clients).map(([cid, client]) => {
				const data = { id: cid, version: cid >= 10000 ? 'V3' : 'V2' };
				const objects = Object.entries(client).filter(([_, value]) => value && typeof value === 'object');
				objects.forEach(([toplevelKey, toplevel]) => {
					const found = Object.entries(toplevel).find(([_, value]) => (
						value && typeof value === 'object' && 'sitekey' in value && 'size' in value
					));
					if (typeof toplevel === 'object' && toplevel instanceof HTMLElement && toplevel['tagName'] === 'DIV'){
						data.pageurl = toplevel.baseURI;
					}
					if (found) {
						const [sublevelKey, sublevel] = found;

						data.sitekey = sublevel.sitekey;
						const callbackKey = data.version === 'V2' ? 'callback' : 'promise-callback';
						const callback = sublevel[callbackKey];
						if (!callback) {
							data.callback = null;
							data.function = null;
						} else {
							data.function = callback;
							const keys = [cid, toplevelKey, sublevelKey, callbackKey].map((key) => `['${key}']`).join('');
							data.callback = `___grecaptcha_cfg.clients${keys}`;
						}
					}
				});
				return data;
			});
		}
		return [];
	});
	// return result
	let callback_function = result[0].function;
	console.log('callback_function:', callback_function);
	// run callback function
	await page.evaluate( ({ callback_function }) => { 
		eval(callback_function)();
	}, { callback_function });
	*/

}


export default captcha_solver;


