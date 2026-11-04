"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { gql, TypedDocumentNode } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Palette,
  Save,
  Sparkles,
} from "lucide-react";

const TEST_MUTATION: TypedDocumentNode<any, any> = gql`
  mutation TestImageAdapter($input: ImageAdapterInput!) {
    testImageAdapter(input: $input) {
      url
      prompt
    }
  }
`;

const UPDATE_MUTATION: TypedDocumentNode<any, any> = gql`
  mutation UpdateImageAdapter($id: Int!, $input: ImageAdapterInput!) {
    updateImageAdapter(id: $id, input: $input) {
      id
    }
  }
`;

type EditAdapterInputs = {
  adapter: string;
  promptTemplate: string;
  steps: number;
  variants: string;
};

interface EditAdapterFormProps {
  imageAdapter: any;
}

export function EditAdapterForm({ imageAdapter }: EditAdapterFormProps) {
  const router = useRouter();
  const [requestId, setRequestId] = useState<number>(Date.now());
  const [saved, setSaved] = useState(false);

  const { handleSubmit, register, getValues } = useForm<EditAdapterInputs>({
    defaultValues: {
      adapter: imageAdapter.adapter || "",
      promptTemplate: imageAdapter.promptTemplate || "",
      steps: imageAdapter.steps ?? 6,
      variants: (imageAdapter.variants ?? []).join(", "),
    },
  });

  const [updateImageAdapter, { loading, error }] = useMutation(
    UPDATE_MUTATION,
    {
      onCompleted: () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        router.refresh();
      },
    }
  );

  const [
    testImageAdapter,
    { data: testImageData, loading: testImageLoading, error: testError },
  ] = useMutation(TEST_MUTATION);

  const onSubmit = (data: EditAdapterInputs) => {
    const variants = data.variants
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    updateImageAdapter({
      variables: {
        id: imageAdapter.id,
        input: {
          id: imageAdapter.id,
          adapter: data.adapter,
          promptTemplate: data.promptTemplate,
          steps: Number(data.steps) || 6,
          variants,
        },
      },
    });
  };

  const testAdapter = () => {
    setRequestId(Date.now());
    const data = getValues();
    const variants = data.variants
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    testImageAdapter({
      variables: {
        input: {
          id: imageAdapter.id,
          adapter: data.adapter,
          promptTemplate: data.promptTemplate,
          steps: Number(data.steps) || 6,
          variants,
        },
      },
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <Link
          href="/admin?view=adapters"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to AI Style Adapters
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left: Adapter Form */}
        <div className="lg:col-span-7">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8"
          >
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-primary">
                  AI Style Adapter #{imageAdapter.id}
                </p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
                  {imageAdapter.adapter}
                </h1>
              </div>

              {saved && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-800">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Saved!
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-1.5 sm:col-span-2">
                <label
                  htmlFor="edit-adapter-name"
                  className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  Style Name / Identifier
                </label>
                <input
                  id="edit-adapter-name"
                  type="text"
                  className="h-10 w-full rounded-xl border border-input bg-background px-3.5 text-sm text-foreground focus:border-primary focus:outline-none"
                  {...register("adapter")}
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="edit-adapter-steps"
                  className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  Steps (1–30)
                </label>
                <input
                  id="edit-adapter-steps"
                  type="number"
                  min={1}
                  max={30}
                  className="h-10 w-full rounded-xl border border-input bg-background px-3.5 text-sm text-foreground focus:border-primary focus:outline-none"
                  {...register("steps", { valueAsNumber: true })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="edit-adapter-template"
                className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Prompt Template
              </label>
              <p className="text-xs text-muted-foreground">
                Use{" "}
                <code className="rounded bg-muted px-1 py-0.5 font-mono">
                  {"{fragment}"}
                </code>{" "}
                for a random variant below,{" "}
                <code className="rounded bg-muted px-1 py-0.5 font-mono">
                  {"{setting}"}
                </code>{" "}
                for a Hakuba seasonal scene, and{" "}
                <code className="rounded bg-muted px-1 py-0.5 font-mono">
                  {"{mood}"}
                </code>{" "}
                for seasonal lighting.
              </p>
              <textarea
                id="edit-adapter-template"
                rows={4}
                className="w-full rounded-xl border border-input bg-background p-3.5 font-mono text-xs leading-relaxed text-foreground focus:border-primary focus:outline-none"
                {...register("promptTemplate")}
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="edit-adapter-variants"
                className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Subject / Character Variants (comma-separated)
              </label>
              <textarea
                id="edit-adapter-variants"
                rows={3}
                className="w-full rounded-xl border border-input bg-background p-3.5 text-xs leading-relaxed text-foreground focus:border-primary focus:outline-none"
                {...register("variants")}
              />
            </div>

            {(error || testError) && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-xs text-destructive">
                {error?.message ||
                  testError?.message ||
                  "An error occurred while processing the adapter."}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
              <button
                type="button"
                disabled={testImageLoading}
                onClick={testAdapter}
                className="inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2.5 text-xs font-semibold text-primary transition hover:bg-primary/20 disabled:opacity-50"
              >
                {testImageLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                <span>
                  {testImageLoading
                    ? "Generating Test Preview..."
                    : "Test Generate Preview"}
                </span>
              </button>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>Save Adapter Settings</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right: Live Test Output Card */}
        <div className="lg:col-span-5">
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="relative flex aspect-square w-full items-center justify-center bg-muted">
              {testImageData?.testImageAdapter?.url ? (
                <img
                  src={`${testImageData.testImageAdapter.url}?t=${requestId}`}
                  alt="Generated test preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="space-y-2 p-8 text-center text-muted-foreground">
                  <Palette className="mx-auto h-10 w-10 text-primary/40" />
                  <p className="text-sm font-semibold text-foreground">
                    Live Style Sandbox
                  </p>
                  <p className="text-xs">
                    Click &ldquo;Test Generate Preview&rdquo; to sample a
                    seasonal prompt and render a test emblem with Gemini.
                  </p>
                </div>
              )}
            </div>

            {testImageData?.testImageAdapter?.prompt && (
              <div className="space-y-2 border-t border-border bg-muted/30 p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-primary">
                  Expanded Seasonal Prompt
                </p>
                <p className="text-xs leading-relaxed text-foreground/85">
                  {testImageData.testImageAdapter.prompt}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
