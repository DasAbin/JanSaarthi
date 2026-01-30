"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MicRecorder } from "./MicRecorder";
import { useSTT, useTTS, VOICE_LANGUAGES } from "../hooks/useVoice";

interface VoiceBarProps {
  textToSpeak?: string;
  onTranscription?: (text: string) => void;
  /** Default language for Listen and Tap to Speak (local-language default for accessibility) */
  defaultLang?: string;
}

const LANG_TO_BROWSER: Record<string, string> = {
  hi: "hi-IN", mr: "mr-IN", ta: "ta-IN", te: "te-IN", bn: "bn-IN",
  gu: "gu-IN", kn: "kn-IN", ml: "ml-IN", pa: "pa-IN", or: "or-IN"
};

function getBrowserLang(code: string): string {
  return LANG_TO_BROWSER[code] ?? "en-IN";
}

export function VoiceBar({ textToSpeak, onTranscription, defaultLang = "en" }: VoiceBarProps) {
  const [lastAudioUrl, setLastAudioUrl] = useState<string | null>(null);
  const [selectedLang, setSelectedLang] = useState(defaultLang);
  const [playError, setPlayError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stt = useSTT();
  const tts = useTTS();

  useEffect(() => {
    setPlayError(null);
    if (lastAudioUrl && audioRef.current) {
      audioRef.current.play().catch((err) => {
        setPlayError("Audio playback failed. Try browser Listen below.");
      });
    }
  }, [lastAudioUrl]);

  const handleStopRecording = useCallback(
    (blob: Blob) => {
      const lang = selectedLang.includes("-") ? selectedLang : `${selectedLang}-IN`;
      stt.mutate(
        { audio: blob, language: lang },
        {
          onSuccess: (data) => onTranscription?.(data.text),
          onError: () => {}
        }
      );
    },
    [selectedLang, onTranscription]
  );

  const handleSpeak = useCallback(() => {
    if (!textToSpeak?.trim()) return;
    setPlayError(null);
    tts.mutate(
      { text: textToSpeak.trim(), lang: selectedLang },
      {
        onSuccess: (data) => {
          if (data?.audioUrl) {
            setLastAudioUrl(data.audioUrl);
          } else if (typeof window !== "undefined" && window.speechSynthesis) {
            window.speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance(textToSpeak.trim());
            u.lang = getBrowserLang(selectedLang);
            window.speechSynthesis.speak(u);
          }
        },
        onError: () => {}
      }
    );
  }, [textToSpeak, selectedLang, tts]);

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2" role="group" aria-label="Voice: listen and speak">
      <label className="sr-only" htmlFor="voice-lang">Voice language</label>
      <select
        id="voice-lang"
        aria-label="Voice language"
        value={selectedLang}
        onChange={(e) => setSelectedLang(e.target.value)}
        className="rounded border border-gray-300 bg-white px-2 py-1 text-sm"
      >
        {VOICE_LANGUAGES.map(({ code, name }) => (
          <option key={code} value={code}>
            {name}
          </option>
        ))}
      </select>
      <MicRecorder onStop={handleStopRecording} />
      {textToSpeak && (
        <button
          type="button"
          className="btn-primary"
          onClick={handleSpeak}
          disabled={tts.isPending}
          aria-busy={tts.isPending}
        >
          {tts.isPending ? "Preparing audio…" : "Listen"}
        </button>
      )}
      {stt.isError && (
        <p className="text-sm text-red-600" role="alert">
          Speech recognition failed. Type your message or try again.
        </p>
      )}
      {tts.isError && (
        <p className="text-sm text-red-600" role="alert">
          Text-to-speech failed. Using browser voice if available.
        </p>
      )}
      {playError && <p className="text-sm text-amber-600" role="alert">{playError}</p>}
      {lastAudioUrl && (
        <audio ref={audioRef} src={lastAudioUrl} className="hidden" controls aria-label="Playback" />
      )}
    </div>
  );
}

