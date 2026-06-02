param(
  [string]$TextPath,
  [string]$OutputPath
)

Add-Type -AssemblyName System.Speech
$text = Get-Content -Path $TextPath -Raw -Encoding UTF8

$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.Rate = 0
$synth.Volume = 100
$synth.SetOutputToWaveFile($OutputPath)
$synth.Speak($text)
$synth.Dispose()