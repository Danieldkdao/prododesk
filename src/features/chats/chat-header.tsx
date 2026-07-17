"use client";

import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { TextEffect } from "@/components/ui/text-effect";
import { TextShimmer } from "@/components/ui/text-shimmer";
import { ChatTableInsertType } from "@/db/schema";
import { EllipsisVerticalIcon, PanelLeftIcon } from "lucide-react";
import { motion } from "motion/react";

export const ChatHeader = ({
  chat,
  shimmerText = false,
}: {
  chat?: ChatTableInsertType;
  shimmerText?: boolean;
}) => {
  const headingClasses = "text-2xl font-semibold flex-1 min-w-0 truncate";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 100 }}
      className="bg-sidebar border border-border p-4 rounded-none w-full shrink-0 flex items-center gap-2 min-w-0"
    >
      {!chat ? (
        <TextShimmer as="h2" duration={2} className={headingClasses}>
          Generating...
        </TextShimmer>
      ) : shimmerText ? (
        <TextEffect per="char" preset="fade" as="h2" className={headingClasses}>
          {chat.name}
        </TextEffect>
      ) : (
        <h2 className={headingClasses}>{chat.name}</h2>
      )}
      <div className="flex items-center gap-2">
        <SidebarTrigger
          render={
            <Button disabled={!chat} variant="ghost" size="icon-sm">
              <PanelLeftIcon />
            </Button>
          }
        />
        <Button disabled={!chat} variant="ghost" size="icon-sm">
          <EllipsisVerticalIcon />
        </Button>
      </div>
    </motion.div>
  );
};
