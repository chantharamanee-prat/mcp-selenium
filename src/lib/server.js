#!/usr/bin/env node

import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { chromium, firefox, webkit } from "playwright";

// Create an MCP server
const server = new McpServer({
  name: "MCP Playwright",
  version: "1.0.1",
});

// Server state
const state = {
  browsers: new Map(),
  contexts: new Map(),
  pages: new Map(),
  currentSession: null,
};

// Helper functions
const getPage = () => {
  const page = state.pages.get(state.currentSession);
  if (!page) {
    throw new Error("No active browser session");
  }
  return page;
};

// Common schemas
const browserOptionsSchema = z
  .object({
    headless: z.boolean().optional().describe("Run browser in headless mode"),
    viewport: z
      .object({
        width: z.number().optional().describe("Viewport width in pixels"),
        height: z.number().optional().describe("Viewport height in pixels"),
      })
      .optional()
      .describe("Viewport size"),
    userAgent: z.string().optional().describe("Custom user agent string"),
    userDataDir: z
      .string()
      .optional()
      .describe(
        "Path to user data directory for persistent browser profile (cache, cookies, etc.)"
      ),
    channel: z
      .string()
      .optional()
      .describe(
        "Browser channel to use (e.g., 'chrome', 'msedge') for using system-installed browsers with their profiles"
      ),
  })
  .optional()
  .nullable()
  .default({});

const locatorSchema = {
  selector: z
    .string()
    .describe(
      "CSS selector, text selector, or other Playwright-compatible selector"
    ),
  timeout: z
    .number()
    .optional()
    .describe("Maximum time to wait for element in milliseconds"),
};

// Browser Management Tools
server.tool(
  "start_browser",
  "launches browser",
  {
    browser: z
      .enum(["chromium", "firefox", "webkit"])
      .describe("Browser to launch (chromium, firefox, or webkit/Safari)"),
    options: browserOptionsSchema,
  },
  async ({ browser, options = {} }) => {
    try {
      let browserInstance;
      const launchOptions = {
        headless: options?.headless ?? false,
      };

      // Add user data directory if provided
      if (options?.userDataDir) {
        launchOptions.args = [
          `--user-data-dir=${options.userDataDir}`,
          ...(launchOptions.args || []),
        ];
      }

      // Add channel for using system-installed browsers
      if (options?.channel) {
        launchOptions.channel = options.channel;
      }

      switch (browser) {
        case "chromium":
          browserInstance = await chromium.launch(launchOptions);
          break;
        case "firefox":
          browserInstance = await firefox.launch(launchOptions);
          break;
        case "webkit":
          browserInstance = await webkit.launch(launchOptions);
          break;
        default:
          throw new Error(`Unsupported browser: ${browser}`);
      }

      const contextOptions = {};
      if (options?.viewport) {
        contextOptions.viewport = options.viewport;
      }
      if (options?.userAgent) {
        contextOptions.userAgent = options.userAgent;
      }

      const context = await browserInstance.newContext(contextOptions);
      const page = await context.newPage();

      const sessionId = `${browser}_${Date.now()}`;
      state.browsers.set(sessionId, browserInstance);
      state.contexts.set(sessionId, context);
      state.pages.set(sessionId, page);
      state.currentSession = sessionId;

      return {
        content: [
          {
            type: "text",
            text: `Browser started with session_id: ${sessionId}`,
          },
        ],
      };
    } catch (e) {
      return {
        content: [
          { type: "text", text: `Error starting browser: ${e.message}` },
        ],
      };
    }
  }
);

server.tool(
  "navigate",
  "navigates to a URL",
  {
    url: z.string().describe("URL to navigate to"),
    waitUntil: z
      .enum(["load", "domcontentloaded", "networkidle"])
      .optional()
      .describe("When to consider navigation successful"),
  },
  async ({ url, waitUntil = "load" }) => {
    try {
      const page = getPage();
      await page.goto(url, { waitUntil });
      return {
        content: [{ type: "text", text: `Navigated to ${url}` }],
      };
    } catch (e) {
      return {
        content: [{ type: "text", text: `Error navigating: ${e.message}` }],
      };
    }
  }
);

server.tool(
  "get_current_url",
  "gets the current URL of the browser",
  {},
  async () => {
    try {
      const page = getPage();
      const currentUrl = page.url();
      return {
        content: [{ type: "text", text: currentUrl }],
      };
    } catch (e) {
      return {
        content: [
          { type: "text", text: `Error getting current URL: ${e.message}` },
        ],
      };
    }
  }
);

