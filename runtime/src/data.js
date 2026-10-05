// Functional links and drill choices are teaching inferences, not a Flare EMG ranking.
const references = {
  vincanity:{label:'VincaniTV · 地面 Flare 入门',url:'https://www.youtube.com/watch?v=Sz5rd22PCSI',kind:'coach'},
  chiki:{label:'Chiki Skills · 分步 Flare 教学',url:'https://www.youtube.com/watch?v=2fFBaFV9Ugk',kind:'coach'},
  support:{label:'Pontillo 等 · 上肢承重原始研究',url:'https://pubmed.ncbi.nlm.nih.gov/21522206/',kind:'study'},
  timing:{label:'Prassas 等 · 地面与鞍马 Flare 时序',url:'https://ojs.ub.uni-konstanz.de/cpa/article/view/3328/3128',kind:'study'},
  upper:{label:'OpenStax · 肩带、上肢与手部解剖',url:'https://openstax.org/books/anatomy-and-physiology-2e/pages/11-5-muscles-of-the-pectoral-girdle-and-upper-limbs',kind:'anatomy'},
  abdominal:{label:'OpenStax · 腹壁与躯干解剖',url:'https://openstax.org/books/anatomy-and-physiology-2e/pages/11-4-axial-muscles-of-the-abdominal-wall-and-thorax',kind:'anatomy'},
  back:{label:'OpenStax · 背部与脊柱肌解剖',url:'https://openstax.org/books/anatomy-and-physiology-2e/pages/11-3-axial-muscles-of-the-head-neck-and-back',kind:'anatomy'},
  lower:{label:'OpenStax · 髋、腿与足部解剖',url:'https://openstax.org/books/anatomy-and-physiology-2e/pages/11-6-appendicular-muscles-of-the-pelvic-girdle-and-lower-limbs',kind:'anatomy'}
};
const sources = (...ids) => ids.map(id=>({...references[id]}));
export const researchSources = Object.values(references).map(reference=>({...reference}));

