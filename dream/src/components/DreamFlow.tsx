'use client';
import {useState} from 'react';

import {CreateDreamForm} from '@/components/CreateDreamForm';
import {CreateImageForm} from '@/components/CreateImageForm';

const DEFAULT_MEMORY = `\
Tianyi starts her morning waking up next to her cat Mame and her husband Keith.  \
Then she's off to walk down the nearby shopping street Yumegai, the street where \
all the shops sell various types of dreams.  She has so many to choose from that \
she has to spend all her time looking over each option and thinking hard.`;

const DEFAULT_STORY = `\
Tianyi found herself standing at the heart of Yumegai, the dream shopping street, bathed in the soft glow of a thousand paper lanterns. Yet, instead of shops, she saw a vast, tranquil garden. Drawn by an irresistible force, she stepped onto the mossy path, the scent of cherry blossoms filling the air. In the center of the garden stood a single, ancient ginkgo tree, its leaves shimmering with an ethereal golden light. As Tianyi reached out to touch a fallen leaf, it transformed into a magnificent kimono, woven with threads of moonlight and adorned with a thousand intricately embroidered cranes. Each crane seemed to pulse with a life of its own, their wings rustling softly in an unseen breeze.

As Tianyi slipped on the kimono, a wave of warmth surged through her. She looked down to see her hands glowing with a soft, golden light, and with a gasp, she realized she could understand the language of the cranes. They whispered tales of forgotten realms, of celestial dances, and of the boundless power of dreams. With a gentle swish of the kimono, Tianyi felt herself rising into the air, the cranes on her robe taking flight, their wings carrying her higher and higher. The world below shrunk, becoming a tapestry of twinkling lights and swirling colors.

She soared through the starlit sky, a constellation of cranes swirling around her. She danced with the moonbeams, painted the clouds with hues of her imagination, and felt an overwhelming sense of joy and freedom. In this dream, she was not just Tianyi, but a celestial being, a weaver of dreams, a dancer in the cosmos. It was a birthday gift unlike any other, a reminder of the infinite possibilities that lay within her, waiting to be awakened. As she descended back to the tranquil garden, leaving the kimono on a bed of moss, she noticed that her cat Mame and her husband Keith were standing nearby, with a look of wonder on their faces.
`;

const DEFAULT_IMAGE =
  'https://stablesoaps-w1.s3.amazonaws.com/results/vfuX7I.png';

export function DreamFlow() {
  const [stepState, setStepState] = useState(0);
  const [memory, setMemory] = useState(DEFAULT_MEMORY);
  const [story, setStory] = useState(DEFAULT_STORY);
  const [image, setImage] = useState(DEFAULT_IMAGE);
  const onStorySave = (savedMemory, savedStory) => {
    setMemory(savedMemory);
    setStory(savedStory);
    setStepState(1);
  };
  const onImageSave = savedImage => {
    setImage(savedImage);
    setStepState(2);
  };

  return (
    <div className="w-full flex flex-col gap-4 py-4 px-4">
      <ul className="steps">
        <li
          onClick={() => setStepState(0)}
          className={`step ${stepState >= 1 ? 'step-primary' : ''}`}>
          Create the Story
        </li>
        <li
          onClick={() => setStepState(1)}
          className={`step ${stepState >= 2 ? 'step-primary' : ''}`}>
          Draw the Story
        </li>
        <li className={`step ${stepState >= 3 ? 'step-primary' : ''}`}>Save</li>
      </ul>

      {stepState === 0 && (
        <CreateDreamForm onSave={onStorySave} memory={memory} />
      )}
      {stepState === 1 && (
        <CreateImageForm onSave={onImageSave} story={story} />
      )}
      {stepState === 2 && (
        <div className="card bg-base-100 w-256 shadow-xl">
          <figure className="h-256 w-256">
            <img src={image} />
          </figure>
          <div className="card-body">
            <p>{memory}</p>
            <div className="divider">Becomes</div>
            <p>{story}</p>
            <div className="card-actions justify-end">
              <button className="btn btn-primary">Submit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
