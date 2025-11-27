/**
 * Chat API Route - Streaming Claude API with Tool Calls
 *
 * POST: Process chat messages with Claude, handling tool calls inline
 * GET: Health check endpoint
 */

import Anthropic from "@anthropic-ai/sdk";
import { type NextRequest } from "next/server";
import { getSystemPrompt } from "@/lib/ai/system-prompt";
import { TOOL_DEFINITIONS } from "@/lib/ai/tools";
import { executeToolCall, type ToolResult } from "@/lib/ai/handlers";
import { type VendorContext } from "@/lib/types";
import {
  AppError,
  ValidationError,
  AIServiceError,
  ErrorCodes,
  logError,
  type ErrorCode,
} from "@/lib/errors";

// Use edge runtime for streaming
export const runtime = "edge";

// =============================================================================
// TYPES
// =============================================================================

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  vendorContext?: VendorContext;
}

interface ErrorResponse {
  error: string;
  code?: string;
  details?: Record<string, unknown>;
}

// =============================================================================
// HELPER: Create Error Response
// =============================================================================

function createErrorResponse(error: unknown): Response {
  // Log the error
  logError(error, { action: "chat_api" });

  // Handle AppError types
  if (error instanceof AppError) {
    const response: ErrorResponse = {
      error: error.toUserMessage(),
      code: error.code,
    };
    if (error.details) {
      response.details = error.details;
    }
    return Response.json(response, { status: error.statusCode });
  }

  // Handle Anthropic API errors
  if (error instanceof Anthropic.APIError) {
    const statusCode = error.status || 500;
    let userMessage = "AI service error. Please try again.";
    let code: ErrorCode = ErrorCodes.AI_SERVICE_ERROR;

    if (statusCode === 401) {
      userMessage = "AI service authentication failed. Please contact support.";
      code = ErrorCodes.UNAUTHORIZED;
    } else if (statusCode === 429) {
      userMessage = "AI service is busy. Please wait a moment and try again.";
      code = ErrorCodes.RATE_LIMITED;
    } else if (statusCode === 500 || statusCode === 502 || statusCode === 503) {
      userMessage = "AI service is temporarily unavailable. Please try again later.";
    }

    console.error("[Anthropic API Error]", {
      status: statusCode,
      message: error.message,
      headers: error.headers,
    });

    return Response.json(
      { error: userMessage, code },
      { status: statusCode >= 500 ? 502 : statusCode }
    );
  }

  // Handle generic errors
  if (error instanceof Error) {
    console.error("[Chat API Error]", {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });

    // Don't expose internal error messages
    return Response.json(
      {
        error: "An unexpected error occurred. Please try again.",
        code: ErrorCodes.INTERNAL_ERROR,
      },
      { status: 500 }
    );
  }

  // Unknown error type
  console.error("[Unknown Error]", error);
  return Response.json(
    {
      error: "An unexpected error occurred. Please try again.",
      code: ErrorCodes.INTERNAL_ERROR,
    },
    { status: 500 }
  );
}

// =============================================================================
// GET - Health Check
// =============================================================================

export async function GET() {
  const hasApiKey = !!process.env.ANTHROPIC_API_KEY;

  return Response.json({
    status: hasApiKey ? "ok" : "degraded",
    service: "schoolday-vendor-chat",
    timestamp: new Date().toISOString(),
    apiKeyConfigured: hasApiKey,
  });
}

