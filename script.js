'use strict';
/* ═══════════════ GATE DEFINITIONS ════════════════════════════ */
const GATE_DEFS = {
  INPUT:      {numIns:0,numOuts:1,label:'IN',      variable:false},
  OUTPUT:     {numIns:1,numOuts:0,label:'OUT',     variable:false},
  AND:        {numIns:2,numOuts:1,label:'AND',     variable:true},
  OR:         {numIns:2,numOuts:1,label:'OR',      variable:true},
  NOT:        {numIns:1,numOuts:1,label:'NOT',     variable:false},
  NAND:       {numIns:2,numOuts:1,label:'NAND',    variable:true},
  NOR:        {numIns:2,numOuts:1,label:'NOR',     variable:true},
  XOR:        {numIns:2,numOuts:1,label:'XOR',     variable:true},
  XNOR:       {numIns:2,numOuts:1,label:'XNOR',   variable:true},
  BUFFER:     {numIns:1,numOuts:1,label:'BUF',     variable:false},
  /* MUX: data inputs first, then select lines */
  MUX_2_1:   {numIns:3, numOuts:1,label:'MUX 2:1',variable:false,dataCnt:2,selCnt:1,
               pinLabels:['D0','D1','S0']},
  MUX_4_1:   {numIns:6, numOuts:1,label:'MUX 4:1',variable:false,dataCnt:4,selCnt:2,
               pinLabels:['D0','D1','D2','D3','S0','S1']},
  MUX_8_1:   {numIns:11,numOuts:1,label:'MUX 8:1',variable:false,dataCnt:8,selCnt:3,
               pinLabels:['D0','D1','D2','D3','D4','D5','D6','D7','S0','S1','S2']},
  /* DEMUX: data first, then selects */
  DEMUX_1_2: {numIns:2, numOuts:2, label:'DEMUX 1:2',variable:false,dataCnt:1,selCnt:1,
               pinLabels:['D','S0'],outLabels:['Y0','Y1']},
  DEMUX_1_4: {numIns:3, numOuts:4, label:'DEMUX 1:4',variable:false,dataCnt:1,selCnt:2,
               pinLabels:['D','S0','S1'],outLabels:['Y0','Y1','Y2','Y3']},
  DEMUX_1_8: {numIns:4, numOuts:8, label:'DEMUX 1:8',variable:false,dataCnt:1,selCnt:3,
               pinLabels:['D','S0','S1','S2'],outLabels:['Y0','Y1','Y2','Y3','Y4','Y5','Y6','Y7']},
};

/* ═══════════════ STATE ════════════════════════════════════════ */
let nodes={}, wires=[], nextId=1, wireDraft=null, dragNode=null, dragOffset={x:0,y:0}, selectedId=null;
const canvas=document.getElementById('canvas');
const svgEl=document.getElementById('wires');
const statusText=document.getElementById('statusText');
const canvasWrap=document.getElementById('canvasWrap');

/* ═══════════════ HELPERS ═══════════════════════════════════════ */
const uid=p=>p+(nextId++);
const getDef=n=>GATE_DEFS[n.type];
const getNumIns=n=>n.numIns!=null?n.numIns:getDef(n).numIns;
const getNumOuts=n=>getDef(n).numOuts;
const getWireIn=(nid,pin)=>wires.find(w=>w.to.node===nid&&w.to.pin===pin);

/* ═══════════════ ADD NODE ══════════════════════════════════════ */
function addNode(type,x,y,overrides={}){
  const id=uid('n'), def=GATE_DEFS[type];
  const node={id,type,x:x||80,y:y||80,
    value:type==='INPUT'?false:null,
    outValues:def.numOuts>1?new Array(def.numOuts).fill(false):null,
    name:(type==='INPUT'||type==='OUTPUT')?id:null,
    numIns:def.numIns,...overrides};
  nodes[id]=node; renderNode(node); return node;
}

/* ═══════════════ RENDER NODE ═══════════════════════════════════ */
function renderNode(node){
  let el=document.getElementById(node.id);
  if(!el){el=document.createElement('div');el.className='node';el.id=node.id;canvas.appendChild(el);}
  const def=getDef(node), numIns=getNumIns(node), numOuts=getNumOuts(node);
  const isMux=node.type.startsWith('MUX_'), isDemux=node.type.startsWith('DEMUX_');
  const minH=Math.max(76,Math.max(numIns,numOuts)*24+44);
  el.style.left=node.x+'px'; el.style.top=node.y+'px'; el.style.minHeight=minH+'px';
  el.className='node'+(selectedId===node.id?' selected':'')+(isMux?' mux-node':'')+(isDemux?' demux-node':'');

  let html=`<div class="del-x" data-del="${node.id}">×</div>`;
  html+=`<div class="glabel">${def.label}</div>`;
  if(node.type!=='INPUT'&&node.type!=='OUTPUT'){
    const lbl=gateExprLabel(node.id,0);
    html+=`<div class="gexpr" title="${lbl}">${lbl||'&nbsp;'}</div>`;
  }
  if(node.type==='INPUT'){
    html+=`<div class="gname" data-rename="${node.id}">${node.name||node.id}</div>`;
    html+=`<div class="input-toggle${node.value?' on':''}"><div class="knob"></div></div>`;
  }
  if(node.type==='OUTPUT'){
    html+=`<div class="gname">${node.name||node.id}</div>`;
    html+=`<div class="out-led${node.value?' on':''}"></div>`;
  }
  html+=`<div class="gsub">${node.id}${def.variable?' · '+numIns+'in':''}</div>`;
  el.innerHTML=html;

  el.querySelector('.del-x').onclick=e=>{e.stopPropagation();deleteNode(node.id);};
  if(node.type==='INPUT'){
    el.querySelector('.input-toggle').onclick=e=>{e.stopPropagation();node.value=!node.value;renderNode(node);refreshGateLabels();drawWires();};
    el.querySelector('[data-rename]').ondblclick=e=>{e.stopPropagation();const n=prompt('Rename input:',node.name||node.id);if(n&&n.trim()){node.name=n.trim();renderNode(node);refreshGateLabels();}};
  }
  el.onmousedown=e=>{if(e.target.closest('.pin,.del-x,.input-toggle,.knob,[data-rename]'))return;dragNode=node;const r=el.getBoundingClientRect();dragOffset.x=e.clientX-r.left;dragOffset.y=e.clientY-r.top;selectNode(node.id);};

  /* output pins */
  for(let i=0;i<numOuts;i++){
    const p=document.createElement('div'); p.className='pin pin-out';
    const frac=numOuts===1?0.5:(i+1)/(numOuts+1);
    p.style.top=(frac*100)+'%'; p.style.transform='translateY(-50%)';
    const val=numOuts>1?(node.outValues&&node.outValues[i]):!!node.value;
    if(val)p.classList.add('hi');
    if(def.outLabels){const lb=document.createElement('span');lb.className='pin-lbl-out';lb.textContent=def.outLabels[i];p.appendChild(lb);}
    p.dataset.node=node.id;p.dataset.kind='out';p.dataset.pin=i;
    p.onclick=e=>{e.stopPropagation();handlePinClick(node.id,'out',i);};
    el.appendChild(p);
  }
  /* input pins */
  for(let i=0;i<numIns;i++){
    const p=document.createElement('div'); p.className='pin pin-in';
    const frac=numIns===1?0.5:(i+1)/(numIns+1);
    p.style.top=(frac*100)+'%'; p.style.transform='translateY(-50%)';
    if(def.pinLabels&&def.pinLabels[i]){
      const isSel=def.pinLabels[i].startsWith('S');
      if(isSel)p.classList.add(isDemux?'demux-sel':'mux-sel');
      const lb=document.createElement('span');
      lb.className='pin-lbl'+(isSel?(isDemux?' pin-lbl-demsel':' pin-lbl-sel'):'');
      lb.textContent=def.pinLabels[i];p.appendChild(lb);
    }
    p.dataset.node=node.id;p.dataset.kind='in';p.dataset.pin=i;
    p.onclick=e=>{e.stopPropagation();handlePinClick(node.id,'in',i);};
    el.appendChild(p);
  }
}

