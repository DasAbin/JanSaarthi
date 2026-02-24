#!/usr/bin/env python3
"""
Silero STT: Local, free Speech-to-Text for multilingual audio.
Uses Silero STT models from PyTorch Hub.
Supports: hi, en, and many other languages (multilingual model).
"""

import sys
import os

# Global model cache
_loaded_model = None
_loaded_decoder = None

def load_model():
    """Load Silero STT model once and cache it."""
    global _loaded_model, _loaded_decoder
    
    if _loaded_model is not None:
        return _loaded_model, _loaded_decoder
    
    try:
        import torch
        import torchaudio
        
        print("[Silero-STT] Loading model...", file=sys.stderr)
        
        # Load multilingual model using torch.hub (official Silero method)
        # Models are downloaded from GitHub and cached
        model, decoder, utils = torch.hub.load(
            repo_or_dir='snakers4/silero-models',
            model='silero_stt',
            language='multilingual',  # Supports hi, en, and many others
            device='cpu'
        )
        
        _loaded_model = model
        _loaded_decoder = decoder
        print("[Silero-STT] Model loaded successfully", file=sys.stderr)
        return model, decoder
    except ImportError as e:
        print(f"[ERROR] Required packages not installed: {e}", file=sys.stderr)
        print("[ERROR] Install with: pip install torch torchaudio", file=sys.stderr)
        print("[ERROR] For CPU-only: pip install torch torchaudio --index-url https://download.pytorch.org/whl/cpu", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"[ERROR] Failed to load model: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)

def transcribe_audio(audio_path: str) -> str:
    """Transcribe audio file to text."""
    model, decoder = load_model()
    
    try:
        import torch
        import torchaudio
        
        # Load audio file
        waveform, sample_rate = torchaudio.load(audio_path)
        
        # Resample to 16kHz if needed (Silero expects 16kHz)
        if sample_rate != 16000:
            resampler = torchaudio.transforms.Resample(sample_rate, 16000)
            waveform = resampler(waveform)
            sample_rate = 16000
        
        # Convert to mono if stereo
        if waveform.shape[0] > 1:
            waveform = torch.mean(waveform, dim=0, keepdim=True)
        
        # Run inference
        with torch.no_grad():
            output = model(waveform)
            text = decoder(output[0].cpu())
        
        return text.strip()
    except Exception as e:
        print(f"[ERROR] Transcription failed: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        raise

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python stt_silero.py <audio_path>", file=sys.stderr)
        sys.exit(1)
    
    audio_path = sys.argv[1]
    
    if not os.path.exists(audio_path):
        print(f"[ERROR] Audio file not found: {audio_path}", file=sys.stderr)
        sys.exit(1)
    
    try:
        text = transcribe_audio(audio_path)
        print(text)
    except Exception as e:
        print(f"[ERROR] {e}", file=sys.stderr)
        sys.exit(1)
