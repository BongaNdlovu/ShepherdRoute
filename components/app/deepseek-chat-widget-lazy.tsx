"use client";

import dynamic from "next/dynamic";

export const DeepSeekChatWidgetLazy = dynamic(
  () => import("@/components/app/deepseek-chat-widget").then((mod) => mod.DeepSeekChatWidget),
  { ssr: false }
);
