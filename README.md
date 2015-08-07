# The general circulation of the atmosphere: A numerical experiment

Re-implementation of ["The general circulation of the atmosphere: A numerical experiment(Philips, 1956)"](http://onlinelibrary.wiley.com/doi/10.1002/qj.49708235202/abstract) by TypeScript.

# Online demo

https://cdn.rawgit.com/ledyba/philips-general-circulation/master/index.html

[![demo](https://raw.githubusercontent.com/ledyba/philips-general-circulation/master/demo.png)](https://cdn.rawgit.com/ledyba/philips-general-circulation/master/index.html)

# How to build?

Please install [TypeScript](http://www.typescriptlang.org/) first.

```bash
sudo apt-get install npm # if you are ubuntu / debian user
sudo brew install npm # if you are osx user
npm i -g typescript
```

Then, compile sources with tsc.

```bash
tsc
```

# License

GPL v3 or later. Please see [LICENSE](https://github.com/ledyba/philips-general-circulation/blob/master/LICENSE)

# Document (in Japanese)

　今回は世界で初めて大気の大循環モデルを構築して当時のコンピュータで計算した[Philips 1956][]の再現をし、ほぼ彼と同じ結果が出ることを確認しました。

　さらに[Philips 1959][]で（本人によって）指摘されている非線形数値不安定への対策として、[Arakawa 1966][]による荒川ヤコビアンと[Asselin 1972][]で紹介されているタイム・フィルタを導入し、10年以上の長期積分が可能になることを確かめました。

## (1956年当時の)背景

（この項は、ほぼ[Ariga 2008][]をまとめ直したものです）

　1940年から1950年台の前半に掛けて、気象学、とくに大気大循環論は大きな転換期を迎えていました。

　従来から[パイロット・バルーン](https://ja.wikipedia.org/wiki/%E6%B8%AC%E9%9B%B2%E6%B0%97%E7%90%83)による雲高や雲速度の観測は行われていましたが、第二次世界大戦前後に[ラジオゾンデ](https://ja.wikipedia.org/wiki/%E3%83%A9%E3%82%B8%E3%82%AA%E3%82%BE%E3%83%B3%E3%83%87)や観測機を積んだ飛行機、[気象レーダー](https://ja.wikipedia.org/wiki/%E6%B0%97%E8%B1%A1%E3%83%AC%E3%83%BC%E3%83%80%E3%83%BC)による気象観測網が整備されました。それに伴っていままでよく分かっていなかった大気高層のデータが次々ともたらされ([Lewis 1998][])、それらの大気大循環がなぜ起こるのかについて様々な説が提唱され、「混沌とした[正野 1953]」状況となっていました。

---

<img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Ceiling_balloon.JPG/1024px-Ceiling_balloon.JPG" alt="パイロットバルーン" width="200px" />  
パイロットバルーン。遠くからもわかるように、赤く着色されている。  
（[Wikipedia](https://commons.wikimedia.org/wiki/File:Ceiling_balloon.JPG)から引用、パブリックドメイン）  


---

![ラジオゾンデ](http://www.jma.go.jp/jma/kishou/know/upper/sondeRS92SGP06G01GM.jpg)  
ラジオゾンデ([気象庁のページ](http://www.jma.go.jp/jma/kishou/know/upper/kaisetsu.html)から引用。)

---

![気象レーダー](http://www.jma-net.go.jp/sapporo/tenki/calendar/today/img/fujisan_rader.jpg)  
富士山にあった気象レーダー。  
([気象庁のページ](http://www.jma-net.go.jp/sapporo/tenki/calendar/today/0310.html)から引用。いまは富士山レーダーは稼働していない。)

---

　大気の大循環に簡単にまとめておきます。

　地球は赤道は暖かく、北極と北極では冷たい温度差ができています。これは、太陽光の入射角の違いによるものです。この温度差によって、もし地球が自転していなければ、（小学校の理科の実験でビーカーを底から温めた時と同じように）ハドレーが考えた下の図のような対流が起こるはずです。暖かいところ（赤道）では空気が軽くなるので上昇し、冷たいところ（極）では空気が重くなるので下降していることに注意してください。

　このように大気（やほかにも海水や蒸気など）を介して熱が移動することで南北の温度差が打ち消されるはたらきを、大気大循環といいます。もしこの働きがなければ、赤道は今よりもずっと熱くなり続け、北極と南極ではずっと冷たくなり続けるでしょう。

---

![ハドレー循環](http://fnorio.com/0041circulation_of_atmosphere1/fig1-1.gif)  
ハドレーの1735年のモデル。  
([fnorio.com](http://fnorio.com/0041circulation_of_atmosphere1/circulation_of_atmosphere1.htm)から引用)

---

　しかし観測と理論の進歩から、次第にこのハドレーのモデルは不適切であることが明らかになり、別のモデルが考えられるようになります。いくつかあったようですが、その中でも支持を受けたのがロスビーによる３細胞説です。

　まず、地球を高緯度・中緯度・低緯度の３つに分けて考えます。

---

![ロスビーの３細胞](http://www.jma-net.go.jp/ishigaki/school/200406/pic/Globe.jpg)  
([jma-net](http://www.jma-net.go.jp/ishigaki/school/200406/WeatherSchool_200406.html)から引用)

---

　この３つの緯度帯では、図のように高緯度では極偏東風、中緯度では偏西風、低緯度では貿易風（東風）が吹いています。偏西風の上空ではとくに強い風が吹く部分があり、これはジェット気流と呼ばれています。このジェット気流は、第二次世界大戦前後の観測網の発達による重要な発見の一つです。

　さらに、この偏西風は東西にまっすぐに吹いているわけではなく、南北に蛇行しています。この蛇行は強くなった弱くなったり数週間のサイクルで変動しているのですが、蛇行の程度を東西指標（Zonal Index）によって測っていることから「インデックス・サイクル」と呼びます。

　このように東風と西風が吹いている領域が分かれていて、しかもそれが安定して維持されていること、さらにジェット気流が存在することは、当時説明することが困難でした。

　さて、このロスビーのモデルでは、極偏東風、偏西風、貿易風の三つに分かれているのと対応して、循環も三つのセル（細胞）に分かれている、とされます。ただし、そうすると低緯度のハドレー循環と高緯度の極循環では（ビーカーの水と同じように）暖かい（南の）空気が持ち上がり冷たい（北の）空気が下がる「直接循環」なのに対し、中緯度帯のフェレル循環ではその逆の、暖かい空気が下がり冷たい空気が上がる「間接循環」になっています。これは明らかに直感に反しており、ロスビーのモデルを正当化するには何かしらの説明が必要になってきます。

---

![台風](https://raw.githubusercontent.com/ledyba/philips-general-circulation/master/img/typhoon.jpg)  
台風は非常に強力な低気圧だ。  
（NASAのウェブサイト:[Super Typhoon Vongfong in the Philippine Sea](http://www.nasa.gov/content/super-typhoon-vongfong-in-the-philippine-sea)より引用）

---

　ロスビー達は、中緯度帯の低気圧と高気圧にも着目しました。低気圧や高気圧は、地球が回転していることによって生じる地衡流の関係から、流体力学的な 渦 （擾乱） として振る舞います。この低気圧や高気圧の東西方向の移動が、大気大循環の大きな割合をしめる、つまり、低緯度から高緯度への角運動量やエネルギーの輸送の多くを担っていると考えるようになりました。

　この見方は、子午面（鉛直面）での循環が大事というハドレー的な見方と相対するため、大循環においてどちらが本質的なのかというのが当時の大きな論点だったようです。

　Philipsの1956年の実験は、こうした当時の状況のもとで、「渦による輸送が大きいのだ」ということをコンピュータを用いた実験で示した、という意味があるといえます。

### 数値実験前夜：「洗い桶」実験

（この項も、ほぼ[Ariga 2008][]をまとめ直したものです）

　Philipsの実験の裏には、「洗い桶」実験の存在があります。この実験は大気大循環の実験のうち最も簡単なもので、金属製の洗い桶（Dishpan）のふちを暖めて内側と外側で温度差を作り出した上で回転させ、その時水がどう振る舞うかを観察することで、大気の性質を類推するというものです。（本当に「洗い桶」を使ってる実験もありますが、必ずしも「洗い桶」だけに限るわけではありません）

---

<img src="http://www.gstatic.com/hostedimg/79363f4b6b7c1fa4_large" alt="Dishpan Weather" width="300px" />  
["Dishpan Weather" Experiments At University Of Chicago](http://images.google.com/hosted/life/79363f4b6b7c1fa4.html)より引用。

---

　Philipsの実験に先立つ1953年に、気象雑誌に載ったHideによる実験報告([Hide 1953][])で、彼は同心円筒を組み合わせた実験装置の間に水を入れ、外側の円筒を加熱して回転させる実験を行っています（この報告には図も写真も無いのですが、文章を読む限りは上の写真のようなものでしょうか）。これは地球の一部の緯度帯を極からの同心円状に切り取ったものを模していて、温度の高い外側が低緯度、温度の低い方が高緯度側に対応しています。

---

![](https://raw.githubusercontent.com/ledyba/philips-general-circulation/master/img/hide.jpg)  
[Ariga 2008][]から孫引き。（元の論文を発見できなかった）

---

　何度かロスビー数というパラメータを変えて実験すると、上の３つの図のように違った流れのパターンを示すことをハイド発見しました。ロスビー数は、そのモデルの典型的な流れの速度Uと水平方向の距離L、そしてコリオリパラメータf（＝2Ω; Ωは系の回転角速度）によってR=L/fLで定義され、流体の振る舞いを特徴付けるパラメータです。このパラメータを調節することで、水という流体によって地球の空気という異なる流体のふるまいを再現させることができます。

　ロスビー数が大きい場合、上の図の一番左のように回転軸に対して対称的な流れができ、さらに断面を見ると外側で上昇して内側で下降する、「ハドレー的な直接循環」になっていました。一方、ロスビー数を小さくしていくと真ん中の図のように蛇行しながら「東向きに（回転方向を地球の北半球になぞらえています）」規則的な流れができ、しかも「数週間（この水槽では、一回転が「一日」に対応します）」でこの流れのパターンは変動した、と報告しています。

　これはまさに、蛇行するジェット気流と数週間で変動するインデックス・サイクルを彷彿とさせます。

　でも、ちょっと考えると。この実験で使われた水槽は、現実の地球大気とは殆ど似ていません。この水槽には地球上にあるような大陸や山のような地形は何も反映されていませんし、容器の温め方もとくに現実に対応するように決めているわけではないようです。そもそもこの実験は、「回転する流体中での熱流体の理解」を、「地磁気の起源」を研究するために行われたもので、地球の大気を再現するために始めたものではありません。

　それでも、この水槽実験は現実の大気大循環をうまく捉えた結果を示しています。Philipsもこの結果には注目しており、[Philips 1956][]でもこのように書かれています。

> In spite of the obvious dissimilarities between the laboratory set-up and the atmostphere(one has but to consider, for example, the spherical shape of the earth and the presence of heating and cooling), certain of the experimental flow patterns are remarkably like those encountered on weather maps.  
> Thus one is almost forced to the conclusion that at least the gross features of the general circulation of the atmosphere can be predicted without having specify the heating and cooling in great deal.

> 実験の状況と大気の明らかな相違（加熱と冷却の存在や、地球の球の形は考慮されているが）にも関わらず、実験によって得られた流れのパターンは現実の天気図と著しく似ている。
> となれば、大循環と大気の総体的な特徴は、冷却と加熱の細部を特定しなくても再現できると、ほぼ結論付さるをえない。

　Philipsがこの実験を行った裏には、この回転水槽実験に基づいた「簡単なモデルでも、特徴を捉えていれば大気の大循環は再現できるはずだ」という確信があったのです。

### 数値実験前夜： 「リチャードソンの夢」とコンピュータの誕生

　複雑な数式を繰り返し何度も計算する数値計算による実験を行うにはコンピュータが不可欠です。…と言いたい所ですが、無くてもできます。手計算ですればよいのです。実際にそれを行った人がいます。[リチャードソン](https://ja.wikipedia.org/wiki/%E3%83%AB%E3%82%A4%E3%82%B9%E3%83%BB%E3%83%95%E3%83%A9%E3%82%A4%E3%83%BB%E3%83%AA%E3%83%81%E3%83%A3%E3%83%BC%E3%83%89%E3%82%BD%E3%83%B3)です。しかもコンピュータが実用になる遥か前の1922年。

　この計算では鉛直方向に大気を５層に分け（今回のPhilipsのモデルは二層です）、200km間隔の格子点による計算モデルで、６時間先まで計算するのに一ヶ月以上かかったそうです([気象庁ウェブサイトでの解説](http://www.jma.go.jp/jma/kishou/know/whitep/1-3-2.html))。

---

![](https://upload.wikimedia.org/wikipedia/commons/7/7e/Lewis_Fry_Richardson.png)  
[ルイス・フライ・リチャードソン](https://ja.wikipedia.org/wiki/%E3%83%AB%E3%82%A4%E3%82%B9%E3%83%BB%E3%83%95%E3%83%A9%E3%82%A4%E3%83%BB%E3%83%AA%E3%83%81%E3%83%A3%E3%83%BC%E3%83%89%E3%82%BD%E3%83%B3)。Wikipediaから引用、パブリックドメイン。

---

　しかし、使った数値計算の手法に難があり（たとえ正しい微分方程式を使っていても、どう数値計算するかで計算できるかどうか変わってしまいます）、非現実的な値が出て失敗してしまいました。

　それでも彼は諦めず、
「6万4千人が大きなホールに集まり一人の指揮者の元で整然と計算を行えば、実際の時間の進行と同程度の速さで予測計算を実行できる」と見積もりました。これを「リチャードソンの夢」と呼びます。

---

![](http://www.jma.go.jp/jma/kishou/know/whitep/img/concert.png)  
リチャードソンの夢見たお天気工場の想像図。([気象庁](http://www.jma.go.jp/jma/kishou/know/whitep/1-3-2.html)から引用)

---

　もちろん現代の天気予報は6万4千人が必死に計算しているわけではなく、コンピュータで計算されています。世界で最初の汎用コンピュータは[ENIAC](https://ja.wikipedia.org/wiki/ENIAC)で、第二次世界大戦での軍事的なニーズから開発されました。

---

![](https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Eniac.jpg/628px-Eniac.jpg)  
ENIAC。([Wikipedia](https://ja.wikipedia.org/wiki/ENIAC)から引用、パブリックドメイン。)

---

　ENIACはもともとは弾道計算のために開発されましたが、ロスアラモス国立研究所の[ジョン・フォン・ノイマン](https://ja.wikipedia.org/wiki/%E3%82%B8%E3%83%A7%E3%83%B3%E3%83%BB%E3%83%95%E3%82%A9%E3%83%B3%E3%83%BB%E3%83%8E%E3%82%A4%E3%83%9E%E3%83%B3)が目をつけ、水爆実験や放射性物質に関する計算に使われました。そして1946年にはCharneyたちが世界初の数値計算による天気予報プロジェクト（NWP; Numerical Weather Prediction)をプリンストンのPrinceton's Institute for Advanced Study(IAS)で始め、３年後には数日間の短期予報に成功させます（[Charney 1950][]）。

　このCharneyたちのモデルではロスビーの研究した順圧（バロトロピック）渦度方程式に地衡風近似を加えた上でリチャードソンの失敗を避けるようなモデルを作り、1952年にはプリンストンのコンピュータを用いて米国東部を襲った大嵐の予報にも成功しています([新田 2009][])。

　ただし、このモデルでは数日間の短い予報を目的としていて、低気圧は観測データによる初期値から与えたエネルギーで発生するのみで、洗い桶実験のように加熱を加えて自発的に循環が起こるようなものにはなっていません。

　現在の初期値から数日後の天気を予測しようとするこれらの初期のモデルとは違い、Philipsのモデルはゼロの状態から大気の大循環を計算機の上で起こすこと、それによって「大気大循環の原理を理解すること」を目的としている、というのが大きな違いです。

　ただし、双方が物理的に精緻になっていった結果、現在では予報モデルと大循環に大きな違いはなくなっています。

## 方程式系：準地衡流方程式系

　では、これらの背景を踏まえた上で、まずは流体の運動について軽く紹介します。一般の気体の振る舞いは、運動方程式であるナヴィエ＝ストークス方程式と気体の状態方程式、そして質量保存則である連続の式の３つを連立させることで、流体の速度と圧力と密度のそれぞれを時間の関数として表すことができま…せん。

---

![](https://raw.githubusercontent.com/ledyba/philips-general-circulation/master/img/nseq.png)  
ナヴィエ＝ストークス方程式（運動方程式）

![](https://raw.githubusercontent.com/ledyba/philips-general-circulation/master/img/stateeq.png)  
理想気体の状態方程式

![](https://raw.githubusercontent.com/ledyba/philips-general-circulation/master/img/conteq.png)  
連続の式（空気は増えも減りもしない；質量保存速）

---

　少なくとも、現在の人類にはできません。というのも、速度と圧力と密度のそれぞれを時間の関数として表すためには、この３つの非線形連立偏微分方程式を解かなくてはなりませんが、一般にそれは極めて難しく、流体の方程式も例外ではありません。ナヴィエ＝ストークス方程式に関しては滑らかな解が一般に存在するかどうかすら分かっていません([Navier–Stokes existence and smoothness](https://en.wikipedia.org/wiki/Navier%E2%80%93Stokes_existence_and_smoothness))。この問題は100万ドルの懸賞が掛けられている[ミレニアム懸賞問題](https://ja.wikipedia.org/wiki/%E3%83%9F%E3%83%AC%E3%83%8B%E3%82%A2%E3%83%A0%E6%87%B8%E8%B3%9E%E5%95%8F%E9%A1%8C)の一つで、他にはポアンカレ予想やP≠NP問題のような有名な難問が並んでいます。

　さて、地球物理学の場合、上の一般の流体からさらに地球特有の効果が付きます。それは[コリオリ力](https://ja.wikipedia.org/wiki/%E3%82%B3%E3%83%AA%E3%82%AA%E3%83%AA%E3%81%AE%E5%8A%9B)と重力です。これらの効果を加えて変形していったものが、プリミティブ方程式系です。



## 実験設定

## 実装の比較

## 結果

## 荒川ヤコビアンとタイムフィルタ

## エネルギー循環

## 参考文献
[[Philips 1956][]] PHILLIPS, Norman A. The general circulation of the atmosphere: A numerical experiment. Quarterly Journal of the Royal Meteorological Society, 1956, 82.352: 123-164.

[[Philips 1959][]] PHILLIPS, Norman A. An example of non-linear computational instability. The atmosphere and the sea in motion, 1959, 501.

[正野 1953] 正野, 重片「新しい大気循環論」『科学』第23巻(1953), 332-338, 416-422.

[[Lewis 1998][]] LEWIS, John M. Clarifying the dynamics of the general circulation: Phillips's 1956 experiment. Bulletin of the American Meteorological Society, 1998, 79.1: 39-60.

[[Kawai 2011][]] 河合, 祐太. 準地衡風 2 層モデルを用いた中緯度大気循環の研究. 神戸大学 理学部 地球惑星科学科, 卒業論文.

[[Ariga 2008][]] 有賀, 暢迪. 洗い桶からコンピュータへ : 大気大循環モデルによるシミュレーションの誕生. 科学哲学科学史研究, 2008, 2: 61-74.

[[Arakawa 1966][]] ARAKAWA, Akio. Computational design for long-term numerical integration of the equations of fluid motion: Two-dimensional incompressible flow. Part I. Journal of Computational Physics, 1966, 1.1: 119-143.

[[Asselin 1972][]] ASSELIN, Richard. Frequency filter for time integrations. Monthly Weather Review, 1972, 100.6: 487-490.

[[Hide 1953][]] HIDE, R. Some experiments on thermal convection in a rotating liquid. Quarterly Journal of the Royal Meteorological Society, 1953, 79.339: 161-161.

[[Charney 1950][]] CHARNEY, Jules G.; FJÖRTOFT, Ragnar; VON NEUMANN, John. Numerical integration of the barotropic vorticity equation. Tellus A, 1950, 2.4.

[[新田 2009][]] 新田, 尚. 数値予報の歴史. 2009年度春季大会 公開気象講演会「数値予報の過去・現在・未来―数値予報現業運用開始50周年記念―」の報告

[Philips 1956]:  http://onlinelibrary.wiley.com/doi/10.1002/qj.49708235202/abstract
[Lewis 1998]: http://journals.ametsoc.org/doi/abs/10.1175/1520-0477(1998)079%3C0039:CTDOTG%3E2.0.CO;2
[Kawai 2011]: http://www.gfd-dennou.org/arch/prepri/2011/kobe-u/110212_ykawai-Bthesis/paper/pub/main.pdf
[Ariga 2008]: http://repository.kulib.kyoto-u.ac.jp/dspace/handle/2433/56988
[Philips 1959]: https://www.ualberta.ca/~eec/Phillips_NLInstablity.pdf
[Arakawa 1966]: http://www.sciencedirect.com/science/article/pii/0021999166900155
[Asselin 1972]: http://journals.ametsoc.org/doi/abs/10.1175/1520-0493(1972)100%3C0487:FFFTI%3E2.3.CO;2
[Hide 1953]: http://onlinelibrary.wiley.com/doi/10.1002/qj.49707933916/abstract
[Charney 1950]: http://www.tellusa.net/index.php/tellusa/article/download/8607/10052
[新田 2009]: http://www.metsoc.jp/tenki/pdf/2009/2009_11_0004.pdf
