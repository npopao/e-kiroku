/**
 * Mock Data for e-kiroku
 * Includes 20 Helpers and 40 Users with Ruby tags
 */

const mockHelpers = [
  { id: 'h1', name: '<ruby>山田<rt>やまだ</rt></ruby> <ruby>太郎<rt>たろう</rt></ruby>' },
  { id: 'h2', name: '<ruby>鈴木<rt>すずき</rt></ruby> <ruby>花子<rt>はなこ</rt></ruby>' },
  { id: 'h3', name: '<ruby>佐藤<rt>さとう</rt></ruby> <ruby>健一<rt>けんいち</rt></ruby>' },
  { id: 'h4', name: '<ruby>田中<rt>たなか</rt></ruby> <ruby>美咲<rt>みさき</rt></ruby>' },
  { id: 'h5', name: '<ruby>伊藤<rt>いとう</rt></ruby> <ruby>純子<rt>じゅんこ</rt></ruby>' },
  { id: 'h6', name: '<ruby>渡辺<rt>わたなべ</rt></ruby> <ruby>光<rt>ひかる</rt></ruby>' },
  { id: 'h7', name: '<ruby>中村<rt>なかむら</rt></ruby> <ruby>恵<rt>めぐみ</rt></ruby>' },
  { id: 'h8', name: '<ruby>小林<rt>こばやし</rt></ruby> <ruby>直樹<rt>なおき</rt></ruby>' },
  { id: 'h9', name: '<ruby>加藤<rt>かとう</rt></ruby> <ruby>良子<rt>りょうこ</rt></ruby>' },
  { id: 'h10', name: '<ruby>吉田<rt>よしだ</rt></ruby> <ruby>誠<rt>まこと</rt></ruby>' },
  { id: 'h11', name: '<ruby>吉田<rt>よしだ</rt></ruby> <ruby>凜<rt>りん</rt></ruby>' },
  { id: 'h12', name: '<ruby>山田<rt>やまだ</rt></ruby> <ruby>湊<rt>みなと</rt></ruby>' },
  { id: 'h13', name: '<ruby>佐々木<rt>ささき</rt></ruby> <ruby>花<rt>はな</rt></ruby>' },
  { id: 'h14', name: '<ruby>山口<rt>やまぐち</rt></ruby> <ruby>樹<rt>いつき</rt></ruby>' },
  { id: 'h15', name: '<ruby>松本<rt>まつもと</rt></ruby> <ruby>ひかり<rt>ひかり</rt></ruby>' },
  { id: 'h16', name: '<ruby>井上<rt>いのうえ</rt></ruby> <ruby>慶<rt>けい</rt></ruby>' },
  { id: 'h17', name: '<ruby>木村<rt>きむら</rt></ruby> <ruby>優<rt>ゆう</rt></ruby>' },
  { id: 'h18', name: '<ruby>林<rt>はやし</rt></ruby> <ruby>結花<rt>ゆいか</rt></ruby>' },
  { id: 'h19', name: '<ruby>斎藤<rt>さいとう</rt></ruby> <ruby>蓮<rt>れん</rt></ruby>' },
  { id: 'h20', name: '<ruby>清水<rt>しみず</rt></ruby> <ruby>楓<rt>かえで</rt></ruby>' },
];

