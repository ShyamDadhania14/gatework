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

<!-- ══════════════════════════════════════════════════════════
     REPLACE every placeholder below before pushing to GitHub
     
     YOUR_USERNAME   → your GitHub username
     YOUR_REPO_NAME  → your repository name  (e.g. gatework)
     YOUR_LIVE_URL   → your deployed site URL (e.g. https://YOUR_USERNAME.github.io/YOUR_REPO_NAME)
══════════════════════════════════════════════════════════ -->

[![Live Demo](https://img.shields.io/badge/🌐%20Live%20Demo-Visit%20Site-39ff8f?style=for-the-badge&labelColor=0b0f0d)](https://YOUR_USERNAME.github.io/YOUR_REPO_NAME)
[![GitHub Repo](https://img.shields.io/badge/GitHub-YOUR__USERNAME%2FYOUR__REPO__NAME-ffffff?style=for-the-badge&logo=github&logoColor=white&labelColor=161d19)](https://github.com/YOUR_USERNAME/YOUR_REPO_NAME)
[![Made With](https://img.shields.io/badge/Made%20With-HTML%20%7C%20CSS%20%7C%20JS-ffb347?style=for-the-badge&logoColor=black)](https://github.com/YOUR_USERNAME/YOUR_REPO_NAME)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-ZERO-ff5d5d?style=for-the-badge)](https://github.com/YOUR_USERNAME/YOUR_REPO_NAME)
[![GitHub Pages](https://img.shields.io/badge/Deployed%20on-GitHub%20Pages-5db8ff?style=for-the-badge&logo=githubpages&logoColor=white)](https://YOUR_USERNAME.github.io/YOUR_REPO_NAME)
[![License MIT](https://img.shields.io/badge/License-MIT-b47aff?style=for-the-badge)](https://github.com/YOUR_USERNAME/YOUR_REPO_NAME/blob/main/LICENSE)

<br>

> *"bro actually sat down and built a fully working logic circuit simulator with a number system calculator, sop/pos builder, truth tables, AND a vibe — no cap"*

<br>

🌐 **[Live Site → GateWork](https://gatework.onrender.com/)**

<br>

<!-- Add a demo GIF here after recording one — strongly recommended -->
<!-- ![Gatework Demo](./assets/demo.gif) -->

[🚀 **Live Demo**](https://gatework.onrender.com/) · [✨ **Features**](#-what-this-thing-does) · [📦 **Deploy It**](#-deploying-to-github-pages) · [🔌 **Gates**](#-supported-gates) · [🧮 **Calculator**](#-number-system-calculator)

</div>

---

## 🫦 what even IS this

**Gatework** is a browser-based digital logic circuit simulator built with zero frameworks, zero dependencies, and zero excuses. Drop gates, wire them up, simulate signals, get truth tables, boolean expressions, SOP/POS canonical forms — AND convert between number systems — all in one dark-mode, neon-green, monospace-font tool that looks like it came out of a hacker's second monitor.

No install. No npm. No webpack config that breaks at 2am. Just open `index.html` and go — or hit the [live link](https://ShyamDadhania14.github.io/gatework) and use it instantly in your browser.

---

## 📁 Project Structure

```
gatework/
│
├── 📄 index.html       ← full UI, layout, modals, palette
├── 🎨 style.css        ← dark theme, neon accents, all component styles  
├── ⚙️  script.js       ← circuit engine + SOP/POS + parser + calculator
└── 📖 README.md        ← you are here
```

Three files. No `package.json`. No `/node_modules` eating your SSD. No build step. GitHub Pages serves them as-is.

---

## ✨ What This Thing Does

<table>
<tr>
<td width="50%">

### 🔌 Circuit Simulator
- Drag-and-drop gate placement
- Click output pin → input pin to wire
- Click any wire to delete it
- Live signal propagation (🟢 = HIGH, ⚫ = LOW)
- Gates show their **live boolean expression** right on the node
- Double-click any INPUT to rename it (A, B, Clk, Data — anything)
- Resize multi-input gates from 2 up to 8 inputs

</td>
<td width="50%">

### 🧠 Logic Analysis
- **Truth Table** — auto-generates for up to 8 inputs
- **Boolean Expression** — full symbolic expression per output
- **Identify Gate** — detects what standard gate your wired circuit equals (OR + NOT = NOR ✓)
- **Circuit SOP/POS** — canonical Sum-of-Products and Product-of-Sums from the live truth table

</td>
</tr>
<tr>
<td>

### 🏗️ Auto Circuit Builder
- **Expression → Circuit**: type `A AND B OR NOT C` → circuit builds itself
- **SOP Builder**: choose variables + click minterms → gate tree appears
- **POS Builder**: choose maxterms → builds automatically
- Supports `+`, `·`, `AND`, `OR`, `NOT`, `XOR`, `NAND`, `NOR`, `XNOR`, `()`

</td>
<td>

### 💾 Save & Share
- **Named saves** — persist circuits across sessions (browser storage)
- **Export JSON** — download your circuit as a `.json` file
- **Import JSON** — reload any previously exported circuit
- Push your `.json` files to GitHub to version-control circuits

</td>
</tr>
</table>

---

## 🔌 Supported Gates

<div align="center">

| Gate | Symbol | Inputs | Logic |
|------|--------|--------|-------|
| **AND** | ∧ | 2–8 | ALL inputs HIGH |
| **OR** | ∨ | 2–8 | ANY input HIGH |
| **NOT** | ¬ | 1 | Inverts input |
| **NAND** | ⊼ | 2–8 | NOT AND — universal gate |
| **NOR** | ⊽ | 2–8 | NOT OR — universal gate |
| **XOR** | ⊕ | 2–8 | Odd count HIGH (parity) |
| **XNOR** | ⊙ | 2–8 | Even count HIGH (equality) |
| **BUFFER** | — | 1 | Pass-through / signal driver |
| **MUX 2:1** | — | D0 D1 S0 | 1 select line |
| **MUX 4:1** | — | D0–D3 S0–S1 | 2 select lines |
| **MUX 8:1** | — | D0–D7 S0–S2 | 3 select lines |
| **DEMUX 1:2** | — | D S0 → Y0 Y1 | 1 select line |
| **DEMUX 1:4** | — | D S0 S1 → Y0–Y3 | 2 select lines |
| **DEMUX 1:8** | — | D S0–S2 → Y0–Y7 | 3 select lines |

</div>

> 🔵 MUX select pins glow **blue** &nbsp;|&nbsp; 🟣 DEMUX select pins glow **purple** — so you never mix them up.

---

## 🧮 Number System Calculator

Click **🔢 Calculator** in the header — a draggable, minimizable floating window with three tabs:

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

Type in **any** field → all others update live. Click individual bits to toggle. Copy button on every field.

### ± Tab 2 — Arithmetic

Operates in DEC / BIN / OCT / HEX. Results shown in all four bases at once.

```
Operations:  +   −   ×   ÷   MOD   AND   OR   XOR   NOT   SHL   SHR   A^B
Powered by:  JavaScript BigInt — no floating-point errors on large numbers
```

### ◈ Tab 3 — Special Codes

| Tool | What it does |
|------|-------------|
| **Gray Code ↔ Binary** | Convert either direction, any length |
| **BCD Encoder / Decoder** | Decimal ↔ 4-bit nibble groups |
| **ASCII Lookup** | Char or code → DEC / HEX / OCT / BIN + neighbour grid |
| **Excess-N / Biased** | Encode signed integers with any bias N |
| **Hamming Weight & Distance** | Weight of A, weight of B, XOR pattern |
| **IEEE 754 Float** | 32-bit colour-coded breakdown — sign, exponent, mantissa + NaN / ±∞ detection |

---

## 📐 Circuit Building Examples

```
Classic NOR from primitives:
  INPUT A ──┐
            OR ──── NOT ──── OUTPUT    →  Identify: "NOR" ✓
  INPUT B ──┘

Half Adder:
  INPUT A ──┬──── XOR ──── SUM
  INPUT B ──┼──── AND ──── CARRY

3-variable Majority Gate (via SOP Builder):
  Select minterms 3, 5, 6, 7  →  Build Circuit  →  Identify: "Majority (≥2 of 3)" ✓
```

---

## ⌨️ Keyboard & UI Quick Reference

| Action | How |
|--------|-----|
| Place a gate | Click it in the left palette |
| Move a gate | Drag it on the canvas |
| Start a wire | Click output pin (right ●) |
| Complete wire | Click input pin (left ●) |
| Cancel wire | Click empty canvas |
| Delete wire | Click the wire itself |
| Delete gate | Hover gate → click × |
| Rename input | Double-click the INPUT node |
| Change gate input count | Select gate → −/+ in sidebar |
| Build from expression | Type in sidebar → Enter |
| Toggle input HIGH/LOW | Click the toggle switch |
| Open calculator | 🔢 button in header |
| Move calculator | Drag its header bar |
| Minimize calculator | Click — button |

---

## 📦 Circuit Export Format

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

Human-readable. Version-control it. Share it in a DM. Commit your favourite circuits to the repo.

---

## 🎨 Design System

```
Background    #0b0f0d   ← almost-black, hint of green
Signal HIGH   #39ff8f   ← neon green
Expressions   #ffb347   ← amber
Error / Del   #ff5d5d   ← soft red  
MUX pins      #5db8ff   ← electric blue
DEMUX pins    #b47aff   ← purple
Font          Space Mono (fallback: Courier New)
```

Built for dark mode. Looks wrong in light mode. That's a feature, not a bug.

---

## 🛠️ Built With

```
HTML5        semantic layout, modal, palette
CSS3         custom properties, grid, flex, transitions
JavaScript   ES2020+, BigInt, File API, Clipboard API
Storage      window.localStorage  (circuit saves)
Hosting      onrender.com  (free, zero config)
```

---

## 🔭 What Could Come Next

- [ ] D flip-flop, SR latch, JK, T — sequential logic
- [ ] Clock signal with configurable frequency
- [ ] Karnaugh map (K-map) minimization
- [ ] Undo / Redo (Ctrl+Z)
- [ ] Export circuit as PNG / SVG
- [ ] Multi-bit buses (4-bit adder, ALU)
- [ ] More calculator tools: CRC, checksum, float arithmetic

---

## 📄 License

Distributed under the **MIT License** — see [`LICENSE`](https://github.com/ShyamDadhania14/gatework/blob/main/LICENSE) for details.
Free to use, modify, fork, and ship. Just don't remove the license header.

---

<div align="center">

---

```
 ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
 ░  made with too much caffeine and curiosity   ░
 ░  open source · no tracking · no ads · free  ░
 ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
```

**if this helped, drop a ⭐ — costs nothing, means everything**

[![Star this Repo](https://img.shields.io/badge/⭐%20Star%20this%20Repo-ffb347?style=for-the-badge&labelColor=0b0f0d)](https://github.com/YOUR_USERNAME/YOUR_REPO_NAME)
[![Live Demo](https://img.shields.io/badge/🌐%20Try%20the%20Live%20Demo-39ff8f?style=for-the-badge&labelColor=0b0f0d)](https://YOUR_USERNAME.github.io/YOUR_REPO_NAME)

*built different. wired different.* ⚡

</div>
