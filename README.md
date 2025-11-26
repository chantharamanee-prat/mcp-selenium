# MCP Playwright Server

A Model Context Protocol (MCP) server implementation for Playwright, enabling browser automation through standardized MCP clients.

## Features

- Start browser sessions with customizable options
- Navigate to URLs with configurable wait strategies
- Find elements using Playwright's powerful selector engine
- Click, type, and interact with elements
- Perform mouse actions (hover, drag and drop)
- Handle keyboard input
- Take screenshots (full page or viewport)
- Fetch complete page HTML source for element analysis
- Upload files
- Execute custom JavaScript in page context
- Support for headless mode
- Viewport and user agent customization

## Supported Browsers

- Chromium (Chrome, Edge, etc.)
- Firefox
- WebKit (Safari)

## Use with Goose

### Option 1: One-click install

Copy and paste the link below into a browser address bar to add this extension to goose desktop:

```
goose://extension?cmd=npx&arg=-y&arg=%40mrgolfprat%2Fmcp-playwright&id=playwright-mcp&name=Playwright%20MCP&description=automates%20browser%20interactions
```

### Option 2: Add manually to desktop or CLI

- Name: `Playwright MCP`
- Description: `automates browser interactions`
- Command: `npx -y @mrgolfprat/mcp-playwright`

## Use with other MCP clients (e.g. Claude Desktop, etc)

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@mrgolfprat/mcp-playwright"]
    }
  }
}
```

---

## Development

To work on this project:

1. Clone the repository
2. Install dependencies: `npm install`
3. Install Playwright browsers: `npx playwright install`
4. Run the server: `npm start`

### Local Development MCP Configuration

For local development and testing, you can configure your MCP client to use the local version of the server:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "node",
      "args": ["path-to-your-mcp-playwright/bin/mcp-playwright.js"]
    }
  }
}
```

**Note:** Replace the path in `args` with the absolute path to your local `bin/mcp-playwright.js` file.

Alternatively, if you have the package linked globally (using `npm link`), you can use:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "mcp-playwright"
    }
  }
}
```

### Installation

#### Installing via Smithery

To install MCP Playwright for Claude Desktop automatically via [Smithery](https://smithery.ai/server/@mrgolfprat/mcp-playwright):

```bash
npx -y @smithery/cli install @mrgolfprat/mcp-playwright --client claude
```

#### Manual Installation

```bash
npm install -g @mrgolfprat/mcp-playwright
npx playwright install
```

### Usage

Start the server by running:

```bash
mcp-playwright
```

Or use with NPX in your MCP configuration:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@mrgolfprat/mcp-playwright"]
    }
  }
}
```

## Tools

### start_browser

Launches a browser session.

**Parameters:**

- `browser` (required): Browser to launch
  - Type: string
  - Enum: ["chromium", "firefox", "webkit"]
- `options` (optional): Browser configuration options (can be omitted or null)
  - Type: object or null
  - Properties:
    - `headless`: Run browser in headless mode
      - Type: boolean
    - `viewport`: Viewport size configuration
      - Type: object
      - Properties:
        - `width`: Viewport width in pixels (number)
        - `height`: Viewport height in pixels (number)
    - `userAgent`: Custom user agent string
      - Type: string
    - `userDataDir`: Path to user data directory for persistent browser profile (cache, cookies, login sessions)
      - Type: string
      - Note: Allows reusing cached JavaScript bundles, images, CSS, and maintaining login sessions
    - `channel`: Browser channel to use system-installed browsers (e.g., "chrome", "msedge")
      - Type: string
      - Note: Use with system browsers to access their existing profiles and cache

**Examples:**

Simple usage without options:

```json
{
  "tool": "start_browser",
  "parameters": {
    "browser": "chromium"
  }
}
```

With options:

```json
{
  "tool": "start_browser",
  "parameters": {
    "browser": "chromium",
    "options": {
      "headless": true,
      "viewport": {
        "width": 1920,
        "height": 1080
      },
      "userAgent": "Mozilla/5.0 Custom Agent"
    }
  }
}
```

With null options (also valid):

