"use client";

import { AIChatInput } from "@/components/ai-chat-input";
import {
  Marquee,
  MarqueeContent,
  MarqueeFade,
  MarqueeItem,
} from "@/components/kibo-ui/marquee";
import { Button } from "@/components/ui/button";
import { useAbortableAction } from "@/hooks/use-abortable-action";
import { useChatProvider } from "@/hooks/use-chat-provider";
import { useFileUploads } from "@/hooks/use-file-uploads";
import { generateFileUrl } from "@/lib/utils";
import { LLMModel } from "@/services/ai/models";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createChatAction } from "../actions/actions";
import { ChatMessageSchemaType } from "../actions/schemas";
import { ChatHeader } from "../chat-header";
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

  const attachmentOptions = useFileUploads({
    keyPrefix: "ai-chat",
    accept: "image/jpeg, image/png, application/pdf, .jpg, .jpeg",
    maxFileLimit: 10,
  });

  const [isCreating, setIsCreating] = useState(false);
  const [isNavigating, startNavigating] = useTransition();

  const isPending = isCreating || isNavigating;

  const router = useRouter();
  const { sendQueuedMessage } = useChatProvider();

  const abortableCreateChatAction = useAbortableAction(createChatAction);

  const uploadedFiles = Array.from(attachmentOptions.files, ([id, file]) => ({
    id,
    name: file.name,
    type: file.type ?? "application/octet-stream",
    storageKey: file.key,
    url: generateFileUrl(file.key),
  }));

  const handleSubmit = async () => {
    const submittedPrompt = prompt.trim();

    if (
      isPending ||
      attachmentOptions.isUploading ||
      attachmentOptions.isDeleting
    )
      return;
    if (!submittedPrompt.trim() || !selectedModel)
      return toast.error("Please enter a prompt and select a model.");

    setPendingPrompt(submittedPrompt);
    setIsCreating(true);

    try {
      const newChatMessage: ChatMessageSchemaType = {
        content: submittedPrompt,
        selectedModel: selectedModel.id,
      };

      const response = await abortableCreateChatAction.run(newChatMessage);
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
        additionalParts: uploadedFiles.map((file) => ({
          type: "file",
          mediaType: file.type,
          url: file.url,
          filename: file.name,
          providerMetadata: {
            prododesk: {
              storageKey: file.storageKey,
            },
          },
        })),
      });
      const url = `/dashboard/ai/chat/${response.chat.id}`;

      startNavigating(() => {
        setPrompt("");
        attachmentOptions.clearFiles();
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
    <div className="@container w-full flex flex-col items-center justify-center gap-8 h-full min-h-0 min-w-0">
      {isPending && selectedModel ? (
        <>
          <ChatHeader />
          <PendingChatMessagesView
            prompt={pendingPrompt ?? ""}
            attachments={uploadedFiles.map((file) => ({
              type: "file",
              filename: file.name,
              mediaType: file.type,
              url: generateFileUrl(file.storageKey),
              providerMetadata: {
                prododesk: {
                  storageKey: file.storageKey,
                },
              },
            }))}
          />
        </>
      ) : (
        <div className="w-full flex flex-col items-center justify-center gap-8">
          <h1 className="text-center text-2xl @xl:text-4xl font-semibold">
            What should we work on today?
          </h1>
          <div className="max-w-6xl w-full min-w-0 overflow-hidden">
            <Marquee className="w-full min-w-0 overflow-hidden">
              <MarqueeContent>
                {recommendedPrompts.map((prompt) => (
                  <MarqueeItem key={prompt} className="shrink-0">
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
        onStop={() => {
          abortableCreateChatAction.abort();
          setIsCreating(false);
        }}
        className={isPending && selectedModel ? "max-w-400" : "max-w-6xl"}
        attachmentOptions={attachmentOptions}
      />
    </div>
  );
};
