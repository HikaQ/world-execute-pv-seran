export const SCENE_GROUPS=[
 {
  "id": "circuit",
  "title": "断裂线路",
  "shots": [
   "R01",
   "R04",
   "R05"
  ],
  "subject": "多层红色神经线路与停止传播的光点"
 },
 {
  "id": "signal-node",
  "title": "信号跨越节点",
  "shots": [
   "R02",
   "R03"
  ],
  "subject": "粒子电极之间传播的亮点与分支纤维"
 },
 {
  "id": "fracture",
  "title": "破碎爱心",
  "shots": [
   "R06",
   "R07",
   "R08",
   "R09",
   "R10"
  ],
  "subject": "带颗粒纹理的破碎爱心，旧实例熄灭"
 },
 {
  "id": "archive",
  "title": "记忆切片",
  "shots": [
   "R11",
   "R12",
   "R13"
  ],
  "subject": "13 层来源切片与正在释放的临时粒子阵列"
 },
 {
  "id": "source-detail",
  "title": "来源微距",
  "shots": [
   "R14"
  ],
  "subject": "放大的真实身份来源 m003 与记录面扫描"
 },
 {
  "id": "queued-slips",
  "title": "未发出的消息",
  "shots": [
   "R15"
  ],
  "subject": "五条仍在队列中的封存消息薄片"
 },
 {
  "id": "volatile-store",
  "title": "临时存储清空",
  "shots": [
   "R16",
   "R17",
   "R18"
  ],
  "subject": "192 个颗粒存储单元按既定切点释放"
 },
 {
  "id": "abyss",
  "title": "残骸退远",
  "shots": [
   "R19",
   "R20",
   "R21",
   "R22"
  ],
  "subject": "来源字符与执行残迹缩为远点并进入黑场"
 },
 {
  "id": "workshop",
  "title": "五程序试画",
  "shots": [
   "H01"
  ],
  "subject": "五支笔在演算平面同时学习"
 },
 {
  "id": "missed-join",
  "title": "没有接上的两端",
  "shots": [
   "H02"
  ],
  "subject": "第一稿实际首尾的局部近景与断开的间隙"
 },
 {
  "id": "error-bench",
  "title": "失败样本",
  "shots": [
   "H03",
   "H04"
  ],
  "subject": "开口与交叉、锯齿与发散的两组独立样本"
 },
 {
  "id": "sample-engine",
  "title": "参数采样机构",
  "shots": [
   "H05"
  ],
  "subject": "x(t) 与 y(t) 粒子曲面共同驱动独立采样头"
 },
 {
  "id": "closing-seam",
  "title": "接缝闭合",
  "shots": [
   "H06"
  ],
  "subject": "真实爱心局部两端闭合，亮点沿粒子笔迹传出"
 },
 {
  "id": "comparison",
  "title": "五结果比较",
  "shots": [
   "H07"
  ],
  "subject": "中央唯一正确，五结果完整同框 2.8 秒"
 },
 {
  "id": "target-name",
  "title": "目标读取",
  "shots": [
   "H08"
  ],
  "subject": "HIKAQ 以粒子字样汇聚，下面保留绘图表达式"
 },
 {
  "id": "departure",
  "title": "只有她还在画",
  "shots": [
   "H09",
   "H11",
   "H12",
   "T01"
  ],
  "subject": "倾斜绘图空间逐渐空掉，红笔反复描同一颗心"
 },
 {
  "id": "empty-station",
  "title": "停笔后的空位",
  "shots": [
   "H10"
  ],
  "subject": "错误图形消散，留下空白演算面和停止的笔尖"
 }
];
export const sceneForShot=id=>SCENE_GROUPS.find(s=>s.shots.includes(id)).id;