server.tool(
  "refresh_browser",
  "refreshes the current browser page and waits for content to load",
  {
    waitTime: z
      .number()
      .optional()
      .describe(
        "Time in milliseconds to wait after refresh for content to load (default: 15000)"
      ),
  },
  async ({ waitTime = 15000 }) => {
    try {
      const page = getPage();
      await page.reload();
      if (waitTime > 0) {
        await page.waitForTimeout(waitTime);
      }
      return {
        content: [
          {
            type: "text",
            text: `Page refreshed and waited ${waitTime}ms for content to load`,
          },
        ],
      };
    } catch (e) {
      return {
        content: [
          { type: "text", text: `Error refreshing page: ${e.message}` },
        ],
      };
    }
  }
);

server.tool(
  "sleep",
  "pauses execution for a specified amount of time (useful when waiting for network requests)",
  {
    ms: z
      .number()
      .optional()
      .describe("Time in milliseconds to pause the execution (default: 5000)"),
  },
  async ({ ms = 5000 }) => {
    try {
      const page = getPage();
      if (ms > 0) await page.waitForTimeout(ms);
      return {
        content: [
          {
            type: "text",
            text: `Slept for ${ms}ms`,
          },
        ],
      };
    } catch (e) {
      return {
        content: [{ type: "text", text: `Error sleeping: ${e.message}` }],
      };
    }
  }
);

// Element Interaction Tools
server.tool(
  "find_element",
  "finds an element",
  {
    ...locatorSchema,
  },
  async ({ selector, timeout = 10000 }) => {
    try {
      const page = getPage();
      await page.waitForSelector(selector, { timeout });
      return {
        content: [{ type: "text", text: "Element found" }],
      };
    } catch (e) {
      return {
        content: [
          { type: "text", text: `Error finding element: ${e.message}` },
        ],
      };
    }
  }
);

server.tool(
  "click_element",
  "clicks an element",
  {
    ...locatorSchema,
  },
  async ({ selector, timeout = 10000 }) => {
    try {
      const page = getPage();
      await page.click(selector, { timeout });
      return {
        content: [{ type: "text", text: "Element clicked" }],
      };
    } catch (e) {
      return {
        content: [
          { type: "text", text: `Error clicking element: ${e.message}` },
        ],
      };
    }
  }
);

server.tool(
  "send_keys",
  "sends keys to an element, aka typing",
  {
    ...locatorSchema,
    text: z.string().describe("Text to enter into the element"),
  },
  async ({ selector, text, timeout = 10000 }) => {
    try {
      const page = getPage();
      await page.fill(selector, text, { timeout });
      return {
        content: [
          { type: "text", text: `Text "${text}" entered into element` },
        ],
      };
    } catch (e) {
      return {
        content: [{ type: "text", text: `Error entering text: ${e.message}` }],
      };
    }
  }
);

server.tool(
  "get_element_text",
  "gets the text content of an element",
  {
    ...locatorSchema,
  },
  async ({ selector, timeout = 10000 }) => {
    try {
      const page = getPage();
      const text = await page.textContent(selector, { timeout });
      return {
        content: [{ type: "text", text: text || "" }],
      };
    } catch (e) {
      return {
        content: [
          { type: "text", text: `Error getting element text: ${e.message}` },
        ],
      };
    }
  }
);

server.tool(
  "hover",
  "moves the mouse to hover over an element",
  {
    ...locatorSchema,
  },
  async ({ selector, timeout = 10000 }) => {
    try {
      const page = getPage();
      await page.hover(selector, { timeout });
      return {
        content: [{ type: "text", text: "Hovered over element" }],
      };
    } catch (e) {
      return {
        content: [
          { type: "text", text: `Error hovering over element: ${e.message}` },
        ],
      };
    }
  }
);

server.tool(
  "drag_and_drop",
  "drags an element and drops it onto another element",
  {
    ...locatorSchema,
    targetSelector: z
      .string()
      .describe("CSS selector for the target drop element"),
  },
  async ({ selector, targetSelector, timeout = 10000 }) => {
    try {
      const page = getPage();
      await page.dragAndDrop(selector, targetSelector, { timeout });
      return {
        content: [{ type: "text", text: "Drag and drop completed" }],
      };
    } catch (e) {
      return {
        content: [
          {
            type: "text",
            text: `Error performing drag and drop: ${e.message}`,
          },
        ],
      };
    }
  }
);

server.tool(
  "double_click",
  "performs a double click on an element",
  {
    ...locatorSchema,
  },
  async ({ selector, timeout = 10000 }) => {
    try {
      const page = getPage();
      await page.dblclick(selector, { timeout });
      return {
        content: [{ type: "text", text: "Double click performed" }],
      };
    } catch (e) {
      return {
        content: [
          { type: "text", text: `Error performing double click: ${e.message}` },
        ],
      };
    }
  }
);

