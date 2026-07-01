/* ═══════════════════════════════════════════════════════════════
   GATEWORK  –  Logic Circuit Simulator
   script.js
═══════════════════════════════════════════════════════════════ */
'use strict';

// ─── GATE DEFINITIONS ──────────────────────────────────────────
const GATE_DEFS = {
  INPUT:  { numIns: 0, numOuts: 1, label: 'IN',    variable: false },
  OUTPUT: { numIns: 1, numOuts: 0, label: 'OUT',   variable: false },
  AND:    { numIns: 2, numOuts: 1, label: 'AND',   variable: true  },
  OR:     { numIns: 2, numOuts: 1, label: 'OR',    variable: true  },
  NOT:    { numIns: 1, numOuts: 1, label: 'NOT',   variable: false },
  NAND:   { numIns: 2, numOuts: 1, label: 'NAND',  variable: true  },
  NOR:    { numIns: 2, numOuts: 1, label: 'NOR',   variable: true  },
  XOR:    { numIns: 2, numOuts: 1, label: 'XOR',   variable: true  },
  XNOR:   { numIns: 2, numOuts: 1, label: 'XNOR',  variable: true  },
  BUFFER: { numIns: 1, numOuts: 1, label: 'BUF',   variable: false },
  MUX:    { numIns: 3, numOuts: 1, label: 'MUX',   variable: false,
             pinLabels: ['D0','D1','S'] },
  DEMUX:  { numIns: 2, numOuts: 2, label: 'DEMUX', variable: false,
             pinLabels: ['D','S'], outLabels: ['Y0','Y1'] },
};

// ─── STATE ─────────────────────────────────────────────────────
let nodes      = {};    // id  → node object
let wires      = [];    // array of wire objects
let nextId     = 1;
let wireDraft  = null;  // { fromNode, fromPin }
let dragNode   = null;
let dragOffset = { x: 0, y: 0 };
let selectedId = null;

const canvas     = document.getElementById('canvas');
const svgEl      = document.getElementById('wires');
const statusText = document.getElementById('statusText');
const canvasWrap = document.getElementById('canvasWrap');

// ─── HELPERS ───────────────────────────────────────────────────
const uid        = p  => p + (nextId++);
const getNumIns  = n  => n.numIns  != null ? n.numIns  : GATE_DEFS[n.type].numIns;
const getNumOuts = n  => GATE_DEFS[n.type].numOuts;
const getDef     = n  => GATE_DEFS[n.type];
const getWireIn  = (nodeId, pin) => wires.find(w => w.to.node === nodeId && w.to.pin === pin);

// ─── ADD NODE ──────────────────────────────────────────────────
function addNode(type, x, y, overrides = {}) {
  const id   = uid('n');
  const def  = GATE_DEFS[type];
  const node = {
    id, type,
    x: x || 80,
    y: y || 80,
    value:     type === 'INPUT' ? false : null,
    outValues: def.numOuts > 1 ? new Array(def.numOuts).fill(false) : null,
    name:      (type === 'INPUT' || type === 'OUTPUT') ? id : null,
    numIns:    def.numIns,
    ...overrides,
  };
  nodes[id] = node;
  renderNode(node);
  return node;
}

