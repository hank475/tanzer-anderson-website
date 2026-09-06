import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';
const source=readFileSync(new URL('../functions/api/handler.js',import.meta.url),'utf8');
const {parseEiaWeeklyHTML,onRequest}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const row=(year,...pairs)=>"<tr><td class='B6'>&nbsp;"+year+"</td>"+pairs.map(([date,value])=>"<td class='B5'>"+date+"&nbsp;</td><td class='B3'>"+value+"&nbsp;</td>").join("")+"</tr>";
test('EIA weekly rows retain dated zero and comma values; missing cells are not zero',()=>{
 const html=row('2026-Aug',['08/21','428,910'],['08/28','424,460'],['',''],['08/30','W'])+row('2026-Jan',['01/02','0']);
 assert.deepEqual(parseEiaWeeklyHTML(html,'2026-08-01'),[{date:'2026-08-21',value:428910},{date:'2026-08-28',value:424460}]);
 assert.deepEqual(parseEiaWeeklyHTML(html).at(0),{date:'2026-01-02',value:0});
 assert.equal(parseEiaWeeklyHTML(row('2026-Feb',['02/31','12'],['02/20','NA'])).length,0);
});
test('fundamentals fail closed when an EIA page has wrong identity or units',async()=>{
 const oldFetch=globalThis.fetch,oldCaches=globalThis.caches;
 globalThis.caches={default:{match:async()=>null,put:async()=>undefined}};
 globalThis.fetch=async()=>new Response('<title>Weekly U.S. Percent Utilization of Refinery Operable Capacity (Percent)</title>'+row('2026-Aug',['08/21','90.1'],['08/28','90.2']));
 try {
  const response=await onRequest({request:new Request('https://meridian.invalid/api/fundamentals'),params:{path:['fundamentals']},env:{},waitUntil:()=>{}});
  const value=await response.json();
  assert.equal(value.available_count,0);
  assert.equal(Object.keys(value.indicators).length,6);
  assert.ok(Object.values(value.source_health).every(x=>x.status==='error'));
  assert.match(value.indicators.cushing_stocks.series_id,/YCUOK/);
  assert.equal(value.indicators.us_production.series_id,'WCRFPUS2');
 }finally{globalThis.fetch=oldFetch;globalThis.caches=oldCaches;}
});
