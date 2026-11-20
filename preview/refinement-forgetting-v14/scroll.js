// A single clock keeps moving even while the edit visits another scene.
export const SCROLL={start:4316/60,rowsPerSecond:2/.4644,initialOffset:.35,capacity:24,top:7.25,bottom:-7.25,pitch:.58,totalRows:64};
export function abstractScrollAt(t){
 const active=t>=SCROLL.start,head=active?SCROLL.initialOffset+(t-SCROLL.start)*SCROLL.rowsPerSecond:0;
 const first=Math.max(0,Math.ceil(head-(SCROLL.top-6.9)/SCROLL.pitch));
 const last=Math.min(SCROLL.totalRows-1,Math.floor(head+(6.9-SCROLL.bottom)/SCROLL.pitch));
 return {head,scrollActive:active,scrollSpeed:SCROLL.rowsPerSecond,droppedRows:first,firstVisibleRow:first,lastVisibleRow:last,
  visibleRowCount:last-first+1,topClipped:true,bottomClipped:true,outsideHistoryVisible:false,
  scrollResetsOnCuts:false,clockAdvancesOffscreen:true,appearance:'abstract data bars',dialogueText:false};
}
