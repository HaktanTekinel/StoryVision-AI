IF DB_ID(N'StoryVisionAI') IS NULL
BEGIN
    CREATE DATABASE StoryVisionAI;
END
GO

USE StoryVisionAI;
GO

IF OBJECT_ID(N'dbo.MediaJob', N'U') IS NOT NULL DROP TABLE dbo.MediaJob;
IF OBJECT_ID(N'dbo.StoryVideo', N'U') IS NOT NULL DROP TABLE dbo.StoryVideo;
IF OBJECT_ID(N'dbo.StoryAudio', N'U') IS NOT NULL DROP TABLE dbo.StoryAudio;
IF OBJECT_ID(N'dbo.StoryScene', N'U') IS NOT NULL DROP TABLE dbo.StoryScene;
IF OBJECT_ID(N'dbo.Story', N'U') IS NOT NULL DROP TABLE dbo.Story;
GO

CREATE TABLE dbo.Story
(
    Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Story_Id DEFAULT NEWID(),
    Title NVARCHAR(200) NOT NULL,
    Idea NVARCHAR(MAX) NULL,
    GeneratedPrompt NVARCHAR(MAX) NULL,
    Text NVARCHAR(MAX) NOT NULL,
    ParagraphsJson NVARCHAR(MAX) NULL,
    Synopsis NVARCHAR(500) NULL,
    Genre NVARCHAR(100) NULL,
    Tone NVARCHAR(100) NULL,
    VisualStyle NVARCHAR(100) NULL,
    Character NVARCHAR(200) NULL,
    Place NVARCHAR(200) NULL,
    Narrator NVARCHAR(200) NULL,
    MediaStatusJson NVARCHAR(MAX) NULL,
    TargetSceneCount INT NOT NULL CONSTRAINT DF_Story_TargetSceneCount DEFAULT 3,
    Status NVARCHAR(20) NOT NULL CONSTRAINT DF_Story_Status DEFAULT N'pending',
    CreatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_Story_CreatedAt DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_Story_UpdatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_Story PRIMARY KEY CLUSTERED (Id),
    CONSTRAINT CK_Story_Status CHECK (Status IN (N'pending', N'processing', N'ready', N'failed', N'draft', N'archived')),
    CONSTRAINT CK_Story_TargetSceneCount CHECK (TargetSceneCount >= 3),
    CONSTRAINT CK_Story_ParagraphsJson CHECK (ParagraphsJson IS NULL OR ISJSON(ParagraphsJson) = 1),
    CONSTRAINT CK_Story_MediaStatusJson CHECK (MediaStatusJson IS NULL OR ISJSON(MediaStatusJson) = 1)
);
GO

CREATE TABLE dbo.StoryScene
(
    Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_StoryScene_Id DEFAULT NEWID(),
    StoryId UNIQUEIDENTIFIER NOT NULL,
    SceneOrder INT NOT NULL,
    Title NVARCHAR(200) NULL,
    Description NVARCHAR(MAX) NULL,
    Prompt NVARCHAR(MAX) NULL,
    ImageUrl NVARCHAR(500) NULL,
    ImagePath NVARCHAR(500) NULL,
    Mood NVARCHAR(100) NULL,
    Status NVARCHAR(20) NOT NULL CONSTRAINT DF_StoryScene_Status DEFAULT N'pending',
    CreatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_StoryScene_CreatedAt DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_StoryScene_UpdatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_StoryScene PRIMARY KEY CLUSTERED (Id),
    CONSTRAINT FK_StoryScene_Story FOREIGN KEY (StoryId) REFERENCES dbo.Story (Id) ON DELETE CASCADE,
    CONSTRAINT CK_StoryScene_Status CHECK (Status IN (N'pending', N'processing', N'ready', N'failed')),
    CONSTRAINT UQ_StoryScene_Story_Order UNIQUE (StoryId, SceneOrder)
);
GO

CREATE INDEX IX_StoryScene_StoryId ON dbo.StoryScene (StoryId);
GO

CREATE TABLE dbo.StoryAudio
(
    Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_StoryAudio_Id DEFAULT NEWID(),
    StoryId UNIQUEIDENTIFIER NOT NULL,
    AudioUrl NVARCHAR(500) NULL,
    AudioPath NVARCHAR(500) NULL,
    Narrator NVARCHAR(200) NULL,
    DurationSeconds INT NULL,
    Status NVARCHAR(20) NOT NULL CONSTRAINT DF_StoryAudio_Status DEFAULT N'pending',
    ErrorMessage NVARCHAR(MAX) NULL,
    CreatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_StoryAudio_CreatedAt DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_StoryAudio_UpdatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_StoryAudio PRIMARY KEY CLUSTERED (Id),
    CONSTRAINT FK_StoryAudio_Story FOREIGN KEY (StoryId) REFERENCES dbo.Story (Id) ON DELETE CASCADE,
    CONSTRAINT UQ_StoryAudio_Story UNIQUE (StoryId),
    CONSTRAINT CK_StoryAudio_Status CHECK (Status IN (N'pending', N'processing', N'ready', N'failed')),
    CONSTRAINT CK_StoryAudio_Duration CHECK (DurationSeconds IS NULL OR DurationSeconds >= 0)
);
GO

CREATE INDEX IX_StoryAudio_StoryId ON dbo.StoryAudio (StoryId);
GO

