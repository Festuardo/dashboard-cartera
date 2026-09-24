const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),path=require('path');
const root=path.resolve(__dirname,'..');
const elements=new Map();
function el(id){if(!elements.has(id))elements.set(id,{value:'',dataset:{},hidden:false,innerHTML:'',textContent:'',files:[],querySelectorAll:()=>[],scrollIntoView(){}});return elements.get(id)}
const ctx={console,Date,Map,Set,Promise,URL,Blob,TextEncoder,TextDecoder,ArrayBuffer,Uint8Array,structuredClone,document:{getElementById:el,querySelector:()=>({querySelectorAll:()=>[],inert:false})},window:{},localStorage:{getItem:()=>null,setItem(){}},XLSX:require(root+'/assets/xlsx.full.min.js')};
vm.createContext(ctx);let code=fs.readFileSync(root+'/index.html','utf8').match(/<script>([\s\S]*?)<\/script>/)[1].replace('const ready=initialize();','const ready=new Promise(()=>{});');vm.runInContext(code,ctx);vm.runInContext(fs.readFileSync(root+'/reports.js','utf8'),ctx);
const run=code=>vm.runInContext(code,ctx);
run(`
$('agency').value='JUTIAPA';$('cutoff').value='2026-07-31';$('closeDate').value='2026-07-31';
function rec(advisor,balance,days=0,agency='JUTIAPA',product='NORMAL'){return {advisor,balance,days,agency,agencyCode:agency==='JUTIAPA'?'1106':'1107',product,credit:advisor+balance,disbursed:0,disbDate:''}}
function src(date,records,days=true){return {date,fileName:date+'.xlsx',summary:buildSummary(records,days),records,filterPolicy:'exclude-fondo-chn-v1',balancePolicy:'ignore-negative-v1',warnings:{days:!days}}}
state={base:src('2025-12-31',[rec('TO06OLD',1000)]),closures:[src('2026-02-28',[rec('TO06OLD',1100)]),src('2026-05-31',[rec('TO06NEW',1000)]),src('2026-06-30',[rec('TO06NEW',1100,31)])],current:src('2026-07-31',[rec('TO06NEW',1200,30),rec('TO06JUL',500,31)]),goals:{TO06NEW:100,TO06OLD:100,TO06JUL:100},agencyGoals:{JUTIAPA:100}};
`);
let rows=run('goalRows()'),newRow=rows.find(x=>x.advisor==='TO06NEW');assert.equal(newRow.base,1000);assert.equal(newRow.baseDate,'2026-05-31');assert.equal(newRow.months,2);assert.equal(newRow.required,200);assert.equal(newRow.monthly,100);assert.equal(newRow.acc,200);
let jul=rows.find(x=>x.advisor==='TO06JUL');assert(jul.baseMonth);assert.equal(jul.required,null);assert.equal(jul.monthly,null);assert.equal(jul.acc,null);
let old=rows.find(x=>x.advisor==='TO06OLD');assert(old);assert.equal(old.current,null);assert.equal(old.acc,null);assert.equal(old.required,null);assert.equal(run('agencyTableTotal().current'),1700);
let history=run("monthlyDetail('advisor','TO06NEW')");assert.equal(history.length,3);assert.equal(history[0].status,'Mes base');assert.equal(history[0].monthlyPct,null);assert.equal(history[1].required,100);assert.equal(history[1].mora,1100);assert.equal(history[2].mora,0);
const retired=run("monthlyDetail('advisor','TO06OLD')");assert(retired.some(x=>x.month==='2026-02'&&x.current===1100));assert(!retired.some(x=>x.month==='2026-06'));
run("state.closures=state.closures.filter(c=>c.date!=='2026-06-30')");assert.equal(run("goalRows().find(x=>x.advisor==='TO06NEW').monthly"),null);assert.equal(run("goalRows().find(x=>x.advisor==='TO06NEW').required"),200);
assert.equal(run("buildSummary([rec('A',100,30),rec('A',200,31),rec('A',-100,60),rec('A',500,90,'JUTIAPA','Fondo CHN')]).JUTIAPA.mora"),200);
assert.equal(run("buildSummary([rec('A',100,30),rec('A',200,31),rec('A',-100,60),rec('A',500,90,'JUTIAPA','Fondo CHN')]).JUTIAPA.portfolio"),300);
assert.equal(run("snapshotMora(src('2026-01-31',[rec('A',100)],false),'agency','JUTIAPA').mora"),null);
assert.equal(run("snapshotMora({summary:{JUTIAPA:{portfolio:100,advisors:{A:{advisor:'A',portfolio:100}}}}},'agency','JUTIAPA').mora"),null);
// Same credits transferred between advisors must never be summed historically.
assert.equal(run("agencyMetrics().current"),1700);assert.equal(run("agencyMetrics().base"),1000);
// Every entry month uses its own base, including year rollover.
for(let m=1;m<=12;m++){
 run(`state.base=src('2025-12-31',[rec('TO06OLD',900)]);state.closures=[src(endOfMonth(2026,${m}),[rec('TO06NEW',1000)])];$('cutoff').value=endOfMonth(2026,${m+1});state.current=src($('cutoff').value,[rec('TO06NEW',1100)]);`);
 assert.equal(run("goalRows().find(x=>x.advisor==='TO06NEW').required"),100);
 assert.equal(run("goalRows().find(x=>x.advisor==='TO06NEW').monthly"),100);
}
run("$('reportFrom').value='2026-01';$('reportTo').value='2027-01';$('reportAdvisor').value='TO06NEW'");
const workbook=run('workbookReport()');assert(workbook.Sheets['Detalle asesores']);assert(!workbook.Sheets['Metas agencias']);
const buffer=ctx.XLSX.write(workbook,{type:'buffer',bookType:'xlsx'});const reopened=ctx.XLSX.read(buffer,{type:'buffer'});assert(reopened.Sheets['Metas asesores']);
console.log('PASS: first base in all 12 months, base month ungraded, prior base preserved, transfer totals, retired history, missing prior close, >30 boundary, missing mora, Excel roundtrip');
// New agencies use their first loaded month; the overall goal sums eligible agency-months.
run(`
$('agency').value='ALL';$('cutoff').value='2026-07-31';
state.base=src('2025-12-31',[rec('TO06OLD',1000)]);
state.closures=[src('2026-05-31',[rec('TO07NEW',2000,31,'NUEVA')]),src('2026-06-30',[rec('TO06OLD',1450),rec('TO07NEW',2100,30,'NUEVA')])];
state.current=src('2026-07-31',[rec('TO06OLD',1500),rec('TO07NEW',2200,31,'NUEVA'),rec('TO08JUL',500,31,'JULIO')]);
state.agencyGoals={JUTIAPA:100,NUEVA:100,JULIO:100};
`);
const newAgency=run("agencyMetrics('NUEVA')");assert.equal(newAgency.base,2000);assert.equal(newAgency.months,2);assert.equal(newAgency.required,200);assert.equal(newAgency.monthly,100);
const newAgencyBase=run("monthlyDetail('agency','NUEVA')[0]");assert.equal(newAgencyBase.status,'Mes base');assert.equal(newAgencyBase.required,null);assert.equal(newAgencyBase.acc,null);
const julyAgency=run("agencyMetrics('JULIO')");assert(julyAgency.baseMonth);assert.equal(julyAgency.monthlyGoal,null);
const combined=run('agencyMetrics()');assert.equal(combined.current,4200);assert.equal(combined.base,3500);assert.equal(combined.acc,700);assert.equal(combined.required,900);assert.equal(combined.monthly,150);assert.equal(combined.monthlyGoal,200);assert.equal(combined.accTarget,4400);assert.equal(combined.monthTarget,4250);
assert.equal(run("snapshotMora(state.current,'agency','ALL').mora"),2700);
console.log('PASS: new agency base month, mixed bases, weighted overall goal, no duplication, real mora across agencies');
