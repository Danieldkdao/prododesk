"use client";

import { AIChatInput } from "@/components/ai-chat-input";
import {
  Marquee,
  MarqueeContent,
  MarqueeFade,
  MarqueeItem,
} from "@/components/kibo-ui/marquee";
import { Button } from "@/components/ui/button";
import { useChatProvider } from "@/hooks/use-chat-provider";
import { LLMModel } from "@/services/ai/models";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createChatAction } from "../actions/actions";
import { ChatMessageSchemaType } from "../actions/schemas";
import { PendingChatMessagesView } from "./pending-chat-messages-view";

const recommendedPrompts = [
  "What are my tasks for today?",
  "Create a task for tomorrow at 9:00 AM.",
  "Help me prioritize and schedule my tasks for today.",
  "Create a high-priority task from something I need to get done.",
];

export const InitialAIInputClient = () => {
  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState<LLMModel | null>(null);

  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);

  const [isCreating, setIsCreating] = useState(false);
  const [isNavigating, startNavigating] = useTransition();

  const isPending = isCreating || isNavigating;

  const router = useRouter();
  const { sendQueuedMessage } = useChatProvider();

  const handleSubmit = async () => {
    const submittedPrompt = prompt.trim();

    if (isPending) return;
    if (!submittedPrompt.trim() || !selectedModel)
      return toast.error("Please enter a prompt and select a model.");

    setPendingPrompt(submittedPrompt);
    setIsCreating(true);

    try {
      const newChatMessage: ChatMessageSchemaType = {
        content: submittedPrompt,
        selectedModel: selectedModel.id,
      };

      const response = await createChatAction(newChatMessage);
      if (response.error || !response.chat) {
        toast.error(response.message);
        setPendingPrompt(null);
        setIsCreating(false);
        return;
      }

      sendQueuedMessage({
        prompt: submittedPrompt,
        selectedModel: selectedModel.id,
        chatId: response.chat.id,
      });
      const url = `/dashboard/ai/chat/${response.chat.id}`;

      startNavigating(() => {
        setPrompt("");
        setIsCreating(false);
        router.push(url);
      });
    } catch (error) {
      setPendingPrompt(null);
      setIsCreating(false);
      console.error(error);
      toast.error("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center gap-8 h-full min-h-0">
      {isPending && selectedModel ? (
        <PendingChatMessagesView
          prompt={pendingPrompt ?? ""}
          selectedModel={selectedModel.id}
        />
      ) : (
        <div className="w-full flex flex-col items-center justify-center gap-8">
          <h1 className="text-center text-4xl font-semibold">
            What should we work on today?
          </h1>
          <div className="max-w-5xl w-full">
            <Marquee>
              <MarqueeContent>
                {recommendedPrompts.map((prompt) => (
                  <MarqueeItem key={prompt}>
                    <Button variant="outline" onClick={() => setPrompt(prompt)}>
                      {prompt}
                    </Button>
                  </MarqueeItem>
                ))}
              </MarqueeContent>
              <MarqueeFade side="left" />
              <MarqueeFade side="right" />
            </Marquee>
          </div>
        </div>
      )}
      <AIChatInput
        value={prompt}
        onValueChange={setPrompt}
        onSubmit={handleSubmit}
        isPending={isPending}
        selectedModel={selectedModel}
        onSelectedModelChange={setSelectedModel}
      />
    </div>
  );
};