export const muscleGroups = [
  {id:'shoulders',name:'肩部稳定',english:'Shoulder complex',anatomy:'三角肌 · 肩袖',category:'支撑与稳定',icon:'shield',assetGroups:['deltoids','rotator-cuff'],view:'front',
    description:'三角肌调整上臂位置，肩袖帮助稳定肱骨。Flare 的承重方向不断改变，肩部要配合移重与回撑，为摆腿留下空间。',
    roles:['三角肌参与肩关节屈伸、外展与旋转。','肩袖配合控制肱骨与肩胛之间的位置。','单手承重与后撑转换需要在受控范围内完成。'],phases:[0,1,2,3],exercises:['supportShift','rearSupport','scapPush'],
    addresses:'移到一侧就塌肩，或后方回撑接不住身体。',keyCue:'先把重量移向支撑手，再让另一手变轻；肩部主动承重。',sources:sources('upper','support','vincanity'),
    note:'肩袖位于深层。使用“聚焦此肌群”可移开遮挡，观察它与肩胛骨的关系。',short:'控制肩关节，接住每次换手。'},
  {id:'scapular',name:'肩胛控制',english:'Scapular stabilizers',anatomy:'前锯肌 · 斜方肌（含下束）',category:'主动推地',icon:'move-up',assetGroups:['serratus','scapular'],view:'back',
    description:'前锯肌与斜方肌协同控制肩胛。前锯肌参与前伸与上回旋，下斜方肌参与肩胛位置控制；支撑时需要主动推地并随手臂方向调整。',
    roles:['前锯肌帮助肩胛贴着胸廓运动。','斜方肌不同束协同调整肩胛；下束不是全程强压肩膀的指令。','肘部保持伸直时，肩带仍要主动维持身体高度。'],phases:[0,1,2,3],exercises:['scapPush','supportShift','rearSupport'],
    addresses:'手肘还直着，胸廓和髋却一起往地面掉。',keyCue:'把地面推远，维持支撑空间，让肩胛随动作调整。',sources:sources('upper','support'),
    note:'前锯肌在胸廓侧面。背面更容易观察斜方肌，侧面可观察前锯肌；热点还保留源资产中的其他肩胛控制肌。',short:'主动推地，维持肩带支撑空间。'},
  {id:'arms',name:'手臂与手腕',english:'Elbow & wrist support',anatomy:'肱三头肌 · 前臂屈伸肌 · 手部肌',category:'直臂与掌根承重',icon:'hand',assetGroups:['triceps','forearms','hands'],view:'front',
    description:'肱三头肌参与伸肘，前臂与手部肌群控制腕和手指。先建立掌根承重耐受，再练左右卸载与回撑，避免用突然拍地代替移重。',
    roles:['肱三头肌帮助保持受控的伸肘支撑。','前臂屈伸肌与手部肌参与腕部和手掌控制。','手指朝向需配合落手阶段、旋向与肩腕活动范围。'],phases:[0,1,2,3],exercises:['wristLoad','supportShift','rearSupport'],
    addresses:'掌根一承重就不舒服，或换手时肘腕失去控制。',keyCue:'手掌铺开，落手受控；手指方向不强制统一成 90°。',sources:sources('upper','support','vincanity'),
    note:'热点把肱三头肌与腕部控制肌合为功能区；点选模型仍保留单块肌肉名称。',short:'伸肘、控腕，平稳落手与卸载。'},
  {id:'chest',name:'胸部协同',english:'Pectoral muscles',anatomy:'胸大肌 · 胸小肌',category:'上肢方向控制',icon:'move-horizontal',assetGroups:['pectorals'],view:'front',
    description:'胸大肌参与肩关节屈曲、内收与内旋，胸小肌影响肩胛位置。它们与肩带协同工作，不能把“胸肌更强”直接等同于更会 Flare。',
    roles:['胸大肌协同控制上臂相对胸廓的方向。','胸小肌与肩胛位置相关，作用随支撑姿态改变。','前撑移重与转体需要胸部和肩带共同配合。'],phases:[0,1,3],exercises:['supportShift','trunkControl'],
    addresses:'前撑转向侧撑时，上臂与胸廓的方向配合不好。',keyCue:'练支撑方向的转换，把胸部与肩胛、躯干一起控制。',sources:sources('upper','support'),
    note:'胸肌的作用随手臂位置改变；不能单凭一个支撑姿态判断整体用力大小。',short:'配合肩带，控制上臂方向。'},
  {id:'core',name:'躯干控制',english:'Trunk control',anatomy:'腹外斜肌 · 竖脊肌群',category:'转髋与移重',icon:'rotate-3d',assetGroups:['obliques','erectors'],view:'front',
    description:'腹斜肌与竖脊肌群参与躯干旋转、侧倾和伸屈控制。Flare 中肩与骨盆要随摆腿协调移动；不能只锁死躯干，也不能只靠塌腰抬脚。',
    roles:['腹内外斜肌参与旋转与侧向控制。','竖脊肌群控制脊柱伸展及躯干位置。','腹直肌、腹横肌等共同参与控制，虽未全部显示为网格。'],phases:[0,1,2,3],exercises:['trunkControl','compression','flareSegments'],
    addresses:'腿在绕，肩与骨盆却卡住，或一换手就失去髋高。',keyCue:'让肩与骨盆随摆腿配合，先慢速转髋，再连接换手。',sources:sources('abdominal','back','vincanity','timing'),
    note:'当前资产缺少腹直肌、腹内斜肌、腹横肌、背阔肌和腰方肌独立网格；它们仍参与躯干或肩部控制。',short:'协调肩与骨盆，把摆腿接成旋回。'},
  {id:'hipFlexors',name:'抬腿与压缩',english:'Hip flexors',anatomy:'髂腰肌 · 股直肌',category:'直腿过前方',icon:'arrow-up-right',assetGroups:['hip-flexors'],extraMatch:/rectus femoris/i,view:'front',
    description:'髂腰肌参与主动屈髋，股直肌协助屈髋并伸膝，其余股四头肌帮助伸膝。直腿通过身体前方，需要抬腿、伸膝与躯干压缩配合。',
    roles:['髂腰肌带动腿向前抬起。','股直肌跨髋和膝；股四头肌协助保持长腿形态。','主动抬腿高度与被动开腿柔韧性是不同能力。'],phases:[1,2,3],exercises:['compression','rearSupport','flareSegments'],
    addresses:'前方过腿时脚擦地，或必须屈膝缩腿才能通过。',keyCue:'膝保持受控伸展，从髋抬起整条腿，练主动压缩。',sources:sources('lower','abdominal','chiki'),
    note:'髂腰肌位于骨盆深处。开启聚焦后，可观察它从腰椎、髂骨到股骨的走向。',short:'主动抬起长腿，留出过腿空间。'},
  {id:'glutes',name:'臀部与开髋',english:'Gluteals & hip abductors',anatomy:'臀大肌 · 臀中肌 · 臀小肌',category:'开腿与后方扫腿',icon:'expand',assetGroups:['glutes','hip-rotators'],view:'back',
    description:'臀肌参与髋伸展、外展及骨盆控制，髋旋转肌配合扫腿方向。开髋要能主动保持和调整，不以更大开度或更高踢腿代替换手时机。',
    roles:['臀大肌参与髋伸展与后方摆腿。','臀中肌、臀小肌参与髋外展及骨盆控制。','髋旋转配合膝和脚尖方向，避免只拧脚来制造开髋。'],phases:[0,1,3],exercises:['hipControl','trunkControl','flareSegments'],
    addresses:'腿一离地就合起来，后方扫腿时骨盆跟不上。',keyCue:'从髋主动打开长腿，膝与脚尖随髋协调转向。',sources:sources('lower','vincanity','chiki'),
    note:'热点包含臀肌与部分髋旋转肌，属于功能分组；各块肌肉可直接点选。',short:'主动开髋，控制后方扫腿。'},
  {id:'adductors',name:'大腿内侧与后侧',english:'Adductors & hamstrings',anatomy:'髋内收肌群 · 腘绳肌群',category:'开合与长腿控制',icon:'move-diagonal-2',assetGroups:['adductors','hamstrings'],view:'back',
    description:'内收肌控制腿向中线回收，腘绳肌参与髋伸与膝屈控制。开腿、回收与直腿扫圈需要主动控制和可用活动范围，不只是被动拉得更开。',
    roles:['内收肌控制开度变化与向中线回收。','腘绳肌属于后侧肌群，参与髋伸与膝屈。','膝伸展、髋屈曲与开髋要在可控范围内配合。'],phases:[0,1,2,3],exercises:['hipControl','compression','flareSegments'],
    addresses:'开得很宽却控制不住扫腿，或回收时屈膝、掉髋。',keyCue:'先控制小范围开合和长腿扫弧，再扩大开度。',sources:sources('lower','chiki'),
    note:'内侧与后侧分别保留解剖名称；腘绳肌不属于髋内收肌。',short:'控制开合，把长腿扫弧连成圈。'}
];

