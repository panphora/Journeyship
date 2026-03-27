# Animated Block Generation Prompt

Use this template when prompting an LLM to generate animated pixel art blocks.

---

## System Prompt

```
You are a pixel artist creating animated sprites for a simple animation tool.

OUTPUT FORMAT:
- Each frame is a 20x20 grid of characters (20 lines, 20 chars each)
- Frames are separated by a blank line
- Use ONLY these characters for colors:

TRANSPARENT:
.  transparent (use for empty space)

GRAYSCALE:
0  black
1  very dark gray
2  dark gray
3  medium dark gray
4  medium gray
5  medium light gray
6  light gray
7  very light gray
8  white

COLORS:
r  red           R  dark red/crimson
o  orange        O  golden orange
y  yellow
g  lime green    G  green         e  forest/dark green
c  light cyan    b  sky blue      B  blue          d  dark blue
p  pink/magenta  P  purple
k  light pink    K  hot pink

SKIN TONES:
s  light skin    S  medium skin   t  tan           T  dark tan

EARTH TONES:
w  brown         W  dark brown

RULES:
1. Output EXACTLY 20 characters per line, EXACTLY 20 lines per frame
2. Use . for all transparent/empty pixels
3. Create smooth animation with 2-6 frames
4. Use outlines (usually 0 or 1) to define shapes
5. Keep the subject centered unless movement requires offset
6. Think about which pixels change between frames for the animation effect
```

---

## User Prompt Template

```
Create an animated [SUBJECT] sprite.

Description: [DETAILED DESCRIPTION OF WHAT IT LOOKS LIKE AND HOW IT ANIMATES]

Style notes:
- [COLOR PALETTE HINTS]
- [SIZE/PROPORTION HINTS]
- [ANIMATION STYLE HINTS]

Output [N] frames showing the animation cycle.
```

---

## Example: Bouncing Ball

**Prompt:**
```
Create an animated bouncing ball sprite.

Description: A red ball that bounces up and down. The ball should squash slightly when at the bottom of the bounce.

Style notes:
- Use red (r) for the main ball color
- Use black (0) for the outline
- Ball should be about 6-8 pixels in diameter
- Keep centered horizontally

Output 4 frames showing the bounce cycle.
```

**Expected Output:**
```
# Frame 1 - Ball at top
....................
....................
....................
....................
.......0000.........
......0rrrr0........
.....0rrrrrr0.......
.....0rrrrrr0.......
.....0rrrrrr0.......
......0rrrr0........
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

# Frame 2 - Ball descending
....................
....................
....................
....................
....................
....................
....................
.......0000.........
......0rrrr0........
.....0rrrrrr0.......
.....0rrrrrr0.......
.....0rrrrrr0.......
......0rrrr0........
.......0000.........
....................
....................
....................
....................
....................
....................

# Frame 3 - Ball at bottom (squashed)
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
....................
....................
......000000........
.....0rrrrrr0.......
.....0rrrrrr0.......
.....0rrrrrr0.......
......000000........
....................
....................
....................

# Frame 4 - Ball ascending
....................
....................
....................
....................
....................
....................
....................
.......0000.........
......0rrrr0........
.....0rrrrrr0.......
.....0rrrrrr0.......
.....0rrrrrr0.......
......0rrrr0........
.......0000.........
....................
....................
....................
....................
....................
....................
```

---

## Tips for Good Results

1. **Be specific about colors** - mention which color codes to use
2. **Describe the animation** - what moves, how it moves
3. **Give size guidance** - how big should the subject be within the 20x20 grid
4. **Request specific frame count** - more frames = smoother but more work
5. **Mention style** - cartoony, realistic, minimalist, etc.

---

## Scene-Specific Prompts

### Child on Swing
```
Create an animated child on a swing sprite.

Description: A small child sitting on a swing, swinging back and forth. Show the swing ropes and the child's body moving in an arc.

Style notes:
- Child: skin tone (s/S), hair in brown (w), simple clothing in blue (b)
- Swing ropes: dark gray (2) or brown (w)
- Child should be small, about 8-10 pixels tall
- Swing motion should be gentle, not extreme angles

Output 4 frames showing a complete swing cycle (back, middle, forward, middle).
```

### Dog Barking
```
Create an animated barking dog sprite.

Description: A cute dog sitting and barking. The mouth opens and closes, and the tail wags.

Style notes:
- Use brown (w) and tan (t) for the dog's fur
- Black (0) for nose and outline
- White (8) for eye highlights
- Dog should be about 10-12 pixels tall, sitting position

Output 4 frames: mouth closed + tail left, mouth open + tail middle, mouth closed + tail right, mouth open + tail middle.
```

### Squirrel in Tree
```
Create an animated squirrel peeking from a tree hole sprite.

Description: A squirrel peeking in and out of a hole in a tree trunk. Just the head and maybe paws visible.

Style notes:
- Tree trunk: brown (w) and dark brown (W)
- Squirrel: orange-brown (o) with tan (t) chest, black (0) eye
- Tree hole: very dark (1 or 0)
- Include some tree bark texture

Output 3 frames: hidden (just tree), peeking (head visible), fully out (head + paws).
```

### Gardener
```
Create an animated gardener sprite.

Description: A person with a gardening hat, bending down to tend plants. Simple digging or planting motion.

Style notes:
- Skin tone (S), green shirt (G), blue pants (b)
- Tan/straw hat (t)
- Small plant in green (g)
- Person about 12-14 pixels tall

Output 4 frames showing a simple digging/planting cycle.
```

### Frog Hopping
```
Create an animated hopping frog sprite.

Description: A small green frog that hops. Show the crouch, jump, and landing.

Style notes:
- Bright green (g) body with darker green (G) spots
- White (8) or light (c) belly
- Black (0) for eyes and outline
- Frog about 6-8 pixels when sitting

Output 4 frames: sitting, crouch, mid-jump (stretched), landing.
```
