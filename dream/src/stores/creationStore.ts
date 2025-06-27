import { create } from "zustand";

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
    name: "My best friend",
    description: "A book of stories for my best friend",
    code: "magic-code",

    // Step 2.
    defaultMemory: "We were walking along...",
    systemTemplateStory: "Create a magical story for ...",
    defaultStory: "It all began on sunny day...",

    // Step 3.
    systemTemplateDream: "Transform this story into a cool image.",
    defaultDream: "",
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
        name: "My best friend",
        description: "A book of stories for my best friend",
        code: "magic-code",

        // Step 2.
        defaultMemory: "We were walking along...",
        systemTemplateStory: "Create a magical story for ...",
        defaultStory: "It all began on sunny day...",

        // Step 3.
        systemTemplateDream: "Transform this story into a cool image.",
        defaultDream: "",
      },
    }),
  setStep: (step) => set({ currentStep: step }),
}));
