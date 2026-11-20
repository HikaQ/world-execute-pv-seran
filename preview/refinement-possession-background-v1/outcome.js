import {createOutcome as originalOutcome} from '../refinement-possession-outcome-v2/outcome.js';
import {withDepthBackground} from './background.js';
export {FIRST,END} from '../refinement-possession-outcome-v2/outcome.js';
export function createOutcome(){return withDepthBackground(originalOutcome(),'outcome');}
