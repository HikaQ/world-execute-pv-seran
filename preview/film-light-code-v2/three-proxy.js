import * as Original from '/node_modules/three/build/three.module.js';
import {beforeScene} from './upgrade.js';
export * from '/node_modules/three/build/three.module.js';
export class WebGLRenderer extends Original.WebGLRenderer{
 constructor(options){super(options);const original=this.render;this.render=(scene,camera)=>{beforeScene(this,scene,camera);return original.call(this,scene,camera);};}
}
