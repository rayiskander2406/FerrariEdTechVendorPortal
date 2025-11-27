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

// =============================================================================
// GET - Health Check
// =============================================================================

export async function GET() {
  return Response.json({
    status: "ok",
    service: "lausd-vendor-chat",
    timestamp: new Date().toISOString(),
  });
}

// =============================================================================
// POST - Chat with Claude
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = (await request.json()) as ChatRequest;
    const { messages, vendorContext } = body;

    // Validate messages
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return Response.json(
        { error: "Messages array is required and must not be empty" },
        { status: 400 }
      );
    }

    // Check for API key
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: "ANTHROPIC_API_KEY environment variable is not set" },
        { status: 500 }
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
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "error", error: errorMessage })}\n\n`
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
    console.error("Chat API error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return Response.json({ error: errorMessage }, { status: 500 });
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
  let accumulatedText = "";
  let stopReason: string | null = null;

  // Process stream events
  for await (const event of stream) {
    if (event.type === "content_block_start") {
      if (event.content_block.type === "text") {
        // Starting a text block
        accumulatedText = "";
      } else if (event.content_block.type === "tool_use") {
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
        accumulatedText += event.delta.text;
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
                // Include data summary but not full data to keep stream light
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
