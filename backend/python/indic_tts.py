#!/usr/bin/env python3
"""
Indic-Parler-TTS: Local, free TTS for Indian languages.
Uses AI4Bharat Indic-Parler-TTS model from HuggingFace.
Supports: hi, bn, ta, te, kn, ml, mr, gu, or, pa
"""

import sys
import os
import json
import tempfile

# Model configuration
MODEL_ID = "ai4bharat/indic-parler-tts"
MODEL_CACHE_DIR = os.path.join(os.path.dirname(__file__), "..", "storage", "models", "indic_parler")

# Global model cache
_loaded = None

def load_model():
    """Load Indic-Parler-TTS model once and cache it."""
    global _loaded
    if _loaded is not None:
        return _loaded
    try:
        import torch
        from parler_tts import ParlerTTSForConditionalGeneration
        from transformers import AutoTokenizer
        print(f"[Indic-TTS] Loading model {MODEL_ID}...", file=sys.stderr)
        device = "cuda" if torch.cuda.is_available() else "cpu"
        hf_token = os.environ.get("HF_TOKEN") or os.environ.get("HUGGING_FACE_HUB_TOKEN")
        load_kw = dict(
            cache_dir=MODEL_CACHE_DIR,
            torch_dtype=torch.float32,
            attn_implementation="eager",
        )
        if hf_token:
            load_kw["token"] = hf_token
        model = ParlerTTSForConditionalGeneration.from_pretrained(MODEL_ID, **load_kw).to(device)
        tokenizer = AutoTokenizer.from_pretrained(MODEL_ID, cache_dir=MODEL_CACHE_DIR, token=hf_token)
        try:
            desc_encoder = getattr(model.config, "text_encoder", None)
            desc_name = desc_encoder._name_or_path if desc_encoder else "parler-tts/parler-tts-mini-v1.1"
        except Exception:
            desc_name = "parler-tts/parler-tts-mini-v1.1"
        description_tokenizer = AutoTokenizer.from_pretrained(desc_name, cache_dir=MODEL_CACHE_DIR, token=hf_token)
        _loaded = (model, tokenizer, description_tokenizer, device)
        print(f"[Indic-TTS] Model loaded on {device}", file=sys.stderr)
        return _loaded
    except Exception as e:
        err = str(e).lower()
        if "401" in err or "unauthorized" in err or "not a valid model identifier" in err:
            print("[ERROR] Model may be gated. Do: 1) Open https://huggingface.co/ai4bharat/indic-parler-tts and accept the license. 2) Run: huggingface-cli login", file=sys.stderr)
        print(f"[ERROR] Failed to load model: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)

def generate_speech(text: str, lang: str) -> bytes:
    """Generate speech audio from text in the specified language."""
    model, tokenizer, description_tokenizer, device = load_model()
    
    # Map language codes
    lang_map = {
        "en": "hi",  # English -> Hindi (fallback)
        "hi": "hi",
        "bn": "bn",
        "ta": "ta",
        "te": "te",
        "kn": "kn",
        "ml": "ml",
        "mr": "mr",
        "gu": "gu",
        "or": "or",
        "pa": "pa"
    }
    tts_lang = lang_map.get(lang.lower(), "hi")
    
    try:
        import torch
        from transformers import AutoProcessor
        
        # Auto-detect speaker description from text (or use default)
        description = f"A {tts_lang} speaker"
        
        # Tokenize inputs
        input_ids = tokenizer(text, return_tensors="pt").input_ids.to(device)
        description_ids = description_tokenizer(description, return_tensors="pt").input_ids.to(device)
        
        # Generate speech
        with torch.no_grad():
            generation = model.generate(
                input_ids=input_ids,
                description_ids=description_ids,
                max_new_tokens=1024,
            )
        
        # Extract audio
        audio_array = generation.cpu().numpy().squeeze()
        
        # Convert to WAV format
        import soundfile as sf
        import numpy as np
        
        # Normalize audio
        audio_array = audio_array.astype(np.float32)
        if audio_array.max() > 1.0:
            audio_array = audio_array / np.abs(audio_array).max()
        
        # Write to temporary WAV file
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
            sf.write(tmp.name, audio_array, 16000)  # 16kHz sample rate
            with open(tmp.name, "rb") as f:
                audio_bytes = f.read()
            os.unlink(tmp.name)
        
        return audio_bytes
    except Exception as e:
        print(f"[ERROR] Speech generation failed: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        raise

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python indic_tts.py \"<text>\" \"<lang>\" [output_path]", file=sys.stderr)
        sys.exit(1)
    
    text = sys.argv[1]
    lang = sys.argv[2].replace("-IN", "").lower()
    output_path = sys.argv[3] if len(sys.argv) > 3 else None
    
    try:
        audio_bytes = generate_speech(text, lang)
        
        if output_path:
            with open(output_path, "wb") as f:
                f.write(audio_bytes)
        else:
            # Output base64 encoded audio to stdout
            import base64
            print(base64.b64encode(audio_bytes).decode("utf-8"))
    except Exception as e:
        print(f"[ERROR] {e}", file=sys.stderr)
        sys.exit(1)
