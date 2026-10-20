import type { SupportLanguage } from '../../models/contentTranslations.js';

// Reviewed enrichment data for the 21 production stories, keyed by `seedKey`.
//
// This file carries ONLY data: the difficult/notable `vocab` drawn from each story's lyrics, three
// comprehension `quiz` questions, a clean Vietnamese `description`, and a full reviewed translation
// (`title`, `description`, `lyrics`, `vocab`) in every support language. The publisher merges these
// onto the live story; it never changes the lyrics, audio, or timing.
//
// `sourceLyrics` is the canonical Vietnamese lyric text (verbatim from production) that every
// translation's `lyrics[]` is aligned to, line by line. The publisher never writes `sourceLyrics`;
// it only checks that the live story still matches it, so a later lyric edit cannot silently
// misalign the translations. Because it is untouched source text (e.g. folk words such as "ăn mau
// chóng lớn"), it is excluded from the authored-content ban on draft/sample wording.

export interface StoryQuizQuestion {
  question: string;
  options: string[];
  /** Zero-based index into `options`. */
  correctAnswer: number;
  explanation: string;
}

export interface StoryTranslationEntry {
  title: string;
  description: string;
  /** Parallel by index to `sourceLyrics`. */
  lyrics: string[];
  /** Parallel by index to `vocab`. */
  vocab: string[];
}

export interface StoryEnrichmentEntry {
  sourceLyrics: string[];
  description: string;
  /** 4–8 words, each copied verbatim from `sourceLyrics`. */
  vocab: string[];
  quiz: StoryQuizQuestion[];
  translations: Record<SupportLanguage, StoryTranslationEntry>;
}

export const SUPPORT_LANGUAGE_ORDER: readonly SupportLanguage[] = ['en', 'ja', 'ko', 'zh', 'fr'] as const;