/* ═══════════════ SELECT ════════════════════════════════════════ */
function selectNode(id){
  selectedId=id;
  document.querySelectorAll('.node').forEach(el=>el.classList.remove('selected'));
  if(id&&document.getElementById(id))document.getElementById(id).classList.add('selected');
  renderPropPanel();
}
function renderPropPanel(){
  const panel=document.getElementById('propContent');
  const node=nodes[selectedId];
  if(!node){panel.innerHTML='<p class="hint">Click a node to select it.</p>';return;}
  const def=getDef(node), numIns=getNumIns(node);
  let html=`<p class="hint" style="margin:0 0 5px"><b>${def.label}</b> &nbsp;·&nbsp; <small>${node.id}</small></p>`;
  if(node.type==='INPUT'){
    html+=`<label class="prop-label">Name (or double-click node)</label>
           <input type="text" id="propName" value="${node.name||''}" placeholder="A, B, C …" style="margin-bottom:5px">`;
  }
  if(def.variable){
    html+=`<label class="prop-label" style="margin-top:6px">Input count (2 – 6)</label>
           <div class="prop-row"><button id="propMinus">−</button><span id="propCount">${numIns}</span><button id="propPlus">+</button></div>`;
  }
  if(node.type!=='INPUT'&&node.type!=='OUTPUT'){
    html+=`<label class="prop-label" style="margin-top:4px">Live expression</label>
           <div class="expr-box" style="font-size:10px">${gateExprLabel(node.id,0)||'—'}</div>`;
  }
  panel.innerHTML=html;
  const nameInp=panel.querySelector('#propName');
  if(nameInp)nameInp.oninput=()=>{node.name=nameInp.value.trim()||node.id;renderNode(node);refreshGateLabels();};
  const plusBtn=panel.querySelector('#propPlus'), minusBtn=panel.querySelector('#propMinus'), countEl=panel.querySelector('#propCount');
  if(plusBtn){
    plusBtn.onclick=()=>{if(node.numIns<8){node.numIns++;if(countEl)countEl.textContent=node.numIns;renderNode(node);drawWires();refreshGateLabels();}};
    minusBtn.onclick=()=>{if(node.numIns>2){const last=node.numIns-1;wires=wires.filter(w=>!(w.to.node===node.id&&w.to.pin===last));node.numIns--;if(countEl)countEl.textContent=node.numIns;renderNode(node);drawWires();refreshGateLabels();}};
  }
}

/* ═══════════════ DELETE ════════════════════════════════════════ */
function deleteNode(id){
  if(selectedId===id){selectedId=null;renderPropPanel();}
  delete nodes[id]; wires=wires.filter(w=>w.from.node!==id&&w.to.node!==id);
  const el=document.getElementById(id);if(el)el.remove();
  drawWires();refreshGateLabels();
}

/* ═══════════════ DRAG ═════════════════════════════════════════ */
canvasWrap.addEventListener('mousemove',e=>{
  if(!dragNode)return;
  const r=canvasWrap.getBoundingClientRect();
  dragNode.x=Math.max(0,e.clientX-r.left+canvasWrap.scrollLeft-dragOffset.x);
  dragNode.y=Math.max(0,e.clientY-r.top+canvasWrap.scrollTop-dragOffset.y);
  const el=document.getElementById(dragNode.id);
  el.style.left=dragNode.x+'px';el.style.top=dragNode.y+'px';drawWires();
});
document.addEventListener('mouseup',()=>{dragNode=null;});
canvasWrap.addEventListener('click',e=>{if(e.target===canvasWrap||e.target===canvas||e.target===svgEl){wireDraft=null;selectNode(null);}});

