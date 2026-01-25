"use client";

import { useEffect, useRef, useState } from "react";
import { MicRecorder } from "./MicRecorder";
import { useSTT, useTTS } from "../hooks/useVoice";

interface VoiceBarProps {
  textToSpeak?: string;
  onTranscription?: (text: string) => void;
}

export function VoiceBar({ textToSpeak, onTranscription }: VoiceBarProps) {
  const [lastAudioUrl, setLastAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stt = useSTT();
  const tts = useTTS();

  useEffect(() => {
    if (lastAudioUrl && audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
  }, [lastAudioUrl]);

  const handleStopRecording = (blob: Blob) => {
    stt.mutate(blob, {
      onSuccess: (data) => {
        onTranscription?.(data.text);
      }
    });
  };

  const handleSpeak = () => {
    if (!textToSpeak) return;
    tts.mutate(
      { text: textToSpeak },
      {
        onSuccess: (data) => {
          setLastAudioUrl(data.audioUrl);
        }
      }
    );
  };

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <MicRecorder onStop={handleStopRecording} />
      {textToSpeak && (
        <button
          type="button"
          className="btn-primary"
          onClick={handleSpeak}
          disabled={tts.isPending}
        >
          {tts.isPending ? "Preparing audio…" : "Listen"}
        </button>
      )}
      {lastAudioUrl && (
        <audio ref={audioRef} src={lastAudioUrl} className="hidden" controls />
      )}
    </div>
  );
}

