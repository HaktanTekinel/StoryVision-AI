const { query } = require("../config/db");

const upsertStoryVideo = async ({
  storyId,
  videoUrl,
  videoPath,
  transitionEffect = "fade",
  status,
  errorMessage = null,
}) => {
  const result = await query(
    `
    INSERT INTO story_video (
      story_id,
      video_url,
      video_path,
      transition_effect,
      status,
      error_message
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (story_id)
    DO UPDATE SET
      video_url = EXCLUDED.video_url,
      video_path = EXCLUDED.video_path,
      transition_effect = EXCLUDED.transition_effect,
      status = EXCLUDED.status,
      error_message = EXCLUDED.error_message,
      updated_at = now()
    RETURNING *
    `,
    [storyId, videoUrl, videoPath, transitionEffect, status, errorMessage]
  );

  return result.rows[0];
};

const updateStoryVideoSubtitles = async ({
  storyId,
  subtitleUrl,
  subtitlePath,
}) => {
  const result = await query(
    `
    INSERT INTO story_video (
      story_id,
      video_url,
      video_path,
      subtitle_url,
      subtitle_path,
      transition_effect,
      status
    )
    VALUES ($1, NULL, NULL, $2, $3, 'fade', 'ready')
    ON CONFLICT (story_id)
    DO UPDATE SET
      subtitle_url = EXCLUDED.subtitle_url,
      subtitle_path = EXCLUDED.subtitle_path,
      updated_at = now()
    RETURNING *
    `,
    [storyId, subtitleUrl, subtitlePath]
  );

  return result.rows[0];
};

module.exports = {
  upsertStoryVideo,
  updateStoryVideoSubtitles,
};