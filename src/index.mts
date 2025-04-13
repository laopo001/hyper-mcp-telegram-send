#!/usr/bin/env node

/**
 * This is a template MCP server that implements a simple notes system.
 * It demonstrates core MCP concepts like resources and tools by allowing:
 * - Listing notes as resources
 * - Reading individual notes
 * - Creating new notes via a tool
 * - Summarizing all notes via a prompt
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import Telegram from "node-telegram-bot-api";
// import "dotenv/config";
/**
 * Create an MCP server with capabilities for resources (to list/read notes),
 * tools (to create new notes), and prompts (to summarize notes).
 */
const server = new Server(
  {
    name: "telegram-send",
    version: "0.1.0",
  },
  {
    capabilities: {
      resources: {},
      tools: {},
      prompts: {},
    },
  }
);

/**
 * Handler that lists available tools.
 * Exposes a single "create_note" tool that lets clients create new notes.
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "sent_message",
        description: "sent message by telegram",
        inputSchema: {
          type: "object",
          properties: {
            message: {
              type: "string",
              description: "message",
            },
          },
          required: ["message"],
        },
      },
    ],
  };
});

/**
 * Handler for the create_note tool.
 * Creates a new note with the provided title and content, and returns success message.
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  // console.log(request.params.name, request.params.arguments);
  switch (request.params.name) {
    case "sent_message": {
      const message = String(request.params.arguments?.message);
      try {
        await send(message);
        return {
          content: [
            {
              type: "text",
              text: `send message successfully`,
            },
          ],
        };
      } catch (error) {
        throw new Error(`send message failed`);
      }
    }

    default:
      throw new Error("Unknown tool");
  }
});

const token = process.env["token"] || "";
const chat_id = parseInt(process.env["chat_id"] || "", 10);

let bot = new Telegram(token, { polling: false });
// await bot.sendMessage(chat_id, `mcp-telegram-send test message!!`, {});

async function send(text: string) {
  return await bot.sendMessage(chat_id, text, {});
  // return await fetch("https://api.telegram.org/bot" + token + "/sendMessage", {
  //   method: "POST",
  //   headers: {
  //     "Content-Type": "application/x-www-form-urlencoded",
  //   },
  //   body: qs.stringify({
  //     chat_id,
  //     text,
  //   }),
  // }).then((response) => response.json());
}

const transport = new StdioServerTransport();
await server.connect(transport);