/* ═══════════════ WIRING ════════════════════════════════════════ */
function handlePinClick(nodeId,kind,pinIdx){
  if(kind==='out'){
    wireDraft={fromNode:nodeId,fromPin:pinIdx};
    statusText.textContent='Now click an input pin (left ●) to connect. Click canvas to cancel.';
  }else{
    if(!wireDraft){statusText.textContent='Start from an output pin (right ●) first.';return;}
    if(wireDraft.fromNode===nodeId){statusText.textContent='Cannot connect to self.';wireDraft=null;return;}
    wires=wires.filter(w=>!(w.to.node===nodeId&&w.to.pin===pinIdx));
    wires.push({id:uid('w'),from:{node:wireDraft.fromNode,pin:wireDraft.fromPin},to:{node:nodeId,pin:pinIdx}});
    wireDraft=null; statusText.textContent='✓ Wire connected — hit Simulate to update.';
    drawWires();refreshGateLabels();
  }
}

/* ═══════════════ PIN POSITIONS ═════════════════════════════════ */
function pinPos(nodeId,kind,pinIdx){
  const node=nodes[nodeId], el=document.getElementById(nodeId);
  if(!node||!el)return{x:0,y:0};
  const numIns=getNumIns(node), numOuts=getNumOuts(node);
  const w=el.offsetWidth, h=el.offsetHeight;
  if(kind==='out'){const frac=numOuts===1?0.5:(pinIdx+1)/(numOuts+1);return{x:node.x+w+5,y:node.y+h*frac};}
  const frac=numIns===1?0.5:(pinIdx+1)/(numIns+1);
  return{x:node.x-5,y:node.y+h*frac};
}

/* ═══════════════ DRAW WIRES ════════════════════════════════════ */
function drawWires(){
  svgEl.innerHTML='';
  wires.forEach(w=>{
    const a=pinPos(w.from.node,'out',w.from.pin), b=pinPos(w.to.node,'in',w.to.pin);
    const midX=(a.x+b.x)/2;
    const path=document.createElementNS('http://www.w3.org/2000/svg','path');
    path.setAttribute('d',`M ${a.x} ${a.y} C ${midX} ${a.y}, ${midX} ${b.y}, ${b.x} ${b.y}`);
    const fn=nodes[w.from.node];
    const live=fn&&(getNumOuts(fn)>1?(fn.outValues&&fn.outValues[w.from.pin]):!!fn.value);
    path.setAttribute('stroke',live?'#39ff8f':'#3a4a40');
    path.setAttribute('stroke-width',live?'2.5':'1.8');
    path.setAttribute('fill','none');
    path.style.pointerEvents='stroke';path.style.cursor='pointer';
    path.onclick=()=>{wires=wires.filter(x=>x.id!==w.id);drawWires();refreshGateLabels();};
    svgEl.appendChild(path);
  });
}

/* ═══════════════ GATE EXPRESSION LABEL (on-gate) ══════════════ */
function gateExprLabel(nodeId,depth){
  const node=nodes[nodeId]; if(!node)return'?';
  if(node.type==='INPUT')return node.name||node.id;
  if(node.type==='OUTPUT')return'';
  if(depth>2)return'[…]';
  const n=getNumIns(node), parts=[];
  for(let i=0;i<n;i++){const w=getWireIn(nodeId,i);parts.push(w?gateExprLabel(w.from.node,depth+1):'?');}
  switch(node.type){
    case 'AND':   return parts.join('·');
    case 'OR':    return parts.join('+');
    case 'NOT':   return`¬${parts[0]}`;
    case 'NAND':  return`¬(${parts.join('·')})`;
    case 'NOR':   return`¬(${parts.join('+')})`;
    case 'XOR':   return parts.join('⊕');
    case 'XNOR':  return`¬(${parts.join('⊕')})`;
    case 'BUFFER':return parts[0];
    case 'MUX_2_1':return`MUX(${parts[0]},${parts[1]};${parts[2]})`;
    case 'MUX_4_1':return`MUX4(D0-3;${parts[4]},${parts[5]})`;
    case 'MUX_8_1':return`MUX8(D0-7;S)`;
    case 'DEMUX_1_2':return`DMUX(${parts[0]};${parts[1]})`;
    case 'DEMUX_1_4':return`DMUX4(${parts[0]};S)`;
    case 'DEMUX_1_8':return`DMUX8(${parts[0]};S)`;
    default:return'';
  }
}
function refreshGateLabels(){
  Object.values(nodes).forEach(node=>{
    if(node.type==='INPUT'||node.type==='OUTPUT')return;
    const el=document.getElementById(node.id); if(!el)return;
    const e2=el.querySelector('.gexpr');
    if(e2){const l=gateExprLabel(node.id,0);e2.textContent=l||' ';e2.title=l;}
  });
  if(selectedId&&nodes[selectedId]&&nodes[selectedId].type!=='INPUT'&&nodes[selectedId].type!=='OUTPUT'){
    const eb=document.querySelector('#propContent .expr-box');
    if(eb)eb.textContent=gateExprLabel(selectedId,0)||'—';
  }
}

/* ═══════════════ PALETTE ═══════════════════════════════════════ */
document.querySelectorAll('.gate-btn').forEach(btn=>{
  btn.addEventListener('click',()=>{
    const type=btn.dataset.type, cnt=Object.keys(nodes).length;
    const x=90+(cnt%7)*32, y=90+Math.floor(cnt/7)*130+Math.random()*20;
    addNode(type,x,y); drawWires();
  });
});

/* ═══════════════ COMPUTE VALUE ════════════════════════════════ */
function computeValue(nodeId,outPin=0,vis=new Set()){
  const node=nodes[nodeId]; if(!node)return false;
  if(node.type==='INPUT')return!!node.value;
  if(vis.has(nodeId))return false;
  vis.add(nodeId);
  const n=getNumIns(node), ins=[];
  for(let i=0;i<n;i++){const w=getWireIn(nodeId,i);ins.push(w?computeValue(w.from.node,w.from.pin,new Set(vis)):false);}
  switch(node.type){
    case 'OUTPUT': return!!ins[0];
    case 'AND':    return ins.every(Boolean);
    case 'OR':     return ins.some(Boolean);
    case 'NOT':    return!ins[0];
    case 'NAND':   return!ins.every(Boolean);
    case 'NOR':    return!ins.some(Boolean);
    case 'XOR':    return ins.filter(Boolean).length%2===1;
    case 'XNOR':   return!(ins.filter(Boolean).length%2===1);
    case 'BUFFER': return!!ins[0];
    /* ── MUX ── */
    case 'MUX_2_1':{const sel=ins[2]?1:0;return!!ins[sel];}
    case 'MUX_4_1':{const sel=((ins[5]?1:0)<<1)|(ins[4]?1:0);return!!ins[Math.min(sel,3)];}
    case 'MUX_8_1':{const sel=((ins[10]?1:0)<<2)|((ins[9]?1:0)<<1)|(ins[8]?1:0);return!!ins[Math.min(sel,7)];}
    /* ── DEMUX ── */
    case 'DEMUX_1_2':{const sel=ins[1]?1:0;return!!ins[0]&&sel===outPin;}
    case 'DEMUX_1_4':{const sel=((ins[2]?1:0)<<1)|(ins[1]?1:0);return!!ins[0]&&sel===outPin;}
    case 'DEMUX_1_8':{const sel=((ins[3]?1:0)<<2)|((ins[2]?1:0)<<1)|(ins[1]?1:0);return!!ins[0]&&sel===outPin;}
    default:return false;
  }
}

