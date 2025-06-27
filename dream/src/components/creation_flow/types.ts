// components/creation-flow/types.ts
import { ReactNode } from "react";
import { z } from "zod";

export const step1Schema = z.object({
  name: z.string().min(3, "Project name is required and min 3 characters"),
  description: z
    .string()
    .min(10, "Project description is required and min 10 characters"),
  code: z.string().min(6, "A magic code is required and min 6 characters"),
});

export const step2Schema = z.object({
  features: z.array(z.string()).min(1, "Please select at least one feature"),
});

export const step3Schema = z.object({
  budget: z.preprocess(
    (a) => parseInt(z.string().parse(a), 10),
    z.number().min(1000, "Budget must be at least $1000")
  ),
  contactEmail: z.string().email("Invalid email address"),
});

export type Step1Data = z.infer<typeof step1Schema>;
export type Step2Data = z.infer<typeof step2Schema>;
export type Step3Data = z.infer<typeof step3Schema>;

export interface WizardStep {
  id: string;
  title: string;
  description: string;
  component: ReactNode;
  schema?: z.AnyZodObject;
  // Optional: Function to determine if this step should be skipped
  shouldSkip?: (formData: any) => boolean;
}
