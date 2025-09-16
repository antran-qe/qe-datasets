# Dataset Viewer

This is an HTML-based dataset viewer for AI image generation data.

## How to Use

Since browsers block loading local JSON files due to CORS security policies, you need to run a local HTTP server.

### Method 1: Using Python (Recommended)

1. Open Terminal/Command Prompt
2. Navigate to this folder:
   ```bash
   cd "/Users/an.vtran/Downloads/Nano-banana"
   ```
3. Run the server:
   ```bash
   python3 start_server.py
   ```
4. The browser should open automatically to `http://localhost:8000`

### Method 2: Using Python's built-in server

```bash
cd "/Users/an.vtran/Downloads/Nano-banana"
python3 -m http.server 8000
```

Then open `http://localhost:8000` in your browser.

### Method 3: Using Node.js (if you have it installed)

```bash
cd "/Users/an.vtran/Downloads/Nano-banana"
npx serve .
```

## Features

- **Dynamic loading**: Reads `data_output.json` each time you refresh
- **Copy prompts**: Click the copy button to copy prompts to clipboard
- **Copy images**: Hover over images and click copy to copy images to clipboard
- **Full-size view**: Click images to view them in full size
- **Responsive design**: Works on desktop and mobile
- **Auto-refresh**: Any changes to `data_output.json` will be visible after refreshing the page

## Updating Data

Simply edit the `data_output.json` file and refresh the browser page to see changes.

## File Structure

```
Nano-banana/
├── index.html          # Main viewer
├── data_output.json    # Dataset file
├── start_server.py     # Local server script
├── README.md          # This file
└── images/            # Image directories
    ├── image-to-image/
    └── text-to-image/
```
