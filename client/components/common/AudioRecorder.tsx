"use client";

import { useRef, useState } from "react";
import { Mic, Square, Send } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import Button from "@/components/ui/Button";

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
      setTranscription(
        data.response || data.error || "No transcription returned.",
      );
    } catch (error) {
      console.error(error);
      alert("Something went wrong. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] py-12">
      <Container className="max-w-2xl">
        <PageHeader
          title="Voice to text"
          description="Record your voice and turn it into text."
        />

        <Card className="mt-8">
          <CardBody className="space-y-6">
            <div className="flex flex-col items-center gap-4 py-6">
              <button
                onClick={recording ? stopRecording : startRecording}
                aria-label={recording ? "Stop recording" : "Start recording"}
                className={
                  "flex h-20 w-20 items-center justify-center rounded-full text-white shadow-warm-lg transition-transform hover:scale-105 " +
                  (recording ? "animate-pulse bg-destructive" : "bg-primary")
                }
              >
                {recording ? <Square size={28} /> : <Mic size={30} />}
              </button>
              <p className="text-sm text-muted-foreground">
                {recording ? "Recording… tap to stop" : "Tap to start recording"}
              </p>
            </div>

            {audioBlob && (
              <div className="space-y-4">
                <audio
                  controls
                  src={URL.createObjectURL(audioBlob)}
                  className="w-full"
                />
                <div className="flex justify-center">
                  <Button onClick={sendAudio} loading={loading}>
                    {loading ? (
                      "Transcribing…"
                    ) : (
                      <>
                        <Send size={16} /> Transcribe
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {transcription && (
              <div className="rounded-xl border border-border bg-muted/40 p-4">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Transcription
                </p>
                <p className="font-bengali text-foreground">{transcription}</p>
              </div>
            )}
          </CardBody>
        </Card>
      </Container>
    </div>
  );
}
