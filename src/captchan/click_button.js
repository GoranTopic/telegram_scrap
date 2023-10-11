
const click_button = async (page, selector) => {
    await page.waitForSelector('iframe');

    console.log('getting iframe');
    // get the iframes
    let iframes = page.frames();
    // Get the iframe where the reCAPTCHA is and click on checkbox
    let iframeHandle = await page.$('//iframe[@title="reCAPTCHA"]');
    let frame = await iframeHandle.contentFrame();

    // Now you are inside the iframe, you can click on the checkbox
    await frame.waitForSelector('#recaptcha-anchor');
    await frame.click('#recaptcha-anchor');

}

