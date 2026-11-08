# Free open-source voice (Kokoro, Apache 2.0) for film narration, used when the paid voice is off or out of budget.
# Usage: python3 -I tools/kokoro.py "<text>" out.mp3 [voice]
# Model files are fetched once into ~/.cache/kokoro (about 350 MB).
import os, sys, subprocess, urllib.request
REL = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/"
cache = os.path.expanduser("~/.cache/kokoro"); os.makedirs(cache, exist_ok=True)
for f in ("kokoro-v1.0.onnx", "voices-v1.0.bin"):
    p = os.path.join(cache, f)
    if not os.path.exists(p): urllib.request.urlretrieve(REL + f, p + ".part"); os.rename(p + ".part", p)
from kokoro_onnx import Kokoro
import soundfile as sf
text, out = sys.argv[1], sys.argv[2]
voice = sys.argv[3] if len(sys.argv) > 3 else os.environ.get("KOKORO_VOICE", "af_heart")
k = Kokoro(os.path.join(cache, "kokoro-v1.0.onnx"), os.path.join(cache, "voices-v1.0.bin"))
audio, sr = k.create(text, voice=voice, speed=1.0, lang="en-gb" if voice.startswith("b") else "en-us")
wav = out + ".wav"; sf.write(wav, audio, sr)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", wav, "-b:a", "128k", out], check=True); os.remove(wav)
