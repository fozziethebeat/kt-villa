"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const form = useForm<EditUserInput>({
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
    <div className="grid gap-4 md:grid-cols-[1fr_250px] lg:grid-cols-3 lg:gap-8">
      <div className="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
        <Card x-chunk="dashboard-07-chunk-0">
          <CardHeader>
            <CardTitle>Edit User Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <div className="grid gap-6">
                  <div className="grid gap-3">
                    <Label htmlFor="id">User ID</Label>
                    <Input
                      type="text"
                      disabled
                      name="id"
                      className="w-full"
                      {...form.register("id")}
                    />
                  </div>

                  <div className="grid gap-3">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      type="text"
                      name="name"
                      className="w-full"
                      {...form.register("name")}
                    />
                  </div>

                  <div className="grid gap-3">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      type="text"
                      name="email"
                      className="w-full"
                      {...form.register("email")}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="roles"
                    render={({ field }) => (
                      <FormItem>
                        <div className="grid gap-3">
                          <Label htmlFor="roles">Role</Label>
                          <Select
                            name="roles"
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="general">General</SelectItem>
                              <SelectItem value="trusted">Trusted</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="trustStatus"
                    render={({ field }) => (
                      <FormItem>
                        <div className="grid gap-3">
                          <Label htmlFor="trustStatus">Trust Status</Label>
                          <Select
                            name="trustStatus"
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="new">New</SelectItem>
                              <SelectItem value="trusted">Trusted</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </FormItem>
                    )}
                  />

                  <Button type="submit">Update</Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
