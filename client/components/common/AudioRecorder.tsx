"use client";

import { useState } from "react";

export default function AudioRecorder() {
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob|null>(null);
  const [transcription, setTranscription] = useState("");

  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder|null>(null);
  let chunks:BlobPart[] = [];

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    setMediaRecorder(new MediaRecorder(stream));

    if(!mediaRecorder) return;

    mediaRecorder.ondataavailable = (event) => {
      chunks.push(event.data);
    };

    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(chunks, { type: "audio/webm" });
      setAudioBlob(audioBlob);
      chunks = [];
    };

    mediaRecorder.start();
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorder?.stop();
    console.log(mediaRecorder)
    setRecording(false);
  };

  const sendAudio = async () => {
    if (!audioBlob) return;

    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.webm");

    const res = await fetch("/api/transcribe", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setTranscription(data.transcription);
  };

  return (
    <div>
      <button onClick={recording ? stopRecording : startRecording}>
        {recording ? "Stop Recording" : "Start Recording"}
      </button>
      <button onClick={sendAudio} disabled={!audioBlob}>
        Send for Transcription
      </button>
      <p>Transcription: {transcription}</p>
    </div>
  );
}
