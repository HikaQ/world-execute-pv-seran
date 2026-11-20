import * as THREE from 'three';

// Continue the existing world-space cloud field beyond the old 700 x 440
// rectangle. A far-depth screen triangle covers every view ray; foreground
// geometry still occludes it normally, and camera rotation changes the view.
export function createNebula(scene,camera){
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute([-1,-1,0,3,-1,0,-1,3,0],3));
 const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,depthTest:true,
  uniforms:{gain:{value:0},inverseProjection:{value:camera.projectionMatrixInverse},cameraWorld:{value:camera.matrixWorld}},
  vertexShader:`varying vec2 screenUv;void main(){screenUv=position.xy*.5+.5;gl_Position=vec4(position.xy,1.,1.);}`,
  fragmentShader:`varying vec2 screenUv;uniform float gain;uniform mat4 inverseProjection,cameraWorld;
   float n(vec2 p){return sin(p.x*6.+sin(p.y*3.))*sin(p.y*7.+cos(p.x*4.));}
   void main(){
    vec4 view=inverseProjection*vec4(screenUv*2.-1.,1.,1.);
    vec3 ray=normalize((cameraWorld*vec4(view.xyz/view.w,0.)).xyz);
    vec3 origin=cameraWorld[3].xyz;
    vec3 hit=origin+ray*((-560.-origin.z)/min(-.001,ray.z));
    vec2 p=(hit.xy-vec2(0.,20.))/vec2(700.,440.);
    float band=exp(-pow((p.y+.23*p.x+.025*n(p*3.))*4.7,2.));
    float wisps=.48+.23*n(p*2.)+.15*n(p*7.)+.08*n(p*19.);
    float a=band*wisps*gain;
    vec3 col=mix(vec3(.032,.022,.085),vec3(.13,.055,.12),clamp(p.x+.5,0.,1.));
    gl_FragColor=vec4(col*a,a*.30);
   }`});
 const mesh=new THREE.Mesh(geometry,material);mesh.frustumCulled=false;mesh.renderOrder=-1000;scene.add(mesh);
 function frame(gain){
  material.uniforms.gain.value=gain;mesh.visible=gain>0;
  const corners=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([x,y])=>{
   const ray=new THREE.Vector3(x,y,1).unproject(camera).sub(camera.position).normalize();
   const hit=camera.position.clone().addScaledVector(ray,(-560-camera.position.z)/ray.z);
   return [hit.x/700,(hit.y-20)/440];
  });
  return {mode:'unbounded-world-ray-field',fullViewport:true,finite:corners.flat().every(Number.isFinite),domainCorners:corners,gain};
 }
 return {mesh,material,frame};
}
