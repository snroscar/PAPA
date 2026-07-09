// Background music using audio file - chapter-specific support
import backgroundMusicPath from "@/assets/Ray Boltz - Thank You - T1R9A6C3Y (128k).mp3";
import kingIsBornPath from "@/assets/A King is Born - Ron Kenoly.wmv With Lyrics [9W_7bX3lBUA].mp3";
import heCalledMyNamePath from "@/assets/He Called My Name... And I Answered (Official Lyric Video) _ Heart of Georgia Music [FnFVEZ8Y8C0].mp3";
import surrenderPath from "@/assets/I Surrender feat Lauren Daigle - Hillsong UNITED _ With Instruments _ 4K.mp3";
import chapterFourTrackPath from "@/assets/Rev Prince campus outreach. Knust Queens hall. Faith in motion [eTQdes0dPlo] (1).mp3";

let audioElement: HTMLAudioElement | null = null;
let muted = false;
let isInitialized = false;

function getMusicPathForChapter(chapterId: number): string {
  // Chapter 1 (His Birth) uses the Ron Kenoly track
  if (chapterId === 1) {
    return kingIsBornPath;
  }
  // Chapter 2 uses the requested Heart of Georgia track
  if (chapterId === 2) {
    return heCalledMyNamePath;
  }
  // Chapter 3 uses the Hillsong UNITED track
  if (chapterId === 3) {
    return surrenderPath;
  }
  // Chapter 4 uses the Rev Prince outreach track
  if (chapterId === 4) {
    return chapterFourTrackPath;
  }
  // All other chapters use the Ray Boltz track
  return backgroundMusicPath;
}

function initAudio(chapterId: number) {
  if (typeof window === "undefined") return;
  if (!audioElement) {
    const musicPath = getMusicPathForChapter(chapterId);
    audioElement = new Audio(musicPath);
    audioElement.loop = true;
    audioElement.volume = 0.5;
  } else {
    // If audio element exists and chapter changed, update the source
    const musicPath = getMusicPathForChapter(chapterId);
    if (audioElement.src !== musicPath) {
      const wasPlaying = !audioElement.paused;
      audioElement.src = musicPath;
      audioElement.loop = true;
      audioElement.volume = muted ? 0 : 0.5;
      if (wasPlaying) {
        void audioElement.play();
      }
    }
  }
}

export function startMusic(chapterId: number) {
  initAudio(chapterId);
  if (!audioElement) return;
  try {
    audioElement.volume = muted ? 0 : 0.5;
    // Only start playing if not already playing (preserves position across chapters)
    if (audioElement.paused) {
      void audioElement.play();
    }
    isInitialized = true;
  } catch {
    /* audio playback unavailable */
  }
}

export function stopMusic() {
  if (!audioElement) return;
  try {
    audioElement.pause();
  } catch {
    /* audio unavailable */
  }
}

export function resumeMusic() {
  if (!audioElement) return;
  try {
    void audioElement.play();
  } catch {
    /* audio playback unavailable */
  }
}

export function setMusicMuted(value: boolean) {
  muted = value;
  if (audioElement) {
    audioElement.volume = value ? 0 : 0.5;
  }
}

export function isMusicMuted() {
  return muted;
}