/* ═══════════════ SIMULATE ══════════════════════════════════════ */
function runSimulation(){
  Object.values(nodes).forEach(node=>{
    if(node.type==='INPUT')return;
    const no=getNumOuts(node);
    if(no>1){node.outValues=Array.from({length:no},(_,i)=>computeValue(node.id,i));node.value=node.outValues[0];}
    else node.value=computeValue(node.id,0);
    renderNode(node);
  });
  drawWires();refreshGateLabels();
}
document.getElementById('btnSimulate').onclick=()=>{
  if(!Object.keys(nodes).length){statusText.textContent='Add some gates first.';return;}
  runSimulation();statusText.textContent='✓ Simulation complete.';
};

/* ═══════════════ FULL BOOLEAN EXPRESSION ═══════════════════════ */
function exprFor(nodeId,vis=new Set()){
  const node=nodes[nodeId]; if(!node)return'?';
  if(node.type==='INPUT')return node.name||node.id;
  if(vis.has(nodeId))return'(cycle)'; vis.add(nodeId);
  const n=getNumIns(node), parts=[];
  for(let i=0;i<n;i++){const w=getWireIn(nodeId,i);parts.push(w?exprFor(w.from.node,new Set(vis)):'0');}
  switch(node.type){
    case 'OUTPUT': return parts[0];
    case 'AND':    return`(${parts.join(' · ')})`;
    case 'OR':     return`(${parts.join(' + ')})`;
    case 'NOT':    return`¬${parts[0]}`;
    case 'NAND':   return`¬(${parts.join(' · ')})`;
    case 'NOR':    return`¬(${parts.join(' + ')})`;
    case 'XOR':    return`(${parts.join(' ⊕ ')})`;
    case 'XNOR':   return`¬(${parts.join(' ⊕ ')})`;
    case 'BUFFER': return parts[0];
    default:       return`${node.type}(${parts.join(',')})`;
  }
}
document.getElementById('btnExpr').onclick=()=>{
  const outputs=Object.values(nodes).filter(n=>n.type==='OUTPUT');
  const box=document.getElementById('exprBox');
  if(!outputs.length){box.textContent='No OUTPUT node found.';return;}
  box.innerHTML=outputs.map(o=>{const w=getWireIn(o.id,0);return`<b>${o.name||o.id}</b> = ${w?exprFor(o.id):'0'}`;}).join('<br>');
};

/* ═══════════════ TRUTH TABLE ═══════════════════════════════════ */
function truthCol(outputId,inputs,outPin=0){
  const saved=inputs.map(i=>i.value), col=[], rows=1<<inputs.length;
  for(let r=0;r<rows;r++){
    inputs.forEach((inp,b)=>{inp.value=!!((r>>(inputs.length-1-b))&1);});
    col.push(computeValue(outputId,outPin)?1:0);
  }
  inputs.forEach((inp,i)=>{inp.value=saved[i];}); return col;
}
document.getElementById('btnTruth').onclick=()=>{
  const inputs=Object.values(nodes).filter(n=>n.type==='INPUT');
  const outputs=Object.values(nodes).filter(n=>n.type==='OUTPUT');
  const box=document.getElementById('truthBox');
  if(!inputs.length||!outputs.length){box.innerHTML='<p class="empty-note">Need INPUT and OUTPUT nodes.</p>';return;}
  if(inputs.length>8){box.innerHTML='<p class="empty-note">Limit: 8 inputs for truth table.</p>';return;}
  const rows=1<<inputs.length;
  let html='<table><tr>'+inputs.map(i=>`<th>${i.name||i.id}</th>`).join('')+outputs.map(o=>`<th>${o.name||o.id}</th>`).join('')+'</tr>';
  const saved=inputs.map(i=>i.value);
  for(let r=0;r<rows;r++){
    const bits=inputs.map((_,b)=>(r>>(inputs.length-1-b))&1);
    inputs.forEach((inp,i)=>{inp.value=!!bits[i];});
    const ov=outputs.map(o=>computeValue(o.id,0)?1:0);
    html+='<tr>'+bits.map(b=>`<td class="${b?'one':'zero'}">${b}</td>`).join('')+ov.map(v=>`<td class="${v?'one':'zero'}">${v}</td>`).join('')+'</tr>';
  }
  html+='</table>'; box.innerHTML=html;
  inputs.forEach((inp,i)=>{inp.value=saved[i];}); runSimulation();
};

