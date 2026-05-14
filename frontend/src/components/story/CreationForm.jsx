import { useState } from "react";
import {
  durationOptions,
  genreOptions,
  narratorOptions,
  toneOptions,
  visualStyleOptions,
} from "../../constants/storyOptions.js";
import Button from "../ui/Button.jsx";

const initialForm = {
  title: "",
  idea: "",
  character: "",
  place: "",
  genre: genreOptions[0],
  tone: toneOptions[0],
  visualStyle: visualStyleOptions[0],
  duration: durationOptions[1],
  narrator: narratorOptions[0],
};

export default function CreationForm({ onSubmit, isSubmitting }) {
  const [form, setForm] = useState(initialForm);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit(form);
  }

  return (
    <form className="creation-form" onSubmit={handleSubmit}>
      <label className="field field-wide">
        <span>Hikâye fikri</span>
        <textarea
          name="idea"
          value={form.idea}
          onChange={updateField}
          placeholder="Örn: Ay ışığında kaybolan bir melodiyi bulmaya çalışan küçük bir mucit..."
          rows="5"
          required
        />
      </label>

      <label className="field">
        <span>Başlık</span>
        <input
          name="title"
          value={form.title}
          onChange={updateField}
          placeholder="Başlığı boş bırakırsan otomatik oluşur"
        />
      </label>

      <label className="field">
        <span>Ana karakter</span>
        <input
          name="character"
          value={form.character}
          onChange={updateField}
          placeholder="Mira, Deniz, Atlas..."
        />
      </label>

      <label className="field">
        <span>Mekân</span>
        <input
          name="place"
          value={form.place}
          onChange={updateField}
          placeholder="Eski bir sahil kasabası"
        />
      </label>

      <label className="field">
        <span>Tür</span>
        <select name="genre" value={form.genre} onChange={updateField}>
          {genreOptions.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Anlatım tonu</span>
        <select name="tone" value={form.tone} onChange={updateField}>
          {toneOptions.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Görsel tarz</span>
        <select name="visualStyle" value={form.visualStyle} onChange={updateField}>
          {visualStyleOptions.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Uzunluk</span>
        <select name="duration" value={form.duration} onChange={updateField}>
          {durationOptions.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Ses tarzı</span>
        <select name="narrator" value={form.narrator} onChange={updateField}>
          {narratorOptions.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
      </label>

      <div className="form-actions field-wide">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Hazırlanıyor..." : "Hikâyeyi Oluştur"}
        </Button>
      </div>
    </form>
  );
}
