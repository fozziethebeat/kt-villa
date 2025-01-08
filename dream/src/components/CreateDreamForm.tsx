'use client';

import {useForm} from 'react-hook-form';
import {gql, useSuspenseQuery, useQuery, useMutation} from '@apollo/client';

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {Button} from '@/components/ui/button';
import {Textarea} from '@/components/ui/textarea';
import {Label} from '@/components/ui/label';

const MUTATION = gql`
  mutation DreamStory($input: DreamStoryGenerateInput!) {
    dreamStory(input: $input) {
      story
    }
  }
`;

const DEFAULT_STORY = `\
Stuff here
`;

interface CreateDreamStoryInput {
  initialStory: string;
}

export function CreateDreamForm({onSave, memory}) {
  const form = useForm<CreateDreamStoryInput>({
    defaultValues: {
      initialStory: memory,
    },
  });
  const [dreamStory, {data, loading}] = useMutation(MUTATION);
  const onSubmit = data => {
    dreamStory({
      variables: {
        input: data,
      },
    });
  };

  return (
    <div className="flex flex-col gap-2 px-8">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-6">
            <div className="grid gap-3">
              <Label htmlFor="initialStory">Story</Label>
              <Textarea
                name="initialStory"
                className="w-full"
                rows="10"
                {...form.register('initialStory')}
              />
            </div>

            <Button type="submit">Dream</Button>
          </div>
        </form>
      </Form>
      {loading && <progress className="progress w-56"></progress>}
      {data?.dreamStory?.story && (
        <div className="card bg-base-100 w-256 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">The Dream!</h2>
            <p>{data.dreamStory.story}</p>
            <div className="card-actions justify-end">
              <button
                onClick={() =>
                  onSave(form.getValues().initialStory, data.dreamStory.story)
                }
                className="btn btn-primary">
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
