'use client';

import {useRouter} from 'next/navigation';
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
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';

interface UsernameInput {
  name: string;
}

const MUTATION = gql`
  mutation UpdateUsername($input: String!) {
    updateUsername(input: $input) {
      name
    }
  }
`;

export function UsernameForm() {
  const router = useRouter();
  const form = useForm<UsernameInput>({
    defaultValues: {
      name: 'your name',
    },
  });
  const [updateUsername, {loading}] = useMutation(MUTATION, {
    onCompleted: () => {
      router.push('/');
    },
  });
  const onSubmit = data => {
    updateUsername({
      variables: {
        input: data.name,
      },
    });
  };
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid gap-6">
          <div className="grid gap-3">
            <Input
              name="name"
              type="text"
              placeholder="Your name"
              {...form.register('name')}
            />
          </div>
          <Button type="submit">Update Name</Button>
        </div>
      </form>
      {loading && <progress className="progress w-56"></progress>}
    </Form>
  );
}
