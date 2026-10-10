import { STAGE_COPY } from './stages.js?v=10';
import { checklistValue, findChecklistStep } from './checklist-response.js?v=1';

let saveTimer=null;
let savePending=false;

function hint(text){const el=document.getElementById('statusText');if(el)el.textContent=text;}

function queueSave(workbench){
  clearTimeout(saveTimer);
  savePending=true;
  hint('Saving…');
  saveTimer=setTimeout(async()=>{
    try{
      await workbench.save();
      savePending=false;
      hint('Saved');
    }catch(err){
      console.error('Checklist background save failed',err);
      hint('Save failed — tap again after connection returns.');
    }
  },120);
}

function answerFromButton(button){
  const label=String(button.textContent||'').trim().toLowerCase();
  if(label==='yes')return 'yes';
  if(label==='no')return 'no';
  if(label==='n/a')return 'na';
  return '';
}

function handleChecklistTap(event){
  const button=event.target.closest?.('.yn-btns button');
  if(!button)return;
  const workbench=window.calibreWorkbench;
  const job=workbench?.getJob?.();
  if(!workbench||!job)return;
  const stage=job.stages?.[job.stage];
  if(!stage)return;
  const row=button.closest('.yn');
  const question=row?.querySelector('p')?.textContent||'';
  const defs=STAGE_COPY[stage.name]?.steps||[];
  const found=findChecklistStep(defs,question);
  const next=answerFromButton(button);
  if(!found||!next)return;

  event.preventDefault();
  event.stopImmediatePropagation();

  stage.checks=stage.checks||{};
  const current=stage.checks[found.step.id]??stage.checks[found.index]??'';
  stage.checks[found.step.id]=checklistValue(current,next);
  stage.updatedAt=new Date().toISOString();

  // Repaint synchronously so the tap feels instant; persistence follows behind it.
  workbench.repaint?.();
  queueSave(workbench);
}

document.addEventListener('click',handleChecklistTap,true);

window.addEventListener('pagehide',()=>{
  if(!savePending)return;
  const workbench=window.calibreWorkbench;
  if(workbench?.save)workbench.save().catch(()=>{});
});
