"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { gql, useMutation } from "@apollo/client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";

const TEST_MUTATION = gql`
  mutation TestImageAdapter($input: ImageAdapterInput!) {
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
  const router = useRouter();
  const [requestId, setRequestId] = useState(new Date());
  const { handleSubmit, register, getValues } = useForm<EditAdapterInputs>({
    defaultValues: imageAdapter,
  });
  const [updateImageAdapter, { loading, error }] = useMutation(
    UPDATE_MUTATION,
    {
      onCompleted: () => {
        router.push(`/admin/adapter/${imageAdapter.id}`);
      },
    }
  );

  const [testImageAdapter, { data: testImageData, loading: testImageLoading }] =
    useMutation(TEST_MUTATION);

  const onSubmit = (data) => {
    const variants =
      typeof data.variants === "string"
        ? data.variants.split(",")
        : data.variants;
    updateImageAdapter({
      variables: {
        id: data.id,
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
    <div className="grid gap-4 md:grid-cols-[1fr_250px] lg:grid-cols-3 lg:gap-8">
      <div className="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
        <Card x-chunk="dashboard-07-chunk-0">
          <CardHeader>
            <CardTitle>Edit Adapter Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="grid gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="adapter">Name</Label>
                  <Input
                    type="text"
                    name="adapter"
                    className="w-full"
                    {...register("adapter")}
                  />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="promptTemplate">Prompt Template</Label>
                  <Textarea
                    type="text"
                    name="promptTemplate"
                    className="w-full"
                    {...register("promptTemplate")}
                  />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="steps">Inference Steps</Label>
                  <Slider
                    name="steps"
                    min={1}
                    max={30}
                    step={1}
                    defaultValue={[imageAdapter.steps]}
                    {...register("steps")}
                  />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="variants">Variants</Label>
                  <Textarea
                    type="text"
                    name="variants"
                    className="w-full"
                    defaultValue={imageAdapter.variants.join(",")}
                    {...register("variants")}
                  />
                </div>

                <Button type="button" variant="outline" onClick={testAdapter}>
                  Test
                </Button>

                <Button type="submit">Update</Button>
              </div>
            </form>
          </CardContent>
        </Card>
        <Card x-chunk="dashboard-07-chunk-0">
          <CardHeader>
            <CardTitle>Test Image</CardTitle>
          </CardHeader>
          <CardDescription>
            {testImageLoading && (
              <progress className="progress progress-primary w-56" />
            )}
          </CardDescription>
          <CardContent>
            <figure className="flex justify-center">
              {testImageData ? (
                <img
                  src={`${testImageData.testImageAdapter.url}?${requestId}`}
                />
              ) : (
                <div className=" placeholder h-[1024px] w-[1024px] bg-neutral-content" />
              )}
            </figure>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
