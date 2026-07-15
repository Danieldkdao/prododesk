import { AIChatInput } from "@/components/ai-chat-input";
import {
  Marquee,
  MarqueeContent,
  MarqueeFade,
  MarqueeItem,
} from "@/components/kibo-ui/marquee";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { SendIcon } from "lucide-react";

const recommendedPrompts = [
  "What are my tasks for today?",
  "Create a task for tomorrow at 9:00 AM.",
  "Help me prioritize and schedule my tasks for today.",
  "Create a high-priority task from something I need to get done.",
];

const DashboardAIPage = () => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-8 max-w-5xl mx-auto">
      <h1 className="text-center text-4xl font-semibold">
        What should we work on today?
      </h1>
      <div className="max-w-5xl">
        <Marquee>
          <MarqueeContent>
            {recommendedPrompts.map((prompt) => (
              <MarqueeItem key={prompt}>
                <Button variant="outline">{prompt}</Button>
              </MarqueeItem>
            ))}
          </MarqueeContent>
          <MarqueeFade side="left" />
          <MarqueeFade side="right" />
        </Marquee>
      </div>
      {/*<InputGroup className="border border-border p-5">
        <InputGroupTextarea
          id="block-end-textarea"
          placeholder="Ask anything..."
          className="p-0 text-lg  md:text-lg"
        />
        <InputGroupAddon align="block-end" className="pt-2 pb-0">
          <InputGroupButton
            variant="default"
            size="icon-sm"
            className="ml-auto"
          >
            <SendIcon />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>*/}
      <AIChatInput />
    </div>
  );
};

export default DashboardAIPage;
