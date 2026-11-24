export function recordOfficialChanges(previous,next,history={schemaVersion:1,events:[]}){
 const fields=['officialTitle','introduced','sponsor','cosponsors','cosponsorCount','action'],changes=[];
 for(const [id,current] of Object.entries(next.records||{})){const before=previous.records?.[id];if(!before)continue;const changed=fields.filter(field=>JSON.stringify(before[field])!==JSON.stringify(current[field]));if(changed.length)changes.push({id,fields:changed,before:Object.fromEntries(changed.map(k=>[k,before[k]??null])),after:Object.fromEntries(changed.map(k=>[k,current[k]??null]))});}
 const result={...history,schemaVersion:1,baselineAt:history.baselineAt||previous.checkedAt||next.checkedAt,events:[...(history.events||[])]};
 if(changes.length)result.events.push({date:next.checkedAt,changes});
 return result;
}