// ─── RENDER NODE ───────────────────────────────────────────────
function renderNode(node) {
  let el = document.getElementById(node.id);
  if (!el) {
    el = document.createElement('div');
    el.className = 'node';
    el.id = node.id;
    canvas.appendChild(el);
  }

  const def    = getDef(node);
  const numIns  = getNumIns(node);
  const numOuts = getNumOuts(node);

  el.style.left = node.x + 'px';
  el.style.top  = node.y + 'px';
  el.className  = 'node' + (selectedId === node.id ? ' selected' : '');

  /* ── build innerHTML ── */
  let html = `<div class="del-x" data-del="${node.id}">×</div>`;
  html += `<div class="glabel">${def.label}</div>`;

  // live expression label on gate
  if (node.type !== 'INPUT' && node.type !== 'OUTPUT') {
    const lbl = gateExprLabel(node.id, 0);
    html += `<div class="gexpr" title="${lbl}">${lbl || '&nbsp;'}</div>`;
  }

  // INPUT: editable name + toggle
  if (node.type === 'INPUT') {
    const displayName = node.name || node.id;
    html += `<div class="gname" data-rename="${node.id}" title="Double-click to rename">${displayName}</div>`;
    html += `<div class="input-toggle${node.value ? ' on' : ''}"><div class="knob"></div></div>`;
  }

  // OUTPUT: name + LED
  if (node.type === 'OUTPUT') {
    html += `<div class="gname">${node.name || node.id}</div>`;
    html += `<div class="out-led${node.value ? ' on' : ''}"></div>`;
  }

  // DEMUX: output channel labels at bottom
  if (node.type === 'DEMUX') {
    html += `<div class="demux-out-labels"><span>Y0</span><span style="margin-left:14px">Y1</span></div>`;
  }

  html += `<div class="gsub">${node.id}${def.variable ? ' · ' + numIns + 'in' : ''}</div>`;
  el.innerHTML = html;

  /* ── attach events ── */
  el.querySelector('.del-x').onclick = e => { e.stopPropagation(); deleteNode(node.id); };

  if (node.type === 'INPUT') {
    el.querySelector('.input-toggle').onclick = e => {
      e.stopPropagation();
      node.value = !node.value;
      renderNode(node);
      refreshGateLabels();
      drawWires();
    };
    el.querySelector('[data-rename]').ondblclick = e => {
      e.stopPropagation();
      const newName = prompt('Rename input:', node.name || node.id);
      if (newName && newName.trim()) {
        node.name = newName.trim();
        renderNode(node);
        refreshGateLabels();
      }
    };
  }

  /* ── output pins ── */
  for (let i = 0; i < numOuts; i++) {
    const p   = document.createElement('div');
    p.className = 'pin pin-out';
    const frac = numOuts === 1 ? 0.5 : (i + 1) / (numOuts + 1);
    p.style.top       = (frac * 100) + '%';
    p.style.transform = 'translateY(-50%)';

    const val = numOuts > 1
      ? (node.outValues && node.outValues[i])
      : !!node.value;
    if (val) p.classList.add('hi');

    // label for DEMUX output pins
    if (def.outLabels) {
      const lbl = document.createElement('span');
      lbl.className   = 'pin-label-out';
      lbl.textContent = def.outLabels[i];
      p.appendChild(lbl);
    }

    p.dataset.node = node.id;
    p.dataset.kind = 'out';
    p.dataset.pin  = i;
    p.onclick = e => { e.stopPropagation(); handlePinClick(node.id, 'out', i); };
    el.appendChild(p);
  }

  /* ── input pins ── */
  for (let i = 0; i < numIns; i++) {
    const p   = document.createElement('div');
    p.className = 'pin pin-in';
    const frac = numIns === 1 ? 0.5 : (i + 1) / (numIns + 1);
    p.style.top       = (frac * 100) + '%';
    p.style.transform = 'translateY(-50%)';

    // label for MUX/DEMUX input pins
    if (def.pinLabels && def.pinLabels[i]) {
      const lbl = document.createElement('span');
      lbl.className   = 'pin-label';
      lbl.textContent = def.pinLabels[i];
      p.appendChild(lbl);
    }

    p.dataset.node = node.id;
    p.dataset.kind = 'in';
    p.dataset.pin  = i;
    p.onclick = e => { e.stopPropagation(); handlePinClick(node.id, 'in', i); };
    el.appendChild(p);
  }

  /* ── drag ── */
  el.onmousedown = e => {
    if (e.target.closest('.pin,.del-x,.input-toggle,.knob,[data-rename]')) return;
    dragNode = node;
    const rect = el.getBoundingClientRect();
    dragOffset.x = e.clientX - rect.left;
    dragOffset.y = e.clientY - rect.top;
    selectNode(node.id);
  };
}

// ─── SELECT NODE ───────────────────────────────────────────────
function selectNode(id) {
  selectedId = id;
  document.querySelectorAll('.node').forEach(el => el.classList.remove('selected'));
  if (id && document.getElementById(id)) document.getElementById(id).classList.add('selected');
  renderPropPanel();
}

function renderPropPanel() {
  const panel = document.getElementById('propContent');
  const node  = nodes[selectedId];
  if (!node) {
    panel.innerHTML = '<p class="hint">Click a node to select it.</p>';
    return;
  }
  const def    = getDef(node);
  const numIns  = getNumIns(node);

  let html = `<p class="hint" style="margin:0 0 6px"><b>${def.label}</b> &nbsp;·&nbsp; <small>${node.id}</small></p>`;

  if (node.type === 'INPUT') {
    html += `<label class="prop-label">Name (double-click node to rename)</label>
             <input type="text" id="propName" value="${node.name || ''}" placeholder="A, B, C …">`;
  }

  if (def.variable) {
    html += `<label class="prop-label" style="margin-top:8px">Input count (2–6)</label>
             <div class="prop-row">
               <button id="propMinus">−</button>
               <span id="propCount">${numIns}</span>
               <button id="propPlus">+</button>
             </div>`;
  }

  if (node.type !== 'INPUT' && node.type !== 'OUTPUT') {
    const lbl = gateExprLabel(node.id, 0);
    html += `<label class="prop-label" style="margin-top:6px">Expression</label>
             <div class="expr-box" style="font-size:11px">${lbl || '—'}</div>`;
  }

  panel.innerHTML = html;

  const nameInp = panel.querySelector('#propName');
  if (nameInp) {
    nameInp.oninput = () => {
      node.name = nameInp.value.trim() || node.id;
      renderNode(node);
      refreshGateLabels();
    };
  }

  const plusBtn  = panel.querySelector('#propPlus');
  const minusBtn = panel.querySelector('#propMinus');
  const countEl  = panel.querySelector('#propCount');
  if (plusBtn) {
    plusBtn.onclick = () => {
      if (node.numIns < 6) {
        node.numIns++;
        if (countEl) countEl.textContent = node.numIns;
        renderNode(node); drawWires(); refreshGateLabels();
      }
    };
    minusBtn.onclick = () => {
      if (node.numIns > 2) {
        const last = node.numIns - 1;
        wires = wires.filter(w => !(w.to.node === node.id && w.to.pin === last));
        node.numIns--;
        if (countEl) countEl.textContent = node.numIns;
        renderNode(node); drawWires(); refreshGateLabels();
      }
    };
  }
}

