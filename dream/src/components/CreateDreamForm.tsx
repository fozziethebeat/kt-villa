'use client';

import {useForm} from 'react-hook-form';
import {
  gql,
  useSuspenseQuery,
  useMutation,
  TypedDocumentNode,
} from '@apollo/client';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface DreamThemes {
  dreamThemes: {
    id: string;
    theme: string;
    description: string;
  }[];
}

const QUERY: TypedDocumentNode<DreamThemes> = gql`
  query DreamThemes {
    dreamThemes {
      id
      theme
      description
    }
  }
`;

const MUTATION = gql`
  mutation DreamStory($projectId: String!, $input: DreamStoryGenerateInput!) {
    dreamStory(projectId: $projectId, input: $input) {
      story
    }
  }
`;

interface CreateDreamStoryInput {
  initialStory: string;
  themeId: string;
}

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

export function CreateDreamForm({onSave, memory, project}) {
  const {data: themeData} = useSuspenseQuery(QUERY);
  const form = useForm<CreateDreamStoryInput>({
    defaultValues: {
      initialStory: memory,
      themeId:
        themeData.dreamThemes[getRandomInt(themeData.dreamThemes.length)].id,
    },
  });
  const [dreamStory, {data, loading}] = useMutation(MUTATION);
  const onSubmit = data => {
    dreamStory({
      variables: {
        projectId: project.id,
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
                rows={10}
                {...form.register('initialStory')}
              />
            </div>
            <FormField
              control={form.control}
              name="themeId"
              render={({field}) => (
                <FormItem>
                  <FormLabel>Theme</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Theme for your dream" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {themeData.dreamThemes.map(t => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.theme}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

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
              <div
                className="tooltip"
                data-tip="Don't worry about making this perfect, you can edit this in the next step">
                <button className="btn">?</button>
              </div>
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
