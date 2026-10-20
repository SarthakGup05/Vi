Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.SetOutputToWaveFile("c:\Users\DELL\Desktop\Vi\vibecut-app\scripts\speech-sample.wav")
$synth.Speak("Welcome to VibeCut AI, the ultimate viral short video editor for modern creators.")
$synth.Dispose()
Write-Host "Audio synthesized successfully"