```json
{
  "tool": "start_browser",
  "parameters": {
    "browser": "firefox",
    "options": null
  }
}
```

**Using cached browser profile (reuse JavaScript bundles, cookies, login sessions):**

```json
{
  "tool": "start_browser",
  "parameters": {
    "browser": "chromium",
    "options": {
      "userDataDir": "C:\\Users\\YourName\\AppData\\Local\\Google\\Chrome\\User Data",
      "headless": false
    }
  }
}
```

**Using system-installed Chrome with its profile:**

```json
{
  "tool": "start_browser",
  "parameters": {
    "browser": "chromium",
    "options": {
      "channel": "chrome",
      "headless": false
    }
  }
}
```

**Common user data directory paths:**

- **Chrome (Windows):** `C:\Users\<Username>\AppData\Local\Google\Chrome\User Data`
- **Chrome (macOS):** `~/Library/Application Support/Google/Chrome`
- **Chrome (Linux):** `~/.config/google-chrome`
- **Edge (Windows):** `C:\Users\<Username>\AppData\Local\Microsoft\Edge\User Data`
- **Firefox (Windows):** `C:\Users\<Username>\AppData\Roaming\Mozilla\Firefox\Profiles\<profile-id>`
- **Firefox (macOS):** `~/Library/Application Support/Firefox/Profiles/<profile-id>`
- **Firefox (Linux):** `~/.mozilla/firefox/<profile-id>`

### navigate

Navigates to a URL.

**Parameters:**

- `url` (required): URL to navigate to
  - Type: string
- `waitUntil` (optional): When to consider navigation successful
  - Type: string
  - Enum: ["load", "domcontentloaded", "networkidle"]
  - Default: "load"

**Example:**

```json
{
  "tool": "navigate",
  "parameters": {
    "url": "https://www.example.com",
    "waitUntil": "networkidle"
  }
}
```

### get_current_url

Gets the current URL of the browser. Useful for verifying redirects after login or navigation actions.

**Parameters:**
None required

**Example:**

```json
{
  "tool": "get_current_url",
  "parameters": {}
}
```

**Use cases:**

- Verify successful login redirect to dashboard
- Confirm navigation to expected page after form submission
- Check URL changes in single page applications
- Validate route changes during user flows

### refresh_browser

Refreshes the current browser page. Use the `sleep` tool after this if you need to wait for content to load.

**Parameters:**
None required

**Example:**

```json
{
  "tool": "refresh_browser",
  "parameters": {}
}
```

### sleep

Pauses execution for a specified amount of time — useful when waiting for background network requests or asynchronous page updates before continuing automation steps.

**Parameters:**

- `ms` (optional): Milliseconds to pause execution.
  - Type: number
  - Default: 5000 (5 seconds)

**Example:**

```json
{
  "tool": "sleep",
  "parameters": {
    "ms": 10000
  }
}
```

### find_element

Finds an element on the page using Playwright selectors.

**Parameters:**

- `selector` (required): CSS selector, text selector, or other Playwright-compatible selector
  - Type: string
- `timeout`: Maximum time to wait for element in milliseconds
  - Type: number
  - Default: 10000

**Example:**

```json
{
  "tool": "find_element",
  "parameters": {
    "selector": "#search-input",
    "timeout": 5000
  }
}
```

### click_element

Clicks an element.

**Parameters:**

- `selector` (required): CSS selector or Playwright-compatible selector
  - Type: string
- `timeout`: Maximum time to wait for element in milliseconds
  - Type: number
  - Default: 10000

**Example:**

```json
{
  "tool": "click_element",
  "parameters": {
    "selector": ".submit-button"
  }
}
```

### send_keys

Sends keys to an element (typing).

**Parameters:**

- `selector` (required): CSS selector or Playwright-compatible selector
  - Type: string
- `text` (required): Text to enter into the element
  - Type: string
- `timeout`: Maximum time to wait for element in milliseconds
  - Type: number
  - Default: 10000

**Example:**

```json
{
  "tool": "send_keys",
  "parameters": {
    "selector": "input[name='username']",
    "text": "testuser"
  }
}
```

