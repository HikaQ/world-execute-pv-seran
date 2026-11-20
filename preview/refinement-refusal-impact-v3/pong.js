import * as THREE from 'three';
import {stateAt} from '../refinement-refusal-pong-v1/score.js';

const W=1920,H=1080;
const game=document.createElement('canvas');game.width=W;game.height=H;
const cg=game.getContext('2d',{alpha:false});
const stable=document.createElement('canvas');stable.width=W;stable.height=H;
const sg=stable.getContext('2d',{alpha:false});
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,preserveDrawingBuffer:true});
renderer.setSize(W,H);renderer.setPixelRatio(1);renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();scene.background=new THREE.Color('#03060b');
const camera=new THREE.PerspectiveCamera(36,W/H,.1,100);
scene.add(new THREE.HemisphereLight('#a2b4d2','#020308',.5));
const key=new THREE.DirectionalLight('#d2dcea',3.5);key.position.set(-8,10,9);key.castShadow=true;
key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-12;key.shadow.camera.right=12;key.shadow.camera.top=12;key.shadow.camera.bottom=-12;key.shadow.bias=-.0005;scene.add(key);
const rim=new THREE.DirectionalLight('#8377a1',1.2);rim.position.set(8,4,-5);scene.add(rim);
const screenFill=new THREE.PointLight('#566b9d',4,18,2);screenFill.position.set(0,-1,2);scene.add(screenFill);
const chassis=new THREE.MeshStandardMaterial({color:'#0b111c',metalness:.54,roughness:.48});
const bevel=new THREE.MeshStandardMaterial({color:'#283346',metalness:.68,roughness:.38});
const black=new THREE.MeshStandardMaterial({color:'#030509',roughness:.72});
const footMaterial=new THREE.MeshStandardMaterial({color:'#111a29',metalness:.62,roughness:.48});
function box(w,h,d,mat,x,y,z){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;scene.add(m);return m;}
const screenW=13.44,screenH=7.56,screenY=.40;
box(screenW+.42,screenH+.48,.32,chassis,0,screenY,-.19);
box(screenW+.16,screenH+.16,.055,black,0,screenY,.005);
box(screenW+.38,.055,.035,bevel,0,screenY+screenH/2+.19,.004);
box(.045,screenH+.41,.04,bevel,-screenW/2-.19,screenY,.004);
box(.045,screenH+.41,.04,bevel,screenW/2+.19,screenY,.004);
box(screenW+.38,.075,.05,bevel,0,screenY-screenH/2-.19,.006);
box(.70,1.15,.36,chassis,0,-3.98,-.33);
box(4.35,.105,1.70,footMaterial,0,-4.58,.10);
const led=new THREE.Mesh(new THREE.PlaneGeometry(.035,.035),new THREE.MeshBasicMaterial({color:'#a8b6cb',toneMapped:false}));led.position.set(screenW/2-.26,screenY-screenH/2-.19,.036);scene.add(led);
const tex=new THREE.CanvasTexture(game);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=8;
const display=new THREE.Mesh(new THREE.PlaneGeometry(screenW,screenH),new THREE.MeshBasicMaterial({map:tex,toneMapped:false}));display.position.set(0,screenY,.044);scene.add(display);
const reflection=document.createElement('canvas');reflection.width=1024;reflection.height=576;
const rg=reflection.getContext('2d');const wash=rg.createLinearGradient(0,0,880,576);
wash.addColorStop(0,'rgba(170,195,230,.09)');wash.addColorStop(.34,'rgba(145,168,211,.012)');wash.addColorStop(.51,'rgba(145,168,211,0)');wash.addColorStop(1,'rgba(145,168,211,0)');rg.fillStyle=wash;rg.fillRect(0,0,1024,576);
const rt=new THREE.CanvasTexture(reflection);rt.colorSpace=THREE.SRGBColorSpace;
const glass=new THREE.Mesh(new THREE.PlaneGeometry(screenW,screenH),new THREE.MeshBasicMaterial({map:rt,transparent:true,depthWrite:false,toneMapped:false}));glass.position.set(0,screenY,.046);scene.add(glass);
const floor=new THREE.Mesh(new THREE.PlaneGeometry(100,100),new THREE.MeshStandardMaterial({color:'#03060b',roughness:.84,metalness:.05}));floor.rotation.x=-Math.PI/2;floor.position.y=-4.65;floor.receiveShadow=true;scene.add(floor);

