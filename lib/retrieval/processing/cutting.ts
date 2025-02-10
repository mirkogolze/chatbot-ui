import { FileItemChunk } from "@/types";
import fetch from 'node-fetch';


interface TokenizeResponse {
    count: number;
    max_model_len: number;
    tokens: number[];
  }


async function cut_string(chunk:FileItemChunk, model:string):Promise<FileItemChunk>{
    const clean_string = process.env.OPENAI_BASE_URL?.replace("/v1", "")
    return fetch(clean_string + '/tokenize', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          'model': model,
          'prompt': chunk["content"],
          'add_special_tokens': true,
          'additionalProp1': {}
        })
      }).then(async (value)=>{
        const body: TokenizeResponse = await value.json()
        if(body["max_model_len"] < body["count"]){
            chunk["content"] = chunk["content"].substring(0, chunk["content"].length - 1);
            return cut_string(chunk, model);
        }
        return chunk;
      });
}


export async function cut_strings(chunks:FileItemChunk[],model:string ):Promise<FileItemChunk[]> {
    return Promise.all(chunks.map( async (fileitem) =>{
            return cut_string(fileitem, model)
        }))
    
}