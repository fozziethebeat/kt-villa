import { create } from "zustand";

const DEFAULT_NAME = "Birthday Dreams for my best friend";
const DEFAULT_DESCRIPTION = "A book of all the best stories between me and my best friend";
const DEFAULT_CODE = "best-friends-magic-code";

const DEFAULT_MEMORY = `McFriendFace starts her morning waking up next to her cat \
McCatPants.  Then she's off to walk down the nearby shopping street Yumegai, the \
street where all the shops sell various types of dreams.  She has so many to choose \
from that she has to spend all her time looking over each option and thinking hard`;
const DEFAULT_STORY_TEMPLATE = `\
You transform a personal story into a magical dream such as the dreams found in the book \
Dallergut Dream Department Store.  The dreams will be a fun birthday present for my best \
friend named Best Friend McFriendFace.  McFriendFace is a Chinese-Japanese-American \
real-and-totally-not-invented-human and is turning 40.

When you write a dream it should tell a story that be memorable for McFriendFace.`;
const DEFAULT_STORY = `McDreamFace found themself standing at the heart of Yumegai, the \
dream shopping street, bathed in the soft glow of a thousand paper lanterns. Yet, \
instead of shops, they saw a vast, tranquil garden. Drawn by an irresistible force, they \
stepped onto the mossy path, the scent of cherry blossoms filling the air. In the center of \
the garden stood a single, ancient ginkgo tree, its leaves shimmering with an ethereal golden ]
light. As McFriendFace reached out to touch a fallen leaf, it transformed into a magnificent \
kimono, woven with threads of moonlight and adorned with a thousand intricately embroidered \
cranes. 

Each crane seemed to pulse with a life of its own, their wings rustling softly in an \
unseen breeze.  As McFriendFace slipped on the kimono, a wave of warmth surged through \
them. They looked down to see their hands glowing with a soft, golden light, and with a \
gasp, they realized they could understand the language of the cranes. They whispered \
tales of forgotten realms, of celestial dances, and of the boundless power of dreams. \
With a gentle swish of the kimono, McFriendFace felt herself rising into the air, the \
cranes on their robe taking flight, their wings carrying her higher and higher. The \
world below shrunk, becoming a tapestry of twinkling lights and swirling colors.

They soared through the starlit sky, a constellation of cranes swirling around. They \
danced with the moonbeams, painted the clouds with hues of her imagination, and felt an \
overwhelming sense of joy and freedom. In this dream, she was not just McFriendFace, \
but a celestial being, a weaver of dreams, a dancer in the cosmos. It was a birthday \
gift unlike any other, a reminder of the infinite possibilities that lay within her, \
waiting to be awakened. As she descended back to the tranquil garden, leaving the \
kimono on a bed of moss, she noticed that her cat McFaceFace and her friend \
FriendPerson were standing nearby, with a look of wonder on their faces.`;
const DEFAULT_DREAM_TEMPLATE = `\
You transform a dream story into a prompt for an image generation model.  The \
given dream story fits a particular dream theme matching one of the many dreams \
found in the book Dallergut Dream Department Store.

The created image prompt should be 2 to 3 sentences long and richly detailed.`;
const DEFAULT_DREAM = `https://stablesoaps-w1.s3.amazonaws.com/results/vfuX7I.png`;

interface CreationFormState {
  currentStep: number;
  formData: {
    // Step 1.
    name: string;
    description: string;
    code: string;

    // Step 2.
    defaultMemory: string;
    systemTemplateStory: string;
    defaultStory: string;

    // Step 3.
    systemTemplateDream: string;
    defaultDream: string;
  };
  nextStep: () => void;
  prevStep: () => void;
  updateFormData: (data: Partial<CreationFormState["formData"]>) => void;
  resetForm: () => void;
  setStep: (step: number) => void; // For direct step navigation
}

export const useCreationStore = create<CreationFormState>((set) => ({
  currentStep: 0, // 0-indexed
  formData: {
    // Step 1.
    name: DEFAULT_NAME,
    description: DEFAULT_DESCRIPTION,
    code: DEFAULT_CODE,

    // Step 2.
    defaultMemory: DEFAULT_MEMORY,
    systemTemplateStory: DEFAULT_STORY_TEMPLATE,
    defaultStory: DEFAULT_STORY,

    // Step 3.
    systemTemplateDream: DEFAULT_DREAM_TEMPLATE,
    defaultDream: DEFAULT_DREAM,
  },
  nextStep: () =>
    set((state) => ({ currentStep: Math.min(state.currentStep + 1, 3) })),
  prevStep: () =>
    set((state) => ({ currentStep: Math.max(state.currentStep - 1, 0) })),
  updateFormData: (data) =>
    set((state) => ({ formData: { ...state.formData, ...data } })),
  resetForm: () =>
    set({
      currentStep: 0,
      formData: {
        // Step 1.
        name: DEFAULT_NAME,
        description: DEFAULT_DESCRIPTION,
        code: DEFAULT_CODE,

        // Step 2.
        defaultMemory: DEFAULT_MEMORY,
        systemTemplateStory: DEFAULT_STORY_TEMPLATE,
        defaultStory: DEFAULT_STORY,

        // Step 3.
        systemTemplateDream: DEFAULT_DREAM_TEMPLATE,
        defaultDream: DEFAULT_DREAM,
      },
    }),
  setStep: (step) => set({ currentStep: step }),
}));
