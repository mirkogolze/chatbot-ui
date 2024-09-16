
import OpenAI from "openai"
import llama3Tokenizer from 'llama3-tokenizer-js'

export const summerizeFunction = async (
    textContent:string
): Promise<string> => {
    const tokens = llama3Tokenizer.encode(textContent).length;
    if(tokens > parseInt(process.env.SUMMERIZATION_TOKENS || "128000")*2/3){
        let middle = Math.floor(textContent.length / 2);
        let before = textContent.lastIndexOf('.', middle);
        let after = textContent.indexOf('.', middle + 1);

        if (before == -1 || (after != -1 && middle - before >= after - middle)) {
            middle = after;
        } else {
            middle = before;
        }
        const text1 = summerizeFunction(textContent.substring(0,middle))
        const text2 = summerizeFunction(textContent.substring(middle+1))
        return await text1 +  await text2
    }
    const customOpenai = new OpenAI({
        baseURL: process.env.OPENAI_BASE_URL,
        apiKey: "DUMMY",
        timeout:1000*60*60*24,
        maxRetries: 0,
      })
    const response = await customOpenai.chat.completions.create({
        model: process.env.SUMMERIZATION_MODEL || "", // Long context window Model
        messages : [{"role":"system", "content":"You are a detailed summerization bot. You take the User input and summize it into a detailed summerization in the language given by the user. Make sure that the summerization is detailed and make sure to just return the summerization. If the text has chapter make it chapterwise. Make sure the language provided by the user is used as the summary language. If the text is in german make the summery in german aswell. Make sure to include detailes."},
            {"role":"user", "content": textContent}
        ],
        temperature:0.5,
        max_tokens:parseInt(process.env.SUMMERIZATION_TOKENS || "128000")/3,
        frequency_penalty:0.1
    })
    return response.choices[0].message.content || ""
}