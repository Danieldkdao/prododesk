import { AnimatedButton } from "@/components/animate-ui/primitives/buttons/button";
import { TooltipWrapper } from "@/components/tooltip-wrapper";
import { useChatProvider } from "@/hooks/use-chat-provider";
import { RefreshCwIcon } from "lucide-react";

export const RegenerateButton = ({
  id,
  responseToClientId,
  chatId,
  modelId,
}: {
  id?: string;
  responseToClientId?: string;
  chatId?: string;
  modelId?: string;
}) => {
  const { regenerate } = useChatProvider();

  return (
    <TooltipWrapper content="Regenerate response">
      <AnimatedButton
        variant="ghost"
        size="sm"
        onClick={() =>
          regenerate({
            messageId: responseToClientId,
            body: {
              chatId: chatId,
              selectedModel: modelId,
              assistantMessageId: id,
            },
          })
        }
      >
        <RefreshCwIcon />
      </AnimatedButton>
    </TooltipWrapper>
  );
};