/* ═══════════════ SOP / POS FROM CIRCUIT ════════════════════════ */
function computeCanonical(inputs,outputId){
  const saved=inputs.map(i=>i.value), n=inputs.length, rows=1<<n;
  const minterms=[], maxterms=[];
  for(let r=0;r<rows;r++){
    inputs.forEach((inp,b)=>{inp.value=!!((r>>(n-1-b))&1);});
    const v=computeValue(outputId,0)?1:0;
    if(v===1)minterms.push(r); else maxterms.push(r);
  }
  inputs.forEach((inp,i)=>{inp.value=saved[i];});
  return{minterms,maxterms};
}
function mintermExpr(idx,varNames){
  const n=varNames.length;
  return varNames.map((v,i)=>{const bit=(idx>>(n-1-i))&1;return bit?v:`¬${v}`;}).join('·');
}
function maxtermExpr(idx,varNames){
  const n=varNames.length;
  return'('+varNames.map((v,i)=>{const bit=(idx>>(n-1-i))&1;return bit?`¬${v}`:v;}).join('+')+')';
}
document.getElementById('btnSOPCircuit').onclick=()=>{
  const inputs=Object.values(nodes).filter(n=>n.type==='INPUT');
  const outputs=Object.values(nodes).filter(n=>n.type==='OUTPUT');
  const box=document.getElementById('circuitSopBox');
  if(!inputs.length||!outputs.length){box.textContent='Simulate a circuit with INPUT and OUTPUT nodes first.';return;}
  if(inputs.length>6){box.textContent='Limit 6 inputs for SOP/POS display.';return;}
  runSimulation();
  const varNames=inputs.map(i=>i.name||i.id);
  let html='';
  outputs.forEach(o=>{
    const{minterms,maxterms}=computeCanonical(inputs,o.id);
    const oName=o.name||o.id;
    const sopTerms=minterms.map(m=>mintermExpr(m,varNames));
    const posTerms=maxterms.map(m=>maxtermExpr(m,varNames));
    const sopStr=minterms.length?`Σm(${minterms.join(',')}) = ${sopTerms.join(' + ')}`:'Always 0';
    const posStr=maxterms.length?`ΠM(${maxterms.join(',')}) = ${posTerms.join('·')}`:'Always 1';
    html+=`<b>${oName}</b><br>
      <span style="color:#7e9388;font-size:9px">SOP:</span> ${sopStr}<br>
      <span style="color:#7e9388;font-size:9px">POS:</span> ${posStr}<br><br>`;
  });
  box.innerHTML=html||'—';
  statusText.textContent='✓ SOP/POS computed from circuit.';
};

/* ═══════════════ IDENTIFY GATE ═════════════════════════════════ */
function makePat(fn,n){return Array.from({length:1<<n},(_,r)=>{const b=Array.from({length:n},(_,i)=>(r>>(n-1-i))&1);return fn(b)?1:0;});}
const sameCol=(a,b)=>a.length===b.length&&a.every((v,i)=>v===b[i]);
const KNOWN={
  1:[{n:'BUFFER',f:b=>b[0]},{n:'NOT',f:b=>!b[0]},{n:'CONST 0',f:()=>0},{n:'CONST 1',f:()=>1}],
  2:[{n:'AND',f:b=>b[0]&b[1]},{n:'OR',f:b=>b[0]|b[1]},{n:'NAND',f:b=>!(b[0]&b[1])},
     {n:'NOR',f:b=>!(b[0]|b[1])},{n:'XOR',f:b=>b[0]^b[1]},{n:'XNOR',f:b=>!(b[0]^b[1])},
     {n:'A implies B (¬A+B)',f:b=>!b[0]||b[1]},{n:'A inhibits B (A·¬B)',f:b=>b[0]&&!b[1]},
     {n:'CONST 0',f:()=>0},{n:'CONST 1',f:()=>1}],
  3:[{n:'3-input AND',f:b=>b[0]&b[1]&b[2]},{n:'3-input OR',f:b=>b[0]|b[1]|b[2]},
     {n:'3-input NAND',f:b=>!(b[0]&b[1]&b[2])},{n:'3-input NOR',f:b=>!(b[0]|b[1]|b[2])},
     {n:'3-input XOR (odd parity)',f:b=>b[0]^b[1]^b[2]},{n:'3-input XNOR',f:b=>!(b[0]^b[1]^b[2])},
     {n:'Majority (≥2 of 3)',f:b=>(b[0]+b[1]+b[2])>=2},{n:'CONST 0',f:()=>0},{n:'CONST 1',f:()=>1}],
};
document.getElementById('btnIdentify').onclick=()=>{
  const inputs=Object.values(nodes).filter(n=>n.type==='INPUT');
  const outputs=Object.values(nodes).filter(n=>n.type==='OUTPUT');
  const box=document.getElementById('identifyBox');
  if(!inputs.length||!outputs.length){box.textContent='Add INPUT and OUTPUT nodes first.';return;}
  if(inputs.length>8){box.textContent='Too many inputs.';return;}
  const saved=inputs.map(i=>i.value);
  const lines=outputs.map(o=>{
    const col=truthCol(o.id,inputs);
    const patterns=KNOWN[inputs.length]||[];
    let match=null;
    for(const p of patterns)if(sameCol(col,makePat(p.f,inputs.length))){match=p.n;break;}
    if(!match){if(col.every(v=>v===0))match='CONST 0';else if(col.every(v=>v===1))match='CONST 1';else match=`Custom (${inputs.length}-input)`;}
    return`<b>${o.name||o.id}</b> ≡ <span style="color:var(--trace)">${match}</span>`;
  });
  inputs.forEach((inp,i)=>{inp.value=saved[i];}); runSimulation();
  box.innerHTML=lines.join('<br><br>');
};

