"use client";

import * as React from "react";
import { Progress as ProgressPrimitive } from "@base-ui/react/progress";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const progressRingVariants = cva(
  "group/progress-ring flex w-fit flex-col items-center gap-1.5 text-center transition-[--progress-ring-fraction] duration-500 ease-out",
  {
    variants: {
      size: {
        xs: "[--progress-ring-size:--spacing(8)] [--progress-ring-thickness:--spacing(1)]",
        sm: "text-xs [--progress-ring-size:--spacing(14)] [--progress-ring-thickness:--spacing(1.5)]",
        default:
          "text-sm [--progress-ring-size:--spacing(20)] [--progress-ring-thickness:--spacing(2)]",
        lg: "text-base [--progress-ring-size:--spacing(28)] [--progress-ring-thickness:--spacing(2.5)]",
      },
      variant: {
        default: "text-primary",
        info: "text-info",
        success: "text-success",
        warning: "text-warning",
        destructive: "text-destructive",
      },
    },
    defaultVariants: {
      size: "default",
      variant: "default",
    },
  },
);

function ProgressRingProperty() {
  return (
    <style href="ondo-ui-progress-ring-fraction" precedence="default">
      {
        "@property --progress-ring-fraction{syntax:'<number>';inherits:true;initial-value:0}"
      }
    </style>
  );
}

function ProgressRing({
  className,
  size = "default",
  variant = "default",
  value,
  min = 0,
  max = 100,
  formatValue,
  children,
  ...props
}: ProgressPrimitive.Root.Props &
  VariantProps<typeof progressRingVariants> & {
    formatValue?: (
      formattedValue: string | null,
      value: number | null,
    ) => React.ReactNode;
  }) {
  const span = max - min || 1;
  const fraction =
    value == null ? 0 : Math.min(1, Math.max(0, (value - min) / span));

  return (
    <ProgressPrimitive.Root
      value={value}
      min={min}
      max={max}
      data-slot="progress-ring"
      data-size={size}
      data-variant={variant}
      className={cn(progressRingVariants({ size, variant, className }))}
      style={{ "--progress-ring-fraction": fraction } as React.CSSProperties}
      {...props}
    >
      <ProgressRingProperty />
      <ProgressRingDial>
        <ProgressRingValue>{formatValue}</ProgressRingValue>
      </ProgressRingDial>
      {children}
    </ProgressPrimitive.Root>
  );
}

function ProgressRingDial({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="progress-ring-dial"
      className={cn(
        "grid size-(--progress-ring-size) shrink-0 place-items-center *:col-start-1 *:row-start-1",
        className,
      )}
      {...props}
    >
      <ProgressRingTrack />
      {children}
    </div>
  );
}

function ProgressRingTrack({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="progress-ring-track"
      aria-hidden="true"
      className={cn(
        "size-full rounded-full bg-muted",
        "[mask:radial-gradient(farthest-side,#0000_calc(100%-var(--progress-ring-thickness)),#000_calc(100%-var(--progress-ring-thickness)+1px))]",
        className,
      )}
      {...props}
    >
      <ProgressRingIndicator />
    </span>
  );
}

function ProgressRingIndicator({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="progress-ring-indicator"
      className={cn(
        "block size-full rounded-full",
        "[background:conic-gradient(currentColor_calc(var(--progress-ring-fraction)*360deg),#0000_0)]",
        "group-data-[indeterminate]/progress-ring:animate-spin group-data-[indeterminate]/progress-ring:[background:conic-gradient(currentColor_90deg,#0000_0)]",
        className,
      )}
      {...props}
    />
  );
}

function ProgressRingValue({
  className,
  ...props
}: ProgressPrimitive.Value.Props) {
  return (
    <ProgressPrimitive.Value
      data-slot="progress-ring-value"
      className={cn("font-medium text-foreground tabular-nums", className)}
      {...props}
    />
  );
}

function ProgressRingLabel({
  className,
  ...props
}: ProgressPrimitive.Label.Props) {
  return (
    <ProgressPrimitive.Label
      data-slot="progress-ring-label"
      className={cn("text-xs text-muted-foreground", className)}
      {...props}
    />
  );
}

export {
  ProgressRing,
  ProgressRingDial,
  ProgressRingTrack,
  ProgressRingIndicator,
  ProgressRingValue,
  ProgressRingLabel,
  progressRingVariants,
};