// ─── DELETE NODE ───────────────────────────────────────────────
function deleteNode(id) {
  if (selectedId === id) { selectedId = null; renderPropPanel(); }
  delete nodes[id];
  wires = wires.filter(w => w.from.node !== id && w.to.node !== id);
  const el = document.getElementById(id);
  if (el) el.remove();
  drawWires();
  refreshGateLabels();
}

// ─── DRAG ──────────────────────────────────────────────────────
canvasWrap.addEventListener('mousemove', e => {
  if (!dragNode) return;
  const rect = canvasWrap.getBoundingClientRect();
  dragNode.x = Math.max(0, e.clientX - rect.left + canvasWrap.scrollLeft - dragOffset.x);
  dragNode.y = Math.max(0, e.clientY - rect.top  + canvasWrap.scrollTop  - dragOffset.y);
  const el = document.getElementById(dragNode.id);
  el.style.left = dragNode.x + 'px';
  el.style.top  = dragNode.y + 'px';
  drawWires();
});
document.addEventListener('mouseup', () => { dragNode = null; });
canvasWrap.addEventListener('click', e => {
  if (e.target === canvasWrap || e.target === canvas || e.target === svgEl) {
    wireDraft = null;
    selectNode(null);
  }
});

// ─── PIN CLICK / WIRING ────────────────────────────────────────
function handlePinClick(nodeId, kind, pinIdx) {
  if (kind === 'out') {
    wireDraft = { fromNode: nodeId, fromPin: pinIdx };
    statusText.textContent = 'Now click an INPUT PIN (left ●) to complete the wire. Click canvas to cancel.';
  } else {
    if (!wireDraft) { statusText.textContent = 'Start a wire from an output pin (right ●) first.'; return; }
    if (wireDraft.fromNode === nodeId) { statusText.textContent = 'Cannot connect a node to itself.'; wireDraft = null; return; }
    wires = wires.filter(w => !(w.to.node === nodeId && w.to.pin === pinIdx));
    wires.push({ id: uid('w'), from: { node: wireDraft.fromNode, pin: wireDraft.fromPin }, to: { node: nodeId, pin: pinIdx } });
    wireDraft = null;
    statusText.textContent = '✓ Wire connected — hit Simulate to update values.';
    drawWires();
    refreshGateLabels();
  }
}

// ─── PIN POSITION ──────────────────────────────────────────────
function pinPos(nodeId, kind, pinIdx) {
  const node = nodes[nodeId];
  const el   = document.getElementById(nodeId);
  if (!node || !el) return { x: 0, y: 0 };
  const numIns  = getNumIns(node);
  const numOuts = getNumOuts(node);
  const w = el.offsetWidth, h = el.offsetHeight;
  if (kind === 'out') {
    const frac = numOuts === 1 ? 0.5 : (pinIdx + 1) / (numOuts + 1);
    return { x: node.x + w + 5, y: node.y + h * frac };
  } else {
    const frac = numIns === 1 ? 0.5 : (pinIdx + 1) / (numIns + 1);
    return { x: node.x - 5, y: node.y + h * frac };
  }
}

// ─── DRAW WIRES ────────────────────────────────────────────────
function drawWires() {
  svgEl.innerHTML = '';
  wires.forEach(w => {
    const a    = pinPos(w.from.node, 'out', w.from.pin);
    const b    = pinPos(w.to.node,   'in',  w.to.pin);
    const midX = (a.x + b.x) / 2;

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', `M ${a.x} ${a.y} C ${midX} ${a.y}, ${midX} ${b.y}, ${b.x} ${b.y}`);

    const fromNode = nodes[w.from.node];
    const live = fromNode && (
      getNumOuts(fromNode) > 1
        ? !!(fromNode.outValues && fromNode.outValues[w.from.pin])
        : !!fromNode.value
    );

    path.setAttribute('stroke',       live ? '#39ff8f' : '#3a4a40');
    path.setAttribute('stroke-width', live ? '2.5' : '2');
    path.setAttribute('fill', 'none');
    path.style.pointerEvents = 'stroke';
    path.style.cursor = 'pointer';
    path.onclick = () => { wires = wires.filter(x => x.id !== w.id); drawWires(); refreshGateLabels(); };
    svgEl.appendChild(path);
  });
}

