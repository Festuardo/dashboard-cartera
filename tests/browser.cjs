// Optional integration test: CHROMIUM_PATH=/path/to/chromium node tests/browser.cjs
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict'),os=require('os');
const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright':'playwright');
const root=path.resolve(__dirname,'..'),out=fs.mkdtempSync(path.join(os.tmpdir(),'cartera-qa-'));
(async()=>{
 const server=http.createServer((req,res)=>{
  let p=new URL(req.url,'http://localhost').pathname.replace(/^\/dashboard-cartera\//,'');if(!p)p='index.html';
  const file=path.resolve(root,p);if(!file.startsWith(root+path.sep)){res.statusCode=403;return res.end()}
  try{res.setHeader('Content-Type',p.endsWith('.js')?'text/javascript':p.endsWith('.webmanifest')?'application/manifest+json':p.endsWith('.html')?'text/html':p.endsWith('.png')?'image/png':'application/octet-stream');res.end(fs.readFileSync(file))}catch(e){res.statusCode=404;res.end()}
 });await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/dashboard-cartera/`);await page.evaluate(()=>ready);
  await page.evaluate(()=>{
   const rec=(advisor,balance,days=0,agency='JUTIAPA')=>({advisor,balance,days,agency,agencyCode:agency==='JUTIAPA'?'1106':'1107',product:'NORMAL',credit:advisor+balance,disbursed:0,disbDate:''});
   const src=(date,records)=>({date,fileName:date+'.xlsx',summary:buildSummary(records),records,filterPolicy:'exclude-fondo-chn-v1',balancePolicy:'ignore-negative-v1',warnings:{days:false}});
   state={base:src('2025-12-31',[rec('TO06ANTERIOR',25000000)]),closures:[src('2026-02-28',[rec('TO06ANTERIOR',25100000,31)]),src('2026-05-31',[rec('TO06NUEVO',25200000,30),rec('TO07NUEVO',2000000,31,'NUEVA')]),src('2026-06-30',[rec('TO06NUEVO',25500000,31),rec('TO07NUEVO',2100000,30,'NUEVA')])],current:src('2026-07-31',[rec('TO06NUEVO',25800000,30),rec('TO06JULIO',500000,31),rec('TO07NUEVO',2200000,31,'NUEVA')]),goals:{TO06NUEVO:300000,TO06ANTERIOR:300000,TO06JULIO:300000,TO07NUEVO:100000},agencyGoals:{JUTIAPA:500000,NUEVA:100000}};
   $('cutoff').value='2026-07-31';$('closeDate').value='2026-07-31';render();$('agency').value='JUTIAPA';render();
  });
  assert((await page.locator('#advisorRows').innerText()).includes('Mes base'));
  assert.equal(await page.locator('#reportCharts svg').count(),2);
  await page.locator('#reportPanel').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,'desktop.png')});
  for(const [selector,file] of [['#exportPdfBtn','agency.pdf'],['#exportBtn','agency.xlsx']]){const wait=page.waitForEvent('download');await page.click(selector);await (await wait).saveAs(path.join(out,file))}
  await page.selectOption('#reportAdvisor','TO06NUEVO');const pdfWait=page.waitForEvent('download');await page.click('#exportPdfBtn');await (await pdfWait).saveAs(path.join(out,'advisor.pdf'));
  await page.selectOption('#agency','NUEVA');assert.equal(await page.locator('#kBaseDate').innerText(),'2026-05-31');
  await page.click('#agencyDetail');assert((await page.locator('#detailRows').innerText()).includes('Mes base'));
  const np=page.waitForEvent('download');await page.click('#exportPdfBtn');await (await np).saveAs(path.join(out,'new-agency.pdf'));
  await page.selectOption('#agency','ALL');const aggregate=await page.evaluate(()=>agencyMetrics());assert.equal(aggregate.current,28500000);assert.equal(aggregate.required,3700000);
  await page.evaluate(()=>save());await page.reload();await page.evaluate(()=>ready);assert.equal(await page.evaluate(()=>state.closures.length),3);
  await page.setViewportSize({width:390,height:844});await page.locator('#reportPanel').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,'mobile.png')});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
  assert.deepEqual(errors,[]);console.log('PASS browser: charts, PDF/Excel downloads, new agency, combined goals, reload persistence, mobile, no page errors');console.log(out);
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exit(1)});
