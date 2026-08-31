"use client";

import { DailyPlanEnergyLevel, dailyPlanEnergyLevels } from "@/db/shared";
import { formatEnergyLevel } from "../lib/formatters";
import { cn } from "@/lib/utils";

export const EnergyLevelInput = ({
  value,
  onValueChange,
}: {
  value: DailyPlanEnergyLevel;
  onValueChange: (value: DailyPlanEnergyLevel) => void;
}) => {
  return (
    <div className="w-full min-w-0 @container">
      <div className="grid grid-cols-1 @xl:grid-cols-2 @2xl:grid-cols-3 gap-4">
        {dailyPlanEnergyLevels.map((energyLevel) => {
          const isSelected = value === energyLevel;
          const {
            icon: Icon,
            label,
            description,
            textColor,
            bgColor,
            bgHoverColor,
          } = formatEnergyLevel(energyLevel);

          return (
            <button
              key={energyLevel}
              type="button"
              onClick={() => onValueChange(energyLevel)}
              className={cn(
                "px-4 py-2 bg-accent/60 text-base font-medium cursor-pointer transition-colors duration-200 hover:bg-accent/90 flex flex-col items-center gap-0.5",
                isSelected && textColor,
                isSelected && bgColor,
                isSelected && bgHoverColor,
              )}
            >
              <Icon />
              <span className="text-base font-medium text-center">{label}</span>
              <p
                className={cn(
                  "text-muted-foreground text-sm text-center",
                  isSelected && textColor,
                )}
              >
                {description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
