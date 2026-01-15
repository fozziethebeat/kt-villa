'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { gql, TypedDocumentNode } from '@apollo/client';
import { useMutation } from '@apollo/client/react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';

const TEST_MUTATION: TypedDocumentNode<any, any> = gql`
  mutation TestImageAdapter($input: ImageAdapterInput!) {
    testImageAdapter(input: $input) {
      url
    }
  }
`;

const UPDATE_MUTATION: TypedDocumentNode<any, any> = gql`
  mutation UpdateImageAdapter($id: Int!, $input: ImageAdapterInput!) {
    updateImageAdapter(id: $id, input: $input) {
      id
    }
  }
`;

type EditAdapterInputs = {
  adapter: string;
  promptTemplate: string;
  steps: number;
  variants: string;
};

interface EditAdapterFormProps {
  imageAdapter: any;
}

export function EditAdapterForm({ imageAdapter }: EditAdapterFormProps) {
  const router = useRouter();
  const [requestId, setRequestId] = useState(new Date());
  const { handleSubmit, register, getValues } = useForm<EditAdapterInputs>({
    defaultValues: {
      ...imageAdapter,
      variants: imageAdapter.variants.join(','),
    },
  });
  const [updateImageAdapter, { loading, error }] = useMutation(UPDATE_MUTATION, {
    onCompleted: () => {
      router.push(`/admin/adapter/${imageAdapter.id}`);
    },
  });

  const [testImageAdapter, { data: testImageData, loading: testImageLoading }] =
    useMutation(TEST_MUTATION);

  const onSubmit = data => {
    const variants = data.variants.split(',');
    updateImageAdapter({
      variables: {
        id: imageAdapter.id,
        input: {
          id: imageAdapter.id,
          adapter: data.adapter,
          promptTemplate: data.promptTemplate,
          steps: data.steps,
          variants: variants,
        },
      },
    });
  };

  const testAdapter = () => {
    setRequestId(new Date());
    const data = getValues();
    const variants = data.variants.split(',');
    testImageAdapter({
      variables: {
        input: {
          id: imageAdapter.id,
          adapter: data.adapter,
          promptTemplate: data.promptTemplate,
          steps: data.steps,
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
                    {...register('adapter')}
                  />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="promptTemplate">Prompt Template</Label>
                  <Textarea
                    name="promptTemplate"
                    className="w-full"
                    {...register('promptTemplate')}
                  />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="steps">Inference Steps</Label>
                  <Slider
                    name="steps"
                    /*
                    // @ts-ignore */
                    max={30}
                    /*
                    // @ts-ignore */
                    step={1}
                    defaultValue={[imageAdapter.steps]}
                    {...register('steps', {
                      valueAsNumber: true,
                    })}
                  />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="variants">Variants</Label>
                  <Textarea
                    name="variants"
                    className="w-full"
                    {...register('variants')}
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
