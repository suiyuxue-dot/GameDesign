/* ============================================================
   研究生求生录 - 游戏逻辑 v3
   特色：幽默叙事 · 8 种行动 · 18 件道具 · 12 种危机 · 5 种结局
   ============================================================ */

// ========== 导师配置 ==========
const SUPERVISORS = [
  { name:'王教授', icon:'👨‍🏫', desc:'资深教授，门下弟子三千' },
  { name:'李博导', icon:'🧑‍🔬', desc:'青年才俊，节奏激进' },
  { name:'张老师', icon:'👩‍🏫', desc:'平易近人，但暗藏期待' },
  { name:'孙导', icon:'🧔', desc:'据说他从不发火，发火就退学' }
];

const EXPECTATIONS = ['论文型', '平衡型', '人脉型'];
const PREFERENCES = ['道具奖励型', '声望奖励型', '能力奖励型'];

// ========== 核心行动（8 个，含负面选项） ==========
const ACTIONS = [
  {
    id:'task', name:'完成导师任务', icon:'📋', cat:'task',
    desc:'按导师期望递交工作，满意度变化由匹配度决定。',
    cost:2, tag:'核心'
  },
  {
    id:'paper', name:'推进论文研究', icon:'📝', cat:'paper',
    desc:'闷头写文章。论文进度+1，毕业关键资源。',
    cost:2, tag:'核心'
  },
  {
    id:'investigate', name:'调查导师线索', icon:'🔍', cat:'investigate',
    desc:'蹲点观察导师行为。80%概率揭示一项隐藏属性。',
    cost:1, tag:'信息'
  },
  {
    id:'network', name:'拓展人脉关系', icon:'🤝', cat:'network',
    desc:'参加学术茶话会、加入师门聚餐。人脉+1。',
    cost:1, tag:'社交'
  },
  {
    id:'admin', name:'应付行政事务', icon:'📑', cat:'admin',
    desc:'填表、报销、跑流程。韧性+1，磨练心智。',
    cost:1, tag:'保命'
  },
  // ===== 负面/趣味行动 =====
  {
    id:'love', name:'谈恋爱', icon:'💕', cat:'love',
    desc:'去和ta看场电影。满意度暴跌 -8，但精力上限永久+1。',
    cost:2, tag:'高风险'
  },
  {
    id:'partime', name:'去打工', icon:'💼', cat:'partime',
    desc:'外面送外卖/做家教。声望+8、人脉+1，但满意度-5（导师会发现）。',
    cost:2, tag:'高风险'
  },
  {
    id:'fish', name:'摸鱼一整天', icon:'🐟', cat:'fish',
    desc:'打游戏、刷视频、看剧。下周精力+2，但满意度-3、论文心虚。',
    cost:0, tag:'放松'
  }
];

// ========== 道具系统（18 件，覆盖更多场景） ==========
const ITEMS = [
  // 引擎类 I-
  {id:'I-01', name:'论文自动存档', icon:'💾', rarity:'epic', tag:'引擎',
    effect:'每周推进论文≥2次时，结算满意度+3', faction:'论文机器',
    flavor:'终于不用担心断电了'},
  {id:'I-02', name:'持续发表引擎', icon:'⚙️', rarity:'epic', tag:'引擎',
    effect:'累计论文进度达10次，立即满意度+15', faction:'论文机器',
    flavor:'灌水的快乐，您也可以体验'},
  {id:'I-03', name:'人脉情报网', icon:'🕸️', rarity:'epic', tag:'引擎',
    effect:'每次拓展人脉时额外+1情报', faction:'人脉达人',
    flavor:'师兄师姐就是行走的Wiki'},
  {id:'I-04', name:'危机缓冲垫', icon:'🪑', rarity:'epic', tag:'引擎',
    effect:'每周自动韧性+1。韧性≥3时危机率-10%', faction:'危机应对',
    flavor:'被骂得多了，自然就有了'},

  // 增幅类 A-
  {id:'A-01', name:'周报模板', icon:'📄', rarity:'common', tag:'增幅',
    effect:'完成导师任务费用-1（最低1）', faction:'通用',
    flavor:'网上扒的模板，导师看不出来'},
  {id:'A-02', name:'恭维话术宝典', icon:'📕', rarity:'common', tag:'增幅',
    effect:'每周首次完成任务额外满意度+5', faction:'通用',
    flavor:'老师您今天发型真棒'},
  {id:'A-03', name:'调查额外线索', icon:'🔎', rarity:'rare', tag:'增幅',
    effect:'调查行动50%概率额外揭示属性', faction:'情报专家',
    flavor:'监视技能MAX'},
  {id:'A-04', name:'外卖红包', icon:'🍱', rarity:'common', tag:'增幅',
    effect:'拓展人脉永久+1获取', faction:'人脉达人',
    flavor:'同门可以共享外卖CP'},
  {id:'A-05', name:'关键情报侦查', icon:'🎯', rarity:'rare', tag:'增幅',
    effect:'立即揭示导师期望方向', faction:'情报专家',
    flavor:'终于知道导师想要啥了'},
  {id:'A-06', name:'咖啡因充能', icon:'☕', rarity:'common', tag:'增幅',
    effect:'下周精力上限+1（永久）', faction:'双轨压榨',
    flavor:'熬夜，是研究生的基本功'},
  {id:'A-09', name:'韧性强化训练', icon:'💪', rarity:'epic', tag:'增幅',
    effect:'立即韧性+3', faction:'危机应对',
    flavor:'骂不还口，打不还手'},

  // 保护类 P-
  {id:'P-01', name:'满意度护盾', icon:'🛡️', rarity:'common', tag:'保护',
    effect:'本周首次满意度降低量减半', faction:'通用',
    flavor:'装死大法好'},
  {id:'P-02', name:'危机缓冲协议', icon:'🪖', rarity:'common', tag:'保护',
    effect:'随机危机50%降低1级', faction:'危机应对',
    flavor:'换种说法挨骂'},
  {id:'P-04', name:'保研资格护身符', icon:'🪄', rarity:'rare', tag:'保护',
    effect:'满意度降至50以下时30%概率+10', faction:'危机应对',
    flavor:'老师，我不毕业不行'},

  // 终结类 F-
  {id:'F-01', name:'论文冲刺最终版', icon:'🏆', rarity:'legendary', tag:'终结',
    effect:'论文进度≥12次时立即通关', faction:'论文机器',
    flavor:'Final Final Final v2.docx'},
  {id:'F-03', name:'纸面研究生协议', icon:'👻', rarity:'legendary', tag:'终结',
    effect:'满意度不再影响危机率，论文效率×2', faction:'极端',
    flavor:'反正我已经躺平了'},

  // 特殊类 S-
  {id:'S-01', name:'临时暂停协议', icon:'⏸️', rarity:'rare', tag:'特殊',
    effect:'使用时本周跳过满意度结算（每局1次）', faction:'摸鱼大师',
    flavor:'这周我请病假'},
  {id:'S-03', name:'黑材料威慑', icon:'📷', rarity:'rare', tag:'特殊',
    effect:'消耗5情报，本周强制危机被取消', faction:'情报专家',
    flavor:'老师，我看到您上次……'}
];