// ─── GATE EXPRESSION LABEL (shown ON gate, depth-limited) ──────
function gateExprLabel(nodeId, depth) {
  const node = nodes[nodeId];
  if (!node) return '?';
  if (node.type === 'INPUT') return node.name || node.id;
  if (node.type === 'OUTPUT') return '';
  if (depth > 2) return '[…]'; // truncate deep trees

  const numIns = getNumIns(node);
  const parts  = [];
  for (let i = 0; i < numIns; i++) {
    const w = getWireIn(nodeId, i);
    parts.push(w ? gateExprLabel(w.from.node, depth + 1) : '?');
  }

  switch (node.type) {
    case 'AND':    return parts.join(' · ');
    case 'OR':     return parts.join(' + ');
    case 'NOT':    return `¬${parts[0]}`;
    case 'NAND':   return `¬(${parts.join(' · ')})`;
    case 'NOR':    return `¬(${parts.join(' + ')})`;
    case 'XOR':    return parts.join(' ⊕ ');
    case 'XNOR':   return `¬(${parts.join(' ⊕ ')})`;
    case 'BUFFER': return parts[0];
    case 'MUX':    return `MUX(${parts[0]},${parts[1]};S=${parts[2]})`;
    case 'DEMUX':  return `DEMUX(${parts[0]};S=${parts[1]})`;
    default:       return '';
  }
}

function refreshGateLabels() {
  Object.values(nodes).forEach(node => {
    if (node.type === 'INPUT' || node.type === 'OUTPUT') return;
    const el = document.getElementById(node.id);
    if (!el) return;
    const exprEl = el.querySelector('.gexpr');
    if (exprEl) {
      const lbl = gateExprLabel(node.id, 0);
      exprEl.textContent = lbl || ' ';
      exprEl.title       = lbl;
    }
  });
  // also refresh prop panel expression if a gate is selected
  if (selectedId && nodes[selectedId]) {
    const node = nodes[selectedId];
    if (node.type !== 'INPUT' && node.type !== 'OUTPUT') {
      const exprEl = document.querySelector('#propContent .expr-box');
      if (exprEl) exprEl.textContent = gateExprLabel(node.id, 0) || '—';
    }
  }
}

// ─── PALETTE CLICK ─────────────────────────────────────────────
document.querySelectorAll('.gate-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const type = btn.dataset.type;
    const cnt  = Object.keys(nodes).length;
    const x    = 90 + (cnt % 7) * 28;
    const y    = 90 + Math.floor(cnt / 7) * 120 + Math.random() * 20;
    addNode(type, x, y);
    drawWires();
  });
});

// ─── SIMULATION ────────────────────────────────────────────────
function computeValue(nodeId, outPin = 0, visiting = new Set()) {
  const node = nodes[nodeId];
  if (!node) return false;
  if (node.type === 'INPUT') return !!node.value;
  if (visiting.has(nodeId)) return false;
  visiting.add(nodeId);

  const numIns = getNumIns(node);
  const ins    = [];
  for (let i = 0; i < numIns; i++) {
    const w = getWireIn(nodeId, i);
    ins.push(w ? computeValue(w.from.node, w.from.pin, new Set(visiting)) : false);
  }

  switch (node.type) {
    case 'OUTPUT': return !!ins[0];
    case 'AND':    return ins.every(Boolean);
    case 'OR':     return ins.some(Boolean);
    case 'NOT':    return !ins[0];
    case 'NAND':   return !ins.every(Boolean);
    case 'NOR':    return !ins.some(Boolean);
    case 'XOR':    return ins.filter(Boolean).length % 2 === 1;
    case 'XNOR':   return !(ins.filter(Boolean).length % 2 === 1);
    case 'BUFFER': return !!ins[0];
    case 'MUX': {
      const sel = ins[2] ? 1 : 0;
      return !!ins[sel];
    }
    case 'DEMUX':
      if (outPin === 0) return !ins[1] && !!ins[0];
      if (outPin === 1) return  !!ins[1] && !!ins[0];
      return false;
    default: return false;
  }
}

function runSimulation() {
  Object.values(nodes).forEach(node => {
    if (node.type === 'INPUT') return;
    const numOuts = getNumOuts(node);
    if (numOuts > 1) {
      node.outValues = Array.from({ length: numOuts }, (_, i) => computeValue(node.id, i));
      node.value = node.outValues[0];
    } else {
      node.value = computeValue(node.id, 0);
    }
    renderNode(node);
  });
  drawWires();
  refreshGateLabels();
}

document.getElementById('btnSimulate').onclick = () => {
  if (!Object.keys(nodes).length) { statusText.textContent = 'Add some gates first.'; return; }
  runSimulation();
  statusText.textContent = '✓ Simulation complete — outputs updated.';
};

