import {ShaderPass} from '/node_modules/three/examples/jsm/postprocessing/ShaderPass.js';
import {ENTER,ramp} from './score.js';

// Hold the light palette for two beats, then return to dark over two beats.
// Card flight timing is independent and stays at the previous 0.6 seconds.
export const SUBMIT_LAUNCH={start:ENTER,palettePeak:1217/60,paletteHold:1271/60,paletteEnd:1327/60,
 fadeStart:1243/60,end:1252/60,speed:320,accelerationTime:.055,alignTime:.24};

export function submitLaunchAt(t){
 const s=SUBMIT_LAUNCH,elapsed=Math.max(0,Math.min(s.end-s.start,t-s.start)),submitted=t>=s.start;
 // Integrating a rising velocity sends the real card down the scene's Z axis.
 // Its physical dimensions stay fixed: perspective alone makes it recede.
 const distance=s.speed*(elapsed-s.accelerationTime*(1-Math.exp(-elapsed/s.accelerationTime)));
 const pulse=submitted?( .72+.28*ramp(t,s.start,s.palettePeak))*(1-ramp(t,s.paletteHold,s.paletteEnd)):0;
 return {submitted,active:t>=s.start&&t<s.end,elapsed,distance,
  speed:submitted?s.speed*(1-Math.exp(-elapsed/s.accelerationTime)):0,
  y:-1.35*(1-ramp(t,s.start,s.start+s.alignTime)),z:-3.2-distance,
  opacity:1-ramp(t,s.fadeStart,s.end),palette:pulse,
  paletteActive:pulse>0,windowEnd:s.end,paletteEnd:s.paletteEnd};
}

export function createSubmitLaunchPass(){
 const pass=new ShaderPass({uniforms:{tDiffuse:{value:null},pulse:{value:0}},
  vertexShader:`varying vec2 uv0;void main(){uv0=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader:`uniform sampler2D tDiffuse;uniform float pulse;varying vec2 uv0;
   void main(){vec4 source=texture2D(tDiffuse,uv0);vec3 c=source.rgb;
    float luminance=dot(c,vec3(.2126,.7152,.0722));
    float lines=pow(smoothstep(.015,.68,luminance),.78);
    vec3 paper=mix(vec3(.91,.92,.96),vec3(.96,.95,.99),uv0.y);
    vec3 bright=mix(paper,vec3(.105,.065,.17),lines);
    float red=smoothstep(.035,.19,c.r-max(c.g,c.b))*smoothstep(.045,.25,c.r);
    bright=mix(bright,vec3(.76,.018,.08),red);
    gl_FragColor=vec4(mix(c,bright,pulse),source.a);
   }`});
 // This pass follows OutputPass and works on the final display colors.
 pass.material.toneMapped=false;pass.enabled=false;
 return {pass,frame(state){pass.enabled=state.paletteActive;pass.uniforms.pulse.value=state.palette;}};
}
