"use client";

import { useFileUploads } from "@/hooks/use-file-uploads";
import { cn } from "@/lib/utils";
import {
  fastCostEfficientModels,
  LLMModel,
  mostPowerfulModels,
} from "@/services/ai/models";
import { PlusIcon, SendIcon, SquareIcon } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { FileDisplay } from "./file-display";
import { TooltipWrapper } from "./tooltip-wrapper";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Textarea } from "./ui/textarea";

const layoutTransition = {
  type: "spring",
  stiffness: 280,
  damping: 32,
  mass: 0.7,
} as const;

export const AIChatInput = ({
  value,
  onValueChange,
  selectedModel,
  onSelectedModelChange,
  onSubmit,
  onStop,
  isPending = false,
  className,
}: {
  value: string;
  onValueChange: (value: string) => void;
  selectedModel: LLMModel | null;
  onSelectedModelChange: (modelId: LLMModel | null) => void;
  onSubmit: () => void;
  onStop: () => void;
  isPending?: boolean;
  className?: string;
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [inputLinesChanged, setInputLinesChanged] = useState(false);
  const initialInputHeightRef = useRef<number | null>(null);

  const { inputRef, handleInputChange, previewUrls, error, handleRemoveFile } =
    useFileUploads({
      keyPrefix: "ai-chat",
      accept: "image/jpeg, image/png, application/pdf, .jpg, .jpeg",
      maxFileLimit: 10,
    });

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    if (initialInputHeightRef.current === null) {
      initialInputHeightRef.current = textarea.scrollHeight;
    }

    if (!value.trim()) {
      setInputLinesChanged(false);
      return;
    }

    setInputLinesChanged(
      textarea.scrollHeight > initialInputHeightRef.current + 1,
    );
  }, [value]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const submittedPrompt = value.trim();
  const canSubmit =
    !isPending && submittedPrompt.length > 0 && selectedModel !== null;

  return (
    <div className="@container p-2 border w-full flex flex-col gap-2 max-w-6xl">
      {previewUrls.size ? (
        <div className="flex w-full flex-col gap-2">
          <div className="grid w-full grid-cols-[repeat(auto-fill,minmax(8rem,1fr))] gap-2">
            {Array.from(previewUrls).map(([key, value], index) => (
              <FileDisplay
                key={`ai-chat-img-${key}-${index}`}
                fileKey={key}
                {...value}
                handleRemoveFile={handleRemoveFile}
              />
            ))}
          </div>
        </div>
      ) : null}
      <motion.div
        layout="position"
        className={cn(
          "flex min-w-0 w-full flex-wrap items-center gap-1",
          className,
        )}
        transition={{ layout: layoutTransition }}
      >
        <motion.div
          layout="position"
          transition={{ layout: layoutTransition }}
          className={inputLinesChanged ? "w-full order-1" : "flex-1 order-2"}
        >
          <Textarea
            className={cn(
              "min-h-0 border-none focus-visible:ring-0 focus-visible:outline-none focus-visible:border-none text-lg md:text-lg p-0 transition-all duration-200 max-h-52!",
              inputLinesChanged && "p-2",
            )}
            ref={textareaRef}
            rows={1}
            value={value}
            disabled={isPending}
            onChange={(e) => {
              onValueChange(e.currentTarget.value);
            }}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;

              if (e.nativeEvent.isComposing) return;

              if (e.shiftKey) return;

              e.preventDefault();

              if (!canSubmit || e.repeat) return;

              onSubmit();
            }}
            placeholder="Tell me what you need..."
          />
        </motion.div>

        <motion.div
          layout="position"
          transition={{ layout: layoutTransition }}
          className={cn("shrink-0", inputLinesChanged ? "order-2" : "order-1")}
        >
          <TooltipWrapper content="Add assets">
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={isPending}
              onClick={() => {
                if (!inputRef.current) return;

                inputRef.current.value = "";
                inputRef.current.click();
              }}
            >
              <PlusIcon className="size-6!" />
            </Button>
          </TooltipWrapper>
          <Input
            ref={inputRef}
            className="hidden"
            type="file"
            accept=".jpg, .png, image/jpeg, application/pdf"
            multiple
            onChange={handleInputChange}
          />
        </motion.div>
        <motion.div
          layout="position"
          transition={{ layout: layoutTransition }}
          className="order-3 ml-auto flex items-center gap-2 shrink-0"
        >
          <Select
            value={selectedModel}
            onValueChange={(value) => onSelectedModelChange(value as LLMModel)}
          >
            <SelectTrigger className="border-none" disabled={isPending}>
              <SelectValue>
                {selectedModel ? (
                  <div className="flex items-center gap-2">
                    <selectedModel.logo
                      color={selectedModel.logoColor}
                      className="size-5"
                    />
                    <span>{selectedModel.name}</span>
                  </div>
                ) : (
                  <span>Select a model</span>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent dynamicWidth className="border">
              <SelectGroup>
                <SelectLabel>Most Powerful</SelectLabel>
                {mostPowerfulModels.map((model) => (
                  <SelectItem
                    key={model.id}
                    value={model}
                    className="max-w-84 w-full items-start whitespace-normal"
                  >
                    <div className="flex items-center gap-2">
                      <model.logo color={model.logoColor} className="size-5" />
                      <span className="whitespace-normal font-medium text-base">
                        {model.name}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>Fast & Cost Efficient</SelectLabel>
                {fastCostEfficientModels.map((model) => (
                  <SelectItem
                    key={model.id}
                    value={model}
                    className="max-w-84 w-full items-start whitespace-normal"
                  >
                    <div className="flex items-center gap-2">
                      <model.logo color={model.logoColor} className="size-5" />
                      <span className="whitespace-normal font-medium text-base">
                        {model.name}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Button
            type="button"
            size="icon-sm"
            disabled={!isPending && (!submittedPrompt || !selectedModel)}
            onClick={isPending ? onStop : onSubmit}
          >
            {isPending ? <SquareIcon /> : <SendIcon />}
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};
