import {createWorld as originalWorld} from '../refinement-possession-rework-v4/world.js';
import {withDepthBackground} from './background.js';
export const FIRST=10519,END=10770;
export function createWorld(code){return withDepthBackground(originalWorld(code),'memory');}
