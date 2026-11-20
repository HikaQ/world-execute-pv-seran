import * as THREE from 'three';

const clamp=x=>Math.max(0,Math.min(1,x));
const curveGLSL=`vec3 route(float u){float a=1.-u;return
 a*a*a*vec3(-7.5,-3.5,3.)+3.*a*a*u*vec3(-3.,-7.,7.)+
 3.*a*u*u*vec3(3.,-10.,4.)+u*u*u*vec3(13.,-10.,0.);}`;
function random(seed){return()=>{seed=(Math.imul(seed,1664525)+1013904223)|0;return(seed>>>0)/4294967296;};}

// The boundary has no visible mesh, painted surface, or continuous rim.
// Each visible mark is a particle with its own seed, position, depth and arrival time.
export function createTakeover({boundary,planet,halo,outerWall,outerHalo,bridgeLeft,bridgeRight}){
 const clouds=[];
 const vertex=`
 attribute vec3 seed;
 uniform float time,pressure,ownership,domainGain,radius,assembly;
 varying vec3 tint;varying float alpha;
 void main(){
  vec3 n0=normalize(position);
  float lon=atan(n0.x,n0.z)+time*(.08+seed.y*.055);
  float lat=asin(clamp(n0.y,-1.,1.));
  lat+=sin(lon*4.+time*2.2+seed.x*5.)*.018;
  vec3 n=vec3(sin(lon)*cos(lat),sin(lat),cos(lon)*cos(lat));
  vec3 tangent=normalize(vec3(n.z,0.,-n.x));
  float settle=smoothstep(seed.x*.42,.45+seed.x*.68,assembly);
  float initialCloud=(1.-settle)*step(.64,seed.z);
  // A sparse stream continues to join the shell after the initial assembly.
  float flight=fract(seed.x+time*(.38+seed.y*.15));
  float incoming=step(.83,seed.z);
  float falling=pow(1.-flight,2.)*incoming;
  float drift=initialCloud*(2.2+seed.y*3.4)+falling*2.5;
  float thickness=(seed.y-.5)*(.45+seed.x*.8);
  float ripple=.13*sin(n.y*8.+n.x*9.+time*5.)+.09*sin(n.z*17.+n.y*7.-time*3.);
  vec3 p=n*(radius+thickness+drift+ripple*(1.+pressure));
  p+=tangent*(initialCloud*(seed.y-.5)*5.+falling*1.2);
  vec4 world=modelMatrix*vec4(p,1.);
  vec3 wn=normalize(mat3(modelMatrix)*n);
  vec3 view=normalize(cameraPosition-world.xyz);
  float facing=dot(wn,view),face=smoothstep(-.08,.38,facing);
  float edge=pow(clamp(1.-abs(facing),0.,1.),3.);
  float light=.25+.75*max(0.,dot(wn,normalize(vec3(-.5,.8,1.))));
  float filament=pow(max(0.,sin(n.x*16.+n.y*8.+2.5*sin(n.z*7.)-time*5.)),14.);
  float sparkle=step(.985,seed.y)*(.6+.4*sin(time*6.+seed.x*77.));
  float energy=(.4+seed.x*.75+filament*.7+pressure*.17)*(light+edge*.28)*1.35;
  vec3 red=mix(vec3(.9,.006,.026),vec3(2.,.03,.10),seed.x);
  red=mix(red,vec3(1.9,.28,.4),sparkle*.6);
  tint=red*energy*domainGain*(.52+ownership*.48);
  float birth=smoothstep(0.,.12,flight);
  float scale=length(modelMatrix[0].xyz),retention=min(1.,scale*scale);
  float keep=1.-smoothstep(retention*.92,retention,seed.x);
  alpha=(.04+.96*face)*mix(1.,birth,incoming)*(.78+.22*settle)*keep;
  vec4 mv=viewMatrix*world;gl_Position=projectionMatrix*mv;
  gl_PointSize=clamp((1.3+seed.y*1.35+sparkle*.6)*38.*min(1.,scale)/max(1.,-mv.z),.85,4.2);
 }`;
 const fragment=`varying vec3 tint;varying float alpha;
  void main(){vec2 p=gl_PointCoord-.5;float r=length(p);if(r>.5)discard;
  float dotShape=1.-smoothstep(.12,.5,r);gl_FragColor=vec4(tint*dotShape*alpha,1.);}`;
 function cloud(mesh,count,radius,outside=false,speed=1){
  const rnd=random(71399+count),p=new Float32Array(count*3),s=new Float32Array(count*3);
  for(let i=0;i<count;i++){
   const y=1.-2.*(i+.5)/count,a=i*2.399963229728653+(rnd()-.5)*.018,r=Math.sqrt(1-y*y);
   p.set([r*Math.sin(a),y,r*Math.cos(a)],i*3);s.set([rnd(),rnd(),rnd()],i*3);
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));g.setAttribute('seed',new THREE.BufferAttribute(s,3));
  const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
   uniforms:{time:{value:0},pressure:{value:0},ownership:{value:0},domainGain:{value:1},radius:{value:radius},assembly:{value:0}},vertexShader:vertex,fragmentShader:fragment});
  const points=new THREE.Points(g,material);points.position.copy(mesh.position);points.frustumCulled=false;points.name='assembled-boundary-particles';
  mesh.parent.add(points);mesh.visible=false;clouds.push({points,material,count,outside,speed});
 }
 cloud(planet,240000,18);cloud(outerWall,180000,22,true,.8);
 cloud(bridgeLeft,110000,14,false,.9);cloud(bridgeRight,140000,18,true,.8);
 halo.visible=false;outerHalo.visible=false;

 const curve=new THREE.CubicBezierCurve3(new THREE.Vector3(-7.5,-3.5,3),new THREE.Vector3(-3,-7,7),new THREE.Vector3(3,-10,4),new THREE.Vector3(13,-10,0));
 const rnd=random(37041),n=30000,positions=new Float32Array(n*3);
 for(let i=0;i<n;i++)positions.set([rnd(),rnd(),rnd()],i*3);
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
 const streamMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
  uniforms:{time:{value:0},head:{value:0},pressure:{value:0},reveal:{value:.4}},
  vertexShader:`uniform float time,head,pressure,reveal;varying vec3 tint;varying float opacity;${curveGLSL}
   void main(){
    float u=fract(position.x+time*(.38+position.y*.17));
    float phase=position.y*6.283185+time*7.+u*15.;
    float tail=exp(-pow((u-head+.085)*9.,2.));
    float radius=(.045+tail*.3)*sqrt(position.z);
    vec3 p=route(u);p.y+=sin(phase)*radius;p.z+=cos(phase)*radius;
    float packet=pow(max(0.,sin(u*31.-time*19.)),8.);
    opacity=(.15+packet*.4+tail*.32)*(1.-smoothstep(reveal-.08,reveal,u));
    tint=mix(vec3(1.5,.004,.025),vec3(2.1,.32,.46),packet*tail*.6)*(1.+pressure*.35);
    vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;
    gl_PointSize=clamp((.8+position.z+tail*.6)*28./max(1.,-mv.z),.8,3.);
   }`,
  fragmentShader:'varying vec3 tint;varying float opacity;void main(){vec2 d=gl_PointCoord-.5;float a=exp(-dot(d,d)*25.);gl_FragColor=vec4(tint*a*opacity,1.);}'});
 const stream=new THREE.Points(geometry,streamMat);stream.frustumCulled=false;boundary.add(stream);

 function update(t,pulse,receiverAmbient=0){
  const ownership=.36+.64*clamp(t/.9),head=.015+.64*clamp(t/2.8),outsideGain=.045+.955*clamp((t-13.833333333)/.12);
  for(const [index,{material:m,outside,speed}] of clouds.entries()){
   m.uniforms.time.value=t*speed;m.uniforms.pressure.value=pulse;m.uniforms.ownership.value=ownership;
   m.uniforms.domainGain.value=outside?Math.max(outsideGain,index===1?receiverAmbient:0):index===0&&t>=14.11666666?.4:1;
   // The receiver assembles while reading the snapshot, before its eye awakens.
   m.uniforms.assembly.value=outside?Math.max(0,t-9.2):t;
  }
  streamMat.uniforms.time.value=t;streamMat.uniforms.pressure.value=pulse;
  streamMat.uniforms.head.value=head;streamMat.uniforms.reveal.value=.24+.76*clamp(t/.75);
  const p=curve.getPoint(head);p.y+=Math.sin(t*8.)*.12;p.z+=Math.sin(t*6.)*.1;
  return {corePosition:p.toArray(),head,ownership,pulse,surfaceWaveTime:t,streamTime:t,
   surfaceMode:'assembled-particles',solidBoundaryMeshesVisible:0,primaryBoundaryParticles:240000,
   boundaryParticleCounts:clouds.map(c=>c.count),assembly:clamp(t/1.13)};
 }
 return {update};
}
