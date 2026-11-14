// 근육·신경 이외 구조(뼈·장기·혈관·뇌)의 한국어 용어와 목록 그룹 이름.
// 값은 [새 용어(대한해부학회식 우리말), 옛 용어(한자어)].

const ORD = ['', '첫째', '둘째', '셋째', '넷째', '다섯째', '여섯째', '일곱째', '여덟째', '아홉째', '열째', '열한째', '열두째'];
const ORD_EN = { first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6, seventh: 7, eighth: 8, ninth: 9, tenth: 10, eleventh: 11, twelfth: 12 };
const FINGER = {
  'thumb': ['엄지', '무지'], 'index finger': ['집게손가락', '시지'], 'middle finger': ['가운데손가락', '중지'],
  'ring finger': ['반지손가락', '환지'], 'little finger': ['새끼손가락', '소지'],
  'big toe (hallux)': ['엄지발가락', '무지'], 'second toe': ['둘째발가락', '제2지'], 'third toe': ['셋째발가락', '제3지'],
  'fourth toe': ['넷째발가락', '제4지'], 'fifth toe': ['새끼발가락', '제5지'],
};
const PHAL = { Proximal: ['첫마디뼈', '기절골'], Middle: ['중간마디뼈', '중절골'], Distal: ['끝마디뼈', '말절골'] };
const VERT = { C: ['목뼈', '경추'], T: ['등뼈', '흉추'], L: ['허리뼈', '요추'] };
const TOOTH = {
  'central incisor': ['안쪽앞니', '중절치'], 'lateral incisor': ['가쪽앞니', '측절치'], 'canine': ['송곳니', '견치'],
  'first premolar': ['첫째 작은어금니', '제1소구치'], 'second premolar': ['둘째 작은어금니', '제2소구치'],
  'first molar': ['첫째 큰어금니', '제1대구치'], 'second molar': ['둘째 큰어금니', '제2대구치'],
};

