const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000/api").replace(/\/$/, "");

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  let result = null;

  try {
    result = await response.json();
  } catch {
    result = null;
  }

  if (!response.ok) {
    const message =
      result?.message ||
      result?.error ||
      "İşlem tamamlanamadı. Lütfen daha sonra tekrar dene.";
    throw new Error(message);
  }

  return result?.data ?? result;
}

function toRequestBody(payload) {
  return {
    title: payload.title?.trim() || undefined,
    idea: payload.idea?.trim(),
    topic: payload.idea?.trim(),
    character: payload.character?.trim() || undefined,
    place: payload.place?.trim() || undefined,
    genre: payload.genre,
    tone: payload.tone,
    visualStyle: payload.visualStyle,
    duration: payload.duration,
    length: payload.duration,
    narrator: payload.narrator,
  };
}

export function getStoryId(story) {
  return story?.id || story?._id || story?.storyId;
}

export async function getStories() {
  const result = await request("/stories");
  return Array.isArray(result) ? result : result?.stories || [];
}

export async function getStoryById(storyId) {
  return request(`/stories/${storyId}`);
}

export async function createStory(payload) {
  return request("/stories/generate", {
    method: "POST",
    body: JSON.stringify(toRequestBody(payload)),
  });
}

export async function generateStoryImages(storyId) {
  return request(`/stories/${storyId}/images`, {
    method: "POST",
  });
}

export async function generateStoryAudio(storyId) {
  return request(`/stories/${storyId}/audio`, {
    method: "POST",
  });
}

export async function generateStoryVideo(storyId) {
  return request(`/stories/${storyId}/video`, {
    method: "POST",
  });
}

export async function generateStorySubtitles(storyId) {
  return request(`/stories/${storyId}/subtitles`, {
    method: "POST",
  });
}

export async function deleteStory(storyId) {
  return request(`/stories/${storyId}`, {
    method: "DELETE",
  });
}