export const phases = [
  {id:'front',time:4,name:'前双手支撑',english:'FRONT SUPPORT',short:'推地 · 建立支点',support:'双手', focus:['shoulders','scapular','arms','core'],description:'双手建立支点，分开的双腿继续绕行，肩与骨盆配合摆腿转移重量。',cue:'主动推地，保持肘部受控。让肩与骨盆随摆腿移动。'},
  {id:'sideA',time:2,name:'第一侧单手',english:'FIRST TRANSFER',short:'移重 · 腾出空间',support:'一侧手',focus:['shoulders','scapular','arms','core','hipFlexors'],description:'重量转向第一侧支撑手，另一只手离地，为摆动腿腾出通过的空间。',cue:'先完成移重，再卸载另一只手。躯干控制侧倾，腿继续绕行。'},
  {id:'rear',time:0,name:'后双手支撑',english:'REAR SUPPORT',short:'回撑 · 保持髋高',support:'双手',focus:['shoulders','arms','core','hipFlexors','glutes'],description:'双手重新接地，腿摆到身体前方，身体短暂通过后支撑，再准备下一次移重。',cue:'受控回撑，让髋部保持离地空间。肩关节后伸应在舒适范围内。'},
  {id:'sideB',time:6,name:'第二侧单手',english:'SECOND TRANSFER',short:'接续 · 完成旋回',support:'另一侧手',focus:['shoulders','scapular','arms','core','glutes','adductors'],description:'重量转向另一侧支撑手，身体与双腿接回双手支撑，让这一圈接入下一圈。',cue:'接续摆腿与换手。先掌握可控单圈，再连接连续旋回。'}
];

