Import-Module SQLPS -DisableNameChecking
Invoke-Sqlcmd -ServerInstance 'localhost' -Database 'master' -InputFile 'C:\Users\Engin\OneDrive\Desktop\SQL\StoryVisionAI_SQLServer_Init.sql'
Invoke-Sqlcmd -ServerInstance 'localhost' -Database 'StoryVisionAI' -Query "SELECT name FROM sys.tables ORDER BY name;"
Invoke-Sqlcmd -ServerInstance 'localhost' -Database 'StoryVisionAI' -Query "SELECT TOP 1 Title, Status FROM dbo.Story;"
