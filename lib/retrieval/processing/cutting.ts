import { FileItemChunk } from "@/types";
import fetch from "node-fetch";

interface TokenizeResponse {
  count: number;
  max_model_len: number;
  tokens: number[];
}

async function cut_string(
  chunk: FileItemChunk,
  model: string
): Promise<FileItemChunk> {
  const clean_string = process.env.OPENAI_BASE_URL?.replace("/v1", "");
  const response = await fetch(clean_string + "/tokenize", {
    method: "POST",
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: model,
      prompt: chunk["content"],
      add_special_tokens: true,
      additionalProp1: {},
    }),
  });
  const body: TokenizeResponse = await response.json();
  if (body["max_model_len"] < body["count"]) {
    chunk["content"] = chunk["content"].substring(
      0,
      chunk["content"].length - 1
    );
    return await cut_string(chunk, model);
  }
  return chunk;
}

export async function cut_strings(
  chunks: FileItemChunk[],
  model: string
): Promise<FileItemChunk[]> {

  const maxParallelRequests = 10;
  const results: FileItemChunk[] = [];
  let queue: Promise<void>[] = [];

  async function processChunk(chunk: FileItemChunk) {
    const result = await cut_string(chunk, model);
    results.push(result);
  }

  for (const chunk of chunks) {
    const task = processChunk(chunk);
    queue.push(task);

    if (queue.length >= maxParallelRequests) {
      await Promise.all(queue);
      queue = []
    }
  }

  if (queue.length > 0) {
    await Promise.all(queue);
  }

  return results;
}