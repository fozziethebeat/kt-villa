'use client';

import {Controller, useFieldArray, useForm} from 'react-hook-form';
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
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';

const MUTATION = gql`
  mutation TestStyle($input: TestStyleInput!) {
    testStyle(input: $input) {
      url
    }
  }
`;

interface TestStyleInput {
  id: string;
  prompt: string;
}

export function TestStyleForm({style}) {
  const form = useForm<TestStyleInput>({
    defaultValues: {
      prompt: 'A mythical field of grass populated by cats',
    },
  });
  const [testStyle, {data, loading}] = useMutation(MUTATION);
  console.log(data);

  const onSubmit = data => {
    testStyle({
      variables: {
        input: {
          id: style.id,
          prompt: data.prompt,
        },
      },
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-6">
            <div className="grid gap-3">
              <Label htmlFor="prompt">Prompt</Label>
              <Textarea
                name="prompt"
                className="w-full"
                {...form.register('prompt')}
              />
            </div>
            <Button type="submit">Update</Button>
          </div>
        </form>
      </Form>
      {loading && <progress className="progress w-56"></progress>}
      <figure className="h-80 w-80">
        {data ? (
          <img src={data.testStyle.url} />
        ) : (
          <div className="placeholder h-80 w-80 bg-neutral-content" />
        )}
      </figure>
    </div>
  );
}
