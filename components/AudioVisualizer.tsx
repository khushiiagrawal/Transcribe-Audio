"use client";
import { useEffect, useRef} from "react";
import { getAudioContext } from "../lib/audioContext";
import { useHasBrowser } from "../lib/useHasBrowser";

interface AudioVisualizerProps {
  audioUrl: string | null;
  mediaStream: MediaStream | null;
  isLive: boolean;
}

const AudioVisualizer = ({
  audioUrl,
  mediaStream,
  isLive,
}: AudioVisualizerProps) => {
  const hasBrowser = useHasBrowser();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const animationRef = useRef<number>();
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<
    MediaElementAudioSourceNode | MediaStreamAudioSourceNode | null
  >(null);

  // Use this to track when we need to create a new audio source
  const audioUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!hasBrowser) return;

    const initializeAudioContext = async () => {
      const audioContext = await getAudioContext();
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Clean up function
      const cleanup = () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        if (sourceRef.current) {
          sourceRef.current.disconnect();
          sourceRef.current = null;
        }
        if (analyserRef.current) {
          analyserRef.current.disconnect();
          analyserRef.current = null;
        }
      };

      // Handle live streaming
      if (isLive && mediaStream) {
        cleanup(); // Clean up previous connections
        try {
          const source = audioContext.createMediaStreamSource(mediaStream);
          const analyser = audioContext.createAnalyser();
          analyser.fftSize = 256;
          source.connect(analyser);
          sourceRef.current = source;
          analyserRef.current = analyser;
          draw(analyser, ctx, canvas.width, canvas.height);
        } catch (error) {
          console.error("Error initializing live audio:", error);
          cleanup();
        }
      }
      // Handle audio file playback
      else if (audioUrl && !isLive) {
        const audio = audioRef.current;
        if (!audio) return;

        audio.crossOrigin = "anonymous";

        // Only create new audio source if the URL has changed
        if (audioUrl !== audioUrlRef.current) {
          cleanup(); // Clean up previous connections
          audioUrlRef.current = audioUrl;

          try {
            const source = audioContext.createMediaElementSource(audio);
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);
            analyser.connect(audioContext.destination);
            sourceRef.current = source;
            analyserRef.current = analyser;
          } catch (error) {
            console.error("Error initializing audio file:", error);
            cleanup();
            return;
          }
        }

        const handlePlay = () => {
          if (analyserRef.current && ctx) {
            draw(analyserRef.current, ctx, canvas.width, canvas.height);
          }
        };

        const handleEnded = () => {
          if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
          }
        };

        audio.addEventListener("play", handlePlay);
        audio.addEventListener("ended", handleEnded);
        audio.addEventListener("pause", handleEnded);

        return () => {
          audio.removeEventListener("play", handlePlay);
          audio.removeEventListener("ended", handleEnded);
          audio.removeEventListener("pause", handleEnded);
        };
      }

      return cleanup;
    };

    initializeAudioContext();
  }, [audioUrl, mediaStream, isLive, hasBrowser]);

  const draw = (
    analyser: AnalyserNode,
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const drawVisualizer = () => {
      animationRef.current = requestAnimationFrame(drawVisualizer);

      analyser.getByteFrequencyData(dataArray);

      ctx.fillStyle = "rgb(17, 24, 39)"; // Dark background
      ctx.fillRect(0, 0, width, height);

      const barWidth = (width / bufferLength) * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * height;

        // Create gradient effect
        const gradient = ctx.createLinearGradient(
          0,
          height,
          0,
          height - barHeight
        );
        gradient.addColorStop(0, "rgb(129, 140, 248)"); // Indigo
        gradient.addColorStop(1, "rgb(199, 210, 254)"); // Light indigo

        ctx.fillStyle = gradient;
        ctx.fillRect(x, height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }
    };

    drawVisualizer();
  };

  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (sourceRef.current) {
        sourceRef.current.disconnect();
      }
      if (analyserRef.current) {
        analyserRef.current.disconnect();
      }
    };
  }, []);

  return (
    <div className="w-full space-y-4">
      <canvas
        ref={canvasRef}
        className="w-full h-40 rounded-lg bg-gray-900"
        width={500}
        height={160}
      />
      {audioUrl && !isLive && (
        <audio
          ref={audioRef}
          src={audioUrl}
          controls
          className="w-full rounded-lg bg-gray-100 dark:bg-gray-800"
        />
      )}
    </div>
  );
};

export default AudioVisualizer;
