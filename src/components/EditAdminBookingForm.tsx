'use client';

import {CalendarIcon} from '@radix-ui/react-icons';
import {useRouter} from 'next/navigation';
import Image from 'next/image';
import {useState} from 'react';
import {useForm} from 'react-hook-form';
import {format} from 'date-fns';
import {gql, useMutation} from '@apollo/client';

import {cn} from '@/lib/utils';
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover';
import {Button} from '@/components/ui/button';
import {Calendar} from '@/components/ui/calendar';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Slider} from '@/components/ui/slider';

const MUTATION = gql`
  mutation UpdateBooking($id: Int!, $input: UpdateBookingInput!) {
    updateBooking(id: $id, input: $input) {
      id
    }
  }
`;

type EditAdminBookingInput = {
  startDate: Date;
  endDate: Date;
  numGuests: number;
  maxGuests: number;
  withCat: boolean;
  withDog: boolean;
  status: string;
  userId: string;
};

export function EditAdminBookingForm({booking}) {
  const router = useRouter();
  const form = useForm<EditAdminBookingInput>({
    defaultValues: booking,
  });
  const [updateBooking, {loading}] = useMutation(MUTATION, {
    onCompleted: () => {
      router.push(`/admin/booking/${booking.id}`);
    },
  });
  const onSubmit = data => {
    updateBooking({
      variables: {
        id: booking.id,
        input: {
          startDate: data.startDate,
          endDate: data.endDate,
          numGuests: parseInt(data.numGuests),
          maxGuests: parseInt(data.maxGuests),
          userId: data.userId,
          status: data.status,
        },
      },
    });
  };
  return (
    <div className="grid gap-4 md:grid-cols-[1fr_250px] lg:grid-cols-3 lg:gap-8">
      <div className="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
        <Card x-chunk="dashboard-07-chunk-0">
          <CardHeader>
            <CardTitle>Edit Booking Details</CardTitle>
            <CardDescription></CardDescription>
          </CardHeader>
          <CardContent>
            {booking?.item?.image ? (
              <Image
                src={booking.item.image}
                alt="thing"
                width={256}
                height={256}
              />
            ) : (
              <div className=" placeholder h-[256px] w-[256px] bg-neutral-content" />
            )}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <div className="grid gap-6">
                  <div className="grid gap-3">
                    <Label htmlFor="id">Booking ID</Label>
                    <div>{booking.id}</div>
                  </div>

                  <div className="grid gap-3">
                    <Label htmlFor="id">User ID</Label>
                    <Input
                      type="text"
                      name="userId"
                      className="w-full"
                      {...form.register('userId')}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({field}) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Start Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={'outline'}
                                className={cn(
                                  'w-[240px] pl-3 text-left font-normal',
                                  !field.value && 'text-muted-foreground',
                                )}>
                                {field.value ? (
                                  format(field.value, 'PPP')
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({field}) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>End Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={'outline'}
                                className={cn(
                                  'w-[240px] pl-3 text-left font-normal',
                                  !field.value && 'text-muted-foreground',
                                )}>
                                {field.value ? (
                                  format(field.value, 'PPP')
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-3">
                    <Label htmlFor="id">Num Guests</Label>
                    <Slider
                      name="id"
                      defaultValue={[booking.numGuests]}
                      /*
                      // @ts-ignore */
                      max={5}
                      /*
                      // @ts-ignore */
                      min={1}
                      /*
                      // @ts-ignore */
                      step={1}
                      {...form.register('numGuests')}
                    />
                    <div className="flex w-full justify-between px-2 text-xs">
                      <span>1</span>
                      <span>2</span>
                      <span>3</span>
                      <span>4</span>
                      <span>5</span>
                    </div>
                  </div>

                  <div className="grid gap-3">
                    <Label htmlFor="id">Max Guests</Label>
                    <Slider
                      name="id"
                      defaultValue={[booking.maxGuests]}
                      /*
                      // @ts-ignore */
                      max={5}
                      /*
                      // @ts-ignore */
                      min={1}
                      /*
                      // @ts-ignore */
                      step={1}
                      {...form.register('maxGuests')}
                    />
                    <div className="flex w-full justify-between px-2 text-xs">
                      <span>1</span>
                      <span>2</span>
                      <span>3</span>
                      <span>4</span>
                      <span>5</span>
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="status"
                    render={({field}) => (
                      <FormItem>
                        <div className="grid gap-3">
                          <Label htmlFor="status">Status</Label>
                          <Select
                            name="status"
                            onValueChange={field.onChange}
                            defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="approved">Approved</SelectItem>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </FormItem>
                    )}
                  />

                  <Button type="submit">Update</Button>

                  {loading && (
                    <progress className="progress progress-primary w-56" />
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
