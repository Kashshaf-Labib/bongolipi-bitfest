"use client";

import { useRef, useState } from "react";

export default function AudioRecorder() {
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcription, setTranscription] = useState("");
  const [loading, setLoading] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setAudioBlob(null);
      setTranscription("");
      setRecording(true);
    } catch (error) {
      console.error(error);
      alert("Could not access the microphone.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const sendAudio = async () => {
    if (!audioBlob) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");

      const res = await fetch("/api/upload-audio", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setTranscription(data.response || data.error || "No transcription returned.");
    } catch (error) {
      console.error(error);
      alert("Something went wrong. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Voice to Text</h1>
      <div className="flex gap-4">
        <button
          onClick={recording ? stopRecording : startRecording}
          className={`px-4 py-2 rounded text-white ${
            recording ? "bg-red-600" : "bg-primary"
          }`}
        >
          {recording ? "Stop Recording" : "Start Recording"}
        </button>
        <button
          onClick={sendAudio}
          disabled={!audioBlob || loading}
          className="px-4 py-2 rounded bg-secondary text-white disabled:opacity-60"
        >
          {loading ? "Transcribing..." : "Send for Transcription"}
        </button>
      </div>

      {audioBlob && (
        <audio controls src={URL.createObjectURL(audioBlob)} className="w-full" />
      )}

      {transcription && (
        <div className="p-4 bg-gray-100 rounded border">
          <p className="font-semibold mb-1">Transcription:</p>
          <p>{transcription}</p>
        </div>
      )}
    </div>
  );
}
