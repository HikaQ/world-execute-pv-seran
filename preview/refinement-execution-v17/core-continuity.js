import * as THREE from 'three';

const clamp=x=>Math.max(0,Math.min(1,x)),mix=(a,b,t)=>a+(b-a)*t;
const smooth=x=>{const u=clamp(x);return u*u*(3-2*u);};
const FOCAL=540/Math.tan(43*Math.PI/360);

// Integrate the velocity ramp. The flight does not ease to a stop at the far wall.
export function flightPosition(frame){
 const age=Math.max(0,frame-9303),u=Math.min(1,age/6);
 const distance=.37*(age<6?6*(u*u*u-.5*u*u*u*u):age-3);
 const turn=Math.max(0,(frame-9336)/20);
 return [1.2*turn*turn,0,.5-distance];
}
function nativeScale(frame){
 const pulse=(f,gain)=>frame<f?0:gain*Math.exp(-(frame-f)/5);
 return 2.1+1.7*Math.max(pulse(9247,.55),pulse(9268,.65),pulse(9303,1));
}
function cameraAt(frame,archive=false){
 const c=new THREE.PerspectiveCamera(43,1920/1080,.08,220);
 if(archive){const u=clamp((frame-9357)/15);c.position.set(-5+1.2*u,2+.15*u,13-u);c.lookAt(0,0,-1);}
 else if(frame<9317){const u=clamp((frame-9302)/14);c.position.set(.6,.5,27-.4*u);c.lookAt(0,0,frame<9303?0:flightPosition(frame)[2]);}
 else{const u=clamp((frame-9317)/39);c.position.set(.6-.6*u,.4-.4*u,18-21*u);c.lookAt(0,0,flightPosition(frame)[2]);}
 c.updateMatrixWorld();return c;
}
function project(position,camera,size){
 const p=new THREE.Vector3(...position),ndc=p.clone().project(camera),depth=-p.clone().applyMatrix4(camera.matrixWorldInverse).z;
 return {screen:[(ndc.x+1)*960,(1-ndc.y)*540],depth,spritePixels:FOCAL*size/depth};
}
function nativeProjection(frame){return project(flightPosition(frame),cameraAt(frame),nativeScale(frame));}
const beforeCut=nativeProjection(9316),previous=nativeProjection(9315),atCut=nativeProjection(9317);
const cutScaleRatio=(2*beforeCut.spritePixels-previous.spritePixels)/atCut.spritePixels;

export function flightScale(frame){
 // Retain the beat cut and the physical camera positions. Match the dot's apparent
 // size across that cut, then restore its world-space size over sixteen frames.
 return nativeScale(frame)*(frame<9317?1:mix(cutScaleRatio,1,smooth((frame-9317)/16)));
}
export function flightProjection(frame){return project(flightPosition(frame),cameraAt(frame),flightScale(frame));}
const exit=flightProjection(9356),exitPrevious=flightProjection(9355);
const exitVelocity=exit.screen.map((v,i)=>v-exitPrevious.screen[i]),sizeVelocity=exit.spritePixels-exitPrevious.spritePixels;

export function archiveHandoff(frame){
 // Different world coordinates, one continuous screen-space trajectory. The
 // original oblique data-wall shot starts where the outgoing red core is headed.
 const age=frame-9356,camera=cameraAt(frame,true);
 const screen=exit.screen.map((v,i)=>v+exitVelocity[i]*age),pixels=exit.spritePixels+sizeVelocity*age;
 const ray=new THREE.Vector3(screen[0]/960-1,1-screen[1]/540,.5).unproject(camera).sub(camera.position).normalize();
 const position=camera.position.clone().addScaledVector(ray,(.08-camera.position.z)/ray.z);
 const depth=-position.clone().applyMatrix4(camera.matrixWorldInverse).z;
 return {position:position.toArray(),screen,spritePixels:pixels,scale:pixels*depth/FOCAL,screenVelocity:exitVelocity};
}

export function motionState(frame,position,camera,scale){
 return {method:'continuous-flight-and-screen-space-match',...project(position,camera,scale),worldPosition:position,velocity:frame<9357?flightPosition(frame).map((v,i)=>v-flightPosition(frame-1)[i]):archiveHandoff(frame).screenVelocity,velocitySpace:frame<9357?'world':'screen',phase:frame<9357?'lock-flight':'archive-handoff'};
}