// ========== 危机事件（12 个，幽默化文案） ==========
const CRISES = [
  {id:'meeting', name:'组会被怼', level:1, icon:'😱',
    desc:'你的周报被导师盯了 5 分钟，开口第一句："你这是在糊弄我吗？"',
    impact:'满意度 -10', baseHit:10,
    cond:s => s.sat>=30 && s.sat<=60},
  {id:'revision', name:'紧急改稿令', level:2, icon:'📝',
    desc:'导师晚上11点发消息："明天交修改版，整篇都要改。"',
    impact:'下周精力 -1，论文进度 -2', baseHit:12, special:'paperDown',
    cond:s => s.week>=5},
  {id:'away', name:'导师出差失联', level:2, icon:'✈️',
    desc:'导师飞去开会，朋友圈定位在马尔代夫海边，全员失联。',
    impact:'本周完成导师任务收益减半', baseHit:8, special:'taskBlock',
    cond:s => true},
  {id:'misconduct', name:'学术不端指控', level:3, icon:'⚖️',
    desc:'举报信送到了院长邮箱：你的实验数据"过于完美"。',
    impact:'满意度 -25', baseHit:25,
    cond:s => s.intel>=10},
  {id:'lowperf', name:'表现不佳警告', level:1, icon:'⚠️',
    desc:'导师把你单独留下："最近状态不对啊，是不是恋爱了？"',
    impact:'满意度 -8', baseHit:8,
    cond:s => s.sat<40},
  {id:'compete', name:'同门竞争', level:2, icon:'⚔️',
    desc:'师兄抢先发表了你正在做的方向，导师当众："你怎么没他快？"',
    impact:'满意度 -12', baseHit:12,
    cond:s => s.network<2},
  {id:'deadline', name:'死线突袭', level:2, icon:'⏰',
    desc:'导师周五说："周一给我看完整版本。"今天是周日。',
    impact:'下周精力 -1', baseHit:6, special:'energyDown',
    cond:s => s.week>=4},
  {id:'breakup', name:'恋爱崩盘', level:2, icon:'💔',
    desc:'ta 给你发了"我们不合适"，连同实验室都不想去了。',
    impact:'满意度 -15', baseHit:15,
    cond:s => s.loveCount>=1},
  {id:'rejected', name:'论文被拒', level:2, icon:'❌',
    desc:'审稿意见："此文方法陈旧，结论平庸，建议作者另寻方向。"',
    impact:'满意度 -10，论文 -1', baseHit:10, special:'paperDown',
    cond:s => s.paper>=3},
  {id:'roommate', name:'室友毕业秀', level:1, icon:'🎓',
    desc:'室友秋招拿了 50w offer，全寝室就你还在改第 8 版论文。',
    impact:'满意度 -8', baseHit:8,
    cond:s => s.week>=6},
  {id:'family', name:'家里催相亲', level:1, icon:'📞',
    desc:'妈妈打来电话："xx 都生二胎了，你还在读书……"',
    impact:'满意度 -5，下周精力 -1', baseHit:5, special:'energyDown',
    cond:s => s.week>=8},
  {id:'hairloss', name:'毛囊抗议', level:1, icon:'💇',
    desc:'梳头时一抓一大把。镜子里的发际线在向后撤退。',
    impact:'满意度 -3', baseHit:3,
    cond:s => true}
];

// ========== 线索池 ==========
const CLUES_BY_ATTR = {
  expectation: {
    '论文型': [
      '导师在组会上反复提及"今年要冲一区"',
      '导师办公桌上摊着 SCI 期刊清单',
      '同门说："他眼里只有论文产出。"',
      '听说他刚拒了一个不发论文只做工程的师兄'
    ],
    '平衡型': [
      '导师强调"科研要全面发展"',
      '导师让你既要发文章又要做横向',
      '同门说："他喜欢全能型选手。"',
      '导师常说"做研究不能只盯论文"'
    ],
    '人脉型': [
      '导师常带你去参加学术会议社交',
      '导师朋友圈都是项目合作伙伴',
      '同门说："他看重的是资源整合。"',
      '听说他给推荐到大厂的师兄写过六封信'
    ]
  },
  threshold: {
    30: ['导师以批评出名，组会上脾气暴躁', '同门：他对学生要求极高', '隔壁实验室都听说过他爱发火'],
    40: ['导师平常温和但发火时让人胆战', '同门：他容忍底线一般', '据说他每年都会因为某个学生大发雷霆'],
    50: ['导师以宽容著称，很少为难学生', '同门：他基本不发火', '同门说："他人特别好，就是有点散漫"']
  },
  preference: {
    '道具奖励型': ['导师给优秀学生送过笔记本电脑', '导师抽屉里全是实验设备清单', '听说他喜欢用实物奖励学生'],
    '声望奖励型': ['导师乐意为学生写推荐信', '导师常带学生在学术圈露脸', '他最近又给一个师兄推到了 PI 职位'],
    '能力奖励型': ['导师亲自带学生写第一篇论文', '导师注重一对一指导', '他喜欢用"师徒制"培养学生']
  }
};

const GENERAL_CLUES = [
  '导师最近频繁查看实验进度表',
  '导师电脑桌面贴满了 deadline 便签',
  '师兄说他刚换了一批实验设备',
  '同门提到导师对师妹有特别关照',
  '导师办公室门口排着等候的学生',
  '听说导师最近申请到了大项目',
  '导师朋友圈又发了"内卷无止境"',
  '走廊里听到导师在跟同事吐槽某个学生'
];

// ========== 流派识别 ==========
const FACTIONS = {
  '论文机器': {keys:['paper','I-01','I-02','F-01'], hint:'你正走向论文机器流派 — 持续推进论文成为核心循环'},
  '人脉达人': {keys:['network','I-03','A-04'], hint:'你正走向人脉达人流派 — 人脉转化是关键引擎'},
  '情报专家': {keys:['investigate','A-03','A-05','S-03'], hint:'你正走向情报专家流派 — 揭示属性后精准博弈'},
  '危机应对': {keys:['admin','I-04','A-09','P-02','P-04'], hint:'你正走向危机应对流派 — 韧性积累化危为机'},
  '摸鱼大师': {keys:['fish','S-01'], hint:'你正走向摸鱼大师流派 — 低消耗维持底线'},
  '咸鱼路线': {keys:['love','partime','fish'], hint:'你正走向咸鱼路线 — 主打一个躺平自洽'},
  '平衡发展': {keys:[], hint:'多线均衡发展，灵活应变'}
};