const GENERAL = {
  // 머리뼈
  'Ethmoid bone': ['벌집뼈', '사골'], 'Frontal bone': ['이마뼈', '전두골'], 'Inferior nasal concha': ['아래코선반', '하비갑개'],
  'Lacrimal bone': ['눈물뼈', '누골'], 'Mandible': ['아래턱뼈', '하악골'], 'Maxilla': ['위턱뼈', '상악골'], 'Nasal bone': ['코뼈', '비골'],
  'Occipital bone': ['뒤통수뼈', '후두골'], 'Palatine bone': ['입천장뼈', '구개골'], 'Parietal bone': ['마루뼈', '두정골'],
  'Sphenoid bone': ['나비뼈', '접형골'], 'Temporal bone': ['관자뼈', '측두골'], 'Vomer': ['보습뼈', '서골'], 'Zygomatic bone': ['광대뼈', '관골'],
  'Hyoid bone': ['목뿔뼈', '설골'],
  // 척주·가슴우리
  'Atlas (C1)': ['고리뼈 (C1)', '환추'], 'Axis (C2)': ['중쇠뼈 (C2)', '축추'], 'Sacrum': ['엉치뼈', '천골'],
  'Body of the sternum': ['복장뼈몸통', '흉골체'], 'Manubrium of the sternum': ['복장뼈자루', '흉골병'], 'Xiphoid process': ['칼돌기', '검상돌기'],
  'Costal cartilages (8th–10th)': ['갈비연골 (8–10)', '늑연골 (8–10)'],
  // 팔다리뼈
  'Clavicle': ['빗장뼈', '쇄골'], 'Humerus': ['위팔뼈', '상완골'], 'Radius': ['노뼈', '요골'], 'Scapula (shoulder blade)': ['어깨뼈', '견갑골'], 'Ulna': ['자뼈', '척골'],
  'Capitate': ['알머리뼈', '유두골'], 'Hamate': ['갈고리뼈', '유구골'], 'Lunate': ['반달뼈', '월상골'], 'Pisiform': ['콩알뼈', '두상골'],
  'Scaphoid': ['손배뼈', '주상골'], 'Trapezium': ['큰마름뼈', '대능형골'], 'Trapezoid': ['작은마름뼈', '소능형골'], 'Triquetrum': ['세모뼈', '삼각골'],
  'Hip bone': ['볼기뼈', '관골'], 'Femur': ['넙다리뼈', '대퇴골'], 'Fibula': ['종아리뼈', '비골'], 'Patella': ['무릎뼈', '슬개골'], 'Tibia': ['정강뼈', '경골'],
  'Calcaneus': ['발꿈치뼈', '종골'], 'Cuboid': ['입방뼈', '입방골'], 'Intermediate cuneiform': ['중간쐐기뼈', '중간설상골'],
  'Lateral cuneiform': ['가쪽쐐기뼈', '외측설상골'], 'Medial cuneiform': ['안쪽쐐기뼈', '내측설상골'],
  'Navicular (tarsal scaphoid)': ['발배뼈', '주상골'], 'Talus (astragalus)': ['목말뼈', '거골'], 'Sesamoid bones of the foot': ['발 종자뼈', '종자골'],
  // 피부
  'Skin': ['피부', '피부'], 'Eyebrows': ['눈썹', '미모'], 'Scalp hair': ['머리털', '두발'], 'Pubic hair': ['거웃', '음모'],
  // 심장·혈관
  'Heart (wall)': ['심장벽', '심장벽'], 'Mitral (bicuspid) valve': ['승모판막', '이첨판'], 'Tricuspid valve': ['삼첨판막', '삼첨판'], 'Pulmonary valve': ['폐동맥판막', '폐동맥판'],
  'Anterior papillary muscle of the right ventricle': ['오른심실 앞유두근', '우심실 전유두근'],
  'Posterior papillary muscle of the right ventricle': ['오른심실 뒤유두근', '우심실 후유두근'],
  'Septal papillary muscle of the right ventricle': ['오른심실 중격유두근', '우심실 중격유두근'],
  'Papillary muscle of the left ventricle': ['왼심실 유두근', '좌심실 유두근'],
  'Posterior papillary muscle of the left ventricle': ['왼심실 뒤유두근', '좌심실 후유두근'],
  'Left coronary artery trunk': ['왼심장동맥 줄기', '좌관상동맥 주간'], 'Right coronary artery': ['오른심장동맥', '우관상동맥'],
  'Anterior interventricular branch (left anterior descending)': ['앞심실사이가지', '전하행지 (LAD)'],
  'Circumflex branch of the left coronary artery': ['휘돌이가지', '회선지'], 'Right marginal branch': ['오른모서리가지', '우연지'],
  'Posterior interventricular branch (posterior descending)': ['뒤심실사이가지', '후하행지'], 'Right posterolateral branch': ['오른뒤가쪽가지', '우후측지'],
  'Septal branches of the left coronary artery': ['왼심장동맥 사이막가지', '좌관상동맥 중격지'],
  'Septal branches of the right coronary artery': ['오른심장동맥 사이막가지', '우관상동맥 중격지'],
  'Coronary sinus': ['심장정맥굴', '관상정맥동'], 'Great cardiac vein': ['큰심장정맥', '대심정맥'], 'Middle cardiac vein': ['중간심장정맥', '중심정맥'],
  'Anterior cardiac veins': ['앞심장정맥', '전심정맥'], 'Posterior veins of the left ventricle': ['왼심실뒤정맥', '좌심실후정맥'],
  'Aortic arch': ['대동맥활', '대동맥궁'], 'Ascending aorta': ['오름대동맥', '상행대동맥'], 'Descending aorta': ['내림대동맥', '하행대동맥'],
  'Brachiocephalic trunk': ['팔머리동맥', '완두동맥'], 'Common carotid artery': ['온목동맥', '총경동맥'], 'Subclavian artery': ['빗장밑동맥', '쇄골하동맥'],
  'Pulmonary arteries (pulmonary trunk)': ['폐동맥 (폐동맥줄기)', '폐동맥 (폐동맥간)'],
  'Celiac trunk': ['복강동맥', '복강동맥'], 'Common hepatic artery': ['온간동맥', '총간동맥'], 'Left gastric artery': ['왼위동맥', '좌위동맥'],
  'Splenic artery': ['지라동맥', '비장동맥'], 'Superior mesenteric artery': ['위창자간막동맥', '상장간막동맥'],
  'Inferior mesenteric artery': ['아래창자간막동맥', '하장간막동맥'], 'Renal artery': ['콩팥동맥', '신동맥'],
  'Common iliac artery': ['온엉덩동맥', '총장골동맥'], 'External iliac artery': ['바깥엉덩동맥', '외장골동맥'], 'Internal iliac artery': ['속엉덩동맥', '내장골동맥'],
  'Superior vena cava': ['위대정맥', '상대정맥'], 'Inferior vena cava': ['아래대정맥', '하대정맥'], 'Brachiocephalic vein': ['팔머리정맥', '완두정맥'],
  'Internal jugular vein': ['속목정맥', '내경정맥'], 'Subclavian vein': ['빗장밑정맥', '쇄골하정맥'], 'Pulmonary veins': ['폐정맥', '폐정맥'],
  'Renal vein': ['콩팥정맥', '신정맥'], 'Common iliac vein': ['온엉덩정맥', '총장골정맥'], 'External iliac vein': ['바깥엉덩정맥', '외장골정맥'],
  'Internal iliac vein': ['속엉덩정맥', '내장골정맥'], 'Splenic vein': ['지라정맥', '비장정맥'], 'Superior mesenteric vein': ['위창자간막정맥', '상장간막정맥'],
  // 호흡·소화·비뇨·생식·내분비·림프
  'Superior lobe of the right lung': ['오른허파 위엽', '우폐 상엽'], 'Middle lobe of the right lung': ['오른허파 중간엽', '우폐 중엽'],
  'Inferior lobe of the right lung': ['오른허파 아래엽', '우폐 하엽'], 'Superior lobe of the left lung': ['왼허파 위엽', '좌폐 상엽'],
  'Inferior lobe of the left lung': ['왼허파 아래엽', '좌폐 하엽'],
  'Trachea': ['기관', '기관'], 'Bronchi': ['기관지', '기관지'], 'Nasal cartilages': ['코연골', '비연골'], 'Thyroid cartilage': ['방패연골', '갑상연골'],
  'Oesophagus': ['식도', '식도'], 'Stomach': ['위', '위'], 'Duodenum': ['샘창자', '십이지장'], 'Jejunum': ['빈창자', '공장'], 'Ileum': ['돌창자', '회장'],
  'Colon': ['잘록창자', '결장'], 'Rectum': ['곧창자', '직장'], 'Vermiform appendix': ['막창자꼬리', '충수'],
  'Free taenia of the colon': ['자유띠', '자유결장띠'], 'Mesocolic taenia': ['간막띠', '결장간막띠'], 'Omental taenia': ['그물막띠', '대망결장띠'],
  'Liver': ['간', '간'], 'Gallbladder': ['쓸개', '담낭'], 'Pancreas': ['이자', '췌장'], 'Pancreatic duct (of Wirsung)': ['이자관', '췌관'],
  'Lips': ['입술', '구순'], 'Upper gingiva': ['위잇몸', '상악 치은'], 'Lower gingiva': ['아래잇몸', '하악 치은'],
  'Kidney': ['콩팥', '신장'], 'Ureter': ['요관', '수뇨관'], 'Urinary bladder': ['방광', '방광'], 'Urethra': ['요도', '요도'],
  'Testis': ['고환', '고환'], 'Epididymis': ['부고환', '부고환'], 'Ductus (vas) deferens': ['정관', '정관'], 'Seminal vesicle': ['정낭', '정낭'],
  'Prostate': ['전립샘', '전립선'], 'Corpora cavernosa of the penis': ['음경해면체', '음경해면체'],
  'Corpus spongiosum of the penis': ['요도해면체', '요도해면체'], 'Glans penis': ['음경귀두', '귀두'],
  'Adrenal gland': ['부신', '부신'], 'Pineal gland (epiphysis)': ['솔방울샘', '송과선'], 'Pituitary gland (hypophysis)': ['뇌하수체', '뇌하수체'],
  'Spleen': ['지라', '비장'], 'Lobe of the thymus': ['가슴샘엽', '흉선엽'],
  // 뇌·감각기
  'Cerebellum': ['소뇌', '소뇌'], 'Pons': ['다리뇌', '교뇌'], 'Midbrain': ['중간뇌', '중뇌'], 'Medulla oblongata': ['숨뇌', '연수'],
  'Cerebral peduncle': ['대뇌다리', '대뇌각'], 'Superior colliculus': ['위둔덕', '상구'], 'Inferior colliculus': ['아래둔덕', '하구'],
  'Thalamus': ['시상', '시상'], 'Hypothalamus': ['시상하부', '시상하부'], 'Hippocampus': ['해마', '해마'], 'Amygdala (amygdaloid body)': ['편도체', '편도체'],
  'Caudate nucleus': ['꼬리핵', '미상핵'], 'Putamen': ['조가비핵', '피각'], 'Globus pallidus': ['창백핵', '담창구'],
  'Corpus callosum': ['뇌들보', '뇌량'], 'Fornix': ['뇌활', '뇌궁'], 'Septum pellucidum': ['투명사이막', '투명중격'],
  'Lateral ventricle': ['가쪽뇌실', '측뇌실'], 'Third ventricle': ['셋째뇌실', '제3뇌실'], 'Fourth ventricle': ['넷째뇌실', '제4뇌실'],
  'Cerebral aqueduct (of Sylvius)': ['중간뇌수도관', '중뇌수도'], 'Insula': ['섬엽', '도엽'], 'Occipital lobe': ['뒤통수엽', '후두엽'],
  'Precentral gyrus': ['중심앞이랑', '중심전회'], 'Postcentral gyrus': ['중심뒤이랑', '중심후회'], 'Superior frontal gyrus': ['위이마이랑', '상전두회'],
  'Middle frontal gyrus': ['중간이마이랑', '중전두회'], 'Cingulate gyrus': ['띠이랑', '대상회'],
  'White matter of the cerebral hemispheres': ['대뇌반구 백색질', '대뇌백질'],
  'Optic nerve (II)': ['시각신경', '시신경'], 'Optic chiasm': ['시각교차', '시신경교차'], 'Optic tract': ['시각로', '시삭'],
  'Eyeballs': ['안구', '안구'], 'Ears (auricles)': ['귓바퀴', '이개'],
};

