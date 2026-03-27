# Journeyship UI Redesign Plan

## Overview

Reorganize the UI to be more intuitive with Photoshop-style layers, auto-updating blocks, and modern styling.

---

## Phase 1: Easy Local Development Setup

### 1.1 Add npm start script with auto-reload (optional) or simple instructions

**File: `package.json`** - Already has `npm start`

**Create: `README-DEV.md`** with:
```
# Local Development

npm install
npm start

Visit http://localhost:3000
```

---

## Phase 2: HTML Structure Reorganization

### 2.1 Move Block Editor to Top

**File: `static/views/index.html`**

Current order:
1. Backgrounds picker
2. Top buttons (New, Save, etc.)
3. Main canvas with palette below
4. Block editor (constructor) at bottom

New order:
1. Top buttons (New, Save, etc.)
2. **Block Editor** (always visible, with heading + instructions)
3. Main canvas with Photoshop-style layer panel on LEFT
4. Backgrounds picker in footer area

### 2.2 New HTML Structure

```html
<div class='parent-container'>
  <!-- Top buttons -->
  <div class='top-button-container'>...</div>

  <!-- BLOCK EDITOR - Now at top, always visible -->
  <div id="block-editor-container">
    <div class="editor-header">
      <h2>Block Editor</h2>
      <p class="editor-instructions">Create an animated character or object here</p>
    </div>

    <div class="editor-content">
      <!-- Left: Layer panel (Photoshop-style) -->
      <div class="editor-layers-panel">
        <div class="panel-header">Layers</div>
        <div class="layers-list">
          <!-- Each layer as a row with thumbnail, visibility toggle -->
        </div>
        <div class="layer-actions">
          <button id="new-layer">+</button>
          <button id="copy-layer">⧉</button>
          <button id="delete-layer">🗑</button>
        </div>
      </div>

      <!-- Center: Canvas for drawing -->
      <div id="constructor-area-container">...</div>

      <!-- Right: Color palette + Preview -->
      <div class="editor-sidebar">
        <div class="preview-section">
          <div class="panel-header">Preview</div>
          <canvas class='block-preview'></canvas>
        </div>
        <div class="colors-section">
          <div class="panel-header">Colors</div>
          <div id="constructor-color-palette"></div>
        </div>
      </div>
    </div>
  </div>

  <!-- MAIN CANVAS AREA -->
  <div class='main-container'>
    <h1 class="page-heading">Journey Ship</h1>

    <div class="canvas-workspace">
      <!-- Left: Photoshop-style layer panel -->
      <div class="canvas-layers-panel">
        <div class="panel-header">Layers</div>
        <div class="layer-item" data-layer="foreground">
          <span class="layer-icon">👤</span>
          <span class="layer-name">Foreground</span>
        </div>
        <div class="layer-item" data-layer="background">
          <span class="layer-icon">🏞</span>
          <span class="layer-name">Background</span>
        </div>
      </div>

      <!-- Center: Canvas -->
      <div id="main-area-container">
        <canvas id="main-area"></canvas>
      </div>
    </div>

    <!-- Palette: Shows different items based on selected layer -->
    <div id="main-color-palette">
      <!-- Solid colors (smaller) - visible when background selected -->
      <!-- Animated blocks - visible when foreground selected -->
    </div>
  </div>

  <!-- Footer with backgrounds -->
  <div class="footer">
    <div class="backgrounds-picker">...</div>
    ...
  </div>
</div>
```

---

## Phase 3: CSS Updates

### 3.1 Block Editor Styling (Top, Always Visible)

```css
#block-editor-container {
  background: #2d2d2d;
  padding: 20px 30px;
  margin-bottom: 20px;
  border-radius: 8px;
}

.editor-header h2 {
  color: #fff;
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 4px 0;
}

.editor-instructions {
  color: #888;
  font-size: 13px;
  margin: 0 0 16px 0;
}

.editor-content {
  display: flex;
  gap: 20px;
}
```

### 3.2 Photoshop-Style Layer Panels

```css
.editor-layers-panel,
.canvas-layers-panel {
  background: #3d3d3d;
  border-radius: 6px;
  width: 120px;
  padding: 0;
  overflow: hidden;
}

.panel-header {
  background: #4a4a4a;
  color: #ccc;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  padding: 8px 12px;
  border-bottom: 1px solid #555;
}

.layer-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  border-bottom: 1px solid #333;
  color: #ddd;
  font-size: 12px;
}

.layer-item:hover {
  background: #4a4a4a;
}

.layer-item.selected {
  background: #5a8dee;
  color: #fff;
}

.layer-item canvas {
  width: 32px;
  height: 32px;
  margin-right: 8px;
  border: 1px solid #555;
  background: url(/img/transparent-block-bg.png);
}
```