export const storyEnrichment: Record<string, StoryEnrichmentEntry> = {
  'story-01': {
    sourceLyrics: [
      'Trồng trồng nụ', 'Trồng trồng hoa', 'Chân cùng chụm', 'Tay xoè ra.',
      'Tay làm nụ', 'Tay làm hoa', 'Bạn đừng sợ', 'Cùng nhảy qua.',
      'Nào thêm bạn', 'Cây thêm hoa', 'Vườn thêm rộng', 'Trời bao la.',
      'Khi là nụ', 'Khi là hoa', 'Chạm cây đổ', 'Cùng cười xoà.',
      'Tay làm nụ', 'Tay làm hoa', 'Như vườn rộng', 'Như trời cao',
      'Bạn đừng sợ', 'Cùng bay nào', 'Cùng mơ ước', 'Lên trời cao..',
    ],
    description: 'Đồng dao cho trò chơi "Trồng nụ trồng hoa": các bạn nhỏ chụm chân, xòe tay làm nụ làm hoa rồi cùng nhảy qua, vừa chơi vừa học cách phối hợp và cổ vũ nhau.',
    vocab: ['nụ', 'hoa', 'nhảy', 'vườn', 'bạn', 'mơ ước'],
    quiz: [
      { question: 'Trong trò chơi, các bạn xòe tay ra để làm thành gì?', options: ['Nụ và hoa', 'Con thuyền', 'Mái nhà'], correctAnswer: 0, explanation: 'Lời đồng dao nhắc "Tay làm nụ, Tay làm hoa".' },
      { question: 'Các bạn làm động tác gì để vượt qua trong lúc chơi?', options: ['Nằm xuống ngủ', 'Cùng nhảy qua', 'Chạy đi thật xa'], correctAnswer: 1, explanation: 'Câu "Cùng nhảy qua" cho biết các bạn nhảy qua nhau.' },
      { question: 'Bài đồng dao mong các bạn nhỏ cùng nhau điều gì?', options: ['Giận nhau', 'Tranh đồ chơi', 'Cùng mơ ước và vui chơi'], correctAnswer: 2, explanation: 'Những câu cuối nhắc "Cùng mơ ước", "Lên trời cao".' },
    ],
    translations: {
      en: {
        title: 'Planting buds, planting flowers',
        description: 'A folk rhyme for the game "Planting buds, planting flowers": children put their feet together, open their hands to make buds and flowers, then jump across together, learning to cooperate and cheer one another on while they play.',
        lyrics: [
          'Planting, planting a bud', 'Planting, planting a flower', 'Feet drawn together', 'Hands spread wide.',
          'Hands make a bud', 'Hands make a flower', 'Don’t be afraid, friend', 'Let’s jump across together.',
          'Let’s add more friends', 'The tree gains more flowers', 'The garden grows wider', 'The sky is vast.',
          'Now it is a bud', 'Now it is a flower', 'Touch the tree, it tumbles', 'And we laugh together.',
          'Hands make a bud', 'Hands make a flower', 'Like a wide garden', 'Like a high sky',
          'Don’t be afraid, friend', 'Let’s fly together', 'Let’s dream together', 'Up to the high sky.',
        ],
        vocab: ['bud', 'flower', 'to jump', 'garden', 'friend', 'to dream'],
      },
      ja: {
        title: 'つぼみを植え、花を植えよう',
        description: 'わらべ歌「つぼみを植え、花を植えよう」。子どもたちは足をそろえ、手を開いてつぼみや花を作り、いっしょに跳び越えます。遊びながら協力し、友だちを応援することを学びます。',
        lyrics: [
          '植えよう、つぼみを', '植えよう、花を', '足をそろえて', '手を広げよう。',
          '手でつぼみを作り', '手で花を作る', 'こわがらないで、友だち', 'いっしょに跳び越えよう。',
          'さあ友だちを増やそう', '木には花が増える', '庭はもっと広がる', '空は果てしない。',
          '今はつぼみ', '今は花', '木にふれると倒れて', 'みんなで笑おう。',
          '手でつぼみを作り', '手で花を作る', '広い庭のように', '高い空のように',
          'こわがらないで、友だち', 'いっしょに飛ぼう', 'いっしょに夢を見よう', '高い空へ。',
        ],
        vocab: ['つぼみ', '花', '跳ぶ', '庭', '友だち', '夢を見る'],
      },
      ko: {
        title: '꽃봉오리 심고 꽃 심기',
        description: '전래 놀이 노래 "꽃봉오리 심고 꽃 심기". 아이들은 발을 모으고 손을 펴서 꽃봉오리와 꽃을 만든 뒤 함께 뛰어넘으며, 놀면서 협동하고 친구를 응원하는 법을 배웁니다.',
        lyrics: [
          '심자, 심자, 꽃봉오리', '심자, 심자, 꽃', '두 발을 모으고', '두 손을 활짝 펴자.',
          '손으로 꽃봉오리를 만들고', '손으로 꽃을 만들어', '무서워 말아, 친구야', '함께 뛰어넘자.',
          '자, 친구를 더 부르자', '나무엔 꽃이 늘고', '뜰은 더 넓어지고', '하늘은 끝이 없네.',
          '이제는 꽃봉오리', '이제는 꽃', '나무를 건드려 쓰러지면', '다 같이 웃자.',
          '손으로 꽃봉오리를 만들고', '손으로 꽃을 만들어', '넓은 뜰처럼', '높은 하늘처럼',
          '무서워 말아, 친구야', '함께 날아오르자', '함께 꿈을 꾸자', '높은 하늘로.',
        ],
        vocab: ['꽃봉오리', '꽃', '뛰다', '뜰', '친구', '꿈꾸다'],
      },
      zh: {
        title: '种花苞，种花儿',
        description: '童谣游戏《种花苞，种花儿》：小朋友并拢双脚、张开双手做出花苞和花儿，再一起跳过去，一边玩一边学会合作与互相加油。',
        lyrics: [
          '种呀种花苞', '种呀种花儿', '双脚并拢', '张开双手。',
          '用手做花苞', '用手做花儿', '别害怕，小伙伴', '一起跳过去。',
          '再多叫些伙伴', '树上花儿更多', '园子越来越大', '天空多辽阔。',
          '一会儿是花苞', '一会儿是花儿', '碰到树就倒下', '大家一起笑。',
          '用手做花苞', '用手做花儿', '像宽宽的园子', '像高高的天空',
          '别害怕，小伙伴', '一起飞吧', '一起梦想吧', '飞向高高的天空。',
        ],
        vocab: ['花苞', '花儿', '跳', '园子', '伙伴', '梦想'],
      },
      fr: {
        title: 'Planter des bourgeons, planter des fleurs',
        description: 'Comptine pour le jeu « Planter des bourgeons, planter des fleurs » : les enfants joignent les pieds, ouvrent les mains pour faire des bourgeons et des fleurs, puis sautent ensemble, apprenant à coopérer et à s’encourager tout en jouant.',
        lyrics: [
          'Planter, planter un bourgeon', 'Planter, planter une fleur', 'Les pieds joints', 'Les mains grandes ouvertes.',
          'Les mains font un bourgeon', 'Les mains font une fleur', 'N’aie pas peur, l’ami', 'Sautons ensemble par-dessus.',
          'Appelons d’autres amis', 'L’arbre a plus de fleurs', 'Le jardin s’élargit', 'Le ciel est immense.',
          'Tantôt un bourgeon', 'Tantôt une fleur', 'On touche l’arbre, il tombe', 'Et l’on rit ensemble.',
          'Les mains font un bourgeon', 'Les mains font une fleur', 'Comme un grand jardin', 'Comme un ciel très haut',
          'N’aie pas peur, l’ami', 'Envolons-nous ensemble', 'Rêvons ensemble', 'Vers le ciel très haut.',
        ],
        vocab: ['bourgeon', 'fleur', 'sauter', 'jardin', 'ami', 'rêver'],
      },
    },
  },

  'story-02': {
    sourceLyrics: [
      'Rồng rắn lên mây', 'Có cây xúc sắc', 'Có quả đồng hồ', 'Hỏi thăm thầy thuốc', 'Có nhà hay không?',
    ],
    description: 'Đồng dao mở đầu trò chơi "Rồng rắn lên mây": cả nhóm nối đuôi nhau thành đoàn rồng rắn, vừa đi vừa đọc và hỏi thăm thầy thuốc có ở nhà hay không.',
    vocab: ['rồng rắn', 'mây', 'xúc sắc', 'thầy thuốc'],
    quiz: [
      { question: 'Đoàn chơi trong bài được gọi là con gì?', options: ['Rồng rắn', 'Con mèo', 'Con cá'], correctAnswer: 0, explanation: 'Câu đầu là "Rồng rắn lên mây".' },
      { question: 'Cả nhóm đi hỏi thăm ai?', options: ['Bác nông dân', 'Thầy thuốc', 'Cô giáo'], correctAnswer: 1, explanation: 'Lời đọc là "Hỏi thăm thầy thuốc".' },
      { question: 'Các bạn hỏi thầy thuốc điều gì?', options: ['Có nhà hay không', 'Trời có mưa không', 'Đường đi lối nào'], correctAnswer: 0, explanation: 'Câu cuối hỏi "Có nhà hay không?".' },
    ],
    translations: {
      en: {
        title: 'Dragon-snake rises to the clouds',
        description: 'The opening rhyme of the game "Dragon-snake rises to the clouds": the whole group links up into a dragon-snake line and chants as they go, asking whether the healer is home.',
        lyrics: [
          'Dragon-snake rises to the clouds', 'There is a dice tree', 'There is a clock fruit', 'We call on the healer', 'Are you home or not?',
        ],
        vocab: ['dragon-snake', 'cloud', 'dice', 'healer'],
      },
      ja: {
        title: '龍と蛇が雲へのぼる',
        description: '遊び「龍と蛇が雲へのぼる」の始まりのわらべ歌。みんなで連なって龍と蛇の列になり、歌いながら進み、医者さんが家にいるかを尋ねます。',
        lyrics: [
          '龍と蛇が雲へのぼる', 'さいころの木があり', '時計の実があり', '医者さんに尋ねる', '家にいますか、いませんか？',
        ],
        vocab: ['龍と蛇', '雲', 'さいころ', '医者'],
      },
      ko: {
        title: '용과 뱀이 구름으로 오르네',
        description: '놀이 "용과 뱀이 구름으로 오르네"의 시작 노래. 모두가 줄지어 용과 뱀의 행렬을 이루어 노래하며 걷고, 의원이 집에 있는지 물어봅니다.',
        lyrics: [
          '용과 뱀이 구름으로 오르네', '주사위 나무가 있고', '시계 열매가 있고', '의원에게 물어보네', '집에 계신가요, 안 계신가요?',
        ],
        vocab: ['용과 뱀', '구름', '주사위', '의원'],
      },
      zh: {
        title: '龙蛇上云端',
        description: '游戏《龙蛇上云端》的开场童谣：大家首尾相连排成龙蛇长队，一边走一边念，向郎中打听他在不在家。',
        lyrics: [
          '龙蛇上云端', '有骰子树', '有钟表果', '去问郎中', '在家还是不在？',
        ],
        vocab: ['龙蛇', '云', '骰子', '郎中'],
      },
      fr: {
        title: 'Le dragon-serpent monte aux nuages',
        description: 'Comptine d’ouverture du jeu « Le dragon-serpent monte aux nuages » : tout le groupe se met en file en dragon-serpent et récite en avançant, demandant si le guérisseur est chez lui.',
        lyrics: [
          'Le dragon-serpent monte aux nuages', 'Il y a un arbre à dés', 'Il y a un fruit-horloge', 'On va voir le guérisseur', 'Es-tu chez toi ou non ?',
        ],
        vocab: ['dragon-serpent', 'nuage', 'dé', 'guérisseur'],
      },
    },
  },

  'story-03': {
    sourceLyrics: [
      'Tay này có', 'Tay này không', 'Xòe tay này', 'Xòe tay nọ.',
      'Tay này có', 'Tay này không', 'Tay có bông', 'Dâng tặng mẹ.',
    ],
    description: 'Đồng dao "Hai bàn tay": bé xòe hai bàn tay, đoán tay nào giấu bông hoa, rồi dâng tặng bông cho mẹ.',
    vocab: ['tay', 'xòe', 'bông', 'dâng tặng', 'mẹ'],
    quiz: [
      { question: 'Bé dùng bộ phận nào để chơi trong bài?', options: ['Bàn chân', 'Bàn tay', 'Cái tai'], correctAnswer: 1, explanation: 'Bài nhắc đi nhắc lại "Tay này có, Tay này không".' },
      { question: 'Trong tay bé giấu vật gì?', options: ['Bông hoa', 'Viên bi', 'Cái kẹo'], correctAnswer: 0, explanation: 'Câu "Tay có bông" cho biết đó là bông hoa.' },
      { question: 'Cuối cùng bé tặng bông cho ai?', options: ['Cho bạn', 'Cho mẹ', 'Cho thầy'], correctAnswer: 1, explanation: 'Câu cuối là "Dâng tặng mẹ".' },
    ],
    translations: {
      en: {
        title: 'Two hands',
        description: 'The rhyme "Two hands": the child opens both hands, guesses which one hides the flower, then offers the flower to mother.',
        lyrics: [
          'This hand has it', 'This hand does not', 'Open this hand', 'Open that hand.',
          'This hand has it', 'This hand does not', 'A hand holds a flower', 'To offer to mother.',
        ],
        vocab: ['hand', 'to open (the hand)', 'flower', 'to offer', 'mother'],
      },
      ja: {
        title: '二つの手',
        description: 'わらべ歌「二つの手」。子どもは両手を開き、どちらの手に花がかくれているかを当て、その花をお母さんにささげます。',
        lyrics: [
          'この手にはある', 'この手にはない', 'この手を開いて', 'あの手を開く。',
          'この手にはある', 'この手にはない', '手には花が', 'お母さんにあげる。',
        ],
        vocab: ['手', '開く', '花', 'ささげる', 'お母さん'],
      },
      ko: {
        title: '두 손',
        description: '노래 "두 손". 아이가 두 손을 펴서 어느 손에 꽃이 숨어 있는지 맞히고, 그 꽃을 엄마에게 드립니다.',
        lyrics: [
          '이 손엔 있고', '이 손엔 없네', '이 손을 펴고', '저 손을 펴자.',
          '이 손엔 있고', '이 손엔 없네', '손에 꽃이 있어', '엄마께 드리네.',
        ],
        vocab: ['손', '펴다', '꽃', '드리다', '엄마'],
      },
      zh: {
        title: '两只手',
        description: '童谣《两只手》：小朋友张开两只手，猜哪只手藏着花儿，再把花儿献给妈妈。',
        lyrics: [
          '这只手有', '这只手没有', '张开这只手', '张开那只手。',
          '这只手有', '这只手没有', '手里有花儿', '献给妈妈。',
        ],
        vocab: ['手', '张开', '花儿', '献给', '妈妈'],
      },
      fr: {
        title: 'Les deux mains',
        description: 'Comptine « Les deux mains » : l’enfant ouvre les deux mains, devine laquelle cache la fleur, puis offre la fleur à sa maman.',
        lyrics: [
          'Cette main l’a', 'Cette main ne l’a pas', 'Ouvre cette main', 'Ouvre l’autre main.',
          'Cette main l’a', 'Cette main ne l’a pas', 'Une main tient une fleur', 'À offrir à maman.',
        ],
        vocab: ['main', 'ouvrir (la main)', 'fleur', 'offrir', 'maman'],
      },
    },
  },

  'story-04': {
    sourceLyrics: [
      'Dung dăng dung dẻ', 'Dắt trẻ đi chơi', 'Đến cổng nhà trời', 'Lạy cậu lạy mợ',
      'Cho cháu về quê', 'Cho dê đi học', 'Cho cóc ở nhà', 'Cho gà bới bếp',
      'Xì xì xì xụp', 'Ngồi thụp xuống đây.',
    ],
    description: 'Đồng dao "Dung dăng dung dẻ": các bạn nắm tay nhau đi chơi, đọc theo nhịp rồi cùng ngồi thụp xuống khi hết bài.',
    vocab: ['dung dăng dung dẻ', 'dắt', 'đi chơi', 'cổng', 'quê'],
    quiz: [
      { question: 'Các bạn nắm tay nhau để làm gì?', options: ['Đi chơi', 'Đi ngủ', 'Nấu cơm'], correctAnswer: 0, explanation: 'Câu "Dắt trẻ đi chơi" cho biết các bạn đi chơi.' },
      { question: 'Con vật nào được cho đi học trong bài?', options: ['Con cóc', 'Con dê', 'Con gà'], correctAnswer: 1, explanation: 'Lời đọc là "Cho dê đi học".' },
      { question: 'Khi hết bài, các bạn làm gì?', options: ['Chạy đi', 'Nhảy lên cao', 'Ngồi thụp xuống'], correctAnswer: 2, explanation: 'Câu cuối là "Ngồi thụp xuống đây".' },
    ],
    translations: {
      en: {
        title: 'Swinging hand in hand',
        description: 'The rhyme "Swinging hand in hand": children hold hands and stroll, chanting to the beat, then all crouch down when the rhyme ends.',
        lyrics: [
          'Swinging hand in hand', 'Leading the children to play', 'To the gate of the sky', 'Bowing to uncle and aunt',
          'Let the child go home', 'Let the goat go to school', 'Let the toad stay home', 'Let the hen scratch the hearth',
          'Shee, shee, shee, shoop', 'Sit down right here.',
        ],
        vocab: ['swinging hand in hand', 'to lead by the hand', 'to go out to play', 'gate', 'home village'],
      },
      ja: {
        title: '手をつないでぶらぶら',
        description: 'わらべ歌「手をつないでぶらぶら」。子どもたちは手をつないで散歩し、拍子に合わせて歌い、歌が終わるとみんなでしゃがみます。',
        lyrics: [
          '手をつないでぶらぶら', '子どもを連れて遊びに', '空の門まで', 'おじさんおばさんにおじぎ',
          '子は田舎へ帰し', 'ヤギは学校へ', 'ヒキガエルは家に', 'ニワトリはかまどをかく',
          'シッ、シッ、シッ、シュッ', 'ここにしゃがもう。',
        ],
        vocab: ['手をつないでぶらぶら', '手を引く', '遊びに行く', '門', 'ふるさと'],
      },
      ko: {
        title: '손 잡고 흔들흔들',
        description: '노래 "손 잡고 흔들흔들". 아이들이 손을 잡고 거닐며 박자에 맞춰 노래하다가, 노래가 끝나면 다 같이 쪼그려 앉습니다.',
        lyrics: [
          '손 잡고 흔들흔들', '아이를 데리고 놀러', '하늘 대문까지', '아저씨 아주머니께 절하고',
          '아이는 고향에 보내고', '염소는 학교에 보내고', '두꺼비는 집에 두고', '닭은 부뚜막을 헤집네',
          '씨 씨 씨 숩', '여기 쪼그려 앉자.',
        ],
        vocab: ['손 잡고 흔들흔들', '손을 끌다', '놀러 가다', '대문', '고향'],
      },
      zh: {
        title: '手牵手摇呀摇',
        description: '童谣《手牵手摇呀摇》：小朋友手牵手去玩，合着节拍念唱，念完就一起蹲下来。',
        lyrics: [
          '手牵手摇呀摇', '带着孩子去玩', '来到天上的大门', '拜拜舅舅和舅妈',
          '让孩子回乡下', '让山羊去上学', '让蟾蜍留在家', '让母鸡扒灶膛',
          '嘶嘶嘶噗', '就在这儿蹲下来。',
        ],
        vocab: ['手牵手摇呀摇', '牵着', '去玩', '大门', '乡下'],
      },
      fr: {
        title: 'Main dans la main, on se balance',
        description: 'Comptine « Main dans la main, on se balance » : les enfants se tiennent la main et se promènent en scandant le rythme, puis s’accroupissent tous quand la comptine se termine.',
        lyrics: [
          'Main dans la main, on se balance', 'On emmène les enfants jouer', 'Jusqu’à la porte du ciel', 'On salue l’oncle et la tante',
          'Que l’enfant rentre au village', 'Que la chèvre aille à l’école', 'Que le crapaud reste à la maison', 'Que la poule gratte l’âtre',
          'Chi, chi, chi, choup', 'Asseyons-nous ici tout bas.',
        ],
        vocab: ['main dans la main, se balancer', 'mener par la main', 'aller jouer', 'portail', 'village natal'],
      },
    },
  },

  'story-05': {
    sourceLyrics: [
      'Nu na nu nống', 'Cái cống nằm trong', 'Con ong nằm ngoài', 'Củ khoai chấm mật',
      'Phật ngồi Phật khóc', 'Con cóc nhảy ra', 'Con gà ú ụ', 'Nhà mụ thổi xôi',
      'Nhà tôi nấu chè', 'Tay xòe chân rụt.',
    ],
    description: 'Đồng dao "Nu na nu nống": các bạn ngồi duỗi chân thành hàng, vừa đọc vừa đập nhẹ theo nhịp, đến cuối thì rụt chân lại.',
    vocab: ['nu na nu nống', 'cống', 'ong', 'khoai', 'cóc', 'chè'],
    quiz: [
      { question: 'Các bạn ngồi thế nào khi chơi bài này?', options: ['Duỗi chân thành hàng', 'Đứng xếp vòng tròn', 'Nằm sấp xuống'], correctAnswer: 0, explanation: 'Trò này các bạn ngồi duỗi chân, cuối bài "chân rụt".' },
      { question: 'Con vật nào nhảy ra trong bài?', options: ['Con ong', 'Con gà', 'Con cóc'], correctAnswer: 2, explanation: 'Lời đọc là "Con cóc nhảy ra".' },
      { question: 'Nhà "tôi" nấu món gì?', options: ['Nấu chè', 'Thổi xôi', 'Luộc khoai'], correctAnswer: 0, explanation: 'Câu "Nhà tôi nấu chè".' },
    ],
    translations: {
      en: {
        title: 'Nu na nu nong (a leg-counting rhyme)',
        description: 'The rhyme "Nu na nu nong": children sit in a row with legs stretched out, tapping to the beat as they chant, and pull their legs back at the end.',
        lyrics: [
          'Nu na nu nong', 'The culvert lies inside', 'The bee stays outside', 'A sweet-potato dipped in honey',
          'The Buddha sits, the Buddha weeps', 'The toad jumps out', 'The hen clucks away', 'Her house steams sticky rice',
          'My house cooks sweet soup', 'Hands open, legs tuck in.',
        ],
        vocab: ['nu na nu nong', 'culvert', 'bee', 'sweet potato', 'toad', 'sweet soup (chè)'],
      },
      ja: {
        title: 'ヌ・ナ・ヌ・ノン（足かぞえ歌）',
        description: 'わらべ歌「ヌ・ナ・ヌ・ノン」。子どもたちは足をのばして一列に座り、拍子に合わせてたたきながら歌い、最後に足を引っこめます。',
        lyrics: [
          'ヌ・ナ・ヌ・ノン', '水路は内がわ', 'ハチは外がわ', 'サツマイモを蜜につけて',
          'ほとけさま座って泣く', 'ヒキガエルがとび出す', 'ニワトリがコッコッと', 'あの家はおこわを蒸す',
          'うちはぜんざいを煮る', '手を開いて足を引く。',
        ],
        vocab: ['ヌ・ナ・ヌ・ノン', '水路', 'ハチ', 'サツマイモ', 'ヒキガエル', 'ぜんざい（チェー）'],
      },
      ko: {
        title: '누 나 누 농 (다리 세기 노래)',
        description: '노래 "누 나 누 농". 아이들이 다리를 쭉 펴고 한 줄로 앉아 박자에 맞춰 두드리며 노래하다가, 끝에서 다리를 오므립니다.',
        lyrics: [
          '누 나 누 농', '도랑은 안쪽에', '벌은 바깥쪽에', '고구마를 꿀에 찍어',
          '부처님 앉아 우시고', '두꺼비가 뛰어나와', '닭은 꼬꼬 울고', '저 집은 찰밥을 찌고',
          '우리 집은 단죽을 끓이네', '손은 펴고 다리는 오므려.',
        ],
        vocab: ['누 나 누 농', '도랑', '벌', '고구마', '두꺼비', '단죽(쩨)'],
      },
      zh: {
        title: '努那努农（数腿儿歌）',
        description: '童谣《努那努农》：小朋友伸直双腿排成一行坐着，合着节拍轻拍边念，念到最后把腿收回来。',
        lyrics: [
          '努那努农', '水沟在里边', '蜜蜂在外边', '红薯蘸蜂蜜',
          '佛爷坐着哭', '蟾蜍跳出来', '母鸡咕咕叫', '那家蒸糯米饭',
          '我家煮甜汤', '手张开，腿收回。',
        ],
        vocab: ['努那努农', '水沟', '蜜蜂', '红薯', '蟾蜍', '甜汤（che）'],
      },
      fr: {
        title: 'Nu na nu nong (comptine à compter les jambes)',
        description: 'Comptine « Nu na nu nong » : les enfants s’assoient en rangée, jambes tendues, tapotant au rythme en récitant, puis replient les jambes à la fin.',
        lyrics: [
          'Nu na nu nong', 'Le canal est à l’intérieur', 'L’abeille reste dehors', 'Une patate douce trempée dans le miel',
          'Le Bouddha assis pleure', 'Le crapaud saute dehors', 'La poule glousse', 'Sa maison cuit le riz gluant à la vapeur',
          'Ma maison fait une soupe sucrée', 'Mains ouvertes, jambes repliées.',
        ],
        vocab: ['nu na nu nong', 'canal', 'abeille', 'patate douce', 'crapaud', 'soupe sucrée (chè)'],
      },
    },
  },

  'story-06': {
    sourceLyrics: [
      'Lộn cầu vồng', 'Nước trong nước chảy', 'Có cô mười bảy', 'Có chị mười ba',
      'Hai chị em ta', 'Cùng lộn cầu vồng.',
    ],
    description: 'Đồng dao "Lộn cầu vồng": hai bạn nắm tay nhau, vừa đọc vừa xoay người lộn qua tay nhau như hình cầu vồng.',
    vocab: ['lộn cầu vồng', 'nước', 'chảy', 'chị em'],
    quiz: [
      { question: 'Hai bạn làm động tác gì khi chơi?', options: ['Lộn qua tay nhau', 'Nhảy lò cò', 'Chạy thi'], correctAnswer: 0, explanation: 'Bài tên là "Lộn cầu vồng", hai bạn xoay lộn qua tay nhau.' },
      { question: 'Dòng nước trong bài thế nào?', options: ['Đục ngầu', 'Trong và chảy', 'Đã cạn khô'], correctAnswer: 1, explanation: 'Câu "Nước trong nước chảy".' },
      { question: 'Có mấy bạn cùng chơi trong bài?', options: ['Một bạn', 'Hai bạn', 'Năm bạn'], correctAnswer: 1, explanation: 'Câu "Hai chị em ta" cho biết có hai bạn.' },
    ],
    translations: {
      en: {
        title: 'Tumbling rainbow',
        description: 'The rhyme "Tumbling rainbow": two children hold hands and, as they chant, turn and tumble under each other’s arms like a rainbow arch.',
        lyrics: [
          'Tumbling rainbow', 'Clear water flowing', 'There is a girl of seventeen', 'There is a sister of thirteen',
          'The two of us, sisters', 'Tumble the rainbow together.',
        ],
        vocab: ['tumbling rainbow', 'water', 'to flow', 'sisters'],
      },
      ja: {
        title: 'くるりんにじ',
        description: 'わらべ歌「くるりんにじ」。二人が手をつなぎ、歌いながら体を回して、にじのように相手の腕の下をくぐります。',
        lyrics: [
          'くるりんにじ', 'すんだ水が流れる', '十七のお姉さんがいて', '十三のお姉さんがいて',
          'わたしたち姉妹ふたり', 'いっしょににじをくるり。',
        ],
        vocab: ['くるりんにじ', '水', '流れる', '姉妹'],
      },
      ko: {
        title: '빙글빙글 무지개',
        description: '노래 "빙글빙글 무지개". 두 아이가 손을 잡고 노래하며 몸을 돌려, 무지개처럼 서로의 팔 밑으로 넘어갑니다.',
        lyrics: [
          '빙글빙글 무지개', '맑은 물이 흐르네', '열일곱 언니가 있고', '열세 살 언니가 있네',
          '우리 두 자매', '함께 무지개를 빙그르.',
        ],
        vocab: ['빙글빙글 무지개', '물', '흐르다', '자매'],
      },
      zh: {
        title: '翻彩虹',
        description: '童谣《翻彩虹》：两个小朋友手牵手，一边念一边转身，从彼此的手臂下翻过去，像一道彩虹。',
        lyrics: [
          '翻彩虹', '清水在流', '有位十七的姐姐', '有位十三的姐姐',
          '我们姐妹俩', '一起翻彩虹。',
        ],
        vocab: ['翻彩虹', '水', '流', '姐妹'],
      },
      fr: {
        title: 'La culbute de l’arc-en-ciel',
        description: 'Comptine « La culbute de l’arc-en-ciel » : deux enfants se tiennent la main et, en récitant, tournent et passent sous les bras l’un de l’autre comme une arche d’arc-en-ciel.',
        lyrics: [
          'La culbute de l’arc-en-ciel', 'L’eau claire qui coule', 'Il y a une fille de dix-sept ans', 'Il y a une sœur de treize ans',
          'Nous deux, les sœurs', 'Culbutons l’arc-en-ciel ensemble.',
        ],
        vocab: ['culbute de l’arc-en-ciel', 'eau', 'couler', 'sœurs'],
      },
    },
  },

  'story-07': {
    sourceLyrics: [
      'Cái ngủ mày ngủ cho lâu', 'Mẹ mày đi cấy đồng sâu chưa về', 'Bắt được con giếc con trê', 'Cầm cổ lôi về bắc nước làm lông',
      'Miếng nạc thời để phần chồng', 'Miếng xương mẹ gặm, miếng lòng con ăn.',
    ],
    description: 'Lời ru "Cái ngủ mày ngủ cho lâu": lời hát êm dịu ru bé ngủ say trong khi mẹ còn đi cấy ngoài đồng xa.',
    vocab: ['ngủ', 'cấy', 'giếc', 'trê', 'nạc', 'lòng'],
    quiz: [
      { question: 'Bài hát này dùng để làm gì cho bé?', options: ['Ru bé ngủ', 'Gọi bé dậy', 'Rủ bé chạy'], correctAnswer: 0, explanation: 'Đây là lời ru, câu đầu mong bé "ngủ cho lâu".' },
      { question: 'Mẹ đi làm việc gì ngoài đồng?', options: ['Đi cấy', 'Đi câu', 'Đi chợ'], correctAnswer: 0, explanation: 'Câu "Mẹ mày đi cấy đồng sâu".' },
      { question: 'Mẹ bắt được những con gì?', options: ['Con tôm con cua', 'Con giếc con trê', 'Con gà con vịt'], correctAnswer: 1, explanation: 'Câu "Bắt được con giếc con trê".' },
    ],
    translations: {
      en: {
        title: 'Sleep, little one, sleep long (a lullaby)',
        description: 'The lullaby "Sleep, little one, sleep long": a gentle song to rock the child into deep sleep while mother is still out transplanting rice in the far field.',
        lyrics: [
          'Sleep, little one, sleep long', 'Your mother is transplanting rice in the deep field, not yet home', 'She caught a carp and a catfish', 'Held their necks, brought them home, boiled water to clean them',
          'The lean meat is kept for father', 'Mother gnaws the bones, the child eats the innards.',
        ],
        vocab: ['to sleep', 'to transplant rice', 'crucian carp', 'catfish', 'lean meat', 'innards'],
      },
      ja: {
        title: 'ねんねん、長くおやすみ（子守歌）',
        description: '子守歌「ねんねん、長くおやすみ」。お母さんが遠い田んぼで田植えをしている間、子どもをぐっすり眠らせるやさしい歌です。',
        lyrics: [
          'ねんねん、長くおやすみ', 'お母さんは深い田で田植え、まだ帰らない', 'フナとナマズをつかまえて', '首をつかんで持ち帰り、湯をわかして下ごしらえ',
          '赤身はお父さんの分に', 'お母さんは骨をしゃぶり、子は内臓を食べる。',
        ],
        vocab: ['眠る', '田植えをする', 'フナ', 'ナマズ', '赤身', '内臓'],
      },
      ko: {
        title: '아가야 오래 자거라 (자장가)',
        description: '자장가 "아가야 오래 자거라". 엄마가 먼 논에서 모내기를 하는 동안 아이를 깊이 재우는 다정한 노래입니다.',
        lyrics: [
          '아가야 오래 자거라', '엄마는 깊은 논에서 모내기, 아직 안 오셨네', '붕어와 메기를 잡아', '목을 잡아 들고 와 물을 끓여 손질하네',
          '살코기는 아버지 몫으로 두고', '엄마는 뼈를 발라 먹고, 아이는 내장을 먹네.',
        ],
        vocab: ['자다', '모내기하다', '붕어', '메기', '살코기', '내장'],
      },
      zh: {
        title: '乖乖睡，睡长长（摇篮曲）',
        description: '摇篮曲《乖乖睡，睡长长》：妈妈还在远处的田里插秧，用温柔的歌声哄孩子睡得香甜。',
        lyrics: [
          '乖乖睡，睡长长', '你妈妈在深田插秧还没回', '捉到了鲫鱼和鲶鱼', '抓住脖子提回家，烧水收拾干净',
          '瘦肉留给爸爸', '妈妈啃骨头，孩子吃内脏。',
        ],
        vocab: ['睡觉', '插秧', '鲫鱼', '鲶鱼', '瘦肉', '内脏'],
      },
      fr: {
        title: 'Dors, petit, dors longtemps (berceuse)',
        description: 'Berceuse « Dors, petit, dors longtemps » : une chanson douce pour endormir profondément l’enfant pendant que la mère repique encore le riz dans le champ lointain.',
        lyrics: [
          'Dors, petit, dors longtemps', 'Ta mère repique le riz au champ profond, pas encore rentrée', 'Elle a pris un carassin et un poisson-chat', 'Les a tenus par le cou, ramenés, fait bouillir de l’eau pour les nettoyer',
          'La chair maigre est gardée pour le père', 'La mère ronge les os, l’enfant mange les abats.',
        ],
        vocab: ['dormir', 'repiquer le riz', 'carassin', 'poisson-chat', 'chair maigre', 'abats'],
      },
    },
  },

  'story-08': {
    sourceLyrics: [
      'Gánh gánh gồng gồng', 'Gánh sông gánh núi', 'Gánh củi gánh cành', 'Ta chạy cho nhanh',
      'Về xây nhà bếp', 'Nấu nồi cơm nếp', 'Chia ra năm phần', 'Một phần cho mẹ',
      'Một phần cho cha', 'Một phần cho bà', 'Một phần cho chị', 'Một phần cho anh',
      'Ta chạy cho nhanh', 'Về xây nhà bếp', 'Nấu nồi cơm nếp...',
    ],
    description: 'Đồng dao "Gánh gánh gồng gồng": bé làm động tác gánh gồng, nấu nồi cơm nếp rồi chia đều cho mọi người thân trong nhà.',
    vocab: ['gánh', 'gồng', 'sông', 'núi', 'củi', 'cơm nếp'],
    quiz: [
      { question: 'Bé làm động tác gì trong bài?', options: ['Gánh gồng', 'Chèo thuyền', 'Đạp xe'], correctAnswer: 0, explanation: 'Bài mở đầu bằng "Gánh gánh gồng gồng".' },
      { question: 'Bé nấu món gì để chia cho mọi người?', options: ['Nồi cơm nếp', 'Nồi canh cá', 'Nồi cháo gà'], correctAnswer: 0, explanation: 'Câu "Nấu nồi cơm nếp".' },
      { question: 'Nồi cơm được chia ra mấy phần?', options: ['Ba phần', 'Năm phần', 'Mười phần'], correctAnswer: 1, explanation: 'Câu "Chia ra năm phần".' },
    ],
    translations: {
      en: {
        title: 'Carrying and shouldering the load',
        description: 'The rhyme "Carrying and shouldering the load": the child mimes carrying a shoulder-pole, cooks a pot of sticky rice, and shares it equally among everyone at home.',
        lyrics: [
          'Carrying and shouldering', 'Carrying rivers, carrying mountains', 'Carrying firewood, carrying branches', 'Let us run quickly',
          'Home to build a kitchen', 'To cook a pot of sticky rice', 'Divided into five shares', 'One share for mother',
          'One share for father', 'One share for grandma', 'One share for big sister', 'One share for big brother',
          'Let us run quickly', 'Home to build a kitchen', 'To cook a pot of sticky rice...',
        ],
        vocab: ['to carry on a shoulder-pole', 'to shoulder a load', 'river', 'mountain', 'firewood', 'sticky rice'],
      },
      ja: {
        title: 'かついで、になって',
        description: 'わらべ歌「かついで、になって」。子どもはてんびん棒でかつぐしぐさをし、おこわを一なべ炊いて、家のみんなに等しく分けます。',
        lyrics: [
          'かついで、になって', '川をかつぎ、山をかつぎ', 'まきをかつぎ、枝をかつぎ', 'さあ急いで走ろう',
          '帰って台所を作り', 'おこわを一なべ炊く', '五つに分けて', 'ひとつはお母さんに',
          'ひとつはお父さんに', 'ひとつはおばあさんに', 'ひとつはお姉さんに', 'ひとつはお兄さんに',
          'さあ急いで走ろう', '帰って台所を作り', 'おこわを一なべ炊く……',
        ],
        vocab: ['かつぐ', 'になう', '川', '山', 'まき', 'おこわ'],
      },
      ko: {
        title: '지고 메고',
        description: '노래 "지고 메고". 아이가 멜대로 지는 시늉을 하고, 찰밥 한 솥을 지어 집안 식구 모두에게 똑같이 나눕니다.',
        lyrics: [
          '지고 메고', '강을 지고 산을 지고', '장작을 지고 가지를 지고', '어서 빨리 달리자',
          '돌아가 부엌을 짓고', '찰밥 한 솥을 짓네', '다섯 몫으로 나눠', '한 몫은 엄마께',
          '한 몫은 아빠께', '한 몫은 할머니께', '한 몫은 누나께', '한 몫은 형께',
          '어서 빨리 달리자', '돌아가 부엌을 짓고', '찰밥 한 솥을 짓네……',
        ],
        vocab: ['지다(멜대로)', '메다', '강', '산', '장작', '찰밥'],
      },
      zh: {
        title: '挑呀担呀',
        description: '童谣《挑呀担呀》：小朋友做出用扁担挑担的动作，煮一锅糯米饭，再平均分给家里的每个人。',
        lyrics: [
          '挑呀担呀', '挑江挑山', '挑柴挑枝', '我们快快跑',
          '回去搭灶房', '煮一锅糯米饭', '分成五份', '一份给妈妈',
          '一份给爸爸', '一份给奶奶', '一份给姐姐', '一份给哥哥',
          '我们快快跑', '回去搭灶房', '煮一锅糯米饭……',
        ],
        vocab: ['挑（用扁担）', '担', '江河', '山', '柴火', '糯米饭'],
      },
      fr: {
        title: 'Porter et charger sur l’épaule',
        description: 'Comptine « Porter et charger sur l’épaule » : l’enfant mime le portage à la palanche, cuit une marmite de riz gluant et la partage également entre tous les siens à la maison.',
        lyrics: [
          'Porter et charger', 'Porter des fleuves, porter des montagnes', 'Porter du bois, porter des branches', 'Courons vite',
          'Rentrer bâtir la cuisine', 'Cuire une marmite de riz gluant', 'Partagée en cinq parts', 'Une part pour maman',
          'Une part pour papa', 'Une part pour grand-mère', 'Une part pour la grande sœur', 'Une part pour le grand frère',
          'Courons vite', 'Rentrer bâtir la cuisine', 'Cuire une marmite de riz gluant...',
        ],
        vocab: ['porter à la palanche', 'charger sur l’épaule', 'fleuve', 'montagne', 'bois de chauffage', 'riz gluant'],
      },
    },
  },

  'story-09': {
    sourceLyrics: [
      'Con công hay múa', 'Nó múa làm sao', 'Nó rụt cổ vào', 'Nó xòe cánh ra',
      'Nó đỗ cành đa', 'Nó kêu ríu rít', 'Nó đỗ cành mít', 'Nó kêu vịt chè',
      'Nó đỗ cành tre', 'Kêu bè rau muống', 'Nó đỗ dưới ruộng', 'Nó kêu tầm vông.',
    ],
    description: 'Đồng dao "Con công hay múa": kể con công xòe cánh múa đẹp, đậu hết cành này sang cành khác và kêu nhiều tiếng vui tai.',
    vocab: ['công', 'múa', 'cổ', 'cánh', 'cành đa', 'ríu rít'],
    quiz: [
      { question: 'Bài đồng dao kể về con vật nào?', options: ['Con công', 'Con gà', 'Con vịt'], correctAnswer: 0, explanation: 'Câu đầu "Con công hay múa".' },
      { question: 'Con công làm gì khi múa?', options: ['Xòe cánh ra', 'Lặn xuống nước', 'Bò dưới đất'], correctAnswer: 0, explanation: 'Câu "Nó xòe cánh ra".' },
      { question: 'Con công đậu ở đâu trong bài?', options: ['Trên mái nhà', 'Trên các cành cây', 'Dưới gầm bàn'], correctAnswer: 1, explanation: 'Nó lần lượt đậu cành đa, cành mít, cành tre.' },
    ],
    translations: {
      en: {
        title: 'The peacock loves to dance',
        description: 'The rhyme "The peacock loves to dance": it tells of a peacock spreading its wings in a lovely dance, perching from branch to branch and calling out many cheerful sounds.',
        lyrics: [
          'The peacock loves to dance', 'How it dances', 'It pulls in its neck', 'It spreads its wings',
          'It perches on the banyan branch', 'It calls out chirping', 'It perches on the jackfruit branch', 'It calls "duck tea"',
          'It perches on the bamboo branch', 'Calling "raft of water spinach"', 'It perches down in the field', 'It calls "tam vong bamboo".',
        ],
        vocab: ['peacock', 'to dance', 'neck', 'wing', 'banyan branch', 'chirping'],
      },
      ja: {
        title: 'クジャクはおどりが好き',
        description: 'わらべ歌「クジャクはおどりが好き」。羽を広げてきれいにおどり、枝から枝へととまっては、いろいろな楽しい声で鳴くクジャクのお話です。',
        lyrics: [
          'クジャクはおどりが好き', 'どんなふうにおどるの', '首を引っこめて', '羽を広げる',
          'ガジュマルの枝にとまり', 'チチチと鳴く', 'ミツの木の枝にとまり', '「アヒルのチェー」と鳴く',
          '竹の枝にとまり', '「ヨウサイのいかだ」と鳴く', '田んぼにおりて', '「タムボン竹」と鳴く。',
        ],
        vocab: ['クジャク', 'おどる', '首', '羽', 'ガジュマルの枝', 'チチチと鳴く'],
      },
      ko: {
        title: '공작은 춤을 좋아해',
        description: '노래 "공작은 춤을 좋아해". 날개를 펴고 예쁘게 춤추며 이 가지 저 가지에 앉아 여러 즐거운 소리로 우는 공작 이야기입니다.',
        lyrics: [
          '공작은 춤을 좋아해', '어떻게 춤출까', '목을 움츠리고', '날개를 펴네',
          '보리수 가지에 앉아', '짹짹 울고', '잭프루트 가지에 앉아', '"오리 쩨"라 울고',
          '대나무 가지에 앉아', '"공심채 뗏목"이라 울고', '논에 내려앉아', '"땀봉 대나무"라 우네.',
        ],
        vocab: ['공작', '춤추다', '목', '날개', '보리수 가지', '짹짹 울다'],
      },
      zh: {
        title: '孔雀爱跳舞',
        description: '童谣《孔雀爱跳舞》：讲孔雀张开翅膀跳起漂亮的舞，停在一根根树枝上，发出许多好听的叫声。',
        lyrics: [
          '孔雀爱跳舞', '它怎么跳', '它缩起脖子', '它张开翅膀',
          '它停在榕树枝', '它叽叽喳喳叫', '它停在菠萝蜜枝', '它叫"鸭子甜汤"',
          '它停在竹枝', '叫"一排空心菜"', '它落到田里', '它叫"丛竹"。',
        ],
        vocab: ['孔雀', '跳舞', '脖子', '翅膀', '榕树枝', '叽叽喳喳'],
      },
      fr: {
        title: 'Le paon aime danser',
        description: 'Comptine « Le paon aime danser » : elle raconte un paon qui déploie ses ailes en une jolie danse, se pose de branche en branche et lance de nombreux cris joyeux.',
        lyrics: [
          'Le paon aime danser', 'Comme il danse', 'Il rentre le cou', 'Il déploie ses ailes',
          'Il se pose sur la branche du banian', 'Il pépie', 'Il se pose sur la branche du jaquier', 'Il crie « canard-thé »',
          'Il se pose sur la branche de bambou', 'Il crie « radeau de liseron d’eau »', 'Il se pose dans la rizière', 'Il crie « bambou tam vong ».',
        ],
        vocab: ['paon', 'danser', 'cou', 'aile', 'branche de banian', 'pépier'],
      },
    },
  },

  'story-10': {
    sourceLyrics: [
      'Rềnh rềnh ràng ràng', 'Ba gang chiếu trải', 'Xích lại cho gần', 'Một người hai chân',
      'Hai người bốn chân', 'Ba người sáu chân', 'Bốn người tám chân', 'Năm người mười chân',
      'Chân gầy chân béo', 'Dệt vải cho bà', 'Vải hoa vải trắng', 'Đến mai trời nắng',
      'Đem vải ra phơi', 'Đến mốt đẹp trời', 'Đem ra may áo', 'Rềnh rềnh ràng ràng.',
    ],
    description: 'Đồng dao "Rềnh rềnh ràng ràng": các bạn ngồi sát nhau, xếp chân rồi cùng đếm chân và hát về việc dệt vải, phơi vải, may áo.',
    vocab: ['chiếu', 'chân', 'dệt vải', 'vải hoa', 'may áo'],
    quiz: [
      { question: 'Các bạn đếm bộ phận nào của nhau trong bài?', options: ['Đếm chân', 'Đếm tai', 'Đếm mắt'], correctAnswer: 0, explanation: 'Bài đếm "Một người hai chân, Hai người bốn chân...".' },
      { question: 'Năm người thì có bao nhiêu chân?', options: ['Tám chân', 'Mười chân', 'Sáu chân'], correctAnswer: 1, explanation: 'Câu "Năm người mười chân".' },
      { question: 'Dệt vải xong để làm gì?', options: ['May áo', 'Làm diều', 'Gói bánh'], correctAnswer: 0, explanation: 'Câu "Đem ra may áo".' },
    ],
    translations: {
      en: {
        title: 'Renh renh rang rang (a leg-counting rhyme)',
        description: 'The rhyme "Renh renh rang rang": children sit close together, line up their legs, count them, and sing about weaving cloth, drying it, and sewing clothes.',
        lyrics: [
          'Renh renh rang rang', 'A three-span mat is spread', 'Move closer together', 'One person, two legs',
          'Two people, four legs', 'Three people, six legs', 'Four people, eight legs', 'Five people, ten legs',
          'Thin legs, plump legs', 'Weave cloth for grandma', 'Flowered cloth, white cloth', 'When tomorrow is sunny',
          'Bring the cloth out to dry', 'When the day after is fine', 'Bring it out to sew clothes', 'Renh renh rang rang.',
        ],
        vocab: ['mat', 'leg', 'to weave cloth', 'flowered cloth', 'to sew clothes'],
      },
      ja: {
        title: 'レン・レン・ラン・ラン（足かぞえ歌）',
        description: 'わらべ歌「レン・レン・ラン・ラン」。子どもたちはくっついて座り、足をそろえて数え、布を織り、ほして、服をぬうことを歌います。',
        lyrics: [
          'レン・レン・ラン・ラン', '三あた分のござをしいて', 'もっと近くによって', '一人で二本の足',
          '二人で四本の足', '三人で六本の足', '四人で八本の足', '五人で十本の足',
          'やせた足、太った足', 'おばあさんに布を織る', '花がらの布、白い布', 'あした晴れたら',
          '布を干しに出して', 'あさって天気がよければ', '出して服をぬう', 'レン・レン・ラン・ラン。',
        ],
        vocab: ['ござ', '足', '布を織る', '花がらの布', '服をぬう'],
      },
      ko: {
        title: '렌 렌 랑 랑 (다리 세기 노래)',
        description: '노래 "렌 렌 랑 랑". 아이들이 바짝 붙어 앉아 다리를 맞대고 세며, 천을 짜고 널고 옷을 짓는 일을 노래합니다.',
        lyrics: [
          '렌 렌 랑 랑', '세 뼘 돗자리를 펴고', '더 가까이 다가와', '한 사람 두 다리',
          '두 사람 네 다리', '세 사람 여섯 다리', '네 사람 여덟 다리', '다섯 사람 열 다리',
          '마른 다리 통통한 다리', '할머니께 천을 짜네', '꽃무늬 천, 하얀 천', '내일 날이 맑으면',
          '천을 꺼내 널고', '모레 날이 좋으면', '꺼내어 옷을 짓네', '렌 렌 랑 랑.',
        ],
        vocab: ['돗자리', '다리', '천을 짜다', '꽃무늬 천', '옷을 짓다'],
      },
      zh: {
        title: '棱棱啷啷（数腿儿歌）',
        description: '童谣《棱棱啷啷》：小朋友紧挨着坐，把腿排好一起数，唱织布、晒布、做衣裳的事。',
        lyrics: [
          '棱棱啷啷', '铺开三拃长的席子', '再靠近一点', '一个人两条腿',
          '两个人四条腿', '三个人六条腿', '四个人八条腿', '五个人十条腿',
          '瘦腿胖腿', '给奶奶织布', '花布白布', '明天天晴',
          '把布拿出去晒', '后天好天气', '拿出来做衣裳', '棱棱啷啷。',
        ],
        vocab: ['席子', '腿', '织布', '花布', '做衣裳'],
      },
      fr: {
        title: 'Rênh rênh ràng ràng (comptine à compter les jambes)',
        description: 'Comptine « Rênh rênh ràng ràng » : les enfants s’assoient serrés, alignent leurs jambes et les comptent, en chantant le tissage du tissu, son séchage et la couture des habits.',
        lyrics: [
          'Rênh rênh ràng ràng', 'Une natte de trois empans est étalée', 'Rapprochez-vous', 'Une personne, deux jambes',
          'Deux personnes, quatre jambes', 'Trois personnes, six jambes', 'Quatre personnes, huit jambes', 'Cinq personnes, dix jambes',
          'Jambes maigres, jambes dodues', 'Tisser du tissu pour grand-mère', 'Tissu fleuri, tissu blanc', 'Quand demain il fera soleil',
          'Sortir le tissu à sécher', 'Quand après-demain il fera beau', 'Le sortir pour coudre des habits', 'Rênh rênh ràng ràng.',
        ],
        vocab: ['natte', 'jambe', 'tisser le tissu', 'tissu fleuri', 'coudre des habits'],
      },
    },
  },

  'story-11': {
    sourceLyrics: [
      'Con cua mà có hai càng', 'Đầu, tai không có bò ngang cả đời', 'Con cá mà có cái đuôi', 'Hai vây ve vẩy nó bơi rất tài',
      'Con rùa mà có cái mai', 'Cái cổ thụt ngắn, thụt dài vào ra', 'Con voi mà có hai ngà', 'Cái vòi nó cuốn đổ nhà, đổ cây',
      'Con chim mà có cánh bay', 'Bay cùng Nam, Bắc, Đông, Tây tỏ tường.',
    ],
    description: 'Đồng dao "Con cua mà có hai càng": bài vè vui kể đặc điểm của cua, cá, rùa, voi và chim để bé nhận ra từng con vật.',
    vocab: ['cua', 'càng', 'cá', 'đuôi', 'rùa', 'voi'],
    quiz: [
      { question: 'Con cua trong bài bò kiểu gì?', options: ['Bò ngang', 'Bò lùi', 'Bay lên'], correctAnswer: 0, explanation: 'Câu "bò ngang cả đời".' },
      { question: 'Con vật nào có cái mai?', options: ['Con cá', 'Con rùa', 'Con voi'], correctAnswer: 1, explanation: 'Câu "Con rùa mà có cái mai".' },
      { question: 'Con voi dùng gì để cuốn đổ cây?', options: ['Cái vòi', 'Cái đuôi', 'Hai tai'], correctAnswer: 0, explanation: 'Câu "Cái vòi nó cuốn đổ nhà, đổ cây".' },
    ],
    translations: {
      en: {
        title: 'The crab that has two claws',
        description: 'The rhyme "The crab that has two claws": a playful verse naming the traits of the crab, fish, turtle, elephant, and bird so the child can recognize each animal.',
        lyrics: [
          'The crab that has two claws', 'No head or ears, it crawls sideways all its life', 'The fish that has a tail', 'Two fins waving, it swims so well',
          'The turtle that has a shell', 'Its neck pulls short, stretches long, in and out', 'The elephant that has two tusks', 'Its trunk coils and topples houses and trees',
          'The bird that has wings to fly', 'Flying clearly to south, north, east, and west.',
        ],
        vocab: ['crab', 'claw', 'fish', 'tail', 'turtle', 'elephant'],
      },
      ja: {
        title: 'はさみが二本のカニ',
        description: 'わらべ歌「はさみが二本のカニ」。カニ、魚、カメ、ゾウ、鳥の特ちょうを楽しく歌い、子どもがそれぞれの動物を見分けられるようにします。',
        lyrics: [
          'はさみが二本のカニ', '頭も耳もなく、一生横に歩く', 'しっぽのある魚', '二枚のひれをふって、とても上手に泳ぐ',
          'こうらのあるカメ', '首を短く、長く、出したり入れたり', 'きばが二本のゾウ', '鼻で巻いて家も木もたおす',
          'つばさで飛ぶ鳥', '南へ北へ東へ西へ、はっきり飛ぶ。',
        ],
        vocab: ['カニ', 'はさみ', '魚', 'しっぽ', 'カメ', 'ゾウ'],
      },
      ko: {
        title: '집게가 둘인 게',
        description: '노래 "집게가 둘인 게". 게, 물고기, 거북, 코끼리, 새의 특징을 재미있게 노래해 아이가 각 동물을 알아보게 합니다.',
        lyrics: [
          '집게가 둘인 게', '머리도 귀도 없이 평생 옆으로 기네', '꼬리가 있는 물고기', '두 지느러미를 흔들며 아주 잘 헤엄치네',
          '등딱지가 있는 거북', '목을 짧게, 길게, 넣었다 뺐다 하네', '엄니가 둘인 코끼리', '코로 감아 집도 나무도 쓰러뜨리네',
          '날개로 나는 새', '남북동서로 또렷이 날아가네.',
        ],
        vocab: ['게', '집게발', '물고기', '꼬리', '거북', '코끼리'],
      },
      zh: {
        title: '长着两只螯的螃蟹',
        description: '童谣《长着两只螯的螃蟹》：有趣的顺口溜，说出螃蟹、鱼、乌龟、大象和鸟的特点，让小朋友认出每种动物。',
        lyrics: [
          '长着两只螯的螃蟹', '没头没耳，一辈子横着爬', '长着尾巴的鱼', '两只鳍摆呀摆，游得真棒',
          '长着壳的乌龟', '脖子缩短又伸长，进进出出', '长着两根牙的大象', '鼻子一卷，推倒房子推倒树',
          '长着翅膀会飞的鸟', '飞往南北东西清清楚楚。',
        ],
        vocab: ['螃蟹', '螯', '鱼', '尾巴', '乌龟', '大象'],
      },
      fr: {
        title: 'Le crabe qui a deux pinces',
        description: 'Comptine « Le crabe qui a deux pinces » : un verset amusant qui nomme les traits du crabe, du poisson, de la tortue, de l’éléphant et de l’oiseau pour que l’enfant reconnaisse chaque animal.',
        lyrics: [
          'Le crabe qui a deux pinces', 'Sans tête ni oreilles, il marche de côté toute sa vie', 'Le poisson qui a une queue', 'Deux nageoires qui s’agitent, il nage si bien',
          'La tortue qui a une carapace', 'Son cou se raccourcit, s’allonge, entre et sort', 'L’éléphant qui a deux défenses', 'Sa trompe enroule et renverse maisons et arbres',
          'L’oiseau qui a des ailes pour voler', 'Volant vers le sud, le nord, l’est et l’ouest, bien net.',
        ],
        vocab: ['crabe', 'pince', 'poisson', 'queue', 'tortue', 'éléphant'],
      },
    },
  },

  'story-12': {
    sourceLyrics: [
      'Lúa ngô là cô đậu nành', 'Đậu nành là anh dưa chuột', 'Dưa chuột là ruột dưa gang', 'Dưa gang là nàng dưa hấu',
      'Dưa hấu là cậu lúa ngô', 'Lúa ngô là cô đậu nành.',
    ],
    description: 'Đồng dao "Lúa ngô là cô đậu nành": bài vè nối vòng, mỗi loại cây gọi loại cây kia bằng một vai trong họ hàng, cứ thế quay lại từ đầu.',
    vocab: ['lúa ngô', 'đậu nành', 'dưa chuột', 'dưa gang', 'dưa hấu'],
    quiz: [
      { question: 'Bài vè này nói về nhóm nào?', options: ['Các loại cây, quả', 'Các con vật', 'Các đồ chơi'], correctAnswer: 0, explanation: 'Bài nhắc lúa ngô, đậu nành, dưa chuột, dưa gang, dưa hấu.' },
      { question: 'Dưa gang được gọi là ai của dưa hấu?', options: ['Là nàng', 'Là cậu', 'Là anh'], correctAnswer: 0, explanation: 'Câu "Dưa gang là nàng dưa hấu".' },
      { question: 'Bài vè kết thúc thế nào?', options: ['Quay lại câu đầu', 'Dừng hẳn giữa chừng', 'Đổi sang con vật'], correctAnswer: 0, explanation: 'Câu cuối lặp lại "Lúa ngô là cô đậu nành", nối thành vòng.' },
    ],
    translations: {
      en: {
        title: 'Corn and rice are aunt soybean',
        description: 'The rhyme "Corn and rice are aunt soybean": a looping verse where each plant calls another by a family role, then circles right back to the start.',
        lyrics: [
          'Corn and rice are aunt soybean', 'Soybean is brother cucumber', 'Cucumber is the core of the melon', 'Melon is lady watermelon',
          'Watermelon is uncle corn-and-rice', 'Corn and rice are aunt soybean.',
        ],
        vocab: ['corn and rice', 'soybean', 'cucumber', 'Vietnamese melon', 'watermelon'],
      },
      ja: {
        title: 'とうもろこしと稲は大豆おばさん',
        description: 'わらべ歌「とうもろこしと稲は大豆おばさん」。どの作物も相手を親せきの役で呼び、ぐるりと回ってまた最初にもどる言葉あそびです。',
        lyrics: [
          'とうもろこしと稲は大豆おばさん', '大豆はきゅうりお兄さん', 'きゅうりはまくわうりの芯', 'まくわうりはすいかお嬢さん',
          'すいかはとうもろこしと稲おじさん', 'とうもろこしと稲は大豆おばさん。',
        ],
        vocab: ['とうもろこしと稲', '大豆', 'きゅうり', 'まくわうり', 'すいか'],
      },
      ko: {
        title: '옥수수와 벼는 콩 아주머니',
        description: '노래 "옥수수와 벼는 콩 아주머니". 작물마다 서로를 친척 호칭으로 부르다가 한 바퀴 돌아 처음으로 되돌아오는 말놀이입니다.',
        lyrics: [
          '옥수수와 벼는 콩 아주머니', '콩은 오이 오빠', '오이는 참외의 속', '참외는 수박 아가씨',
          '수박은 옥수수와 벼 아저씨', '옥수수와 벼는 콩 아주머니.',
        ],
        vocab: ['옥수수와 벼', '콩', '오이', '참외', '수박'],
      },
      zh: {
        title: '玉米稻子是大豆姑',
        description: '童谣《玉米稻子是大豆姑》：这是一首绕圈的顺口溜，每种作物用一个亲戚称呼叫对方，绕一圈又回到开头。',
        lyrics: [
          '玉米稻子是大豆姑', '大豆是黄瓜哥', '黄瓜是甜瓜的瓤', '甜瓜是西瓜姑娘',
          '西瓜是玉米稻子舅', '玉米稻子是大豆姑。',
        ],
        vocab: ['玉米稻子', '大豆', '黄瓜', '甜瓜', '西瓜'],
      },
      fr: {
        title: 'Maïs et riz sont tante soja',
        description: 'Comptine « Maïs et riz sont tante soja » : un verset en boucle où chaque plante appelle l’autre par un rôle de famille, puis revient tout droit au début.',
        lyrics: [
          'Maïs et riz sont tante soja', 'Le soja est frère concombre', 'Le concombre est le cœur du melon', 'Le melon est demoiselle pastèque',
          'La pastèque est oncle maïs-et-riz', 'Maïs et riz sont tante soja.',
        ],
        vocab: ['maïs et riz', 'soja', 'concombre', 'melon vietnamien', 'pastèque'],
      },
    },
  },

  'story-13': {
    sourceLyrics: [
      'Kéo cưa lừa xẻ', 'Ông thợ nào khỏe', 'Về ăn cơm vua', 'Ông thợ nào thua', 'Về bú tí mẹ.',
    ],
    description: 'Đồng dao "Kéo cưa lừa xẻ": hai bạn ngồi đối diện, nắm tay nhau kéo qua kéo lại như đang cưa gỗ.',
    vocab: ['kéo cưa', 'thợ', 'cơm vua', 'bú tí'],
    quiz: [
      { question: 'Hai bạn làm động tác gì khi chơi?', options: ['Kéo qua kéo lại như cưa gỗ', 'Nhảy dây', 'Đá bóng'], correctAnswer: 0, explanation: 'Bài tên "Kéo cưa lừa xẻ", hai bạn kéo tay như cưa.' },
      { question: 'Ông thợ khỏe thì được gì?', options: ['Về ăn cơm vua', 'Về bú tí mẹ', 'Đi ngủ sớm'], correctAnswer: 0, explanation: 'Câu "Ông thợ nào khỏe, Về ăn cơm vua".' },
      { question: 'Ông thợ thua thì phải làm gì?', options: ['Ăn cơm vua', 'Về bú tí mẹ', 'Được thưởng'], correctAnswer: 1, explanation: 'Câu "Ông thợ nào thua, Về bú tí mẹ".' },
    ],
    translations: {
      en: {
        title: 'Pull the saw, saw the log',
        description: 'The rhyme "Pull the saw, saw the log": two children sit facing each other, holding hands and pulling back and forth as if sawing wood.',
        lyrics: [
          'Pull the saw, saw the log', 'Whichever carpenter is strong', 'Goes home to eat the king’s rice', 'Whichever carpenter loses', 'Goes home to nurse at mother.',
        ],
        vocab: ['to pull the saw', 'carpenter', 'the king’s rice', 'to nurse (at the breast)'],
      },
      ja: {
        title: 'のこぎりを引いて木をひく',
        description: 'わらべ歌「のこぎりを引いて木をひく」。二人が向かい合って座り、手をつないで前後に引き合い、まるで木をのこぎりで切るようにあそびます。',
        lyrics: [
          'のこぎりを引いて木をひく', '力の強い大工さんは', '帰って王さまのごはんを食べ', '負けた大工さんは', '帰ってお母さんのおっぱいを飲む。',
        ],
        vocab: ['のこぎりを引く', '大工', '王さまのごはん', 'おっぱいを飲む'],
      },
      ko: {
        title: '톱을 당겨 나무를 켜네',
        description: '노래 "톱을 당겨 나무를 켜네". 두 아이가 마주 앉아 손을 잡고 앞뒤로 당기며 나무를 톱질하듯 놉니다.',
        lyrics: [
          '톱을 당겨 나무를 켜네', '힘센 목수는', '돌아가 임금님 밥을 먹고', '진 목수는', '돌아가 엄마 젖을 먹네.',
        ],
        vocab: ['톱을 당기다', '목수', '임금님 밥', '젖을 먹다'],
      },
      zh: {
        title: '拉大锯，锯木头',
        description: '童谣《拉大锯，锯木头》：两个小朋友面对面坐着，手拉手前后拉动，就像在锯木头。',
        lyrics: [
          '拉大锯，锯木头', '哪个木匠力气大', '回去吃皇帝饭', '哪个木匠输了', '回去吃妈妈的奶。',
        ],
        vocab: ['拉大锯', '木匠', '皇帝饭', '吃奶'],
      },
      fr: {
        title: 'Tire la scie, scie la bûche',
        description: 'Comptine « Tire la scie, scie la bûche » : deux enfants assis face à face se tiennent les mains et tirent d’avant en arrière comme pour scier du bois.',
        lyrics: [
          'Tire la scie, scie la bûche', 'Le menuisier le plus fort', 'Rentre manger le riz du roi', 'Le menuisier qui perd', 'Rentre téter sa maman.',
        ],
        vocab: ['tirer la scie', 'menuisier', 'le riz du roi', 'téter'],
      },
    },
  },

  'story-14': {
    sourceLyrics: [
      'Chi chi chành chành', 'Cái đanh thổi lửa', 'Con ngựa chết trương', 'Ba vương ngũ đế',
      'Bắt dế đi tìm', 'Ù à ù ập', 'Đóng sập cửa vào.',
    ],
    description: 'Đồng dao "Chi chi chành chành": một bạn xòe tay, các bạn khác đặt ngón tay vào, đến câu cuối thì rút tay thật nhanh khi bàn tay nắm sập lại.',
    vocab: ['chi chi chành chành', 'đanh', 'lửa', 'ngựa', 'dế'],
    quiz: [
      { question: 'Trong trò chơi, các bạn đặt gì vào bàn tay xòe?', options: ['Ngón tay', 'Viên bi', 'Chiếc lá'], correctAnswer: 0, explanation: 'Các bạn đặt ngón tay vào lòng bàn tay của bạn kia.' },
      { question: 'Đến câu cuối, bàn tay làm gì?', options: ['Nắm sập lại', 'Vẫy chào', 'Vỗ tay'], correctAnswer: 0, explanation: 'Câu "Đóng sập cửa vào", bàn tay nắm lại thật nhanh.' },
      { question: 'Các bạn cần làm gì để không bị bắt tay?', options: ['Rút tay thật nhanh', 'Nhắm mắt lại', 'Đứng im'], correctAnswer: 0, explanation: 'Khi bàn tay sập lại, phải rút ngón tay ra thật nhanh.' },
    ],
    translations: {
      en: {
        title: 'Chi chi chanh chanh (a finger-catching game)',
        description: 'The rhyme "Chi chi chanh chanh": one child holds out an open palm, the others rest a fingertip in it, and on the last line they snatch their fingers away fast as the hand snaps shut.',
        lyrics: [
          'Chi chi chanh chanh', 'The nail blows the fire', 'The horse lies bloated dead', 'Three kings, five emperors',
          'Catch a cricket to go searching', 'Oo-ah, oo-ap', 'Slam the door shut.',
        ],
        vocab: ['chi chi chanh chanh', 'nail (metal pin)', 'fire', 'horse', 'cricket'],
      },
      ja: {
        title: 'チ・チ・チャイン・チャイン（指つかみあそび）',
        description: 'わらべ歌「チ・チ・チャイン・チャイン」。一人が手のひらを開き、ほかの子がその上に指をのせ、最後の句で手がパッと閉じる前に、すばやく指を引きます。',
        lyrics: [
          'チ・チ・チャイン・チャイン', 'くぎが火をふき', '馬はふくれて死に', '三王五帝',
          'コオロギをつかまえて探しに', 'ウー・アー、ウー・アッ', '戸をバタンと閉める。',
        ],
        vocab: ['チ・チ・チャイン・チャイン', 'くぎ', '火', '馬', 'コオロギ'],
      },
      ko: {
        title: '찌 찌 짠 짠 (손가락 잡기 놀이)',
        description: '노래 "찌 찌 짠 짠". 한 아이가 손바닥을 펴면 다른 아이들이 그 위에 손가락을 올리고, 마지막 구절에서 손이 탁 닫히기 전에 손가락을 재빨리 뺍니다.',
        lyrics: [
          '찌 찌 짠 짠', '못이 불을 피우고', '말은 부풀어 죽고', '삼왕 오제',
          '귀뚜라미를 잡아 찾으러 가네', '우 아 우 압', '문을 탁 닫네.',
        ],
        vocab: ['찌 찌 짠 짠', '못', '불', '말', '귀뚜라미'],
      },
      zh: {
        title: '支支章章（抓手指游戏）',
        description: '童谣《支支章章》：一个小朋友摊开手掌，其他人把指头放上去，念到最后一句手掌猛地合拢，大家要赶紧把手指抽回来。',
        lyrics: [
          '支支章章', '钉子吹火', '马儿胀死', '三王五帝',
          '抓只蟋蟀去找', '呜啊呜啪', '砰地关上门。',
        ],
        vocab: ['支支章章', '钉子', '火', '马', '蟋蟀'],
      },
      fr: {
        title: 'Chi chi chành chành (jeu d’attrape-doigt)',
        description: 'Comptine « Chi chi chành chành » : un enfant ouvre la paume, les autres y posent un doigt, et au dernier vers ils retirent vite leur doigt avant que la main ne se referme d’un coup.',
        lyrics: [
          'Chi chi chành chành', 'Le clou souffle le feu', 'Le cheval gît mort et gonflé', 'Trois rois, cinq empereurs',
          'Attrape un grillon pour aller chercher', 'Ou-ah, ou-ap', 'Claque la porte.',
        ],
        vocab: ['chi chi chành chành', 'clou', 'feu', 'cheval', 'grillon'],
      },
    },
  },

  'story-15': {
    sourceLyrics: [
      'Ông sảo ông sao', 'Ông vào cửa sổ', 'Ông ở với tôi', 'Ông ngồi lên chiếu',
      'Tôi biếu củ khoai', 'Ông nhai nhóp nhép', 'Cái tôm cái tép', 'Ông ghép với rau',
      'Ăn mau chóng lớn', 'Ông ngồi dậy', 'Ông về trời.',
    ],
    description: 'Đồng dao "Ông sảo ông sao": bé trò chuyện vui với ông sao, mời ông vào nhà, mời khoai, mời tôm tép rồi tiễn ông về trời.',
    vocab: ['sao', 'cửa sổ', 'chiếu', 'khoai', 'tôm', 'tép'],
    quiz: [
      { question: 'Bé trò chuyện với ai trong bài?', options: ['Ông sao', 'Ông trăng', 'Ông mặt trời'], correctAnswer: 0, explanation: 'Bài gọi "Ông sảo ông sao".' },
      { question: 'Bé mời ông sao ăn món gì?', options: ['Củ khoai, tôm tép', 'Bánh kẹo', 'Cơm gà'], correctAnswer: 0, explanation: 'Bé "biếu củ khoai" và mời "cái tôm cái tép".' },
      { question: 'Cuối bài, ông sao đi đâu?', options: ['Về trời', 'Xuống sông', 'Vào rừng'], correctAnswer: 0, explanation: 'Câu cuối "Ông về trời".' },
    ],
    translations: {
      en: {
        title: 'Mister star, mister star',
        description: 'The rhyme "Mister star, mister star": the child chats happily with the star, invites him in, offers a sweet potato and little shrimp, then sees him off back to the sky.',
        lyrics: [
          'Mister star, mister star', 'Come in through the window', 'Stay here with me', 'Sit down on the mat',
          'I give you a sweet potato', 'You chew it munch-munch', 'The shrimp and the little shrimp', 'You pair them with greens',
          'Eat up and grow fast', 'You stand up', 'You go back to the sky.',
        ],
        vocab: ['star', 'window', 'sleeping mat', 'sweet potato', 'shrimp', 'little shrimp'],
      },
      ja: {
        title: 'お星さま、お星さま',
        description: 'わらべ歌「お星さま、お星さま」。子どもはお星さまと楽しくおしゃべりし、家にまねき、サツマイモやエビをすすめ、そして空へ見送ります。',
        lyrics: [
          'お星さま、お星さま', '窓から入って', 'わたしといっしょにいて', 'ござにお座り',
          'サツマイモをあげる', 'もぐもぐかんで', 'エビと小エビを', '野菜といっしょにして',
          'たくさん食べて大きくなって', '立ち上がって', '空へお帰り。',
        ],
        vocab: ['星', '窓', 'ござ', 'サツマイモ', 'エビ', '小エビ'],
      },
      ko: {
        title: '별님아, 별님아',
        description: '노래 "별님아, 별님아". 아이가 별님과 즐겁게 이야기하며 집으로 맞아들이고, 고구마와 새우를 권한 뒤 하늘로 배웅합니다.',
        lyrics: [
          '별님아, 별님아', '창문으로 들어와', '나와 함께 있어줘', '돗자리에 앉아',
          '고구마를 드릴게', '오물오물 씹고', '새우와 작은 새우를', '채소와 곁들여',
          '많이 먹고 쑥쑥 자라', '일어나서', '하늘로 돌아가.',
        ],
        vocab: ['별', '창문', '돗자리', '고구마', '새우', '작은 새우'],
      },
      zh: {
        title: '星星公公，星星公公',
        description: '童谣《星星公公》：小朋友和星星公公高兴地聊天，请他进门，端上红薯和虾米，最后送他回天上。',
        lyrics: [
          '星星公公，星星公公', '从窗户进来', '和我在一起', '坐到席子上',
          '我送你一个红薯', '你吧嗒吧嗒地嚼', '虾和虾米', '你配上青菜',
          '多吃快快长大', '你站起来', '你回到天上。',
        ],
        vocab: ['星星', '窗户', '席子', '红薯', '虾', '虾米'],
      },
      fr: {
        title: 'Monsieur l’étoile, monsieur l’étoile',
        description: 'Comptine « Monsieur l’étoile, monsieur l’étoile » : l’enfant bavarde joyeusement avec l’étoile, l’invite à entrer, lui offre une patate douce et de petites crevettes, puis la raccompagne au ciel.',
        lyrics: [
          'Monsieur l’étoile, monsieur l’étoile', 'Entre par la fenêtre', 'Reste avec moi', 'Assieds-toi sur la natte',
          'Je t’offre une patate douce', 'Tu la mâches, miam-miam', 'La crevette et la petite crevette', 'Tu les accompagnes de légumes',
          'Mange bien et grandis vite', 'Tu te lèves', 'Tu rentres au ciel.',
        ],
        vocab: ['étoile', 'fenêtre', 'natte', 'patate douce', 'crevette', 'petite crevette'],
      },
    },
  },

  'story-16': {
    sourceLyrics: [
      'Ông giẳng ông giăng', 'Xuống chơi với tôi', 'Có bầu có bạn', 'Có ván cơm xôi',
      'Có nồi cơm nếp', 'Có nệp bánh chưng', 'Có lưng hũ rượu', 'Có khướu đánh đu',
      'Thằng cu vỗ chài', 'Bắt trai bỏ giỏ', 'Cái đỏ ẵm em', 'Đi xem đánh cá',
      'Có rá vo gạo', 'Có gáo múc nước', 'Có lược chải đầu', 'Có trâu cày ruộng',
      'Có muống thả ao', 'Ông sao trên trời.',
    ],
    description: 'Đồng dao "Ông giẳng ông giăng": bé mời ông trăng xuống chơi và kể cho ông nghe bao nhiêu thứ vui có ở dưới này.',
    vocab: ['giăng', 'bạn', 'cơm xôi', 'bánh chưng', 'trâu', 'ruộng'],
    quiz: [
      { question: 'Bé mời ai xuống chơi trong bài?', options: ['Ông trăng', 'Ông sao', 'Ông mây'], correctAnswer: 0, explanation: 'Bài gọi "Ông giẳng ông giăng" (ông trăng).' },
      { question: 'Dưới này có món bánh gì để mời ông trăng?', options: ['Bánh chưng', 'Bánh mì', 'Bánh rán'], correctAnswer: 0, explanation: 'Câu "Có nệp bánh chưng".' },
      { question: 'Con trâu được nhắc đến làm việc gì?', options: ['Cày ruộng', 'Kéo xe', 'Giữ nhà'], correctAnswer: 0, explanation: 'Câu "Có trâu cày ruộng".' },
    ],
    translations: {
      en: {
        title: 'Mister moon, mister moon',
        description: 'The rhyme "Mister moon, mister moon": the child invites the moon down to play and tells him about all the fun things waiting here on earth.',
        lyrics: [
          'Mister moon, mister moon', 'Come down to play with me', 'There are gourds and friends', 'There is a tray of steamed sticky rice',
          'There is a pot of sticky rice', 'There is a stack of chung cakes', 'There is a half jar of wine', 'There is a thrush on a swing',
          'The little boy casts the net', 'Catches mussels, drops them in the basket', 'The little girl carries her baby sibling', 'Going to watch the fishing',
          'There is a basket to rinse rice', 'There is a dipper to scoop water', 'There is a comb to comb hair', 'There is a buffalo to plow the field',
          'There is water spinach dropped in the pond', 'Mister star up in the sky.',
        ],
        vocab: ['moon', 'friend', 'steamed sticky rice', 'chung cake', 'buffalo', 'rice field'],
      },
      ja: {
        title: 'お月さま、お月さま',
        description: 'わらべ歌「お月さま、お月さま」。子どもはお月さまをさそって遊びにこさせ、この地上にある楽しいものをたくさん話して聞かせます。',
        lyrics: [
          'お月さま、お月さま', 'おりてきて遊ぼう', 'ひょうたんも友だちもいる', 'おこわのおぼんもある',
          'おこわのなべもある', 'チュンケーキの重ねもある', '酒のかめも半分ある', 'ぶらんこのガビチョウもいる',
          '男の子が投げ網をうち', '貝をとってかごに入れ', '女の子は弟妹をだっこ', '魚とりを見に行く',
          '米をとぐざるもある', '水をくむひしゃくもある', '髪をとかすくしもある', '田をたがやす水牛もいる',
          '池にうかべた空心菜もある', '空にはお星さま。',
        ],
        vocab: ['月', '友だち', 'おこわ', 'チュンケーキ', '水牛', '田んぼ'],
      },
      ko: {
        title: '달님아, 달님아',
        description: '노래 "달님아, 달님아". 아이가 달님을 불러 내려와 놀자고 하며, 이 땅에 있는 즐거운 것들을 잔뜩 이야기해 줍니다.',
        lyrics: [
          '달님아, 달님아', '내려와 나랑 놀자', '박도 있고 친구도 있고', '찰밥 한 쟁반도 있고',
          '찰밥 한 솥도 있고', '쯩떡 한 무더기도 있고', '술 반 항아리도 있고', '그네 타는 꾀꼬리도 있고',
          '사내아이는 투망을 던지고', '조개를 잡아 바구니에 담고', '계집아이는 동생을 업고', '고기잡이를 보러 가네',
          '쌀 이는 소쿠리도 있고', '물 뜨는 바가지도 있고', '머리 빗는 빗도 있고', '밭 가는 물소도 있고',
          '못에 띄운 공심채도 있고', '하늘엔 별님.',
        ],
        vocab: ['달', '친구', '찰밥', '쯩떡', '물소', '논밭'],
      },
      zh: {
        title: '月亮公公，月亮公公',
        description: '童谣《月亮公公》：小朋友请月亮公公下来玩，把人间这么多好玩的东西讲给他听。',
        lyrics: [
          '月亮公公，月亮公公', '下来和我玩', '有葫芦也有伙伴', '有一盘糯米饭',
          '有一锅糯米饭', '有一叠粽子', '有半坛米酒', '有画眉在荡秋千',
          '小男孩撒网', '捉河蚌放进篓', '小女孩背着弟妹', '去看人家打鱼',
          '有筐子淘米', '有瓢舀水', '有梳子梳头', '有水牛耕田',
          '有空心菜放进池塘', '天上有星星公公。',
        ],
        vocab: ['月亮', '伙伴', '糯米饭', '粽子', '水牛', '稻田'],
      },
      fr: {
        title: 'Monsieur la lune, monsieur la lune',
        description: 'Comptine « Monsieur la lune, monsieur la lune » : l’enfant invite la lune à descendre jouer et lui raconte toutes les belles choses qui l’attendent ici-bas.',
        lyrics: [
          'Monsieur la lune, monsieur la lune', 'Descends jouer avec moi', 'Il y a des gourdes et des amis', 'Il y a un plateau de riz gluant à la vapeur',
          'Il y a une marmite de riz gluant', 'Il y a une pile de gâteaux chung', 'Il y a une demi-jarre de vin', 'Il y a un merle sur une balançoire',
          'Le petit garçon lance l’épervier', 'Attrape des moules, les met au panier', 'La petite fille porte son cadet', 'Va regarder la pêche',
          'Il y a un panier pour rincer le riz', 'Il y a une louche pour puiser l’eau', 'Il y a un peigne pour coiffer', 'Il y a un buffle pour labourer le champ',
          'Il y a du liseron d’eau mis dans la mare', 'Monsieur l’étoile là-haut dans le ciel.',
        ],
        vocab: ['lune', 'ami', 'riz gluant à la vapeur', 'gâteau chung', 'buffle', 'rizière'],
      },
    },
  },

  'story-17': {
    sourceLyrics: [
      'Chú Cuội ngồi gốc cây đa', 'Để trâu ăn lúa gọi cha ời ời', 'Cha còn cắt cỏ trên trời', 'Mẹ còn cưỡi ngựa đi mời quan viên',
      'Ông thì cầm bút, cầm nghiên', 'Ông thì cầm tiền đi chuộc lá đa.',
    ],
    description: 'Đồng dao "Chú Cuội ngồi gốc cây đa": bài hát quen thuộc về chú Cuội ngồi dưới gốc đa, gợi hình ảnh vầng trăng trong câu chuyện dân gian.',
    vocab: ['Chú Cuội', 'cây đa', 'trâu', 'lúa', 'cỏ', 'ngựa'],
    quiz: [
      { question: 'Chú Cuội ngồi ở đâu trong bài?', options: ['Gốc cây đa', 'Trên thuyền', 'Trong hang'], correctAnswer: 0, explanation: 'Câu đầu "Chú Cuội ngồi gốc cây đa".' },
      { question: 'Con trâu của chú Cuội làm gì?', options: ['Ăn lúa', 'Kéo cày', 'Uống nước'], correctAnswer: 0, explanation: 'Câu "Để trâu ăn lúa".' },
      { question: 'Mẹ trong bài làm gì?', options: ['Cưỡi ngựa đi mời quan viên', 'Nấu cơm', 'Dệt vải'], correctAnswer: 0, explanation: 'Câu "Mẹ còn cưỡi ngựa đi mời quan viên".' },
    ],
    translations: {
      en: {
        title: 'Uncle Cuoi sits at the foot of the banyan tree',
        description: 'The rhyme "Uncle Cuoi sits at the foot of the banyan tree": a beloved song about Uncle Cuoi under the banyan, calling to mind the image of the moon in the folk tale.',
        lyrics: [
          'Uncle Cuoi sits at the foot of the banyan tree', 'Lets the buffalo eat the rice, calls out to father', 'Father is still cutting grass up in the sky', 'Mother is still riding a horse to invite the officials',
          'One man holds a brush and an inkstone', 'One man holds money to redeem the banyan leaf.',
        ],
        vocab: ['Uncle Cuoi', 'banyan tree', 'buffalo', 'rice plant', 'grass', 'horse'],
      },
      ja: {
        title: 'クオイおじさんはガジュマルの根もとに座る',
        description: 'わらべ歌「クオイおじさんはガジュマルの根もとに座る」。ガジュマルの下にすわるクオイおじさんを歌い、昔話に出てくる月の姿を思わせる、親しまれた歌です。',
        lyrics: [
          'クオイおじさんはガジュマルの根もとに座る', '水牛に稲を食べさせ、父さんをよぶ', '父さんはまだ空で草をかっている', '母さんはまだ馬に乗って役人をまねきに行く',
          'ある人は筆とすずりを持ち', 'ある人はお金を持ってガジュマルの葉を買いもどしに行く。',
        ],
        vocab: ['クオイおじさん', 'ガジュマル', '水牛', '稲', '草', '馬'],
      },
      ko: {
        title: '꾸오이 아저씨가 보리수 밑동에 앉네',
        description: '노래 "꾸오이 아저씨가 보리수 밑동에 앉네". 보리수 아래 앉은 꾸오이 아저씨를 노래하며, 옛이야기 속 달의 모습을 떠올리게 하는 정겨운 노래입니다.',
        lyrics: [
          '꾸오이 아저씨가 보리수 밑동에 앉네', '물소가 벼를 먹게 두고 아버지를 부르네', '아버지는 아직 하늘에서 풀을 베고', '어머니는 아직 말을 타고 벼슬아치를 청하러 가네',
          '어떤 이는 붓과 벼루를 들고', '어떤 이는 돈을 들고 보리수 잎을 되찾으러 가네.',
        ],
        vocab: ['꾸오이 아저씨', '보리수', '물소', '벼', '풀', '말'],
      },
      zh: {
        title: '阿贵坐在榕树脚',
        description: '童谣《阿贵坐在榕树脚》：这首大家熟悉的歌，唱坐在榕树下的阿贵，让人想起民间故事里月亮的样子。',
        lyrics: [
          '阿贵坐在榕树脚', '让水牛吃稻子，喊爸爸哟哟', '爸爸还在天上割草', '妈妈还骑马去请官员',
          '有人拿着笔和砚', '有人拿着钱去赎回榕树叶。',
        ],
        vocab: ['阿贵', '榕树', '水牛', '稻子', '草', '马'],
      },
      fr: {
        title: 'L’oncle Cuoi est assis au pied du banian',
        description: 'Comptine « L’oncle Cuoi est assis au pied du banian » : une chanson aimée sur l’oncle Cuoi sous le banian, qui évoque l’image de la lune dans le conte populaire.',
        lyrics: [
          'L’oncle Cuoi est assis au pied du banian', 'Il laisse le buffle manger le riz, il appelle son père', 'Le père coupe encore l’herbe là-haut dans le ciel', 'La mère monte encore à cheval inviter les mandarins',
          'L’un tient un pinceau et un encrier', 'L’un tient de l’argent pour racheter la feuille de banian.',
        ],
        vocab: ['oncle Cuoi', 'banian', 'buffle', 'plant de riz', 'herbe', 'cheval'],
      },
    },
  },

  'story-18': {
    sourceLyrics: [
      'Bà còng đi chợ trời mưa', 'Cái tôm cái tép đi đưa bà còng', 'Đưa bà qua quãng đường đông', 'Đưa bà về tận ngõ trong nhà bà',
      'Tiền bà trong túi rơi ra', 'Tép tôm nhặt được trả bà mua rau.',
    ],
    description: 'Đồng dao "Bà còng đi chợ trời mưa": tôm tép giúp bà còng qua đường và nhặt lại tiền rơi trả cho bà, dạy bé lòng tốt và sự thật thà.',
    vocab: ['bà còng', 'chợ', 'mưa', 'tôm', 'tép', 'rau'],
    quiz: [
      { question: 'Ai đã giúp bà còng qua đường?', options: ['Tôm và tép', 'Mèo và chó', 'Gà và vịt'], correctAnswer: 0, explanation: 'Câu "Cái tôm cái tép đi đưa bà còng".' },
      { question: 'Khi nhặt được tiền bà rơi, tôm tép làm gì?', options: ['Trả lại cho bà', 'Giữ lấy', 'Vứt đi'], correctAnswer: 0, explanation: 'Câu "Tép tôm nhặt được trả bà mua rau".' },
      { question: 'Bài đồng dao khen điều gì ở tôm tép?', options: ['Tốt bụng và thật thà', 'Chạy nhanh', 'Hát hay'], correctAnswer: 0, explanation: 'Tôm tép vừa giúp bà, vừa trả lại tiền rơi, rất tốt và thật thà.' },
    ],
    translations: {
      en: {
        title: 'The bent old lady goes to market in the rain',
        description: 'The rhyme "The bent old lady goes to market in the rain": the shrimp and little shrimp help the old lady across the road and return the money she dropped, teaching kindness and honesty.',
        lyrics: [
          'The bent old lady goes to market in the rain', 'The shrimp and the little shrimp see the old lady along', 'They guide her through the crowded stretch of road', 'They bring her all the way home to her lane',
          'Her money falls out of her pocket', 'The shrimp pick it up and give it back for her to buy greens.',
        ],
        vocab: ['bent old lady', 'market', 'rain', 'shrimp', 'little shrimp', 'greens'],
      },
      ja: {
        title: 'こしの曲がったおばあさんが雨の市場へ',
        description: 'わらべ歌「こしの曲がったおばあさんが雨の市場へ」。エビと小エビがおばあさんの道わたりを助け、落としたお金を拾って返します。やさしさと正直を教えます。',
        lyrics: [
          'こしの曲がったおばあさんが雨の市場へ', 'エビと小エビがおばあさんを送り', '人のおおい道すじをわたらせ', '家のおくの小道まで送りとどける',
          'おばあさんのお金がふところから落ちる', 'エビたちが拾っておばあさんに返し、野菜を買ってもらう。',
        ],
        vocab: ['こしの曲がったおばあさん', '市場', '雨', 'エビ', '小エビ', '野菜'],
      },
      ko: {
        title: '허리 굽은 할머니가 비 오는 장에 가네',
        description: '노래 "허리 굽은 할머니가 비 오는 장에 가네". 새우와 작은 새우가 할머니의 길 건너기를 돕고 떨어뜨린 돈을 돌려드립니다. 친절과 정직을 가르칩니다.',
        lyrics: [
          '허리 굽은 할머니가 비 오는 장에 가네', '새우와 작은 새우가 할머니를 모셔다 드리네', '사람 많은 길목을 건너게 해 드리고', '집 안쪽 골목까지 바래다 드리네',
          '할머니 돈이 주머니에서 떨어지네', '새우들이 주워 돌려드려 나물을 사게 해 드리네.',
        ],
        vocab: ['허리 굽은 할머니', '장(시장)', '비', '새우', '작은 새우', '나물'],
      },
      zh: {
        title: '驼背奶奶冒雨赶集',
        description: '童谣《驼背奶奶冒雨赶集》：虾和虾米扶驼背奶奶过街，还把她掉的钱捡起还给她，教小朋友善良和诚实。',
        lyrics: [
          '驼背奶奶冒雨赶集', '虾和虾米送奶奶', '扶奶奶过人多的路段', '一直送到奶奶家里的巷子',
          '奶奶的钱从口袋里掉出来', '虾米捡到还给奶奶买青菜。',
        ],
        vocab: ['驼背奶奶', '集市', '雨', '虾', '虾米', '青菜'],
      },
      fr: {
        title: 'La vieille dame courbée va au marché sous la pluie',
        description: 'Comptine « La vieille dame courbée va au marché sous la pluie » : la crevette et la petite crevette aident la vieille dame à traverser et lui rendent l’argent tombé, enseignant la bonté et l’honnêteté.',
        lyrics: [
          'La vieille dame courbée va au marché sous la pluie', 'La crevette et la petite crevette raccompagnent la vieille dame', 'Elles lui font traverser le tronçon de route bondé', 'Elles la ramènent jusqu’à la ruelle de sa maison',
          'Son argent tombe de sa poche', 'Les crevettes le ramassent et le lui rendent pour acheter des légumes.',
        ],
        vocab: ['vieille dame courbée', 'marché', 'pluie', 'crevette', 'petite crevette', 'légumes verts'],
      },
    },
  },

  'story-19': {
    sourceLyrics: [
      'Cái bống là cái bống bang', 'Khéo sảy khéo sàng cho mẹ mẹ bống nấu cơm', 'Mẹ bống đi chợ đường trơn', 'Bống ra gánh đỡ chạy cơn mưa rào.',
    ],
    description: 'Đồng dao "Cái bống là cái bống bang": khen bé Bống chăm ngoan, biết sảy sàng gạo giúp mẹ và ra gánh đỡ cho mẹ khi trời mưa.',
    vocab: ['bống', 'sảy', 'sàng', 'nấu cơm', 'chợ', 'gánh đỡ'],
    quiz: [
      { question: 'Bé Bống giúp mẹ việc gì trong bếp?', options: ['Sảy sàng gạo', 'Quét sân', 'Rửa xe'], correctAnswer: 0, explanation: 'Câu "Khéo sảy khéo sàng cho mẹ".' },
      { question: 'Khi mẹ đi chợ về trời mưa, Bống làm gì?', options: ['Ra gánh đỡ cho mẹ', 'Đi ngủ', 'Trốn trong nhà'], correctAnswer: 0, explanation: 'Câu "Bống ra gánh đỡ chạy cơn mưa rào".' },
      { question: 'Bài đồng dao khen bé Bống điều gì?', options: ['Chăm ngoan, biết giúp mẹ', 'Chạy nhanh nhất', 'Hát hay nhất'], correctAnswer: 0, explanation: 'Bống biết sảy sàng và gánh đỡ giúp mẹ, rất chăm ngoan.' },
    ],
    translations: {
      en: {
        title: 'Little Bong, dear little Bong',
        description: 'The rhyme "Little Bong, dear little Bong": it praises little Bong for being good and helpful, winnowing and sifting rice for mother and carrying her load when the rain comes.',
        lyrics: [
          'Little Bong, dear little Bong', 'Deftly winnows and sifts so mother can cook the rice', 'Mother goes to market on a slippery road', 'Bong runs out to carry the load through the pouring rain.',
        ],
        vocab: ['Bong (child’s name)', 'to winnow', 'to sift', 'to cook rice', 'market', 'to help carry the load'],
      },
      ja: {
        title: 'ボンちゃん、かわいいボンちゃん',
        description: 'わらべ歌「ボンちゃん、かわいいボンちゃん」。お母さんのために米をあおり、ふるってよりわけ、雨の日には荷物をかつぐのを手伝う、ボンちゃんのよい子ぶりをほめます。',
        lyrics: [
          'ボンちゃん、かわいいボンちゃん', '上手に米をあおり、ふるって、お母さんがごはんをたけるように', 'お母さんはすべる道を市場へ', 'ボンちゃんは走り出て、どしゃぶりの中、荷物をかついで助ける。',
        ],
        vocab: ['ボンちゃん', '米をあおる', 'ふるう', 'ごはんをたく', '市場', '荷物をかついで助ける'],
      },
      ko: {
        title: '봉이야, 귀여운 봉이야',
        description: '노래 "봉이야, 귀여운 봉이야". 엄마를 위해 쌀을 까부르고 체로 쳐 밥을 짓게 돕고, 비 오는 날엔 짐을 대신 지는 착한 봉이를 칭찬합니다.',
        lyrics: [
          '봉이야, 귀여운 봉이야', '솜씨 좋게 까부르고 체로 쳐 엄마가 밥을 짓게 하네', '엄마는 미끄러운 길로 장에 가고', '봉이는 달려 나가 소나기 속에서 짐을 대신 지네.',
        ],
        vocab: ['봉이', '까부르다', '체로 치다', '밥을 짓다', '장(시장)', '짐을 대신 지다'],
      },
      zh: {
        title: '小蹦呀，可爱的小蹦',
        description: '童谣《小蹦呀，可爱的小蹦》：夸小蹦乖巧能干，会给妈妈簸米筛米做饭，下雨天还跑出去替妈妈挑担。',
        lyrics: [
          '小蹦呀，可爱的小蹦', '手巧地簸米筛米，好让妈妈做饭', '妈妈走滑路去赶集', '小蹦跑出来，在大雨里替妈妈挑担。',
        ],
        vocab: ['小蹦（孩子名）', '簸（米）', '筛', '做饭', '集市', '替挑担'],
      },
      fr: {
        title: 'Petite Bong, chère petite Bong',
        description: 'Comptine « Petite Bong, chère petite Bong » : elle loue la petite Bong, sage et serviable, qui vanne et tamise le riz pour sa mère et porte sa charge quand vient la pluie.',
        lyrics: [
          'Petite Bong, chère petite Bong', 'Vanne et tamise avec adresse pour que maman cuise le riz', 'Maman va au marché sur une route glissante', 'Bong accourt porter la charge sous l’averse.',
        ],
        vocab: ['Bong (nom d’enfant)', 'vanner', 'tamiser', 'cuire le riz', 'marché', 'aider à porter la charge'],
      },
    },
  },

  'story-20': {
    sourceLyrics: [
      'Thằng Bờm có cái quạt mo', 'Phú ông xin đổi ba bò, chín trâu', 'Bờm rằng: Bờm chẳng lấy trâu', 'Phú ông xin đổi ao sâu cá mè',
      'Bờm rằng: Bờm chẳng lấy mè', 'Phú ông xin đổi một bè gỗ lim', 'Bờm rằng: Bờm chẳng lấy lim', 'Phú ông xin đổi con chim đồi mồi',
      'Bờm rằng: Bờm chẳng lấy mồi', 'Phú ông xin đổi nắm xôi, Bờm cười.',
    ],
    description: 'Đồng dao "Thằng Bờm có cái quạt mo": bài hát vui kể Bờm từ chối mọi thứ quý mà phú ông đưa ra, chỉ đến nắm xôi thì Bờm mới cười.',
    vocab: ['Thằng Bờm', 'quạt mo', 'phú ông', 'trâu', 'cá mè', 'nắm xôi'],
    quiz: [
      { question: 'Thằng Bờm có vật gì đặc biệt?', options: ['Cái quạt mo', 'Con diều', 'Cái trống'], correctAnswer: 0, explanation: 'Câu đầu "Thằng Bờm có cái quạt mo".' },
      { question: 'Ai muốn đổi lấy cái quạt mo của Bờm?', options: ['Phú ông', 'Cô giáo', 'Bác thợ'], correctAnswer: 0, explanation: 'Câu "Phú ông xin đổi...".' },
      { question: 'Bờm chịu cười khi phú ông đưa ra thứ gì?', options: ['Nắm xôi', 'Ba bò chín trâu', 'Bè gỗ lim'], correctAnswer: 0, explanation: 'Câu cuối "Phú ông xin đổi nắm xôi, Bờm cười".' },
    ],
    translations: {
      en: {
        title: 'Bom the boy has a palm-leaf fan',
        description: 'The rhyme "Bom the boy has a palm-leaf fan": a cheerful song in which Bom turns down every precious thing the rich man offers, and only smiles when it is a handful of sticky rice.',
        lyrics: [
          'Bom the boy has a palm-leaf fan', 'The rich man offers to trade three cows and nine buffaloes', 'Bom says: Bom won’t take the buffaloes', 'The rich man offers to trade a deep pond full of carp',
          'Bom says: Bom won’t take the carp', 'The rich man offers to trade a raft of ironwood', 'Bom says: Bom won’t take the ironwood', 'The rich man offers to trade a hawksbill bird',
          'Bom says: Bom won’t take the bait', 'The rich man offers to trade a handful of sticky rice, and Bom smiles.',
        ],
        vocab: ['Bom (boy’s name)', 'palm-leaf fan', 'rich man', 'buffalo', 'carp', 'handful of sticky rice'],
      },
      ja: {
        title: 'ボム少年はヤシの葉のうちわを持っている',
        description: 'わらべ歌「ボム少年はヤシの葉のうちわを持っている」。お金持ちが出すどんな宝もボムはことわり、ひとにぎりのおこわにだけにっこり笑う、ゆかいな歌です。',
        lyrics: [
          'ボム少年はヤシの葉のうちわを持っている', 'お金持ちが牛三頭、水牛九頭と交かんしようという', 'ボムは言う、水牛はいらない', 'お金持ちが深い池いっぱいのコイと交かんしようという',
          'ボムは言う、コイはいらない', 'お金持ちがタガヤサンのいかだと交かんしようという', 'ボムは言う、タガヤサンはいらない', 'お金持ちがタイマイの鳥と交かんしようという',
          'ボムは言う、えものはいらない', 'お金持ちがひとにぎりのおこわと交かんしようといい、ボムはにっこり笑う。',
        ],
        vocab: ['ボム少年', 'ヤシの葉のうちわ', 'お金持ち', '水牛', 'コイ', 'ひとにぎりのおこわ'],
      },
      ko: {
        title: '봄이는 야자잎 부채를 가졌네',
        description: '노래 "봄이는 야자잎 부채를 가졌네". 부자가 내놓는 온갖 귀한 것을 봄이가 다 마다하다가, 찰밥 한 줌에야 비로소 웃는 유쾌한 노래입니다.',
        lyrics: [
          '봄이는 야자잎 부채를 가졌네', '부자가 소 세 마리, 물소 아홉 마리와 바꾸자 하네', '봄이 말하길, 물소는 안 가질래', '부자가 잉어 가득한 깊은 못과 바꾸자 하네',
          '봄이 말하길, 잉어는 안 가질래', '부자가 철목 뗏목과 바꾸자 하네', '봄이 말하길, 철목은 안 가질래', '부자가 매부리바다거북 빛 새와 바꾸자 하네',
          '봄이 말하길, 그 미끼는 안 가질래', '부자가 찰밥 한 줌과 바꾸자 하니, 봄이 빙긋 웃네.',
        ],
        vocab: ['봄이(아이 이름)', '야자잎 부채', '부자', '물소', '잉어', '찰밥 한 줌'],
      },
      zh: {
        title: '波姆有一把葵叶扇',
        description: '童谣《波姆有一把葵叶扇》：这首欢快的歌里，财主拿出的宝物波姆样样都不要，直到一把糯米饭，波姆才笑了。',
        lyrics: [
          '波姆有一把葵叶扇', '财主要用三头牛九头水牛来换', '波姆说：我不要水牛', '财主要用满池鲢鱼的深塘来换',
          '波姆说：我不要鲢鱼', '财主要用一排铁木来换', '波姆说：我不要铁木', '财主要用一只玳瑁鸟来换',
          '波姆说：我不要那诱饵', '财主要用一把糯米饭来换，波姆笑了。',
        ],
        vocab: ['波姆（孩子名）', '葵叶扇', '财主', '水牛', '鲢鱼', '一把糯米饭'],
      },
      fr: {
        title: 'Le petit Bom a un éventail en feuille de palmier',
        description: 'Comptine « Le petit Bom a un éventail en feuille de palmier » : une chanson joyeuse où Bom refuse chaque trésor offert par le riche, et ne sourit que pour une poignée de riz gluant.',
        lyrics: [
          'Le petit Bom a un éventail en feuille de palmier', 'Le riche propose d’échanger trois vaches et neuf buffles', 'Bom dit : Bom ne prendra pas les buffles', 'Le riche propose d’échanger un étang profond plein de carpes',
          'Bom dit : Bom ne prendra pas les carpes', 'Le riche propose d’échanger un radeau de bois de fer', 'Bom dit : Bom ne prendra pas le bois de fer', 'Le riche propose d’échanger un oiseau couleur d’écaille',
          'Bom dit : Bom ne prendra pas cet appât', 'Le riche propose d’échanger une poignée de riz gluant, et Bom sourit.',
        ],
        vocab: ['Bom (nom d’enfant)', 'éventail en feuille de palmier', 'homme riche', 'buffle', 'carpe', 'poignée de riz gluant'],
      },
    },
  },

  'story-21': {
    sourceLyrics: [
      'Cúc cu! Cúc cu! Chim rừng ca trong nắng', 'Im nghe! Im nghe! Ve rừng kêu liên miên', 'Rừng hát gió lay trên cành biếc', 'Lao xao! Rì rào! Dòng suối uốn quanh làn nước trôi trong xanh',
      'Róc rách! Róc rách! Nước luồn qua khóm trúc', 'Lá rơi! Lá rơi! Xoay tròn nước cuốn trôi', 'Có anh chiến sĩ đi qua khu rừng vắng', 'Lắng nghe nhạc rừng tâm hồn vui phơi phới',
      'Anh cười một mình rồi cất tiếng hát vang', 'Cây rừng dội tiếng theo lời ca mênh mang', 'Tính tang! Tính tình! Miền Đông gian lao mà anh dũng', 'Tính tang! Tính tình! Hăng hái chiến đấu với quân thù',
      'Đường xa chân đi vui bước', 'Lòng xuân thêm bao thắm tươi', 'Nhạc rừng vẳng đùa cùng nhịp bước', 'Hương rừng thoảng đưa hồn say sưa',
      'Rừng bát ngát, ôi rừng mến yêu.',
    ],
    description: 'Bài hát "Nhạc rừng" của nhạc sĩ Hoàng Việt: vẽ nên khu rừng đầy tiếng chim, tiếng ve và tiếng suối, cùng niềm vui yêu thiên nhiên của người đi qua rừng.',
    vocab: ['chim rừng', 've rừng', 'suối', 'lá', 'nhạc rừng', 'chiến sĩ'],
    quiz: [
      { question: 'Bài hát vẽ nên khung cảnh ở đâu?', options: ['Khu rừng', 'Bãi biển', 'Thành phố'], correctAnswer: 0, explanation: 'Bài hát tên là "Nhạc rừng", kể về âm thanh trong rừng.' },
      { question: 'Những âm thanh nào vang lên trong rừng?', options: ['Tiếng chim, tiếng ve, tiếng suối', 'Tiếng còi xe', 'Tiếng chuông trường'], correctAnswer: 0, explanation: 'Bài có "Chim rừng ca", "Ve rừng kêu" và "Dòng suối" róc rách.' },
      { question: 'Người đi qua rừng cảm thấy thế nào?', options: ['Vui và yêu thiên nhiên', 'Buồn chán', 'Sợ hãi'], correctAnswer: 0, explanation: 'Câu "tâm hồn vui phơi phới" và "rừng mến yêu".' },
    ],
    translations: {
      en: {
        title: 'Forest music',
        description: 'The song "Forest music" by composer Hoang Viet: it paints a forest full of birdsong, cicadas, and streams, and the joy of loving nature felt by someone passing through.',
        lyrics: [
          'Cuckoo! Cuckoo! The forest birds sing in the sunlight', 'Hush, listen! Hush, listen! The forest cicadas call on and on', 'The forest sings as the wind sways the green branches', 'Rustling! Murmuring! The winding stream’s clear water drifts by',
          'Babbling! Babbling! Water slips past the bamboo clumps', 'Leaves fall! Leaves fall! Spinning round, swept along by the water', 'A soldier passes through the quiet forest', 'Listening to the forest music, his heart soars with joy',
          'He smiles to himself, then lifts his voice in song', 'The forest trees echo back the boundless melody', 'Ting-tang! Ting-ting! The Eastern land, hard yet valiant', 'Ting-tang! Ting-ting! Fighting the foe with eager heart',
          'The long road, happy steps as he walks', 'His springtime heart grows ever brighter', 'The forest music echoes, playing along with his steps', 'The forest scent drifts, enchanting the soul',
          'The vast forest, oh beloved forest.',
        ],
        vocab: ['forest bird', 'forest cicada', 'stream', 'leaf', 'forest music', 'soldier'],
      },
      ja: {
        title: '森の音楽',
        description: '作曲家ホアン・ヴィエトの歌「森の音楽」。鳥の声、セミの声、せせらぎにあふれた森と、そこを通る人の自然を愛する喜びをえがきます。',
        lyrics: [
          'カッコウ！カッコウ！森の鳥が日ざしの中で歌う', 'しずかに、きいて！セミが絶え間なく鳴く', '森は歌い、風が緑の枝をゆらす', 'ざわざわ！さらさら！曲がりくねる小川の澄んだ水が流れる',
          'さらさら！さらさら！水は竹やぶをすりぬける', '葉が落ちる！葉が落ちる！くるくる回って水に運ばれる', 'ひとりの兵士が静かな森を通りすぎる', '森の音楽にきき入り、心ははずむ',
          '彼はひとりほほえみ、声高らかに歌いだす', '森の木々が広々とした歌にこだまする', 'ティンタン！ティンティン！東部は苦しくも勇ましい', 'ティンタン！ティンティン！意気さかんに敵と戦う',
          '遠い道も、足どりは楽しい', '春の心はいよいよあざやかに', '森の音楽が足どりとたわむれてひびく', '森の香りがただよい、心をうっとりさせる',
          '果てしない森よ、ああ、いとしい森よ。',
        ],
        vocab: ['森の鳥', 'セミ', '小川', '葉', '森の音楽', '兵士'],
      },
      ko: {
        title: '숲의 음악',
        description: '작곡가 호앙 비엣의 노래 "숲의 음악". 새소리, 매미 소리, 시냇물 소리로 가득한 숲과, 그곳을 지나는 이가 느끼는 자연을 사랑하는 기쁨을 그립니다.',
        lyrics: [
          '뻐꾹! 뻐꾹! 숲의 새가 햇살 속에 노래하네', '쉿, 들어봐! 숲의 매미가 끝없이 우네', '숲이 노래하고 바람이 푸른 가지를 흔드네', '사르락! 졸졸! 굽이도는 시내의 맑은 물이 흘러가네',
          '졸졸! 졸졸! 물이 대숲 사이를 빠져나가네', '잎이 지네! 잎이 지네! 빙글 돌며 물에 쓸려가네', '한 병사가 고요한 숲을 지나가네', '숲의 음악에 귀 기울이니 마음이 들뜨고 기쁘네',
          '그는 홀로 웃다가 목청껏 노래하네', '숲의 나무들이 드넓은 노래를 되울리네', '띵땅! 띵띵! 동부는 고되어도 용감하네', '띵땅! 띵띵! 기운차게 적과 싸우네',
          '먼 길도 걸음은 즐겁고', '봄 같은 마음은 더욱 환해지네', '숲의 음악이 걸음과 어우러져 울리고', '숲의 향기가 번져 넋을 취하게 하네',
          '드넓은 숲이여, 아, 사랑스러운 숲이여.',
        ],
        vocab: ['숲의 새', '숲의 매미', '시내', '잎', '숲의 음악', '병사'],
      },
      zh: {
        title: '森林之歌',
        description: '作曲家黄越的歌曲《森林之歌》：描绘出满是鸟鸣、蝉声和溪流的森林，以及路过的人热爱大自然的喜悦。',
        lyrics: [
          '布谷！布谷！林中鸟儿在阳光里歌唱', '静听！静听！林中蝉儿叫个不停', '森林歌唱，风摇着翠绿的枝条', '沙沙！潺潺！弯弯的溪流清水流淌',
          '叮咚！叮咚！溪水穿过竹丛', '落叶！落叶！打着转儿被水卷走', '有位战士走过寂静的森林', '聆听森林之歌，心情欢畅飞扬',
          '他独自微笑，又放声高歌', '林中树木回荡着辽阔的歌声', '叮当！叮叮！东部艰苦而英勇', '叮当！叮叮！满怀斗志与敌人战斗',
          '路途遥远，脚步却轻快', '春心更添几分明丽', '森林之歌回响，和着脚步嬉戏', '森林的清香飘来，令人陶醉',
          '森林辽阔，啊，可爱的森林。',
        ],
        vocab: ['林中鸟', '林中蝉', '溪流', '叶子', '森林之歌', '战士'],
      },
      fr: {
        title: 'Musique de la forêt',
        description: 'La chanson « Musique de la forêt » du compositeur Hoang Viet : elle peint une forêt pleine de chants d’oiseaux, de cigales et de ruisseaux, et la joie d’aimer la nature ressentie par celui qui la traverse.',
        lyrics: [
          'Coucou ! Coucou ! Les oiseaux de la forêt chantent au soleil', 'Chut, écoute ! Chut, écoute ! Les cigales de la forêt crient sans cesse', 'La forêt chante, le vent balance les branches vertes', 'Bruissement ! Murmure ! L’eau claire du ruisseau sinueux s’écoule',
          'Gazouillis ! Gazouillis ! L’eau se glisse entre les bambous', 'Les feuilles tombent ! Les feuilles tombent ! Tournoyant, emportées par l’eau', 'Un soldat traverse la forêt silencieuse', 'Écoutant la musique de la forêt, son cœur s’envole de joie',
          'Il sourit tout seul, puis élève la voix en chantant', 'Les arbres de la forêt renvoient l’écho de la mélodie immense', 'Ting-tang ! Ting-ting ! L’Est, rude mais vaillant', 'Ting-tang ! Ting-ting ! Combattant l’ennemi d’un cœur ardent',
          'La longue route, des pas joyeux en marchant', 'Son cœur de printemps devient toujours plus éclatant', 'La musique de la forêt résonne, jouant au rythme de ses pas', 'Le parfum de la forêt flotte, enivrant l’âme',
          'La vaste forêt, ô forêt bien-aimée.',
        ],
        vocab: ['oiseau de la forêt', 'cigale de la forêt', 'ruisseau', 'feuille', 'musique de la forêt', 'soldat'],
      },
    },
  },
};