const ord = w => ORD_EN[w.toLowerCase()];

/** 근육·신경 이외 구조의 [새 용어, 옛 용어] (없으면 null) */
export function koGeneral(n) {
  if (GENERAL[n]) return GENERAL[n];
  let m;
  if ((m = n.match(/^([CTL])(\d+) vertebra$/))) return [`${VERT[m[1]][0]} ${m[2]} (${m[1]}${m[2]})`, `${VERT[m[1]][1]} ${m[2]}`];
  if ((m = n.match(/^Intervertebral disc (.+)$/))) return [`척추사이원반 ${m[1]}`, `추간판 ${m[1]}`];
  if ((m = n.match(/^(\w+) rib$/)) && ord(m[1])) return [`${ORD[ord(m[1])]} 갈비뼈`, `제${ord(m[1])}늑골`];
  if ((m = n.match(/^(\w+) costal cartilage$/)) && ord(m[1])) return [`${ORD[ord(m[1])]} 갈비연골`, `제${ord(m[1])}늑연골`];
  if ((m = n.match(/^(\w+) metacarpal$/)) && ord(m[1])) return [`${ORD[ord(m[1])]} 손허리뼈`, `제${ord(m[1])}중수골`];
  if ((m = n.match(/^(\w+) metatarsal$/)) && ord(m[1])) return [`${ORD[ord(m[1])]} 발허리뼈`, `제${ord(m[1])}중족골`];
  if ((m = n.match(/^(Proximal|Middle|Distal) phalanx of the (.+)$/)) && FINGER[m[2]]) {
    const f = FINGER[m[2]], p = PHAL[m[1]];
    return [`${f[0]} ${p[0]}`, `${f[1]} ${p[1]}`];
  }
  if ((m = n.match(/^(Upper|Lower) (.+)$/)) && TOOTH[m[2]]) {
    const t = TOOTH[m[2]], up = m[1] === 'Upper';
    return [`${up ? '위' : '아래'} ${t[0]}`, `${up ? '상악' : '하악'} ${t[1]}`];
  }
  return null;
}

