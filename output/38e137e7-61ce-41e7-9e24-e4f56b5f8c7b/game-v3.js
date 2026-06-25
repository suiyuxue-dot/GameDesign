// ============================================================
//  研究生求生录 v3 — Graduate Survival Record
//  全面数值版：扩展属性/专属危机选项/幽默结局/修复道具
// ============================================================

const GAME = (function() {
'use strict';

// ============ STATE ============
let S = null;

function initState() {
  return {
    week: 1, maxWeek: 12, phase: '入学适应期',
    energy: 5, energyMax: 5, energyBonus: 0, energyUsedThisWeek: 0,
    satisfaction: 50, satMax: 100,
    paperProgress: 0, prestige: 0, network: 0, intel: 0, resilience: 0,
    mood: 70, moodMax: 100,
    health: 80, healthMax: 100,
    fatigue: 0, fatigueMax: 100,
    money: 0,
    hasPartner: false, partnerName: null, partnerMood: 0,
    actionsThisWeek: [], executedCount: 0,
    crisisCount: 0, weeksSatisfiedHigh: 0, weeksLowSat: 0,
    paperActionsTotal: 0, taskActionsTotal: 0, investigateActionsTotal: 0,
    networkActionsTotal: 0, loveActionsTotal: 0, partimeActionsTotal: 0,
    fishActionsTotal: 0, restActionsTotal: 0, healthActionsTotal: 0, adminActionsTotal: 0,
    itemsUsed: 0, crisisResolvedCount: 0, crisisFailedCount: 0,
    supervisor: null, items: [], itemIds: [], ended: false,
    inCrisis: false, inExam: false, weekResolved: false,
    clueThisWeek: [], cluesLog: [],
    shopVisits: 0, noRareStreak: 0,
    gambleWinCount: 0, socialMediaPosts: 0,
    breakdownCount: 0, confessionAccepted: false,
  };
}

// ============ SUPERVISOR ============
const SUPERVISOR_NAMES = ['王教授','李导师','张博导','刘老师','陈院士','赵研究员','孙教授','周博导'];
const SUPERVISOR_ICONS = ['👨‍🏫','👩‍🏫','🧑‍🏫','👨‍🔬','👩‍🔬','🧐','😏','😈'];

function genSupervisor() {
  const exps = ['论文型','平衡型','人脉型'];
  const prefs = ['道具奖励型','声望奖励型','能力奖励型'];
  const idx = Math.floor(Math.random()*SUPERVISOR_NAMES.length);
  return {
    name: SUPERVISOR_NAMES[idx], icon: SUPERVISOR_ICONS[idx],
    expectation: exps[Math.floor(Math.random()*3)],
    threshold: 30 + Math.floor(Math.random()*21),
    preference: prefs[Math.floor(Math.random()*3)],
    revealed: { expectation: false, threshold: false, preference: false },
  };
}

// ============ CLUES ============
const CLUE_POOLS = {
  expectation: {
    '论文型': ['导师桌上堆满了期刊审稿意见…','导师提到"最近有个不错的综述方向"','你看到导师在改一篇很长的论文稿','导师说"发不了论文一切都是空谈"'],
    '平衡型': ['导师说"论文和人脉都要抓"','导师提到"下周有个学术会议，想去看看"','导师似乎既关注论文也关注社交','导师说"做研究也要走出去"'],
    '人脉型': ['导师最近频繁参加各种饭局…','导师说"认识人多路好走"','你发现导师手机通讯录里有几百个学者','导师提到"有个项目需要找人合作"'],
  },
  threshold: {
    low: ['导师今天看起来心情不错','导师给你倒了杯茶','导师说"慢慢来，不急"'],
    mid: ['导师表情严肃了一些','导师说"进度要抓紧了"','导师翻了翻你的工作记录'],
    high: ['导师眉头紧锁','导师把杯子重重放在桌上','导师说"我不希望看到这个进度"'],
  },
  preference: {
    '道具奖励型': ['导师抽屉里好像放着什么…','导师说"做得好有奖励"','你看到导师准备了一些小礼物'],
    '声望奖励型': ['导师说"我会给你署名机会"','导师提到"推荐你去学术会议"','导师说"表现好给你加学分"'],
    '能力奖励型': ['导师说"我会教你真本事"','导师提到"让你参与核心项目"','导师说"能力提升比什么都重要"'],
  }
};

function genClues(sup) {
  const clues = [];
  const count = 1 + (Math.random() < 0.4 ? 1 : 0);
  for (let i = 0; i < count; i++) {
    const accurate = Math.random() < 0.8;
    const attrType = ['expectation','threshold','preference'][Math.floor(Math.random()*3)];
    let pool;
    if (accurate) {
      if (attrType === 'expectation') pool = CLUE_POOLS.expectation[sup.expectation];
      else if (attrType === 'threshold') {
        const cat = sup.threshold <= 35 ? 'low' : sup.threshold <= 45 ? 'mid' : 'high';
        pool = CLUE_POOLS.threshold[cat];
      } else pool = CLUE_POOLS.preference[sup.preference];
    } else {
      pool = [...CLUE_POOLS.expectation['论文型'], ...CLUE_POOLS.expectation['人脉型'], ...CLUE_POOLS.threshold.low, ...CLUE_POOLS.threshold.high];
    }
    const text = pool[Math.floor(Math.random()*pool.length)];
    if (!clues.includes(text)) clues.push(text);
  }
  return clues;
}

// ============ ACTIONS ============
const ACTIONS = [
  { id:'task', name:'完成导师任务', icon:'📋', cat:'cat-task', cost:2,
    desc:'执行导师交代的研究任务，提升满意度但消耗精力',
    tag:'', tagClass:'',
    effects:{ sat:8, prestige:4, fatigue:8, mood:-3 },
    flavor:'导师："这个周五之前交给我。"',
    log:'你完成了导师的任务', trackKey:'taskActionsTotal' },
  { id:'paper', name:'推进论文研究', icon:'📝', cat:'cat-paper', cost:2,
    desc:'专注推进自己的论文，积累论文进度',
    tag:'', tagClass:'',
    effects:{ paper:1, prestige:3, fatigue:10, mood:-2 },
    flavor:'参考文献堆成了山…',
    log:'你推进了论文研究', trackKey:'paperActionsTotal' },
  { id:'investigate', name:'调查导师意图', icon:'🔍', cat:'cat-investigate', cost:1,
    desc:'暗中调查导师的隐藏属性，获取线索',
    tag:'', tagClass:'',
    effects:{ intel:2, fatigue:3 },
    flavor:'知己知彼，百战不殆',
    log:'你调查了导师的意图', trackKey:'investigateActionsTotal', special:'investigate' },
  { id:'network', name:'拓展人脉', icon:'🤝', cat:'cat-network', cost:1,
    desc:'参加学术社交活动，积累人脉和情报',
    tag:'', tagClass:'',
    effects:{ network:2, intel:1, prestige:1, fatigue:4, money:-20 },
    flavor:'"加个微信呗！"——饭局永远是信息集散地',
    log:'你拓展了人脉关系', trackKey:'networkActionsTotal' },
  { id:'admin', name:'应付行政事务', icon:'🗂️', cat:'cat-admin', cost:1,
    desc:'处理报销、填表、开会等杂事，小幅提升满意度',
    tag:'', tagClass:'',
    effects:{ sat:3, fatigue:5, mood:-5 },
    flavor:'又是一堆没人看的表格…',
    log:'你应付了行政事务', trackKey:'adminActionsTotal' },
  // --- NEW: Negative/Risky Actions ---
  { id:'love', name:'谈恋爱', icon:'💕', cat:'cat-love', cost:1,
    desc:'花时间经营恋爱关系，大幅提升心情但影响学业',
    tag:'风险', tagClass:'tag-risk',
    effects:{ mood:20, fatigue:-5, sat:-3, prestige:-1 },
    flavor:'图书馆四楼的那个身影…',
    log:'你去谈恋爱了', trackKey:'loveActionsTotal', special:'love' },
  { id:'partime', name:'兼职打工', icon:'💰', cat:'cat-partime', cost:2,
    desc:'去奶茶店/家教/代写赚外快，有钱但很累',
    tag:'赚钱', tagClass:'tag-good',
    effects:{ money:200, fatigue:15, mood:-5, sat:-2, health:-3 },
    flavor:'"欢迎光临！"——你一个研究生在奶茶店打工',
    log:'你去兼职打工了', trackKey:'partimeActionsTotal' },
  { id:'fish', name:'摸鱼', icon:'🐟', cat:'cat-fish', cost:0,
    desc:'假装在实验室实则刷手机，恢复心情但啥也没干',
    tag:'摸鱼', tagClass:'tag-fish',
    effects:{ mood:10, fatigue:-8, sat:-2 },
    flavor:'手机屏幕使用时间：12小时',
    log:'你摸了一整天鱼', trackKey:'fishActionsTotal' },
  { id:'rest', name:'休息补觉', icon:'😴', cat:'cat-rest', cost:1,
    desc:'好好睡一觉，恢复健康和精力，降低劳累',
    tag:'恢复', tagClass:'tag-good',
    effects:{ health:15, fatigue:-20, mood:8, sat:-1 },
    flavor:'闹钟？什么闹钟？',
    log:'你好好休息了一下', trackKey:'restActionsTotal' },
  { id:'health', name:'锻炼身体', icon:'🏃', cat:'cat-health', cost:1,
    desc:'去操场跑步或健身房，恢复健康和心情',
    tag:'恢复', tagClass:'tag-good',
    effects:{ health:20, mood:10, fatigue:5, sat:-1 },
    flavor:'操场上一圈又一圈，你在跑赢学位的倒计时',
    log:'你去锻炼了身体', trackKey:'healthActionsTotal' },
  { id:'gamble', name:'买彩票', icon:'🎰', cat:'cat-partime', cost:1,
    desc:'赌一把！可能暴富也可能白扔钱',
    tag:'赌博', tagClass:'tag-risk', effects:{},
    flavor:'"万一中了呢？"——每次都这么想',
    log:'你买了张彩票', trackKey:'partimeActionsTotal', special:'gamble' },
  { id:'social_media', name:'发朋友圈', icon:'📱', cat:'cat-fish', cost:0,
    desc:'发条学术朋友圈，可能获得人脉也可能社死',
    tag:'社交', tagClass:'', effects:{},
    flavor:'"深夜实验室打卡 #学术狗"',
    log:'你发了条朋友圈', trackKey:'fishActionsTotal', special:'social_media' },
];

// ============ CRISIS EVENTS (每种危机有独立专属选项) ============
const CRISIS_EVENTS = [
  { id:'group_meeting', name:'组会被怼', level:1, icon:'😱',
    desc:'组会上导师当众质疑你的研究方案，全场鸦雀无声。你感觉二十几双眼睛像激光一样射向你。',
    baseImpact:{ sat:-10, mood:-15 },
    options:[
      { name:'诚恳接受批评', desc:'"谢谢老师指正！我回去马上改"', effects:{ sat:-5, mood:-8, prestige:2 }, msg:'你虚心接受了批评，导师似乎对你态度好转了点' },
      { name:'据理力争', desc:'当场用数据反驳导师的质疑', effects:{ sat:-15, mood:-5, prestige:5, intel:1 }, msg:'导师愣了一下，然后说"嗯，有想法"' },
      { name:'装死混过去', desc:'低头不语，等风头过去', effects:{ sat:-10, mood:-12, fatigue:3 }, msg:'你熬过了组会，但心灵创伤+1' },
    ] },
  { id:'urgent_revision', name:'紧急改稿令', level:2, icon:'🚨',
    desc:'深夜11点，导师在群里@你："明早8点前把论文第三稿改完发我。"你看了一眼时间，又看了一眼未完成的草稿，深吸一口气。',
    baseImpact:{ sat:-5, fatigue:15, health:-10, paper:-2 },
    options:[
      { name:'通宵改稿', desc:'红牛+咖啡，肝到天亮', effects:{ sat:3, fatigue:20, health:-15, paper:1, mood:-10 }, msg:'你通宵改完了稿子，导师回了个"嗯"' },
      { name:'请求宽限', desc:'"老师我明后天给您行吗？"', effects:{ sat:-8, mood:-5, fatigue:5 }, msg:'导师："行吧，后天之前。"' },
      { name:'交半成品', desc:'改了多少交多少，先应付一下', effects:{ sat:-12, paper:-1, mood:-8 }, msg:'导师看完沉默了30秒，你度秒如年' },
    ] },
  { id:'supervisor_missing', name:'导师出差失联', level:2, icon:'🕵️',
    desc:'导师突然出差了，微信不回，邮件不回，电话不接。你不知道这周的任务是什么，也不知道该做什么。',
    baseImpact:{ sat:0, mood:-5 },
    options:[
      { name:'趁机摸鱼', desc:'导师不在=放假！', effects:{ mood:15, fatigue:-10, sat:-3 }, msg:'你在实验室刷了一天B站，爽！' },
      { name:'自主推进论文', desc:'没有导师指手画脚反而效率高', effects:{ paper:2, prestige:3, fatigue:8, mood:5 }, msg:'你一口气写了三页，灵感如泉涌！' },
      { name:'联系师兄师姐', desc:'打听导师行踪和任务', effects:{ network:2, intel:1, sat:-1 }, msg:'师兄："别找了，老师去开会了，下周回来"' },
    ] },
  { id:'breakup', name:'被分手了', level:2, icon:'💔',
    desc:'你的另一半发来消息："我们分手吧，你眼里只有论文和实验室。"你的心情瞬间跌到谷底。',
    baseImpact:{ mood:-30, sat:-5, health:-5 },
    options:[
      { name:'化悲愤为力量', desc:'把所有精力投入论文！', effects:{ paper:2, mood:-15, fatigue:10, prestige:3 }, msg:'你含泪写了2000字，质量出奇地好' },
      { name:'找朋友倾诉', desc:'约兄弟/闺蜜出来喝酒吐槽', effects:{ mood:-10, network:1, money:-50, health:-3 }, msg:'喝到凌晨2点，至少不是一个人难过了' },
      { name:'试图挽回', desc:'写长文求复合', effects:{ mood:-20, fatigue:5, sat:-3 }, msg:'消息发出去石沉大海…你盯着聊天框看了一整夜' },
      { name:'无所谓！学术才是真爱', desc:'"爱情是短暂的，SCI是永恒的"', effects:{ mood:-5, paper:1, prestige:2 }, msg:'你擦干眼泪，打开了Latex。论文不会辜负你！' },
    ] },
  { id:'academic_misconduct', name:'学术不端指控', level:3, icon:'⚖️',
    desc:'有人举报你论文数据涉嫌造假！学院已经介入调查。你的学术生涯悬于一线。',
    baseImpact:{ sat:-25, mood:-20, prestige:-10 },
    options:[
      { name:'拿出原始数据自证清白', desc:'实验室记录本就是你的护身符', effects:{ sat:-5, prestige:5, mood:-10, fatigue:10 }, msg:'你翻出了所有原始记录，证据链完整，指控被撤销！' },
      { name:'找导师出面担保', desc:'请导师帮忙说话', effects:{ sat:-10, network:-1, mood:-8 }, msg:'导师皱着眉头帮你说了几句话，事件降级处理' },
      { name:'沉默应对', desc:'不回应，等风头过去', effects:{ sat:-30, prestige:-15, mood:-15 }, msg:'沉默被解读为默认，你的名声受到了严重打击' },
    ] },
  { id:'health_collapse', name:'身体亮红灯', level:2, icon:'🚑',
    desc:'连续熬夜让你在实验室差点晕倒，校医严肃地说："你再这样下去要出大事。"',
    baseImpact:{ health:-20, mood:-10, fatigue:10 },
    options:[
      { name:'乖乖休息一周', desc:'什么都不干，就躺着', effects:{ health:25, fatigue:-15, mood:5, sat:-5 }, msg:'你躺了一周，感觉活过来了' },
      { name:'吃保健品继续肝', desc:'维生素+鱼油+红牛，永动机！', effects:{ health:-10, fatigue:5, money:-80, paper:1 }, msg:'你在药片和咖啡因中继续战斗，但身体在抗议' },
      { name:'去看中医调理', desc:'挂号排队两小时，看病五分钟', effects:{ health:15, money:-100, fatigue:5 }, msg:'老中医说你"气血两虚"，开了一堆药方' },
    ] },
  { id:'financial_crisis', name:'经济危机', level:1, icon:'💸',
    desc:'月末了，你的银行卡余额只剩两位数。导师的补贴还没发，你连食堂都快吃不起了。',
    baseImpact:{ mood:-15, money:-50 },
    options:[
      { name:'省吃俭用', desc:'馒头配榨菜，一周生存挑战', effects:{ mood:-10, health:-5, money:30 }, msg:'你靠馒头和泡面活过了一周，瘦了3斤' },
      { name:'找人借钱', desc:'张口向同学借500块', effects:{ money:500, mood:-8, network:-1 }, msg:'同学二话没说转了账，但你欠了个人情' },
      { name:'卖闲置回血', desc:'闲鱼上架旧书和电子产品', effects:{ money:150, mood:3 }, msg:'你把本科教材卖了150块，感觉像捡了钱' },
    ] },
  { id:'roommate_conflict', name:'室友矛盾', level:1, icon:'😤',
    desc:'室友凌晨2点还在外放打游戏，你忍无可忍终于爆发了。宿舍气氛降到冰点。',
    baseImpact:{ mood:-10, health:-5, fatigue:5 },
    options:[
      { name:'正面交锋', desc:'"能不能戴耳机？！"', effects:{ mood:5, fatigue:-3, network:-1 }, msg:'室友沉默了，然后默默戴上了耳机' },
      { name:'申请换宿舍', desc:'找辅导员申请调宿', effects:{ mood:-5, fatigue:5 }, msg:'辅导员说"等下学期再说吧"' },
      { name:'忍气吞声', desc:'买耳塞和眼罩', effects:{ mood:-8, money:-30, health:-3 }, msg:'你戴上耳塞躺床上，听到的换成了心跳声' },
    ] },
  { id:'peer_pressure', name:'同门内卷', level:2, icon:'⚔️',
    desc:'同门的师兄发了一篇顶会论文，导师在组会上夸了他三次，还意味深长地看了你一眼。',
    baseImpact:{ mood:-15, sat:-5, prestige:-3 },
    options:[
      { name:'暗暗发奋', desc:'"总有一天我要超过他"', effects:{ paper:1, fatigue:8, mood:-5, prestige:3 }, msg:'你咬着牙多写了一页论文，压力即动力' },
      { name:'套近乎求带飞', desc:'请师兄吃饭求指导', effects:{ network:2, intel:2, money:-80, mood:3 }, msg:'师兄传授了你写论文的秘诀，值了！' },
      { name:'佛系看待', desc:'"每个人都有自己的节奏"', effects:{ mood:8, sat:-2, fatigue:-3 }, msg:'你深呼吸三次，选择了peace and love' },
    ] },
  { id:'data_loss', name:'实验数据丢失', level:3, icon:'💀',
    desc:'你的硬盘坏了！三个月的实验数据全没了！你盯着黑屏，感觉天都塌了。',
    baseImpact:{ paper:-3, mood:-25, health:-10, sat:-10 },
    options:[
      { name:'找数据恢复公司', desc:'花大价钱抢救数据', effects:{ paper:-1, money:-300, mood:-10, fatigue:5 }, msg:'恢复公司找回了80%的数据，破财消灾' },
      { name:'重新做实验', desc:'含泪从头再来', effects:{ paper:-3, fatigue:15, health:-8, mood:-15 }, msg:'你看着空白的实验记录本，眼眶湿润了' },
      { name:'用文献数据凑', desc:'引用公开数据集补充', effects:{ paper:-1, prestige:-2, mood:-5 }, msg:'你用公开数据勉强补上了缺口，但心里没底' },
    ] },
  { id:'love_confession', name:'被人表白', level:1, icon:'💌',
    desc:'有个同学突然给你递了情书！但你现在论文进度严重不足，恋爱可能雪上加霜。',
    baseImpact:{ mood:5 },
    options:[
      { name:'答应在一起', desc:'"我也挺喜欢你的"', effects:{ mood:25, sat:-5, paper:-1 }, msg:'你脱单了！朋友圈喜提99+赞' },
      { name:'委婉拒绝', desc:'"现在学业太忙了，以后再说"', effects:{ mood:-5, sat:2 }, msg:'你拒绝了对方，心无旁骛地投入科研' },
      { name:'暧昧不表态', desc:'既不接受也不拒绝', effects:{ mood:10, sat:-3, fatigue:3 }, msg:'你陷入了暧昧的拉扯，心累指数上升' },
    ] },
  { id:'plagiarism_discovery', name:'发现别人抄袭你', level:2, icon:'🤬',
    desc:'你在知网上发现有人抄袭了你的未发表论文！愤怒之余你发现对方已经先发了。',
    baseImpact:{ mood:-20, prestige:-5, sat:-3 },
    options:[
      { name:'举报维权', desc:'收集证据向期刊举报', effects:{ prestige:8, mood:-5, fatigue:10, sat:2 }, msg:'经过一个月的拉扯，论文被撤稿了！正义得到伸张！' },
      { name:'抢先发预印本', desc:'立刻上传arXiv占坑', effects:{ paper:1, prestige:3, mood:5 }, msg:'你在arXiv上传了预印本，夺回了优先权' },
      { name:'自认倒霉', desc:'算了，惹不起', effects:{ mood:-15, prestige:-3 }, msg:'你咽下了这口气，但每次看到那篇论文都很难受' },
    ] },
  { id:'supervisor_pressure', name:'导师施压毕业', level:3, icon:'⏰',
    desc:'导师把你叫到办公室："你这进度，今年怕是毕不了业啊。"语气平静但眼神锐利。',
    baseImpact:{ sat:-15, mood:-20, fatigue:5 },
    options:[
      { name:'承诺加速', desc:'"老师我一定加紧！保证毕业！"', effects:{ sat:5, fatigue:10, paper:1, mood:-10 }, msg:'导师点点头："好，我等着看你的表现"' },
      { name:'请求延期答辩', desc:'"能不能给我多一个学期？"', effects:{ sat:-5, mood:-5 }, msg:'导师："可以，但延毕的后果你自己清楚"' },
      { name:'展示已有成果', desc:'把所有数据和草稿摆出来', effects:{ sat:3, prestige:3, intel:1, mood:-3 }, msg:'导师看了看说"基础还行，但得加快了"' },
    ] },
  { id:'mental_breakdown', name:'心理崩溃', level:3, icon:'😭',
    desc:'连续的压力让你在深夜实验室崩溃大哭了。你开始怀疑自己为什么要读研。',
    baseImpact:{ mood:-30, health:-10, sat:-5 },
    options:[
      { name:'去做心理咨询', desc:'预约校心理咨询中心', effects:{ mood:15, health:5, fatigue:-5 }, msg:'咨询师很温柔，聊完你觉得好多了' },
      { name:'给家里打电话', desc:'听听妈妈的声音', effects:{ mood:20, health:3, sat:2 }, msg:'妈妈说"实在不行就回家，别硬撑"。你哭了，但心里暖了' },
      { name:'独自扛过去', desc:'哭完继续写论文', effects:{ mood:-10, fatigue:8, paper:1, health:-5 }, msg:'你擦干眼泪，继续在键盘上敲打。没有人看到你的崩溃' },
    ] },
  { id:'conference_opportunity', name:'学术会议机会', level:1, icon:'🎤',
    desc:'一个不错的学术会议邀请你做报告！这是个露脸的好机会，但准备PPT需要大量时间。',
    baseImpact:{},
    options:[
      { name:'全力以赴准备', desc:'通宵做PPT和排练', effects:{ prestige:15, fatigue:15, mood:10, paper:-1, sat:5 }, msg:'你的报告大获成功！有好几个教授找你交换名片' },
      { name:'随便讲讲', desc:'念PPT混过去', effects:{ prestige:3, mood:-3, fatigue:5 }, msg:'报告反响平平，但至少没出丑' },
      { name:'放弃参加', desc:'没时间，专注论文', effects:{ paper:1, prestige:-2, mood:-5 }, msg:'你放弃了机会，但心里有些遗憾' },
    ] },
];

// ============ ITEMS (修复+丰富) ============
const ITEM_POOL = [
  { id:'I-01', name:'论文自动存档', icon:'💾', rar:'epic', cat:'engine',
    eff:'每周结算时，若本周推进论文≥2次，满意度额外+3',
    flavor:'"Ctrl+S是你最好的朋友"——某过来人',
    passive:true, passiveEff:'论文≥2次/周→满意度+3' },
  { id:'I-02', name:'持续发表引擎', icon:'📈', rar:'epic', cat:'engine',
    eff:'累计推进论文10次时，触发"自动发表"（满意度+15）',
    flavor:'量产型学术机器的核心组件',
    passive:true, passiveEff:'论文累计10次→满意度+15' },
  { id:'I-03', name:'人脉情报网', icon:'🕸️', rar:'epic', cat:'engine',
    eff:'人脉值增加时同步获得情报+1（每周最多3次）',
    flavor:'你的社交网络就是你的情报网',
    passive:true, passiveEff:'人脉增加→情报+1' },
  { id:'I-04', name:'危机缓冲垫', icon:'🛡️', rar:'epic', cat:'engine',
    eff:'每周开始时韧性+1(上限6)；韧性≥3时危机率-10%',
    flavor:'心理建设从入学第一天开始',
    passive:true, passiveEff:'每周韧性+1；韧性≥3→危机率-10%' },
  { id:'A-01', name:'周报模板', icon:'📄', rar:'common', cat:'amp',
    eff:'使用时：本周完成导师任务费用-1', flavor:'模板在手，周报不愁' },
  { id:'A-02', name:'恭维话术', icon:'💬', rar:'common', cat:'amp',
    eff:'使用时：满意度+5（每周最多2次，第二次+2）', flavor:'"老师您今天气色真好！"' },
  { id:'A-03', name:'调查额外线索', icon:'🔎', rar:'rare', cat:'amp',
    eff:'使用时：进行1次调查并额外获得1条线索，费用-1', flavor:'专业八卦技能get' },
  { id:'A-04', name:'口碑积累', icon:'🌟', rar:'rare', cat:'amp',
    eff:'满意度每+5获得1枚口碑Token(上限4)；每枚Token满意度上限+1', flavor:'金杯银杯不如口碑' },
  { id:'A-05', name:'关键情报侦查', icon:'🎯', rar:'rare', cat:'amp',
    eff:'使用时：立即揭示导师期望方向；本局导师任务匹配度+10%', flavor:'一针见血，直击要害' },
  { id:'A-06', name:'组会精华提炼', icon:'💡', rar:'common', cat:'amp',
    eff:'使用时：本周首次论文研究后满意度+5', flavor:'组会不是浪费时间，是灵感来源！' },
  { id:'A-09', name:'韧性强化训练', icon:'💪', rar:'legendary', cat:'amp',
    eff:'使用时：韧性+3；后3周成功应对危机→永久韧性+1', flavor:'百炼成钢，百骂成习惯' },
  { id:'A-10', name:'学长私下指导', icon:'🧑‍🎓', rar:'rare', cat:'amp',
    eff:'使用时：人脉+2；人脉≥5时额外获得1条情报(准确率90%)', flavor:'师兄："听我的，别走我弯路"' },
  { id:'A-11', name:'文献突击阅读', icon:'📚', rar:'common', cat:'amp',
    eff:'使用时：弃手牌1张换论文进度+2（弃稀有卡则+4）', flavor:'一天读完30篇文献的秘诀：只看摘要' },
  { id:'A-13', name:'摸鱼节能模式', icon:'🔋', rar:'common', cat:'amp',
    eff:'每周开始时，若上周精力使用≤2，本周精力+1', flavor:'节能减排，从实验室做起' },
  { id:'A-14', name:'危机应急预案', icon:'⚡', rar:'common', cat:'amp',
    eff:'使用时：本周危机等级-1（每周1次）', flavor:'B计划永远准备好' },
  { id:'A-16', name:'精力置换术', icon:'🔄', rar:'legendary', cat:'amp',
    eff:'使用时：弃2张手牌换精力+3（本周第2次使用弃3张）', flavor:'用知识换体力，血赚' },
  { id:'A-17', name:'理论突破点', icon:'🔬', rar:'common', cat:'amp',
    eff:'累计论文达5/10/15次时：满意度+8，下次导师任务效果×1.5', flavor:'Eureka！就是这个角度！' },
  { id:'A-19', name:'佛系摸鱼', icon:'🧘', rar:'common', cat:'amp',
    eff:'本周不使用行动→下周精力+2，本周满意度不变', flavor:'无为而治，大道至简' },
  { id:'A-20', name:'多线并行协议', icon:'⚡', rar:'rare', cat:'amp',
    eff:'使用时：本周精力上限提升至7（每局最多2次）', flavor:'时间管理大师的自我修养' },
  { id:'P-01', name:'满意度护盾', icon:'🛡️', rar:'common', cat:'prot',
    eff:'持有：满意度首次降低时减半（每周1次）', flavor:'心理防线第一道', passive:true, passiveEff:'满意度首降减半' },
  { id:'P-02', name:'危机缓冲协议', icon:'📦', rar:'common', cat:'prot',
    eff:'持有：随机危机触发时50%概率等级-1', flavor:'运气也是实力的一部分', passive:true, passiveEff:'随机危机50%降级' },
  { id:'P-04', name:'保研资格护身符', icon:'🍀', rar:'rare', cat:'prot',
    eff:'持有：满意度降至50以下时30%概率自动+10（每局3次）', flavor:'四年努力换来的护身符', passive:true, passiveEff:'满意度<50→30%概率+10' },
  { id:'P-06', name:'同门友情联盟', icon:'🤜', rar:'rare', cat:'prot',
    eff:'使用时：消耗人脉2取消本周随机危机；取消后下周人脉+1', flavor:'兄弟同心，其利断金' },
  { id:'P-07', name:'韧性防火墙', icon:'🔥', rar:'legendary', cat:'prot',
    eff:'持有：满意度首次降至阈值以下时免疫；每周末韧性-1', flavor:'心理防火墙已启动', passive:true, passiveEff:'首降至阈值以下→免疫' },
  { id:'F-01', name:'论文冲刺最终版', icon:'🚀', rar:'legendary', cat:'fin',
    eff:'使用时：论文≥12次→立即通关+声望+30；否则满意度+20，本周费用-1', flavor:'"终稿"这个词你说了47遍' },
  { id:'F-02', name:'危机大反转', icon:'🔄', rar:'legendary', cat:'fin',
    eff:'使用时：本局危机≥5次→韧性+5/满意度+15/精力+3；否则韧性+2/满意度+5', flavor:'越挫越勇，浴火重生' },
  { id:'F-03', name:'纸面研究生协议', icon:'📜', rar:'legendary', cat:'fin',
    eff:'持有：满意度不影响危机率，论文效率×2；但满意度=0→退学', flavor:'"只要论文够多，导师就看不见我"', passive:true, passiveEff:'论文×2；满意度不防危机' },
  { id:'S-01', name:'临时暂停协议', icon:'⏸️', rar:'rare', cat:'spec',
    eff:'使用时：本周跳过满意度结算（每局1次）', flavor:'暂停键，人生难得' },
  { id:'S-02', name:'满分申请书', icon:'💯', rar:'rare', cat:'spec',
    eff:'持有：连续3周满意度≥80→声望收入×1.5（降至79则失效）', flavor:'完美学生的契约', passive:true, passiveEff:'3周满意度≥80→声望×1.5' },
  { id:'S-03', name:'黑材料威慑', icon:'🗂️', rar:'common', cat:'spec',
    eff:'使用时：消耗情报5，取消本周强制危机；下周导师奖励失效', flavor:'"老师，我手上有一些有趣的东西…"' },
  { id:'S-04', name:'内鬼线人', icon:'🕵️', rar:'common', cat:'spec',
    eff:'使用时：消耗人脉2，提前获取下周全部线索(准确率100%)', flavor:'你在导师办公室安插了…不，只是运气好' },
  // === NEW HUMOROUS ITEMS ===
  { id:'N-01', name:'速效救心丸', icon:'💊', rar:'common', cat:'amp',
    eff:'使用时：心情+20，健康+10，但下周精力-1', flavor:'"研究生常备药品No.1"——校医院药房标语' },
  { id:'N-02', name:'导师同款保温杯', icon:'🍵', rar:'common', cat:'prot',
    eff:'持有：每周开始时心情+3，疲劳-5', flavor:'枸杞泡茶，养生学术两不误', passive:true, passiveEff:'每周心情+3/疲劳-5' },
  { id:'N-03', name:'实验室泡面囤货', icon:'🍜', rar:'common', cat:'amp',
    eff:'使用时：精力+2但健康-5；本周论文行动费用-1', flavor:'一箱泡面=一周口粮=三篇论文的燃料' },
  { id:'N-04', name:'B站大会员', icon:'📺', rar:'common', cat:'amp',
    eff:'使用时：心情+15，但本周所有行动满意度效果-3', flavor:'"我在B站学编程"——你信吗？' },
  { id:'N-05', name:'玄学护身符', icon:'🔮', rar:'rare', cat:'prot',
    eff:'持有：每次危机时25%概率自动化解（不消耗精力）', flavor:'转发这个杨超越，论文必过', passive:true, passiveEff:'25%概率自动化解危机' },
  { id:'N-06', name:'导师表情包合集', icon:'😏', rar:'common', cat:'spec',
    eff:'使用时：心情+25，人脉+1，但若导师发现→满意度-15', flavor:'你把导师做成表情包发到了群里…' },
  { id:'N-07', name:'脱发保险', icon:'🧑‍🦲', rar:'rare', cat:'prot',
    eff:'持有：每周健康-2时改为不降低；使用时获得¥500赔偿金', flavor:'"我们保障你的头发，不保障你的论文"' },
  { id:'N-08', name:'学术锦鲤', icon:'🐟', rar:'legendary', cat:'spec',
    eff:'持有：所有随机事件好运率+15%；使用时：论文进度+3', flavor:'你也不知道为什么，但运气确实变好了', passive:true, passiveEff:'好运+15%' },
];

function getItemById(id) { return ITEM_POOL.find(i => i.id === id); }

// ============ ENDINGS (12+ 种幽默结局) ============
const ENDINGS = [
  // === Good Endings ===
  { id:'perfect_grad', title:'🎓 完美毕业', icon:'🎓', type:'success',
    sub:'满意度≥80 + 论文≥12 + 健康≥50 + 心情≥60\n你不仅顺利毕业，还成了导师的得意门生。毕业典礼上导师主动跟你合影，发朋友圈配文"青出于蓝"。你怀疑他是不是被盗号了。',
    cond:s => s.satisfaction >= 80 && s.paperProgress >= 12 && s.health >= 50 && s.mood >= 60 },
  { id:'paper_machine', title:'📝 论文机器', icon:'📝', type:'success',
    sub:'论文≥14 + 声望≥60\n你的论文产出量让导师都害怕。毕业时你已经发了5篇SCI，导师说"你能不能慢点，我跟不上了"。你最终去了某顶尖高校任教，三年后你导师给你发邮件求合作。',
    cond:s => s.paperProgress >= 14 && s.prestige >= 60 },
  { id:'network_master', title:'🤝 人脉之王', icon:'🤝', type:'success',
    sub:'人脉≥10 + 声望≥50\n你毕业时认识的教授比导师还多。去了大厂当管培生，三年后成了你导师的上司的下属的领导。过年给导师发祝福，导师秒回"老同学好"。',
    cond:s => s.network >= 10 && s.prestige >= 50 },
  { id:'crisis_master', title:'🛡️ 百毒不侵', icon:'🛡️', type:'success',
    sub:'危机解决≥5次 + 韧性≥5\n你在读研期间经历了九九八十一难，但每次都逢凶化吉。毕业时你的抗压能力已经爆表，去做了危机公关。第一个客户就是你导师——他被举报学术不端。',
    cond:s => s.crisisResolvedCount >= 5 && s.resilience >= 5 },
  { id:'love_balance', title:'💕 人生赢家', icon:'💕', type:'success',
    sub:'有伴侣 + 满意度≥65 + 心情≥70 + 健康≥50\n你不仅顺利毕业，还收获了爱情。毕业典礼上你带着另一半拍照，同学们投来羡慕嫉妒恨的目光。导师看了说"年轻人真会安排"。',
    cond:s => s.hasPartner && s.satisfaction >= 65 && s.mood >= 70 && s.health >= 50 },
  { id:'rich_student', title:'💰 研究生首富', icon:'💰', type:'success',
    sub:'存款≥1000 + 顺利毕业\n你读研期间靠兼职赚了一套首付。导师说你"心思不在学术上"，但你毕业后买了导师隔壁的房子。每天早上遛狗遇到导师，他沉默了。',
    cond:s => s.money >= 1000 && s.satisfaction >= 65 },
  // === Neutral Endings ===
  { id:'barely_pass', title:'😅 惊险毕业', icon:'😅', type:'normal',
    sub:'满意度≥65 + 论文≥10（标准毕业）\n你卡着及格线毕业了。答辩时评委问了个问题你答不上来，导师在旁边疯狂暗示。最终以"勉强通过"收场。你走出答辩教室时腿还在抖。',
    cond:s => s.satisfaction >= 65 && s.paperProgress >= 10 },
  { id:'delayed_grad', title:'🐢 延毕战士', icon:'🐢', type:'normal',
    sub:'延毕后最终毕业\n你延毕了一学期。期间你导师逢人就说"我有个学生延毕了"，好像你是什么稀有展品。不过你最终还是毕业了，只是看到学弟学妹叫你"学长"时多了几分沧桑。',
    cond:s => s.satisfaction >= 50 && s.paperProgress >= 12 && s.week > 12 },
  { id:'fish_master', title:'🐟 摸鱼达人', icon:'🐟', type:'normal',
    sub:'摸鱼次数≥6 + 顺利毕业\n你读研期间摸鱼时长超过2000小时，却奇迹般地毕业了。导师至今想不通你是怎么做到的。你毕业后去了互联网公司，发现摸鱼技能直接满级，如鱼得水。',
    cond:s => s.fishActionsTotal >= 6 && s.satisfaction >= 65 },
  { id:'health_grad', title:'🏥 带病毕业', icon:'🏥', type:'normal',
    sub:'健康<30 + 顺利毕业\n你毕业了，但你的发际线后退了3厘米，腰椎间盘突出了2毫米，胃溃疡新增了1个。你拿着毕业证去医院挂号时，护士问"几号来复查？"你说"我毕业了不是看病。"她说"看你这样子，迟早的事。"',
    cond:s => s.health < 30 && s.satisfaction >= 65 },
  // === Bad Endings ===
  { id:'dropout', title:'🚪 退学快乐', icon:'🚪', type:'fail',
    sub:'满意度降至0\n你被退学了。走出校门的那一刻你反而觉得轻松了。三个月后你去了创业公司，年薪是你导师的三倍。你导师看到你的朋友圈后沉默了很久，然后默默点了个赞。',
    cond:s => s.satisfaction <= 0 },
  { id:'health_collapse_end', title:'🚑 进了医院', icon:'🚑', type:'fail',
    sub:'健康降至0\n你终于在实验室晕倒了，被救护车拉走。醒来时导师站在病床前说"论文的事先别急"。你第一次觉得导师也有人情味。但医药费比你的学费还贵，你开始思考人生的意义。',
    cond:s => s.health <= 0 },
  { id:'mental_breakdown_end', title:'😵 精神离职', icon:'😵', type:'fail',
    sub:'心情降至0\n你彻底崩溃了。不是那种大哭大闹的崩溃，而是一种平静的放弃。你交了休学申请，收拾行李回了老家。后来你在老家开了个小卖部，过着没有deadline的生活。偶尔梦见组会，还是会出一身冷汗。',
    cond:s => s.mood <= 0 },
  { id:'academic_death', title:'💀 学术社死', icon:'💀', type:'fail',
    sub:'声望降至0以下\n你在学术圈彻底臭了。没有人愿意引用你的论文，没有人愿意跟你合作。导师在组会上说"以后你们别学某人"。你转行去做了自媒体，频道名"学术圈逃亡指南"，意外火了。',
    cond:s => s.prestige <= 0 },
];

// ============ CORE GAME LOGIC ============

function start() {
  S = initState();
  S.supervisor = genSupervisor();
  S.clueThisWeek = genClues(S.supervisor);
  // Give 1 starter item
  const starters = ITEM_POOL.filter(i => i.rar === 'common' && !i.passive);
  const starter = starters[Math.floor(Math.random()*starters.length)];
  S.items.push({...starter});
  S.itemIds.push(starter.id);
  // Show start screen -> game screen
  showScreen('gameScreen');
  renderAll();
  log('[新学期]', '你踏入了研究生院。导师的脸藏在三层属性之后……', 'gold');
  toast('新学期开始！每周5点精力', 'gold');
}

function restart() {
  start();
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ============ ACTION EXECUTION ============
function executeAction(actionId) {
  if (S.ended || S.inCrisis || S.inExam) return;
  const action = ACTIONS.find(a => a.id === actionId);
  if (!action) return;
  if (S.energy < action.cost) {
    toast('精力不足！', 'red');
    return;
  }
  S.energy -= action.cost;
  S.energyUsedThisWeek += action.cost;
  S.executedCount++;
  if (S[action.trackKey] !== undefined) S[action.trackKey]++;

  // Apply effects
  const e = action.effects;
  if (e.sat) changeSat(e.sat);
  if (e.paper) { S.paperProgress += e.paper; S.paperActionsTotal += (action.id === 'paper' ? e.paper : 0); }
  if (e.prestige) S.prestige += e.prestige;
  if (e.fatigue) changeFatigue(e.fatigue);
  if (e.mood) changeMood(e.mood);
  if (e.health) changeHealth(e.health);
  if (e.money) S.money += e.money;
  if (e.network) S.network += e.network;
  if (e.intel) S.intel += e.intel;

  // Special actions
  if (action.special === 'investigate') doInvestigate();
  if (action.special === 'love') doLove();
  if (action.special === 'gamble') doGamble();
  if (action.special === 'social_media') doSocialMedia();

  // Check passive items triggers
  checkPassiveItems(action);

  S.actionsThisWeek.push(action);
  log(action.log, action.flavor, '');

  // Animate the card
  const card = document.querySelector(`[data-action="${actionId}"]`);
  if (card) {
    card.classList.add('just-used');
    setTimeout(() => card.classList.remove('just-used'), 500);
  }

  renderStats();
  renderActions();
  checkBadStates();
}

function doInvestigate() {
  // Reveal a random unrevealed attribute
  const attrs = ['expectation','threshold','preference'];
  const unrevealed = attrs.filter(a => !S.supervisor.revealed[a]);
  if (unrevealed.length > 0) {
    const pick = unrevealed[Math.floor(Math.random()*unrevealed.length)];
    S.supervisor.revealed[pick] = true;
    const labels = { expectation:'期望方向', threshold:'压力阈值', preference:'奖励偏好' };
    toast(`揭示了导师的${labels[pick]}！`, 'purple');
    log('[情报]', `你成功揭示了导师的${labels[pick]}属性！`, 'gold');
  } else {
    S.intel += 2;
    toast('导师属性已全部揭示，获得额外情报+2', 'cyan');
  }
}

function doLove() {
  if (!S.hasPartner) {
    S.hasPartner = true;
    S.partnerName = ['小红','小明','阿杰','小美','阿伟','小芳'][Math.floor(Math.random()*6)];
    S.partnerMood = 60;
    toast(`你脱单了！对象是${S.partnerName}`, 'pink');
    log('[恋爱]', `你和${S.partnerName}在一起了！`, 'pink');
  } else {
    S.partnerMood = Math.min(100, S.partnerMood + 15);
    toast(`你和${S.partnerName}度过了甜蜜时光`, 'pink');
  }
}

function doGamble() {
  const roll = Math.random();
  if (roll < 0.05) {
    const win = 500 + Math.floor(Math.random()*500);
    S.money += win;
    S.gambleWinCount++;
    toast(`中奖了！+¥${win}！`, 'gold');
    log('[彩票]', `你中了${win}元！今晚吃顿好的！`, 'gold');
    floatText(document.querySelector('.actions-grid'), `+¥${win}`, 'gold');
  } else if (roll < 0.25) {
    const win = 50 + Math.floor(Math.random()*50);
    S.money += win;
    toast(`小赚¥${win}`, 'green');
    log('[彩票]', `你赚了${win}元，至少没亏`, 'green');
  } else {
    S.money -= 20;
    toast('没中奖，亏了¥20', 'red');
    log('[彩票]', '又没中。"下次一定！"你对自己说', 'red');
  }
}

function doSocialMedia() {
  S.socialMediaPosts++;
  const roll = Math.random();
  if (roll < 0.3) {
    S.network += 2;
    S.prestige += 1;
    toast('朋友圈火了！获得人脉+2', 'green');
    log('[朋友圈]', '你的朋友圈获得了大量点赞，有教授评论"不错"', 'green');
  } else if (roll < 0.5) {
    S.mood += 5;
    toast('朋友圈反响不错，心情+5', 'cyan');
    log('[朋友圈]', '几个朋友点了赞，你感觉被认可了', 'cyan');
  } else if (roll < 0.8) {
    toast('没什么人点赞…尴尬', 'red');
    log('[朋友圈]', '发了两小时只有3个赞，你默默删了', '');
    S.mood -= 5;
  } else {
    S.sat -= 5;
    S.mood -= 10;
    toast('导师看到了你的朋友圈并评论"？"，社死！', 'red');
    log('[朋友圈]', '导师评论了一个问号，你经历了学术社死', 'red');
  }
}

// ============ PASSIVE ITEM CHECKS ============
function checkPassiveItems(action) {
  S.items.forEach(item => {
    if (!item.passive) return;
    switch(item.id) {
      case 'I-01': // 论文自动存档
        if (action.id === 'paper') {
          const paperCount = S.actionsThisWeek.filter(a => a.id === 'paper').length;
          if (paperCount >= 2) {
            changeSat(3);
            toast('论文自动存档触发：满意度+3', 'green');
          }
        }
        break;
      case 'I-02': // 持续发表引擎
        if (S.paperProgress >= 10 && !S._i02Triggered) {
          S._i02Triggered = true;
          changeSat(15);
          toast('持续发表引擎触发：满意度+15！', 'gold');
          log('[道具]', '你的论文累计10次，触发自动发表！', 'gold');
        }
        break;
      case 'I-03': // 人脉情报网
        if (action.id === 'network') {
          S.intel += 1;
          toast('人脉情报网：情报+1', 'cyan');
        }
        break;
      case 'A-17': // 理论突破点
        if (S.paperProgress === 5 || S.paperProgress === 10 || S.paperProgress === 15) {
          changeSat(8);
          toast('理论突破点触发：满意度+8！', 'gold');
        }
        break;
    }
  });
}

// ============ STAT CHANGE HELPERS ============
function changeSat(delta) {
  const old = S.satisfaction;
  // Check shields
  if (delta < 0) {
    S.items.forEach(item => {
      if (item.id === 'P-01' && !S._p01UsedThisWeek) {
        delta = Math.ceil(delta / 2);
        S._p01UsedThisWeek = true;
        toast('满意度护盾触发！伤害减半', 'cyan');
      }
      if (item.id === 'P-04' && S.satisfaction < 50 && S._p04Count < 3 && Math.random() < 0.3) {
        S._p04Count = (S._p04Count || 0) + 1;
        delta = 10;
        toast('保研资格护身符触发：满意度+10！', 'green');
      }
    });
  }
  S.satisfaction = Math.max(0, Math.min(S.satMax, S.satisfaction + delta));
  flashStat('satVal', delta);
}

function changeMood(delta) {
  S.mood = Math.max(0, Math.min(S.moodMax, S.mood + delta));
  flashStat('moodVal', delta);
}

function changeHealth(delta) {
  // Check 脱发保险
  if (delta < 0) {
    const insurance = S.items.find(i => i.id === 'N-07');
    if (insurance && delta === -2) { delta = 0; }
  }
  S.health = Math.max(0, Math.min(S.healthMax, S.health + delta));
  flashStat('healthVal', delta);
}

function changeFatigue(delta) {
  S.fatigue = Math.max(0, Math.min(S.fatigueMax, S.fatigue + delta));
  flashStat('fatigueVal', delta);
}

function flashStat(id, delta) {
  const el = document.getElementById(id);
  if (!el) return;
  if (delta > 0) { el.classList.add('up'); setTimeout(() => el.classList.remove('up'), 600); }
  else if (delta < 0) { el.classList.add('down'); setTimeout(() => el.classList.remove('down'), 600); }
}

function checkBadStates() {
  if (S.health <= 0) { endGame('health_collapse_end'); return; }
  if (S.mood <= 0) { endGame('mental_breakdown_end'); return; }
  if (S.satisfaction <= 0) { endGame('dropout'); return; }
  if (S.prestige <= -20) { S.prestige = -1; endGame('academic_death'); return; }
}

// ============ WEEK END / CRISIS / EXAM ============

function endWeek() {
  if (S.ended || S.inCrisis) return;

  // Check if exam week
  if ([4, 8, 12].includes(S.week)) {
    triggerExam();
    return;
  }

  // Normal week resolution
  resolveWeek();
}

function resolveWeek() {
  // Satisfaction calculation based on supervisor expectation
  let satDelta = 0;
  const sup = S.supervisor;
  const taskCount = S.actionsThisWeek.filter(a => a.id === 'task').length;
  const paperCount = S.actionsThisWeek.filter(a => a.id === 'paper').length;
  const networkCount = S.actionsThisWeek.filter(a => a.id === 'network').length;

  if (sup.expectation === '论文型') {
    satDelta = (paperCount * 4 + taskCount * 2 - networkCount * 1) - 3;
  } else if (sup.expectation === '平衡型') {
    satDelta = (taskCount * 3 + paperCount * 2 + networkCount * 2) - 4;
  } else {
    satDelta = (networkCount * 4 + taskCount * 2) - 3;
  }
  satDelta = Math.max(-15, Math.min(15, satDelta));
  if (S.executedCount === 0) satDelta = Math.min(satDelta, -5);

  // Apply weekly satisfaction
  changeSat(satDelta);
  log('[周结算]', `第${S.week}周满意度变化：${satDelta >= 0 ? '+' : ''}${satDelta}`, satDelta >= 0 ? 'green' : 'red');

  // Track high/low sat
  if (S.satisfaction >= 80) S.weeksSatisfiedHigh++;
  else S.weeksSatisfiedHigh = 0;
  if (S.satisfaction < 30) S.weeksLowSat++;
  else S.weeksLowSat = 0;

  // Passive item weekly effects
  S.items.forEach(item => {
    if (item.id === 'N-02') { changeMood(3); changeFatigue(-5); } // 保温杯
    if (item.id === 'I-04') { S.resilience = Math.min(6, S.resilience + 1); } // 危机缓冲垫
    if (item.id === 'P-07') { S.resilience = Math.max(0, S.resilience - 1); } // 韧性防火墙
    if (item.id === 'A-13' && S.energyUsedThisWeek <= 2) {
      S.energyBonus += 1;
      toast('摸鱼节能模式：下周精力+1', 'cyan');
    }
  });

  // Check crisis
  const crisisRate = computeCrisisRate();
  const hasF03 = S.items.some(i => i.id === 'F-03');
  let crisisTriggered = false;

  if (hasF03) {
    // F-03: satisfaction doesn't affect crisis rate
  }

  // Forced crisis: satisfaction < threshold
  let forcedCrisis = false;
  if (S.satisfaction < sup.threshold && !sup.revealed.threshold) {
    if (Math.random() < 0.5) forcedCrisis = true;
  } else if (S.satisfaction < sup.threshold && S.week > 2) {
    forcedCrisis = true;
  }

  if (forcedCrisis) {
    triggerCrisis(true);
    crisisTriggered = true;
  } else if (Math.random() < crisisRate && !hasF03) {
    triggerCrisis(false);
    crisisTriggered = true;
  }

  if (!crisisTriggered) {
    advanceWeek();
  }
}

function computeCrisisRate() {
  let rate = 0.30 * (1 - S.satisfaction / 100 * 0.5);
  // I-04 resilience reduction
  if (S.resilience >= 3) rate -= 0.10;
  // Phase adjustments
  if (S.week >= 9) rate += 0.10;
  // N-08 luck
  if (S.items.some(i => i.id === 'N-08')) rate -= 0.05;
  return Math.max(0.05, Math.min(0.45, rate));
}

function triggerCrisis(forced) {
  S.inCrisis = true;
  // Select crisis based on satisfaction level
  let pool;
  if (S.satisfaction >= 60) {
    pool = CRISIS_EVENTS.filter(c => c.level <= 2);
  } else if (S.satisfaction >= 30) {
    pool = CRISIS_EVENTS.filter(c => c.level >= 1);
  } else {
    pool = CRISIS_EVENTS.filter(c => c.level >= 2);
  }
  if (pool.length === 0) pool = CRISIS_EVENTS;

  const crisis = pool[Math.floor(Math.random() * pool.length)];

  // Check N-05 auto resolve
  if (S.items.some(i => i.id === 'N-05') && Math.random() < 0.25) {
    toast('玄学护身符自动化解了危机！', 'gold');
    log('[危机]', `【${crisis.name}】被玄学护身符化解了！`, 'gold');
    S.inCrisis = false;
    advanceWeek();
    return;
  }

  // Check P-02 50% downgrade
  let effectiveCrisis = crisis;
  if (S.items.some(i => i.id === 'P-02') && !forced && Math.random() < 0.5) {
    const lower = CRISIS_EVENTS.filter(c => c.level < crisis.level);
    if (lower.length > 0) {
      effectiveCrisis = lower[Math.floor(Math.random()*lower.length)];
      toast('危机缓冲协议触发：危机降级！', 'cyan');
    }
  }

  // Show crisis dialog
  showCrisisDialog(effectiveCrisis);
}

function showCrisisDialog(crisis) {
  const overlay = document.getElementById('overlay');
  const dialog = document.getElementById('dialog');
  dialog.className = 'dialog crisis';
  dialog.innerHTML = `
    <div class="dialog-head">
      <div class="dialog-ic">${crisis.icon}</div>
      <div><div class="dialog-title">${crisis.name}</div>
      <div class="dialog-lvl">危机等级 ${'⭐'.repeat(crisis.level)} · 第${S.week}周</div></div>
    </div>
    <div class="dialog-body">${crisis.desc}</div>
    <div class="dialog-impact">⚠️ 基础影响：${formatImpact(crisis.baseImpact)}</div>
    <div class="choices">
      ${crisis.options.map((opt, i) => `
        <button class="choice" onclick="GAME.resolveCrisis(${crisis.options.indexOf(opt)}, '${crisis.id}')">
          <div class="num">${i+1}</div>
          <div class="txt"><div class="nm">${opt.name}</div><div class="ef">${opt.desc}</div></div>
        </button>
      `).join('')}
    </div>
  `;
  overlay.classList.add('active');

  // Store current crisis for resolution
  S._currentCrisis = crisis;
}

function resolveCrisis(optionIndex, crisisId) {
  const crisis = S._currentCrisis;
  if (!crisis || crisis.id !== crisisId) return;
  const option = crisis.options[optionIndex];
  if (!option) return;

  // Apply base impact first
  const bi = crisis.baseImpact;
  if (bi.sat) changeSat(bi.sat);
  if (bi.mood) changeMood(bi.mood);
  if (bi.health) changeHealth(bi.health);
  if (bi.fatigue) changeFatigue(bi.fatigue);
  if (bi.paper) S.paperProgress += bi.paper;
  if (bi.prestige) S.prestige += bi.prestige;
  if (bi.money) S.money += bi.money;

  // Apply option effects
  const e = option.effects;
  if (e.sat) changeSat(e.sat);
  if (e.mood) changeMood(e.mood);
  if (e.health) changeHealth(e.health);
  if (e.fatigue) changeFatigue(e.fatigue);
  if (e.paper) S.paperProgress += e.paper;
  if (e.prestige) S.prestige += e.prestige;
  if (e.money) S.money += e.money;
  if (e.network) S.network += e.network;
  if (e.intel) S.intel += e.intel;

  S.crisisCount++;
  S.crisisResolvedCount++;
  log('[危机]', `${crisis.name}：${option.msg}`, 'gold');
  toast(option.msg, 'green');

  // A-09 resilience gain
  if (S.items.some(i => i.id === 'A-09')) {
    S.resilience = Math.min(6, S.resilience + 1);
    toast('韧性强化训练：韧性+1', 'green');
  }

  closeOverlay();
  S.inCrisis = false;
  renderStats();
  checkBadStates();
  if (!S.ended) advanceWeek();
}

function formatImpact(impact) {
  const parts = [];
  if (impact.sat) parts.push(`满意度${impact.sat > 0 ? '+' : ''}${impact.sat}`);
  if (impact.mood) parts.push(`心情${impact.mood > 0 ? '+' : ''}${impact.mood}`);
  if (impact.health) parts.push(`健康${impact.health > 0 ? '+' : ''}${impact.health}`);
  if (impact.fatigue) parts.push(`疲劳${impact.fatigue > 0 ? '+' : ''}${impact.fatigue}`);
  if (impact.paper) parts.push(`论文${impact.paper > 0 ? '+' : ''}${impact.paper}`);
  if (impact.prestige) parts.push(`声望${impact.prestige > 0 ? '+' : ''}${impact.prestige}`);
  if (impact.money) parts.push(`¥${impact.money > 0 ? '+' : ''}${impact.money}`);
  return parts.join(' · ') || '无';
}

// ============ EXAM / CHECKPOINT ============

function triggerExam() {
  S.inExam = true;
  const week = S.week;
  let passed = false;
  let title = '', desc = '', rewards = '';

  if (week === 4) {
    const pass = S.satisfaction >= 40;
    title = pass ? '✅ 期初考核通过' : '❌ 期初考核未通过';
    desc = pass
      ? `满意度${S.satisfaction} ≥ 40，你勉强挺过了入学第一次考核。导师的表情从"你行不行"变成了"嗯，还行"。\n奖励：3选1道具 + 下周精力+1`
      : `满意度${S.satisfaction} < 40，导师摇了摇头："得加把劲啊。"满意度-20，但还没有退学风险。\n惩罚：满意度-20`;
    if (pass) { passed = true; S.energyBonus += 1; }
    else { changeSat(-20); }
  } else if (week === 8) {
    const pass = S.satisfaction >= 55 && S.paperProgress >= 4;
    title = pass ? '✅ 中期答辩通过' : '❌ 中期答辩未通过';
    desc = pass
      ? `满意度${S.satisfaction} ≥ 55，论文进度${S.paperProgress} ≥ 4。答辩委员会点了点头，导师难得露出了一丝微笑。\n奖励：3选1道具 + 学术声望+15`
      : `满意度${S.satisfaction}或论文进度${S.paperProgress}不达标。答辩委员会皱了眉头。\n惩罚：满意度-25，下阶段危机率+5%`;
    if (pass) { passed = true; S.prestige += 15; }
    else { changeSat(-25); }
  } else if (week === 12) {
    const pass = S.satisfaction >= 65 && S.paperProgress >= 10;
    if (pass) {
      title = '🎓 毕业答辩通过！';
      desc = `满意度${S.satisfaction} ≥ 65，论文进度${S.paperProgress} ≥ 10。答辩全票通过！导师站起来鼓掌，你以为他在做梦。\n恭喜你毕业了！`;
      passed = true;
      S.prestige += 20;
      showExamResult(title, desc, true, true);
      return;
    } else {
      title = '❌ 毕业答辩未通过';
      desc = `满意度${S.satisfaction}或论文进度${S.paperProgress}不达标。\n你进入了延毕阶段（第13-16周）。每周额外1次强制危机，精力上限-1。`;
      S.maxWeek = 16;
      S.energyMax = 4;
      changeSat(-10);
      showExamResult(title, desc, false, false, true);
      return;
    }
  }

  if (passed) {
    showExamResult(title, desc, true, false, false, true);
  } else {
    showExamResult(title, desc, false, false, false, true);
  }
}

function showExamResult(title, desc, passed, isGrad, isDelay, showReward) {
  const overlay = document.getElementById('overlay');
  const dialog = document.getElementById('dialog');
  dialog.className = passed ? 'dialog success' : 'dialog crisis';
  let rewardHtml = '';
  if (showReward && passed) {
    // Generate 3 reward items
    const available = ITEM_POOL.filter(i => !S.itemIds.includes(i.id));
    const rewards = [];
    // Pick 1 rare/epic/legendary + 2 random
    const highRar = available.filter(i => ['rare','epic','legendary'].includes(i.rar));
    const lowRar = available.filter(i => i.rar === 'common');
    if (highRar.length > 0) rewards.push(highRar[Math.floor(Math.random()*highRar.length)]);
    while (rewards.length < 3 && available.length > 0) {
      const pool = available.filter(i => !rewards.includes(i));
      if (pool.length === 0) break;
      rewards.push(pool[Math.floor(Math.random()*pool.length)]);
    }
    S._examRewards = rewards;
    rewardHtml = `
      <div style="margin:16px 0;font-size:14px;color:var(--gold)">选择1件奖励道具：</div>
      <div class="reward-grid">
        ${rewards.map((r, i) => `
          <div class="reward-card r-${r.rar}" onclick="GAME.pickReward(${i})">
            <div class="ic">${r.icon}</div>
            <div class="nm">${r.name}</div>
            <div class="eff">${r.eff}</div>
            <div class="flavor">"${r.flavor}"</div>
            <div class="rar">${r.rar === 'legendary' ? '传说' : r.rar === 'epic' ? '史诗' : r.rar === 'rare' ? '稀有' : '普通'}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  dialog.innerHTML = `
    <div class="dialog-head">
      <div class="dialog-ic">${passed ? '🎉' : '😰'}</div>
      <div><div class="dialog-title">${title}</div></div>
    </div>
    <div class="dialog-body">${desc.replace(/\n/g, '<br>')}</div>
    ${rewardHtml}
    ${!showReward || !passed ? `<div style="text-align:center;margin-top:16px"><button class="btn" onclick="GAME.closeExam()">${isDelay ? '进入延毕阶段' : '继续游戏'}</button></div>` : ''}
  `;
  overlay.classList.add('active');
}

function pickReward(idx) {
  const reward = S._examRewards[idx];
  if (!reward) return;
  S.items.push({...reward});
  S.itemIds.push(reward.id);
  toast(`获得道具：${reward.name}！`, 'gold');
  log('[考核奖励]', `你获得了「${reward.name}」`, 'gold');
  renderItems();
  closeOverlay();
  S.inExam = false;
  advanceWeek();
}

function closeExam() {
  closeOverlay();
  S.inExam = false;
  if (S.satisfaction <= 0) { checkBadStates(); return; }
  advanceWeek();
}

function closeOverlay() {
  document.getElementById('overlay').classList.remove('active');
}

// ============ ADVANCE WEEK ============
function advanceWeek() {
  S.week++;
  if (S.week > S.maxWeek) {
    // Time's up - check ending
    if (S.satisfaction >= 65 && S.paperProgress >= 10) {
      endGame('barely_pass');
    } else if (S.satisfaction >= 50 && S.paperProgress >= 12) {
      endGame('delayed_grad');
    } else {
      endGame('dropout');
    }
    return;
  }

  // Reset weekly state
  S.energy = S.energyMax + S.energyBonus;
  S.energyBonus = 0;
  S.energyUsedThisWeek = 0;
  S.executedCount = 0;
  S.actionsThisWeek = [];
  S._p01UsedThisWeek = false;

  // Update phase
  if (S.week <= 4) S.phase = '入学适应期';
  else if (S.week <= 8) S.phase = '研究深化期';
  else if (S.week <= 12) S.phase = '毕业冲刺期';
  else S.phase = '延毕苦熬期';

  // Generate clues
  S.clueThisWeek = genClues(S.supervisor);

  // Delayed phase penalties
  if (S.week > 12) {
    S.energyMax = Math.max(3, S.energyMax);
  }

  renderAll();
  log('[新一周]', `第${S.week}周开始 · ${S.phase}`, 'gold');
  if (S.week > 12) {
    toast(`延毕阶段！精力上限${S.energyMax}`, 'red');
  }
}

// ============ ENDING ============
function endGame(endingId) {
  let ending = ENDINGS.find(e => e.id === endingId);
  if (!ending) {
    // Find by conditions
    for (const e of ENDINGS) {
      if (e.cond && e.cond(S)) { ending = e; break; }
    }
  }
  if (!ending) {
    // Default ending
    if (S.satisfaction >= 65) ending = ENDINGS.find(e => e.id === 'barely_pass');
    else ending = ENDINGS.find(e => e.id === 'dropout');
  }
  S.ended = true;
  showEndScreen(ending);
}

function showEndScreen(ending) {
  showScreen('endScreen');
  const card = document.getElementById('endCard');
  card.className = 'end-card' + (ending.type === 'fail' ? ' fail' : '');
  document.getElementById('endIcon').textContent = ending.icon;
  document.getElementById('endTitle').textContent = ending.title;
  document.getElementById('endSub').innerHTML = ending.sub.replace(/\n/g, '<br><br>');
  document.getElementById('endStats').innerHTML = `
    <div class="end-stat"><div class="lb">满意度</div><div class="vl">${S.satisfaction}</div></div>
    <div class="end-stat"><div class="lb">论文进度</div><div class="vl">${S.paperProgress}</div></div>
    <div class="end-stat"><div class="lb">学术声望</div><div class="vl">${S.prestige}</div></div>
    <div class="end-stat"><div class="lb">心情</div><div class="vl">${S.mood}</div></div>
    <div class="end-stat"><div class="lb">健康</div><div class="vl">${S.health}</div></div>
    <div class="end-stat"><div class="lb">存款</div><div class="vl">¥${S.money}</div></div>
    <div class="end-stat"><div class="lb">危机解决</div><div class="vl">${S.crisisResolvedCount}</div></div>
    <div class="end-stat"><div class="lb">道具获取</div><div class="vl">${S.items.length}</div></div>
    <div class="end-stat"><div class="lb">坚持周数</div><div class="vl">${S.week}</div></div>
  `;
}

// ============ RENDERING ============

function renderAll() {
  renderStats();
  renderActions();
  renderItems();
  renderSupervisor();
  renderWeekTrack();
}

function renderStats() {
  const sat = S.satisfaction;
  document.getElementById('satVal').innerHTML = `${sat}<span class="max">/100</span>`;
  const satFill = document.getElementById('satFill');
  satFill.style.width = sat + '%';
  satFill.className = 'stat-bar-fill' + (sat >= 70 ? ' green' : sat >= 40 ? ' yellow' : sat >= 20 ? ' orange' : ' red');
  // Threshold marker
  const threshold = S.supervisor.threshold;
  if (S.supervisor.revealed.threshold) {
    if (!document.getElementById('satThreshold')) {
      const marker = document.createElement('div');
      marker.id = 'satThreshold';
      marker.className = 'stat-threshold';
      marker.style.left = threshold + '%';
      document.getElementById('satBarOuter').appendChild(marker);
    }
  }

  document.getElementById('energyVal').textContent = S.energy;
  document.getElementById('energyMax').textContent = S.energyMax;
  document.getElementById('remainEnergy').textContent = S.energy;
  document.getElementById('executedCount').textContent = S.executedCount;
  // Energy pips
  const pipsEl = document.getElementById('energyPips');
  pipsEl.innerHTML = '';
  const totalPips = S.energyMax;
  for (let i = 0; i < totalPips; i++) {
    const pip = document.createElement('div');
    pip.className = 'pip' + (i < S.energy ? ' full' : '');
    pipsEl.appendChild(pip);
  }
  if (S.energyBonus > 0) {
    for (let i = 0; i < S.energyBonus; i++) {
      const pip = document.createElement('div');
      pip.className = 'pip full bonus';
      pipsEl.appendChild(pip);
    }
  }

  document.getElementById('paperVal').textContent = S.paperProgress;
  document.getElementById('prestigeVal').textContent = S.prestige;
  document.getElementById('networkVal').textContent = S.network;
  document.getElementById('intelVal').textContent = S.intel;
  document.getElementById('resilienceVal').textContent = S.resilience;
  document.getElementById('itemCount').textContent = S.items.length;
  document.getElementById('itemsBadge').textContent = `${S.items.length} / 8`;

  // Extended stats
  document.getElementById('moodVal').textContent = S.mood;
  document.getElementById('moodFill').style.width = S.mood + '%';
  document.getElementById('healthVal').textContent = S.health;
  document.getElementById('healthFill').style.width = S.health + '%';
  document.getElementById('fatigueVal').textContent = S.fatigue;
  document.getElementById('fatigueFill').style.width = S.fatigue + '%';
  document.getElementById('moneyVal').textContent = '¥' + S.money;
  const moneyPct = Math.min(100, S.money / 10);
  document.getElementById('moneyFill').style.width = moneyPct + '%';

  // Build hint
  renderBuildHint();
}

function renderBuildHint() {
  const hint = document.getElementById('buildHint');
  const text = document.getElementById('buildHintText');
  let build = '';
  if (S.paperActionsTotal >= 4) build = '论文流 (论文研究×' + S.paperActionsTotal + ')';
  else if (S.networkActionsTotal >= 4) build = '人脉流 (拓展人脉×' + S.networkActionsTotal + ')';
  else if (S.investigateActionsTotal >= 4) build = '情报流 (调查×' + S.investigateActionsTotal + ')';
  else if (S.loveActionsTotal >= 3) build = '恋爱流 (谈恋爱×' + S.loveActionsTotal + ')';
  else if (S.fishActionsTotal >= 4) build = '摸鱼流 (摸鱼×' + S.fishActionsTotal + ')';
  else if (S.partimeActionsTotal >= 3) build = '打工流 (兼职×' + S.partimeActionsTotal + ')';
  else if (S.healthActionsTotal >= 3) build = '养生流 (锻炼×' + S.healthActionsTotal + ')';

  if (build) {
    hint.style.display = 'block';
    text.textContent = build;
  } else {
    hint.style.display = 'none';
  }
}

function renderActions() {
  const grid = document.getElementById('actionsGrid');
  grid.innerHTML = '';
  ACTIONS.forEach(action => {
    const card = document.createElement('div');
    card.className = 'action-card ' + action.cat;
    card.dataset.action = action.id;
    const disabled = S.energy < action.cost;
    if (disabled) card.classList.add('disabled');
    if (action.tag) {
      const tag = document.createElement('div');
      tag.className = 'tag ' + action.tagClass;
      tag.textContent = action.tag;
      card.appendChild(tag);
    }
    card.innerHTML += `
      <div class="ic">${action.icon}</div>
      <div class="nm">${action.name}</div>
      <div class="desc">${action.desc}</div>
      <div class="cost ${action.cost === 0 ? 'free' : ''}">${action.cost === 0 ? '免费' : '消耗 <span class="cost-num">' + action.cost + '</span>'}</div>
    `;
    if (!disabled) {
      card.onclick = () => executeAction(action.id);
    }
    grid.appendChild(card);
  });
  document.getElementById('actionBadge').textContent = `本周已执行 ${S.executedCount} 次行动`;
  document.getElementById('endWeekBtn').disabled = S.inCrisis;
}

function renderItems() {
  const list = document.getElementById('itemsList');
  if (S.items.length === 0) {
    list.innerHTML = '<div class="empty-hint">暂无道具 — 通过考核或开局获取</div>';
    return;
  }
  list.innerHTML = '';
  S.items.forEach((item, idx) => {
    const div = document.createElement('div');
    div.className = `item r-${item.rar}`;
    const rarLabel = item.rar === 'legendary' ? '传说' : item.rar === 'epic' ? '史诗' : item.rar === 'rare' ? '稀有' : '普通';
    let html = `
      <div class="item-ic">${item.icon}</div>
      <div class="item-body">
        <div class="item-nm">${item.name} <span class="item-rar">${rarLabel}</span></div>
        <div class="item-eff">${item.eff}</div>
        <div class="item-flavor">"${item.flavor}"</div>
      </div>
    `;
    if (item.passive) {
      html += `<div class="item-passive">被动</div>`;
    } else {
      html += `<button class="btn sm" style="margin-left:4px" onclick="GAME.useItem(${idx})">使用</button>`;
    }
    div.innerHTML = html;
    list.appendChild(div);
  });
}

function useItem(idx) {
  if (S.ended || S.inCrisis || S.inExam) {
    toast('当前不能使用道具', 'red');
    return;
  }
  const item = S.items[idx];
  if (!item || item.passive) return;
  S.itemsUsed++;

  switch(item.id) {
    case 'A-01': S._taskCostReduce = true; toast('本周导师任务费用-1', 'green'); break;
    case 'A-02': changeSat(5); toast('恭维话术：满意度+5', 'green'); break;
    case 'A-03': doInvestigate(); toast('调查额外线索：揭示1个属性', 'purple'); break;
    case 'A-04': S.satMax += 1; toast('口碑积累：满意度上限+1', 'gold'); break;
    case 'A-05':
      S.supervisor.revealed.expectation = true;
      toast('揭示了导师期望方向：' + S.supervisor.expectation, 'purple');
      break;
    case 'A-06': S._paperBonus = true; toast('本周首次论文后满意度+5', 'green'); break;
    case 'A-09': S.resilience += 3; toast('韧性+3', 'green'); break;
    case 'A-10':
      S.network += 2;
      if (S.network >= 5) { S.intel += 1; toast('人脉+2，额外情报+1', 'cyan'); }
      else toast('人脉+2', 'cyan');
      break;
    case 'A-11':
      if (S.items.length > 1) {
        const discardIdx = S.items.findIndex((it, i) => i !== idx && !it.passive);
        if (discardIdx >= 0) {
          const discarded = S.items[discardIdx];
          const bonus = discarded.rar === 'rare' || discarded.rar === 'epic' || discarded.rar === 'legendary' ? 4 : 2;
          S.paperProgress += bonus;
          S.items.splice(discardIdx > idx ? discardIdx : discardIdx, 1);
          S.itemIds.splice(discardIdx > idx ? discardIdx : discardIdx, 1);
          toast(`文献突击：论文+${bonus}（弃了${discarded.name}）`, 'gold');
        }
      }
      break;
    case 'A-14': S._crisisDowngrade = true; toast('本周危机等级-1', 'cyan'); break;
    case 'A-16':
      if (S.items.length > 2) {
        S.energy += 3;
        toast('精力置换：精力+3', 'gold');
      } else toast('手牌不足，无法置换', 'red');
      break;
    case 'A-19': S._monkMode = true; toast('佛系摸鱼已激活', 'cyan'); break;
    case 'A-20': S.energyMax = 7; S.energy = 7; toast('精力上限提升至7！', 'gold'); break;
    case 'P-06':
      if (S.network >= 2) {
        S.network -= 2;
        toast('取消本周随机危机！', 'green');
        S._crisisSkip = true;
      } else toast('人脉不足', 'red');
      break;
    case 'F-01':
      if (S.paperProgress >= 12) {
        S.prestige += 30;
        toast('论文冲刺：立即通关！', 'gold');
        endGame('perfect_grad');
        return;
      } else {
        changeSat(20);
        toast('满意度+20', 'green');
      }
      break;
    case 'F-02':
      if (S.crisisCount >= 5) {
        S.resilience += 5; changeSat(15); S.energy += 3;
        toast('危机大反转：韧性+5/满意度+15/精力+3', 'gold');
      } else {
        S.resilience += 2; changeSat(5);
        toast('韧性+2/满意度+5', 'green');
      }
      break;
    case 'S-01': S._skipSettle = true; toast('本周跳过满意度结算', 'cyan'); break;
    case 'S-03':
      if (S.intel >= 5) {
        S.intel -= 5; S._crisisSkip = true;
        toast('黑材料威慑：取消本周强制危机', 'purple');
      } else toast('情报不足', 'red');
      break;
    case 'S-04':
      if (S.network >= 2) {
        S.network -= 2;
        S.clueThisWeek = genClues(S.supervisor);
        toast('内鬼线人：获取下周线索', 'cyan');
      } else toast('人脉不足', 'red');
      break;
    // New items
    case 'N-01': changeMood(20); changeHealth(10); S._nextWeekEnergyCut = true; toast('速效救心丸：心情+20/健康+10', 'green'); break;
    case 'N-03': S.energy += 2; changeHealth(-5); S._paperCostReduce = true; toast('泡面囤货：精力+2/健康-5', 'cyan'); break;
    case 'N-04': changeMood(15); S._satPenalty = true; toast('B站大会员：心情+15', 'cyan'); break;
    case 'N-06': changeMood(25); S.network += 1; if (Math.random() < 0.3) { changeSat(-15); toast('导师发现了表情包！满意度-15', 'red'); } else toast('导师表情包：心情+25/人脉+1', 'pink'); break;
    case 'N-07': S.money += 500; toast('脱发保险理赔：+¥500', 'gold'); break;
    case 'N-08': S.paperProgress += 3; toast('学术锦鲤：论文+3', 'gold'); break;
    default: toast(`${item.name}已使用`, 'green');
  }

  // Remove used item (non-passive)
  S.items.splice(idx, 1);
  S.itemIds.splice(idx, 1);
  renderItems();
  renderStats();
  checkBadStates();
}

function renderSupervisor() {
  const sup = S.supervisor;
  document.getElementById('supIcon').textContent = sup.icon;
  document.getElementById('supName').textContent = sup.name;
  const mood = S.satisfaction >= 80 ? '愉悦' : S.satisfaction >= 60 ? '满意' : S.satisfaction >= 40 ? '平静' : S.satisfaction >= 20 ? '不满' : '愤怒';
  document.getElementById('supMood').innerHTML = '态度：<span class="em">' + mood + '</span>';

  // Attributes
  const attrExp = document.getElementById('attr-expectation');
  const attrThr = document.getElementById('attr-threshold');
  const attrPref = document.getElementById('attr-preference');

  attrExp.classList.toggle('revealed', sup.revealed.expectation);
  attrThr.classList.toggle('revealed', sup.revealed.threshold);
  attrPref.classList.toggle('revealed', sup.revealed.preference);

  attrExp.querySelector('.attr-vl').textContent = sup.revealed.expectation ? sup.expectation : '未知...';
  attrThr.querySelector('.attr-vl').textContent = sup.revealed.threshold ? sup.threshold : '未知...';
  attrPref.querySelector('.attr-vl').textContent = sup.revealed.preference ? sup.preference : '未知...';

  // Clues
  const clueList = document.getElementById('clueList');
  clueList.innerHTML = '';
  if (S.clueThisWeek.length === 0) {
    clueList.innerHTML = '<div class="clue" style="opacity:.5">本周暂无线索</div>';
  } else {
    S.clueThisWeek.forEach(c => {
      const div = document.createElement('div');
      div.className = 'clue';
      div.textContent = c;
      clueList.appendChild(div);
    });
  }
}

function renderWeekTrack() {
  const dots = document.getElementById('weekDots');
  dots.innerHTML = '';
  for (let i = 1; i <= S.maxWeek; i++) {
    const dot = document.createElement('div');
    let cls = 'week-dot';
    if ([4, 8, 12].includes(i)) cls += ' boss';
    if (i < S.week) cls += ' passed';
    if (i === S.week) cls += ' current';
    dot.className = cls;
    dot.title = `第${i}周${[4,8,12].includes(i) ? '（考核）' : ''}`;
    dots.appendChild(dot);
  }
  document.getElementById('weekNum').textContent = S.week;
  document.getElementById('phaseLabel').textContent = S.phase;
}

// ============ UI HELPERS ============
function log(tag, msg, cls) {
  const el = document.getElementById('actionLog');
  const div = document.createElement('div');
  div.className = 'lg ' + (cls || '');
  div.innerHTML = `<span class="t">${tag}</span>${msg}`;
  el.appendChild(div);
  el.scrollTop = el.scrollHeight;
}

function toast(msg, cls) {
  const box = document.getElementById('toastBox');
  const t = document.createElement('div');
  t.className = 'toast ' + (cls || '');
  t.textContent = msg;
  box.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

function floatText(target, text, cls) {
  if (!target) return;
  const rect = target.getBoundingClientRect();
  const el = document.createElement('div');
  el.className = 'float-text ' + cls;
  el.textContent = text;
  el.style.left = (rect.left + rect.width/2 - 20) + 'px';
  el.style.top = (rect.top + 20) + 'px';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1500);
}

// ============ PUBLIC API ============
return {
  start, restart, executeAction, endWeek,
  resolveCrisis, pickReward, closeExam, closeOverlay,
  useItem,
};

})();
