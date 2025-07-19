import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCreationStore } from "@/stores/creationStore";
import { Step2Data, step2Schema } from "./types";

export function Step2Form() {
  const { defaultMemory, systemTemplateStory, defaultStory} = useCreationStore(
    (state) => state.formData
  );
  const nextStep = useCreationStore((state) => state.nextStep);
  const updateFormData = useCreationStore((state) => state.updateFormData);

  const form = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      defaultMemory,
      systemTemplateStory,
      defaultStory,
    },
  });

  const onSubmit = (data: Step2Data) => {
    updateFormData(data);
    nextStep();
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Story Creation</CardTitle>
        <CardDescription>Setup the project so its super easy for everyone to create fun stories from memories</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="defaultMemory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Initial Memory</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="systemTemplateStory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Story Generator Guidelines</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="defaultStory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Story Generator Guidelines</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full">
              Next Step
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
