## Prompts

### Dream Theme Generation

```
const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash-exp",
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: "application/json",
  responseSchema: {
    type: "object",
    properties: {
      themes: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: {
              type: "string"
            },
            theme: {
              type: "string"
            }
          },
          required: [
            "name",
            "theme"
          ]
        }
      }
    },
    required: [
      "themes"
    ]
  },
};

async function run() {
  const chatSession = model.startChat({
    generationConfig,
    history: [],
  });

  let prompt = "List out the major themes of the dreams found in the Dallergut Dream Department Store book.  For each theme, write the theme description such that it can be used to prompt a large language model for writing dreams matching that theme and give the theme a concise unique name.";
  const result = await chatSession.sendMessage(prompt);
  console.log(result.response.text());
}
```

Produced these:

```
{
    "themes": [
        {
            "name": "Lost_In_Familiarity",
            "theme": "A dream where the dreamer finds themselves in a familiar place, but the location has subtly shifted or become distorted, causing confusion, disorientation, and a sense of unease. This can include changes to the layout of the location, the presence of unusual objects, or the disappearance of expected elements."
        },
        {
            "name": "Emotional_Wish_Fulfillment",
            "theme": "A dream where the dreamer experiences the realization of a deep emotional wish or longing, such as reconciliation with a lost loved one, achieving a significant goal, or experiencing a profound sense of belonging. The dream should emphasize the positive emotional impact of fulfilling this desire."
        },
        {
            "name": "Past_Life_Echoes",
            "theme":"A dream where the dreamer experiences fragments or echoes of a past life, characterized by strange, or unfamiliar settings, clothing, languages, and relationships. The dreamer may have glimpses of skills, experiences, or memories that they don't consciously possess in their current life, leading to a sense of wonder, intrigue, or recognition."
        },
        {
            "name": "Imminent_Danger",
            "theme": "A dream where the dreamer is acutely aware of an impending threat or danger, either from an unknown source or from a specific entity, triggering feelings of fear, anxiety, and a desperate need to escape or protect themselves. The danger can be realistic or fantastical, but the emotional response should be very palpable."
        },
        {
            "name": "Magical_Transformation",
            "theme": "A dream where the dreamer undergoes a magical or fantastical transformation, either of themselves or their surroundings. This transformation could involve physical changes, the acquisition of unusual abilities, or the appearance of magical objects or entities. Focus on the sense of awe, wonder, or empowerment that comes with these changes."
        },
        {
            "name": "Symbolic_Journey",
            "theme": "A dream where the dreamer embarks on a journey, often with a metaphorical or symbolic meaning, representing a significant life transition, self-discovery, or exploration of inner conflicts. The journey itself, the obstacles encountered, and the destination reached should all hold deeper symbolic significance for the dreamer."
        }
    ]
}
```

### Dream Generation


```javascript
const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash-exp",
  systemInstruction: "You transform a personal story in a magical dream such as the dreams found in the book Dallergut Dream Department Store.  The dreams will be a fun birthday present for my wife named Tianyi.  Tianyi is a chinese-japanese woman and is turning 36.  When you write a dream it should tell a story that be memorable for Tianyi and fit a specific theme listed below.  \n\nThe dream should be written with\n* A title\n* A 2 to 3 paragraph story\n* A 2 to 3 sentence prompt for generating an image with an image generation model\n \nThe specific theme is:\n\nA dream where the dreamer undergoes a magical or fantastical transformation, either of themselves or their surroundings. This transformation could involve physical changes, the acquisition of unusual abilities, or the appearance of magical objects or entities. Focus on the sense of awe, wonder, or empowerment that comes with these changes.",
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: "application/json",
  responseSchema: {
    type: "object",
    properties: {
      dream: {
        type: "object",
        properties: {
          title: {
            type: "string"
          },
          story: {
            type: "string"
          },
          imagePrompt: {
            type: "string"
          }
        },
        required: [
          "title",
          "story"
        ]
      }
    },
    required: [
      "dream"
    ]
  },
};

async function run() {
  const chatSession = model.startChat({
    generationConfig,
    history: [],
  });
  const prompt = "I first met tianyi when I got onto a subway to go paintballing in Chiba with some other friends.  I immediately noticed she was a cute and friendly girl and while we were paintballing together on the same team we made a lot of jokes together and had a lot of fun.  Thats how we ended up dating and eventually marrying.";
  const result = await chatSession.sendMessage(prompt);
  console.log(result.response.text());
}
```

This created the following

```json
{
    "dream": {
        "story": "The subway car rattled, not with the familiar rhythm of Tokyo's underground, but with a gentle, melodic hum. The people around Tianyi began to shimmer, their clothes morphing into vibrant silks and kimonos, the drab metal of the car transforming into a bamboo grove. She looked down at her own hands, they were no longer the hands of a commuter, but delicate, adorned with intricate henna patterns. As she rose, she felt lighter, as if she could almost float. Suddenly, she was lifted off the ground, her body now a shimmering koi fish, navigating through the bamboo leaves which had become a lush, clear river, flowing not through Tokyo, but through a magical forest where cherry blossom petals danced on the surface of the water. \n\nShe felt a rush of freedom, the gentle current carrying her past the familiar faces of the friends from her past, now transformed into playful river spirits laughing and splashing around her. Each splash sent tiny sparks of light shimmering around her. She recognized her friends from that first day at paintballing, their faces glowing with the warmth of the first time they had met. They laughed and welcomed her with open arms, or fins, as they swam together through the magical river, the colors of the river reflecting the vibrant hues of their laughter and joy.\n\nAs she swam she noticed in the distance a paintball field, but the splatters on the ground were instead the vibrant and magical colors of a thousand blooming lotuses. The sound of the game was no longer the thud of paintballs but the playful laughter of the river spirits. It was here, in this dream, that Tianyi realized this was the day she had met me. And it was a beautiful and magical place to remember.",
        "title": "The Koi of Chiba",
        "imagePrompt": "A vibrant koi fish with henna patterns swimming in a clear river surrounded by playful river spirits in a magical bamboo forest. Cherry blossom petals float on the surface."
    }
}
```

The image prompt worked pretty well with Flux while tacking on a theme style at the end.
