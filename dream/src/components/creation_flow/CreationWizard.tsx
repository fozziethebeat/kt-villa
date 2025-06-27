"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCreationStore } from "@/stores/creationStore";
import { Step1Form } from "./Step1Form";
import { Step2Form } from "./Step2Form";
import { Step3Form } from "./Step3Form";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";

// Define your steps
const stepsContent = [
  {
    id: "basics",
    title: "Project Details",
    description: "Who is this for? What makes this special?",
    component: <Step1Form />,
    progress: 33,
  },
  {
    id: "story",
    title: "Story Creation",
    description: "Setup story creation for friends.",
    component: <Step2Form />,
    progress: 66,
  },
  {
    id: "dream",
    title: "Dream Creation",
    description: "Setup dream creation for friends.",
    component: <Step3Form />,
    progress: 100,
  },
];

export function CreationWizard() {
  const currentStep = useCreationStore((state) => state.currentStep);
  const formData = useCreationStore((state) => state.formData);
  const prevStep = useCreationStore((state) => state.prevStep);
  const nextStep = useCreationStore((state) => state.nextStep);
  const setStep = useCreationStore((state) => state.setStep);
  const updateFormData = useCreationStore((state) => state.updateFormData);

  const CurrentStepComponent = useMemo(() => {
    // Dynamic step rendering based on currentStep index
    return stepsContent[currentStep]?.component;
  }, [currentStep]);

  const CurrentStepTitle = stepsContent[currentStep]?.title;
  const CurrentStepProgress = stepsContent[currentStep]?.progress;

  // Placeholder for final summary or submission
  const renderFinalStep = () => {
    return (
      <div className="text-center space-y-6">
        <h2 className="text-3xl font-bold">Review Your Project</h2>
        <p className="text-lg text-gray-600">
          Please review the details before submission.
        </p>

        <div className="card bg-base-100 shadow-xl p-6 rounded-box">
          <h3 className="font-semibold text-xl mb-4">Summary</h3>
          <p>
            <strong>Project Name:</strong> {formData.projectName || "N/A"}
          </p>
          <p>
            <strong>Project Type:</strong> {formData.projectType || "N/A"}
          </p>
          <p>
            <strong>Features:</strong>{" "}
            {formData.features.length > 0
              ? formData.features.join(", ")
              : "N/A"}
          </p>
          <p>
            <strong>Budget:</strong> ${formData.budget || "N/A"}
          </p>
          <p>
            <strong>Contact Email:</strong> {formData.contactEmail || "N/A"}
          </p>
        </div>

        <Button
          className="btn btn-primary"
          onClick={() => alert("Submitting form!")}
        >
          Submit
        </Button>
        <Button variant="outline" onClick={() => setStep(0)} className="ml-4">
          Reset
        </Button>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <ul className="steps w-full mb-8">
        {stepsContent.map((step, index) => (
          <li
            key={step.id}
            className={`step ${currentStep >= index ? "step-primary" : ""}`}
            onClick={() => setStep(index)}
          >
            {step.title}
          </li>
        ))}
      </ul>

      <div className="mb-8">
        <Progress value={CurrentStepProgress} className="w-full" />
        <p className="text-sm text-center mt-2 text-gray-500">
          Step {currentStep + 1} of {stepsContent.length}: {CurrentStepTitle}
        </p>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
          className="min-h-[300px] flex items-center justify-center"
        >
          {currentStep < stepsContent.length
            ? CurrentStepComponent
            : renderFinalStep()}
        </motion.div>
      </AnimatePresence>

      <div className="flex justify-between mt-8">
        {currentStep > 0 && currentStep < stepsContent.length && (
          <Button variant="outline" onClick={prevStep}>
            Previous
          </Button>
        )}
      </div>
    </div>
  );
}
