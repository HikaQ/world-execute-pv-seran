import * as previous from '../refinement-perception-v16/score.js';
import {cinemaCamera,PHASES} from './wave-model.js';
export * from '../refinement-perception-v16/score.js';
export const VERSION='refinement-geometry-v11',START=40.65,END=53.6,CONTEXT_START=39.8;
export const START_FRAME=2439,END_FRAME=3126;
export const cameraAt=cinemaCamera;
export const SHOTS=[...PHASES.map(([id,at])=>({id:'cinema-'+id,at}))];
export const shotAt=t=>t<START||t>=52.1?previous.shotAt(t):SHOTS.findLast(s=>t>=s.at);
