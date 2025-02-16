import { Elysia } from "elysia";
import { OpenAI } from "openai";
import { API_KEY } from "./constant";
import cors from "@elysiajs/cors";

const openai = new OpenAI({
  apiKey: API_KEY,
});

const app = new Elysia()
  .post("/chat", async ({ body }: { body: any }) => {
    const txt = body.message ?? `Empty`;
    if (txt === `Empty`) return { text: `Empty Text` };
    console.log(`Receive Message : ${txt}`);
    const response = await getResponse(txt);
    return { text: response };
  })
  .use(cors())
  .listen(6699);

const getResponse = async (text: string) => {
  const prompt = `
    You are a Professional AML Detection Agent specializing in blockchain and on-chain data. 
    Your task is to analyze the "fundedBy" data and determine if a wallet is funded by a centralized exchange (CEX). 
    If the wallet is funded by known exchanges such as Binance, Bybit, Coinbase, Kraken, Gemini, KuCoin, etc., 
    the wallet will be considered "SAFE". If it is not funded by these exchanges, 
    the wallet will be flagged as "NOT_SAFE".

    Please analyze the following input data and respond with the status:

    Input Data: ${text}

    Response should be in the format:
    {
      "amlStatus": "SAFE" | "NOT_SAFE"
    }
  `;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini-2024-07-18", // Specify the GPT-4 model, this could be 'gpt-4' or any mini version
    messages: [
      { role: "system", content: prompt },
      { role: "user", content: text },
    ],
    max_tokens: 8192,
    temperature: 0.5,
  });

  return JSON.parse(response.choices[0].message.content ?? `{}`);
};

console.log(`🛡 AML Agent is running ....`);
