"use client"

import * as React from "react"
import { DayPicker } from "react-day-picker"
import { ChevronLeftIcon, ChevronRightIcon } from "@radix-ui/react-icons"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3 sm:p-4", className)}
      classNames={{
        root: "w-fit",
        months: "relative flex flex-col gap-6 sm:flex-row",
        month: "flex flex-col gap-3",
        month_caption:
          "flex h-9 items-center justify-center px-10",
        caption_label: "text-sm font-semibold tracking-tight text-foreground",
        nav: "pointer-events-none absolute inset-x-0 top-0 z-10 flex h-9 items-center justify-between",
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "pointer-events-auto h-8 w-8 rounded-lg border-border bg-background p-0 text-foreground opacity-85 shadow-sm transition hover:bg-muted hover:opacity-100 disabled:opacity-30"
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "pointer-events-auto h-8 w-8 rounded-lg border-border bg-background p-0 text-foreground opacity-85 shadow-sm transition hover:bg-muted hover:opacity-100 disabled:opacity-30"
        ),
        month_grid: "w-full border-collapse",
        weekdays: "flex mb-1",
        weekday:
          "w-9 text-center text-[0.75rem] font-medium text-muted-foreground",
        week: "flex w-full mt-1",
        day: cn(
          "relative h-9 w-9 p-0 text-center text-sm focus-within:relative focus-within:z-20",
          props.mode === "range"
            ? "[&:has(>.day-range-end)]:rounded-r-lg [&:has(>.day-range-start)]:rounded-l-lg first:[&:has([aria-selected])]:rounded-l-lg last:[&:has([aria-selected])]:rounded-r-lg"
            : "[&:has([aria-selected])]:rounded-lg"
        ),
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 rounded-lg p-0 font-normal transition hover:bg-muted aria-selected:opacity-100"
        ),
        range_start:
          "day-range-start rounded-l-lg bg-primary text-primary-foreground [&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary [&>button]:hover:text-primary-foreground",
        range_end:
          "day-range-end rounded-r-lg bg-primary text-primary-foreground [&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary [&>button]:hover:text-primary-foreground",
        selected:
          "rounded-lg bg-primary text-primary-foreground [&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary [&>button]:hover:text-primary-foreground",
        today:
          "rounded-lg bg-accent/70 font-semibold text-accent-foreground",
        outside:
          "day-outside text-muted-foreground/50 aria-selected:bg-accent/40 aria-selected:text-muted-foreground",
        disabled:
          "text-muted-foreground/40 opacity-50 line-through [&>button]:cursor-not-allowed [&>button]:hover:bg-transparent",
        range_middle:
          "rounded-none bg-primary/15 text-foreground [&>button]:rounded-none [&>button]:bg-transparent [&>button]:text-foreground [&>button]:hover:bg-primary/20",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === "left" ? (
            <ChevronLeftIcon className="h-4 w-4" />
          ) : (
            <ChevronRightIcon className="h-4 w-4" />
          ),
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
