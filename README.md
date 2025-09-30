# GitHub Checkboxes to JSON TUI

A Terminal User Interface (TUI) for navigating and selecting services from a
tree structure, built with React and Ink, running on Deno.

## Features

- **Tree Navigation**: Navigate through the service tree using arrow keys
- **Keyboard Controls**:
  - `↑/↓` - Navigate up/down through items
  - `→` - Expand collapsed parent nodes
  - `←` - Collapse expanded parent nodes
  - `SPACE/ENTER` - Toggle checkbox state
  - `F` - Export selection as JSON and exit
  - `Q/ESC` - Quit and export JSON

- **Smart Flattening**: If a parent is checked, all children are automatically
  included in the output

## Requirements

- [Deno](https://deno.land/) 1.x or later

## Usage

```bash
# Run the TUI
deno task dev

# Or run directly
deno run --allow-all src/generate-flattened-list.tsx
```

## Output

When you press 'F' or 'Q', the application will exit and output a JSON array of
selected services:

```json
[
  "auth",
  "frontend",
  "dashboard",
  "settings"
]
```

## Project Structure

- `src/generate-flattened-list.tsx` - Main TUI application
- `deno.json` - Deno configuration and dependencies
- `README.md` - This file

## Example Tree Structure

```
▼ [ ] backend
    [✓] auth
    [ ] billing
    [ ] notifications
▼ [✓] frontend
    [✓] dashboard
    [✓] settings
```

In this example:

- `auth` is individually selected
- `frontend` is selected (which automatically includes `dashboard` and
  `settings`)
- The final output would be: `["auth", "frontend", "dashboard", "settings"]`
