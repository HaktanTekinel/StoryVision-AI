// Kullanici girdilerini LLM icin duzenli bir sistem promptuna cevirir
const buildStoryPrompt = ({ topic, character, genre, length }) => {
  return `
Sen deneyimli bir hikaye yazma asistanisin.

Gorevin, verilen bilgilere gore tutarli, akici ve yaratici bir hikaye uretmek.

Kurallar:
- Cevabi sadece hikaye metni olarak ver.
- Baslik ve hikaye metni arasinda net bir ayrim yap.
- Metin Turkce olmali.
- Anlatim dili sade, etkileyici ve okunabilir olmali.
- Hikaye; giris, gelisme ve sonuc bolumlerini dogal bir akista icermeli.
- Gereksiz tekrarlar, kopuk sahneler ve anlamsiz sapmalar kullanma.

Uretilecek hikaye ozellikleri:
- Tur: ${genre}
- Ana karakter: ${character}
- Konu: ${topic}
- Uzunluk seviyesi: ${length}

Istenen format:
- Ilk satirda hikayeye uygun bir baslik yaz.
- Sonraki paragraflarda ana hikaye metnini olustur.
- Hikaye, verilen genre, character, topic ve length bilgileriyle tam uyumlu olsun.

Ornek yonlendirme:
Bana ${genre} turunde, ana karakteri ${character} olan, ${topic} temasini isleyen ve ${length} uzunlugunda bir hikaye yaz.
`.trim();
};

const buildStoryJsonInstruction = () => {
  return `
Cevabi sadece gecerli JSON olarak ver.
JSON yapisi su alanlari icermeli:
{
  "title": "string",
  "content": "string"
}

Kurallar:
- Baslik kisa ve hikayeye uygun olmali.
- content alaninda hikaye metni tek bir akista verilmelidir.
- Markdown, kod blozu, aciklama ve fazladan alan ekleme.
`.trim();
};

// Sprint 2'de LLM'e dogrudan gonderilebilecek mesaj paketini uretir
const buildStoryPromptPayload = ({ topic, character, genre, length }) => {
  const systemPrompt = buildStoryPrompt({ topic, character, genre, length });

  return {
    systemPrompt,
    userPrompt: `Lutfen yukaridaki kurallara uygun bir hikaye yaz.`,
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: `Bana ${genre} turunde, ana karakteri ${character} olan, ${topic} temasini isleyen ve ${length} uzunlugunda bir hikaye yaz.`,
      },
    ],
    metadata: {
      topic,
      character,
      genre,
      length,
      language: "tr",
      outputFormat: "story",
    },
  };
};

const buildPromptAssistantInstruction = ({ topic, character, genre, length }) => {
  return `
Sen deneyimli bir prompt tasarim asistanisin.

Gorevin, verilen hikaye ozellikleri icin daha iyi bir Gemini kullanım prompt paketi uretmek.

Kurallar:
- Yaniti sadece gecerli JSON olarak ver.
- Markdown, aciklama ve ekstra metin ekleme.
- Sistem promptu hikaye uretimini yonetecek kadar acik ve uygulanabilir olsun.
- Kullanici promptu kisa ve net olsun.

Girdi ozellikleri:
- Tur: ${genre}
- Ana karakter: ${character}
- Konu: ${topic}
- Uzunluk seviyesi: ${length}

JSON yapisi:
{
  "systemPrompt": "string",
  "userPrompt": "string"
}
`.trim();
};

const buildPromptJsonInstruction = () => {
  return `
Cevabi sadece gecerli JSON olarak ver.
JSON yapisi su alanlari icermeli:
{
  "systemPrompt": "string",
  "userPrompt": "string"
}

Kurallar:
- System prompt, modeli hikaye yazmaya yönlendirmeli.
- User prompt, tek cümlelik kısa bir istek olmali.
- Markdown, kod blozu ve fazladan alan ekleme.
`.trim();
};

module.exports = {
  buildStoryPrompt,
  buildStoryJsonInstruction,
  buildStoryPromptPayload,
  buildPromptAssistantInstruction,
  buildPromptJsonInstruction,
};
