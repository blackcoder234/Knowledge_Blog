# Math Equation Extension

## Overview

This extension implements a Microsoft Word-style equation editor for TipTap. It features a dual-mode interaction:

- **Display Mode**: Shows the rendered KaTeX equation.
- **Edit Mode**: Allows editing the raw LaTeX source with a live preview.

## Usage

### 1. Installation

Ensure `katex` and `lucide-react` are installed:

```bash
npm install katex lucide-react
```

(Already included in project dependencies)

### 2. Registering the Extension

Import and add `MathEquationBlock` to your editor extensions in `src/core/editor.ts`:

```typescript
import { MathEquationBlock } from "../extensions/math-equation";

// ...
const extensions = [
  // ...
  MathEquationBlock,
];
```

### 3. Inserting an Equation

You can insert an equation programmatically using the command:

```typescript
editor.chain().focus().setMathEquation({ latex: "E = mc^2" }).run();
```

Or usage with default empty content:

```typescript
editor.chain().focus().setMathEquation().run();
```

### 4. Renderer Support (Next.js / SSR)

Update your renderer (e.g., `TipTapRenderer.tsx`) to handle the `mathEquation` node type using `katex.renderToString`.

```tsx
// Example handling in Renderer
case 'mathEquation':
  const latex = node.attrs.latex || '';
  const html = katex.renderToString(latex, { throwOnError: false });
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
```

## Features & Controls

- **Click** an equation to edit it.
- **Enter** to save changes and switch to specific display mode.
- **Esc** to cancel editing and revert changes.
- **Click Outside** to save changes.

## Edge Cases & Limitations

- **Focus handling**: Clicking outside the component relies on document-level event listeners. Ensure no other global handlers stop propagation effectively blocking this.
- **Inline vs Block**: The node is defined as `inline: true` to flow with text (like Word), but can be styled as a block.
- **KaTeX Support**: Only widely supported LaTeX functions in KaTeX are available. Complex packages (like `tikz`) are not supported.
- **SSR**: Ensure `katex.min.css` is imported in your global styles or layout references to avoid unstyled math equations on initial load.
