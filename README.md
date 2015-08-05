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

　1940年から1950年台の前半に掛けて、気象学、とくに大気大循環論は大きな転換期を迎えていました。

　従来から[パイロット・バルーン](https://ja.wikipedia.org/wiki/%E6%B8%AC%E9%9B%B2%E6%B0%97%E7%90%83)による雲高や雲速度の観測は行われていましたが、第二次世界大戦前後に[ラジオゾンデ](https://ja.wikipedia.org/wiki/%E3%83%A9%E3%82%B8%E3%82%AA%E3%82%BE%E3%83%B3%E3%83%87)や観測機を積んだ飛行機、[気象レーダー](https://ja.wikipedia.org/wiki/%E6%B0%97%E8%B1%A1%E3%83%AC%E3%83%BC%E3%83%80%E3%83%BC)による気象観測網が整備されました。それに伴っていままでよく分かっていなかった大気高層のデータが次々ともたらされ([Lewis 1998][])、それらの大気大循環がなぜ起こるのかについて様々な説が提唱され、「混沌とした[正野 1953]」状況となっていました。

<img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Ceiling_balloon.JPG/1024px-Ceiling_balloon.JPG" alt="パイロットバルーン" width="200px" />  
パイロットバルーン。（[Wikipedia](https://commons.wikimedia.org/wiki/File:Ceiling_balloon.JPG)から引用、パブリックドメイン）  
遠くからもわかるように、赤く着色されている。

![ラジオゾンデ](http://www.jma.go.jp/jma/kishou/know/upper/sondeRS92SGP06G01GM.jpg)  
ラジオゾンデ([気象庁のページ](http://www.jma.go.jp/jma/kishou/know/upper/kaisetsu.html)から引用。)

![気象レーダー](http://www.jma-net.go.jp/sapporo/tenki/calendar/today/img/fujisan_rader.jpg)  
富士山にあった気象レーダー。([気象庁のページ](http://www.jma-net.go.jp/sapporo/tenki/calendar/today/0310.html)から引用。いまは富士山レーダーは稼働していない。)

　大気の大循環に簡単にまとめておきます。

　地球は赤道は暖かく、北極と北極では冷たい温度差ができています。これは、太陽光の入射角の違いによるものです。この温度差によって、もし地球が自転していなければ、（小学校の理科の実験でビーカーを底から温めた時と同じように）下の図のような対流が起こるはずです。暖かいところ（赤道）では空気が軽くなるので上昇し、冷たいところ（極）では空気が重くなるので下降していることに注意してください。

![ハドレー循環](http://fnorio.com/0041circulation_of_atmosphere1/fig1-1.gif)  
ハドレーの1735年のモデル([fnorio.com](http://fnorio.com/0041circulation_of_atmosphere1/circulation_of_atmosphere1.htm)から引用)。

しかし観測と理論の進歩から、次第にこのモデルは不適切であることが明らかになり、別のモデルが考えられるようになります。いくつかあったようですが、その中でも支持を受けたのがロスビーによる３細胞説です。

![ロスビーの３細胞](http://www.jma-net.go.jp/ishigaki/school/200406/pic/Globe.jpg)  
([jma-net](http://www.jma-net.go.jp/ishigaki/school/200406/WeatherSchool_200406.html)から引用)

## 数値実験前夜：「洗い桶」実験

## 参考文献
[[Philips 1956][]] PHILLIPS, Norman A. The general circulation of the atmosphere: A numerical experiment. Quarterly Journal of the Royal Meteorological Society, 1956, 82.352: 123-164.

[[Philips 1959][]] PHILLIPS, Norman A. An example of non-linear computational instability. The atmosphere and the sea in motion, 1959, 501.

[正野 1953] 正野, 重片「新しい大気循環論」『科学』第23巻(1953), 332-338, 416-422.

[[Lewis 1998][]] LEWIS, John M. Clarifying the dynamics of the general circulation: Phillips's 1956 experiment. Bulletin of the American Meteorological Society, 1998, 79.1: 39-60.

[[Kawai 2011][]] 河合, 祐太. 準地衡風 2 層モデルを用いた中緯度大気循環の研究. 神戸大学 理学部 地球惑星科学科, 卒業論文.

[[Ariga 2008][]] 有賀, 暢迪. 洗い桶からコンピュータへ : 大気大循環モデルによるシミュレーションの誕生. 科学哲学科学史研究, 2008, 2: 61-74.

[[Arakawa 1966][]] ARAKAWA, Akio. Computational design for long-term numerical integration of the equations of fluid motion: Two-dimensional incompressible flow. Part I. Journal of Computational Physics, 1966, 1.1: 119-143.

[[Asselin 1972][]] ASSELIN, Richard. Frequency filter for time integrations. Monthly Weather Review, 1972, 100.6: 487-490.

[Philips 1956]:  http://onlinelibrary.wiley.com/doi/10.1002/qj.49708235202/abstract
[Lewis 1998]: http://journals.ametsoc.org/doi/abs/10.1175/1520-0477(1998)079%3C0039:CTDOTG%3E2.0.CO;2
[Kawai 2011]: http://www.gfd-dennou.org/arch/prepri/2011/kobe-u/110212_ykawai-Bthesis/paper/pub/main.pdf
[Ariga 2008]: http://repository.kulib.kyoto-u.ac.jp/dspace/handle/2433/56988
[Philips 1959]: https://www.ualberta.ca/~eec/Phillips_NLInstablity.pdf
[Arakawa 1966]: http://www.sciencedirect.com/science/article/pii/0021999166900155
[Asselin 1972]: http://journals.ametsoc.org/doi/abs/10.1175/1520-0493(1972)100%3C0487:FFFTI%3E2.3.CO;2
