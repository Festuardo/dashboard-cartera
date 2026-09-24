/* © 2026 Fgarcia. Reportes basados en los mismos cálculos del dashboard. */
function reportSelection(){
 const advisor=$('reportAdvisor').value;
 const from=$('reportFrom').value||'2026-01',to=$('reportTo').value||$('cutoff').value.slice(0,7);
 const filter=rows=>rows.filter(x=>x.month>=from&&x.month<=to);
 const agencies=$('agency').value==='ALL'?availableAgencies():[$('agency').value];
 const advisors=goalRows().filter(x=>!advisor||norm(x.advisor)===advisor);
 return {advisor,from,to,filter,agencies,advisors,title:advisor?advisors[0]?.advisor||advisor:$('agency').value==='ALL'?'Todas las agencias':$('agency').value};
}
function reportReady(){
 if(!state.base&&!state.current&&!state.closures.length){setStatus('Carga primero una cartera.','error');return false}
 const r=reportSelection();if(r.from>r.to){setStatus('El mes inicial no puede ser posterior al mes final.','error');return false}return true;
}
function reportingCharts(){
 const r=reportSelection();
 const detail=r.filter(monthlyDetail(r.advisor?'advisor':'agency',r.advisor||$('agency').value));
 const growth=r.advisor?detail.map(x=>({label:x.month,a:x.acc,b:x.required,note:x.baseMonth?'Mes base':'Sin dato'})):r.advisors.filter(x=>x.active&&!x.baseMonth).map(x=>({label:x.advisor,a:x.acc,b:x.required}));
 return [
  {title:r.advisor?'Crecimiento acumulado por mes':'Crecimiento acumulado por asesor · corte actual',names:['Real','Meta'],colors:['#188457','#0e456a'],rows:growth},
  {title:'Mora real >30 días · '+r.title,names:['Saldo en mora'],colors:['#c74343'],rows:detail.map(x=>({label:x.month+(x.status.includes('Provisional')?' *':''),a:x.mora,b:null})),note:'* Corte provisional. No incluye proyección de días. Sin dato no equivale a cero.'}
 ];
}
function chartLayout(chart){
 const rows=chart.rows;
 const values=rows.flatMap(x=>[x.a,x.b]).filter(x=>x!=null&&Number.isFinite(x));
 const low=Math.min(0,...values),high=Math.max(0,...values),span=high-low||1;
 const min=low<0?low-span*.12:0,max=high+span*.24;
 const left=115,right=510,width=640,height=48+rows.length*48;
 const point=v=>left+(v-min)/(max-min)*(right-left);
 return {rows,min,max,left,right,width,height,point,zero:point(0)};
}
function chartSVG(chart){
 if(!chart.rows.length)return '<p class="note">No hay datos evaluables para esta selección.</p>';
 const l=chartLayout(chart),parts=[];
 for(let i=0;i<=4;i++){const value=l.min+(l.max-l.min)*i/4,x=l.point(value);parts.push(`<line x1="${x}" y1="23" x2="${x}" y2="${l.height-10}" stroke="#e1e8ef"/><text x="${x}" y="15" text-anchor="middle" fill="#657582" font-size="10">${esc(shortMoney(value))}</text>`)}
 parts.push(`<line x1="${l.zero}" y1="23" x2="${l.zero}" y2="${l.height-10}" stroke="#9baaba"/>`);
 l.rows.forEach((row,i)=>{
  const y=36+i*48;parts.push(`<text x="106" y="${y+9}" text-anchor="end" fill="#19252f" font-size="11">${esc(row.label)}</text>`);
  chart.names.forEach((name,n)=>{
   const value=n?row.b:row.a,by=y+n*16;if(value==null){parts.push(`<text x="${l.left+6}" y="${by+10}" font-size="10" fill="#657582">${esc(row.note||'Sin dato')}</text>`);return}
   const x=l.point(value);parts.push(`<rect x="${Math.min(l.zero,x)}" y="${by}" width="${Math.max(.8,Math.abs(x-l.zero))}" height="12" rx="2" fill="${chart.colors[n]}"/><text x="${Math.max(x,l.zero)+5}" y="${by+10}" fill="#314451" font-size="10">${esc(money(value))}</text>`);
  });
 });
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${l.width} ${l.height}" role="img" aria-label="${esc(chart.title)}"><title>${esc(chart.title)}</title>${parts.join('')}</svg>`;
}
function shortMoney(v){return 'Q'+(Math.abs(v)>=1000000?(v/1000000).toFixed(1)+' M':Math.abs(v)>=1000?(v/1000).toFixed(0)+' mil':v.toFixed(0))}
function renderReportCharts(){
 $('reportCharts').innerHTML=reportingCharts().map(chart=>`<article class="chart-card"><h3>${esc(chart.title)}</h3><div class="chart-legend">${chart.names.map((name,i)=>`<span><i style="background:${chart.colors[i]}"></i>${esc(name)}</span>`).join('')}</div><div class="chart-scroll">${chartSVG(chart)}</div><p class="note">${esc(chart.note||'Los meses base y asesores sin cartera actual no se evalúan. Valores en quetzales.')}</p></article>`).join('');
}
function renderReporting(){
 const old=$('reportAdvisor').value,rows=goalRows();
 $('reportAdvisor').innerHTML='<option value="">Todos los asesores</option>'+rows.map(x=>`<option value="${esc(norm(x.advisor))}">${esc(x.advisor)}${x.active?'':' · historial'}</option>`).join('');
 if(rows.some(x=>norm(x.advisor)===old))$('reportAdvisor').value=old;
 const cutoff=$('cutoff').value.slice(0,7);
 if(!$('reportTo').dataset.edited)$('reportTo').value=cutoff;
 renderReportCharts();
}
function agencyReportMetrics(name){
 return {...agencyMetrics(name),...snapshotMora(state.current,'agency',name)};
}
function workbookReport(){
 const r=reportSelection(),wb=XLSX.utils.book_new();
 const sheet=(name,rows,percent=[],integer=[])=>{
  const ws=XLSX.utils.aoa_to_sheet(rows);
  ws['!cols']=rows[0].map((h,i)=>({wch:i===0?27:Math.max(18,Math.min(34,String(h).length+2))}));
  ws['!autofilter']={ref:XLSX.utils.encode_range({r:0,c:0},{r:Math.max(0,rows.length-1),c:rows[0].length-1})};
  for(let row=1;row<rows.length;row++)for(let col=0;col<rows[row].length;col++){
   const cell=ws[XLSX.utils.encode_cell({r:row,c:col})];if(cell?.t==='n')cell.z=percent.includes(col)?'0.00%':integer.includes(col)?'#,##0':'"Q" #,##0.00';
  }
  XLSX.utils.book_append_sheet(wb,ws,name);
 };
 const headers=['NOMBRE','FECHA BASE','ESTADO','MESES EVALUADOS (MÁX. EN TOTAL)','CARTERA ACTUAL','CARTERA BASE','CIERRE ANTERIOR','META MENSUAL Q','CRECIMIENTO ACUMULADO','META ACUMULADA Q','SALDO META ACUMULADA','CUMPLIMIENTO ACUMULADO','CRECIMIENTO DEL MES','SALDO META MENSUAL','CUMPLIMIENTO MENSUAL'];
 const metric=(name,x)=>[name,x.baseDate,x.baseMonth?'Mes base':x.active===false?'Sin cartera actual':'Evaluado',x.months,x.current,x.base,x.previous,x.goal,x.acc,x.required,x.accTarget,ratio(x.acc,x.required),x.monthly,x.monthTarget,ratio(x.monthly,x.monthlyGoal)];
 if(!r.advisor){
  const agencies=r.agencies.map(name=>{const x=agencyReportMetrics(name);return [...metric(name,x),x.mora,x.moraPct==null?null:x.moraPct/100,x.moraCases]});
  if(r.agencies.length>1){const x=agencyReportMetrics('ALL');agencies.push([...metric('TOTAL GENERAL',x),x.mora,x.moraPct==null?null:x.moraPct/100,x.moraCases])}
  sheet('Metas agencias',[[...headers,'MORA REAL AL CORTE >30','% MORA REAL','CASOS MORA'],...agencies],[11,14,16],[3,17]);
 }
 sheet('Metas asesores',[[...headers,'DESEMBOLSADO MES','MORA PROYECTADA >30','% MORA PROYECTADA','CASOS MORA PROYECTADA'],...r.advisors.map(x=>[...metric(x.advisor,x),x.disb,x.mora,x.moraPct==null?null:x.moraPct/100,x.moraCases])],[11,14,17],[3,18]);
 const detailHeader=['NOMBRE','MES','FECHA CORTE','ESTADO','FECHA BASE','MESES EVALUADOS (MÁX. EN TOTAL)','SALDO ANTERIOR','SALDO AL CORTE','APORTE DEL MES','META MENSUAL Q','CUMPLIMIENTO MENSUAL','CRECIMIENTO ACUMULADO','META ACUMULADA Q','CUMPLIMIENTO ACUMULADO','MORA REAL >30','% MORA REAL','CASOS MORA','ESTADO DE MORA'];
 const details=(kind,key)=>r.filter(monthlyDetail(kind,key)).map(x=>[key,x.month,x.date,x.status,x.baseDate,x.months,x.previous,x.current,x.monthly,x.monthlyGoal,x.monthlyPct,x.acc,x.required,x.accPct,x.mora,x.moraPct==null?null:x.moraPct/100,x.moraCases,x.moraStatus]);
 if(!r.advisor)sheet('Detalle agencias',[detailHeader,...r.agencies.flatMap(key=>details('agency',key))],[10,13,15],[5,16]);
 sheet('Detalle asesores',[detailHeader,...r.advisors.flatMap(x=>details('advisor',x.advisor))],[10,13,15],[5,16]);
 const chartData=[['GRÁFICA','ASESOR / MES','REAL Q','META Q']];reportingCharts().forEach(c=>c.rows.forEach(x=>chartData.push([c.title,x.label,x.a,x.b])));sheet('Datos gráficas',chartData);
 sheet('Información',[['CAMPO','VALOR'],['Fecha de corte',$('cutoff').value],['Cierre proyectado',$('closeDate').value],['Agencia',$('agency').value],['Asesor',r.advisor||'Todos'],['Período histórico',r.from+' a '+r.to],['Base anual','31/12/2025'],['Nuevas agencias y asesores','Primer mes con cartera = mes base; metas desde el siguiente mes. Se usan los archivos cargados.'],['Totales','Cada agencia usa su cartera propia. Meta general = suma de metas de cada agencia según sus meses evaluados. No se suman carteras de distintos meses.'],['Asesores','Cartera global por usuario. Se conserva el historial sin asignar pérdidas a ausentes.'],['Mora real','Saldo positivo de créditos con más de 30 días al corte, sin proyección. Fondo CHN excluido.'],['Mora proyectada','Se muestra únicamente en resumen actual de asesores.'],['Sin dato','Mora no disponible no significa cero. Recargar cierres antiguos para obtenerla.'],['Metas','Se usa la meta mensual configurada actualmente para todo el historial.'],['Gráficas','Disponibles en pantalla y PDF; esta hoja de cálculo incluye sus datos.']]);
 return wb;
}
function downloadExcelReport(){
 if(!reportReady())return;
 try{const r=reportSelection();XLSX.writeFile(workbookReport(),`Cartera_${norm(r.title)}_${$('cutoff').value}.xlsx`);setStatus('Excel generado con metas, historial y mora real por mes.','ok')}catch(e){setStatus('No se pudo generar Excel: '+e.message,'error')}
}
function pdfReport(){
 const {jsPDF}=window.jspdf,r=reportSelection();
 const doc=new jsPDF({orientation:'landscape',unit:'mm',format:'a4'});
 const W=297,H=210,M=14;let y=20;
 const clean=v=>String(v??'—').replace(/—/g,'-').replace(/·/g,' / ');
 const text=(str,x,yy,size=10,color='#19252f')=>{doc.setFontSize(size);doc.setTextColor(color);doc.text(clean(str),x,yy)};
 function newPage(){doc.addPage();y=20}
 function title(label){if(y>165)newPage();text(label,M,y,14,'#0e456a');y+=8}
 function table(label,head,body){
  if(!body.length)return;
  title(label);
  doc.autoTable({startY:y,head:[head.map(clean)],body:body.map(row=>row.map(clean)),margin:{left:M,right:M,top:20,bottom:17},styles:{font:'helvetica',fontSize:8,cellPadding:2.2,overflow:'linebreak',lineColor:[224,232,239],lineWidth:.1},headStyles:{fillColor:[14,69,106],textColor:255,fontSize:8},alternateRowStyles:{fillColor:[246,249,251]},columnStyles:{0:{cellWidth:32}},rowPageBreak:'avoid',showHead:'everyPage'});
  y=doc.lastAutoTable.finalY+12;
 }
 text('GESTIÓN DE CARTERA',M,y,21,'#0e456a');y+=9;text(r.title,M,y,14);y+=7;
 text('Corte: '+$('cutoff').value+'  |  Historial: '+r.from+' a '+r.to,M,y,10);y+=8;
 const notes=['Base anual: 31/12/2025. Agencias y asesores nuevos: primer mes con cartera sin evaluación; metas desde el siguiente mes.','Mora real: saldo de créditos con más de 30 días de atraso, sin proyectar días. Fondo CHN y saldos negativos excluidos.','Los totales de agencia no suman bases individuales ni saldos de distintos meses. Se usa la meta mensual configurada actualmente.'];
 notes.forEach(line=>{text(line,M,y,8,'#657582');y+=5});y+=4;
 const percent=v=>v==null?'-':pct(v*100),currency=v=>v==null?'-':money(v);
 const metricHeaders=['Nombre / base','Cartera actual','Cartera base','Real acumulado','Meta acumulada','Cumpl. acum.','Real del mes','Meta mensual','Cumpl. mes'];
 const metric=(name,x)=>[name+'\nBase: '+(x.baseDate||'-')+'\n'+(x.baseMonth?'Mes base':x.active===false?'Sin cartera actual':x.mixedBases?'Meses por agencia':x.months+' meses'),currency(x.current),currency(x.base),currency(x.acc),currency(x.required),percent(ratio(x.acc,x.required)),currency(x.monthly),currency(x.monthlyGoal),percent(ratio(x.monthly,x.monthlyGoal))];
 if(!r.advisor){
  const rows=r.agencies.map(name=>metric(name,agencyReportMetrics(name)));
  if(r.agencies.length>1)rows.push(metric('TOTAL GENERAL',agencyReportMetrics('ALL')));
  table('Resumen por agencia',metricHeaders,rows);
 }
 table('Resumen por asesor',metricHeaders,r.advisors.map(x=>metric(x.advisor,x)));
 table('Asesores: desembolsos y mora proyectada al '+$('closeDate').value,['Asesor','Desembolsado mes','Mora proyectada >30','% mora proyectada','Casos'],r.advisors.map(x=>[x.advisor,currency(x.disb),currency(x.mora),x.moraPct==null?'-':pct(x.moraPct),x.moraCases]));
 const selections=r.advisor?r.advisors.map(x=>['advisor',x.advisor]):[...r.agencies.map(name=>['agency',name]),...r.advisors.map(x=>['advisor',x.advisor])];
 for(const [kind,key] of selections){
  const rows=r.filter(monthlyDetail(kind,key));if(!rows.length)continue;
  newPage();
  table((kind==='advisor'?'Asesor: ':'Agencia: ')+key+' / Metas por mes',['Mes / estado','Cartera al corte','Aporte mes','Meta mes','Cumpl. mes','Real acumulado','Meta acumulada','Cumpl. acum.'],rows.map(x=>[x.month+'\n'+x.status,currency(x.current),currency(x.monthly),currency(x.monthlyGoal),percent(x.monthlyPct),currency(x.acc),currency(x.required),percent(x.accPct)]));
  table('Mora real por mes / '+key,['Mes / corte','Cartera al corte','Saldo mora >30 días','% mora real','Casos mora','Estado'],rows.map(x=>[x.month+'\n'+x.date,currency(x.current),currency(x.mora),x.moraPct==null?'-':pct(x.moraPct),x.moraCases??'-',x.moraStatus]));
 }
 for(const chart of reportingCharts()){
  for(let start=0;start<chart.rows.length;start+=12){
   const part={...chart,rows:chart.rows.slice(start,start+12)},l=chartLayout(part);newPage();title(chart.title);
   chart.names.forEach((name,i)=>{doc.setFillColor(chart.colors[i]);doc.rect(M+i*65,y,3,3,'F');text(name,M+5+i*65,y+3,9)});y+=12;
   const sx=(W-M*2)/l.width,sy=Math.min(sx,(H-35-y)/l.height),xx=v=>M+l.point(v)*sx;
   for(let i=0;i<=4;i++){const v=l.min+(l.max-l.min)*i/4,x=xx(v);doc.setDrawColor('#e1e8ef');doc.line(x,y+5,x,y+(l.height-10)*sy);text(shortMoney(v),x-5,y,7,'#657582')}
   l.rows.forEach((row,i)=>{const by=y+(24+i*48)*sy;text(row.label,M,by+3,8);chart.names.forEach((_,n)=>{const val=n?row.b:row.a,barY=by+n*16*sy;
    if(val==null){text(row.note||'Sin dato',M+l.left*sx,barY+3,7,'#657582');return}
    const x=xx(val),zero=xx(0);doc.setFillColor(chart.colors[n]);doc.rect(Math.min(x,zero),barY,Math.max(.3,Math.abs(x-zero)),12*sy,'F');text(money(val),Math.max(x,zero)+2,barY+3,7);
   })});
   if(chart.note)text(chart.note,M,H-21,8,'#657582');
  }
 }
 const pages=doc.getNumberOfPages();for(let i=1;i<=pages;i++){doc.setPage(i);doc.setDrawColor('#dce5ea');doc.line(M,H-13,W-M,H-13);text('Fgarcia / Gestión de Cartera / '+r.title,M,H-8,8,'#657582');text(i+' / '+pages,W-M-18,H-8,8,'#657582')}
 return doc;
}
function downloadPDFReport(){
 if(!reportReady())return;
 try{const r=reportSelection();pdfReport().save(`Cartera_${norm(r.title)}_${$('cutoff').value}.pdf`);setStatus('PDF generado con detalle mensual, mora real y gráficas.','ok')}catch(e){setStatus('No se pudo generar PDF: '+e.message,'error')}
}
$('reportAdvisor').onchange=renderReportCharts;
$('reportFrom').onchange=renderReportCharts;
$('reportTo').onchange=()=>{$('reportTo').dataset.edited='1';renderReportCharts()};
$('exportPdfBtn').onclick=downloadPDFReport;

Promise.resolve(ready).then(renderReporting);
