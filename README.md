# StoryVision-AI

StoryVision AI backend uygulamasi.

## Kurulum

1. `backend/.env.example` dosyasini kopyalayip `backend/.env` olarak kaydedin.
2. `GEMINI_API_KEY` alanini Google AI Studio'dan aldiginiz key ile doldurun.
3. `backend` klasorune girin.
4. Bagimliliklari kurun:

```bash
npm install
```

5. Uygulamayi calistirin:

```bash
npm run dev
```

## Simdiki durum

- Express tabanli API yapisi kurulu.
- Hikaye ve prompt endpointleri Gemini API ile calisiyor.
- Medya endpointleri halen demo akista.
- CORS, basic validation ve merkezi hata yonetimi eklendi.
- Veri tabani entegrasyonu henuz eklenmedi.