// ========== 阶段名称 ==========
const PHASES = [
  {start:1, end:4, name:'入学适应'},
  {start:5, end:8, name:'研究深化'},
  {start:9, end:12, name:'毕业冲刺'},
  {start:13, end:16, name:'延毕苦熬'}
];

// ========== 结局描述 ==========
const ENDINGS = {
  graduate: {
    icon: '🎓', title: '光荣毕业！',
    sub: '导师在你的答辩书上签下大名："这孩子有前途。"<br>你抱着学位证走出会场，外面阳光灿烂。',
    fail: false
  },
  dropout: {
    icon: '💔', title: '退学退场',
    sub: '满意度归零，导师摇头："这条路不适合你。"<br>你删掉了所有论文文件夹，长舒一口气。',
    fail: true
  },
  extension_fail: {
    icon: '🥀', title: '延毕也未通过',
    sub: '四年了，你终于妥协。<br>"算了，回老家考个公务员吧。"',
    fail: true
  },
  love_win: {
    icon: '💑', title: '爱情事业双丰收',
    sub: '你不仅毕业了，还和 ta 在校园里走到了最后一天。<br>导师在婚礼上致辞："你这家伙，运气真好。"',
    fail: false
  },
  fish_master: {
    icon: '🐟', title: '咸鱼也能毕业！',
    sub: '你用最少的努力换到了学位证。<br>导师看着你的论文："这水平也能过？算了，我累了。"',
    fail: false
  },
  paper_god: {
    icon: '📜', title: '论文之神',
    sub: '你的论文发表数超过了导师本人。<br>导师在朋友圈写："青出于蓝。"',
    fail: false
  },
  perfect: {
    icon: '👑', title: '完美毕业',
    sub: '满意度、论文、人脉、声望全部满分。<br>这一届最强研究生，就是你。',
    fail: false
  }
};


/* ============================================================
   GAME OBJECT
   ============================================================ */
