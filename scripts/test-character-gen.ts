// To access your database
// Append api/* to import from api and web/* to import from web
import { db } from 'api/src/lib/db'

import OpenAI from 'openai'
const openai = new OpenAI({
  apiKey: '',
  baseURL: `${process.env.LLM_API_URL}/v1`,
})

export default async ({ args }) => {
  // Your script here...
  const result = await openai.chat.completions.create({
    model: 'liuhaotian/llava-v1.6-vicuna-7b',
    max_tokens: 512,
    messages: [
      {
        role: 'system',
        content: 'You are a creative AI writing assistant',
      },
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: 'https://flowerfruits.mtn.surfacedata.org/results/GGLsF4_full.png',
            },
          },
          {
            type: 'text',
            text: 'Invent a unique and interesting character profile based on the image.',
          },
        ],
      },
    ],
  })
  console.log(result.choices[0].message.content)
}
