import test from "node:test";
import assert from "node:assert/strict";
import { reconcileWriteOffs } from "../js/store-writeoff.js";

function watchJob(id, partial={}) {
  return {
    id,
    jobId:`JOB-${id}`,
    jobType:"watch",
    status:"Spares",
    watchName:`Watch ${id}`,
    passport:{ maker:"Test", model:id, calibre:"FHF 96" },
    business:{},
    labour:{ running:true, startedAt:"2026-10-10T10:00:00Z" },
    writeOff:"Missing balance staff",
    ...partial
  };
}

test("write-off closes job and converts linked item to donor/spares", () => {
  const state={jobs:[watchJob("oris")],items:[],partsStock:[],currentId:"oris"};
  const changed=reconcileWriteOffs(state);
  assert.equal(changed,true);
  assert.equal(state.jobs[0].itemId,"item-oris");
  assert.equal(state.jobs[0].labour.running,false);
  assert.ok(state.jobs[0].closedAt);
  assert.equal(state.items.length,1);
  assert.equal(state.items[0].purpose,"donor");
  assert.equal(state.items[0].status,"Retained");
  assert.ok(state.items[0].tags.includes("written-off"));
  assert.match(state.items[0].notes,/Missing balance staff/);
  assert.equal(state.currentId,null);
});

test("write-off is idempotent and does not duplicate donor item", () => {
  const state={jobs:[watchJob("oris")],items:[],partsStock:[],currentId:null};
  reconcileWriteOffs(state);
  const firstId=state.items[0].id;
  reconcileWriteOffs(state);
  assert.equal(state.items.length,1);
  assert.equal(state.items[0].id,firstId);
  assert.equal(state.jobs[0].itemId,firstId);
});

test("whole donor movement stock migrates into a retained donor item", () => {
  const state={jobs:[],items:[],partsStock:[{id:"p1",name:"Complete movement",category:"Movement / complete",calibre:"ETA 2390",cost:"12",location:"Tray B4"}]};
  const changed=reconcileWriteOffs(state);
  assert.equal(changed,true);
  assert.equal(state.partsStock.length,0);
  assert.equal(state.items.length,1);
  assert.equal(state.items[0].purpose,"donor");
  assert.equal(state.items[0].watch.movement.calibre,"ETA 2390");
  assert.equal(state.items[0].watch.storageLocation,"Tray B4");
});
