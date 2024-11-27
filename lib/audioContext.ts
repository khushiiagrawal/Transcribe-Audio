let audioContext: AudioContext | null = null;

// Extend the Window interface to add webkitAudioContext type
interface Window {
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
}

export async function getAudioContext(): Promise<AudioContext> {
  if (typeof window === "undefined") {
    throw new Error("Audio Context is only available in the browser");
  }

  try {
    if (!audioContext) {
      const AudioContext = (window as Window).AudioContext || (window as Window).webkitAudioContext;
      if (AudioContext) {
        audioContext = new AudioContext();
      } else {
        throw new Error("AudioContext is not supported in this browser");
      }
    }

    // Resume the audio context if it's in a suspended state
    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }

    return audioContext;
  } catch (error) {
    console.error("Error initializing AudioContext:", error);
    throw error;
  }
}

export function closeAudioContext() {
  if (audioContext) {
    audioContext.close().catch(console.error);
    audioContext = null;
  }
}

// Utility function to check if an AudioContext is available and active
export function isAudioContextAvailable(): boolean {
  return !!(audioContext && audioContext.state === "running");
}