CREATE TABLE dbo.StoryVideo
(
    Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_StoryVideo_Id DEFAULT NEWID(),
    StoryId UNIQUEIDENTIFIER NOT NULL,
    VideoUrl NVARCHAR(500) NULL,
    VideoPath NVARCHAR(500) NULL,
    SubtitleUrl NVARCHAR(500) NULL,
    SubtitlePath NVARCHAR(500) NULL,
    TransitionEffect NVARCHAR(100) NULL,
    Status NVARCHAR(20) NOT NULL CONSTRAINT DF_StoryVideo_Status DEFAULT N'pending',
    ErrorMessage NVARCHAR(MAX) NULL,
    CreatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_StoryVideo_CreatedAt DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_StoryVideo_UpdatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_StoryVideo PRIMARY KEY CLUSTERED (Id),
    CONSTRAINT FK_StoryVideo_Story FOREIGN KEY (StoryId) REFERENCES dbo.Story (Id) ON DELETE CASCADE,
    CONSTRAINT UQ_StoryVideo_Story UNIQUE (StoryId),
    CONSTRAINT CK_StoryVideo_Status CHECK (Status IN (N'pending', N'processing', N'ready', N'failed'))
);
GO

CREATE INDEX IX_StoryVideo_StoryId ON dbo.StoryVideo (StoryId);
GO

CREATE TABLE dbo.MediaJob
(
    Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_MediaJob_Id DEFAULT NEWID(),
    StoryId UNIQUEIDENTIFIER NOT NULL,
    [Type] NVARCHAR(30) NOT NULL,
    Status NVARCHAR(20) NOT NULL CONSTRAINT DF_MediaJob_Status DEFAULT N'pending',
    ErrorMessage NVARCHAR(MAX) NULL,
    CreatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_MediaJob_CreatedAt DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_MediaJob_UpdatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_MediaJob PRIMARY KEY CLUSTERED (Id),
    CONSTRAINT FK_MediaJob_Story FOREIGN KEY (StoryId) REFERENCES dbo.Story (Id) ON DELETE CASCADE,
    CONSTRAINT CK_MediaJob_Status CHECK (Status IN (N'pending', N'processing', N'ready', N'failed')),
    CONSTRAINT CK_MediaJob_Type CHECK ([Type] IN (N'images', N'audio', N'video', N'subtitles'))
);
GO

CREATE INDEX IX_MediaJob_StoryId ON dbo.MediaJob (StoryId);
CREATE INDEX IX_MediaJob_StoryId_Type ON dbo.MediaJob (StoryId, [Type]);
GO

INSERT INTO dbo.Story (Title, Idea, GeneratedPrompt, Text, ParagraphsJson, Synopsis, Genre, Tone, VisualStyle, Character, Place, Narrator, MediaStatusJson, TargetSceneCount, Status)
SELECT
    N'Demo Story',
    N'Test purpose sample idea',
    N'Generate a fantasy story about a young hero in an old city.',
    N'This is a sample story record.',
    N'["This is paragraph one.","This is paragraph two."]',
    N'Short test summary',
    N'Fantasy',
    N'Engaging',
    N'Cinematic',
    N'Young hero',
    N'Old city',
    N'Female narrator',
    N'{"images":"ready","audio":"ready","video":"pending","subtitles":"pending"}',
    3,
    N'ready'
WHERE NOT EXISTS (SELECT 1 FROM dbo.Story WHERE Title = N'Demo Story');
GO

DECLARE @StoryId UNIQUEIDENTIFIER = (SELECT TOP 1 Id FROM dbo.Story WHERE Title = N'Demo Story');

IF @StoryId IS NOT NULL
BEGIN
    INSERT INTO dbo.StoryScene (StoryId, SceneOrder, Title, Description, Prompt, ImageUrl, ImagePath, Mood, Status)
    SELECT
        @StoryId,
        1,
        N'Scene 1',
        N'Opening scene',
        N'Starts at dawn in an old city',
        NULL,
        NULL,
        N'Curious',
        N'ready'
    WHERE NOT EXISTS (
        SELECT 1
        FROM dbo.StoryScene
        WHERE StoryId = @StoryId AND SceneOrder = 1
    );

    INSERT INTO dbo.StoryAudio (StoryId, AudioUrl, AudioPath, Narrator, DurationSeconds, Status)
    SELECT
        @StoryId,
        NULL,
        NULL,
        N'Female narrator',
        42,
        N'ready'
    WHERE NOT EXISTS (SELECT 1 FROM dbo.StoryAudio WHERE StoryId = @StoryId);

    INSERT INTO dbo.StoryVideo (StoryId, VideoUrl, VideoPath, SubtitleUrl, SubtitlePath, TransitionEffect, Status)
    SELECT
        @StoryId,
        NULL,
        NULL,
        NULL,
        NULL,
        N'fade',
        N'pending'
    WHERE NOT EXISTS (SELECT 1 FROM dbo.StoryVideo WHERE StoryId = @StoryId);

    INSERT INTO dbo.MediaJob (StoryId, [Type], Status, ErrorMessage)
    SELECT
        @StoryId,
        N'images',
        N'ready',
        NULL
    WHERE NOT EXISTS (
        SELECT 1
        FROM dbo.MediaJob
        WHERE StoryId = @StoryId AND [Type] = N'images'
    );
END
GO
