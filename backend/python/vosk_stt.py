"""
Vosk STT: offline speech-to-text for Hindi and Indian regional languages.
Usage: python vosk_stt.py --input <audio.wav|webm> [--lang hi|en|mr|ta|te|...]
Output: JSON with "text" and "partial" to stdout.
Requires: pip install vosk; download model from https://alphacephei.com/vosk/models
Set VOSK_MODEL to path of unzipped model (e.g. vosk-model-small-hi-0.22).
"""
import argparse
import json
import os
import sys


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, help="Path to audio file (wav, 16kHz mono preferred)")
    parser.add_argument("--lang", default="en", help="Language code for model selection")
    args = parser.parse_args()

    model_path = os.environ.get("VOSK_MODEL") or os.environ.get("VOSK_MODEL_DIR")
    if not model_path or not os.path.isdir(model_path):
        # No model: output empty so backend falls back to Gemini
        print(json.dumps({"text": "", "partial": ""}))
        sys.exit(0)

    try:
        from vosk import Model, KaldiRecognizer
    except ImportError:
        print(json.dumps({"text": "", "partial": ""}))
        sys.exit(0)

    import wave
    import subprocess

    input_path = args.input
    wav_path = input_path
    if input_path.lower().endswith(".webm") or input_path.lower().endswith(".opus"):
        wav_path = input_path + ".wav"
        subprocess.run(
            [
                "ffmpeg", "-y", "-i", input_path,
                "-ar", "16000", "-ac", "1", "-f", "wav", wav_path
            ],
            capture_output=True,
            timeout=30,
        )
    if not os.path.isfile(wav_path):
        print(json.dumps({"text": "", "partial": ""}))
        sys.exit(0)

    try:
        wf = wave.open(wav_path, "rb")
        if wf.getnchannels() != 1 or wf.getsampwidth() != 2 or wf.getcomptype() != "NONE":
            wf.close()
            print(json.dumps({"text": "", "partial": ""}))
            sys.exit(0)
        model = Model(model_path)
        rec = KaldiRecognizer(model, wf.getframerate())
        rec.SetWords(True)
        result_text = []
        while True:
            data = wf.readframes(4000)
            if len(data) == 0:
                break
            if rec.AcceptWaveform(data):
                res = json.loads(rec.Result())
                if res.get("text"):
                    result_text.append(res["text"])
        res = json.loads(rec.FinalResult())
        if res.get("text"):
            result_text.append(res["text"])
        wf.close()
        if wav_path != input_path:
            try:
                os.unlink(wav_path)
            except Exception:
                pass
        text = " ".join(result_text).strip()
        print(json.dumps({"text": text, "partial": ""}))
    except Exception as e:
        print(json.dumps({"text": "", "partial": str(e)}), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
