/* test the openAI whistper API */
import dotenv from 'dotenv';
dotenv.config();

// get key
const  OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// openAI
import { Configuration, OpenAIApi } from "openai"; 

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

// the openAI whistper API
const openai = new OpenAIApi(configuration);

// transcribe audio
const transcribeAudio = async audioFileStream => {
    const response = await openai.createTranscription(
        audioFileStream,
        "whisper-1"
    );
    return response.data.text;
};  

export default transcribeAudio;
