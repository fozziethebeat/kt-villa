"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import {
  formatJstFullDate,
  parseJstDateToUtc,
  toJstDateString,
} from "@/lib/jst-date";
import {
  Loader2,
  Palette,
  Pencil,
  Plus,
  Sparkles,
  X,
} from "lucide-react";

const CREATE_ADAPTER_MUTATION = gql`
  mutation CreateImageAdapter($input: ImageAdapterInput!) {
    createImageAdapter(input: $input) {
      id
      adapter
      promptTemplate
    }
  }
`;

export function AdminAdapterTableClient({ adapters }: { adapters: any[] }) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [adapterName, setAdapterName] = useState("");
  const [promptTemplate, setPromptTemplate] = useState(
    "{fragment} in {setting}, {mood}, Japanese woodblock print style"
  );
  const [variantsText, setVariantsText] = useState(
    "red fox, snow monkey, tanuki, shiba inu, crane, serow"
  );
  const [startDate, setStartDate] = useState(() =>
    toJstDateString(new Date())
  );
  const [steps, setSteps] = useState(6);

  const [createAdapter, { loading, error }] = useMutation(
    CREATE_ADAPTER_MUTATION,
    {
      onCompleted: (res: any) => {
        dialogRef.current?.close();
        router.refresh();
        if (res?.createImageAdapter?.id) {
          router.push(`/admin/adapter/${res.createImageAdapter.id}`);
        }
      },
    }
  );

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const variants = variantsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    createAdapter({
      variables: {
        input: {
          adapter: adapterName.trim() || "ukiyo-e",
          promptTemplate: promptTemplate.trim(),
          variants,
          steps: Number(steps) || 6,
          startDate: parseJstDateToUtc(startDate).toISOString(),
        },
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Creative AI Engine Explainer Banner */}
      <div className="rounded-2xl border border-primary/25 bg-primary/5 p-5">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="space-y-1">
            <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Seasonal Hakuba Art Director Engine
            </p>
            <h3 className="text-base font-bold text-foreground">
              How AI Booking Emblems Are Generated
            </h3>
            <p className="max-w-3xl text-xs leading-relaxed text-muted-foreground">
              Each new booking matches its check-in date to Hakuba&apos;s four
              seasons (Deep Powder Winter, Alpine Spring Melt, Green Alps
              Summer, or Koyo Autumn Foliage) and selects a non-repeating style
              adapter below. Placeholders{" "}
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px] text-foreground">
                {"{fragment}"}
              </code>
              ,{" "}
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px] text-foreground">
                {"{setting}"}
              </code>
              , and{" "}
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px] text-foreground">
                {"{mood}"}
              </code>{" "}
              are expanded by Gemini into a vivid scene.
            </p>
          </div>

          <button
            type="button"
            onClick={() => dialogRef.current?.showModal()}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            New Style Adapter
          </button>
        </div>
      </div>

      {/* Adapters Table */}
      <div className="responsive-table-wrapper rounded-2xl border border-border bg-card shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">ID &amp; Style Name</th>
              <th className="px-4 py-3">Window Start</th>
              <th className="px-4 py-3">Prompt Template</th>
              <th className="px-4 py-3">Subject Variants</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {adapters.map((adapter) => (
              <tr key={adapter.id} className="transition hover:bg-muted/30">
                <td className="whitespace-nowrap px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 font-mono text-xs font-bold text-primary">
                      #{adapter.id}
                    </span>
                    <span className="font-bold text-foreground">
                      {adapter.adapter}
                    </span>
                  </div>
                </td>

                <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                  {adapter.startDate
                    ? formatJstFullDate(adapter.startDate)
                    : "Anytime"}
                </td>

                <td className="max-w-md px-4 py-3">
                  <p className="line-clamp-2 font-mono text-xs text-foreground/90">
                    {adapter.promptTemplate}
                  </p>
                </td>

                <td className="max-w-xs px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {(adapter.variants ?? []).slice(0, 5).map((v: string, i: number) => (
                      <span
                        key={i}
                        className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground/80"
                      >
                        {v.trim()}
                      </span>
                    ))}
                    {(adapter.variants ?? []).length > 5 && (
                      <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
                        +{(adapter.variants ?? []).length - 5} more
                      </span>
                    )}
                  </div>
                </td>

                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <Link
                    href={`/admin/adapter/${adapter.id}`}
                    className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/20"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit &amp; Test
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create New Adapter Modal */}
      <dialog
        ref={dialogRef}
        onClick={(e) => {
          if (e.target === dialogRef.current) {
            dialogRef.current?.close();
          }
        }}
        className="w-full max-w-lg rounded-2xl border border-border bg-card p-0 text-card-foreground shadow-2xl"
      >
        <div className="p-6">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">
                Create New AI Style Adapter
              </h2>
            </div>
            <form method="dialog">
              <button
                type="submit"
                aria-label="Close modal"
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </form>
          </div>

          <form onSubmit={handleCreate} className="mt-5 space-y-4 text-left">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label
                  htmlFor="new-adapter-name"
                  className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  Style / Adapter Name
                </label>
                <input
                  id="new-adapter-name"
                  type="text"
                  required
                  placeholder="e.g. woodblock-ukiyoe"
                  value={adapterName}
                  onChange={(e) => setAdapterName(e.target.value)}
                  className="h-10 w-full rounded-xl border border-input bg-background px-3.5 text-sm text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="new-adapter-date"
                  className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  Schedule Start Date
                </label>
                <input
                  id="new-adapter-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="new-adapter-template"
                className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Prompt Template (supports {"{fragment}"}, {"{setting}"},{" "}
                {"{mood}"})
              </label>
              <textarea
                id="new-adapter-template"
                rows={3}
                required
                value={promptTemplate}
                onChange={(e) => setPromptTemplate(e.target.value)}
                className="w-full rounded-xl border border-input bg-background p-3 font-mono text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="new-adapter-variants"
                className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Subject Variants (comma-separated)
              </label>
              <textarea
                id="new-adapter-variants"
                rows={2}
                required
                value={variantsText}
                onChange={(e) => setVariantsText(e.target.value)}
                className="w-full rounded-xl border border-input bg-background p-3 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            {error && (
              <p className="text-xs text-destructive">
                {error.message || "Could not create style adapter."}
              </p>
            )}

            <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
              <button
                type="button"
                onClick={() => dialogRef.current?.close()}
                className="rounded-xl border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
                Create Style Adapter
              </button>
            </div>
          </form>
        </div>
      </dialog>
    </div>
  );
}