/* ═══════════════ EXPRESSION PARSER ════════════════════════════ */
function tokenize(str){
  const toks=[]; let i=0;
  while(i<str.length){
    const c=str[i];
    if(/\s/.test(c)){i++;continue;}
    if(c==='('){toks.push({t:'LP'});i++;continue;}
    if(c===')'){toks.push({t:'RP'});i++;continue;}
    if(c==='+'||c==='∨'){toks.push({t:'OR'});i++;continue;}
    if(c==='|'){if(str[i+1]==='|')i++;toks.push({t:'OR'});i++;continue;}
    if(c==='*'||c==='∧'||c==='.'){toks.push({t:'AND'});i++;continue;}
    if(c==='&'){if(str[i+1]==='&')i++;toks.push({t:'AND'});i++;continue;}
    if(c==='!'||c==='~'||c==='¬'){toks.push({t:'NOT'});i++;continue;}
    if(c==='^'||c==='⊕'){toks.push({t:'XOR'});i++;continue;}
    if(/[A-Za-z]/.test(c)){
      let w='';while(i<str.length&&/[A-Za-z0-9_]/.test(str[i]))w+=str[i++];
      const kw={AND:'AND',OR:'OR',NOT:'NOT',XOR:'XOR',NAND:'NAND',NOR:'NOR',XNOR:'XNOR',BUFFER:'BUFFER'}[w.toUpperCase()];
      toks.push(kw?{t:kw}:{t:'VAR',v:w}); continue;
    }
    i++;
  }
  return toks;
}
function parseBoolExpr(str){
  const toks=tokenize(str); let pos=0;
  const peek=()=>toks[pos], consume=()=>toks[pos++];
  function parseOr(){
    const args=[parseXor()];
    while(peek()&&peek().t==='OR'){consume();args.push(parseXor());}
    return args.length===1?args[0]:{op:'OR',args};
  }
  function parseXor(){
    const args=[parseAnd()];
    while(peek()&&(peek().t==='XOR'||peek().t==='XNOR')){const op=consume().t;const r=parseAnd();if(op==='XNOR')return{op:'XNOR',args:[...args,r]};args.push(r);}
    return args.length===1?args[0]:{op:'XOR',args};
  }
  function parseAnd(){
    const args=[parseNot()];
    while(peek()&&(peek().t==='AND'||peek().t==='NAND')){const op=consume().t;const r=parseNot();if(op==='NAND')return{op:'NAND',args:[...args,r]};args.push(r);}
    return args.length===1?args[0]:{op:'AND',args};
  }
  function parseNot(){if(peek()&&peek().t==='NOT'){consume();return{op:'NOT',args:[parseNot()]};}return parseAtom();}
  function parseAtom(){
    if(!peek())throw new Error('Unexpected end');
    if(peek().t==='LP'){consume();const e=parseOr();if(!peek()||peek().t!=='RP')throw new Error('Missing )');consume();return e;}
    if(peek().t==='VAR')return{op:'VAR',name:consume().v};
    throw new Error('Unexpected: '+JSON.stringify(peek()));
  }
  return parseOr();
}

/* ═══════════════ BUILD CIRCUIT FROM EXPRESSION ═════════════════ */
function buildFromExpression(str){
  let ast;
  try{ast=parseBoolExpr(str.trim());}catch(e){statusText.textContent='⚠ Parse error: '+e.message;return;}
  const varOrder=[],varSet=new Set();
  function collectVars(n){if(n.op==='VAR'&&!varSet.has(n.name)){varOrder.push(n.name);varSet.add(n.name);}(n.args||[]).forEach(collectVars);}
  collectVars(ast);
  function astDepth(n){if(n.op==='VAR')return 0;return 1+Math.max(...(n.args||[]).map(astDepth));}
  const totalDepth=astDepth(ast), COL_W=220, START_X=80;
  const varNodeIds={};
  varOrder.forEach((name,idx)=>{const n=addNode('INPUT',START_X,80+idx*100);n.name=name;renderNode(n);varNodeIds[name]=n.id;});
  const colNextY={};
  const colY=col=>{if(colNextY[col]==null)colNextY[col]=80;const y=colNextY[col];colNextY[col]+=120;return y;};
  function build(node){
    if(node.op==='VAR')return{nodeId:varNodeIds[node.name],pin:0};
    const d=astDepth(node), x=START_X+d*COL_W, y=colY(d), numIns=(node.args||[]).length;
    const gn=addNode(node.op,x,y,{numIns}); renderNode(gn);
    (node.args||[]).forEach((child,i)=>{const{nodeId:cId,pin:cPin}=build(child);wires.push({id:uid('w'),from:{node:cId,pin:cPin},to:{node:gn.id,pin:i}});});
    return{nodeId:gn.id,pin:0};
  }
  const{nodeId:rootId}=build(ast);
  const outX=START_X+(totalDepth+1)*COL_W;
  const outNode=addNode('OUTPUT',outX,80+Math.floor((varOrder.length-1)/2)*100);
  renderNode(outNode);
  wires.push({id:uid('w'),from:{node:rootId,pin:0},to:{node:outNode.id,pin:0}});
  drawWires();runSimulation();
  statusText.textContent=`✓ Circuit built from "${str}".`;
}
document.getElementById('btnBuild').onclick=()=>{const v=document.getElementById('exprInput').value.trim();if(!v){statusText.textContent='Enter an expression first.';return;}buildFromExpression(v);};
document.getElementById('exprInput').addEventListener('keydown',e=>{if(e.key==='Enter')document.getElementById('btnBuild').click();});

/* ═══════════════ SOP / POS BUILDER ════════════════════════════ */
let sopVarNames=['A','B','C','D'];
let sopSelectedTerms=new Set();

function buildSopGrid(){
  const cnt=parseInt(document.getElementById('sopVarCount').value)||3;
  const mode=document.getElementById('sopMode').value;
  const rows=1<<cnt;
  /* variable name inputs */
  let vnHtml='';
  for(let i=0;i<cnt;i++){
    const name=sopVarNames[i]||(String.fromCharCode(65+i));
    vnHtml+=`<input type="text" class="var-inp" id="sopVar${i}" value="${name}" maxlength="4">`;
  }
  document.getElementById('sopVarNames').innerHTML=vnHtml;
  for(let i=0;i<cnt;i++){
    document.getElementById(`sopVar${i}`).oninput=e=>{sopVarNames[i]=e.target.value.trim()||String.fromCharCode(65+i);};
  }
  /* grid */
  const lbl=document.getElementById('sopGridLabel');
  lbl.textContent=mode==='SOP'?'Select minterms (output = 1):':'Select maxterms (output = 0):';
  let gHtml='';
  for(let r=0;r<rows;r++){
    const bits=Array.from({length:cnt},(_,b)=>(r>>(cnt-1-b))&1).join('');
    const isSel=sopSelectedTerms.has(r);
    gHtml+=`<div class="mt-cell${isSel?' selected':''}" data-idx="${r}">
      <div class="mt-idx">${mode==='SOP'?'m':'M'}${r}</div>
      <div class="mt-bits">${bits}</div>
    </div>`;
  }
  document.getElementById('mintermGrid').innerHTML=gHtml;
  document.querySelectorAll('.mt-cell').forEach(cell=>{
    cell.onclick=()=>{
      const idx=parseInt(cell.dataset.idx);
      if(sopSelectedTerms.has(idx))sopSelectedTerms.delete(idx);else sopSelectedTerms.add(idx);
      cell.classList.toggle('selected');
      updateSopExprDisplay();
    };
  });
  updateSopExprDisplay();
}

