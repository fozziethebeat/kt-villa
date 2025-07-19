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
import { Step3Data, step3Schema } from "./types";

export function Step3Form() {
  const { defaultDream, systemTemplateDream } = useCreationStore(
    (state) => state.formData
  );
  const nextStep = useCreationStore((state) => state.nextStep);
  const updateFormData = useCreationStore((state) => state.updateFormData);

  const form = useForm<Step3Data>({
    resolver: zodResolver(step3Schema),
    defaultValues: {
      defaultDream,
      systemTemplateDream,
    },
  });

  const onSubmit = (data: Step3Data) => {
    updateFormData(data);
    nextStep();
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Dream Creation</CardTitle>
        <CardDescription>Setup the project so that everyone can visualize their stories in the best ways possible.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="systemTemplateDream"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Name</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <img src={defaultDream} />

            <Button type="submit" className="w-full">
              Next Step
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
