"use client";

import { useEffect, useState } from "react";

interface MicRecorderProps {
  onStop: (blob: Blob) => void;
}

export function MicRecorder({ onStop }: MicRecorderProps) {
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    return () => {
      mediaRecorder?.stream.getTracks().forEach((t) => t.stop());
    };
  }, [mediaRecorder]);

  const start = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    const chunks: BlobPart[] = [];

    recorder.ondataavailable = (e) => {
      chunks.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: "audio/webm" });
      onStop(blob);
    };

    recorder.start();
    setMediaRecorder(recorder);
    setIsRecording(true);
  };

  const stop = () => {
    mediaRecorder?.stop();
    setIsRecording(false);
  };

  return (
    <button
      type="button"
      onClick={isRecording ? stop : start}
      className="btn-primary"
    >
      {isRecording ? "Stop Recording" : "Tap to Speak"}
    </button>
  );
}