function updateSopExprDisplay(){
  const cnt=parseInt(document.getElementById('sopVarCount').value)||3;
  const mode=document.getElementById('sopMode').value;
  const vn=[];for(let i=0;i<cnt;i++)vn.push((document.getElementById(`sopVar${i}`)?.value||sopVarNames[i]||String.fromCharCode(65+i)));
  const sel=[...sopSelectedTerms].sort((a,b)=>a-b);
  let expr='—';
  if(mode==='SOP'){
    if(sel.length===0)expr='0 (no minterms selected)';
    else if(sel.length===1<<cnt)expr='1 (all minterms)';
    else{const terms=sel.map(m=>mintermExpr(m,vn));expr=`Σm(${sel.join(',')}) = ${terms.join(' + ')}`;}
  }else{
    if(sel.length===0)expr='1 (no maxterms selected)';
    else if(sel.length===1<<cnt)expr='0 (all maxterms)';
    else{const terms=sel.map(m=>maxtermExpr(m,vn));expr=`ΠM(${sel.join(',')}) = ${terms.join('·')}`;}
  }
  document.getElementById('sopExprDisplay').textContent=expr;
}

function buildCircuitFromSOP(mode){
  const cnt=parseInt(document.getElementById('sopVarCount').value)||3;
  const vn=[];for(let i=0;i<cnt;i++)vn.push((document.getElementById(`sopVar${i}`)?.value||sopVarNames[i]||String.fromCharCode(65+i)));
  const sel=[...sopSelectedTerms].sort((a,b)=>a-b);
  if(sel.length===0){statusText.textContent='Select at least one term first.';return;}

  /* create INPUT nodes */
  const START_X=80, COL_W=200;
  const inputIds={};
  const notIds={};
  vn.forEach((name,i)=>{
    const n=addNode('INPUT',START_X,80+i*100); n.name=name; renderNode(n); inputIds[name]=n.id;
  });

  if(mode==='SOP'){
    /* For each minterm → AND gate, then OR gate */
    const andIds=[];
    sel.forEach((m,ti)=>{
      const bits=Array.from({length:cnt},(_,b)=>(m>>(cnt-1-b))&1);
      const y=80+ti*100;
      /* NOT gates for 0-bits we haven't made yet */
      const gateInputs=[];
      vn.forEach((name,i)=>{
        if(bits[i]===0){
          /* make a NOT gate if not already or reuse */
          const key=`NOT_${name}`;
          if(!notIds[key]){
            const notN=addNode('NOT',START_X+COL_W,80+i*100);renderNode(notN);
            wires.push({id:uid('w'),from:{node:inputIds[name],pin:0},to:{node:notN.id,pin:0}});
            notIds[key]=notN.id;
          }
          gateInputs.push({node:notIds[key],pin:0});
        }else{
          gateInputs.push({node:inputIds[name],pin:0});
        }
      });
      /* AND gate (or direct if only 1 literal) */
      let outNode,outPin;
      if(gateInputs.length===1){outNode=gateInputs[0].node;outPin=0;}
      else{
        const ag=addNode('AND',START_X+COL_W*2,y,{numIns:gateInputs.length});renderNode(ag);
        gateInputs.forEach((g,pi)=>wires.push({id:uid('w'),from:{node:g.node,pin:g.pin},to:{node:ag.id,pin:pi}}));
        outNode=ag.id;outPin=0;
      }
      andIds.push({node:outNode,pin:outPin});
    });
    /* Final OR gate */
    let finalOut,finalPin;
    if(andIds.length===1){finalOut=andIds[0].node;finalPin=andIds[0].pin;}
    else{
      const midY=80+Math.floor(andIds.length/2)*100;
      const org=addNode('OR',START_X+COL_W*3,midY,{numIns:andIds.length});renderNode(org);
      andIds.forEach((a,pi)=>wires.push({id:uid('w'),from:{node:a.node,pin:a.pin},to:{node:org.id,pin:pi}}));
      finalOut=org.id;finalPin=0;
    }
    const outN=addNode('OUTPUT',START_X+COL_W*4,80+Math.floor(andIds.length/2)*100);renderNode(outN);
    wires.push({id:uid('w'),from:{node:finalOut,pin:finalPin},to:{node:outN.id,pin:0}});

  }else{
    /* POS: For each maxterm → OR gate, then AND gate */
    const orIds=[];
    sel.forEach((m,ti)=>{
      const bits=Array.from({length:cnt},(_,b)=>(m>>(cnt-1-b))&1);
      const y=80+ti*100;
      const gateInputs=[];
      vn.forEach((name,i)=>{
        if(bits[i]===1){
          const key=`NOT_${name}`;
          if(!notIds[key]){
            const notN=addNode('NOT',START_X+COL_W,80+i*100);renderNode(notN);
            wires.push({id:uid('w'),from:{node:inputIds[name],pin:0},to:{node:notN.id,pin:0}});
            notIds[key]=notN.id;
          }
          gateInputs.push({node:notIds[key],pin:0});
        }else{
          gateInputs.push({node:inputIds[name],pin:0});
        }
      });
      let outNode,outPin;
      if(gateInputs.length===1){outNode=gateInputs[0].node;outPin=0;}
      else{
        const og=addNode('OR',START_X+COL_W*2,y,{numIns:gateInputs.length});renderNode(og);
        gateInputs.forEach((g,pi)=>wires.push({id:uid('w'),from:{node:g.node,pin:g.pin},to:{node:og.id,pin:pi}}));
        outNode=og.id;outPin=0;
      }
      orIds.push({node:outNode,pin:outPin});
    });
    let finalOut,finalPin;
    if(orIds.length===1){finalOut=orIds[0].node;finalPin=orIds[0].pin;}
    else{
      const midY=80+Math.floor(orIds.length/2)*100;
      const andg=addNode('AND',START_X+COL_W*3,midY,{numIns:orIds.length});renderNode(andg);
      orIds.forEach((a,pi)=>wires.push({id:uid('w'),from:{node:a.node,pin:a.pin},to:{node:andg.id,pin:pi}}));
      finalOut=andg.id;finalPin=0;
    }
    const outN=addNode('OUTPUT',START_X+COL_W*4,80+Math.floor(orIds.length/2)*100);renderNode(outN);
    wires.push({id:uid('w'),from:{node:finalOut,pin:finalPin},to:{node:outN.id,pin:0}});
  }

  drawWires();runSimulation();
  statusText.textContent=`✓ ${mode} circuit built from selected terms.`;
}