// 목록의 그룹 이름
export const GROUPS_KO = {
  'Skull': '머리뼈', 'Neck': '목', 'Vertebral column': '척주', 'Thoracic cage': '가슴우리', 'Pelvis': '골반뼈',
  'Upper limb': '팔뼈', 'Hand: carpus': '손목뼈', 'Hand: metacarpus': '손허리뼈', 'Hand: phalanges': '손가락뼈',
  'Lower limb': '다리뼈', 'Foot: tarsus': '발목뼈', 'Foot: metatarsus': '발허리뼈', 'Foot: phalanges': '발가락뼈',
  'Skin': '피부', 'Skin appendages': '털',
  'Heart': '심장', 'Heart: coronary arteries': '심장동맥', 'Heart: cardiac veins': '심장정맥',
  'Major arteries': '큰 동맥', 'Major arteries (abdominal)': '배 동맥', 'Major arteries (pelvis)': '골반 동맥',
  'Major veins': '큰 정맥', 'Major veins (pelvis)': '골반 정맥', 'Major veins (portal system)': '문맥계 정맥',
  'Lungs': '허파', 'Airways': '기도', 'Digestive tract': '소화관', 'Accessory glands': '소화샘', 'Mouth and teeth': '입·치아',
  'Urinary system': '비뇨기', 'Male reproductive system': '남성 생식기', 'Endocrine glands': '내분비샘', 'Lymphoid organs': '림프기관',
  'Brain: cerebral cortex': '대뇌겉질', 'Brain: deep nuclei': '대뇌 속 핵', 'Brain: white matter': '백색질',
  'Brain: brainstem and cerebellum': '뇌줄기·소뇌', 'Brain: ventricular system': '뇌실계', 'Optic pathway': '시각경로', 'Sense organs': '감각기',
};
