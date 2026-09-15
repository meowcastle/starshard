// m27, the guide. Generic runner: node run27.js <reps> '<json law cfg>' "<label>"
const E=require("/tmp/now2/v2.js");
const REPS=Number(process.argv[2]||16), LEN=9, HAND=7, TONIGHT=Number(process.env.TONIGHT||27);
const LAW=JSON.parse(process.argv[3]||"{}"), LABEL=process.argv[4]||"the law";
const RULES={suzakuReach:true, suzakuBase:true, genbuDead:true, drawTo:"defender"};
function rng(s){let h=(s^2166136261)>>>0;return()=>{h^=h<<13;h>>>=0;h^=h>>>17;h^=h<<5;h>>>=0;return h/4294967296;};}
function deal(seed){const r=rng(seed),bag=Array.from({length:28},(_,i)=>i+1),o=[];
  while(o.length<HAND)o.push(bag.splice(Math.floor(r()*bag.length),1)[0]);return o;}
function deck(levelOf, side){
  const abOff={}, grants={}, addR={};
  for(let i=1;i<=28;i++){ const L=levelOf(i);
    if(L<2) abOff[i]=true; if(L>=3) grants[i]=true; if(L>=4) addR[i]=1; }
  const C=E.makeCards({lvl:2, abOff, grants, addR});
  if(side==="you") return C;
  const o={}; for(let i=1;i<=28;i++) o[200+i]={...C[i], id:200+i, who:"sky", homeM:i};
  return o;
}
const SUN=14, PLANETS=[1,7,20,24,11];
const STATES=[
  {label:"fresh", f:i=> i===SUN?3 : PLANETS.includes(i)?2 : 1},
  {label:"deep ", f:()=>3},
];
for(const s of STATES){ s.C=Object.assign({}, deck(s.f,"you"), deck(s.f,"sky")); }
function cell(P, leader, youD, seedOff, handFilter){
  let w=0,t=0,lv=0,mg=0,close=0,blow=0, dl=0, dq={byakko:0,suzaku:0,seiryuu:0,genbu:0};
  for(let m=1;m<=28;m++)for(let i=0;i<REPS;i++){
    const sd=3000+seedOff+m*131+i*911;
    let you=deal(sd); if(handFilter) you=handFilter.slice();
    const r=E.playBoard(Object.assign({C:P.C, you, sky:deal(sd+50021).map(x=>200+x),
      tonight:TONIGHT, leader, len:LEN, depth:8, youDepth:youD, watchAt:0}, RULES, LAW));
    t++; if(r.winner==="you") w++; if(r.level) lv++;
    if(r.firstLodger===leader) dl++; if(r.firstLodgerId) dq[E.QUAD[r.firstLodgerId%200]]++;
    const d=Math.abs(r.you-r.sky); mg+=d; if(d<=1) close++; if(d>=5) blow++;
  }
  const o={w:100*w/t, lv:100*lv/t, mg:mg/t, close:100*close/t, blow:100*blow/t, dl:100*dl/t};
  for(const q in dq) o["dq_"+q]=100*dq[q]/t;
  return o;
}
const KEYS=["w","lv","mg","close","blow","dl","dq_byakko","dq_suzaku","dq_seiryuu","dq_genbu"];
const SEEDOFF=Number(process.env.SEEDOFF||0);
const avg=(...a)=>{const x=[SEEDOFF,50000+SEEDOFF].map(s=>cell(a[0],a[1],a[2],s,a[3]));
  const o={}; for(const k of KEYS) o[k]=(x[0][k]+x[1][k])/2; return o;};
const DOOR={};
const N=28*REPS*2;
console.log("\nMANSION "+TONIGHT+". "+LABEL+". "+N+" boards a cell, two seeds.");
console.log("cfg "+JSON.stringify(LAW)+"\n");
console.log("1. SEAT, both sides careful.       you lead   she leads   SEAT    level   close   blowout");
for(const [si,lbl] of [[0,"fresh"],[1,"deep "]]){
  const a=avg(STATES[si],"you",8,null), c=avg(STATES[si],"sky",8,null); DOOR[lbl]=[a,c];
  console.log("  "+lbl+"  the law                  "+a.w.toFixed(1).padStart(8)+"%"+c.w.toFixed(1).padStart(10)+"%"
    +(a.w-c.w).toFixed(1).padStart(8)+((a.lv+c.lv)/2).toFixed(1).padStart(8)+"%"
    +((a.close+c.close)/2).toFixed(1).padStart(7)+"%"+((a.blow+c.blow)/2).toFixed(1).padStart(8)+"%");
  process.stderr.write("|");
}
console.log("\n2. SKILL, player careful v careless, player leads.");
for(const [si,lbl] of [[0,"fresh"],[1,"deep "]]){
  const cf=avg(STATES[si],"you",8,null), ca=avg(STATES[si],"you",0,null);
  console.log("  "+lbl+"  the law                  "+cf.w.toFixed(1).padStart(8)+"%"+ca.w.toFixed(1).padStart(10)+"%"+(cf.w-ca.w).toFixed(1).padStart(8));
  process.stderr.write("|");
}
console.log("\n3. QUADRANTS, deep, fixed hand, player leads.");
const QH={ byakko:[1,2,3,4,5,6,28], suzaku:[7,8,9,10,11,12,13],
           seiryuu:[14,15,16,17,18,19,20], genbu:[21,22,23,24,25,26,27] };
for(const q in QH){
  const on=avg(STATES[1],"you",8,QH[q]);
  console.log("  "+q.padEnd(10)+on.w.toFixed(1).padStart(7)+"%");
  process.stderr.write(".");
}
console.log("\n4. DOOR ORDER, both sides careful. Who lodges the door (index 0) first, and which quarter the card is.");
console.log("           leader first   answerer     byakko   suzaku   seiryuu   genbu   (share of first door cards)");
for(const lbl in DOOR){ const [a,c]=DOOR[lbl]; const m=k=>(a[k]+c[k])/2;
  console.log("  "+lbl+"  "+m("dl").toFixed(1).padStart(11)+"%"+(100-m("dl")).toFixed(1).padStart(11)+"%"
    +m("dq_byakko").toFixed(1).padStart(9)+"%"+m("dq_suzaku").toFixed(1).padStart(8)+"%"+m("dq_seiryuu").toFixed(1).padStart(9)+"%"+m("dq_genbu").toFixed(1).padStart(7)+"%"); }
