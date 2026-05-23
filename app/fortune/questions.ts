// questions.ts

export interface Option {
  text: string;
  dimension: 'S' | 'V' | 'C' | 'F' | 'R' | 'M' | 'H' | 'P';
}

export interface Question {
  id: number;
  question: string;
  options: Option[];
}

export const questionBank: Question[] = [
  { id: 1, question: "挑選座位時，你下意識會先看向哪裡？", options: [{ text: "靠牆、角落，最好是有插座獨立檯燈的個人位", dimension: "S" }, { text: "視野良好的大長桌，或採光極佳的沙發聊天區", dimension: "V" }] },
  { id: 2, question: "你最無法忍受咖啡廳出現以下哪種聲音？", options: [{ text: "隔壁桌高談闊論、大聲講八卦的聲音", dimension: "S" }, { text: "安靜到連針掉下去、嚼冰塊都聽得到的尷尬寂靜", dimension: "V" }] },
  { id: 3, question: "在咖啡廳裡看到有人用筆電戴著耳機，你的想法通常是？", options: [{ text: "太好了，這區的人應該都在認真工作，我可以安心坐下", dimension: "S" }, { text: "感覺有點嚴肅，我還是換一區坐，免得聊天吵到他", dimension: "V" }] },
  { id: 4, question: "如果今天打算在咖啡廳待一整個下午，你的主要目的是？", options: [{ text: "讀書、寫程式、處理專案，需要高度專注", dimension: "S" }, { text: "和朋友聚會聊天、拍照打卡，放鬆度過週末", dimension: "V" }] },
  { id: 5, question: "店家播放哪種類型的音樂，會讓你待得最舒服？", options: [{ text: "輕柔的純音樂、Lo-fi 爵士或大自然雨聲", dimension: "S" }, { text: "節奏輕快的獨立流行樂（Indie Pop）或 City Pop", dimension: "V" }] },
  { id: 6, question: "隔壁桌突然開始大聲講商務電話，你的第一反應是？", options: [{ text: "戴上抗噪耳機，默默在心裡翻白眼，考慮換位子", dimension: "S" }, { text: "不太在意，反正聽聽別人在做什麼生意也蠻有趣的", dimension: "V" }] },
  { id: 7, question: "店員走過來輕聲提醒「讀書請去二樓，一樓開放聊天交談」時，你會？", options: [{ text: "立刻收拾行李搬去二樓，不想被打擾", dimension: "S" }, { text: "留在一樓，覺得這樣點餐放鬆才沒有壓力", dimension: "V" }] },
  { id: 8, question: "你理想中的咖啡廳桌椅高度應該是？", options: [{ text: "與一般書桌同高、木質硬椅，打字讀書背部有支撐", dimension: "S" }, { text: "低矮軟綿的設計沙發、小圓几，適合慵懶靠著聊天", dimension: "V" }] },
  { id: 9, question: "當你一個人在咖啡廳讀書時，突然有陌生人想併桌，你會？", options: [{ text: "覺得隱私被侵犯，雖然答應但會想趕快離開", dimension: "S" }, { text: "覺得無所謂，大方答應，甚至可能順便點頭微笑", dimension: "V" }] },
  { id: 10, question: "你覺得什麼樣的客人組合最能讓你感到安心放鬆？", options: [{ text: "全都是隻身前往、各自戴耳機盯著螢幕的自由工作者", dimension: "S" }, { text: "成雙成對、一邊喝下午茶一邊低聲談笑的閨蜜或情侶", dimension: "V" }] },
  { id: 11, question: "如果這家咖啡廳不限時，最吸引你的點是？", options: [{ text: "我可以毫無壓力的把大專案在一天內衝刺完工", dimension: "S" }, { text: "可以和朋友聊到天黑，不用擔心聊到一半被趕走", dimension: "V" }] },
  { id: 12, question: "在挑選咖啡廳時，看到評論說「氣氛熱鬧、適合多人聚會」，你會？", options: [{ text: "直接略過，今天想要一個人靜一靜", dimension: "S" }, { text: "手刀收藏，下次找朋友聚餐時可以用上", dimension: "V" }] },
  { id: 13, question: "你拍照記錄咖啡廳的畫面，通常會偏向哪種鏡頭？", options: [{ text: "局部特寫、桌上那杯拉花、或是窗邊灑落的光影", dimension: "S" }, { text: "大廣角拍出整體空間設計、或自己與店內環境的合照", dimension: "V" }] },
  { id: 14, question: "走進一家新咖啡廳，你第一個會看的菜單區塊是？", options: [{ text: "單品手沖（查看豆子產地、處理法如厭氧洗水）", dimension: "C" }, { text: "今日甜點櫃（查看有沒有戚風、肉桂捲或達克瓦茲）", dimension: "F" }] },
  { id: 15, question: "如果一杯咖啡要賣到 250 元以上，你覺得是因為它具備了什麼？", options: [{ text: "它是稀有的競標豆、或是職人等級的特調配方", dimension: "C" }, { text: "它是一杯漂浮著精緻冰淇淋、拍照極美的視覺系飲品", dimension: "F" }] },
  { id: 16, question: "下午三點，你覺得最完美的「提神療憂組合」是？", options: [{ text: "一杯風味明亮的冰美式，或層次分明的燕麥奶拿鐵", dimension: "C" }, { text: "一碗風味鮮奶茶，搭配一盤剛烤好的巴斯克乳酪蛋糕", dimension: "F" }] },
  { id: 17, question: "聽說某家店「咖啡很普通，但烤布丁驚為天人」，你會想去嗎？", options: [{ text: "興致缺缺，咖啡才是靈魂，主修甜點的店算甜點店", dimension: "C" }, { text: "馬上收藏！咖啡普通沒關係，有厲害的甜點就值得去", dimension: "F" }] },
  { id: 18, question: "如果店家今天舉辦一個體驗活動，你會想報名哪一個？", options: [{ text: "咖啡杯測（Cupping）與手沖入門手作課", dimension: "C" }, { text: "法式甜點擺盤與基礎烘焙美學分享會", dimension: "F" }] },
  { id: 19, question: "點餐時看到「季節限定草莓千層」與「巴拿馬藝妓單品」，你會點？", options: [{ text: "經典藝妓單品，品嚐淺焙的精緻花果香調", dimension: "C" }, { text: "草莓千層餅！限定是殘酷的，拍照一定超好看", dimension: "F" }] },
  { id: 20, question: "吧檯上擺著巨大的專業全手動義式咖啡機與數台磨豆機，你的感覺是？", options: [{ text: "感到專業度破表，非常期待這家咖啡沖出來的萃取風味", dimension: "C" }, { text: "覺得只是背景裝飾，比較關心冰箱裡有沒有當日限量蛋糕", dimension: "F" }] },
  { id: 21, question: "如果店家不提供牛奶更換（如燕麥奶），只能喝純黑咖啡或單品，你會？", options: [{ text: "完全沒問題，黑咖啡才能真正喝出烘豆師的實力", dimension: "C" }, { text: "有點失望，因為自己習慣喝加糖、加奶或有調味的飲品", dimension: "F" }] },
  { id: 22, question: "你挑選咖啡廳最無法忍受的「食物雷點」是？", options: [{ text: "咖啡豆萃取過度導致焦苦、像在喝中藥的劣質咖啡", dimension: "C" }, { text: "甜點是用工廠現成冷凍半成品、口感乾硬粗糙的蛋糕", dimension: "F" }] },
  { id: 23, question: "當店員熱情向你介紹豆子帶有「柑橘、茉莉花香、尾韻帶紅酒酸」時，你通常？", options: [{ text: "聽得很認真，並試圖在喝的時候細細品嚐這些風味層次", dimension: "C" }, { text: "覺得很抽象，點點頭禮貌微笑，只要喝起來順口就好了", dimension: "F" }] },
  { id: 24, question: "這家咖啡廳在網路上爆紅的原因，你希望是因為？", options: [{ text: "老闆獲得過 WBC 世界咖啡師大賽的前三名殊榮", dimension: "C" }, { text: "招牌手工草莓戚風蛋糕被譽為全台灣最厲害的千層", dimension: "F" }] },
  { id: 25, question: "你願意為了一家咖啡廳特地大排長龍，唯一的原因是？", options: [{ text: "店家引進了全台灣少見的罕見產地微批次莊園豆", dimension: "C" }, { text: "主廚推出了每天只限量 10 份的精緻法式現做舒芙蕾", dimension: "F" }] },
  { id: 26, question: "哪種店面外觀最容易吸引你駐足、甚至走進去？", options: [{ text: "爬滿藤蔓的紅磚牆、古樸的舊木門，隱約透露出歷史感", dimension: "R" }, { text: "大片通透的落地玻璃、不鏽鋼或清水模的幾何設計", dimension: "M" }] },
  { id: 27, question: "你最喜歡咖啡廳室內照明燈光是哪一種？", options: [{ text: "溫慢微弱的黃光、復古檯燈、琥珀色愛迪生燈泡", dimension: "R" }, { text: "明亮自然的戶外採光、設計感十足的白光或投射燈", dimension: "M" }] },
  { id: 28, question: "在挑選咖啡廳的座位時，你更傾向坐哪種椅子？", options: [{ text: "充滿歲月痕跡的舊皮革沙發，或是老藤編椅", dimension: "R" }, { text: "線條乾淨的金屬椅，或是極簡塑料設計椅", dimension: "M" }] },
  { id: 29, question: "走進店裡，你注意到的裝飾小物通常是？", options: [{ text: "黑膠唱片機、古董打字機、舊書堆或手寫春聯", dimension: "R" }, { text: "當代藝術畫作、潮流公仔、充滿綠意的巨葉植物", dimension: "M" }] },
  { id: 30, question: "如果要用一個詞形容你理想中的咖啡廳空間，那會是？", options: [{ text: "溫馨懷舊、充滿故事與溫度的秘密基地", dimension: "R" }, { text: "乾淨俐落、時髦且富有空間感的前衛藝廊", dimension: "M" }] },
  { id: 31, question: "店內盛裝飲料的杯具，你更喜歡哪種質感？", options: [{ text: "帶有雕花的昭和風厚玻璃杯，或手工捏製的粗陶杯", dimension: "R" }, { text: "極輕薄的無邊雙層玻璃杯，或線條俐落的不鏽鋼杯", dimension: "M" }] },
  { id: 32, question: "如果店內播歌，你覺得哪種風格跟空間最搭？", options: [{ text: "西洋老歌、鄧麗君時代的黑膠復古慢歌", dimension: "R" }, { text: "前衛電子（Ambient）、韓系極簡 K-indie 或歐美冷調樂", dimension: "M" }] },
  { id: 33, question: "當看到店家保留了阿嬤時代的「磨石子地板」，你的感想是？", options: [{ text: "太有味道了！這種台式復古美學非常有靈魂", dimension: "R" }, { text: "覺得稍微有點舊，自己比較喜歡無接縫的微水泥或大理石", dimension: "M" }] },
  { id: 34, question: "你覺得什麼樣的牆面最能凸顯咖啡廳的格調？", options: [{ text: "斑駁的老舊磚牆、或是保留原有木質橫樑的日式屋頂", dimension: "R" }, { text: "純白乾淨的漆面、或是大面積透光的高級霧面不鏽鋼", dimension: "M" }] },
  { id: 35, question: "店家販售的周邊產品，哪一種最容易讓你掏錢？", options: [{ text: "復古帆布袋、有著手寫標籤的深焙耳掛包", dimension: "R" }, { text: "設計感金屬保溫杯、或是極簡幾何線條的貼紙包", dimension: "M" }] },
  { id: 36, question: "如果咖啡廳是由「百年老藥行」改建而成的，你會？", options: [{ text: "瘋掉！這種跨越時空的故事感對我有一種致命的吸引力", dimension: "R" }, { text: "覺得是個噱頭，比較在乎動線設計實不實用、採光好不好", dimension: "M" }] },
  { id: 37, question: "當你在店裡看書累了抬頭看，你更希望看到什麼景象？", options: [{ text: "古董櫥櫃裡整齊排列的舊書、古老時鐘的搖擺", dimension: "R" }, { text: "線條延伸感強烈的留白牆面、一棵線條優美的琴葉榕", dimension: "M" }] },
  { id: 38, question: "這家咖啡廳如果用顏色來代表，你直覺會選擇？", options: [{ text: "焦糖色、深木頭色、帶著溫暖焦香的琥珀色", dimension: "R" }, { text: "黑、白、銀灰，或是高冷高級的冷調水泥色", dimension: "M" }] },
  { id: 39, question: "打開 Google Map 找咖啡廳時，你的搜尋習慣是？", options: [{ text: "刻意放大那些捷運站到不了、藏在深深巷弄裡的小藍點", dimension: "H" }, { text: "搜尋關鍵字如「店貓」、「寵物友善」，確認能不能帶毛孩", dimension: "P" }] },
  { id: 40, question: "如果一家咖啡廳的招牌非常小，甚至根本沒有招牌，你的反應是？", options: [{ text: "「太酷了吧！這種低調的店通常都是隱藏版實力派。」", dimension: "H" }, { text: "「這也太難找了吧，如果自己走進去感覺有點壓力。」", dimension: "P" }] },
  { id: 41, question: "走進咖啡廳時，如果有一隻店貓迎面走來，你會？", options: [{ text: "內心覺得很可愛，但如果牠佔據了椅子，我會換一桌", dimension: "H" }, { text: "融化！直接鎖定牠附近的座位，試圖召喚或默默觀察牠", dimension: "P" }] },
  { id: 42, question: "你最理想的咖啡廳地理位置是？", options: [{ text: "二樓、地下室，或是遠離大馬路、連導航都會迷路的秘境", dimension: "H" }, { text: "擁有戶外小庭院、露天座，或是空間寬敞能讓動物活動的地方", dimension: "P" }] },
  { id: 43, question: "當看到評論寫「這家店老闆注重規矩，入店需安靜且位置極少」，你會？", options: [{ text: "很有興趣，這種有原則的隱密小店最適合一個人去探險", dimension: "H" }, { text: "稍微卻步，還是傾向選擇空間開闊、氣氛輕鬆的大空間", dimension: "P" }] },
  { id: 44, question: "如果一家店雖然很小很擠，但「每天限額 8 人入座」，你會想去嗎？", options: [{ text: "想去！這種極具神祕感與包廂感的隱密氛圍讓人很放鬆", dimension: "H" }, { text: "不想去，空間太小有壓迫感，還是大空間開闊的店比較自在", dimension: "P" }] },
  { id: 45, question: "如果這家咖啡廳有店狗，而且會在店裡跑來跑去、跟客人討摸，你的反應是？", options: [{ text: "稍微保持距離，希望牠不要來舔我的包包或干擾我喝咖啡", dimension: "H" }, { text: "直接融化！立刻拍一堆照片，覺得這家店簡直是天堂", dimension: "P" }] },
  { id: 46, question: "你對咖啡廳「戶外露天座位區」的想法是？", options: [{ text: "不喜歡，感覺會吸到馬路廢氣或是被蚊子咬，太暴露了", dimension: "H" }, { text: "超級喜歡！陽光灑落、微風吹來的感覺最棒了，視野很開闊", dimension: "P" }] },
  { id: 47, question: "聽說這家咖啡廳「沒預約絕對進不去，一天只接三組熟客」，你會？", options: [{ text: "激起好奇心，這種隱世獨立的私廚等級小店我一定要研究看看", dimension: "H" }, { text: "覺得太麻煩了，咖啡廳就是要隨性、想去就能去的大地標才對", dimension: "P" }] },
  { id: 48, question: "店內如果有「半開放式的大落地窗天井庭園」，最吸引你的是什麼？", options: [{ text: "光影照進室內暗處時，那種明暗對比的神祕美感", dimension: "H" }, { text: "滿滿的綠色植物，甚至有鳥鳴，空間非常大、生機勃勃的感覺", dimension: "P" }] },
  { id: 49, question: "挑選座位時，這兩個位子你會選哪一個？", options: [{ text: "一個需要爬上窄梯才能上去的「小閣樓個人秘密座位」", dimension: "H" }, { text: "推開門就能走到後院草皮的「一樓陽光落地窗大沙發位」", dimension: "P" }] },
  { id: 50, question: "你覺得咖啡廳除了喝咖啡，最棒的附加靈魂伴侶是？", options: [{ text: "一整面牆的店藏二手書、或是老闆精心挑選的絕版獨立雜誌", dimension: "H" }, { text: "兩隻慵懶躺在桌上睡覺、偶爾會翻肚子讓人摸摸的肥肥店貓", dimension: "P" }] }
];