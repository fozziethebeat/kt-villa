"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { gql, useMutation } from "@apollo/client";

const TEST_MUTATION = gql`
  mutation TestImageAdapter($input: TestImageAdapterInput!) {
    testImageAdapter(input: $input) {
      url
    }
  }
`;

type EditAdapterInputs = {
  adapter: string;
  promptTemplate: string;
  negativePrompt: string;
  steps: number;
  variants: string[];
};

export function EditAdapterForm({ imageAdapter }) {
  const [requestId, setRequestId] = useState(new Date());
  const { register, getValues } = useForm<EditAdapterInputs>({
    defaultValues: imageAdapter,
  });
  const [testImageAdapter, { data: testImageData, loading: testImageLoading }] =
    useMutation(TEST_MUTATION);

  const testAdapter = () => {
    setRequestId(new Date());
    const data = getValues();
    const variants =
      typeof data.variants === "string"
        ? data.variants.split(",")
        : data.variants;
    testImageAdapter({
      variables: {
        input: {
          id: data.id,
          adapter: data.adapter,
          promptTemplate: data.promptTemplate,
          negativePrompt: data.negativePrompt,
          steps: parseInt(data.steps),
          variants: variants,
        },
      },
    });
  };
  return (
    <div>
      <form>
        <label className="form-control">
          <div className="label">
            <span className="label-text">Adapter Name </span>
          </div>
          <input
            type="text"
            name="adapter"
            className="input input-bordered w-full max-w-xs"
            {...register("adapter")}
          />
        </label>
        <label className="form-control">
          <div className="label">
            <span className="label-text"> Prompt Template</span>
          </div>
          <textarea
            name="promptTemplate"
            className="textarea textarea-bordered"
            {...register("promptTemplate")}
          />
        </label>
        <label className="form-control">
          <div className="label">
            <span className="label-text">Negative Prompt</span>
          </div>
          <textarea
            name="negativePrompt"
            className="textarea textarea-bordered"
            {...register("negativePrompt")}
          />
        </label>
        <div className="form-control">
          <label className="label">
            <span className="label-text">Steps</span>
          </label>
          <input
            name="steps"
            type="range"
            className="range"
            min="1"
            max="30"
            step="1"
            {...register("steps")}
          />
        </div>

        <label className="form-control">
          <div className="label">
            <span className="label-text">Variants</span>
          </div>
          <input
            type="text"
            name="variants"
            className="textarea textarea-bordered"
            defaultValue={imageAdapter.variants.join(",")}
            {...register("variants")}
          />
        </label>

        <button type="button" onClick={testAdapter}>
          Test
        </button>
      </form>
      {testImageLoading && (
        <progress className="progress progress-primary w-56" />
      )}
      <figure className="flex justify-center">
        {testImageData ? (
          <img src={`${testImageData.testImageAdapter.url}?${requestId}`} />
        ) : (
          <div className=" placeholder h-[1024px] w-[1024px] bg-neutral-content" />
        )}
      </figure>
    </div>
  );
}
