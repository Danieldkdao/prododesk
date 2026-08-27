"use client";

import { UseFileUploadsReturnType } from "@/hooks/use-file-uploads";
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
  attachmentOptions,
}: {
  value: string;
  onValueChange: (value: string) => void;
  selectedModel: LLMModel | null;
  onSelectedModelChange: (modelId: LLMModel | null) => void;
  onSubmit: () => void;
  onStop: () => void;
  isPending?: boolean;
  className?: string;
} & {
  attachmentOptions?: Pick<
    UseFileUploadsReturnType,
    | "inputRef"
    | "handleInputChange"
    | "previewUrls"
    | "error"
    | "uploadProgresses"
    | "handleRemoveFile"
  >;
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [inputLinesChanged, setInputLinesChanged] = useState(false);
  const initialInputHeightRef = useRef<number | null>(null);

  const inputRef = attachmentOptions?.inputRef;
  const handleInputChange = attachmentOptions?.handleInputChange ?? (() => {});
  const previewUrls = attachmentOptions?.previewUrls;
  const error = attachmentOptions?.error ?? null;
  const handleRemoveFile = attachmentOptions?.handleRemoveFile ?? (() => {});
  const uploadProgresses = attachmentOptions?.uploadProgresses;

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
  const onlyImages =
    previewUrls?.size &&
    Array.from(previewUrls).every(([, { type }]) => type.startsWith("image/"));

  return (
    <div
      className={cn(
        "@container flex w-full shrink-0 flex-col gap-2 border p-2",
        className,
      )}
    >
      {!isPending && previewUrls?.size ? (
        <div className="flex w-full items-stretch gap-2 overflow-x-auto p-1">
          {Array.from(previewUrls).map(([id, { name, url, type }]) => {
            const isImage = type.startsWith("image/");

            return (
              <div
                key={id}
                className={cn(
                  "shrink-0",
                  isImage
                    ? onlyImages
                      ? "size-40"
                      : "min-h-20 self-stretch aspect-square"
                    : "min-h-20 w-64 self-stretch",
                )}
              >
                <FileDisplay
                  name={name}
                  url={url}
                  type={type}
                  handleRemoveFile={() => handleRemoveFile(id)}
                  uploadProgress={uploadProgresses?.get(id)}
                />
              </div>
            );
          })}
        </div>
      ) : null}
      <motion.div
        layout="position"
        className="flex min-w-0 w-full flex-wrap items-center gap-1"
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
              if (e.key !== "Enter" || e.nativeEvent.isComposing || e.shiftKey)
                return;

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
                if (!inputRef?.current) return;

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
                    disabled
                  >
                    <div className="flex items-center gap-2">
                      <model.logo
                        color={model.logoColor}
                        className={cn(
                          "size-5",
                          !model.survivesDarkMode && "dark:text-white",
                        )}
                      />
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
