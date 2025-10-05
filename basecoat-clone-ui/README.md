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

---

## Component Documentation

Below is a summary of some of the key components available in the library. For a full list and live examples, please see the `index.html` file.

### Accordion
A vertically stacked set of interactive headings. The JavaScript ensures only one item is open at a time.
**Usage:** `<div class="accordion">...</div>`

### Alert & Alert Dialog
-   **Alert:** A component for displaying important messages. Variants include `.alert-destructive`.
-   **Alert Dialog:** A modal dialog that interrupts the user with a critical message, such as confirming a destructive action. Triggered using `data-dialog-target`.

### Button & Button Group
-   **Button:** A CSS-only component with multiple variants (`.btn-primary`, `.btn-secondary`, `.btn-destructive`, `.btn-ghost`, `.btn-link`).
-   **Button Group:** Visually groups a series of buttons together.

### Card
A versatile container for content with distinct header, content, and footer sections.
**Usage:** `<div class="card">...</div>`

### Carousel
An interactive slideshow for cycling through images or content, with previous/next controls and pagination.
**Usage:** `<div class="carousel" data-carousel>...</div>`

### Combobox
An input field that combines a text input with a filterable list of options.
**Usage:** `<div class="combobox" data-combobox>...</div>`

### Command
A searchable command palette, typically displayed in a dialog, for finding and executing actions.
**Usage:** `<dialog class="dialog command" data-command>...</div>`

### Date Picker
A component that allows users to select a date from a calendar interface.
**Usage:** `<div class="date-picker" data-datepicker>...</div>`

### Dialog
A modal window that overlays the page. It's accessible and can be closed with the Escape key or a close button.
**Usage:** Trigger with `<button data-dialog-target="#my-dialog">` and define with `<dialog id="my-dialog" class="dialog">`.

### Dropdown Menu
A menu that appears when a trigger element is clicked, displaying a list of actions or options.
**Usage:** `<div class="dropdown" data-dropdown>...</div>`

### Sonner (Toast)
A notification that appears temporarily. Trigger it with the global `showSonner()` function.
**Usage:** `showSonner('Message', { title: 'Title', position: 'top-right' })`

### Toggle & Toggle Group
-   **Toggle:** A two-state button that can be pressed or unpressed.
-   **Toggle Group:** A group of toggles where only one can be active at a time.