const mockUsers = [
  { id: 'u1', name: '<ruby>青木<rt>あおき</rt></ruby> <ruby>三郎<rt>さぶろう</rt></ruby>', kana: 'あおき さぶろう', email: 'aoki@example.com' },
  { id: 'u2', name: '<ruby>井上<rt>いのうえ</rt></ruby> <ruby>次郎<rt>じろう</rt></ruby>', kana: 'いのうえ じろう', email: 'inoue@example.com' },
  { id: 'u3', name: '<ruby>上田<rt>うえだ</rt></ruby> <ruby>良江<rt>よしえ</rt></ruby>', kana: 'うえだ よしえ', email: 'ueda@example.com' },
  { id: 'u4', name: '<ruby>遠藤<rt>えんどう</rt></ruby> <ruby>修<rt>おさむ</rt></ruby>', kana: 'えんどう おさむ', email: 'endo@example.com' },
  { id: 'u5', name: '<ruby>岡田<rt>おかだ</rt></ruby> <ruby>弘子<rt>ひろこ</rt></ruby>', kana: 'おかだ ひろこ', email: 'okada@example.com' },
  { id: 'u6', name: '<ruby>葛西<rt>かさい</rt></ruby> <ruby>敏夫<rt>としお</rt></ruby>', kana: 'かさい としお', email: 'kasai@example.com' },
  { id: 'u7', name: '<ruby>木村<rt>きむら</rt></ruby> <ruby>多恵<rt>たえ</rt></ruby>', kana: 'きむら たえ', email: 'kimura@example.com' },
  { id: 'u8', name: '<ruby>工藤<rt>くどう</rt></ruby> <ruby>清<rt>きよし</rt></ruby>', kana: 'くどう きよし', email: 'kudo@example.com' },
  { id: 'u9', name: '<ruby>佐々木<rt>ささき</rt></ruby> <ruby>美和<rt>みわ</rt></ruby>', kana: 'ささき みわ', email: 'sasaki@example.com' },
  { id: 'u10', name: '<ruby>柴田<rt>しばた</rt></ruby> <ruby>茂<rt>しげる</rt></ruby>', kana: 'しばた しげる', email: 'shibata@example.com' },
  { id: 'u11', name: '<ruby>柴田<rt>しばた</rt></ruby> <ruby>ハナ<rt>はな</rt></ruby>', kana: 'しばた はな', email: 'user11@example.com' },
  { id: 'u12', name: '<ruby>菅原<rt>すがわら</rt></ruby> <ruby>鉄男<rt>てつお</rt></ruby>', kana: 'すがわら てつお', email: 'user12@example.com' },
  { id: 'u13', name: '<ruby>関<rt>せき</rt></ruby> <ruby>トメ<rt>とめ</rt></ruby>', kana: 'せき とめ', email: 'user13@example.com' },
  { id: 'u14', name: '<ruby>高田<rt>たかだ</rt></ruby> <ruby>松代<rt>まつよ</rt></ruby>', kana: 'たかだ まつよ', email: 'user14@example.com' },
  { id: 'u15', name: '<ruby>千葉<rt>ちば</rt></ruby> <ruby>竹夫<rt>たけお</rt></ruby>', kana: 'ちば たけお', email: 'user15@example.com' },
  { id: 'u16', name: '<ruby>塚本<rt>つかもと</rt></ruby> <ruby>梅子<rt>うめこ</rt></ruby>', kana: 'つかもと うめこ', email: 'user16@example.com' },
  { id: 'u17', name: '<ruby>中島<rt>なかじま</rt></ruby> <ruby>一<rt>はじめ</rt></ruby>', kana: 'なかじま はじめ', email: 'user17@example.com' },
  { id: 'u18', name: '<ruby>西村<rt>にしむら</rt></ruby> <ruby>次郎<rt>じろう</rt></ruby>', kana: 'にしむら じろう', email: 'user18@example.com' },
  { id: 'u19', name: '<ruby>野村<rt>のむら</rt></ruby> <ruby>権三<rt>ごんぞう</rt></ruby>', kana: 'のむら ごんぞう', email: 'user19@example.com' },
  { id: 'u20', name: '<ruby>橋本<rt>はしもと</rt></ruby> <ruby>四郎<rt>しろう</rt></ruby>', kana: 'はしもと しろう', email: 'user20@example.com' },
  { id: 'u21', name: '<ruby>平野<rt>ひらの</rt></ruby> <ruby>五郎<rt>ごろう</rt></ruby>', kana: 'ひらの ごろう', email: 'user21@example.com' },
  { id: 'u22', name: '<ruby>福田<rt>ふくだ</rt></ruby> <ruby>留吉<rt>とめきち</rt></ruby>', kana: 'ふくだ とめきち', email: 'user22@example.com' },
  { id: 'u23', name: '<ruby>本田<rt>ほんだ</rt></ruby> <ruby>シズ<rt>しず</rt></ruby>', kana: 'ほんだ しず', email: 'user23@example.com' },
  { id: 'u24', name: '<ruby>前田<rt>まえだ</rt></ruby> <ruby>キヌ<rt>きぬ</rt></ruby>', kana: 'まえだ きぬ', email: 'user24@example.com' },
  { id: 'u25', name: '<ruby>松田<rt>まつだ</rt></ruby> <ruby>銀次<rt>ぎんじ</rt></ruby>', kana: 'まつだ ぎんじ', email: 'user25@example.com' },
  { id: 'u26', name: '<ruby>三浦<rt>みうら</rt></ruby> <ruby>金太郎<rt>きんたろう</rt></ruby>', kana: 'みうら きんたろう', email: 'user26@example.com' },
  { id: 'u27', name: '<ruby>村上<rt>むらかみ</rt></ruby> <ruby>定吉<rt>さだきち</rt></ruby>', kana: 'むらかみ さだきち', email: 'user27@example.com' },
  { id: 'u28', name: '<ruby>森<rt>もり</rt></ruby> <ruby>寅男<rt>とらお</rt></ruby>', kana: 'もり とらお', email: 'user28@example.com' },
  { id: 'u29', name: '<ruby>矢野<rt>やの</rt></ruby> <ruby>辰次<rt>たつじ</rt></ruby>', kana: 'やの たつじ', email: 'user29@example.com' },
  { id: 'u30', name: '<ruby>横山<rt>よこやま</rt></ruby> <ruby>丑之助<rt>うしのすけ</rt></ruby>', kana: 'よこやま うしのすけ', email: 'user30@example.com' },
  { id: 'u31', name: '<ruby>荒木<rt>あらき</rt></ruby> <ruby>小太郎<rt>こたろう</rt></ruby>', kana: 'あらき こたろう', email: 'user31@example.com' },
  { id: 'u32', name: '<ruby>池田<rt>いけだ</rt></ruby> <ruby>万吉<rt>まんきち</rt></ruby>', kana: '池田 まんきち', email: 'user32@example.com' },
  { id: 'u33', name: '<ruby>内田<rt>うちだ</rt></ruby> <ruby>千代<rt>ちよ</rt></ruby>', kana: 'うちだ ちよ', email: 'user33@example.com' },
  { id: 'u34', name: '<ruby>大久保<rt>おおくぼ</rt></ruby> <ruby>万理<rt>まり</rt></ruby>', kana: 'おおくぼ まり', email: 'user34@example.com' },
  { id: 'u35', name: '<ruby>岡田<rt>おかだ</rt></ruby> <ruby>トメ<rt>とめ</rt></ruby>', kana: 'おかだ とめ', email: 'user35@example.com' },
  { id: 'u36', name: '<ruby>金子<rt>かねこ</rt></ruby> <ruby>ツル<rt>つる</rt></ruby>', kana: 'かねこ つる', email: 'user36@example.com' },
  { id: 'u37', name: '<ruby>川崎<rt>かわさき</rt></ruby> <ruby>サダ<rt>さだ</rt></ruby>', kana: 'かわさき さだ', email: 'user37@example.com' },
  { id: 'u38', name: '<ruby>菊地<rt>きくち</rt></ruby> <ruby>ハル<rt>はる</rt></ruby>', kana: 'きくち はる', email: 'user38@example.com' },
  { id: 'u39', name: '<ruby>久保<rt>くぼ</rt></ruby> <ruby>テル<rt>てる</rt></ruby>', kana: 'くぼ てる', email: 'user39@example.com' },
  { id: 'u40', name: '<ruby>黒田<rt>くろだ</rt></ruby> <ruby>フミ<rt>ふみ</rt></ruby>', kana: 'くろだ ふみ', email: 'user40@example.com' },
];

const mockTemplates = [
  { id: 't1', title: '【身体介護】入浴・排泄', content: '■入浴介助\n・バイタルチェック：異常なし\n・全身清拭・洗髪\n■排泄介助\n・オムツ交換：あり\n特記事項：特になし', category: 'kaeru' },
  { id: 't2', title: '【生活援助】掃除・洗濯', content: '■掃除\n・居室、トイレ、浴室の清掃\n■洗濯\n・衣類の洗濯と乾燥、畳み\n特記事項：特になし', category: 'kaeru' },
  { id: 't3', title: '【生活援助】調理・買物', content: '■買物代行\n・近隣スーパーにて食材調達\n■調理\n・昼食／夕食の準備（刻み食対応）\n特記事項：食欲あり', category: 'kaeru' }
];

window.MOCK_DATA = {
  helpers: mockHelpers,
  users: mockUsers,
  templates: mockTemplates
};
