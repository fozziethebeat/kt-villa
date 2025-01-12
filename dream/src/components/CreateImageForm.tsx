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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const QUERY = gql`
  query Styles {
    styles {
      id
      pattern
    }
  }
`;

const MUTATION = gql`
  mutation DreamImage($input: DreamImageGenerateInput!) {
    dreamImage(input: $input) {
      url
      prompt
    }
  }
`;

interface CreateImageInput {
  story: string;
  style: string;
}

export function CreateImageForm({onSave, story}) {
  const {data: styleData} = useSuspenseQuery(QUERY);
  const form = useForm<CreateImageInput>({
    defaultValues: {
      story: story || '',
      style: "simple children's crayon drawing",
    },
  });
  const [dreamImage, {data, loading}] = useMutation(MUTATION);
  const onSubmit = data => {
    dreamImage({
      variables: {
        input: data,
      },
    });
  };
  const handleStyleChange = value => {
    form.setValue('style', value);
  };

  return (
    <div className="flex flex-col gap-2 px-8">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-6">
            <div className="grid gap-3">
              <Label htmlFor="story">Story</Label>
              <Textarea
                name="story"
                className="w-full"
                rows="10"
                {...form.register('story')}
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="template">Pre-made Styles</Label>
              <Select onValueChange={handleStyleChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Start with a pre-made style" />
                </SelectTrigger>
                <SelectContent>
                  {styleData.styles.map(s => (
                    <SelectItem key={s.id} value={s.pattern}>
                      {s.pattern}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-3">
              <Label htmlFor="style">Dream Image Style</Label>
              <Textarea
                name="style"
                className="w-full"
                {...form.register('style')}
              />
            </div>

            <Button type="submit">Create</Button>
          </div>
        </form>
      </Form>
      {loading && <progress className="progress w-56"></progress>}
      {data?.dreamImage?.url && (
        <div className="card bg-base-100 w-256 shadow-xl">
          <figure className="h-512 w-512">
            <img src={data.dreamImage.url} />
          </figure>
          <div className="card-body">
            <h2 className="card-title">The Drawn Dream!</h2>
            <div className="card-actions justify-end">
              <button
                onClick={() =>
                  onSave(data.dreamImage.url, data.dreamImage.prompt)
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