### get_element_text

Gets the text content of an element.

**Parameters:**

- `selector` (required): CSS selector or Playwright-compatible selector
  - Type: string
- `timeout`: Maximum time to wait for element in milliseconds
  - Type: number
  - Default: 10000

**Example:**

```json
{
  "tool": "get_element_text",
  "parameters": {
    "selector": ".message"
  }
}
```

### hover

Moves the mouse to hover over an element.

**Parameters:**

- `selector` (required): CSS selector or Playwright-compatible selector
  - Type: string
- `timeout`: Maximum time to wait for element in milliseconds
  - Type: number
  - Default: 10000

**Example:**

```json
{
  "tool": "hover",
  "parameters": {
    "selector": ".dropdown-menu"
  }
}
```

### drag_and_drop

Drags an element and drops it onto another element.

**Parameters:**

- `selector` (required): CSS selector for source element
  - Type: string
- `targetSelector` (required): CSS selector for target element
  - Type: string
- `timeout`: Maximum time to wait for elements in milliseconds
  - Type: number
  - Default: 10000

**Example:**

```json
{
  "tool": "drag_and_drop",
  "parameters": {
    "selector": "#draggable",
    "targetSelector": "#droppable"
  }
}
```

### double_click

Performs a double click on an element.

**Parameters:**

- `selector` (required): CSS selector or Playwright-compatible selector
  - Type: string
- `timeout`: Maximum time to wait for element in milliseconds
  - Type: number
  - Default: 10000

**Example:**

```json
{
  "tool": "double_click",
  "parameters": {
    "selector": ".editable-text"
  }
}
```

### right_click

Performs a right click (context click) on an element.

**Parameters:**

- `selector` (required): CSS selector or Playwright-compatible selector
  - Type: string
- `timeout`: Maximum time to wait for element in milliseconds
  - Type: number
  - Default: 10000

**Example:**

```json
{
  "tool": "right_click",
  "parameters": {
    "selector": ".context-menu-trigger"
  }
}
```

### press_key

Simulates pressing a keyboard key.

**Parameters:**

- `key` (required): Key to press (e.g., 'Enter', 'Tab', 'a', etc.)
  - Type: string

**Example:**

```json
{
  "tool": "press_key",
  "parameters": {
    "key": "Enter"
  }
}
```

### upload_file

Uploads a file using a file input element.

**Parameters:**

- `selector` (required): CSS selector or Playwright-compatible selector
  - Type: string
- `filePath` (required): Absolute path to the file to upload
  - Type: string
- `timeout`: Maximum time to wait for element in milliseconds
  - Type: number
  - Default: 10000

**Example:**

```json
{
  "tool": "upload_file",
  "parameters": {
    "selector": "#file-input",
    "filePath": "/path/to/file.pdf"
  }
}
```

### take_screenshot

Captures a screenshot of the current page.

**Parameters:**

- `outputPath` (optional): Path where to save the screenshot. If not provided, returns base64 data.
  - Type: string
- `fullPage` (optional): Capture full scrollable page
  - Type: boolean
  - Default: false

**Example:**

```json
{
  "tool": "take_screenshot",
  "parameters": {
    "outputPath": "/path/to/screenshot.png",
    "fullPage": true
  }
}
```

### get_page_source

Fetches the body HTML of the current page with script tags removed. This is useful for analyzing web elements, finding selectors, and understanding page structure without script clutter. For SPAs and dynamic content that loads asynchronously, use the `sleep` tool before calling this.

**Parameters:**
None required

**Example:**

```json
{
  "tool": "get_page_source",
  "parameters": {}
}
```

**Use cases:**

- Analyze the DOM structure to find appropriate CSS selectors or XPath queries
- Debug element location issues by examining the actual HTML
- Get clean HTML without JavaScript code for better readability
- For dynamic content in SPAs, use `sleep` tool first, then call this tool

### close_session

Closes the current browser session and cleans up resources.

**Parameters:**
None required

**Example:**

```json
{
  "tool": "close_session",
  "parameters": {}
}
```

## License

MIT