function gameFrame(frame){
 const s=stateAt(frame);sg.fillStyle='#050b12';sg.fillRect(0,0,W,H);
 const pool=sg.createRadialGradient(960,540,160,960,540,1080);pool.addColorStop(0,'rgba(29,47,69,.30)');pool.addColorStop(1,'rgba(0,0,0,0)');sg.fillStyle=pool;sg.fillRect(0,0,W,H);
 sg.save();sg.translate(W,0);sg.scale(-1,1);
 sg.strokeStyle='rgba(145,165,188,.56)';sg.lineWidth=2;sg.beginPath();sg.moveTo(240,204);sg.lineTo(1680,204);sg.moveTo(240,876);sg.lineTo(1680,876);sg.stroke();
 sg.strokeStyle='rgba(128,149,177,.30)';sg.lineWidth=2;sg.setLineDash([10,22]);sg.beginPath();sg.moveTo(960,228);sg.lineTo(960,852);sg.stroke();sg.setLineDash([]);
 for(const [name,color] of [['left','#ee6489'],['right','#b6a1ea']]){
  const p=s.paddles[name];sg.strokeStyle=color;sg.lineWidth=3.2;sg.shadowColor=color;sg.shadowBlur=7;
  sg.strokeRect(p.x+1.6,p.y-p.height/2+1.6,p.width-3.2,p.height-3.2);sg.shadowBlur=0;
  sg.fillStyle=color;sg.globalAlpha=.58;for(let j=7;j<p.height-4;j+=8){sg.fillRect(p.x+6,p.y-p.height/2+j,1.4,1.4);sg.fillRect(p.x+10,p.y-p.height/2+j+3,1.4,1.4);}sg.globalAlpha=1;
 }
 sg.strokeStyle='#fff8ed';sg.lineWidth=2.8;sg.shadowColor='#e2e8ff';sg.shadowBlur=6;sg.beginPath();sg.arc(s.ball.x,s.ball.y,s.ball.radius-1.4,0,Math.PI*2);sg.stroke();sg.shadowBlur=0;
 sg.fillStyle='rgba(248,245,239,.7)';for(const [x,y] of [[-3,-3],[3,-3],[-3,3],[3,3]]){sg.beginPath();sg.arc(s.ball.x+x,s.ball.y+y,.8,0,Math.PI*2);sg.fill();}
 if(s.contact){const p=s.paddles[s.contact.side];sg.fillStyle=`rgba(255,241,241,${s.contact.strength*.8})`;sg.fillRect(s.contact.side==='left'?p.x+p.width-2:p.x,s.contact.y-10,2,20);}
 sg.restore();cg.drawImage(stable,0,0);
 if(frame>=8388){const p=Math.min(1,(frame-8388)/27);for(const y of [205,861]){cg.fillStyle='#050b12';cg.fillRect(0,y,W,5);cg.drawImage(stable,0,y,W,5,16*p,y,W,5);}}
 cg.fillStyle='rgba(0,0,0,.14)';for(let y=0;y<H;y+=3)cg.fillRect(0,y,W,1);
 return {frame,mirrorX:true,screenLeft:'violet',screenRight:'red',ball:{x:W-s.ball.x,y:s.ball.y,vx:-s.ball.vx,vy:s.ball.vy,radius:s.ball.radius},paddles:{red:{x:W-s.paddles.left.x-s.paddles.left.width,y:s.paddles.left.y},violet:{x:W-s.paddles.right.x-s.paddles.right.width,y:s.paddles.right.y}},historical:true,ballCount:1,paddleCount:2,displayBounds:[-screenW/2,screenY-screenH/2,screenW,screenH],glitchInsideDisplayOnly:true};
}
export function drawPong(g,frame){
 const state=gameFrame(frame),p=Math.max(0,Math.min(1,(frame-8304)/111));tex.needsUpdate=true;
 camera.position.set(1.28-.10*p,.85,15.55-.20*p);camera.lookAt(0,-.15,0);renderer.render(scene,camera);g.drawImage(renderer.domElement,0,0);
 return {...state,camera:camera.position.toArray(),presentation:'physical-screen'};
}