// ─── FULL BOOLEAN EXPRESSION ───────────────────────────────────
function exprFor(nodeId, visiting = new Set()) {
  const node = nodes[nodeId];
  if (!node) return '?';
  if (node.type === 'INPUT') return node.name || node.id;
  if (visiting.has(nodeId)) return '(cycle)';
  visiting.add(nodeId);

  const numIns = getNumIns(node);
  const parts  = [];
  for (let i = 0; i < numIns; i++) {
    const w = getWireIn(nodeId, i);
    parts.push(w ? exprFor(w.from.node, new Set(visiting)) : '0');
  }
  switch (node.type) {
    case 'OUTPUT': return parts[0];
    case 'AND':    return `(${parts.join(' · ')})`;
    case 'OR':     return `(${parts.join(' + ')})`;
    case 'NOT':    return `¬${parts[0]}`;
    case 'NAND':   return `¬(${parts.join(' · ')})`;
    case 'NOR':    return `¬(${parts.join(' + ')})`;
    case 'XOR':    return `(${parts.join(' ⊕ ')})`;
    case 'XNOR':   return `¬(${parts.join(' ⊕ ')})`;
    case 'BUFFER': return parts[0];
    case 'MUX':    return `MUX(${parts[0]}, ${parts[1]}; S=${parts[2]})`;
    case 'DEMUX':  return `DEMUX(${parts[0]}; S=${parts[1]})`;
    default: return '?';
  }
}

document.getElementById('btnExpr').onclick = () => {
  const outputs = Object.values(nodes).filter(n => n.type === 'OUTPUT');
  const box = document.getElementById('exprBox');
  if (!outputs.length) { box.textContent = 'No OUTPUT node found.'; return; }
  box.innerHTML = outputs.map(o => {
    const w = getWireIn(o.id, 0);
    return `<b>${o.name || o.id}</b> = ${w ? exprFor(o.id) : '0'}`;
  }).join('<br>');
};

// ─── TRUTH TABLE ───────────────────────────────────────────────
function truthCol(outputId, inputs, outPin = 0) {
  const saved = inputs.map(i => i.value);
  const col   = [];
  const rows  = 1 << inputs.length;
  for (let r = 0; r < rows; r++) {
    inputs.forEach((inp, b) => { inp.value = !!((r >> (inputs.length - 1 - b)) & 1); });
    col.push(computeValue(outputId, outPin) ? 1 : 0);
  }
  inputs.forEach((inp, i) => { inp.value = saved[i]; });
  return col;
}

document.getElementById('btnTruth').onclick = () => {
  const inputs  = Object.values(nodes).filter(n => n.type === 'INPUT');
  const outputs = Object.values(nodes).filter(n => n.type === 'OUTPUT');
  const box = document.getElementById('truthBox');

  if (!inputs.length || !outputs.length) {
    box.innerHTML = '<p class="empty-note">Need at least one INPUT and one OUTPUT node.</p>'; return;
  }
  if (inputs.length > 8) {
    box.innerHTML = '<p class="empty-note">Too many inputs (limit 8) for a full truth table.</p>'; return;
  }

  const rows = 1 << inputs.length;
  let html = '<table><tr>' +
    inputs.map(i  => `<th>${i.name || i.id}</th>`).join('') +
    outputs.map(o => `<th>${o.name || o.id}</th>`).join('') +
    '</tr>';

  const saved = inputs.map(i => i.value);
  for (let r = 0; r < rows; r++) {
    const bits = inputs.map((_, b) => (r >> (inputs.length - 1 - b)) & 1);
    inputs.forEach((inp, i) => { inp.value = !!bits[i]; });
    const outVals = outputs.map(o => computeValue(o.id, 0) ? 1 : 0);
    html += '<tr>' +
      bits.map(b    => `<td class="${b ? 'one' : 'zero'}">${b}</td>`).join('') +
      outVals.map(v => `<td class="${v ? 'one' : 'zero'}">${v}</td>`).join('') +
      '</tr>';
  }
  html += '</table>';
  box.innerHTML = html;
  inputs.forEach((inp, i) => { inp.value = saved[i]; });
  runSimulation();
};

// ─── IDENTIFY EQUIVALENT GATE ──────────────────────────────────
function makePat(fn, n) {
  return Array.from({ length: 1 << n }, (_, r) => {
    const b = Array.from({ length: n }, (_, i) => (r >> (n - 1 - i)) & 1);
    return fn(b) ? 1 : 0;
  });
}
const sameCol = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);

