# Scene Generation Plan

Generate a cohesive animated scene using LLM-generated blocks.

## Target Scene

A lively outdoor scene with 5 animated characters:

1. **Child on a swing** - swinging back and forth
2. **Dog barking** - tail wagging, mouth opening/closing
3. **Squirrel in tree** - peeking in and out of a hole
4. **Gardener** - digging or watering plants
5. **Frog hopping** - jumping motion

---

## Phase 1: Simplified Data Format ✅

**Status: Complete** - See `tools/block-converter.js`

### Format Specification

Each block is a **20x20 pixel grid**. Each frame is 20 lines of 20 characters.
Frames are separated by a blank line. Comments start with `#`.

### Color Map

```
TRANSPARENT:
.  transparent

GRAYSCALE (0-8, black to white):
0  #000000  black
1  #222222
2  #474747
3  #696969
4  #808080
5  #a9a9a9
6  #c0c0c0
7  #d3d3d3
8  #ffffff  white

COLORS (lowercase=bright, uppercase=dark):
r  #ff0000  red
R  #dc143c  crimson
o  #ff6600  orange
O  #ffa502  golden orange
y  #feff04  yellow
g  #7cfc00  lime green
G  #32cd32  green
e  #00a500  forest green
c  #e0ffff  light cyan
b  #87ceeb  sky blue
B  #1c00ff  blue
d  #08007f  dark blue
p  #ee83ee  pink/magenta
P  #9400d3  purple
k  #ffc0cb  light pink
K  #ff1493  hot pink

SKIN TONES:
s  #ffe3d2  light skin
S  #fdd7c0  skin
t  #d2b48c  tan
T  #d39b86  darker tan

EARTH TONES:
w  #844206  brown
W  #5c4033  dark brown
```

### Example (bouncing ball, 2 frames)

```
# Frame 1 - ball up
....................
....................
....................
....................
....................
.......0000.........
......0rrr00........
.....0rrrrrr0.......
.....0rrrrrr0.......
......0rrr00........
.......0000.........
....................
....................
....................
....................
....................
....................
....................
....................
....................

# Frame 2 - ball down
....................
....................
....................
....................
....................
....................
....................
....................
....................
....................
.......0000.........
......0rrr00........
.....0rrrrrr0.......
.....0rrrrrr0.......
......0rrr00........
.......0000.........
....................
....................
....................
....................
```

---

## Phase 2: Converter App ✅

**Status: Complete** - `tools/block-converter.js`

### Usage

```bash
# Show help and color map
node tools/block-converter.js --help

# Convert to JSON (stdout)
node tools/block-converter.js input.txt

# Convert to JSON file
node tools/block-converter.js input.txt -o output.json
```

### Output Format

Produces Journeyship-compatible JSON:
```json
{
  "layers": [
    ["transparent", "#ff0000", ...],  // Frame 1: 400 colors
    ["transparent", "#ff0000", ...]   // Frame 2: 400 colors
  ]
}
```

---

## Phase 3: Generate Animated Blocks

Create each block separately with focused prompts for high quality results.

### Block 1: Child on Swing
- [ ] Write detailed prompt
- [ ] Generate with LLM
- [ ] Convert to Journeyship format
- [ ] Test and refine

### Block 2: Dog Barking
- [ ] Write detailed prompt
- [ ] Generate with LLM
- [ ] Convert to Journeyship format
- [ ] Test and refine

### Block 3: Squirrel in Tree
- [ ] Write detailed prompt
- [ ] Generate with LLM
- [ ] Convert to Journeyship format
- [ ] Test and refine

### Block 4: Gardener
- [ ] Write detailed prompt
- [ ] Generate with LLM
- [ ] Convert to Journeyship format
- [ ] Test and refine

### Block 5: Frog Hopping
- [ ] Write detailed prompt
- [ ] Generate with LLM
- [ ] Convert to Journeyship format
- [ ] Test and refine

---

## Phase 4: Compose Scene

Assemble all blocks into a cohesive scene.

### Tasks
- [ ] Create prompt for background elements (grass, sky, tree trunk, etc.)
- [ ] Determine block positions on canvas
- [ ] Generate scene JSON with all blocks placed
- [ ] Import into Journeyship
- [ ] Fine-tune positions and add solid color blocks as needed

---

## File Outputs

| File | Description |
|------|-------------|
| `tools/block-converter.js` | Simplified format → Journeyship JSON |
| `scenes/park-scene.txt` | Full scene in simplified format |
| `scenes/blocks/*.txt` | Individual block definitions |

---

## Next Steps

1. Define the exact simplified format specification
2. Build the converter tool
3. Write prompt template for animated blocks
4. Generate first block (child on swing) as proof of concept
