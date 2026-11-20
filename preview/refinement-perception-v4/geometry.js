import {label as createLabel} from '../refinement-geometry-v6/geometry.js';
export {createGeometrySequence,loadGeometryFont,line,text} from '../refinement-geometry-v6/geometry.js';

// Static formulas and context records keep their existing texture between
// frames. Only their transforms and visibility need to change during a move.
export function label(parent,options){
 const result=createLabel(parent,options),draw=result.update;let renderedKey=null;
 result.update=(data,alpha=1)=>{
  result.mesh.visible=alpha>.001;result.mat.opacity=alpha;
  if(!result.mesh.visible)return;
  const key=JSON.stringify(data);
  if(key!==renderedKey){draw(data,alpha);renderedKey=key;}
 };
 return result;
}