### 3.3 Smaller Solid Color Blocks

```css
/* Solid colors in palette - smaller */
#main-color-palette .solid-color {
  width: 24px;
  height: 24px;
}

/* Animated blocks - normal size */
#main-color-palette .animated-block {
  width: 60px;
  height: 60px;
}
```

### 3.4 Modern Button Styling

```css
.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-primary {
  background: #5a8dee;
  color: #fff;
}

.btn-primary:hover {
  background: #4a7dde;
}

.btn-secondary {
  background: #4a4a4a;
  color: #ddd;
}

.btn-secondary:hover {
  background: #5a5a5a;
}

.btn-icon {
  width: 28px;
  height: 28px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}
```

---

## Phase 4: JavaScript Changes

### 4.1 Auto-Update Block (Remove Update Button)

**File: `static/js/journeyship.js`**

Currently, clicking "Update" calls the update logic. Change to:
- Listen for changes on the editor canvas
- Debounce updates (wait 300ms after last change)
- Automatically update the selected block in the palette

```javascript
// Remove: $('#save-block').on('click', ...)

// Add: Auto-update on editor change
var updateTimeout;
function scheduleBlockUpdate() {
  clearTimeout(updateTimeout);
  updateTimeout = setTimeout(function() {
    updateSelectedBlock();
  }, 300);
}

// Call scheduleBlockUpdate() whenever editor canvas changes
```

### 4.2 Default to New Block on Load

```javascript
// In load() function, after setup:
// Start with a fresh new block in the editor
editorArea.setup(); // Clear editor
// No block selected in palette initially
```

### 4.3 Layer Selection Logic

```javascript
// Foreground selected by default
var currentLayer = 'foreground';

// When foreground selected: show animated blocks, hide solid colors
// When background selected: show solid colors, hide animated blocks

$('.canvas-layers-panel .layer-item').on('click', function() {
  var layer = $(this).data('layer');
  currentLayer = layer;

  $('.canvas-layers-panel .layer-item').removeClass('selected');
  $(this).addClass('selected');

  if (layer === 'foreground') {
    $('#main-color-palette .solid-color').hide();
    $('#main-color-palette .animated-block').show();
    mainArea.selectForeground();
  } else {
    $('#main-color-palette .solid-color').show();
    $('#main-color-palette .animated-block').hide();
    mainArea.selectBackground();
  }
});

// Default to foreground on load
$('.canvas-layers-panel .layer-item[data-layer="foreground"]').click();
```

### 4.4 Palette Item Classification

When adding items to palette, mark them:
```javascript
// Solid colors get class 'solid-color'
// Animated blocks get class 'animated-block'
```

---

## Phase 5: File Changes Summary

| File | Changes |
|------|---------|
| `static/views/index.html` | Restructure: editor at top, layer panels, remove Update button |
| `static/css/style.css` | Add Photoshop-style panels, modern buttons, smaller colors |
| `static/js/journeyship.js` | Auto-update, layer visibility logic, foreground default |

---

## Implementation Order

1. **Create dev instructions** - Quick wins first
2. **HTML restructure** - Move editor to top, add layer panels
3. **CSS: Dark editor panel** - Style the block editor container
4. **CSS: Layer panels** - Photoshop-style layer UI for both editor and canvas
5. **CSS: Modern buttons** - Update button styles throughout
6. **CSS: Smaller color blocks** - Reduce size of solid colors
7. **JS: Layer visibility** - Show/hide palette items based on layer
8. **JS: Auto-update** - Remove Update button, add auto-save
9. **JS: Default foreground** - Start with foreground selected
10. **JS: Default new block** - Start editing a blank block

---

## Testing Checklist

- [ ] Block editor visible at top on page load
- [ ] Editor has heading "Block Editor" and instructions
- [ ] Editor layers look like Photoshop layers
- [ ] Main canvas has foreground/background layer panel on left
- [ ] Foreground selected by default
- [ ] Solid colors only visible when background layer selected
- [ ] Animated blocks only visible when foreground layer selected
- [ ] Solid color blocks are smaller than animated blocks
- [ ] Changes in editor auto-update the selected palette block
- [ ] No "Update" button visible
- [ ] Buttons look modern (rounded, clean)
- [ ] `npm start` runs the server on localhost:3000
