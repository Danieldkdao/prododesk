"use client";

import { cn } from "@/lib/utils";
import { LLMModel, models } from "@/services/ai/models";
import { PlusIcon, SendIcon } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { TooltipWrapper } from "./tooltip-wrapper";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Textarea } from "./ui/textarea";
import { SimpleIcon } from "./simple-icon";

const layoutTransition = {
  type: "spring",
  stiffness: 280,
  damping: 32,
  mass: 0.7,
} as const;

export const AIChatInput = () => {
  const inputContainerRef = useRef<HTMLDivElement>(null);
  const [inputLinesChanged, setInputLinesChanged] = useState(false);
  const [initialInputHeight, setInitialInputHeight] = useState<number | null>(
    null,
  );
  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState<LLMModel | null>(null);

  useEffect(() => {
    const inputContainer = inputContainerRef.current;
    if (!inputContainer || !initialInputHeight) return;

    const handleInputEvent = () => {
      const scrollHeight = inputContainer.scrollHeight;

      if (scrollHeight !== initialInputHeight) {
        setInputLinesChanged(true);
      } else {
        setInputLinesChanged(false);
      }
    };

    inputContainer.addEventListener("input", handleInputEvent);

    return () => inputContainer.removeEventListener("input", handleInputEvent);
  }, [initialInputHeight]);

  useLayoutEffect(() => {
    const inputContainer = inputContainerRef.current;
    if (!inputContainer) return;

    const scrollHeight = inputContainer.scrollHeight;

    setInitialInputHeight(scrollHeight);
  }, []);

  return (
    <motion.div
      layout="position"
      className="flex items-center flex-wrap w-full border p-2 gap-1"
      ref={inputContainerRef}
      transition={{ layout: layoutTransition }}
    >
      <motion.div
        layout="position"
        transition={{ layout: layoutTransition }}
        className={inputLinesChanged ? "w-full order-1" : "flex-1 order-2"}
      >
        <Textarea
          className={cn(
            "min-h-0 border-none focus-visible:ring-0 focus-visible:outline-none focus-visible:border-none text-lg md:text-lg p-0 transition-all duration-200",
            inputLinesChanged && "p-2",
          )}
          rows={1}
          value={prompt}
          onChange={(e) => {
            const newValue = e.target.value;

            if (e.target.value === "") {
              setInputLinesChanged(false);
              setPrompt("");
            }

            if (e.target.value.trim() === "") return;

            setPrompt(newValue);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.shiftKey && prompt === "") {
              e.preventDefault();
              return;
            }
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              console.log("form submitted");
              return;
            }
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
          <Button variant="ghost" size="icon-sm">
            <PlusIcon className="size-6!" />
          </Button>
        </TooltipWrapper>
      </motion.div>
      <motion.div
        layout="position"
        transition={{ layout: layoutTransition }}
        className="order-3 ml-auto flex items-center gap-2 shrink-0"
      >
        <Select
          value={selectedModel}
          onValueChange={(value) => setSelectedModel(value as LLMModel)}
        >
          <SelectTrigger className="border-none">
            <SelectValue>
              {selectedModel ? (
                <div className="flex items-center gap-2">
                  <SimpleIcon {...selectedModel.logo} />
                  <span>{selectedModel.name}</span>
                </div>
              ) : (
                <span>Select a model</span>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent dynamicWidth className="border">
            {models.map((model) => (
              <SelectItem
                key={model.model}
                value={model}
                className="max-w-84 w-full items-start whitespace-normal"
              >
                <SimpleIcon {...model.logo} className="mt-0.5" />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="whitespace-normal font-medium text-base">
                    {model.name}
                  </span>

                  <p className="whitespace-normal wrap-break-word text-sm leading-4 text-muted-foreground">
                    {model.description}
                  </p>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="icon-sm" disabled={!prompt.trim().length}>
          <SendIcon />
        </Button>
      </motion.div>
    </motion.div>
  );
};
