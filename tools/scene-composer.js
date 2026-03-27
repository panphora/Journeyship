#!/usr/bin/env node

/**
 * Scene Composer v2
 * Creates a full Journeyship scene (320x120) with static background and scaled animated assets
 */

const fs = require('fs');
const path = require('path');

const SCENE_WIDTH = 320;
const SCENE_HEIGHT = 120;

// Load a block JSON and return its layers
function loadBlock(name) {
  const filePath = path.join(__dirname, '..', 'static', 'tools', 'blocks', `${name}.json`);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  return data.layers;
}

// Convert flat array to 2D grid (20x20)
function layerToGrid(layer) {
  const grid = [];
  for (let y = 0; y < 20; y++) {
    const row = [];
    for (let x = 0; x < 20; x++) {
      row.push(layer[y * 20 + x]);
    }
    grid.push(row);
  }
  return grid;
}

// Scale a 20x20 grid down to a smaller size using nearest neighbor
function scaleGrid(grid, newSize) {
  const scaled = [];
  const ratio = 20 / newSize;
  for (let y = 0; y < newSize; y++) {
    const row = [];
    for (let x = 0; x < newSize; x++) {
      const srcX = Math.floor(x * ratio);
      const srcY = Math.floor(y * ratio);
      row.push(grid[srcY][srcX]);
    }
    scaled.push(row);
  }
  return scaled;
}

// Create empty scene frame
function createEmptyFrame() {
  const frame = [];
  for (let y = 0; y < SCENE_HEIGHT; y++) {
    const row = [];
    for (let x = 0; x < SCENE_WIDTH; x++) {
      row.push('transparent');
    }
    frame.push(row);
  }
  return frame;
}

// Place a grid onto scene at position (px, py)
function placeGrid(sceneFrame, grid, px, py) {
  const height = grid.length;
  const width = grid[0].length;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const sy = py + y;
      const sx = px + x;
      if (sy >= 0 && sy < SCENE_HEIGHT && sx >= 0 && sx < SCENE_WIDTH) {
        const color = grid[y][x];
        if (color !== 'transparent') {
          sceneFrame[sy][sx] = color;
        }
      }
    }
  }
}

// Draw a filled rectangle
function fillRect(frame, x, y, w, h, color) {
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      const sy = y + dy;
      const sx = x + dx;
      if (sy >= 0 && sy < SCENE_HEIGHT && sx >= 0 && sx < SCENE_WIDTH) {
        frame[sy][sx] = color;
      }
    }
  }
}

// Draw static background elements
function drawBackground(frame) {
  const SKY = '#87ceeb';
  const GRASS = '#228b22';
  const GRASS_DARK = '#1e7b1e';
  const TREE_TRUNK = '#844206';
  const TREE_DARK = '#5c4033';
  const LEAVES = '#32cd32';
  const LEAVES_DARK = '#228b22';
  const SWING_FRAME = '#474747';
  const SWING_FRAME_DARK = '#222222';

  // Sky (top 90 rows)
  fillRect(frame, 0, 0, SCENE_WIDTH, 90, SKY);

  // Grass (bottom 30 rows)
  fillRect(frame, 0, 90, SCENE_WIDTH, 30, GRASS);
  // Grass texture
  for (let x = 0; x < SCENE_WIDTH; x += 8) {
    fillRect(frame, x, 92, 3, 2, GRASS_DARK);
  }

  // === TREE (left side) ===
  // Trunk
  fillRect(frame, 25, 50, 10, 50, TREE_TRUNK);
  fillRect(frame, 27, 50, 3, 50, TREE_DARK);

  // Main foliage (large circle-ish shape)
  fillRect(frame, 5, 15, 50, 40, LEAVES);
  fillRect(frame, 10, 10, 40, 10, LEAVES);
  fillRect(frame, 15, 5, 30, 10, LEAVES);
  // Darker patches
  fillRect(frame, 15, 20, 15, 15, LEAVES_DARK);
  fillRect(frame, 35, 30, 12, 12, LEAVES_DARK);

  // Branch extending right (for squirrel)
  fillRect(frame, 35, 48, 40, 5, TREE_TRUNK);
  fillRect(frame, 35, 49, 40, 2, TREE_DARK);

  // === SWING SET (center-left) ===
  // A-frame legs
  fillRect(frame, 100, 30, 3, 70, SWING_FRAME);
  fillRect(frame, 140, 30, 3, 70, SWING_FRAME);
  // Top bar
  fillRect(frame, 100, 28, 43, 4, SWING_FRAME);
  fillRect(frame, 100, 29, 43, 2, SWING_FRAME_DARK);

  // === BUSH (right side, for gardener) ===
  // Drawn as part of gardener block, but add ground context

  // === POND AREA (for frog) ===
  const WATER = '#4169e1';
  const WATER_LIGHT = '#6495ed';
  fillRect(frame, 200, 95, 30, 15, WATER);
  fillRect(frame, 205, 97, 8, 5, WATER_LIGHT);
  fillRect(frame, 218, 100, 6, 4, WATER_LIGHT);
}

// Convert 2D scene frame to flat array
function frameToLayer(frame) {
  const layer = [];
  for (let y = 0; y < SCENE_HEIGHT; y++) {
    for (let x = 0; x < SCENE_WIDTH; x++) {
      layer.push(frame[y][x]);
    }
  }
  return layer;
}

function main() {
  // Load all blocks
  const blocks = {
    swing: loadBlock('child-swing'),
    dog: loadBlock('dog-barking'),
    squirrel: loadBlock('squirrel'),
    gardener: loadBlock('gardener'),
    frog: loadBlock('frog')
  };

  const numFrames = 4;
  const sceneLayers = [];

  // Asset configurations: { scale, x, y }
  const assets = {
    swing: { scale: 20, x: 105, y: 30 },      // Full size, on swing set
    gardener: { scale: 16, x: 250, y: 74 },   // Slightly smaller
    squirrel: { scale: 8, x: 58, y: 40 },     // Small, on branch
    dog: { scale: 10, x: 280, y: 80 },        // Small
    frog: { scale: 6, x: 208, y: 84 }         // Tiny, by pond
  };

  for (let f = 0; f < numFrames; f++) {
    const frame = createEmptyFrame();

    // Draw static background first
    drawBackground(frame);

    // Place each animated asset
    for (const [name, config] of Object.entries(assets)) {
      const blockLayer = blocks[name][f];
      const blockGrid = layerToGrid(blockLayer);
      const scaledGrid = config.scale === 20 ? blockGrid : scaleGrid(blockGrid, config.scale);
      placeGrid(frame, scaledGrid, config.x, config.y);
    }

    sceneLayers.push(frameToLayer(frame));
  }

  const scene = {
    width: SCENE_WIDTH,
    height: SCENE_HEIGHT,
    layers: sceneLayers
  };

  const outputPath = path.join(__dirname, '..', 'static', 'tools', 'blocks', 'park-scene.json');
  fs.writeFileSync(outputPath, JSON.stringify(scene, null, 2));
  console.log(`Scene composed: ${outputPath}`);
  console.log(`Dimensions: ${SCENE_WIDTH}x${SCENE_HEIGHT}, ${numFrames} frames`);
}

main();
