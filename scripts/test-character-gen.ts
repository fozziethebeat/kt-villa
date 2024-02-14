import axios from 'axios'

import { db } from 'api/src/lib/db'

import OpenAI from 'openai'
const openai = new OpenAI({
  apiKey: '',
  baseURL: `${process.env.LLM_API_URL}/v1`,
})

export default async ({ args }) => {
  const request = {
    text: 'You are a creative AI writing assistant.  USER: <image> The image is about a unique and interesting character.  Fill in the following JSON about the character\n',
    image_data:
      'https://flowerfruits.mtn.surfacedata.org/results/GGLsF4_full.png',
    sampling_params: {
      skip_special_tokens: true,
      max_new_tokens: 256,
      temperature: 1.0,
      top_p: 1.0,
      top_k: -1,
      frequency_penalty: 0.0,
      presence_penalty: 0.0,
      ignore_eos: false,
      regex:
        '\\{\\n "name": "[\\w\\d\\s]{8,24}",\\n "hobbies": "[\\w\\d\\s,]{24,48}",\\n "background": "[\\w\\d\\s]{48,128}\\.",\\n "personality": "[\\w\\d\\s]{48,128}\\.",\\n "favorite_pun": "[\\w\\d\\s]{48,128}\\."\\n \\}',
    },
  }
  const { data } = await axios.post(
    `${process.env.LLM_API_URL}/generate`,
    request
  )
  console.log(data.text)
  const character = JSON.parse(data.text)
  console.log(character)
}