const GAME = {
  state: null,

  newGame() {
    const sup = SUPERVISORS[Math.floor(Math.random()*SUPERVISORS.length)];
    return {
      week: 1, maxWeek: 12,
      sat: 50,
      energy: 5, energyMax: 5, energyBonus: 0,
      paper: 0, prestige: 0,
      network: 0, intel: 0, resilience: 0,
      supName: sup.name, supIcon: sup.icon,
      expectation: EXPECTATIONS[Math.floor(Math.random()*3)],
      threshold: [30,40,50][Math.floor(Math.random()*3)],
      preference: PREFERENCES[Math.floor(Math.random()*3)],
      revealed: {expectation:false, threshold:false, preference:false},
      weekActions: [],
      weekClues: [],
      crisisActive: null,
      crisisResolved: true,
      items: [],
      itemMax: 8,
      shieldUsed: false,
      pauseUsed: false,
      lastWeekTaskCount: 0,
      // 趣味统计
      loveCount: 0,
      partimeCount: 0,
      fishCount: 0,
      // 元统计
      totalActions: 0,
      crisesHandled: 0,
      itemsUsed: 0,
      log: []
    };
  },

  start() {
    this.state = this.newGame();
    document.getElementById('startScreen').classList.remove('active');
    document.getElementById('endScreen').classList.remove('active');
    document.getElementById('gameScreen').classList.add('active');

    // 开局赠送一件道具
    this.grantStarterItem();
    this.generateClues();
    this.render();
    this.log('新学期开始！导师 <b>'+this.state.supName+'</b> 在等你的第一次汇报。', 'gold');
    this.toast('🎓 新学期开始！', 'gold');
  },

  // ========== 开局赠品 ==========
  grantStarterItem() {
    // 随机送一件普通道具，让新手感受道具效果
    const commons = ITEMS.filter(i => i.rarity==='common');
    const item = commons[Math.floor(Math.random()*commons.length)];
    this.state.items.push(item);
    this.log(`📦 开局赠送：${item.name} — ${item.flavor}`, 'gold');
  },

  restart() {
    document.getElementById('gameScreen').classList.remove('active');
    document.getElementById('endScreen').classList.remove('active');
    document.getElementById('startScreen').classList.add('active');
  },

  // ========== 主渲染 ==========
  render() {
    const s = this.state;

    document.getElementById('weekNum').textContent = s.week;
    document.getElementById('phaseLabel').textContent = this.currentPhase();
    this.renderWeekDots();

    document.getElementById('satVal').innerHTML = s.sat + '<span class="max">/100</span>';
    const satFill = document.getElementById('satFill');
    satFill.style.width = s.sat + '%';
    satFill.className = 'stat-bar-fill ' + this.satColor(s.sat);

    const oldThresh = document.getElementById('thresholdMark');
    if (oldThresh) oldThresh.remove();
    if (s.revealed.threshold) {
      const t = document.createElement('div');
      t.id = 'thresholdMark';
      t.className = 'stat-threshold';
      t.style.left = s.threshold + '%';
      document.getElementById('satBarOuter').appendChild(t);
    }

    document.getElementById('energyVal').textContent = s.energy;
    document.getElementById('energyMax').textContent = s.energyMax;
    document.getElementById('remainEnergy').textContent = s.energy;
    document.getElementById('executedCount').textContent = s.weekActions.length;

    const pipsHtml = [];
    for (let i=0; i<s.energyMax; i++) {
      const isBonus = i >= 5;
      pipsHtml.push(`<div class="pip ${i<s.energy ? 'full' : ''} ${isBonus?'bonus':''}"></div>`);
    }
    document.getElementById('energyPips').innerHTML = pipsHtml.join('');

    document.getElementById('paperVal').textContent = s.paper;
    document.getElementById('prestigeVal').textContent = s.prestige;
    document.getElementById('networkVal').textContent = s.network;
    document.getElementById('intelVal').textContent = s.intel;
    document.getElementById('resilienceVal').textContent = s.resilience;
    document.getElementById('itemCount').textContent = s.items.length;

    this.renderBuildHint();

    document.getElementById('supName').textContent = s.supName;
    document.getElementById('supIcon').textContent = s.supIcon;
    document.getElementById('supMood').innerHTML = '态度：<span class="em">' + this.supMood(s.sat) + '</span>';

    this.renderAttr('expectation', '🎯', '期望方向', s.expectation, s.revealed.expectation);
    this.renderAttr('threshold', '💢', '压力阈值', s.threshold+' 满意度', s.revealed.threshold);
    this.renderAttr('preference', '🎁', '奖励偏好', s.preference, s.revealed.preference);

    const clueList = document.getElementById('clueList');
    if (s.weekClues.length === 0) {
      clueList.innerHTML = '<div class="empty-hint">本周没有观察到明显线索</div>';
    } else {
      clueList.innerHTML = s.weekClues.map(c => `<div class="clue">${c}</div>`).join('');
    }

    this.renderActions();
    this.renderItems();
    this.renderLog();
  },

  renderWeekDots() {
    const s = this.state;
    const html = [];
    for (let w=1; w<=s.maxWeek; w++) {
      const isBoss = (w===4 || w===8 || w===12);
      let cls = 'week-dot';
      if (w < s.week) cls += ' passed';
      else if (w === s.week) cls += ' current';
      if (isBoss) cls += ' boss';
      html.push(`<div class="${cls}" title="第${w}周${isBoss?' · 考核节点':''}"></div>`);
    }
    document.getElementById('weekDots').innerHTML = html.join('');
  },

  renderAttr(key, ic, lb, val, revealed) {
    const el = document.getElementById('attr-' + key);
    el.classList.toggle('revealed', revealed);
    el.innerHTML = `
      <div class="attr-ic">${ic}</div>
      <div class="attr-info">
        <div class="attr-lb">${lb}</div>
        <div class="attr-vl">${revealed ? val : '?????'}</div>
      </div>
    `;
  },

  renderActions() {
    const s = this.state;
    const html = ACTIONS.map(a => {
      const cost = this.effectiveCost(a);
      const canUse = s.energy >= cost && s.crisisResolved;
      return `
        <div class="action-card cat-${a.cat} ${canUse?'':'disabled'}" onclick="${canUse?`GAME.doAction('${a.id}')`:''}">
          <div class="tag tag-${a.tag==='高风险'?'risk':(a.tag==='放松'?'fish':'')}">${a.tag}</div>
          <div class="ic">${a.icon}</div>
          <div class="nm">${a.name}</div>
          <div class="desc">${a.desc}</div>
          <div class="cost"><span class="cost-num">${cost}</span> 精力</div>
        </div>
      `;
    }).join('');
    document.getElementById('actionsGrid').innerHTML = html;
  },

  renderItems() {
    const s = this.state;
    const list = document.getElementById('itemsList');
    document.getElementById('itemsBadge').textContent = `${s.items.length} / ${s.itemMax}`;
    if (s.items.length === 0) {
      list.innerHTML = '<div class="empty-hint">暂无道具 — 通过考核或开局获取</div>';
      return;
    }
    list.innerHTML = s.items.map((it, idx) => {
      const usable = this.isItemUsable(it);
      return `
      <div class="item r-${it.rarity}">
        <div class="item-ic">${it.icon}</div>
        <div class="item-body">
          <div class="item-nm">${it.name} <span class="item-rar">[${this.rarityLabel(it.rarity)}]</span></div>
          <div class="item-eff">${it.effect}</div>
          ${it.flavor ? `<div class="item-flavor">— "${it.flavor}"</div>` : ''}
        </div>
        ${usable ? `<button class="btn sm" onclick="GAME.useItem(${idx})">使用</button>` : '<div class="item-passive">被动</div>'}
      </div>
      `;
    }).join('');
  },

  // 判断是否可主动使用
  isItemUsable(item) {
    return ['S-01','S-03','A-05','A-06','A-09','F-01'].includes(item.id);
  },

  renderLog() {
    const html = this.state.log.slice(-15).reverse().map(l =>
      `<div class="lg ${l.cls||''}"><span class="t">[W${l.w}]</span>${l.text}</div>`
    ).join('');
    document.getElementById('actionLog').innerHTML = html || '<div class="lg">尚无行动记录</div>';
  },

  renderBuildHint() {
    const s = this.state;
    if (s.totalActions < 3) {
      document.getElementById('buildHint').style.display = 'none';
      return;
    }
    const score = {};
    s.log.forEach(l => { if (l.act) score[l.act] = (score[l.act]||0) + 1; });
    s.items.forEach(i => { score[i.id] = (score[i.id]||0) + 2; });

    let best = '平衡发展', bestScore = 0;
    for (const [fac, info] of Object.entries(FACTIONS)) {
      const sc = info.keys.reduce((sum,k) => sum + (score[k]||0), 0);
      if (sc > bestScore) { bestScore = sc; best = fac; }
    }
    document.getElementById('buildHint').style.display = 'block';
    document.getElementById('buildHintText').textContent = FACTIONS[best].hint;
  },

  // ========== 工具函数 ==========
  satColor(s) {
    if (s>=80) return 'green';
    if (s>=60) return 'yellow';
    if (s>=40) return 'orange';
    return 'red';
  },
  supMood(s) {
    if (s>=80) return '十分满意 😊';
    if (s>=60) return '基本满意 🙂';
    if (s>=40) return '一般 😐';
    if (s>=20) return '不满 😠';
    return '震怒 😡';
  },
  currentPhase() {
    const w = this.state.week;
    for (const p of PHASES) if (w>=p.start && w<=p.end) return p.name;
    return '毕业后';
  },
  rarityLabel(r) {
    return {common:'普通', rare:'非凡', epic:'稀有', legendary:'传奇'}[r] || r;
  },
  effectiveCost(action) {
    let c = action.cost;
    const s = this.state;
    if (action.id==='task' && s.items.find(i=>i.id==='A-01')) c = Math.max(1, c-1);
    if (action.id==='investigate' && s.items.find(i=>i.id==='A-03')) c = Math.max(1, c-1);
    return c;
  },

  log(text, cls, act) {
    this.state.log.push({w:this.state.week, text, cls, act});
    if (this.state.log.length > 80) this.state.log.shift();
  },

  // ========== 执行行动 ==========
  doAction(id) {
    const action = ACTIONS.find(a => a.id===id);
    const cost = this.effectiveCost(action);
    const s = this.state;
    if (s.energy < cost) { this.toast('⚠️ 精力不足', 'red'); return; }
    if (!s.crisisResolved) { this.toast('⚠️ 请先处理危机', 'red'); return; }

    s.energy -= cost;
    s.weekActions.push(id);
    s.totalActions++;

    this.applyAction(action);
    this.render();
  },

  applyAction(action) {
    const s = this.state;
    switch (action.id) {

      case 'task': {
        let match = 0.33;
        if (s.revealed.expectation) match = 1.0;
        else match = 0.33 + Math.random() * 0.34;
        if (s.items.find(i=>i.id==='A-05')) match = Math.min(1.0, match + 0.1);

        let delta = Math.round((match - 0.33) * 30);
        delta = Math.max(-20, Math.min(15, delta));

        // A-02 恭维话术：每周首次任务额外+5
        if (s.items.find(i=>i.id==='A-02') && s.lastWeekTaskCount===0) {
          delta += 5;
          this.log('A-02 恭维话术触发：满意度 +5', 'gold');
        }

        s.sat = Math.max(0, Math.min(100, s.sat + delta));
        s.prestige += 4;
        s.lastWeekTaskCount++;

        this.floatText((delta>=0?'+':'')+delta+' 满意度', delta>=0?'green':'red', '#satVal');
        this.log(`完成导师任务 → 满意度 ${delta>=0?'+':''}${delta}，声望 +4`,
          delta>=0?'green':'red', 'task');
        break;
      }

      case 'paper': {
        s.paper++;
        s.prestige += 3;
        let extra = '';
        const paperThisWeek = s.weekActions.filter(a=>a==='paper').length;
        if (paperThisWeek===2 && s.items.find(i=>i.id==='I-01')) {
          s.sat = Math.min(100, s.sat+3);
          extra = '，I-01 触发 满意度+3';
          this.floatText('+3 满意度', 'gold', '#satVal');
        }
        // F-03 纸面研究生：论文效率×2
        if (s.items.find(i=>i.id==='F-03')) {
          s.paper++;
          extra += '，F-03 加成 论文+1';
        }
        if (s.paper>=10 && !s._i02fired && s.items.find(i=>i.id==='I-02')) {
          s.sat = Math.min(100, s.sat+15);
          s._i02fired = true;
          extra += '，I-02 触发 满意度+15';
          this.floatText('+15 满意度!', 'gold', '#satVal');
        }
        this.floatText('+1 论文', 'green', '#paperVal');
        this.log(`推进论文研究 → 论文进度 +1（${s.paper}），声望 +3${extra}`, 'green', 'paper');
        break;
      }

      case 'investigate': {
        s.intel++;
        this.floatText('+1 情报', 'gold', '#intelVal');
        const unrevealed = ['expectation','threshold','preference'].filter(k => !s.revealed[k]);
        if (unrevealed.length > 0 && Math.random() < 0.8) {
          const key = unrevealed[Math.floor(Math.random()*unrevealed.length)];
          s.revealed[key] = true;
          const labels = {expectation:'期望方向', threshold:'压力阈值', preference:'奖励偏好'};
          this.log(`调查导师线索 → <b>揭示了导师的「${labels[key]}」！</b>`, 'gold', 'investigate');
          this.toast('🔍 揭示了导师属性！', 'purple');
        } else {
          this.log(`调查导师线索 → 情报值 +1（仅积累信息）`, '', 'investigate');
        }
        if (s.items.find(i=>i.id==='A-03') && unrevealed.length>1 && Math.random()<0.5) {
          const remaining = unrevealed.filter(k => !s.revealed[k]);
          if (remaining.length) {
            const key = remaining[0];
            s.revealed[key] = true;
            this.log(`A-03 额外触发：揭示「${({expectation:'期望方向',threshold:'压力阈值',preference:'奖励偏好'})[key]}」`, 'gold');
          }
        }
        break;
      }

      case 'network': {
        let gain = 1;
        if (s.items.find(i=>i.id==='A-04')) gain++;
        s.network += gain;
        this.floatText('+'+gain+' 人脉', 'green', '#networkVal');
        if (s.items.find(i=>i.id==='I-03')) {
          s.intel++;
          this.log(`拓展人脉关系 → 人脉 +${gain}，I-03 触发 情报 +1`, 'green', 'network');
        } else {
          this.log(`拓展人脉关系 → 人脉值 +${gain}`, '', 'network');
        }
        if (s.network>=3 && Math.random()>0.5) {
          s.prestige += 2;
          this.log(`同门互助 → 声望 +2`, 'green');
        }
        break;
      }

      case 'admin': {
        s.resilience++;
        s.prestige += 1;
        this.floatText('+1 韧性', 'gold', '#resilienceVal');
        this.log(`应付行政事务 → 韧性 +1，声望 +1`, '', 'admin');
        break;
      }

      // ========= 趣味/负面行动 =========
      case 'love': {
        s.loveCount++;
        s.sat = Math.max(0, s.sat - 8);
        s.energyMax = Math.min(8, s.energyMax + 1);
        this.floatText('-8 满意度', 'red', '#satVal');
        this.floatText('+1 精力上限', 'gold', '#energyMax');
        const tips = [
          '你和 ta 看了场电影，导师看你两眼无神。',
          '你们手牵手在校园散步，导师朋友圈刚发"科研要专注"。',
          '你帮 ta 改了篇作业，自己的论文又拖了一周。',
          '甜蜜的代价：导师让你下周补三份报告。'
        ];
        this.log(`💕 谈恋爱 → ${tips[Math.floor(Math.random()*tips.length)]}（满意度 -8，精力上限永久+1）`, 'red', 'love');
        this.toast('💕 恋爱总要付出代价', 'red');
        break;
      }

      case 'partime': {
        s.partimeCount++;
        s.prestige += 8;
        s.network++;
        s.sat = Math.max(0, s.sat - 5);
        this.floatText('+8 声望', 'green', '#prestigeVal');
        this.floatText('-5 满意度', 'red', '#satVal');
        const tips = [
          '你接了个家教，赚了钱但被导师在校门口撞见。',
          '你送了一周外卖，导师："你眼下乌青是怎么回事？"',
          '你帮人写代码赚外快，结果代码被导师查重了。',
          '你做了一周咨询，攒了钱也攒了一肚子怨气。'
        ];
        this.log(`💼 去打工 → ${tips[Math.floor(Math.random()*tips.length)]}（声望 +8，人脉 +1，满意度 -5）`, 'red', 'partime');
        this.toast('💼 打工人，打工魂', 'gold');
        break;
      }

      case 'fish': {
        s.fishCount++;
        s.energyBonus += 2;
        s.sat = Math.max(0, s.sat - 3);
        this.floatText('+2 下周精力', 'gold', '#energyVal');
        this.floatText('-3 满意度', 'red', '#satVal');
        const tips = [
          '你打了一整天游戏，账号又升了 5 级。',
          '你刷完了一整季《狂飙》，眼睛酸但心情爽。',
          '你睡了 14 小时，醒来时怀疑自己是不是病了。',
          '你逛街买了一堆没用的东西，钱包扁了精神饱了。'
        ];
        this.log(`🐟 摸鱼一整天 → ${tips[Math.floor(Math.random()*tips.length)]}（下周精力 +2，满意度 -3）`, 'red', 'fish');
        this.toast('🐟 咸鱼，但快乐', 'purple');
        break;
      }
    }
  }
};


