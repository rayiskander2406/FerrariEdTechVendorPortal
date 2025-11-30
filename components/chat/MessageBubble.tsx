"use client";

import React, { memo, useMemo } from "react";
import { Bot, User, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMessage, ToolCallInfo } from "@/lib/hooks/useChat";

// =============================================================================
// TYPES
// =============================================================================

interface MessageBubbleProps {
  message: ChatMessage;
}

// =============================================================================
// MARKDOWN PARSER (Basic)
// =============================================================================

function parseMarkdown(text: string): string {
  let html = text;

  // Strip out control markers (SUGGESTIONS and FORM triggers) before rendering
  html = html.replace(/\[SUGGESTIONS:[^\]]*\]/g, "");
  html = html.replace(/\[FORM:[A-Z_]+\]/g, "");

  // Escape HTML
  html = html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Code blocks (triple backticks)
  html = html.replace(
    /```(\w*)\n([\s\S]*?)```/g,
    '<pre class="bg-gray-100 rounded-md p-3 my-2 overflow-x-auto text-sm"><code>$2</code></pre>'
  );

  // Inline code
  html = html.replace(
    /`([^`]+)`/g,
    '<code class="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>'
  );

  // Bold
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

  // Italic
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");

  // Headers
  html = html.replace(
    /^### (.+)$/gm,
    '<h3 class="font-semibold text-lg mt-3 mb-1">$1</h3>'
  );
  html = html.replace(
    /^## (.+)$/gm,
    '<h2 class="font-semibold text-xl mt-4 mb-2">$1</h2>'
  );

  // Unordered lists
  html = html.replace(
    /^- (.+)$/gm,
    '<li class="ml-4 list-disc">$1</li>'
  );

  // Ordered lists
  html = html.replace(
    /^\d+\. (.+)$/gm,
    '<li class="ml-4 list-decimal">$1</li>'
  );

  // Wrap consecutive list items
  html = html.replace(
    /(<li class="ml-4 list-disc">.*<\/li>\n?)+/g,
    '<ul class="my-2">$&</ul>'
  );
  html = html.replace(
    /(<li class="ml-4 list-decimal">.*<\/li>\n?)+/g,
    '<ol class="my-2">$&</ol>'
  );

  // Links (simple pattern)
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" class="text-primary underline hover:text-primary-700" target="_blank" rel="noopener noreferrer">$1</a>'
  );

  // Line breaks
  html = html.replace(/\n/g, "<br />");

  // Tables (basic markdown tables)
  // Match table pattern and convert
  html = html.replace(
    /\|(.+)\|<br \/>\|[-|: ]+\|<br \/>((?:\|.+\|<br \/>)+)/g,
    (match, header, body) => {
      const headerCells = (header as string)
        .split("|")
        .filter(Boolean)
        .map((cell: string) => `<th class="px-3 py-1.5 text-left font-semibold border-b">${cell.trim()}</th>`)
        .join("");
      const bodyRows = (body as string)
        .split("<br />")
        .filter((row: string) => row.trim())
        .map((row: string) => {
          const cells = row
            .split("|")
            .filter(Boolean)
            .map((cell: string) => `<td class="px-3 py-1.5 border-b border-gray-100">${cell.trim()}</td>`)
            .join("");
          return `<tr>${cells}</tr>`;
        })
        .join("");
      return `<table class="my-2 w-full text-sm border-collapse"><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table>`;
    }
  );

  return html;
}

// =============================================================================
// TOOL CALL STATUS
// =============================================================================

function ToolCallStatus({ toolCalls }: { toolCalls: ToolCallInfo[] }) {
  if (!toolCalls || toolCalls.length === 0) return null;

  return (
    <div className="mt-2 space-y-1">
      {toolCalls.map((tool) => (
        <div
          key={tool.id}
          className={cn(
            "flex items-center gap-2 text-xs px-2 py-1 rounded",
            tool.status === "completed" && "bg-success-50 text-success-700",
            tool.status === "executing" && "bg-warning-50 text-warning-700",
            tool.status === "pending" && "bg-gray-100 text-gray-600",
            tool.status === "error" && "bg-error-50 text-error-700"
          )}
        >
          {tool.status === "executing" && (
            <Loader2 className="h-3 w-3 animate-spin" />
          )}
          {tool.status === "completed" && (
            <span className="text-success-600">✓</span>
          )}
          {tool.status === "error" && (
            <AlertCircle className="h-3 w-3" />
          )}
          <span className="font-mono">{formatToolName(tool.name)}</span>
          {tool.result?.message && (
            <span className="text-gray-500 truncate max-w-[200px]">
              — {tool.result.message}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function formatToolName(name: string): string {
  return name
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export const MessageBubble = memo(function MessageBubble({
  message,
}: MessageBubbleProps) {
  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";

  // Parse markdown for assistant messages
  const renderedContent = useMemo(() => {
    if (isUser) {
      return message.content;
    }
    return parseMarkdown(message.content);
  }, [message.content, isUser]);

  // Format timestamp
  const formattedTime = useMemo(() => {
    return message.timestamp.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [message.timestamp]);

  return (
    <div
      className={cn(
        "flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
          isUser ? "bg-primary text-white" : "bg-secondary-100 text-secondary-600"
        )}
      >
        {isUser ? (
          <User className="w-4 h-4" />
        ) : (
          <Bot className="w-4 h-4" />
        )}
      </div>

      {/* Message Content */}
      <div
        className={cn(
          "flex flex-col max-w-[80%]",
          isUser ? "items-end" : "items-start"
        )}
      >
        {/* Header for assistant */}
        {isAssistant && (
          <div className="flex items-center gap-1.5 mb-1 text-xs text-gray-500">
            <span>Integration Assistant</span>
            {message.isStreaming && (
              <span className="inline-flex">
                <span className="animate-pulse">●</span>
              </span>
            )}
          </div>
        )}

        {/* Bubble */}
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5",
            isUser
              ? "bg-primary text-white rounded-br-md"
              : "bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-md",
            message.error && "border-error-200 bg-error-50"
          )}
        >
          {/* Content */}
          {isUser ? (
            <p className="text-sm whitespace-pre-wrap">{renderedContent}</p>
          ) : (
            <div
              className="text-sm prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: renderedContent }}
            />
          )}

          {/* Tool calls */}
          {isAssistant && message.toolCalls && message.toolCalls.length > 0 && (
            <ToolCallStatus toolCalls={message.toolCalls} />
          )}

          {/* Error indicator */}
          {message.error && (
            <div className="flex items-center gap-1.5 mt-2 text-xs text-error-600">
              <AlertCircle className="w-3 h-3" />
              <span>{message.error}</span>
            </div>
          )}
        </div>

        {/* Timestamp */}
        <span className="text-[10px] text-gray-400 mt-1 px-1">
          {formattedTime}
        </span>
      </div>
    </div>
  );
});

export default MessageBubble;