const KNOWN = {
  1: [
    { n: 'BUFFER (Y = A)',             f: b => b[0]   },
    { n: 'NOT (Y = ¬A)',               f: b => !b[0]  },
    { n: 'CONSTANT 0 (always LOW)',    f: () => 0     },
    { n: 'CONSTANT 1 (always HIGH)',   f: () => 1     },
  ],
  2: [
    { n: 'AND',                        f: b => b[0]&b[1]        },
    { n: 'OR',                         f: b => b[0]|b[1]        },
    { n: 'NAND',                       f: b => !(b[0]&b[1])     },
    { n: 'NOR',                        f: b => !(b[0]|b[1])     },
    { n: 'XOR',                        f: b => b[0]^b[1]        },
    { n: 'XNOR',                       f: b => !(b[0]^b[1])     },
    { n: 'IMPLICATION A→B (¬A + B)',   f: b => !b[0]||b[1]     },
    { n: 'Inhibition (A · ¬B)',        f: b => b[0]&&!b[1]     },
    { n: 'Copy A only (BUFFER on A)',  f: b => b[0]            },
    { n: 'Copy B only (BUFFER on B)',  f: b => b[1]            },
    { n: 'Invert A only (NOT A)',      f: b => !b[0]           },
    { n: 'Invert B only (NOT B)',      f: b => !b[1]           },
    { n: 'CONSTANT 0 (always LOW)',    f: () => 0              },
    { n: 'CONSTANT 1 (always HIGH)',   f: () => 1              },
  ],
  3: [
    { n: '3-input AND',                f: b => b[0]&b[1]&b[2]            },
    { n: '3-input OR',                 f: b => b[0]|b[1]|b[2]            },
    { n: '3-input NAND',               f: b => !(b[0]&b[1]&b[2])         },
    { n: '3-input NOR',                f: b => !(b[0]|b[1]|b[2])         },
    { n: '3-input XOR  (odd parity)',  f: b => b[0]^b[1]^b[2]            },
    { n: '3-input XNOR (even parity)', f: b => !(b[0]^b[1]^b[2])        },
    { n: 'Majority Gate (≥ 2 of 3)',   f: b => (b[0]+b[1]+b[2]) >= 2    },
    { n: 'Minority Gate (≤ 1 of 3)',   f: b => (b[0]+b[1]+b[2]) <= 1    },
    { n: 'CONSTANT 0 (always LOW)',    f: () => 0                        },
    { n: 'CONSTANT 1 (always HIGH)',   f: () => 1                        },
  ],
};

document.getElementById('btnIdentify').onclick = () => {
  const inputs  = Object.values(nodes).filter(n => n.type === 'INPUT');
  const outputs = Object.values(nodes).filter(n => n.type === 'OUTPUT');
  const box = document.getElementById('identifyBox');

  if (!inputs.length || !outputs.length) {
    box.textContent = 'Add INPUT and OUTPUT nodes first.'; return;
  }
  if (inputs.length > 8) { box.textContent = 'Too many inputs (limit 8).'; return; }

  const saved = inputs.map(i => i.value);
  const lines = outputs.map(o => {
    const col      = truthCol(o.id, inputs);
    const patterns = KNOWN[inputs.length] || [];
    let match = null;
    for (const p of patterns) {
      if (sameCol(col, makePat(p.f, inputs.length))) { match = p.n; break; }
    }
    if (!match) {
      if (col.every(v => v === 0))    match = 'CONSTANT 0 (always LOW)';
      else if (col.every(v => v === 1)) match = 'CONSTANT 1 (always HIGH)';
      else match = `Custom combinational function (${inputs.length} inputs)`;
    }
    return `<b>${o.name || o.id}</b> ≡ <span style="color:var(--trace)">${match}</span>`;
  });

  inputs.forEach((inp, i) => { inp.value = saved[i]; });
  runSimulation();
  box.innerHTML = lines.join('<br><br>');
};

// ─── EXPRESSION PARSER ─────────────────────────────────────────
function tokenize(str) {
  const toks = [];
  let i = 0;
  while (i < str.length) {
    const c = str[i];
    if (/\s/.test(c))        { i++; continue; }
    if (c === '(')           { toks.push({ t:'LP' });  i++; continue; }
    if (c === ')')           { toks.push({ t:'RP' });  i++; continue; }
    if (c === '+' || c === '∨') { toks.push({ t:'OR' });  i++; continue; }
    if (c === '|') { if (str[i+1]==='|') i++; toks.push({ t:'OR'  }); i++; continue; }
    if (c === '*' || c === '∧') { toks.push({ t:'AND' }); i++; continue; }
    if (c === '&') { if (str[i+1]==='&') i++; toks.push({ t:'AND' }); i++; continue; }
    if (c === '.')           { toks.push({ t:'AND' }); i++; continue; }
    if (c==='!'||c==='~'||c==='¬') { toks.push({ t:'NOT' }); i++; continue; }
    if (c === '^' || c === '⊕')   { toks.push({ t:'XOR' }); i++; continue; }
    if (/[A-Za-z]/.test(c)) {
      let word = '';
      while (i < str.length && /[A-Za-z0-9_]/.test(str[i])) word += str[i++];
      const kw = { AND:'AND', OR:'OR', NOT:'NOT', XOR:'XOR',
                   NAND:'NAND', NOR:'NOR', XNOR:'XNOR', BUFFER:'BUFFER' }[word.toUpperCase()];
      toks.push(kw ? { t: kw } : { t:'VAR', v: word });
      continue;
    }
    i++; // skip unknown
  }
  return toks;
}