// ============================================================
// 周结算、危机、考核、道具使用、结局
// ============================================================
Object.assign(GAME, {

  // ========== 使用主动道具 ==========
  useItem(idx) {
    const s = this.state;
    const item = s.items[idx];
    if (!item || !this.isItemUsable(item)) return;

    s.itemsUsed++;

    switch (item.id) {
      case 'S-01':
        if (s.pauseUsed) { this.toast('S-01 本局已使用过', 'red'); return; }
        s.pauseUsed = true;
        this.log(`使用 ${item.name}：本周跳过满意度结算`, 'gold');
        this.toast('⏸️ 时间暂停！', 'purple');
        break;
      case 'S-03':
        if (s.intel < 5) { this.toast('情报值不足 5', 'red'); return; }
        s.intel -= 5;
        s.crisisShield = true;
        this.log(`使用 ${item.name}：消耗 5 情报，本周强制危机被取消`, 'gold');
        this.toast('📷 黑材料生效', 'purple');
        break;
      case 'A-05':
        if (s.revealed.expectation) { this.toast('期望方向已揭示', 'red'); return; }
        s.revealed.expectation = true;
        this.log(`使用 ${item.name}：揭示导师期望方向 = ${s.expectation}`, 'gold');
        this.toast('🎯 揭示期望方向！', 'purple');
        // 一次性消耗
        s.items.splice(idx, 1);
        break;
      case 'A-06':
        s.energyMax = Math.min(8, s.energyMax + 1);
        this.floatText('+1 精力上限', 'gold', '#energyMax');
        this.log(`使用 ${item.name}：精力上限永久 +1（当前 ${s.energyMax}）`, 'gold');
        s.items.splice(idx, 1);
        break;
      case 'A-09':
        s.resilience = Math.min(6, s.resilience + 3);
        this.floatText('+3 韧性', 'gold', '#resilienceVal');
        this.log(`使用 ${item.name}：韧性 +3`, 'gold');
        s.items.splice(idx, 1);
        break;
      case 'F-01':
        if (s.paper >= 12) {
          this.log('🏆 F-01 触发：论文进度达标，提前通关！', 'gold');
          setTimeout(() => this.endGame('paper_god'), 500);
          return;
        } else {
          s.sat = Math.min(100, s.sat + 20);
          this.log(`使用 ${item.name}：论文不足 12，满意度 +20 作为补偿`, 'gold');
          s.items.splice(idx, 1);
        }
        break;
    }
    this.render();
  },

  // ========== 结束本周 ==========
  endWeek() {
    const s = this.state;
    if (!s.crisisResolved) { this.toast('⚠️ 请先处理危机', 'red'); return; }

    if (s.items.find(i=>i.id==='I-04')) {
      s.resilience = Math.min(6, s.resilience+1);
      this.log('I-04 引擎：每周韧性 +1', 'green');
    }

    if (!s.pauseUsed) {
      const triggered = this.rollCrisis();
      if (triggered) {
        this.showCrisis(triggered);
        return;
      }
    }

    this.proceedToNextWeek();
  },

  rollCrisis() {
    const s = this.state;
    if (s.week===4 || s.week===8 || s.week===12) return null;

    let forced = false;
    if (s.sat < s.threshold) forced = true;
    // F-03 不再受满意度影响
    if (s.items.find(i=>i.id==='F-03')) forced = false;

    let rate = 0.3 * (1 - (s.sat/100)*0.5);
    if (s.items.find(i=>i.id==='F-03')) rate = 0.3;
    if (s.items.find(i=>i.id==='I-04') && s.resilience>=3) rate -= 0.1;
    if (s.week >= 9) rate += 0.1;
    // 摸鱼次数影响
    if (s.fishCount>=2) rate += 0.05;

    if (!forced && Math.random() >= rate) return null;
    if (s.crisisShield) { s.crisisShield = false; return null; }

    const eligible = CRISES.filter(c => c.cond(s));
    if (eligible.length === 0) return null;
    return eligible[Math.floor(Math.random()*eligible.length)];
  },

  showCrisis(crisis) {
    const s = this.state;
    s.crisisActive = crisis;
    s.crisisResolved = false;

    const choices = [
      {
        nm: '认错装乖 💪', icon: '😅',
        ef: `损失满意度 ${crisis.baseHit}，声望 +${crisis.level*2}。利用情报推断态度。`,
        fn: () => {
          let hit = crisis.baseHit;
          if (s.revealed.expectation || s.revealed.threshold) hit = Math.round(hit * 0.6);
          this.applyShield(hit);
          s.prestige += crisis.level * 2;
          this.log(`【危机】${crisis.name} → 认错装乖，满意度 -${hit}`, 'red');
        }
      },
      {
        nm: '装聋作哑 🤷', icon: '😐',
        ef: `损失满意度 ${crisis.baseHit + crisis.level*3}，但保留行动机会。`,
        fn: () => {
          this.applyShield(crisis.baseHit + crisis.level*3);
          this.log(`【危机】${crisis.name} → 装聋作哑，满意度大跌`, 'red');
        }
      },
      {
        nm: '正面硬刚 ⚡', icon: '😤',
        ef: `30%胜：满意度 +5、声望 +5；70%败：满意度 -${crisis.baseHit + 5}`,
        fn: () => {
          if (Math.random() < 0.3) {
            s.sat = Math.min(100, s.sat + 5);
            s.prestige += 5;
            this.log(`【危机】${crisis.name} → 硬刚成功！导师反而欣赏你的胆量`, 'green');
            this.toast('⚡ 反将一军！', 'green');
          } else {
            this.applyShield(crisis.baseHit + 5);
            this.log(`【危机】${crisis.name} → 硬刚失败，损失惨重`, 'red');
          }
        }
      }
    ];

    if (s.resilience >= 2) {
      choices.push({
        nm: '消耗韧性硬抗 🛡️', icon: '🛡️',
        ef: `消耗 2 韧性，将本次损失降至 ${Math.round(crisis.baseHit*0.3)}`,
        fn: () => {
          s.resilience -= 2;
          this.applyShield(Math.round(crisis.baseHit*0.3));
          this.log(`【危机】${crisis.name} → 消耗韧性 2 抵御，损失最小化`, 'green');
        }
      });
    }

    if (s.network >= 3) {
      choices.push({
        nm: '同门救场 🤝', icon: '🤝',
        ef: '消耗 3 人脉，完全取消本次危机损失',
        fn: () => {
          s.network -= 3;
          this.log(`【危机】${crisis.name} → 同门救场，危机化解`, 'green');
          this.toast('🤝 兄弟伙！危机化解', 'green');
        }
      });
    }

    const s01 = s.items.find(i=>i.id==='S-01');
    if (s01 && !s.pauseUsed) {
      choices.push({
        nm: '使用 S-01 临时暂停 ⏸️', icon: '⏸️',
        ef: '本局唯一一次跳过本周结算',
        fn: () => {
          s.pauseUsed = true;
          this.log(`使用 S-01，本周跳过结算`, 'gold');
          this.toast('⏸️ 时间暂停！', 'purple');
        }
      });
    }

    this.openCrisisDialog(crisis, choices);
  },

  applyShield(loss) {
    const s = this.state;
    if (!s.shieldUsed && s.items.find(i=>i.id==='P-01')) {
      loss = Math.round(loss/2);
      s.shieldUsed = true;
      this.log(`P-01 护盾触发：损失减半为 ${loss}`, 'gold');
    }
    s.sat = Math.max(0, s.sat - loss);
    this.floatText('-'+loss+' 满意度', 'red', '#satVal');

    if (s.sat < 50 && s.items.find(i=>i.id==='P-04') && Math.random()<0.3) {
      s.sat = Math.min(100, s.sat+10);
      this.log(`P-04 紧急补救：满意度 +10`, 'gold');
      this.floatText('+10 满意度', 'gold', '#satVal');
    }
  },

  openCrisisDialog(crisis, choices) {
    const html = `
      <div class="dialog crisis">
        <div class="dialog-head">
          <div class="dialog-ic">${crisis.icon}</div>
          <div>
            <div class="dialog-title">${crisis.name}</div>
            <div class="dialog-lvl">${crisis.level} 级危机 · 本周有效</div>
          </div>
        </div>
        <div class="dialog-body">${crisis.desc}</div>
        <div class="dialog-impact">⚠️ 影响：${crisis.impact}</div>
        <div class="choices">
          ${choices.map((c,i) => `
            <button class="choice" onclick="GAME.resolveCrisis(${i})">
              <div class="num">${i+1}</div>
              <div class="txt">
                <div class="nm">${c.icon} ${c.nm}</div>
                <div class="ef">${c.ef}</div>
              </div>
            </button>
          `).join('')}
        </div>
      </div>
    `;
    document.getElementById('dialog').outerHTML = html;
    document.querySelector('.overlay .dialog').id = 'dialog';
    document.getElementById('overlay').classList.add('active');
    this._crisisChoices = choices;
  },

  resolveCrisis(idx) {
    const choice = this._crisisChoices[idx];
    choice.fn();
    this.state.crisisResolved = true;
    this.state.crisesHandled++;
    document.getElementById('overlay').classList.remove('active');

    const c = this.state.crisisActive;
    if (c && c.special) {
      if (c.special==='paperDown') this.state.paper = Math.max(0, this.state.paper-2);
      if (c.special==='energyDown') this.state.energyBonus -= 1;
    }
    this.state.crisisActive = null;
    this.render();
    setTimeout(() => this.proceedToNextWeek(), 600);
  },

  proceedToNextWeek() {
    const s = this.state;
    if (s.sat >= 80) {
      s.prestige += 5;
      this.log('导师满意度高，声望奖励 +5', 'gold');
    }

    s.week++;
    s.energy = s.energyMax + s.energyBonus;
    s.energyBonus = 0;
    s.weekActions = [];
    s.lastWeekTaskCount = 0;
    s.shieldUsed = false;
    s.pauseUsed = false;
    s.crisisShield = false;
    this.generateClues();

    if (s.week === 5) this.checkAssessment(1);
    else if (s.week === 9) this.checkAssessment(2);
    else if (s.week === 13) this.checkAssessment(3);

    if (s.sat <= 0) { this.endGame('dropout'); return; }
    if (s.week > s.maxWeek) {
      // 已通过最终考核或延毕失败
      this.evaluateEnding(); return;
    }

    this.render();
  },

  // ========== 考核节点 ==========
  checkAssessment(round) {
    const s = this.state;
    let passed=false, title, body, rewards;

    if (round === 1) {
      passed = s.sat >= 40;
      title = '期初考核 · 第 4 周';
      body = passed
        ? '导师在你的报告上批了"尚可"二字。<br>"研究生第一阶段，你过关了。"'
        : '导师把你的报告丢回来："你这水平，能毕业吗？"';
      rewards = passed ? {prestige:15} : {sat:-20};
    } else if (round === 2) {
      passed = s.sat >= 55 && s.paper >= 4;
      title = '中期答辩 · 第 8 周';
      body = passed
        ? '答辩委员会一致认可你的进展。<br>导师在台下点了点头。'
        : '答辩委员会对你的进度提出严肃质疑。' + (s.sat<55?' 满意度未达 55。':'') + (s.paper<4?' 论文进度不足 4 次。':'');
      rewards = passed ? {prestige:20} : {sat:-25};
    } else {
      passed = s.sat >= 65 && s.paper >= 10;
      title = '毕业答辩 · 第 12 周';
      if (passed) {
        // 直接通关
        Object.assign(s, {sat: Math.min(100, s.sat), prestige: s.prestige+30});
        this.showAssessmentDialog(title, '你成功通过了毕业答辩！', true, () => this.evaluateEnding());
        return;
      } else {
        s.maxWeek = 16;
        title = '延毕警告';
        body = `毕业答辩未通过：${s.sat<65?'满意度不足 65。':''}${s.paper<10?' 论文进度不足 10 次。':''}<br>你被迫进入<b>延毕阶段</b>，还有 4 周机会！`;
        rewards = {sat:-10};
      }
    }

    if (passed) {
      Object.entries(rewards).forEach(([k,v]) => { s[k] += v; });
      s.sat = Math.min(100, s.sat);
      this.showAssessmentDialog(title, body, true, () => {
        this.offerItemReward();
      });
    } else {
      Object.entries(rewards||{}).forEach(([k,v]) => { s[k] = Math.max(0, s[k]+v); });
      this.showAssessmentDialog(title, body, false);
    }
  },

  showAssessmentDialog(title, body, success, onClose) {
    const html = `
      <div class="dialog ${success?'success':'crisis'}">
        <div class="dialog-head">
          <div class="dialog-ic">${success?'🏆':'⚠️'}</div>
          <div>
            <div class="dialog-title">${title}</div>
            <div class="dialog-lvl">${success?'考核通过':'考核失败'}</div>
          </div>
        </div>
        <div class="dialog-body">${body}</div>
        ${success
          ? '<div class="dialog-success-stat">✅ 学术声望奖励，并可选择 1 件道具</div>'
          : '<div class="dialog-impact">❌ 满意度受到惩罚</div>'}
        <div style="text-align:center;margin-top:18px">
          <button class="btn ${success?'':'red'}" onclick="GAME.closeDialog(${success?'true':'false'})">
            ${success?'领取奖励':'继续'}
          </button>
        </div>
      </div>
    `;
    this.openDialog(html);
    this._assessmentCallback = onClose;
  },

  closeDialog(showReward) {
    document.getElementById('overlay').classList.remove('active');
    if (showReward && this._assessmentCallback) {
      setTimeout(() => this._assessmentCallback(), 300);
      this._assessmentCallback = null;
    } else {
      this.render();
    }
  },

  // ========== 道具奖励 ==========
  offerItemReward() {
    const s = this.state;
    const owned = s.items.map(i=>i.id);
    const available = ITEMS.filter(i => !owned.includes(i.id));
    if (available.length === 0) { this.render(); return; }

    // 按稀有度加权抽 3 件
    const weighted = [];
    available.forEach(it => {
      const w = it.rarity==='common'?4 : it.rarity==='rare'?3 : it.rarity==='epic'?2 : 1;
      for (let i=0; i<w; i++) weighted.push(it);
    });
    const choices = [];
    const used = new Set();
    while (choices.length<3 && weighted.length) {
      const idx = Math.floor(Math.random()*weighted.length);
      const it = weighted[idx];
      if (!used.has(it.id)) { choices.push(it); used.add(it.id); }
      weighted.splice(idx, 1);
    }

    const html = `
      <div class="dialog gold">
        <div class="dialog-head">
          <div class="dialog-ic">🎁</div>
          <div>
            <div class="dialog-title">考核奖励 · 三选一</div>
            <div class="dialog-lvl">选择一件道具加入你的 Build</div>
          </div>
        </div>
        <div class="reward-grid">
          ${choices.map((it,i) => `
            <div class="reward-card r-${it.rarity}" onclick="GAME.pickItem(${i})">
              <div class="ic">${it.icon}</div>
              <div class="nm">${it.name}</div>
              <div class="eff">${it.effect}</div>
              <div class="flavor">— "${it.flavor}"</div>
              <div class="rar">[${this.rarityLabel(it.rarity)}] ${it.faction}</div>
            </div>
          `).join('')}
        </div>
        <div style="text-align:center;margin-top:12px">
          <button class="btn gray sm" onclick="GAME.skipReward()">放弃奖励</button>
        </div>
      </div>
    `;
    this._rewardChoices = choices;
    this.openDialog(html);
  },

  pickItem(idx) {
    const item = this._rewardChoices[idx];
    if (this.state.items.length >= this.state.itemMax) {
      this.toast('道具栏已满，请先使用一些道具', 'red');
      return;
    }
    this.state.items.push(item);
    this.log(`获得道具 <b>${item.name}</b> [${this.rarityLabel(item.rarity)}] — ${item.flavor}`, 'gold');
    this.toast(`🎁 获得 ${item.name}`, 'gold');
    if (item.id === 'A-05' && !this.state.revealed.expectation) {
      this.state.revealed.expectation = true;
      this.log('A-05 立即揭示：导师期望方向 = '+this.state.expectation, 'gold');
    }
    if (item.id === 'A-09') {
      this.state.resilience = Math.min(6, this.state.resilience+3);
      this.log('A-09 立即：韧性 +3', 'gold');
    }
    if (item.id === 'A-06') {
      this.state.energyMax = Math.min(8, this.state.energyMax + 1);
      this.log('A-06 立即：精力上限 +1', 'gold');
    }
    document.getElementById('overlay').classList.remove('active');
    this.render();
  },

  skipReward() {
    document.getElementById('overlay').classList.remove('active');
    this.render();
  },

  // ========== 线索生成 ==========
  generateClues() {
    const s = this.state;
    s.weekClues = [];
    const numClues = 1 + Math.floor(Math.random()*2);

    for (let i=0; i<numClues; i++) {
      const accurate = Math.random() < 0.8;
      if (accurate) {
        const unrevealed = ['expectation','threshold','preference'].filter(k => !s.revealed[k]);
        if (unrevealed.length === 0) {
          s.weekClues.push(GENERAL_CLUES[Math.floor(Math.random()*GENERAL_CLUES.length)]);
          continue;
        }
        const key = unrevealed[Math.floor(Math.random()*unrevealed.length)];
        const val = s[key];
        const pool = CLUES_BY_ATTR[key][val];
        if (pool) s.weekClues.push(pool[Math.floor(Math.random()*pool.length)]);
      } else {
        s.weekClues.push(GENERAL_CLUES[Math.floor(Math.random()*GENERAL_CLUES.length)]);
      }
    }
  },

  // ========== UI 辅助 ==========
  openDialog(html) {
    const old = document.getElementById('dialog');
    if (old) old.outerHTML = html;
    else document.getElementById('overlay').insertAdjacentHTML('beforeend', html);
    document.querySelector('.overlay .dialog').id = 'dialog';
    document.getElementById('overlay').classList.add('active');
  },

  toast(msg, type) {
    const box = document.getElementById('toastBox');
    const el = document.createElement('div');
    el.className = 'toast ' + (type||'');
    el.textContent = msg;
    box.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  },

  floatText(text, type, target) {
    const el = document.createElement('div');
    el.className = 'float-text ' + (type||'gold');
    el.textContent = text;
    const host = target ? document.querySelector(target) : document.querySelector('#satVal').parentElement;
    if (!host) return;
    const r = host.getBoundingClientRect();
    el.style.left = (r.left + r.width/2 - 30 + Math.random()*20) + 'px';
    el.style.top = (r.top + 4) + 'px';
    el.style.position = 'fixed';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1500);
  },

  // ========== 评估结局 ==========
  evaluateEnding() {
    const s = this.state;
    // 必须通过最终答辩才能毕业
    if (s.sat < 50 || s.paper < 8) {
      this.endGame('extension_fail');
      return;
    }
    // 各种特殊结局判定
    if (s.loveCount >= 2 && s.sat >= 70) {
      this.endGame('love_win'); return;
    }
    if (s.fishCount >= 3) {
      this.endGame('fish_master'); return;
    }
    if (s.paper >= 15) {
      this.endGame('paper_god'); return;
    }
    if (s.sat >= 90 && s.paper >= 12 && s.network >= 8) {
      this.endGame('perfect'); return;
    }
    this.endGame('graduate');
  },

  endGame(result) {
    const s = this.state;
    document.getElementById('gameScreen').classList.remove('active');
    document.getElementById('endScreen').classList.add('active');

    const card = document.getElementById('endCard');
    const ending = ENDINGS[result] || ENDINGS.graduate;

    card.classList.toggle('fail', !!ending.fail);
    document.getElementById('endIcon').textContent = ending.icon;
    document.getElementById('endTitle').textContent = ending.title;
    document.getElementById('endSub').innerHTML = ending.sub;

    document.getElementById('endStats').innerHTML = `
      <div class="end-stat"><div class="lb">学术声望</div><div class="vl">${s.prestige}</div></div>
      <div class="end-stat"><div class="lb">论文进度</div><div class="vl">${s.paper} 次</div></div>
      <div class="end-stat"><div class="lb">最终满意度</div><div class="vl">${s.sat}</div></div>
      <div class="end-stat"><div class="lb">通关周数</div><div class="vl">${s.week-1} 周</div></div>
      <div class="end-stat"><div class="lb">应对危机</div><div class="vl">${s.crisesHandled} 次</div></div>
      <div class="end-stat"><div class="lb">获得道具</div><div class="vl">${s.items.length} 件</div></div>
      <div class="end-stat"><div class="lb">恋爱次数</div><div class="vl">${s.loveCount}</div></div>
      <div class="end-stat"><div class="lb">摸鱼次数</div><div class="vl">${s.fishCount}</div></div>
    `;
  }
});

window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('startScreen').classList.add('active');
});