// =============================================================================
// POST - Chat with Claude
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    let body: ChatRequest;
    try {
      body = (await request.json()) as ChatRequest;
    } catch {
      throw new ValidationError("Invalid JSON in request body");
    }

    const { messages, vendorContext } = body;

    // Validate messages
    if (!messages) {
      throw new ValidationError("Messages field is required", "messages");
    }

    if (!Array.isArray(messages)) {
      throw new ValidationError("Messages must be an array", "messages");
    }

    if (messages.length === 0) {
      throw new ValidationError("Messages array must not be empty", "messages");
    }

    // Validate each message
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      if (!msg || !msg.role || !["user", "assistant"].includes(msg.role)) {
        throw new ValidationError(
          `Invalid role: must be 'user' or 'assistant'`,
          `messages[${i}].role`
        );
      }
      if (typeof msg.content !== "string") {
        throw new ValidationError(
          "Content must be a string",
          `messages[${i}].content`
        );
      }
    }

    // Check for API key
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new AIServiceError(
        "AI service not configured",
        { statusCode: 503 }
      );
    }

    // Initialize Anthropic client
    const anthropic = new Anthropic({
      apiKey,
    });

    // Convert messages to Anthropic format
    const anthropicMessages: Anthropic.MessageParam[] = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    // Get system prompt with vendor context
    const systemPrompt = getSystemPrompt(vendorContext);

    // Create readable stream for response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Process messages with potential tool calls
          await processWithToolCalls(
            anthropic,
            systemPrompt,
            anthropicMessages,
            controller,
            encoder
          );
        } catch (error) {
          // Handle streaming errors
          let errorMessage = "An error occurred while processing your request.";
          let errorCode: ErrorCode = ErrorCodes.INTERNAL_ERROR;

          if (error instanceof Anthropic.APIError) {
            if (error.status === 429) {
              errorMessage = "AI service is busy. Please wait a moment and try again.";
              errorCode = ErrorCodes.RATE_LIMITED;
            } else if (error.status === 401) {
              errorMessage = "AI service authentication error.";
              errorCode = ErrorCodes.UNAUTHORIZED;
            } else {
              errorMessage = "AI service error. Please try again.";
              errorCode = ErrorCodes.AI_SERVICE_ERROR;
            }
            console.error("[Streaming Anthropic Error]", {
              status: error.status,
              message: error.message,
            });
          } else if (error instanceof Error) {
            console.error("[Streaming Error]", {
              name: error.name,
              message: error.message,
            });
          }

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "error",
                error: errorMessage,
                code: errorCode,
              })}\n\n`
            )
          );
        } finally {
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        }
      },
    });

    // Return streaming response
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}

// =============================================================================
// PROCESS WITH TOOL CALLS
// =============================================================================

async function processWithToolCalls(
  anthropic: Anthropic,
  systemPrompt: string,
  messages: Anthropic.MessageParam[],
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  depth: number = 0
): Promise<void> {
  // Prevent infinite loops
  const MAX_TOOL_DEPTH = 10;
  if (depth >= MAX_TOOL_DEPTH) {
    controller.enqueue(
      encoder.encode(
        `data: ${JSON.stringify({
          type: "content",
          text: "I apologize, but I've reached the maximum number of tool calls. Please try rephrasing your request.",
        })}\n\n`
      )
    );
    return;
  }

  // Create streaming message
  const stream = anthropic.messages.stream({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: systemPrompt,
    messages,
    tools: TOOL_DEFINITIONS,
  });

  // Track tool uses for this response
  const toolUses: Array<{
    id: string;
    name: string;
    input: Record<string, unknown>;
  }> = [];
  let currentToolUse: {
    id: string;
    name: string;
    input: Record<string, unknown>;
  } | null = null;
  let stopReason: string | null = null;

  // Process stream events
  for await (const event of stream) {
    if (event.type === "content_block_start") {
      if (event.content_block.type === "tool_use") {
        // Starting a tool use block
        currentToolUse = {
          id: event.content_block.id,
          name: event.content_block.name,
          input: {},
        };
        // Notify client that tool is being called
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "tool_start",
              tool: event.content_block.name,
              id: event.content_block.id,
            })}\n\n`
          )
        );
      }
    } else if (event.type === "content_block_delta") {
      if (event.delta.type === "text_delta") {
        // Stream text content
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "content",
              text: event.delta.text,
            })}\n\n`
          )
        );
      } else if (event.delta.type === "input_json_delta") {
        // Accumulate tool input JSON (comes in chunks)
        // We'll parse it when the block ends
      }
    } else if (event.type === "content_block_stop") {
      if (currentToolUse) {
        toolUses.push(currentToolUse);
        currentToolUse = null;
      }
    } else if (event.type === "message_delta") {
      if (event.delta.stop_reason) {
        stopReason = event.delta.stop_reason;
      }
    } else if (event.type === "message_stop") {
      // Message complete
    }
  }

  // Get the final message to extract tool inputs
  const finalMessage = await stream.finalMessage();

  // If stop reason is tool_use, we need to execute tools and continue
  if (stopReason === "tool_use" && finalMessage.content) {
    // Extract tool use blocks from final message
    const toolUseBlocks = finalMessage.content.filter(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
    );

    if (toolUseBlocks.length > 0) {
      // Execute each tool and collect results
      const toolResults: Array<{
        type: "tool_result";
        tool_use_id: string;
        content: string;
      }> = [];

      for (const toolUse of toolUseBlocks) {
        // Notify client of tool execution
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "tool_executing",
              tool: toolUse.name,
              id: toolUse.id,
            })}\n\n`
          )
        );

        try {
          // Execute the tool
          const result = await executeToolCall(
            toolUse.name,
            toolUse.input as Record<string, unknown>
          );

          // Notify client of tool result
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "tool_result",
                tool: toolUse.name,
                id: toolUse.id,
                result: {
                  success: result.success,
                  showForm: result.showForm,
                  message: result.message,
                  hasData: !!result.data,
                },
              })}\n\n`
            )
          );

          // Format result for Claude
          toolResults.push({
            type: "tool_result",
            tool_use_id: toolUse.id,
            content: formatToolResultForClaude(result),
          });
        } catch (toolError) {
          console.error(`[Tool Error] ${toolUse.name}:`, toolError);

          // Notify client of tool error
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "tool_result",
                tool: toolUse.name,
                id: toolUse.id,
                result: {
                  success: false,
                  error: "Tool execution failed",
                },
              })}\n\n`
            )
          );

          // Format error result for Claude
          toolResults.push({
            type: "tool_result",
            tool_use_id: toolUse.id,
            content: JSON.stringify({
              success: false,
              error: toolError instanceof Error ? toolError.message : "Tool execution failed",
            }),
          });
        }
      }

      // Build new messages array with assistant response and tool results
      const newMessages: Anthropic.MessageParam[] = [
        ...messages,
        {
          role: "assistant",
          content: finalMessage.content,
        },
        {
          role: "user",
          content: toolResults,
        },
      ];

      // Continue the conversation with tool results
      await processWithToolCalls(
        anthropic,
        systemPrompt,
        newMessages,
        controller,
        encoder,
        depth + 1
      );
    }
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Format tool result for Claude to interpret
 */
function formatToolResultForClaude(result: ToolResult): string {
  if (!result.success) {
    return JSON.stringify({
      error: result.error,
      success: false,
    });
  }

  // Build a structured response
  const response: Record<string, unknown> = {
    success: true,
  };

  if (result.message) {
    response.message = result.message;
  }

  if (result.showForm) {
    response.showForm = result.showForm;
    response.instruction = `Display the ${result.showForm} form to the user. Include [FORM:${result.showForm.toUpperCase()}] in your response.`;
  }

  if (result.data) {
    response.data = result.data;
  }

  return JSON.stringify(response);
}
