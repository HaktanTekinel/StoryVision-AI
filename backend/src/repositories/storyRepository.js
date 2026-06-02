const { getClient, query } = require("../config/db");

const parseJson = (value, fallback) => {
  if (!value) return fallback;

  if (typeof value === "object") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const mapSceneRow = (row) => ({
  id: row.id,
  sceneOrder: row.scene_order,
  order: row.scene_order,
  title: row.title,
  description: row.description,
  prompt: row.prompt,
  imageUrl: row.image_url,
  imagePath: row.image_path,
  mood: row.mood,
  status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapStoryRow = (row) => {
  const mediaStatus = parseJson(row.media_status_json, {
    images: "pending",
    audio: "pending",
    video: "pending",
    subtitles: "pending",
  });

  const paragraphs = parseJson(row.paragraphs_json, []);

  return {
    id: row.id,
    title: row.title,
    idea: row.idea,
    generatedPrompt: row.generated_prompt,
    prompt: row.generated_prompt,

    text: row.text_content,
    content: row.text_content,
    paragraphs,

    synopsis: row.synopsis,
    summary: row.synopsis,

    genre: row.genre,
    tone: row.tone,
    visualStyle: row.visual_style,
    visual_style: row.visual_style,

    character: row.character_name,
    characterName: row.character_name,
    place: row.place,
    narrator: row.narrator,

    mediaStatus,
    targetSceneCount: row.target_scene_count,
    status: row.status,

    audioUrl: row.audio_url,
    audioPath: row.audio_path,
    videoUrl: row.video_url,
    videoPath: row.video_path,
    subtitleUrl: row.subtitle_url,
    subtitlePath: row.subtitle_path,
    transitionEffect: row.transition_effect,

    createdAt: row.created_at,
    created_at: row.created_at,
    updatedAt: row.updated_at,
    updated_at: row.updated_at,
  };
};

const listStories = async () => {
  const result = await query(
    `
    SELECT
      s.*,
      a.audio_url,
      a.audio_path,
      v.video_url,
      v.video_path,
      v.subtitle_url,
      v.subtitle_path,
      v.transition_effect
    FROM story s
    LEFT JOIN story_audio a ON a.story_id = s.id
    LEFT JOIN story_video v ON v.story_id = s.id
    ORDER BY s.created_at DESC
    `
  );

  return result.rows.map(mapStoryRow);
};

const getStoryById = async (storyId) => {
  const storyResult = await query(
    `
    SELECT
      s.*,
      a.audio_url,
      a.audio_path,
      v.video_url,
      v.video_path,
      v.subtitle_url,
      v.subtitle_path,
      v.transition_effect
    FROM story s
    LEFT JOIN story_audio a ON a.story_id = s.id
    LEFT JOIN story_video v ON v.story_id = s.id
    WHERE s.id = $1
    `,
    [storyId]
  );

  if (storyResult.rows.length === 0) {
    return null;
  }

  const sceneResult = await query(
    `
    SELECT *
    FROM story_scene
    WHERE story_id = $1
    ORDER BY scene_order ASC
    `,
    [storyId]
  );

  return {
    ...mapStoryRow(storyResult.rows[0]),
    scenes: sceneResult.rows.map(mapSceneRow),
    images: sceneResult.rows.map(mapSceneRow),
  };
};

const createStory = async (payload) => {
  const client = await getClient();

  try {
    await client.query("BEGIN");

    const storyResult = await client.query(
      `
      INSERT INTO story (
        title,
        idea,
        generated_prompt,
        text_content,
        paragraphs_json,
        synopsis,
        genre,
        tone,
        visual_style,
        character_name,
        place,
        narrator,
        media_status_json,
        target_scene_count,
        status
      )
      VALUES (
        $1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9, $10, $11, $12, $13::jsonb, $14, $15
      )
      RETURNING *
      `,
      [
        payload.title,
        payload.idea,
        payload.generatedPrompt,
        payload.content,
        JSON.stringify(payload.paragraphs || []),
        payload.synopsis,
        payload.genre,
        payload.tone,
        payload.visualStyle,
        payload.characterName,
        payload.place,
        payload.narrator,
        JSON.stringify(
          payload.mediaStatus || {
            images: "pending",
            audio: "pending",
            video: "pending",
            subtitles: "pending",
          }
        ),
        payload.targetSceneCount || 3,
        payload.status || "ready",
      ]
    );

    const story = storyResult.rows[0];

    for (let index = 0; index < payload.scenes.length; index += 1) {
      const scene = payload.scenes[index];

      await client.query(
        `
        INSERT INTO story_scene (
          story_id,
          scene_order,
          title,
          description,
          prompt,
          mood,
          status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        `,
        [
          story.id,
          index + 1,
          scene.title,
          scene.description,
          scene.prompt,
          scene.mood,
          "pending",
        ]
      );
    }

    await client.query("COMMIT");

    return getStoryById(story.id);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const deleteStory = async (storyId) => {
  const result = await query(
    `
    DELETE FROM story
    WHERE id = $1
    RETURNING id
    `,
    [storyId]
  );

  return result.rows.length > 0;
};

module.exports = {
  listStories,
  getStoryById,
  createStory,
  deleteStory,
};