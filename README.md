# COVID-19 LINE Bot

[![Code Style: Google](https://img.shields.io/badge/code%20style-google-blueviolet.svg)](https://github.com/google/gts)

Sebuah chatbot sederhana pada platform LINE sebagai sarana edukasi masyarakat umum dan kanal informasi mengenai perkembangan COVID-19 di Indonesia.

Anda dapat menambahkan _chatbot_ sebagai teman pada aplikasi LINE dengan men-_scan_ QR Code dibawah ini

<p align="center">
  <img src="docs/qr-code.png" title="QR Code" alt="QR Code" />
</p>

## Fitur

1. Menjawab pertanyaan dasar mengenai pandemi COVID-19 (Apa itu COVID-19, Apa yang harus saya lakukan, dan lain-lain). Informasi diambil dari [laman resmi WHO mengenai COVID-19](https://www.who.int/emergencies/diseases/novel-coronavirus-2019/question-and-answers-hub/q-a-detail/q-a-coronaviruses).
2. Menyajikan data perkembangan COVID-19 di Indonesia (data diambil dari [COVID-19 API oleh mathdroid](https://github.com/mathdroid/covid-19-api))
3. Mencari rumah sakit rujukan terdekat dari posisi pengguna chatbot (data diambil dari [situs gugus tugas percepatan penanganan COVID-19 BNPB](https://bnpb-inacovid19.hub.arcgis.com/))
4. Penggunaan _rich menu_ untuk mempermudah proses interaksi dengan pengguna. Seluruh ikon yang digunakan berasal dari Material Design Icons dan [Adrian Coquet, yang diambil dari The Noun Project](https://thenounproject.com/)

## Tech Stack

1. JavaScript (ES2017)
2. Typescript 3.8.x

## Catatan

Apabila anda mengunjungi laman dari dari paper dengan judul 'Pemanfaatan Chatbot Sebagai Sumber Informasi Mengenai COVID-19 di Indonesia', silahkan mengacu pada [_commit_ ini](https://github.com/Namchee/COVID-19-LINE-Bot/tree/9a1e6b557992c050351d1a1458da97b4ab785ed2)

## Lisensi

Project ini dilisensikan menggunakan lisensi [MIT](LICENSE)
