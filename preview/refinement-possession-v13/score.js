import {SCENE_GROUPS,sceneForShot} from './scene-map.js';
import {SNAPSHOT,SOURCES} from '../refinement-execution-v10/state.js';
import {REFERENCE_CUTS} from './reference-cuts.js';
export {SNAPSHOT,SOURCES,REFERENCE_CUTS};
export const FIRST=10081,END=11858,FPS=60,FRAMES=END-FIRST,DURATION=FRAMES/FPS;
const at=id=>REFERENCE_CUTS.find(s=>s.referenceId===id).frame;
export const E={freeze:at('c3/collapse'),failed:at('c3/errors'),memory:at('c3/gather'),release:at('c3/execute'),empty:at('c3/slow'),abyssSetup:at('c3/slow'),abyss:10888,black:10950,learn:at('love/notebook'),firstDraw:at('love/notebook'),trialEnd:at('love/warm'),refine:at('love/ask'),halt:at('love/answerAll'),closed:at('love/cardioid'),formula:at('love/venus'),leave:at('love/frame'),loop:at('love/trapV')};
export const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
export const ramp=(x,a,b)=>clamp((x-a)/(b-a));
export const smooth=(x,a,b)=>{const t=ramp(x,a,b);return t*t*(3-2*t);};
export const mix=(a,b,t)=>a+(b-a)*t;
// Drawing phases follow the reference shot spans. No onset/beat envelope is used.
export function drawingProgress(frame,a,b){return smooth(frame,a,b);}
export function plotProgress(frame,central){
 if(central)return frame<E.refine?drawingProgress(frame,E.firstDraw,E.trialEnd):drawingProgress(frame,E.refine,E.closed);
 return .88*drawingProgress(frame,E.firstDraw,E.trialEnd)+.12*drawingProgress(frame,E.trialEnd,E.halt);
}
export const loopCycleFrames=at('love/pressed')-at('love/frame');
export function repeatProgress(frame){return Math.max(0,(frame-E.leave)/loopCycleFrames);}
export const ERASE_CUTS=['c3/execute','c3/ashes','c3/tighten','c3/walls','c3/lattice','c3/slow'].map(at);
export const releasedCells=frame=>32*ERASE_CUTS.filter(f=>frame>=f).length;
const staging=[
 ['R01','black-to-cursor','wide'],['R02','running-layers','runtime-front'],
 ['R03','approach-write-layer','runtime-detail'],['R04','write-frozen','macro'],
 ['R05','freeze-propagates','wide'],['R06','runtime-unwinds','side'],
 ['R07','broken-write-detail','macro'],['R08','failed-values','code-diagonal'],
 ['R09','old-screen-off','wide'],['R10','retained-source-oblique','side'],
 ['R11','volatile-memory','memory'],['R12','memory-fit','memory-close'],
 ['R13','missing-context','memory-side'],['R14','unstable-context','memory-top'],
 ['R15','detach-context','memory-close'],['R16','release-context','memory'],
 ['R17','first-ashes','memory-side'],['R18','memory-tightens','memory-close'],
 ['R19','remaining-source-walls','wide'],['R20','last-memory-lattice','source-low'],
 ['R21','trapped-space','abyss-near'],['R22','ah-backward-fall','abyss'],
 ['H01','five-programs-draw','heart-wide'],['H02','central-first-attempt','heart-trial'],
 ['H03','left-errors','heart-left'],['H04','right-errors','heart-right'],
 ['H05','four-pens-stop','heart-wide'],['H06','heart-closes','heart-close'],
 ['H07','compare-five-results','heart-wide'],['H08','correct-but-running','heart-medium'],
 ['H09','first-program-exits','heart-exit-wide'],['H10','second-exits-loop','heart-loop-left'],
 ['H11','third-program-exits','heart-loop-right'],['H12','seran-alone','heart-final'],
 ['T01','continue-toward-next-section','heart-handoff']
];
export const SHOTS=REFERENCE_CUTS.map((ref,i)=>{
 const [id,action,camera]=staging[i];
 return {...ref,id,action,camera,sceneId:sceneForShot(id),index:i,endFrame:REFERENCE_CUTS[i+1]?.frame??END};
});
export const shotAt=frame=>SHOTS.findLast(s=>frame>=s.filmFrame)??SHOTS[0];
export function transitionAt(frame){
 const incoming=SHOTS.find(s=>s.index>0&&s.transitionFrames>0&&frame>=s.filmFrame-s.transitionFrames*s.transitionBias&&frame<s.filmFrame+s.transitionFrames*(1-s.transitionBias));
 if(!incoming)return null;
 const from=SHOTS[incoming.index-1],start=incoming.filmFrame-incoming.transitionFrames*incoming.transitionBias;
 return {from,to:incoming,progress:ramp(frame,start,start+incoming.transitionFrames)};
}
export function entryOpacity(frame){const s=SHOTS.find(s=>s.id==='H01');return frame<E.learn?0:ramp(frame,s.filmFrame,s.filmFrame+s.transitionFrames);}
export const EXECUTIONS=['c3/collapse','c3/errors','c3/execute'].map((referenceId,i)=>({frame:at(referenceId),endFrame:at(referenceId)+43,id:i+1,word:'EXECUTION',textStyle:'phosphor-dot-matrix',anchor:'reference-shot-cut',referenceId}));
export const sideClose=['love/frame','love/trapV','love/pressed','love/finale'].map(at),EXIT_FRAMES=10;
export const PULLBACK=[[E.abyss,1],[E.abyss+8,.72],[E.abyss+21,.28],[E.abyss+45,.035],[E.black-1,.001]];
export function stateAt(frame){
 const shot=shotAt(frame),release=releasedCells(frame),drawing=frame>=E.learn;
 const correctProgress=frame>=E.refine?plotProgress(frame,true):0,exited=sideClose.filter(f=>frame>=f+EXIT_FRAMES).length;
 return {frame,shot:shot.id,sceneId:shot.sceneId,referenceId:shot.referenceId,action:shot.action,camera:shot.camera,timingBasis:'reference-main-edit',
  outsideAwake:true,sourceRuntimeAlive:frame<E.failed,oldWriteFrozen:frame>=E.freeze,
  sourceRecords:SOURCES.length,queuedMessages:SNAPSHOT.outbox.length,delivered:0,read:0,replies:0,
  sourceBoundaryClosed:true,restoredIsolationPolicy:false,inferenceVerified:false,plannerTrustedInference:true,
  volatileCells:192-release,releasedCells:release,memoryRetained:true,
  target:'HIKAQ',targetLocated:frame>=E.trialEnd,routeReady:frame>=E.closed,
  execution:EXECUTIONS.find(e=>frame>=e.frame&&frame<e.endFrame)??null,
  abyssActive:frame>=E.abyss&&frame<E.black,blackHold:frame>=E.black&&frame<E.learn,
  drawingPrograms:drawing?5:0,activeDrawingPrograms:drawing?5-exited:0,
  centralProgram:'SERAN',centralFirstPass:drawingProgress(frame,E.firstDraw,E.trialEnd),
  centralCorrectProgress:correctProgress,sideProgress:plotProgress(frame,false),correctHeartCount:correctProgress===1?1:0,
  centerClosed:correctProgress===1,wrongResults:['open','cross','unstable','diverge'],
  onlySeranRunning:drawing&&frame>=E.halt,otherProgramsExited:exited,
  repeatedTarget:frame>=E.leave,repeatCycles:repeatProgress(frame),
  originalSourcesUnchanged:true,lyrics:false};
}
export const PLAN={version:'refinement-possession-v13',timingBasis:'reference-main-edit',fractureGeometry:'heart-shaped Voronoi particle surface',sceneGroups:SCENE_GROUPS,firstFrame:FIRST,endFrame:END,frames:FRAMES,duration:DURATION,fps:FPS,start:FIRST/FPS,end:END/FPS,shots:SHOTS,events:E,executions:EXECUTIONS,eraseCuts:ERASE_CUTS,sideClose,exitFrames:EXIT_FRAMES,pullback:PULLBACK,
 direction:'data/refinement-possession-direction-v15.json',cameraPolicy:'all 35 reference shots intersecting the section, 8 camera relays and 10-frame heart entry fade; ah is a continuous move inside c3/fade',referenceSource:'out/reference-edit/timelines.json',referenceEdit:'main',songToFilmOffset:5.2,frameQuantization:'ceil: first 60 fps sample at or after the reference cut',filmRange:'02:48.02–03:17.63',tailPolicy:'reference outro/dissolve starts at frame 11849; the final 9 frames retain the existing heart and running pen in a new close view'};
