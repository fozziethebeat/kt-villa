"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { gql, useMutation, TypedDocumentNode } from "@apollo/client";

const MUTATION = gql`
  mutation UpdateUserDetails($input: UpdateUserDetailsInput!) {
    updateUserDetails(input: $input) {
      id
    }
  }
`;

type UpdateUserDetails = {
  name: string;
  referral: string;
  socialType: string;
  socialHandle: string;
};

export function NewUserForm() {
  const router = useRouter();
  const form = useForm<UpdateUserDetails>({
    defaultValues: {},
  });

  const [update, { loading, error }] = useMutation(MUTATION, {
    onCompleted: () => {
      router.refresh();
    },
  });

  const onSubmit = (data) => {
    update({
      variables: {
        input: data,
      },
    });
  };

  return (
    <div className="my-2">
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid gap-4">
          <div className="form-control">
            <label className="input input-bordered flex items-center gap-2">
              <span>Name</span>
              <input
                type="text"
                id="name"
                name="name"
                placeholder="Name McName"
                required
                {...form.register("name")}
              />
            </label>
          </div>

          <div className="form-control">
            <label className="input input-bordered flex items-center gap-2">
              <span>Referral</span>
              <input
                type="text"
                id="referral"
                name="referral"
                placeholder="Friend McFriend"
                required
                {...form.register("referral")}
              />
            </label>
          </div>

          <div className="form-control">
            <select
              className="select"
              id="socialType"
              name="socialType"
              defaultValue="none"
              {...form.register("socialType")}
            >
              <option disabled value="none">
                Pick a Social for contact
              </option>
              <option value="instagram">Instagram</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="wechat">WeChat</option>
            </select>
          </div>

          <div className="form-control">
            <label className="input input-bordered flex items-center gap-2">
              <span>Social</span>
              <input
                type="text"
                id="socialHandle"
                name="socialHandle"
                placeholder="@platform.username"
                {...form.register("socialHandle")}
              />
            </label>
          </div>

          <div className="form-control mt-2">
            <button type="submit" className="btn btn-primary btn-sm">
              Save
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
