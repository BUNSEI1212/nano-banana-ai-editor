export interface CreativePrompt {
  id: string;
  title: string;
  description: string;
  prompt: string;
  category: string;
  requiresImage: boolean;
  tags: string[];
  author?: string;
}

export const creativePrompts: CreativePrompt[] = [
  {
    id: 'figure-generation',
    title: '插画变手办',
    description: '将插画角色转换为精美的手办模型',
    prompt: '将这张照片变成角色手办。在它后面放置一个印有角色图像的盒子，盒子上有一台电脑显示Blender建模过程。在盒子前面添加一个圆形塑料底座，角色手办站在上面。如果可能的话，将场景设置在室内',
    category: '手办模型',
    requiresImage: true,
    tags: ['手办', '3D建模', '角色设计'],
    author: '@ZHO_ZHO_ZHO'
  },
  {
    id: 'figure-generation-2',
    title: '插画变手办（2）',
    description: '将插画角色转换为超高细节的商业化手办模型',
    prompt: '高质量超高细节，近景特写，生动逼真的1/7比例商业化手办模型，采用PVC制作，精致涂装，置于现代的电脑桌上。电脑屏幕中显示该手办的C4D建模过程，屏幕光与环境光和谐融合。电脑屏幕旁放置一个印有原画设计稿的BANDAI风格塑料玩具包装盒，包装盒表面有磨损标签。桌面上散落着制作手办的工具，如精细画笔、专业颜料、雕刻小刀、镊子和打磨工具，这些工具呈现出使用痕迹。柔和自然光，产品摄影，景深效果显著，突出手办主体。写实主义，超高细节，工作室拍摄品质，8K分辨率。',
    category: '手办模型',
    requiresImage: true,
    tags: ['手办', '高质量', '商业化', 'PVC', '写实主义'],
    author: '@ZHO_ZHO_ZHO'
  },
  {
    id: 'map-to-street',
    title: '地图箭头生成地面视角',
    description: '根据地图上的箭头生成真实世界的街景视角',
    prompt: '画出红色箭头看到的内容',
    category: '地图转换',
    requiresImage: true,
    tags: ['地图', '街景', '视角转换'],
    author: '@tokumin'
  },
  {
    id: 'ar-annotation',
    title: '真实世界AR信息化',
    description: '为现实场景添加AR风格的信息标注',
    prompt: '你是一个基于位置的AR体验生成器。在这张图像中突出显示兴趣点并标注相关信息',
    category: 'AR增强',
    requiresImage: true,
    tags: ['AR', '信息标注', '增强现实'],
    author: '@bilawalsidhu'
  },
  {
    id: 'isometric-building',
    title: '等距3D建筑模型',
    description: '将建筑物转换为等距视图的3D模型',
    prompt: '将图像制作成白天和等距视图[仅限建筑]',
    category: '建筑设计',
    requiresImage: true,
    tags: ['等距', '建筑', '3D模型'],
    author: '@Zieeett'
  },
  {
    id: 'era-style',
    title: '不同时代风格转换',
    description: '将人物转换为不同历史时代的风格',
    prompt: '将角色的风格改为1970年代的经典男性风格，添加长卷发，长胡子，将背景改为标志性的加州夏季风景。不要改变角色的面部',
    category: '风格转换',
    requiresImage: true,
    tags: ['时代风格', '复古', '人物转换'],
    author: '@AmirMushich'
  },
  {
    id: 'auto-enhance',
    title: '自动修图增强',
    description: '自动增强照片的对比度、色彩和光线',
    prompt: '这张照片很无聊很平淡。增强它！增加对比度，提升色彩，改善光线使其更丰富，你可以裁剪和删除影响构图的细节',
    category: '图像增强',
    requiresImage: true,
    tags: ['修图', '增强', '色彩调整'],
    author: '@op7418'
  },
  {
    id: 'pose-control',
    title: '手绘图控制角色姿态',
    description: '使用手绘草图控制多个角色的姿势和动作',
    prompt: '让这两个角色使用图3的姿势进行战斗。添加适当的视觉背景和场景互动，生成图像比例为16:9',
    category: '姿态控制',
    requiresImage: true,
    tags: ['姿态', '手绘', '角色控制'],
    author: '@op7418'
  },
  {
    id: 'perspective-change',
    title: '跨视角图像生成',
    description: '将地面视角转换为俯视角度',
    prompt: '将照片转换为俯视角度并标记摄影师的位置',
    category: '视角转换',
    requiresImage: true,
    tags: ['视角', '俯视', '摄影'],
    author: '@op7418'
  },
  {
    id: 'sticker-design',
    title: '定制人物贴纸',
    description: '将人物转换为白色轮廓贴纸风格',
    prompt: '帮我将角色变成类似图2的白色轮廓贴纸。角色需要转换成网页插画风格，并添加一个描述图1的俏皮白色轮廓短语',
    category: '贴纸设计',
    requiresImage: true,
    tags: ['贴纸', '轮廓', '插画风格'],
    author: '@op7418'
  },
  {
    id: 'anime-cosplay',
    title: '动漫转真人Coser',
    description: '将动漫插画转换为真人cosplay照片',
    prompt: '生成一个女孩cosplay这张插画的照片，背景设置在Comiket',
    category: 'Cosplay',
    requiresImage: true,
    tags: ['cosplay', '动漫', '真人'],
    author: '@ZHO_ZHO_ZHO'
  },
  {
    id: 'character-sheet',
    title: '角色设定生成',
    description: '生成完整的角色设定表，包含三视图和表情设定',
    prompt: '为我生成人物的角色设定（Character Design）比例设定（不同身高对比、头身比等）三视图（正面、侧面、背面）表情设定（Expression Sheet）动作设定（Pose Sheet）服装设定（Costume Design）',
    category: '角色设计',
    requiresImage: true,
    tags: ['角色设定', '三视图', '表情设定'],
    author: '@ZHO_ZHO_ZHO'
  },
  {
    id: 'color-palette',
    title: '色卡线稿上色',
    description: '使用指定色卡为线稿图上色',
    prompt: '准确使用图2色卡为图1人物上色',
    category: '上色技巧',
    requiresImage: true,
    tags: ['上色', '色卡', '线稿'],
    author: '@ZHO_ZHO_ZHO'
  },
  {
    id: 'hairstyle-grid',
    title: '多种发型生成',
    description: '以九宫格形式生成同一人物的不同发型',
    prompt: '以九宫格的方式生成这个人不同发型的头像',
    category: '发型设计',
    requiresImage: true,
    tags: ['发型', '九宫格', '头像'],
    author: '@balconychy'
  },
  {
    id: 'marble-sculpture',
    title: '大理石雕塑',
    description: '将对象转换为精美的大理石雕塑',
    prompt: '一张超详细的图像中主体雕塑的写实图像，由闪亮的大理石制成。雕塑应展示光滑反光的大理石表面，强调其光泽和艺术工艺。设计优雅，突出大理石的美丽和深度。图像中的光线应增强雕塑的轮廓和纹理，创造出视觉上令人惊叹和迷人的效果',
    category: '雕塑艺术',
    requiresImage: true,
    tags: ['雕塑', '大理石', '艺术'],
    author: '@umesh_ai'
  },
  {
    id: 'cooking-recipe',
    title: '根据食材做菜',
    description: '根据提供的食材制作美味的料理',
    prompt: '用这些食材为我做一顿美味的午餐，放在盘子里，盘子的特写视图，移除其他盘子和食材',
    category: '美食制作',
    requiresImage: true,
    tags: ['美食', '食材', '料理'],
    author: '@Gdgtify'
  },
  {
    id: 'photo-colorize',
    title: '旧照片上色',
    description: '为黑白老照片添加自然的色彩',
    prompt: '修复并为这张照片上色',
    category: '照片修复',
    requiresImage: true,
    tags: ['上色', '修复', '老照片'],
    author: '@GeminiApp'
  },
  {
    id: 'outfit-change',
    title: '人物换衣',
    description: '为人物更换不同的服装',
    prompt: '将输入图像中人物的服装替换为参考图像中显示的目标服装。保持人物的姿势、面部表情、背景和整体真实感不变。让新服装看起来自然、合身，并与光线和阴影保持一致。不要改变人物的身份或环境——只改变衣服',
    category: '服装设计',
    requiresImage: true,
    tags: ['换衣', '服装', '时尚'],
    author: '@skirano'
  },
  {
    id: 'multi-view',
    title: '多视图生成',
    description: '生成物体的前后左右上下六个视图',
    prompt: '在白色背景上生成前、后、左、右、上、下视图。均匀分布。一致的主体。等距透视等效',
    category: '多视图',
    requiresImage: true,
    tags: ['多视图', '产品设计', '等距'],
    author: '@Error_HTTP_404'
  },
  {
    id: 'lego-figure',
    title: '乐高玩具小人',
    description: '将人物转换为乐高小人包装盒风格',
    prompt: '将照片中的人物转化为乐高小人包装盒的风格，以等距透视呈现。在包装盒上标注标题"ZHOGUE"。在盒内展示基于照片中人物的乐高小人，并配有他们必需的物品（如化妆品、包或其他物品）作为乐高配件。在盒子旁边，也展示实际乐高小人本身，未包装，以逼真且生动的方式渲染。',
    category: '玩具设计',
    requiresImage: true,
    tags: ['乐高', '玩具', '包装设计'],
    author: '@ZHO_ZHO_ZHO'
  },
  {
    id: 'gundam-model',
    title: '高达模型小人',
    description: '将人物转换为高达模型套件风格',
    prompt: '将照片中的人物转化为高达模型套件包装盒的风格，以等距透视呈现。在包装盒上标注标题"ZHOGUE"。在盒内展示照片中人物的高达风格机械人版本，并伴随其必需品（如化妆品、包袋或其他物品）重新设计为未来派机械配件。包装盒应类似真实的 Gunpla 盒子，包含技术插图、说明书风格细节和科幻字体。在盒子旁边，也展示实际的高达风格机械人本身，在包装外以逼真且栩栩如生的风格渲染，类似于官方 Bandai 宣传渲染图。',
    category: '模型设计',
    requiresImage: true,
    tags: ['高达', '模型', '机械'],
    author: '@ZHO_ZHO_ZHO'
  },
  {
    id: 'id-photo',
    title: '制作证件照',
    description: '将人物照片转换为标准证件照格式',
    prompt: '截取图片人像头部，帮我做成2寸证件照，要求：1、蓝底 2、职业正装 3、正脸 4、微笑',
    category: '证件照',
    requiresImage: true,
    tags: ['证件照', '正装', '蓝底'],
    author: '@songguoxiansen'
  },
  {
    id: 'jewelry-design',
    title: '珠宝首饰设计',
    description: '将图像转换为珠宝首饰系列设计',
    prompt: '将这张图像变成一条包含 5 件首饰的系列。',
    category: '珠宝设计',
    requiresImage: true,
    tags: ['珠宝', '首饰', '设计'],
    author: '@Gdgtify'
  },
  {
    id: 'merchandise',
    title: '周边设计',
    description: '使用角色图像创建各种商品周边',
    prompt: '用这个角色图像创建商品',
    category: '周边设计',
    requiresImage: true,
    tags: ['周边', '商品', '设计'],
    author: '@0xFramer'
  },
  {
    id: 'multi-reference',
    title: '多参考图像生成',
    description: '使用多个参考图像生成复杂场景',
    prompt: '一个模特摆姿势靠在粉色宝马车上。她穿着以下物品，场景背景是浅灰色。绿色外星人是一个钥匙扣，挂在粉色手提包上。模特肩上还有一只粉色鹦鹉。旁边坐着一只戴着粉色项圈和金色耳机的哈巴狗',
    category: '复合场景',
    requiresImage: true,
    tags: ['多参考', '复杂场景', '模特'],
    author: '@MrDavids1'
  },
  {
    id: 'infographic',
    title: '文章信息图',
    description: '将文章内容转换为可爱的信息图',
    prompt: '为文章内容生成信息图。要求：1. 将内容翻译成英文，并提炼文章的关键信息 2. 图中内容保持精简，只保留大标题 3. 图中文字采用英文 4. 加上丰富可爱的卡通人物和元素',
    category: '信息图表',
    requiresImage: true,
    tags: ['信息图', '卡通', '文章'],
    author: '@黄建同学'
  },
  {
    id: 'model-annotation',
    title: '模型标注讲解图',
    description: '为3D模型添加详细的标注说明',
    prompt: '绘制3D人体器官模型展示示例心脏用于学术展示，进行标注讲解，适用于展示其原理和每个器官的功能，非常逼真，高度还原，精细度非常细致的设计',
    category: '教育标注',
    requiresImage: false,
    tags: ['标注', '教育', '3D模型'],
    author: '@berryxia_ai'
  },
  {
    id: 'math-solution',
    title: '数学题推理',
    description: '解答数学题并在对应位置标注答案',
    prompt: '根据问题将问题的答案写在对应的位置上',
    category: '教育辅助',
    requiresImage: true,
    tags: ['数学', '解题', '教育'],
    author: '@Gorden Sun'
  },
  {
    id: 'ootd-styling',
    title: 'OOTD穿搭',
    description: '为人物搭配时尚的OOTD造型',
    prompt: '选择图1中的人，让他们穿上图2中的所有服装和配饰。在户外拍摄一系列写实的OOTD风格照片，使用自然光线，时尚的街头风格，清晰的全身镜头。保持图1中人物的身份和姿势，但以连贯时尚的方式展示图2中的完整服装和配饰',
    category: '时尚搭配',
    requiresImage: true,
    tags: ['OOTD', '时尚', '搭配'],
    author: '@302.AI'
  },
  {
    id: 'movie-storyboard',
    title: '电影分镜',
    description: '创作12部分的电影故事分镜',
    prompt: '用这两个角色创作一个令人上瘾的12部分故事，包含12张图像，讲述经典的黑色电影侦探故事。故事关于他们寻找线索并最终发现的失落的宝藏。整个故事充满刺激，有情感的高潮和低谷，以精彩的转折和高潮结尾。不要在图像中包含任何文字或文本，纯粹通过图像本身讲述故事',
    category: '故事创作',
    requiresImage: true,
    tags: ['分镜', '故事', '电影'],
    author: '@GeminiApp'
  },
  {
    id: 'pose-modification',
    title: '人物姿势修改',
    description: '调整人物的姿势和朝向',
    prompt: '让图片中的人直视前方',
    category: '姿态调整',
    requiresImage: true,
    tags: ['姿势', '调整', '人物'],
    author: '@arrakis_ai'
  },
  {
    id: 'line-art-generation',
    title: '线稿图生成',
    description: '根据线稿和参考图生成完整图像',
    prompt: '将图一人物换成图二姿势，专业摄影棚拍摄',
    category: '线稿转换',
    requiresImage: true,
    tags: ['线稿', '姿势', '摄影'],
    author: '@ZHO_ZHO_ZHO'
  },
  {
    id: 'watermark-add',
    title: '添加水印',
    description: '为图像添加重复的文字水印',
    prompt: '在整个图片上反复覆盖"TRUMP"这个词。',
    category: '水印处理',
    requiresImage: true,
    tags: ['水印', '文字', '覆盖'],
    author: '@AiMachete'
  },
  {
    id: 'knowledge-infographic',
    title: '知识推理信息图',
    description: '制作知识性的彩色信息图',
    prompt: '为我制作一张世界五座最高建筑的信息图',
    category: '知识图表',
    requiresImage: false,
    tags: ['知识', '信息图', '建筑'],
    author: '@icreatelife'
  },
  {
    id: 'red-pen-critique',
    title: '红笔批注',
    description: '用红笔标出图片可以改进的地方',
    prompt: '分析这张图片。用红笔标出你可以改进的地方。',
    category: '图片分析',
    requiresImage: true,
    tags: ['批注', '分析', '改进'],
    author: '@AiMachete'
  },
  {
    id: 'explosive-food',
    title: '爆炸式食物广告',
    description: '制作动态爆炸效果的食物广告',
    prompt: '在具有戏剧性的现代场景中拍摄该产品，并伴随着爆炸性的向外动态排列，主要成分新鲜和原始在产品周围飞舞，表明其新鲜度和营养价值。促销广告镜头，没有文字，强调产品，以关键品牌颜色作为背景。',
    category: '广告设计',
    requiresImage: true,
    tags: ['广告', '食物', '动态效果'],
    author: '@icreatelife'
  },
  {
    id: 'comic-creation',
    title: '制作漫画书',
    description: '基于图像创作漫画故事',
    prompt: '基于上传的图像，制作漫画书条幅，添加文字，写一个引人入胜的故事。我想要一本奇幻漫画书。',
    category: '漫画创作',
    requiresImage: true,
    tags: ['漫画', '故事', '奇幻'],
    author: '@icreatelife'
  },
  {
    id: 'action-figure',
    title: '动作人偶',
    description: '制作个性化的动作人偶包装',
    prompt: '制作一个写着 "AI Evangelist - Kris" 的动作人偶，并包含 咖啡、乌龟、笔记本电脑、手机和耳机 。',
    category: '人偶设计',
    requiresImage: true,
    tags: ['人偶', '包装', '个性化'],
    author: '@icreatelife'
  },
  {
    id: 'isometric-landmark',
    title: '地标等距建筑',
    description: '将地图位置转换为等距游戏风格建筑',
    prompt: '以这个位置为地标，将其设为等距图像（仅建筑物），采用游戏主题公园的风格',
    category: '等距设计',
    requiresImage: true,
    tags: ['等距', '地标', '游戏风格'],
    author: '@demishassabis'
  },
  {
    id: 'expression-control',
    title: '表情控制',
    description: '使用参考图控制人物表情',
    prompt: '图一人物参考/换成图二人物的表情',
    category: '表情设计',
    requiresImage: true,
    tags: ['表情', '控制', '参考'],
    author: '@ZHO_ZHO_ZHO'
  },
  {
    id: 'drawing-process',
    title: '绘画过程四格',
    description: '展示插画的绘画过程',
    prompt: '为人物生成绘画过程四宫格，第一步：线稿，第二步平铺颜色，第三步：增加阴影，第四步：细化成型。不要文字',
    category: '绘画教程',
    requiresImage: true,
    tags: ['绘画', '过程', '教程'],
    author: '@ZHO_ZHO_ZHO'
  },
  {
    id: 'virtual-makeup',
    title: '虚拟试妆',
    description: '为人物试用不同的妆容',
    prompt: '为图一人物化上图二的妆，还保持图一的姿势',
    category: '美妆试用',
    requiresImage: true,
    tags: ['试妆', '美妆', '虚拟'],
    author: '@ZHO_ZHO_ZHO'
  },
  {
    id: 'makeup-analysis',
    title: '妆面分析',
    description: '分析妆容并提出改进建议',
    prompt: '分析这张图片。用红笔标出可以改进的地方',
    category: '美妆分析',
    requiresImage: true,
    tags: ['妆面', '分析', '改进'],
    author: '@ZHO_ZHO_ZHO'
  },
  {
    id: 'hand-drawn-pose-control',
    title: '手绘图控制多角色姿态',
    description: '使用手绘草图控制多个角色的战斗姿态',
    prompt: '让这两个角色使用图3的姿势进行战斗。添加适当的视觉背景和场景互动，生成图像比例为16:9',
    category: '姿态控制',
    requiresImage: true,
    tags: ['手绘', '姿态', '战斗', '多角色'],
    author: '@op7418'
  },
  {
    id: 'cross-perspective',
    title: '跨视角图像生成',
    description: '将地面视角转换为俯视角度',
    prompt: '将照片转换为俯视角度并标记摄影师的位置',
    category: '视角转换',
    requiresImage: true,
    tags: ['俯视', '视角转换', '摄影'],
    author: '@op7418'
  },
  {
    id: 'custom-sticker',
    title: '定制人物贴纸',
    description: '将人物转换为白色轮廓贴纸风格',
    prompt: '帮我将角色变成类似图2的白色轮廓贴纸。角色需要转换成网页插画风格，并添加一个描述图1的俏皮白色轮廓短语',
    category: '贴纸设计',
    requiresImage: true,
    tags: ['贴纸', '轮廓', '插画风格'],
    author: '@op7418'
  },
  {
    id: 'google-maps-fantasy',
    title: 'Google地图视角下的中土世界',
    description: '创建奇幻世界的街景视角',
    prompt: '行车记录仪谷歌街景拍摄 | 霍比屯街道 | 霍比特人进行园艺和抽烟斗等日常活动 | 晴天',
    category: '奇幻场景',
    requiresImage: false,
    tags: ['街景', '奇幻', '霍比屯'],
    author: '@TechHallo'
  },
  {
    id: 'typography-illustration',
    title: '印刷插画生成',
    description: '使用文字字母创作极简主义插画',
    prompt: '仅使用短语 "riding a bike" 中的字母，创作一幅极简主义的黑白印刷插图，描绘骑自行车的场景。每个字母的形状和位置都应富有创意，以构成骑车人、自行车和动感。设计应简洁、极简，完全由修改后的 "riding a bike" 字母组成，不添加任何额外的形状或线条。字母应流畅或弯曲，以模仿场景的自然形态，同时保持清晰易读。',
    category: '字体设计',
    requiresImage: false,
    tags: ['字体', '极简', '插画'],
    author: '@Umesh'
  },
  {
    id: 'multiple-pose-sheet',
    title: '超多人物姿势生成',
    description: '为角色创建包含各种姿势的姿势表',
    prompt: '请为这幅插图创建一个姿势表，摆出各种姿势',
    category: '姿态设计',
    requiresImage: true,
    tags: ['姿势表', '多姿势', '角色设计'],
    author: '@tapehead_Lab'
  },
  {
    id: 'product-packaging',
    title: '物品包装生成',
    description: '将图像贴在产品包装上进行专业摄影',
    prompt: '把图一贴在图二易拉罐上，并放在极简设计的布景中，专业摄影',
    category: '包装设计',
    requiresImage: true,
    tags: ['包装', '产品摄影', '极简'],
    author: '@ZHO_ZHO_ZHO'
  },
  {
    id: 'filter-overlay',
    title: '叠加滤镜/材质',
    description: '为照片叠加特殊材质效果',
    prompt: '为图一照片叠加上图二玻璃的效果',
    category: '滤镜效果',
    requiresImage: true,
    tags: ['滤镜', '材质', '玻璃效果'],
    author: '@ZHO_ZHO_ZHO'
  },
  {
    id: 'face-shape-control',
    title: '控制人物脸型',
    description: '按照参考图调整人物脸型为Q版形象',
    prompt: '图一人物按照图二的脸型设计为q版形象',
    category: 'Q版设计',
    requiresImage: true,
    tags: ['脸型', 'Q版', '形象设计'],
    author: '@ZHO_ZHO_ZHO'
  },
  {
    id: 'lighting-control',
    title: '光影控制',
    description: '使用参考图控制人物的光影效果',
    prompt: '图一人物变成图二光影，深色为暗',
    category: '光影设计',
    requiresImage: true,
    tags: ['光影', '明暗', '效果'],
    author: '@ZHO_ZHO_ZHO'
  },
  {
    id: 'hardware-exploded',
    title: '硬件拆解图',
    description: '生成设备的详细拆解示意图',
    prompt: '数码单反相机的分解图，展示了其所有配件和内部组件，例如镜头、滤镜、内部组件、镜头、传感器、螺丝、按钮、取景器、外壳和电路板。保留了数码单反相机的红色装饰。',
    category: '技术图解',
    requiresImage: false,
    tags: ['拆解图', '硬件', '技术'],
    author: '@AIimagined'
  },
  {
    id: 'food-calorie-annotation',
    title: '食物卡路里标注',
    description: '为食物添加营养信息标注',
    prompt: '用食物名称、卡路里密度和近似卡路里来注释这顿饭',
    category: '营养标注',
    requiresImage: true,
    tags: ['卡路里', '营养', '食物标注'],
    author: '@icreatelife'
  },
  {
    id: 'extract-transparent',
    title: '提取信息并放置透明图层',
    description: '提取指定对象并设置透明背景',
    prompt: '提取武士并放置透明背景',
    category: '图像提取',
    requiresImage: true,
    tags: ['提取', '透明背景', '抠图'],
    author: '@nglprz'
  },
  {
    id: 'image-outpainting',
    title: '图像外扩修复',
    description: '修复图像中的缺失部分',
    prompt: '将图像的棋盘格部分进行修复，恢复为完整图像',
    category: '图像修复',
    requiresImage: true,
    tags: ['外扩', '修复', '补全'],
    author: '@bwabbage'
  },
  {
    id: 'ancient-map-scene',
    title: '古老地图生成古代场景',
    description: '根据古代地图生成现代彩色照片',
    prompt: '全彩照片。1660 年的新阿姆斯特丹。确保它是全现代色彩，就像它是今天拍摄的照片一样。',
    category: '历史重现',
    requiresImage: true,
    tags: ['古代', '历史', '彩色化'],
    author: '@levelsio'
  },
  {
    id: 'fashion-mood-board',
    title: '时尚服装拼贴画',
    description: '创建时尚情绪板拼贴画',
    prompt: '时尚情绪板拼贴画。用模特所穿单品的剪纸图案围绕肖像画。用俏皮的马克笔字体添加手写笔记和草图，并用英文标注每件单品的品牌名称和来源。整体美感应该兼具创意和可爱。',
    category: '时尚设计',
    requiresImage: true,
    tags: ['时尚', '拼贴', '情绪板'],
    author: '@tetumemo'
  },
  {
    id: 'miniature-product-photo',
    title: '精致可爱的产品照片',
    description: '制作微型产品的高端广告照片',
    prompt: '一张高分辨率广告照片，一位男士用拇指和食指精心握着一件逼真的微型产品。背景干净清爽，摄影棚灯光，阴影柔和。手部造型精致，肤色自然，摆放位置凸显了产品的形状和细节。产品看起来极小，但细节丰富，品牌形象精准，位于画面中央，景深浅。模仿了奢侈品摄影和极简主义商业风格。',
    category: '产品摄影',
    requiresImage: false,
    tags: ['微型', '产品摄影', '广告'],
    author: '@azed_ai'
  },
  {
    id: 'anime-statue-reality',
    title: '动漫雕像放入现实',
    description: '将角色制作成现实中的巨型雕像',
    prompt: '一幅写实的摄影作品。这个人的巨型雕像被安放在东京市中心的广场上，人们仰望着它。',
    category: '现实融合',
    requiresImage: true,
    tags: ['雕像', '现实', '巨型'],
    author: '@riddi0908'
  },
  {
    id: 'itasha-car',
    title: '痛车制作',
    description: '制作动漫主题的彩绘汽车',
    prompt: '打造一张专业的跑车照片，以动漫风格的人物图案作为"痛车"（彩绘汽车）的设计，拍摄地点为著名的旅游景点或地标。汽车上醒目的大型动漫人物插图，构图简洁干净。人物图案应采用鲜艳的动漫艺术风格，色彩大胆，细节清晰。将车辆放置在自然光线充足的知名旅游景点或风景区，以展现车辆的运动外观和人物图案。运用专业的汽车摄影技巧，并结合适当的景深，突出"痛车"图案，同时融入风景背景，提升旅游吸引力，适合用于促销或爱好者营销材料。',
    category: '汽车设计',
    requiresImage: true,
    tags: ['痛车', '动漫', '汽车'],
    author: '@riddi0908'
  },
  {
    id: 'manga-composition',
    title: '漫画构图',
    description: '使用人物和场景参考创作漫画构图',
    prompt: '参考图一人物和图二场景构图，创作漫画风格的作品',
    category: '漫画创作',
    requiresImage: true,
    tags: ['漫画', '构图', '场景'],
    author: '@namaedousiyoka'
  },
  {
    id: 'manga-style-conversion',
    title: '漫画风格转换',
    description: '将图片转换为黑白漫画线稿',
    prompt: '将输入的图片处理为黑白漫画风格线稿',
    category: '风格转换',
    requiresImage: true,
    tags: ['漫画', '线稿', '黑白'],
    author: '@nobisiro_2023'
  },
  {
    id: 'isometric-hologram',
    title: '等距全息投影图',
    description: '将图像转换为线框全息投影效果',
    prompt: '根据上传的图像，仅用线框进行全息化',
    category: '全息效果',
    requiresImage: true,
    tags: ['全息', '线框', '等距'],
    author: '@tetumemo'
  },
  {
    id: 'minecraft-style',
    title: 'Minecraft 风格场景生成',
    description: '将地标转换为Minecraft游戏风格',
    prompt: '使用此位置将​​地标制作成游戏 Minecraft 的 HD-2D 风格的等距图像（仅建筑物）。',
    category: '游戏风格',
    requiresImage: true,
    tags: ['Minecraft', '游戏', '像素'],
    author: '@tetumemo'
  },
  {
    id: 'material-sphere',
    title: '材质球赋予材质',
    description: '将材质球的材质应用到logo上',
    prompt: '将图2的材质用在图1的logo上，3d立体呈现，渲染c4d，纯色背景',
    category: '材质渲染',
    requiresImage: true,
    tags: ['材质', '3D渲染', 'C4D'],
    author: '@ZHO_ZHO_ZHO'
  },
  {
    id: 'floor-plan-3d',
    title: '平面图3D渲染',
    description: '将住宅平面图转换为3D渲染',
    prompt: '帮我把这个住宅平面图转换为房屋的等距照片级真实感 3D 渲染。',
    category: '建筑渲染',
    requiresImage: true,
    tags: ['平面图', '3D渲染', '建筑'],
    author: '@op7418'
  },
  {
    id: 'camera-settings',
    title: '重置相机参数',
    description: '使用指定相机参数重新拍摄',
    prompt: 'RAW-ISO 100 - F28-1/200 24mm 设置',
    category: '摄影参数',
    requiresImage: true,
    tags: ['相机', '参数', '摄影'],
    author: '@hckinz'
  },
  {
    id: 'a6-folding-card',
    title: '场景 A6 折叠卡',
    description: '设计3D球形小屋的折叠卡',
    prompt: '绘制一个 A6 折叠卡：打开时它会展示一个完整的 3D 球形小屋，里面有一座微型的纸花园和盆景树。',
    category: '卡片设计',
    requiresImage: true,
    tags: ['折叠卡', '3D', '微型'],
    author: '@Gdgtify'
  },
  {
    id: 'chess-design',
    title: '设计国际象棋',
    description: '设计受图片启发的3D打印棋子',
    prompt: '绘制一个棋盘和受此图片启发的 3D 打印棋子',
    category: '棋类设计',
    requiresImage: true,
    tags: ['象棋', '3D打印', '棋子'],
    author: '@Gdgtify'
  },
  {
    id: 'split-comparison',
    title: '分割对照样式照片',
    description: '创建不同时代的对比照片',
    prompt: '一张卧室的照片，从中间分开，左边是 2018 年，右边是 1964 年，是同一个房间',
    category: '时代对比',
    requiresImage: false,
    tags: ['对比', '时代', '分割'],
    author: '@fofrAI'
  }
];
