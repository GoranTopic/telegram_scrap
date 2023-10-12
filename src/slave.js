import Slavery from 'slavery-js';
import axios from 'axios';

// get the endpoint
let endpoint = 'https://lugarvotacion.cne.gob.ec/CneApiWs/api/ConsultaVotacionDomicilioElectoral2021'

// get the chat
Slavery({
    numberOfSlaves: 100,
    port: 3000,
    host: 'localhost'
}).slave( async ({proxy, cedula, token, userAgent}) => {
    let response;
    try {
        response = await axios.post(endpoint, {
            "cedula": cedula.cedula,
            "nombre": cedula.dob,
            "ip": proxy.ip,
            "recaptcharesponse": token,
            headers: {
                'User-Agent': userAgent
            }
        }, {
            proxy: {
                host: proxy.ip, 
                port: proxy.port,
                protocol: 'http'
            }
        });
        console.log(`[${proxy.ip}][${cedula.cedula}] querying...${response.status}`);
        return response.data;
    } catch (e) {
        // if error is 403
        if (e.response.status === 403 ) 
            console.log(`[${proxy.ip}][${cedula.cedula}] querying...${e.response.status}`);
        throw e;
    }
});

