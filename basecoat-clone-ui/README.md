# Basecoat Clone UI

A vanilla HTML, CSS, and JavaScript component library inspired by the design of ShadCN/UI and the architecture of Basecoat UI. This project provides a set of accessible, framework-agnostic components that you can drop into any project.

**Goals:**
- **No React, No Tailwind:** Just plain HTML, CSS, and JS.
- **DRY & Well-Optimized:** A single CSS file and a single JS file for all components.
- **Class-Based:** Simple, semantic class names for styling and functionality.

---

## How to Use

1.  **Include the CSS and JS files** in your HTML document. It's best practice to include the CSS in the `<head>` and the JavaScript at the end of the `<body>`.

    ```html
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <link rel="stylesheet" href="css/base.css" />
      <title>My Awesome Site</title>
    </head>
    <body>
      <!-- Your content here -->
      <script defer src="js/base.js"></script>
    </body>
    </html>
    ```

2.  **Copy the component HTML** from the `components/` directory into your project. The `index.html` file in the root serves as a "kitchen sink" showcasing all available components.

3.  **Ensure you have a toast container** if you plan to use the toast component. Place this div just before the closing `</body>` tag.
    ```html
    <div id="toast-container"></div>
    ```

---

## Available Components (Starter Set)

### Button

A CSS-only component with multiple variants.

**Usage:**
```html
<button class="btn btn-primary">Primary</button>
<button class="btn btn-secondary">Secondary</button>
<button class="btn btn-destructive">Destructive</button>
```

### Accordion

A vertically stacked set of interactive headings. The JavaScript ensures only one item is open at a time.

**Usage:**
```html
<div class="accordion">
  <details class="accordion-item">
    <summary class="accordion-trigger">...</summary>
    <div class="accordion-content">...</div>
  </details>
  <details class="accordion-item">
    <summary class="accordion-trigger">...</summary>
    <div class="accordion-content">...</div>
  </details>
</div>
```

### Dialog (Modal)

A modal window that overlays the page. It's accessible and can be closed with the Escape key or a close button.

**Usage:**
```html
<!-- Trigger -->
<button class="btn" data-dialog-target="#my-dialog">Open Dialog</button>

<!-- Dialog -->
<dialog id="my-dialog" class="dialog">
  ...
  <button data-dialog-close>Close</button>
  ...
</dialog>
```

### Tooltip

A small popup that appears on hover or focus.

**Usage:**
```html
<div class="tooltip" data-tooltip>
  <button class="btn tooltip-trigger">Hover Me</button>
  <div class="tooltip-content">Tooltip text!</div>
</div>
```

### Toast

A notification that appears temporarily. Trigger it with the global `showToast()` function.

**Usage:**
```html
<button class="btn" onclick="showToast('Your message here', 'Optional Title')">
  Show Toast
</button>
```