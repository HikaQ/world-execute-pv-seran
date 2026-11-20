const clamp=x=>Math.max(0,Math.min(1,x));
export const ease=x=>{x=clamp(x);return x*x*(3-2*x);};
export function profileAt(f){
 let family='intro',material=.24,halo=.20,bloom=1.15,threshold=.88,code=.0,ca=.65,red=false;
 if(f<1216){material=.12;halo=.12;bloom=1.08;ca=.35;}
 else if(f<2106){material=.20;halo=.18;bloom=1.12;code=.16;}
 else if(f<2439){family='geometry';material=.64;halo=.48;bloom=1.42;threshold=.62;code=.38;ca=.85;}
 else if(f<3126)return {family:'accepted-wave',material:0,halo:0,bloom:1,threshold:1,code:0,ca:0,red:false};
 else if(f<3630){family='perception';material=.50;halo=.35;bloom=1.38;threshold=.74;code=.25;ca=.9;}
 else if(f<3875){family='helix';material=.58;halo=.30;bloom=1.36;threshold=.63;code=.40;ca=.9;}
 else if(f<4316){family='signal';material=.63;halo=.38;bloom=1.40;threshold=.65;code=.30;ca=.8;}
 else if(f<4483){family='context';material=.58;halo=.23;bloom=1.22;threshold=.38;code=.62;ca=.75;}
 else if(f<4738){family='signal';material=.50;halo=.32;bloom=1.3;threshold=.72;code=.25;ca=.8;}
 else if(f<5430){family='care';material=.52;halo=.4;bloom=1.36;threshold=.66;code=.30;ca=.75;}
 else if(f<5625){family='mobius';material=.78;halo=.40;bloom=1.60;threshold=.57;code=.30;ca=.9;}
 else if(f<7861){family='memory';material=.62;halo=.42;bloom=1.44;threshold=.63;code=.36;ca=.85;
  if(f>=7367&&f<7460){material=.22;halo=.16;bloom=1.1;code=0;ca=.3;}
  if(f>=6533&&f<6976){material=.30;halo=.2;bloom=1.12;code=.22;}
 }
 else if(f<9192){family='refusal';material=.45;halo=.40;bloom=1.24;threshold=.8;code=.29;ca=1.0;
  if(f<8080){material=.16;bloom=1.07;code=.13;}
  if(f>=8304&&f<8637){material=.22;halo=.48;bloom=1.15;code=0;ca=.5;}
 }
 else if(f<10081){family='execution';material=.22;halo=.22;bloom=1.10;threshold=.93;code=.17;ca=.5;}
 else if(f<11858){family='red';material=.66;halo=.4;bloom=1.36;threshold=.50;code=.28;ca=.42;red=true;
  if(f>=11419){material=.38;halo=.24;bloom=1.20;threshold=.60;code=.18;}
 }
 else return {family:'ending',material:0,halo:0,bloom:1,threshold:1,code:0,ca:0,red:false};
 let weight=1;
 if(f>=2415&&f<2439)weight=ease((2439-f)/24);
 if(f>=3126&&f<3150)weight=ease((f-3126)/24);
 if(f>=11834)weight=ease((11858-f)/24);
 return {family,material:material*weight,halo:halo*weight,bloom:1+(bloom-1)*weight,threshold:1+(threshold-1)*weight,code:code*weight,ca:ca*weight,red};
}