function parseBoolExpr(str) {
  const toks = tokenize(str);
  let pos = 0;
  const peek    = ()   => toks[pos];
  const consume = ()   => toks[pos++];

  // Precedence: OR < XOR < NOR-level < AND < NAND-level < NOT < atom
  function parseOr() {
    const args = [parseXor()];
    while (peek() && peek().t === 'OR') {
      consume();
      args.push(parseXor());
    }
    // check for NOR  (A NOR B)
    if (peek() && peek().t === 'NOR') {
      consume();
      const right = parseXor();
      return { op: 'NOR', args: [args[args.length-1], right] };
    }
    return args.length === 1 ? args[0] : { op: 'OR', args };
  }
  function parseXor() {
    const args = [parseAnd()];
    while (peek() && (peek().t === 'XOR' || peek().t === 'XNOR')) {
      const op = consume().t;
      const r  = parseAnd();
      if (op === 'XNOR') return { op: 'XNOR', args: [...args, r] };
      args.push(r);
    }
    return args.length === 1 ? args[0] : { op: 'XOR', args };
  }
  function parseAnd() {
    const args = [parseNot()];
    while (peek() && (peek().t === 'AND' || peek().t === 'NAND')) {
      const op = consume().t;
      const r  = parseNot();
      if (op === 'NAND') return { op: 'NAND', args: [...args, r] };
      args.push(r);
    }
    return args.length === 1 ? args[0] : { op: 'AND', args };
  }
  function parseNot() {
    if (peek() && peek().t === 'NOT') { consume(); return { op: 'NOT', args: [parseNot()] }; }
    return parseAtom();
  }
  function parseAtom() {
    if (!peek()) throw new Error('Unexpected end of expression');
    if (peek().t === 'LP') {
      consume();
      const e = parseOr();
      if (!peek() || peek().t !== 'RP') throw new Error('Missing closing parenthesis');
      consume();
      return e;
    }
    if (peek().t === 'VAR') return { op: 'VAR', name: consume().v };
    throw new Error('Unexpected token: ' + JSON.stringify(peek()));
  }

  return parseOr();
}

// ─── BUILD CIRCUIT FROM EXPRESSION ────────────────────────────
function buildFromExpression(str) {
  let ast;
  try { ast = parseBoolExpr(str.trim()); }
  catch(e) { statusText.textContent = '⚠ Parse error: ' + e.message; return; }

  // collect variable names in order of appearance
  const varOrder = [];
  const varSet   = new Set();
  function collectVars(node) {
    if (node.op === 'VAR' && !varSet.has(node.name)) { varOrder.push(node.name); varSet.add(node.name); }
    (node.args || []).forEach(collectVars);
  }
  collectVars(ast);

  // depth from leaves (0=var, 1=gate directly on vars, etc.)
  function astDepth(n) {
    if (n.op === 'VAR') return 0;
    return 1 + Math.max(...(n.args || []).map(astDepth));
  }
  const totalDepth = astDepth(ast);
  const COL_W      = 220;
  const START_X    = 80;

  // Place INPUT nodes in column 0
  const varNodeIds = {};
  varOrder.forEach((name, idx) => {
    const n = addNode('INPUT', START_X, 80 + idx * 100);
    n.name  = name;
    renderNode(n);
    varNodeIds[name] = n.id;
  });

  // y counter per column so nodes don't overlap
  const colNextY = {};
  const colY = col => {
    if (colNextY[col] == null) colNextY[col] = 80;
    const y = colNextY[col]; colNextY[col] += 110; return y;
  };

  // recursively create gate nodes
  function build(node) {
    if (node.op === 'VAR') return { nodeId: varNodeIds[node.name], pin: 0 };

    const d      = astDepth(node);
    const x      = START_X + d * COL_W;
    const y      = colY(d);
    const numIns = (node.args || []).length;
    const gn     = addNode(node.op, x, y, { numIns });
    renderNode(gn);

    (node.args || []).forEach((child, i) => {
      const { nodeId: cId, pin: cPin } = build(child);
      wires.push({ id: uid('w'), from: { node: cId, pin: cPin }, to: { node: gn.id, pin: i } });
    });
    return { nodeId: gn.id, pin: 0 };
  }

  const { nodeId: rootId } = build(ast);

  // OUTPUT node
  const outX  = START_X + (totalDepth + 1) * COL_W;
  const outNode = addNode('OUTPUT', outX, 80 + Math.floor((varOrder.length - 1) / 2) * 100);
  renderNode(outNode);
  wires.push({ id: uid('w'), from: { node: rootId, pin: 0 }, to: { node: outNode.id, pin: 0 } });

  drawWires();
  runSimulation();
  statusText.textContent = `✓ Circuit built from "${str}".`;
}

document.getElementById('btnBuild').onclick = () => {
  const val = document.getElementById('exprInput').value.trim();
  if (!val) { statusText.textContent = 'Enter an expression first.'; return; }
  buildFromExpression(val);
};
document.getElementById('exprInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('btnBuild').click();
});

// ─── CLEAR ─────────────────────────────────────────────────────
document.getElementById('btnClear').onclick = () => {
  if (!confirm('Clear the entire board?')) return;
  nodes = {}; wires = []; nextId = 1; selectedId = null; wireDraft = null;
  canvas.querySelectorAll('.node').forEach(el => el.remove());
  drawWires();
  ['exprBox','identifyBox'].forEach(id => { document.getElementById(id).textContent = '—'; });
  document.getElementById('truthBox').innerHTML = '<p class="empty-note">No outputs yet.</p>';
  renderPropPanel();
  statusText.textContent = 'Board cleared.';
};

