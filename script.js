(function(){
  const GATE_DEFS = {
    INPUT:  {ins:0, outs:1, label:'IN'},
    OUTPUT: {ins:1, outs:0, label:'OUT'},
    AND:    {ins:2, outs:1, label:'AND'},
    OR:     {ins:2, outs:1, label:'OR'},
    NOT:    {ins:1, outs:1, label:'NOT'},
    NAND:   {ins:2, outs:1, label:'NAND'},
    NOR:    {ins:2, outs:1, label:'NOR'},
    XOR:    {ins:2, outs:1, label:'XOR'},
    XNOR:   {ins:2, outs:1, label:'XNOR'},
    BUFFER: {ins:1, outs:1, label:'BUF'},
  };
  const SYM = {AND:'∧',OR:'∨',NOT:'¬',NAND:'⊼',NOR:'⊽',XOR:'⊕',XNOR:'⊙',BUFFER:''};

  let nodes = {};      // id -> {id,type,x,y,value,name}
  let wires = [];       // {id, from:{node,pin}, to:{node,pin}}
  let nextId = 1;
  let wireDraft = null; // {fromNode, fromPin}
  let dragNode = null, dragOffset = {x:0,y:0};

  const canvas = document.getElementById('canvas');
  const svg = document.getElementById('wires');
  const statusText = document.getElementById('statusText');

  function uid(prefix){ return prefix + (nextId++); }

  function addNode(type, x, y){
    const id = uid('n');
    const node = {
      id, type, x: x||80, y: y||80,
      value: type==='INPUT' ? false : null,
      name: type==='INPUT' || type==='OUTPUT' ? id : null
    };
    nodes[id] = node;
    renderNode(node);
    return node;
  }

  function renderNode(node){
    let el = document.getElementById(node.id);
    if(!el){
      el = document.createElement('div');
      el.className='node';
      el.id = node.id;
      canvas.appendChild(el);
    }
    const def = GATE_DEFS[node.type];
    el.style.left = node.x+'px';
    el.style.top = node.y+'px';
    el.innerHTML = `<div class="del-x" data-del="${node.id}">×</div>
      <div class="glabel">${def.label}</div>
      <div class="gsub">${node.id}</div>`;

    if(node.type==='INPUT'){
      const tog = document.createElement('div');
      tog.className = 'input-toggle' + (node.value ? ' on':'');
      tog.innerHTML = '<div class="knob"></div>';
      tog.onclick = (e)=>{ e.stopPropagation(); node.value = !node.value; renderNode(node); };
      el.appendChild(tog);
    }
    if(node.type==='OUTPUT'){
      const led = document.createElement('div');
      led.className = 'out-led' + (node.value ? ' on':'');
      el.appendChild(led);
    }

    if(def.outs>0){
      const p = document.createElement('div');
      p.className='pin pin-out'+(node.value? ' hi':'');
      p.dataset.node = node.id; p.dataset.kind='out'; p.dataset.pin='0';
      p.onclick = (e)=>{ e.stopPropagation(); handlePinClick(node.id,'out',0); };
      el.appendChild(p);
    }
    if(def.ins>0){
      for(let i=0;i<def.ins;i++){
        const p = document.createElement('div');
        p.className='pin pin-in';
        const topPct = def.ins===1 ? 50 : (i===0?30:70);
        p.style.top = topPct+'%';
        p.style.transform='translateY(-50%)';
        p.dataset.node = node.id; p.dataset.kind='in'; p.dataset.pin=i;
        p.onclick = (e)=>{ e.stopPropagation(); handlePinClick(node.id,'in',i); };
        el.appendChild(p);
      }
    }

    el.querySelector('.del-x').onclick = (e)=>{ e.stopPropagation(); deleteNode(node.id); };

    el.onmousedown = (e)=>{
      if(e.target.classList.contains('pin') || e.target.classList.contains('del-x') || e.target.classList.contains('input-toggle') || e.target.classList.contains('knob')) return;
      dragNode = node;
      const rect = el.getBoundingClientRect();
      dragOffset.x = e.clientX - rect.left;
      dragOffset.y = e.clientY - rect.top;
      document.querySelectorAll('.node').forEach(n=>n.classList.remove('selected'));
      el.classList.add('selected');
    };
  }

  function deleteNode(id){
    delete nodes[id];
    wires = wires.filter(w=> w.from.node!==id && w.to.node!==id);
    const el = document.getElementById(id);
    if(el) el.remove();
    drawWires();
  }

  canvas.parentElement.addEventListener('mousemove', (e)=>{
    if(!dragNode) return;
    const wrapRect = canvas.parentElement.getBoundingClientRect();
    const scrollL = canvas.parentElement.scrollLeft, scrollT = canvas.parentElement.scrollTop;
    let x = e.clientX - wrapRect.left + scrollL - dragOffset.x;
    let y = e.clientY - wrapRect.top + scrollT - dragOffset.y;
    dragNode.x = Math.max(0,x); dragNode.y = Math.max(0,y);
    const el = document.getElementById(dragNode.id);
    el.style.left = dragNode.x+'px'; el.style.top = dragNode.y+'px';
    drawWires();
  });
  document.addEventListener('mouseup', ()=>{ dragNode=null; });

  function handlePinClick(nodeId, kind, pinIdx){
    if(kind==='out'){
      wireDraft = {fromNode: nodeId, fromPin: pinIdx};
      statusText.textContent = 'Now click an input pin to connect the wire.';
    } else {
      if(!wireDraft){ statusText.textContent='Start a wire from an output pin first.'; return; }
      wires = wires.filter(w => !(w.to.node===nodeId && w.to.pin===pinIdx));
      wires.push({id:uid('w'), from:{node:wireDraft.fromNode, pin:wireDraft.fromPin}, to:{node:nodeId, pin:pinIdx}});
      wireDraft = null;
      statusText.textContent = 'Wire connected.';
      drawWires();
    }
  }

  function pinPos(nodeId, kind, pinIdx){
    const node = nodes[nodeId];
    const el = document.getElementById(nodeId);
    if(!node || !el) return {x:0,y:0};
    const def = GATE_DEFS[node.type];
    const w = el.offsetWidth, h = el.offsetHeight;
    if(kind==='out') return {x: node.x + w + 5, y: node.y + h/2};
    const topPct = def.ins===1 ? 0.5 : (pinIdx===0?0.3:0.7);
    return {x: node.x - 5, y: node.y + h*topPct};
  }

  function drawWires(){
    svg.innerHTML = '';
    wires.forEach(w=>{
      const a = pinPos(w.from.node,'out',w.from.pin);
      const b = pinPos(w.to.node,'in',w.to.pin);
      const midX = (a.x+b.x)/2;
      const path = document.createElementNS('http://www.w3.org/2000/svg','path');
      path.setAttribute('d', `M ${a.x} ${a.y} C ${midX} ${a.y}, ${midX} ${b.y}, ${b.x} ${b.y}`);
      const live = nodes[w.from.node] && nodes[w.from.node].value;
      path.setAttribute('stroke', live ? '#39ff8f' : '#3a4a40');
      path.setAttribute('stroke-width', live ? '2.5' : '2');
      path.setAttribute('fill','none');
      path.style.pointerEvents='stroke';
      path.style.cursor='pointer';
      path.onclick = ()=>{ wires = wires.filter(x=>x.id!==w.id); drawWires(); };
      svg.appendChild(path);
    });
  }

  document.querySelectorAll('.gate-btn').forEach((btn)=>{
    btn.addEventListener('click', ()=>{
      const type = btn.dataset.type;
      const x = 60 + (Object.keys(nodes).length % 8) * 40;
      const y = 60 + Math.floor(Object.keys(nodes).length/8) * 110 + (Math.random()*40);
      addNode(type, x, y);
      drawWires();
    });
  });

  // ---------- SIMULATION ----------
  function evaluateGate(type, ins){
    switch(type){
      case 'AND': return ins.every(Boolean);
      case 'OR': return ins.some(Boolean);
      case 'NOT': return !ins[0];
      case 'NAND': return !ins.every(Boolean);
      case 'NOR': return !ins.some(Boolean);
      case 'XOR': return ins.filter(Boolean).length % 2 === 1;
      case 'XNOR': return !(ins.filter(Boolean).length % 2 === 1);
      case 'BUFFER': return !!ins[0];
      default: return false;
    }
  }

  function getInputWiresFor(nodeId, pinIdx){
    return wires.find(w=> w.to.node===nodeId && w.to.pin===pinIdx);
  }

  function computeValue(nodeId, visiting){
    const node = nodes[nodeId];
    if(node.type==='INPUT') return !!node.value;
    visiting = visiting || new Set();
    if(visiting.has(nodeId)) return false;
    visiting.add(nodeId);
    const def = GATE_DEFS[node.type];
    const insVals = [];
    for(let i=0;i<def.ins;i++){
      const w = getInputWiresFor(nodeId, i);
      if(!w){ insVals.push(false); continue; }
      insVals.push(computeValue(w.from.node, new Set(visiting)));
    }
    if(node.type==='OUTPUT') return insVals[0];
    return evaluateGate(node.type, insVals);
  }

  function runSimulation(){
    Object.values(nodes).forEach(node=>{
      if(node.type==='INPUT') return;
      node.value = computeValue(node.id);
      renderNode(node);
    });
    drawWires();
  }

  document.getElementById('btnSimulate').onclick = ()=>{
    if(Object.keys(nodes).length===0){ statusText.textContent='Add some gates first.'; return; }
    runSimulation();
    statusText.textContent = 'Simulation complete — outputs updated.';
  };

  // ---------- EXPRESSION ----------
  function exprFor(nodeId, visiting){
    const node = nodes[nodeId];
    if(node.type==='INPUT') return node.name || nodeId;
    visiting = visiting || new Set();
    if(visiting.has(nodeId)) return '(cycle)';
    visiting.add(nodeId);
    const def = GATE_DEFS[node.type];
    const parts = [];
    for(let i=0;i<def.ins;i++){
      const w = getInputWiresFor(nodeId, i);
      parts.push(w ? exprFor(w.from.node, new Set(visiting)) : '0');
    }
    if(node.type==='OUTPUT') return parts[0];
    if(node.type==='NOT') return `¬${parts[0]}`;
    if(node.type==='BUFFER') return parts[0];
    const sym = SYM[node.type];
    if(node.type==='NAND') return `¬(${parts[0]} ∧ ${parts[1]})`;
    if(node.type==='NOR') return `¬(${parts[0]} ∨ ${parts[1]})`;
    return `(${parts.join(' '+sym+' ')})`;
  }

  document.getElementById('btnExpr').onclick = ()=>{
    const outputs = Object.values(nodes).filter(n=>n.type==='OUTPUT');
    const box = document.getElementById('exprBox');
    if(outputs.length===0){ box.textContent='No OUTPUT node found.'; return; }
    box.innerHTML = outputs.map(o=>{
      const w = getInputWiresFor(o.id,0);
      return `${o.id} = ${w ? exprFor(o.id) : '0'}`;
    }).join('<br>');
  };

  // ---------- TRUTH TABLE ----------
  function truthColumnFor(outputId, inputs){
    const rows = Math.pow(2, inputs.length);
    const col = [];
    const saved = inputs.map(i=>i.value);
    for(let r=0;r<rows;r++){
      const bits = [];
      for(let b=inputs.length-1;b>=0;b--){ bits.push((r>>b)&1); }
      inputs.forEach((inp,idx)=> inp.value = !!bits[idx]);
      col.push(computeValue(outputId) ? 1 : 0);
    }
    inputs.forEach((inp,idx)=> inp.value = saved[idx]);
    return col;
  }

  document.getElementById('btnTruth').onclick = ()=>{
    const inputs = Object.values(nodes).filter(n=>n.type==='INPUT');
    const outputs = Object.values(nodes).filter(n=>n.type==='OUTPUT');
    const box = document.getElementById('truthBox');
    if(inputs.length===0 || outputs.length===0){
      box.innerHTML = '<p class="empty-note">Need at least one INPUT and one OUTPUT node.</p>';
      return;
    }
    if(inputs.length > 6){
      box.innerHTML = '<p class="empty-note">Too many inputs ('+inputs.length+') for a full table (limit 6).</p>';
      return;
    }
    const rows = Math.pow(2, inputs.length);
    let html = '<table><tr>' + inputs.map(i=>`<th>${i.id}</th>`).join('') + outputs.map(o=>`<th>${o.id}</th>`).join('') + '</tr>';
    const savedVals = {};
    inputs.forEach(i=> savedVals[i.id]=i.value);
    for(let r=0;r<rows;r++){
      const bits = [];
      for(let b=inputs.length-1;b>=0;b--){ bits.push((r>>b)&1); }
      inputs.forEach((inp,idx)=> inp.value = !!bits[idx]);
      outputs.forEach(o=> o.value = computeValue(o.id));
      html += '<tr>' + bits.map(b=>`<td class="${b?'one':'zero'}">${b}</td>`).join('') +
        outputs.map(o=>`<td class="${o.value?'one':'zero'}">${o.value?1:0}</td>`).join('') + '</tr>';
    }
    html += '</table>';
    box.innerHTML = html;
    inputs.forEach(i=> i.value = savedVals[i.id]);
    runSimulation();
  };

  // ---------- IDENTIFY EQUIVALENT GATE ----------
  // Known truth-table patterns (as bit columns, MSB-first input ordering matching truthColumnFor)
  function patternFor(fn, n){
    const rows = Math.pow(2,n);
    const col = [];
    for(let r=0;r<rows;r++){
      const bits = [];
      for(let b=n-1;b>=0;b--) bits.push((r>>b)&1);
      col.push(fn(bits)?1:0);
    }
    return col;
  }
  function sameCol(a,b){ return a.length===b.length && a.every((v,i)=>v===b[i]); }

  const PATTERNS_1 = [
    {name:'BUFFER (Y = A)', fn: b=>!!b[0]},
    {name:'NOT (Y = ¬A)', fn: b=>!b[0]},
    {name:'CONSTANT 0 (always LOW)', fn: ()=>false},
    {name:'CONSTANT 1 (always HIGH)', fn: ()=>true},
  ];
  const PATTERNS_2 = [
    {name:'AND', fn: b=> b[0]&&b[1]},
    {name:'OR', fn: b=> b[0]||b[1]},
    {name:'NAND', fn: b=> !(b[0]&&b[1])},
    {name:'NOR', fn: b=> !(b[0]||b[1])},
    {name:'XOR', fn: b=> (b[0]?1:0)^(b[1]?1:0) === 1},
    {name:'XNOR', fn: b=> ((b[0]?1:0)^(b[1]?1:0)) === 0},
    {name:'Only depends on first input (A)', fn: b=> !!b[0]},
    {name:'Only depends on second input (B), inverted', fn: b=> !b[1]},
    {name:'Only depends on first input (A), inverted', fn: b=> !b[0]},
    {name:'Only depends on second input (B)', fn: b=> !!b[1]},
    {name:'CONSTANT 0 (always LOW)', fn: ()=>false},
    {name:'CONSTANT 1 (always HIGH)', fn: ()=>true},
  ];

  document.getElementById('btnIdentify').onclick = ()=>{
    const inputs = Object.values(nodes).filter(n=>n.type==='INPUT');
    const outputs = Object.values(nodes).filter(n=>n.type==='OUTPUT');
    const box = document.getElementById('identifyBox');
    if(inputs.length===0 || outputs.length===0){
      box.textContent = 'Add INPUT and OUTPUT nodes, then wire some gates between them.';
      return;
    }
    if(inputs.length > 8){
      box.textContent = 'Too many inputs to identify (limit 8).';
      return;
    }
    const savedVals = inputs.map(i=>i.value);
    const lines = outputs.map(o=>{
      const col = truthColumnFor(o.id, inputs);
      let candidates = inputs.length===1 ? PATTERNS_1 : (inputs.length===2 ? PATTERNS_2 : []);
      let match = null;
      for(const p of candidates){
        if(sameCol(col, patternFor(p.fn, inputs.length))){ match = p.name; break; }
      }
      if(!match){
        if(col.every(v=>v===0)) match = 'CONSTANT 0 (always LOW)';
        else if(col.every(v=>v===1)) match = 'CONSTANT 1 (always HIGH)';
        else match = `Custom logic function (${inputs.length} inputs) — not a standard single gate`;
      }
      return `<b>${o.id}</b> behaves like: <span style="color:var(--trace)">${match}</span>`;
    });
    inputs.forEach((inp,idx)=> inp.value = savedVals[idx]);
    runSimulation();
    box.innerHTML = lines.join('<br><br>');
  };

  // ---------- CLEAR ----------
  document.getElementById('btnClear').onclick = ()=>{
    if(!confirm('Clear the entire board?')) return;
    nodes = {}; wires = []; nextId=1;
    canvas.querySelectorAll('.node').forEach(n=>n.remove());
    drawWires();
    document.getElementById('exprBox').textContent='—';
    document.getElementById('identifyBox').textContent='—';
    document.getElementById('truthBox').innerHTML='<p class="empty-note">No outputs yet.</p>';
  };

  // ---------- SAVE / LOAD (persistent via window.storage) ----------
  function serialize(){
    return JSON.stringify({
      nodes: Object.values(nodes).map(n=>({id:n.id,type:n.type,x:n.x,y:n.y,value:n.type==='INPUT'?n.value:null})),
      wires: wires.map(w=>({from:w.from,to:w.to})),
      nextId
    });
  }

  function loadFromData(data){
    nodes = {}; wires = [];
    canvas.querySelectorAll('.node').forEach(n=>n.remove());
    data.nodes.forEach(n=>{
      nodes[n.id] = {id:n.id, type:n.type, x:n.x, y:n.y, value:n.value, name:n.id};
    });
    nextId = data.nextId || 1;
    Object.values(nodes).forEach(renderNode);
    wires = data.wires.map((w,i)=>({id:'w'+i+'_'+Date.now(), from:w.from, to:w.to}));
    drawWires();
    runSimulation();
  }

  async function refreshSavedList(){
    const list = document.getElementById('savedList');
    try{
      const res = await window.storage.list('circuit:', false);
      if(!res || !res.keys || res.keys.length===0){
        list.innerHTML = '<p class="empty-note">Nothing saved yet.</p>';
        return;
      }
      list.innerHTML = '';
      for(const key of res.keys){
        const name = key.replace('circuit:','');
        const row = document.createElement('div');
        row.className='saved-item';
        row.innerHTML = `<span>${name}</span><span><button data-load="${key}">Load</button> <button data-del="${key}">Del</button></span>`;
        list.appendChild(row);
      }
      list.querySelectorAll('[data-load]').forEach(b=>{
        b.onclick = async ()=>{
          try{
            const r = await window.storage.get(b.dataset.load, false);
            if(r) loadFromData(JSON.parse(r.value));
            statusText.textContent = 'Circuit loaded.';
          }catch(e){ statusText.textContent='Could not load circuit.'; }
        };
      });
      list.querySelectorAll('[data-del]').forEach(b=>{
        b.onclick = async ()=>{
          try{ await window.storage.delete(b.dataset.del, false); refreshSavedList(); }catch(e){}
        };
      });
    }catch(e){
      list.innerHTML = '<p class="empty-note">Storage unavailable.</p>';
    }
  }

  document.getElementById('btnSave').onclick = async ()=>{
    if(Object.keys(nodes).length===0){ statusText.textContent='Nothing to save.'; return; }
    const name = prompt('Name this circuit:', 'circuit-'+Date.now());
    if(!name) return;
    try{
      await window.storage.set('circuit:'+name, serialize(), false);
      statusText.textContent = 'Saved "'+name+'".';
      refreshSavedList();
    }catch(e){
      statusText.textContent = 'Save failed — storage may not be available here.';
    }
  };

  // ---------- EXPORT / IMPORT JSON FILE ----------
  document.getElementById('btnExport').onclick = ()=>{
    const blob = new Blob([serialize()], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'circuit.json'; a.click();
    URL.revokeObjectURL(url);
  };
  document.getElementById('btnImport').onclick = ()=> document.getElementById('fileImport').click();
  document.getElementById('fileImport').onchange = (e)=>{
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = (ev)=>{
      try{
        const data = JSON.parse(ev.target.result);
        loadFromData(data);
        statusText.textContent = 'Circuit imported.';
      }catch(err){ statusText.textContent = 'Invalid file.'; }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // demo starter circuit: OR -> NOT, which together behave like NOR
  addNode('INPUT', 60, 80);
  addNode('INPUT', 60, 200);
  addNode('OR', 260, 140);
  addNode('NOT', 460, 140);
  addNode('OUTPUT', 640, 140);
  wires.push({id:uid('w'), from:{node:'n1',pin:0}, to:{node:'n3',pin:0}});
  wires.push({id:uid('w'), from:{node:'n2',pin:0}, to:{node:'n3',pin:1}});
  wires.push({id:uid('w'), from:{node:'n3',pin:0}, to:{node:'n4',pin:0}});
  wires.push({id:uid('w'), from:{node:'n4',pin:0}, to:{node:'n5',pin:0}});
  drawWires();
  runSimulation();
  refreshSavedList();
})();
