"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface MicRecorderProps {
  onStop: (blob: Blob) => void;
}

const MIME_TYPE = "audio/webm;codecs=opus";

export function MicRecorder({ onStop }: MicRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopTracks = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    mediaRecorderRef.current = null;
  }, []);

  useEffect(() => {
    return () => stopTracks();
  }, [stopTracks]);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = MediaRecorder.isTypeSupported(MIME_TYPE) ? MIME_TYPE : "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType });
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        onStop(blob);
        stopTracks();
      };

      recorder.start(100);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      console.error("[MicRecorder] getUserMedia failed:", err);
    }
  }, [onStop, stopTracks]);

  const stop = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  }, []);

  return (
    <button
      type="button"
      onClick={isRecording ? stop : start}
      className="btn-primary"
      aria-label={isRecording ? "Stop recording" : "Tap to speak"}
    >
      {isRecording ? "Stop Recording" : "Tap to Speak"}
    </button>
  );
}

