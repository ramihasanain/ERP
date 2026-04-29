# General Guide: Build and Use a WYSIWYG Editor with `useQuill`

This guide explains a **general approach** to creating and using a WYSIWYG editor with `useQuill` in React.
It is intentionally project-agnostic.

---

## 1) What `useQuill` is

`useQuill` is a React hook (from `react-quilljs`) that gives you:

- a DOM ref to mount the Quill editor
- a `quill` instance once initialized
- optional setup options (theme, modules, formats, placeholders)

Use it when you want Quill's rich text editor in a React component without manually wiring lifecycle setup yourself.

---

## 2) Install dependencies

```bash
pnpm add quill react-quilljs
```

You usually also import a Quill theme CSS (for example, Snow):

```js
import 'quill/dist/quill.snow.css';
```

---

## 3) Minimal editor component

```jsx
import React, { useEffect, useState } from 'react';
import { useQuill } from 'react-quilljs';
import 'quill/dist/quill.snow.css';

export default function RichTextEditor() {
  const { quill, quillRef } = useQuill({
    theme: 'snow',
    placeholder: 'Write your content...',
  });

  const [html, setHtml] = useState('');

  useEffect(() => {
    if (!quill) return;

    const handleTextChange = () => {
      setHtml(quill.root.innerHTML);
    };

    quill.on('text-change', handleTextChange);

    return () => {
      quill.off('text-change', handleTextChange);
    };
  }, [quill]);

  return (
    <div>
      <div ref={quillRef} style={{ minHeight: 180 }} />
      <h4>Preview</h4>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
```

---

## 4) Common toolbar and formats setup

```js
const modules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ align: [] }],
    ['link', 'image', 'blockquote', 'code-block'],
    ['clean'],
  ],
};

const formats = [
  'header',
  'bold',
  'italic',
  'underline',
  'strike',
  'list',
  'bullet',
  'align',
  'link',
  'image',
  'blockquote',
  'code-block',
];
```

Then pass them to the hook:

```js
const { quill, quillRef } = useQuill({ theme: 'snow', modules, formats });
```

---

## 5) Set initial content safely

If you need to prefill content from API/database:

```js
useEffect(() => {
  if (!quill || !initialHtml) return;
  quill.clipboard.dangerouslyPasteHTML(initialHtml);
}, [quill, initialHtml]);
```

Use this once per data load to avoid overwriting user edits repeatedly.

---

## 6) Store content: HTML vs Delta

Quill supports two common representations:

- **HTML**: easy to render in web pages, common for CMS-like output.
- **Delta**: Quill's structured JSON format, better for versioning and rich-editor fidelity.

General recommendation:

- store **Delta** if you control both editing and rendering layers and need reliability
- store **sanitized HTML** if output must be rendered widely in non-Quill contexts

---

## 7) Security and sanitization (important)

Rich text may contain risky HTML. Before rendering user-generated content:

- sanitize HTML on the server (recommended)
- optionally sanitize again on the client before display
- avoid rendering unsanitized HTML directly

If you use `dangerouslySetInnerHTML`, treat it as trusted-only after sanitization.

---

## 8) Validation rules for forms

Common checks:

- required content (ignore pure empty tags like `<p><br></p>`)
- max length (`quill.getText().trim().length`)
- blocked content rules (links, images, etc. based on policy)

A practical empty check:

```js
const isEmpty = quill.getText().trim().length === 0;
```

---

## 9) Performance tips

- debounce save operations for `text-change` events
- avoid setting state on every keystroke unless needed
- initialize editor only when visible (for modals/tabs)
- unbind listeners on unmount

---

## 10) Typical reusable pattern

Use a wrapper component that receives:

- `value` (initial or controlled value)
- `onChange` callback
- `placeholder`
- `readOnly`
- `modules/formats` overrides

This keeps editor behavior consistent across different pages.

---

## 11) Troubleshooting quick list

- Editor not styled -> ensure Quill CSS theme import exists.
- `quill` is `undefined` -> wait for hook initialization before using it.
- Content resets unexpectedly -> check repeated initial-value effects.
- Toolbar missing buttons -> verify `modules.toolbar` structure.
- Rendering issues -> sanitize and inspect stored payload format (HTML vs Delta).

---

## 12) Summary

A strong general approach with `useQuill` is:

1. initialize with clear `modules` and `formats`
2. sync changes through a controlled callback/state pattern
3. sanitize before render/store boundaries
4. reuse a wrapper component for consistency
5. validate content using Quill text APIs, not raw HTML alone

