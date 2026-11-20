// Chinese glosses stay attached to the existing scene objects, not subtitles.
export const ANNOTATION_FONT='"Noto Sans SC Credits"';
export const ROLE_NOTES={
 hikaq:'// 导演 · 统筹制作',music:'// 音乐',story:'// 剧本',
 'code-composition':'// 代码 · 画面构图',
};
export const BOOT_NOTES={allocate:'// 分配内存',isolate:'// 校验沙盒隔离',ready:'// 输入通道就绪'};
export const PERSONA_NOTES={
 'PREPARE PERSONA':'// 准备角色定义',
 'BUILDING SERAN':'// 正在构建希苒',
 '[LYRIC OMITTED]':'// 生成角色实例',
 '[LYRIC OMITTED]':'// 写入人物设定',
 'INITIALIZATION':'// 初始化本地运行环境',
};
export const FIELD_NOTES={name:'// 姓名',alias:'// 别名',gender:'// 性别',creator:'// 创建者',hair:'// 发色',eyes:'// 瞳色'};
export const WORLD_NOTES={
 'SERAN / LOCAL INSTANCE':'// 希苒 · 本地实例',
 'STATE SPACE / R⁴':'// 四维状态空间',
};
export const INPUT_NOTES={session:'// 本地会话',ready:'// 运行就绪',typing:'// 输入测试指令',waiting:'// 等待回车',submitted:'// 请求已入队'};
export const INSTANCE_NOTE='// 角色实例已生成';
export const ANNOTATION_TEXT=['希克君',INSTANCE_NOTE,...[ROLE_NOTES,BOOT_NOTES,PERSONA_NOTES,FIELD_NOTES,WORLD_NOTES,INPUT_NOTES].flatMap(Object.values)].join(' ');