document.getElementById('btnSOPExpr').onclick=updateSopExprDisplay;
document.getElementById('btnBuildSOP').onclick=()=>{
  const mode=document.getElementById('sopMode').value;
  buildCircuitFromSOP(mode);
};
document.getElementById('sopVarCount').onchange=()=>{sopSelectedTerms.clear();buildSopGrid();};
document.getElementById('sopMode').onchange=()=>{sopSelectedTerms.clear();buildSopGrid();};

/* ═══════════════ CLEAR ═════════════════════════════════════════ */
document.getElementById('btnClear').onclick=()=>{
  if(!confirm('Clear entire board?'))return;
  nodes={};wires=[];nextId=1;selectedId=null;wireDraft=null;
  canvas.querySelectorAll('.node').forEach(el=>el.remove());
  drawWires();
  ['exprBox','identifyBox','circuitSopBox'].forEach(id=>{document.getElementById(id).textContent='—';});
  document.getElementById('truthBox').innerHTML='<p class="empty-note">No outputs yet.</p>';
  renderPropPanel();statusText.textContent='Board cleared.';
};

/* ═══════════════ SERIALIZE / LOAD ══════════════════════════════ */
function serialize(){
  return JSON.stringify({
    nodes:Object.values(nodes).map(n=>({id:n.id,type:n.type,x:n.x,y:n.y,value:n.type==='INPUT'?n.value:null,name:n.name,numIns:n.numIns})),
    wires:wires.map(w=>({from:w.from,to:w.to})),nextId
  });
}
function loadFromData(data){
  nodes={};wires=[];
  canvas.querySelectorAll('.node').forEach(el=>el.remove());
  data.nodes.forEach(d=>{
    const def=GATE_DEFS[d.type];
    nodes[d.id]={id:d.id,type:d.type,x:d.x,y:d.y,value:d.value,name:d.name||d.id,numIns:d.numIns!=null?d.numIns:def.numIns,outValues:def.numOuts>1?new Array(def.numOuts).fill(false):null};
  });
  nextId=data.nextId||1;
  Object.values(nodes).forEach(renderNode);
  wires=data.wires.map(w=>({id:uid('w'),from:w.from,to:w.to}));
  drawWires();runSimulation();
}

async function refreshSavedList(){
  const list=document.getElementById('savedList');
  try{
    const res=await window.storage.list('circuit:',false);
    if(!res||!res.keys||!res.keys.length){list.innerHTML='<p class="empty-note">Nothing saved yet.</p>';return;}
    list.innerHTML='';
    for(const key of res.keys){
      const name=key.replace('circuit:','');
      const row=document.createElement('div'); row.className='saved-item';
      row.innerHTML=`<span>${name}</span><span><button data-load="${key}">Load</button> <button data-del="${key}">Del</button></span>`;
      list.appendChild(row);
    }
    list.querySelectorAll('[data-load]').forEach(b=>{b.onclick=async()=>{try{const r=await window.storage.get(b.dataset.load,false);if(r)loadFromData(JSON.parse(r.value));statusText.textContent='Circuit loaded.';}catch(e){statusText.textContent='Could not load.';} };});
    list.querySelectorAll('[data-del]').forEach(b=>{b.onclick=async()=>{try{await window.storage.delete(b.dataset.del,false);refreshSavedList();}catch(e){}};});
  }catch(e){list.innerHTML='<p class="empty-note">Storage unavailable.</p>';}
}
document.getElementById('btnSave').onclick=async()=>{
  if(!Object.keys(nodes).length){statusText.textContent='Nothing to save.';return;}
  const name=prompt('Name this circuit:','circuit-'+Date.now());if(!name)return;
  try{await window.storage.set('circuit:'+name,serialize(),false);statusText.textContent='✓ Saved "'+name+'".';refreshSavedList();}
  catch(e){statusText.textContent='Save failed (storage unavailable).';}
};
document.getElementById('btnExport').onclick=()=>{const blob=new Blob([serialize()],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='circuit.json';a.click();URL.revokeObjectURL(url);};
document.getElementById('btnImport').onclick=()=>document.getElementById('fileImport').click();
document.getElementById('fileImport').onchange=e=>{const file=e.target.files[0];if(!file)return;const reader=new FileReader();reader.onload=ev=>{try{loadFromData(JSON.parse(ev.target.result));statusText.textContent='✓ Imported.';}catch(err){statusText.textContent='⚠ Invalid file.';}};reader.readAsText(file);e.target.value='';};

/* ═══════════════ DEMO + INIT ═══════════════════════════════════ */
(function init(){
  buildSopGrid();
  const nA=addNode('INPUT',70,80);nA.name='A';renderNode(nA);
  const nB=addNode('INPUT',70,200);nB.name='B';renderNode(nB);
  const nOR=addNode('OR',270,140);
  const nNOT=addNode('NOT',460,140);
  const nOUT=addNode('OUTPUT',650,140);
  wires.push({id:uid('w'),from:{node:nA.id,pin:0},to:{node:nOR.id,pin:0}});
  wires.push({id:uid('w'),from:{node:nB.id,pin:0},to:{node:nOR.id,pin:1}});
  wires.push({id:uid('w'),from:{node:nOR.id,pin:0},to:{node:nNOT.id,pin:0}});
  wires.push({id:uid('w'),from:{node:nNOT.id,pin:0},to:{node:nOUT.id,pin:0}});
  drawWires();runSimulation();refreshSavedList();
})();
