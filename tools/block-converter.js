#!/usr/bin/env node

/**
 * Block Converter
 *
 * Converts simplified text format to Journeyship AnimatedBlock JSON.
 *
 * SIMPLIFIED FORMAT SPECIFICATION
 * ===============================
 *
 * Each block is 20x20 pixels. Each frame is 20 lines of 20 characters.
 * Frames are separated by a blank line.
 *
 * COLOR MAP (single character = hex color):
 *
 *   .  transparent
 *
 *   GRAYSCALE (0-9, darker to lighter):
 *   0  #000000  black
 *   1  #222222
 *   2  #474747
 *   3  #696969
 *   4  #808080
 *   5  #a9a9a9
 *   6  #c0c0c0
 *   7  #d3d3d3
 *   8  #ffffff  white
 *
 *   COLORS (lowercase = bright, uppercase = dark/alt):
 *   r  #ff0000  red
 *   R  #dc143c  crimson
 *   o  #ff6600  orange
 *   O  #ffa502  golden orange
 *   y  #feff04  yellow
 *   g  #7cfc00  lime green
 *   G  #32cd32  green
 *   e  #00a500  forest green
 *   c  #e0ffff  light cyan
 *   b  #87ceeb  sky blue
 *   B  #1c00ff  blue
 *   d  #08007f  dark blue
 *   p  #ee83ee  pink/magenta
 *   P  #9400d3  purple
 *   k  #ffc0cb  light pink
 *   K  #ff1493  hot pink
 *
 *   SKIN TONES:
 *   s  #ffe3d2  light skin
 *   S  #fdd7c0  skin
 *   t  #d2b48c  tan
 *   T  #d39b86  darker tan
 *
 *   EARTH TONES:
 *   w  #844206  brown
 *   W  #5c4033  dark brown
 *
 * EXAMPLE (2-frame animation of a blinking dot):
 *
 *   ....................
 *   ....................
 *   ....................
 *   ....................
 *   ....................
 *   ....................
 *   ....................
 *   ....................
 *   .........00.........
 *   ........0880........
 *   ........0880........
 *   .........00.........
 *   ....................
 *   ....................
 *   ....................
 *   ....................
 *   ....................
 *   ....................
 *   ....................
 *   ....................
 *
 *   ....................
 *   ....................
 *   ....................
 *   ....................
 *   ....................
 *   ....................
 *   ....................
 *   ....................
 *   ....................
 *   .........00.........
 *   .........00.........
 *   ....................
 *   ....................
 *   ....................
 *   ....................
 *   ....................
 *   ....................
 *   ....................
 *   ....................
 *   ....................
 */

const fs = require('fs');

const COLOR_MAP = {
  '.': 'transparent',

  // Grayscale
  '0': '#000000',
  '1': '#222222',
  '2': '#474747',
  '3': '#696969',
  '4': '#808080',
  '5': '#a9a9a9',
  '6': '#c0c0c0',
  '7': '#d3d3d3',
  '8': '#ffffff',

  // Colors
  'r': '#ff0000',
  'R': '#dc143c',
  'o': '#ff6600',
  'O': '#ffa502',
  'y': '#feff04',
  'Y': '#ffff00',
  'g': '#7cfc00',
  'G': '#32cd32',
  'e': '#00a500',
  'c': '#e0ffff',
  'b': '#87ceeb',
  'B': '#1c00ff',
  'd': '#08007f',
  'p': '#ee83ee',
  'P': '#9400d3',
  'k': '#ffc0cb',
  'K': '#ff1493',

  // Skin tones
  's': '#ffe3d2',
  'S': '#fdd7c0',
  't': '#d2b48c',
  'T': '#d39b86',

  // Earth tones
  'w': '#844206',
  'W': '#5c4033',
};

function parseSimplifiedFormat(text) {
  const lines = text.split('\n');
  const frames = [];
  let currentFrame = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines (frame separator)
    if (trimmed === '') {
      if (currentFrame.length === 20) {
        frames.push(currentFrame);
        currentFrame = [];
      }
      continue;
    }

    // Skip comments
    if (trimmed.startsWith('#') || trimmed.startsWith('//')) {
      continue;
    }

    // Must be exactly 20 chars
    if (trimmed.length !== 20) {
      console.error(`Warning: Line "${trimmed}" is ${trimmed.length} chars, expected 20. Padding/truncating.`);
    }

    const row = trimmed.padEnd(20, '.').slice(0, 20);
    currentFrame.push(row);
  }

  // Don't forget the last frame
  if (currentFrame.length === 20) {
    frames.push(currentFrame);
  } else if (currentFrame.length > 0) {
    console.error(`Warning: Last frame has ${currentFrame.length} rows, expected 20. Padding.`);
    while (currentFrame.length < 20) {
      currentFrame.push('.....................');
    }
    frames.push(currentFrame);
  }

  return frames;
}

function frameToLayer(frame) {
  const layer = [];

  for (const row of frame) {
    for (const char of row) {
      const color = COLOR_MAP[char];
      if (!color) {
        console.error(`Warning: Unknown color char '${char}', using transparent`);
        layer.push('transparent');
      } else {
        layer.push(color);
      }
    }
  }

  return layer;
}

function convertToJourneyship(frames) {
  return {
    layers: frames.map(frameToLayer)
  };
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Block Converter - Convert simplified format to Journeyship JSON');
    console.log('');
    console.log('Usage:');
    console.log('  node block-converter.js <input.txt>              Output JSON to stdout');
    console.log('  node block-converter.js <input.txt> -o <out.json> Output to file');
    console.log('  node block-converter.js --help                    Show format spec');
    console.log('');
    console.log('Format: 20x20 grid per frame, frames separated by blank lines.');
    console.log('Colors: . (transparent), 0-8 (grayscale), r/o/y/g/b/p (colors)');
    process.exit(0);
  }

  if (args[0] === '--help') {
    console.log('COLOR MAP:');
    console.log('');
    for (const [char, hex] of Object.entries(COLOR_MAP)) {
      console.log(`  ${char}  ${hex}`);
    }
    process.exit(0);
  }

  const inputFile = args[0];
  const outputFile = args.includes('-o') ? args[args.indexOf('-o') + 1] : null;

  if (!fs.existsSync(inputFile)) {
    console.error(`Error: File not found: ${inputFile}`);
    process.exit(1);
  }

  const text = fs.readFileSync(inputFile, 'utf-8');
  const frames = parseSimplifiedFormat(text);

  if (frames.length === 0) {
    console.error('Error: No valid frames found');
    process.exit(1);
  }

  console.error(`Parsed ${frames.length} frame(s)`);

  const result = convertToJourneyship(frames);
  const json = JSON.stringify(result, null, 2);

  if (outputFile) {
    fs.writeFileSync(outputFile, json);
    console.error(`Written to ${outputFile}`);
  } else {
    console.log(json);
  }
}

main();
