import {WebGLRenderer as Original} from '/references/world-execute-web/vendor/three/build/three.module.js?v=BkIP_83j';
import {beforeScene} from './upgrade.js';
export class WebGLRenderer extends Original{
 constructor(options){super(options);const original=this.render;this.render=(scene,camera)=>{beforeScene(this,scene,camera);return original.call(this,scene,camera);};}
}