server.tool(
  "right_click",
  "performs a right click (context click) on an element",
  {
    ...locatorSchema,
  },
  async ({ selector, timeout = 10000 }) => {
    try {
      const page = getPage();
      await page.click(selector, { button: "right", timeout });
      return {
        content: [{ type: "text", text: "Right click performed" }],
      };
    } catch (e) {
      return {
        content: [
          { type: "text", text: `Error performing right click: ${e.message}` },
        ],
      };
    }
  }
);

server.tool(
  "press_key",
  "simulates pressing a keyboard key",
  {
    key: z.string().describe("Key to press (e.g., 'Enter', 'Tab', 'a', etc.)"),
  },
  async ({ key }) => {
    try {
      const page = getPage();
      await page.keyboard.press(key);
      return {
        content: [{ type: "text", text: `Key '${key}' pressed` }],
      };
    } catch (e) {
      return {
        content: [{ type: "text", text: `Error pressing key: ${e.message}` }],
      };
    }
  }
);

server.tool(
  "upload_file",
  "uploads a file using a file input element",
  {
    ...locatorSchema,
    filePath: z.string().describe("Absolute path to the file to upload"),
  },
  async ({ selector, filePath, timeout = 10000 }) => {
    try {
      const page = getPage();
      await page.setInputFiles(selector, filePath, { timeout });
      return {
        content: [{ type: "text", text: "File upload initiated" }],
      };
    } catch (e) {
      return {
        content: [{ type: "text", text: `Error uploading file: ${e.message}` }],
      };
    }
  }
);

server.tool(
  "take_screenshot",
  "captures a screenshot of the current page",
  {
    outputPath: z
      .string()
      .optional()
      .describe(
        "Optional path where to save the screenshot. If not provided, returns base64 data."
      ),
    fullPage: z
      .boolean()
      .optional()
      .describe("Capture full scrollable page (default: false)"),
  },
  async ({ outputPath, fullPage = false }) => {
    try {
      const page = getPage();
      const screenshot = await page.screenshot({
        path: outputPath,
        fullPage,
        type: outputPath?.endsWith(".jpg") ? "jpeg" : "png",
      });

      if (outputPath) {
        return {
          content: [
            { type: "text", text: `Screenshot saved to ${outputPath}` },
          ],
        };
      } else {
        return {
          content: [
            { type: "text", text: "Screenshot captured as base64:" },
            { type: "text", text: screenshot.toString("base64") },
          ],
        };
      }
    } catch (e) {
      return {
        content: [
          { type: "text", text: `Error taking screenshot: ${e.message}` },
        ],
      };
    }
  }
);

server.tool(
  "get_page_source",
  "fetches the body HTML of the current page with scripts removed, useful for analyzing web elements and finding selectors",
  {
    delay: z
      .number()
      .optional()
      .describe(
        "Optional delay in milliseconds to wait before fetching (useful for SPAs and dynamic content)"
      ),
  },
  async ({ delay = 0 }) => {
    try {
      const page = getPage();
      if (delay > 0) {
        await page.waitForTimeout(delay);
      }

      // Execute script to get body HTML without script tags
      const bodySource = await page.evaluate(() => {
        const body = document.body.cloneNode(true);
        const scripts = body.querySelectorAll("script");
        scripts.forEach((script) => script.remove());
        return body.outerHTML;
      });

      return {
        content: [{ type: "text", text: bodySource }],
      };
    } catch (e) {
      return {
        content: [
          { type: "text", text: `Error getting page source: ${e.message}` },
        ],
      };
    }
  }
);

server.tool(
  "close_session",
  "closes the current browser session",
  {},
  async () => {
    try {
      const browser = state.browsers.get(state.currentSession);
      if (browser) {
        await browser.close();
      }
      state.browsers.delete(state.currentSession);
      state.contexts.delete(state.currentSession);
      state.pages.delete(state.currentSession);
      const sessionId = state.currentSession;
      state.currentSession = null;
      return {
        content: [
          { type: "text", text: `Browser session ${sessionId} closed` },
        ],
      };
    } catch (e) {
      return {
        content: [
          { type: "text", text: `Error closing session: ${e.message}` },
        ],
      };
    }
  }
);

// Resources
server.resource(
  "browser-status",
  new ResourceTemplate("browser-status://current"),
  async (uri) => ({
    contents: [
      {
        uri: uri.href,
        text: state.currentSession
          ? `Active browser session: ${state.currentSession}`
          : "No active browser session",
      },
    ],
  })
);

// Cleanup handler
async function cleanup() {
  for (const [sessionId, browser] of state.browsers) {
    try {
      await browser.close();
    } catch (e) {
      console.error(`Error closing browser session ${sessionId}:`, e);
    }
  }
  state.browsers.clear();
  state.contexts.clear();
  state.pages.clear();
  state.currentSession = null;
  process.exit(0);
}

process.on("SIGTERM", cleanup);
process.on("SIGINT", cleanup);

// Start the server
const transport = new StdioServerTransport();
await server.connect(transport);
