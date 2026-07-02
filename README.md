<div align="center">

```
 ██████╗  █████╗ ████████╗███████╗██╗    ██╗ ██████╗ ██████╗ ██╗  ██╗
██╔════╝ ██╔══██╗╚══██╔══╝██╔════╝██║    ██║██╔═══██╗██╔══██╗██║ ██╔╝
██║  ███╗███████║   ██║   █████╗  ██║ █╗ ██║██║   ██║██████╔╝█████╔╝ 
██║   ██║██╔══██║   ██║   ██╔══╝  ██║███╗██║██║   ██║██╔══██╗██╔═██╗ 
╚██████╔╝██║  ██║   ██║   ███████╗╚███╔███╔╝╚██████╔╝██║  ██║██║  ██╗
 ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚══════╝ ╚══╝╚══╝  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝
```

### **the logic circuit simulator that actually goes hard** 🔌⚡

[![Made With](https://img.shields.io/badge/Made%20With-HTML%20%7C%20CSS%20%7C%20JS-39ff8f?style=for-the-badge&logo=javascript&logoColor=black)](.)
[![No Framework](https://img.shields.io/badge/Framework-None%20(Pure%20Vanilla)-ff5d5d?style=for-the-badge)](.)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-ZERO-ffb347?style=for-the-badge)](.)
[![Vibe Check](https://img.shields.io/badge/Vibe%20Check-Passed%20✓-39ff8f?style=for-the-badge)](.)
[![License](https://img.shields.io/badge/License-MIT-5db8ff?style=for-the-badge)](.)

<br>

> *"bro actually sat down and built a fully working logic circuit simulator with a number system calculator, sop/pos builder, truth tables, AND a vibe — no cap"*

<br>

[🚀 **Open it**](#-https://gatework.onrender.com/) · [✨ **Features**](#-what-this-thing-does) · [🧮 **Calculator**](#-number-system-calculator) · [🔌 **Gates**](#-supported-gates) · [📐 **Circuits**](#-circuit-building)

</div>

---

## 🫦 what even IS this

**Gatework** is a browser-based digital logic circuit simulator built with zero frameworks, zero dependencies, and zero excuses. Drop gates, wire them up, simulate signals, get truth tables, boolean expressions, SOP/POS canonical forms, AND convert between number systems — all in one dark-mode, neon-green, monospace-font tool that looks like it came out of a hacker's second monitor.

No install. No npm. No webpack config that breaks at 2am. Just open `index.html` and go.

```
open index.html   # that's it. you're done. ship it.
```

---

## ✨ what this thing does

<table>
<tr>
<td width="50%">

### 🔌 Circuit Simulator
- Drag-and-drop gate placement
- Click-to-wire output → input pins
- Click a wire to delete it
- Live signal propagation (green = HIGH, dark = LOW)
- Gates show their **live boolean expression** right on them
- Double-click any INPUT to rename it (A, B, Clk, whatever)
- Resize multi-input gates (AND/OR etc.) from 2 up to 8 inputs
- Select a gate → properties panel shows pin count controls

</td>
<td width="50%">

### 🧠 Logic Analysis
- **Truth Table** — auto-generates for up to 8 inputs
- **Boolean Expression** — full symbolic expression per output
- **Identify Gate** — tells you what standard gate your circuit is *equivalent to* (OR + NOT = NOR, etc.)
- **Circuit SOP/POS** — computes canonical Sum-of-Products and Product-of-Sums from the live circuit
- Supports up to 8 input nodes simultaneously

</td>
</tr>
<tr>
<td>

### 🏗️ Circuit Builder
- **Expression → Circuit**: type `A AND B OR NOT C` and watch it build
- **SOP Builder**: pick variables, select minterms → circuit appears
- **POS Builder**: pick maxterms → builds the gate tree automatically
- Supports `+`, `·`, `AND`, `OR`, `NOT`, `XOR`, `NAND`, `NOR`, `XNOR`, `()`
- Handles nested expressions with full precedence

</td>
<td>

### 💾 Save & Share
- **Named saves** — persist circuits across sessions (browser storage)
- **Export JSON** — download your circuit as a `.json` file
- **Import JSON** — reload any previously exported circuit
- Load / Delete saved circuits from the sidebar panel

</td>
</tr>
</table>

---

## 🔌 Supported Gates

<div align="center">

| Gate | Symbol | Inputs | Logic | Notes |
|------|--------|--------|-------|-------|
| **AND** | ∧ | 2–8 | ALL inputs HIGH | Variable input count |
| **OR** | ∨ | 2–8 | ANY input HIGH | Variable input count |
| **NOT** | ¬ | 1 | Inverts input | — |
| **NAND** | ⊼ | 2–8 | NOT AND | Universal gate |
| **NOR** | ⊽ | 2–8 | NOT OR | Universal gate |
| **XOR** | ⊕ | 2–8 | Odd number HIGH | Parity checker |
| **XNOR** | ⊙ | 2–8 | Even number HIGH | Equality checker |
| **BUFFER** | — | 1 | Pass-through | Signal driver |
| **MUX 2:1** | — | 3 (D0, D1, S0) | 1 select line | |
| **MUX 4:1** | — | 6 (D0-3, S0-1) | 2 select lines | |
| **MUX 8:1** | — | 11 (D0-7, S0-2) | 3 select lines | |
| **DEMUX 1:2** | — | 2 out: Y0,Y1 | 1 select line | |
| **DEMUX 1:4** | — | 3 out: Y0-Y3 | 2 select lines | |
| **DEMUX 1:8** | — | 4 out: Y0-Y7 | 3 select lines | |

</div>

> MUX select pins glow **blue** 🔵, DEMUX select pins glow **purple** 🟣 — so you never mix them up.

---

## 📐 Circuit Building

### 🔤 From an Expression

Type any boolean expression into the sidebar:

```
A AND B OR NOT C
(A + B) · ¬C
A XOR B XNOR C
NOT (A NAND B) OR C
```

Hit **Build Circuit** and the gates auto-layout themselves with wires already connected.

---

### 📊 From SOP / POS Terms

```
Step 1 → Choose number of variables (2, 3, or 4)
Step 2 → Give them names: A, B, CLK, DATA, whatever
Step 3 → Click minterms (SOP) or maxterms (POS) in the grid
Step 4 → Hit "Build Circuit"

Result: Full canonical gate network, wired and ready to simulate
```

**SOP** produces AND trees feeding an OR gate.
**POS** produces OR trees feeding an AND gate.
Both auto-insert NOT gates for complemented literals.

---

### 🎯 Gate Identification

Wire up any combination of gates and hit **⚡ Identify** — Gatework compares your circuit's truth table against every known gate pattern:

```
OR + NOT  →  "Behaves like: NOR"
AND + NOT →  "Behaves like: NAND"
XOR + NOT →  "Behaves like: XNOR"
3-input majority gate recognized ✓
Hamming parity patterns recognized ✓
```

---

## 🧮 Number System Calculator

Click **🔢 Calculator** in the header for a draggable floating calculator with three full tabs:

---

### ⇄ Tab 1 — Base Converter

```
┌──────────────────────────────────────────────────────┐
│  Bit Width: [ 4 ] [ 8★] [16 ] [32 ] [64 ]  ☐ Signed │
├──────────────────────────────────────────────────────┤
│  DEC  │  255                               [⎘]       │
│  BIN  │  11111111                          [⎘]       │
│  OCT  │  377                               [⎘]       │
│  HEX  │  FF                                [⎘]       │
├──────────────────────────────────────────────────────┤
│  [1][1][1][1] [1][1][1][1]  ← clickable bits         │
│   7  6  5  4    3  2  1  0  ← bit positions          │
├──────────────────────────────────────────────────────┤
│  1's Comp │ 2's Comp │ Gray Code │ MSB │ LSB         │
│  Set Bits │ Signed   │ Magnitude │     │             │
└──────────────────────────────────────────────────────┘
```

- Type in **any** field → all others update instantly
- **Click individual bits** to toggle them
- Bit width clamps/wraps the value automatically
- Signed mode shows two's-complement interpretation

---

### ± Tab 2 — Arithmetic

Full arithmetic in **any base** (DEC / BIN / OCT / HEX):

```
Operations supported:
  +   −   ×   ÷   MOD         ← standard math
  AND OR  XOR NOT              ← bitwise
  SHL SHR                      ← bit shifts  
  A^B                          ← exponentiation (BigInt)
```

Results shown in ALL four bases simultaneously. Binary step-by-step breakdown shown for `+`, `−`, `×`. Powered by JavaScript `BigInt` so it handles arbitrarily large numbers without floating-point errors.

---

### ◈ Tab 3 — Special Codes

Six tools packed into one panel:

| Tool | What it does |
|------|-------------|
| **Gray Code ↔ Binary** | Convert either direction, any length |
| **BCD Encoder/Decoder** | Decimal → 4-bit nibble groups and back |
| **ASCII Lookup** | Char or code → DEC/HEX/OCT/BIN + neighbour grid |
| **Excess-N / Biased** | Encode signed integers with any bias N |
| **Hamming Weight & Distance** | Weight of A, weight of B, distance, XOR pattern |
| **IEEE 754 Float** | 32-bit breakdown with colour-coded sign/exp/mantissa bits + special value detection |

---

## 🗂️ Project Structure

```
gatework/
├── 📄 index.html       ← full UI, layout, modals, palette
├── 🎨 style.css        ← dark theme, neon accents, all component styles
└── ⚙️  script.js       ← circuit engine + SOP/POS + parser + calculator
```

Three files. No build step. No bundler. No `node_modules` folder eating your SSD.

---

## 🚀 Getting Started

```bash
# option 1 — just open it
open index.html

# option 2 — serve locally if you want hot reload
npx serve .
# or
python3 -m http.server 8080
```

Works in any modern browser. Chrome, Firefox, Edge, Safari — all good. No internet required after download.

---

## 🎨 Design Language

Built for dark mode. Looks wrong in light mode. That's a feature.

---

## 🧩 How the Circuit Engine Works

```
User places nodes  →  nodes{}  (id, type, x, y, value, numIns)
User draws wires   →  wires[]  (from: {node, pin}, to: {node, pin})

Simulate():
  for each node (topological order via recursion):
    computeValue(nodeId):
      if INPUT  → return toggle state
      if gate   → gather input values from connected wires
                → evaluate gate logic
                → return result
  update all LEDs, wire colours, gate expression labels
```

Signal propagation is recursive with cycle detection (visited set). MUX and DEMUX handle multi-output simulation via `outPin` parameter.

---

## 🤯 Things That Go Hard

- **Live expressions on every gate** — AND gate connected to A, B, C shows `A·B·C` right on the node body as you wire it
- **BigInt arithmetic** — the calculator uses JavaScript `BigInt` so `2^64` doesn't turn into `1.8446744e+19`
- **One-click circuit from SOP** — select minterms 1, 3, 5, 7 → full circuit with AND/OR/NOT tree appears instantly
- **Identify any combination** — the engine brute-forces the truth table and matches against 30+ known patterns including majority gates and inhibition functions
- **IEEE 754 color coding** — each bit group (sign/exponent/mantissa) has its own color with real exponent, bias breakdown, and NaN/Infinity detection

---

## 💡 Example Circuits to Try

```
Classic NOR from primitives:
  INPUT A ──┐
            OR ──── NOT ──── OUTPUT     → identifies as NOR ✓
  INPUT B ──┘

Half Adder:
  INPUT A ──┬──── XOR ────────────── SUM
            │
  INPUT B ──┼──── AND ────────────── CARRY
            │
  (wire A and B to both gates)

3-variable Majority Gate via SOP:
  Minterms: 3, 5, 6, 7  (where ≥2 inputs are HIGH)
  → SOP Builder → Build Circuit → simulate → Identify → "Majority (≥2 of 3)" ✓
```

---

## 🛠️ Keyboard & UI Shortcuts

| Action | How |
|--------|-----|
| Start a wire | Click output pin (right ●) |
| Complete wire | Click input pin (left ●) |
| Cancel wire | Click empty canvas |
| Delete wire | Click the wire itself |
| Delete gate | Hover gate → click × button |
| Rename input | Double-click the INPUT node |
| Resize gate inputs | Select gate → −/+ buttons in sidebar |
| Build from expression | Type in sidebar → Enter |
| Toggle input value | Click the toggle switch on INPUT node |
| Move calculator | Drag its header bar |
| Minimize calculator | Click — button |

---

## 📦 Export Format

Circuits export as clean JSON:

```json
{
  "nodes": [
    { "id": "n1", "type": "INPUT",  "x": 70,  "y": 80,  "name": "A", "value": false },
    { "id": "n2", "type": "OR",     "x": 270, "y": 140, "numIns": 2  },
    { "id": "n3", "type": "OUTPUT", "x": 460, "y": 140, "name": "OUT" }
  ],
  "wires": [
    { "from": { "node": "n1", "pin": 0 }, "to": { "node": "n2", "pin": 0 } }
  ],
  "nextId": 4
}
```

Portable, readable, versionable. Commit it to git. Share it in a DM. Whatever.

---

## 🧑‍💻 Built With

```
HTML5           canvas layout, semantic structure
CSS3            custom properties, grid, flex, transitions
JavaScript      ES2020+, BigInt, structuredClone, modules
Web APIs        localStorage (circuit saves), Clipboard API, File API
Fonts           Space Mono (Google Fonts fallback: Courier New)
```

No React. No Vue. No Tailwind. No `package.json`. Just vibes and vanilla.

---

<div align="center">

---

```
 ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
 ░  made with too much caffeine and curiosity   ░
 ░  open source · no tracking · no ads · free  ░
 ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
```

**if this slapped, drop a ⭐ — it costs nothing and means everything**

[![Star on GitHub](https://img.shields.io/badge/⭐%20Star%20this%20Repo-ffb347?style=for-the-badge)](.)
[![Share It](https://img.shields.io/badge/📤%20Share%20with%20your%20CS%20friends-39ff8f?style=for-the-badge&labelColor=0b0f0d)](.)

*built different. wired different.* ⚡

</div>
