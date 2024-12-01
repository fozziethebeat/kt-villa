'use client';

import {gql, useMutation} from '@apollo/client';
import {useRouter} from 'next/navigation';
import {useForm} from 'react-hook-form';

import {Button} from '@/components/ui/button';
import {Form} from '@/components/ui/form';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';

const MUTATION = gql`
  mutation UpdateUsername($name: String!) {
    updateUsername(name: $name) {
      id
      name
      email
      roles
    }
  }
`;

type EditUserInput = {
  name: string;
};

export function EditUserDetails({user}) {
  const router = useRouter();
  const form = useForm<EditUserInput>({
    defaultValues: {name: user.name},
  });
  const [updateUsername, {loading, error}] = useMutation(MUTATION, {
    onCompleted: () => {
      document.getElementById('my_modal_2').close();
      router.refresh();
    },
  });

  const onSubmit = data => {
    updateUsername({
      variables: {
        name: data.name,
      },
    });
  };

  return (
    <>
      <span
        onClick={() => document.getElementById('my_modal_2').showModal()}
        className="px-4">
        Update
      </span>
      <dialog id="my_modal_2" className="modal">
        <div className="modal-box">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="id">User Name</Label>
                  <Input
                    type="text"
                    name="name"
                    className="w-full"
                    {...form.register('name')}
                  />
                </div>

                <Button type="submit">Update</Button>
              </div>
            </form>
          </Form>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </>
  );
}