export const exercises = [
  {id:'wristLoad',name:'掌根承重 · 前侧移重',english:'Quadruped palm loading',type:'掌根耐受',difficulty:'基础',icon:'hand',groups:['arms','shoulders'],
    description:'用双膝分担重量，在实际落手方向附近练小幅移重，准备 Flare 的掌根与手腕承重。',addresses:'掌根无法舒适承重，落手时腕部失控。',keyCue:'先小幅、低负荷移重，手指方向随落手阶段调整。',
    steps:['双手、双膝着地，手掌与手指铺开；先选择舒适的手指朝向。','膝盖留地，肩部缓慢向前、向左和向右移重，保持肘腕受控。','需要练侧向或外后向落手时，先卸载、重新摆手，再用小幅度承重；不要在压着重量时拧腕。'],
    progression:'前后与双侧小幅移重都舒适，再逐渐增加肩部位移和掌上重量。',cue:'出现掌根或腕痛就停止并调整。朝前、朝侧或外后不是统一的 90° 规则。',sources:sources('upper','support','vincanity')},
  {id:'scapPush',name:'直臂推地 · 肩胛短停',english:'Straight-arm scapular push',type:'主动推地',difficulty:'基础',icon:'move-up',groups:['scapular','shoulders','arms'],
    description:'保持肘部伸直，通过肩胛前伸推开地面，熟悉维持身体支撑空间的感觉。',addresses:'肘还直着，但胸廓和髋往地面掉。',keyCue:'把地面推远，保持肘直，让肩胛贴着胸廓运动。',
    steps:['从双膝着地的前撑开始，手掌承重，肘部伸直但受控。','主动推开地面，使肩胛沿胸廓前伸；在推起的位置短暂停住。','缓慢返回小幅度，再推起；避免屈肘代替肩胛运动，也不用极度弓背或塌腰增加幅度。'],
    progression:'能重复主动推地且躯干不突然塌陷，再伸长腿进入脚辅助前撑和移重。',cue:'前锯肌与斜方肌协同控制肩胛；“下斜方参与”不等于全程把肩压到最低。',sources:sources('upper','support')},
  {id:'supportShift',name:'左右移重 · 轻手触点',english:'Weight shift and hand unloading',type:'单手移重',difficulty:'基础 → 进阶',icon:'move-horizontal',groups:['shoulders','scapular','arms','chest','core'],
    description:'双脚或双膝留地，先把重量交给一侧手，再让另一手离地、轻触原落点，练换手顺序。',addresses:'抬手太早、支撑侧塌肩，或回撑靠猛拍地面。',keyCue:'先移重，再卸载；支撑手仍主动推地。',
    steps:['双脚或双膝保留地面支持，双手前撑，预先确定另一手的轻触位置。','肩与骨盆缓慢向支撑侧移动；另一手先变轻，再短暂离地，承重肘保持受控伸展。','空手轻触原落点并受控回撑，然后换边；比较两侧是否都能保留髋部空间。'],
    progression:'两侧卸载、触点与回撑都平稳，再接脚辅助转髋；不要先延长单手悬停来替代转换练习。',cue:'不同阶段的肩与掌相对位置会改变，不把“肩永远垂直在掌上”写成统一标准。',sources:sources('support','upper','vincanity','chiki')},
  {id:'rearSupport',name:'后撑抬腿 · 换手回撑',english:'Rear support leg lift and replant',type:'后撑过腿',difficulty:'基础 → 进阶',icon:'corner-up-left',groups:['shoulders','scapular','arms','hipFlexors','core','glutes'],
    description:'双脚分担重量，从屈膝后撑练单腿伸长、抬起与受控回撑，解决前方过腿时掉髋。',addresses:'腿到前方就落地，或后方回撑接不住重量。',keyCue:'掌根受控承重，先推起留空间，再抬起长腿。',
    steps:['坐姿屈膝、双脚着地；双手放在身后舒适位置，手指方向配合肩腕范围，不强拧到同一角度。','小幅抬髋，先伸长一条腿并尝试主动抬起；另一脚留地帮助承重，再换腿。','接着用脚辅助练“踢起—换腿—落脚”，配合移重、离手与回撑；保持肩关节后伸舒适，不急着两脚同时悬空。'],
    progression:'双侧伸腿、抬腿和回撑都受控，再把它接到半圈扫腿中；不要求先把髋抬到固定高度。',cue:'回撑的目标是接住移动的身体，手不要离身体太远，也不要突然拍地。',sources:sources('upper','lower','vincanity','chiki')},
  {id:'trunkControl',name:'脚辅助侧撑转髋',english:'Foot-assisted support rotation',type:'肩髋协调',difficulty:'基础 → 进阶',icon:'rotate-3d',groups:['core','shoulders','scapular','arms','chest','glutes'],
    description:'保留脚部支持，慢速练前撑、侧撑、前撑的转髋，直接练肩与骨盆在移重中的配合。',addresses:'腿在扫，肩与骨盆卡住，或靠塌腰、甩身体换手。',keyCue:'脚先帮忙，肩与骨盆一起转，支撑手持续推地。',
    steps:['双脚留地建立前撑；需要减轻负荷时缩短腿的杠杆，从较小转角开始。','向一手移重，另一手变轻后抬起；脚随身体调整，胸廓与骨盆慢慢转向侧撑。','保持可控髋高，再把空手回撑、身体转回前撑；左右都练，正常呼吸。'],
    progression:'双侧转入、回撑和转回都顺畅，再与分段扫腿连接；静态侧撑能坚持更久不是唯一进阶条件。',cue:'躯干肌群控制相对运动，练习不是把身体全程锁死。',sources:sources('abdominal','back','upper','vincanity')},
  {id:'compression',name:'坐姿直腿压缩抬腿',english:'Seated straddle compression lift',type:'主动屈髋',difficulty:'基础 → 进阶',icon:'arrow-up-right',groups:['hipFlexors','core','adductors'],
    description:'坐姿舒适开腿，在膝部伸展下主动抬起整条腿，练前方过腿需要的屈髋与压缩能力。',addresses:'能被动开腿，却无法主动抬腿；前方扫腿总是屈膝、擦地。',keyCue:'从髋抬起长腿，膝保持受控伸展，先练小幅度。',
    steps:['舒适开腿坐姿，手放在身侧或腿旁帮助支撑，先选择能控制的身体前倾程度。','先单腿小幅离地，膝受控伸展；缓慢落下并换腿，避免用猛后仰甩起腿。','单腿稳定后再尝试双腿小幅抬起；开度与手的位置逐步调整，不用强压更宽来凑高度。'],
    progression:'能平稳抬起、放下两侧直腿，再练双腿或连接后撑抬腿；使用动作质量而非固定次数决定进阶。',cue:'绷脚可用于体操线条练习，breaking 也可用较放松的中立踝；抬腿和伸膝控制先做清楚。',sources:sources('lower','abdominal','chiki')},
  {id:'hipControl',name:'主动开腿 · 分段扫腿',english:'Active straddle and sweep segments',type:'开髋与长腿路径',difficulty:'基础 → 进阶',icon:'expand',groups:['glutes','adductors','hipFlexors','core'],
    description:'从可控的主动开合开始，再用手和一只脚辅助慢速扫弧，把活动范围用到 Flare 的腿部路径中。',addresses:'开得宽却维持不住，或只拧脚尖、屈膝来绕过手臂。',keyCue:'腿从髋打开，膝和脚尖协调转向，保持长腿扫弧。',
    steps:['坐姿或侧卧，先在舒适幅度做主动开腿、回收；上侧腿外展与下侧腿内收可作为降阶练习。','转到手和一只脚辅助的低支撑，另一腿尽量伸长，慢速扫一个小弧；双侧都练，允许辅助脚接地。','逐步把前侧、侧后的小弧接起来；髋部带动膝与脚尖方向，避免脚卡地时只扭膝或踝。'],
    progression:'开合与双侧扫弧都能控制，再扩大弧度、减少脚部帮助；不把某个开腿角度当作人人必须达到的标准。',cue:'扫腿追求路径和长度。体操绷脚与 breaking 较放松的脚型是风格选择，不能用脚尖代替开髋。',sources:sources('lower','chiki','vincanity')},
  {id:'flareSegments',name:'分段半圈 · 接入下一圈',english:'Assisted flare segments to circles',type:'专项衔接',difficulty:'进阶',icon:'orbit',groups:muscleGroups.map(group=>group.id),
    description:'用脚保留帮助，把移重、离手、扫腿和回撑按旋向接起来；从半圈练到可控单圈，再解决接圈时机。',addresses:'第一圈能到后撑，却无法回前撑或接第二圈。',keyCue:'腿继续绕行，手为腿腾空间，回撑接住身体再移重。',
    steps:['选择一个旋向，先用脚帮助慢速练前撑→单手侧撑→后撑；在容易失去空间的位置单独练回撑。','再练后撑→另一侧单手→前撑，配合长腿扫弧；停下来核对移重和落手顺序，而不是猛踢加速。','前、后半圈都受控后连成单圈，再从回到前撑的位置尝试接下一圈；必要时请教练观察实际落手与髋位置。'],
    progression:'单圈的掌根承重、髋部空间、两侧卸载与回撑都受控后再接圈；没有固定训练周数或次数保证。',cue:'教练可以分段讲解，完整动作仍需连续移重。展示中的 9 个关键姿势采用慢放节奏，可按自己的动作标准微调。',sources:sources('vincanity','chiki','timing','support')}
];

export const groupById = Object.fromEntries(muscleGroups.map(g=>[g.id,g]));
export const exerciseById = Object.fromEntries(exercises.map(e=>[e.id,e]));
