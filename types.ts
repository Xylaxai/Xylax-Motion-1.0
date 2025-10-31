
export enum Theme {
  Light = 'light',
  Dark = 'dark',
}

export type AspectRatio = '16:9' | '9:16';

export interface Scene {
  id: string;
  prompt: string;
  negativePrompt?: string; 
  imageFile: File | null;
  generatedVideoUrl?: string;
  videoOperationResponse?: any;
}

// --- Video Editor Types ---
export interface MediaItem {
  id: string;
  name: string;
  url: string; 
  duration: number;
  hasAudio: boolean;
  thumbnailUrl?: string; // Added for video thumbnails
  origin?: 'uploaded' | 'generated';
  prompt?: string;
  negativePrompt?: string;
  videoOperationResponse?: any;
}

export interface Effect {
  id: string;
  type: string;
  properties: { [key: string]: any };
}


export interface Clip {
  id: string; 
  mediaId: string; 
  trackId: string;
  duration: number; 
  trimmedStart: number; 
  trimmedDuration: number; 
  startOffset: number; 
  effects: Effect[];
  prompt?: string;
  negativePrompt?: string;
  videoOperationResponse?: any;
  audio?: { // Embedded audio properties
    volume: number;
    isEnhanced: boolean;
  }
}

export interface Track {
  id: string;
  clips: Clip[];
}

// --- NEW: Audio Types for Intelligent Audio Suite ---
export interface AudioClip {
    id: string;
    mediaId: string;
    trackId: string;
    duration: number;
    trimmedStart: number;
    trimmedDuration: number;
    startOffset: number;
    volume: number; // 0 to 1
    pan: number; // -1 (left) to 1 (right)
    isEnhanced: boolean; // Flag for AI enhancement
}

export interface AudioTrack {
    id: string;
    clips: AudioClip[];
    isMuted: boolean;
    isSolo: boolean;
    volume: number; // Master volume for the track
    pan: number; // Master pan for the track
}


// Extend the Window interface to include aistudio for TypeScript
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    aistudio?: AIStudio;
  }
}