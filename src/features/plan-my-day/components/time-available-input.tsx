"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ClockIcon } from "lucide-react";
import { useState } from "react";

export const TimeAvailableInput = ({
  value,
  onValueChange,
}: {
  value: number;
  onValueChange: (value: number | null) => void;
}) => {
  const [customSelected, setCustomSelected] = useState(false);
  const presets = [
    {
      label: "30 min",
      value: 30,
    },
    {
      label: "1 hour",
      value: 60,
    },
    {
      label: "2 hours",
      value: 120,
    },
    {
      label: "4 hours",
      value: 240,
    },
    {
      label: "6 hours",
      value: 360,
    },
    {
      label: "8 hours",
      value: 480,
    },
  ];

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {presets.map((preset) => (
        <button
          key={preset.label}
          onClick={() => {
            onValueChange(preset.value);
            setCustomSelected(false);
          }}
          className={cn(
            "px-4 py-2 bg-accent/60 text-base font-medium flex items-center gap-2 cursor-pointer transition-colors duration-200 hover:bg-accent/90",
            value === preset.value &&
              "bg-primary/20 text-primary hover:bg-primary/30",
          )}
          type="button"
        >
          <ClockIcon className="size-4.5" />
          {preset.label}
        </button>
      ))}
      <div className="flex items-center gap-2 bg-accent/60">
        <button
          onClick={() => {
            setCustomSelected(true);
            onValueChange(null);
          }}
          className={cn(
            "px-4 py-2 bg-accent/60 text-base font-medium flex items-center gap-2 cursor-pointer transition-colors duration-200 hover:bg-accent/90",
            customSelected && "bg-primary/20 text-primary hover:bg-primary/30",
          )}
          type="button"
        >
          <ClockIcon className="size-4.5" />
          Custom
        </button>
        {customSelected && (
          <>
            <Input
              type="number"
              value={value ?? ""}
              onChange={(e) =>
                onValueChange(
                  Number.isInteger(e.target.valueAsNumber)
                    ? Number(e.target.valueAsNumber)
                    : null,
                )
              }
              className="text-base md:text-base font-medium w-14"
            />
            <span className="text-base font-medium text-muted-foreground pr-2">
              min = {value ? (value / 60).toFixed(2) : "0.00"} hours
            </span>
          </>
        )}
      </div>
    </div>
  );
};
