export function companionStats(bills,chamber=''){
 const byId=new Map(bills.map(b=>[b.id,b])),neighbors=new Map(bills.map(b=>[b.id,new Set()]));
 for(const b of bills)for(const link of b.companions||[]){const other=byId.get(link.id);if(!other||other.chamber===b.chamber)continue;neighbors.get(b.id).add(other.id);neighbors.get(other.id).add(b.id);}
 const coverage=[{label:'With a companion',House:0,Senate:0},{label:'No recorded companion',House:0,Senate:0}];
 for(const b of bills)if(!chamber||b.chamber===chamber)coverage[neighbors.get(b.id).size?0:1][b.chamber]++;
 const seen=new Set(),families=[];
 for(const b of bills){if(seen.has(b.id)||!neighbors.get(b.id).size)continue;const queue=[b.id],ids=[];while(queue.length){const id=queue.pop();if(seen.has(id))continue;seen.add(id);ids.push(id);for(const next of neighbors.get(id))queue.push(next);}
  const rows=ids.map(id=>byId.get(id)),first=c=>rows.filter(b=>b.chamber===c).sort((a,b)=>a.introduced.localeCompare(b.introduced)||a.id.localeCompare(b.id,'en',{numeric:true}))[0],house=first('House'),senate=first('Senate');
  const gap=Math.round(Math.abs(Date.parse(house.introduced+'T00:00:00Z')-Date.parse(senate.introduced+'T00:00:00Z'))/86400000);families.push({ids:ids.sort((a,b)=>a.localeCompare(b,'en',{numeric:true})),house,senate,gap});
 }
 const bands=[{label:'Same day',min:0,max:0},{label:'1–7 days',min:1,max:7},{label:'8–30 days',min:8,max:30},{label:'31–90 days',min:31,max:90},{label:'91–180 days',min:91,max:180},{label:'181+ days',min:181,max:Infinity}].map(b=>({...b,count:families.filter(f=>f.gap>=b.min&&f.gap<=b.max).length}));
 return {coverage:coverage.map(r=>({...r,total:r.House+r.Senate})),families:families.sort((a,b)=>a.gap-b.gap||a.ids[0].localeCompare(b.ids[0],'en',{numeric:true})),bands};
}
