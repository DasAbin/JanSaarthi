import axios from "axios";

const BACKEND_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

export const api = axios.create({
  baseURL: BACKEND_BASE_URL
});

export function simplifyDocument(payload: {
  file: File;
  language: string;
}) {
  const formData = new FormData();
  formData.append("file", payload.file);
  formData.append("language", payload.language);

  return api.post("/api/simplify", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
}

export function checkYojana(profile: Record<string, unknown>) {
  return api.post("/api/yojana/check", profile);
}

export function explainForm(image: File) {
  const formData = new FormData();
  formData.append("image", image);

  return api.post("/api/form-helper", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
}

export function fetchModule(moduleId: string) {
  return api.get(`/api/learn/${moduleId}`);
}

export function stt(audio: Blob) {
  const formData = new FormData();
  formData.append("audio", audio, "recording.webm");
  return api.post("/api/voice/stt", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
}

export function tts(text: string) {
  return api.post("/api/voice/tts", {
    text,
    languageCode: "en-IN"
  });
}

