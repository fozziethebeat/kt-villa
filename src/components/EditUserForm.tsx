"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { gql, useMutation } from "@apollo/client";

const MUTATION = gql`
  mutation UpdateUser($id: String!, $input: UpdateUserInput!) {
    updateUser(id: $id, input: $input) {
      id
      name
      email
      roles
      trustStatus
    }
  }
`;

type EditUserInput = {
  id: string;
  name: string;
  email: string;
  roles: string;
  trustStatus: string;
};

export function EditUserForm({ user }) {
  const router = useRouter();
  const { handleSubmit, register, getValues } = useForm<EditUserInput>({
    defaultValues: user,
  });
  const [updateUser, { loading, error }] = useMutation(MUTATION, {
    onCompleted: () => {
      router.push(`/admin/user/${user.id}`);
    },
  });

  const onSubmit = (data) => {
    updateUser({
      variables: {
        id: user.id,
        input: {
          name: data.name,
          email: data.email,
          roles: data.roles,
          trustStatus: data.trustStatus,
        },
      },
    });
  };

  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <label className="form-control">
          <div className="label">
            <span className="label-text">User ID</span>
          </div>
          <input
            disabled
            type="text"
            name="id"
            className="input input-bordered w-full max-w-xs"
            {...register("id")}
          />
        </label>
        <label className="form-control">
          <div className="label">
            <span className="label-text">Name</span>
          </div>
          <input
            type="text"
            name="name"
            className="input input-bordered w-full max-w-xs"
            {...register("name")}
          />
        </label>
        <label className="form-control">
          <div className="label">
            <span className="label-text">Email</span>
          </div>
          <input
            type="text"
            name="email"
            className="input input-bordered w-full max-w-xs"
            {...register("email")}
          />
        </label>
        <label className="form-control">
          <div className="label">
            <span className="label-text">Roles</span>
          </div>
          <select
            name="roles"
            {...register("roles")}
            className="select select-bordered w-full max-w-xs"
          >
            <option>general</option>
            <option>trusted</option>
            <option>admin</option>
          </select>
        </label>

        <label className="form-control">
          <div className="label">
            <span className="label-text">Trust Status</span>
          </div>
          <select
            name="trustStatus"
            {...register("trustStatus")}
            className="select select-bordered w-full max-w-xs"
          >
            <option>new</option>
            <option>trusted</option>
          </select>
        </label>

        <button type="submit" className="btn btn-primary">
          Udpate
        </button>
      </form>
    </div>
  );
}
