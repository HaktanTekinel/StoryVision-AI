CREATE EXTENSION IF NOT EXISTS pgcrypto;

DROP TABLE IF EXISTS media_job CASCADE;
DROP TABLE IF EXISTS story_video CASCADE;
DROP TABLE IF EXISTS story_audio CASCADE;
DROP TABLE IF EXISTS story_scene CASCADE;
DROP TABLE IF EXISTS story CASCADE;

CREATE TABLE story (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    idea TEXT,
    generated_prompt TEXT,
    text_content TEXT NOT NULL,
    paragraphs_json JSONB,
    synopsis VARCHAR(500),
    genre VARCHAR(100),
    tone VARCHAR(100),
    visual_style VARCHAR(100),
    character_name VARCHAR(200),
    place VARCHAR(200),
    narrator VARCHAR(200),
    media_status_json JSONB,
    target_scene_count INT NOT NULL DEFAULT 3,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_story_status CHECK (status IN ('pending', 'processing', 'ready', 'failed', 'draft', 'archived')),
    CONSTRAINT ck_story_target_scene_count CHECK (target_scene_count >= 3)
);

CREATE TABLE story_scene (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID NOT NULL REFERENCES story(id) ON DELETE CASCADE,
    scene_order INT NOT NULL,
    title VARCHAR(200),
    description TEXT,
    prompt TEXT,
    image_url VARCHAR(500),
    image_path VARCHAR(500),
    mood VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_story_scene_status CHECK (status IN ('pending', 'processing', 'ready', 'failed')),
    CONSTRAINT uq_story_scene_story_order UNIQUE (story_id, scene_order)
);

CREATE INDEX ix_story_scene_story_id ON story_scene (story_id);

CREATE TABLE story_audio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID NOT NULL UNIQUE REFERENCES story(id) ON DELETE CASCADE,
    audio_url VARCHAR(500),
    audio_path VARCHAR(500),
    narrator VARCHAR(200),
    duration_seconds INT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_story_audio_status CHECK (status IN ('pending', 'processing', 'ready', 'failed')),
    CONSTRAINT ck_story_audio_duration CHECK (duration_seconds IS NULL OR duration_seconds >= 0)
);

CREATE INDEX ix_story_audio_story_id ON story_audio (story_id);

CREATE TABLE story_video (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID NOT NULL UNIQUE REFERENCES story(id) ON DELETE CASCADE,
    video_url VARCHAR(500),
    video_path VARCHAR(500),
    subtitle_url VARCHAR(500),
    subtitle_path VARCHAR(500),
    transition_effect VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_story_video_status CHECK (status IN ('pending', 'processing', 'ready', 'failed'))
);

CREATE INDEX ix_story_video_story_id ON story_video (story_id);

CREATE TABLE media_job (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID NOT NULL REFERENCES story(id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_media_job_status CHECK (status IN ('pending', 'processing', 'ready', 'failed')),
    CONSTRAINT ck_media_job_type CHECK (type IN ('images', 'audio', 'video', 'subtitles'))
);

CREATE INDEX ix_media_job_story_id ON media_job (story_id);
CREATE INDEX ix_media_job_story_id_type ON media_job (story_id, type);

INSERT INTO story (title, idea, generated_prompt, text_content, paragraphs_json, synopsis, genre, tone, visual_style, character_name, place, narrator, media_status_json, target_scene_count, status)
SELECT
    'Demo Story',
    'Test purpose sample idea',
    'Generate a fantasy story about a young hero in an old city.',
    'This is a sample story record.',
    '["This is paragraph one.","This is paragraph two."]'::jsonb,
    'Short test summary',
    'Fantasy',
    'Engaging',
    'Cinematic',
    'Young hero',
    'Old city',
    'Female narrator',
    '{"images":"ready","audio":"ready","video":"pending","subtitles":"pending"}'::jsonb,
    3,
    'ready'
WHERE NOT EXISTS (SELECT 1 FROM story WHERE title = 'Demo Story');

DO $$
DECLARE
    story_uuid UUID;
BEGIN
    SELECT id INTO story_uuid FROM story WHERE title = 'Demo Story' LIMIT 1;

    IF story_uuid IS NOT NULL THEN
        INSERT INTO story_scene (story_id, scene_order, title, description, prompt, mood, status)
        SELECT
            story_uuid,
            1,
            'Scene 1',
            'Opening scene',
            'Starts at dawn in an old city',
            'Curious',
            'ready'
        WHERE NOT EXISTS (
            SELECT 1 FROM story_scene WHERE story_id = story_uuid AND scene_order = 1
        );

        INSERT INTO story_audio (story_id, narrator, duration_seconds, status)
        SELECT
            story_uuid,
            'Female narrator',
            42,
            'ready'
        WHERE NOT EXISTS (SELECT 1 FROM story_audio WHERE story_id = story_uuid);

        INSERT INTO story_video (story_id, transition_effect, status)
        SELECT
            story_uuid,
            'fade',
            'pending'
        WHERE NOT EXISTS (SELECT 1 FROM story_video WHERE story_id = story_uuid);

        INSERT INTO media_job (story_id, type, status)
        SELECT
            story_uuid,
            'images',
            'ready'
        WHERE NOT EXISTS (
            SELECT 1 FROM media_job WHERE story_id = story_uuid AND type = 'images'
        );
    END IF;
END $$;