// ─── SERIALIZE / LOAD ──────────────────────────────────────────
function serialize() {
  return JSON.stringify({
    nodes: Object.values(nodes).map(n => ({
      id: n.id, type: n.type, x: n.x, y: n.y,
      value:  n.type === 'INPUT' ? n.value : null,
      name:   n.name,
      numIns: n.numIns,
    })),
    wires: wires.map(w => ({ from: w.from, to: w.to })),
    nextId,
  });
}

function loadFromData(data) {
  nodes = {}; wires = [];
  canvas.querySelectorAll('.node').forEach(el => el.remove());
  data.nodes.forEach(d => {
    const def = GATE_DEFS[d.type];
    nodes[d.id] = {
      id: d.id, type: d.type, x: d.x, y: d.y,
      value:     d.value,
      name:      d.name || d.id,
      numIns:    d.numIns != null ? d.numIns : def.numIns,
      outValues: def.numOuts > 1 ? new Array(def.numOuts).fill(false) : null,
    };
  });
  nextId = data.nextId || 1;
  Object.values(nodes).forEach(renderNode);
  wires = data.wires.map(w => ({ id: uid('w'), from: w.from, to: w.to }));
  drawWires(); runSimulation();
}

// ─── SAVE / LOAD (persistent storage) ─────────────────────────
async function refreshSavedList() {
  const list = document.getElementById('savedList');
  try {
    const res = await window.storage.list('circuit:', false);
    if (!res || !res.keys || !res.keys.length) {
      list.innerHTML = '<p class="empty-note">Nothing saved yet.</p>'; return;
    }
    list.innerHTML = '';
    for (const key of res.keys) {
      const name = key.replace('circuit:', '');
      const row  = document.createElement('div');
      row.className = 'saved-item';
      row.innerHTML = `<span>${name}</span>
        <span>
          <button data-load="${key}">Load</button>
          <button data-del="${key}">Del</button>
        </span>`;
      list.appendChild(row);
    }
    list.querySelectorAll('[data-load]').forEach(b => {
      b.onclick = async () => {
        try {
          const r = await window.storage.get(b.dataset.load, false);
          if (r) loadFromData(JSON.parse(r.value));
          statusText.textContent = 'Circuit loaded.';
        } catch(e) { statusText.textContent = 'Could not load circuit.'; }
      };
    });
    list.querySelectorAll('[data-del]').forEach(b => {
      b.onclick = async () => {
        try { await window.storage.delete(b.dataset.del, false); refreshSavedList(); } catch(e) {}
      };
    });
  } catch(e) {
    list.innerHTML = '<p class="empty-note">Storage unavailable.</p>';
  }
}

document.getElementById('btnSave').onclick = async () => {
  if (!Object.keys(nodes).length) { statusText.textContent = 'Nothing to save.'; return; }
  const name = prompt('Name this circuit:', 'circuit-' + Date.now());
  if (!name) return;
  try {
    await window.storage.set('circuit:' + name, serialize(), false);
    statusText.textContent = '✓ Saved "' + name + '".';
    refreshSavedList();
  } catch(e) { statusText.textContent = 'Save failed (storage unavailable here).'; }
};

// ─── EXPORT / IMPORT JSON ──────────────────────────────────────
document.getElementById('btnExport').onclick = () => {
  const blob = new Blob([serialize()], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = 'circuit.json'; a.click();
  URL.revokeObjectURL(url);
};
document.getElementById('btnImport').onclick = () => document.getElementById('fileImport').click();
document.getElementById('fileImport').onchange = e => {
  const file = e.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try { loadFromData(JSON.parse(ev.target.result)); statusText.textContent = '✓ Circuit imported.'; }
    catch(err) { statusText.textContent = '⚠ Invalid file.'; }
  };
  reader.readAsText(file);
  e.target.value = '';
};

// ─── DEMO CIRCUIT (OR + NOT = NOR) ────────────────────────────
(function initDemo() {
  const nA   = addNode('INPUT',  70, 80);  nA.name = 'A'; renderNode(nA);
  const nB   = addNode('INPUT',  70, 200); nB.name = 'B'; renderNode(nB);
  const nOR  = addNode('OR',    270, 140);
  const nNOT = addNode('NOT',   460, 140);
  const nOUT = addNode('OUTPUT',650, 140);
  wires.push({ id:uid('w'), from:{node:nA.id,  pin:0}, to:{node:nOR.id,  pin:0} });
  wires.push({ id:uid('w'), from:{node:nB.id,  pin:0}, to:{node:nOR.id,  pin:1} });
  wires.push({ id:uid('w'), from:{node:nOR.id, pin:0}, to:{node:nNOT.id, pin:0} });
  wires.push({ id:uid('w'), from:{node:nNOT.id,pin:0}, to:{node:nOUT.id, pin:0} });
  drawWires(); runSimulation(); refreshSavedList();
})();
