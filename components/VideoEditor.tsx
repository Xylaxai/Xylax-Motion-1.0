import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MediaItem, Clip, Track, Effect, AudioTrack, AudioClip } from '../types';
import { nanoid } from 'https://cdn.jsdelivr.net/npm/nanoid/nanoid.js';
import { UploadIcon, PlusIcon, ScissorsIcon, PlayIcon, PauseIcon, StarIcon, FilmstripIcon, EffectsIcon, TransformIcon, CropIcon, KeyframeIcon, BrainCircuitIcon } from './icons';
import { generateVideo, extendVideo } from '../services/geminiService';


const PIXELS_PER_SECOND = 60;

// Helper function to get video duration and generate a thumbnail
const getVideoMetadata = (url: string): Promise<{duration: number, hasAudio: boolean, thumbnailUrl: string}> => {
    return new Promise((resolve) => {
        const video = document.createElement('video');
        const canvas = document.createElement('canvas');
        video.muted = true;
        video.playsInline = true;

        const resolveError = () => {
            console.error("Error loading video metadata for url:", url);
            resolve({ duration: 0, hasAudio: false, thumbnailUrl: '' });
            URL.revokeObjectURL(video.src);
        };

        video.onloadedmetadata = () => {
            video.currentTime = 0.1; // Seek to a very early frame to ensure it's loaded
        };

        video.onseeked = () => {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
                const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);
                const hasAudio = ((video as any).mozHasAudio || Boolean((video as any).webkitAudioDecodedByteCount) || ((video as any).audioTracks?.length > 0));
                resolve({ duration: video.duration, hasAudio, thumbnailUrl });
                URL.revokeObjectURL(video.src);
            } else {
                resolveError();
            }
        };
        
        video.onerror = resolveError;
        video.src = url;
        video.load();
    });
};


interface VideoEditorProps {
    initialMedia: MediaItem[];
    onClearInitialMedia: () => void;
    onGenerationError: (message: string) => void;
}

export const VideoEditor: React.FC<VideoEditorProps> = ({ initialMedia, onClearInitialMedia, onGenerationError }) => {
    const [mediaBin, setMediaBin] = useState<MediaItem[]>([]);
    const [videoTracks, setVideoTracks] = useState<Track[]>(
        Array.from({ length: 5 }, (_, i) => ({ id: `v-track-${i + 1}`, clips: [] }))
    );
    const [audioTracks, setAudioTracks] = useState<AudioTrack[]>(
        Array.from({ length: 3 }, (_, i) => ({ id: `a-track-${i + 1}`, clips: [], isMuted: false, isSolo: false, volume: 1, pan: 0 }))
    );
    const [playheadPosition, setPlayheadPosition] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, clipId: string, clipType: 'video' | 'audio' } | null>(null);
    
    const previewVideoRef = useRef<HTMLVideoElement>(null);
    const timelineContainerRef = useRef<HTMLDivElement>(null);
    const animationFrameRef = useRef<number>(0);

    useEffect(() => {
        const loadInitialMedia = async () => {
            if (initialMedia.length > 0) {
                const mediaWithMetadata = await Promise.all(
                    initialMedia.map(async (item) => {
                        const { duration, hasAudio, thumbnailUrl } = await getVideoMetadata(item.url);
                        return { ...item, duration, hasAudio, thumbnailUrl };
                    })
                );
                setMediaBin(prev => [...prev, ...mediaWithMetadata]);
                onClearInitialMedia();
            }
        };
        loadInitialMedia();
    }, [initialMedia, onClearInitialMedia]);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);
        const newMediaItems: MediaItem[] = await Promise.all(
            files.map(async (file) => {
                const url = URL.createObjectURL(file);
                const { duration, hasAudio, thumbnailUrl } = await getVideoMetadata(url);
                return { id: nanoid(), name: file.name, url, duration, hasAudio, thumbnailUrl, origin: 'uploaded' };
            })
        );
        setMediaBin(prev => [...prev, ...newMediaItems]);
    };

    const handleDropOnTimeline = (e: React.DragEvent, trackId: string, trackType: 'video' | 'audio') => {
        e.preventDefault();
        const mediaId = e.dataTransfer.getData('text/plain');
        const mediaItem = mediaBin.find(item => item.id === mediaId);
        if (!mediaItem) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const dropX = e.clientX - rect.left;
        const startOffset = Math.max(0, dropX / PIXELS_PER_SECOND);

        if (trackType === 'video') {
            const newClip: Clip = {
                id: nanoid(), mediaId: mediaItem.id, trackId, startOffset,
                duration: mediaItem.duration, trimmedStart: 0, trimmedDuration: mediaItem.duration,
                effects: [], prompt: mediaItem.prompt, negativePrompt: mediaItem.negativePrompt,
                videoOperationResponse: mediaItem.videoOperationResponse,
                audio: mediaItem.hasAudio ? { volume: 1, isEnhanced: false } : undefined
            };
            setVideoTracks(vTracks => vTracks.map(t => t.id === trackId ? { ...t, clips: [...t.clips, newClip] } : t));
        } else { // audio track
             if (!mediaItem.hasAudio) {
                onGenerationError("This media file does not contain audio.");
                return;
            }
            const newAudioClip: AudioClip = {
                id: nanoid(), mediaId: mediaItem.id, trackId, startOffset,
                duration: mediaItem.duration, trimmedStart: 0, trimmedDuration: mediaItem.duration,
                volume: 1, pan: 0, isEnhanced: false,
            };
            setAudioTracks(aTracks => aTracks.map(t => t.id === trackId ? { ...t, clips: [...t.clips, newAudioClip] } : t));
        }
    };
    
    // Playback engine remains largely the same, focused on visual playback
    const handlePlayPause = () => setIsPlaying(!isPlaying);

    const updatePlayhead = useCallback(() => {
        if (!isPlaying || !previewVideoRef.current) {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            return;
        }
        setPlayheadPosition(previewVideoRef.current.currentTime);
        animationFrameRef.current = requestAnimationFrame(updatePlayhead);
    }, [isPlaying]);

    useEffect(() => {
        const video = previewVideoRef.current;
        if (!video) return;

        if (isPlaying) {
            video.play().catch(e => console.error("Play interrupted:", e));
            animationFrameRef.current = requestAnimationFrame(updatePlayhead);
        } else {
            video.pause();
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        }
        return () => { if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current); };
    }, [isPlaying, updatePlayhead]);
    
    useEffect(() => {
      const video = previewVideoRef.current;
      if (!video) return;

      let currentClip: Clip | undefined;
      let timeInClip = 0;

      for (let i = videoTracks.length - 1; i >= 0; i--) {
        const track = videoTracks[i];
        const foundClip = track.clips.find(c => playheadPosition >= c.startOffset && playheadPosition < c.startOffset + c.trimmedDuration);
        if(foundClip) {
            currentClip = foundClip;
            timeInClip = playheadPosition - currentClip.startOffset + currentClip.trimmedStart;
            break;
        }
      }

      if (currentClip) {
        const media = mediaBin.find(m => m.id === currentClip!.mediaId);
        if (media && video.src !== media.url) {
            video.src = media.url;
        }
        if(video.src && Math.abs(video.currentTime - timeInClip) > 0.1) {
            video.currentTime = timeInClip;
        }
      } else {
         if (isPlaying) setIsPlaying(false);
      }
    }, [playheadPosition, videoTracks, mediaBin, isPlaying]);

    const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement;
        if (timelineContainerRef.current && target.contains(timelineContainerRef.current)) {
            const rect = timelineContainerRef.current.getBoundingClientRect();
            const clickX = e.clientX - rect.left - 48; // 48px for track label width
            if (clickX < 0) return;
            const newPosition = clickX / PIXELS_PER_SECOND;
            setPlayheadPosition(newPosition);
            setContextMenu(null);
            setSelectedClipId(null);
        }
    };

    const handleClipContextMenu = (e: React.MouseEvent, clipId: string, clipType: 'video' | 'audio') => {
        e.preventDefault();
        e.stopPropagation();
        setSelectedClipId(clipId);
        setContextMenu({ x: e.clientX, y: e.clientY, clipId, clipType });
    };

    const handleEnhanceSpeech = (clipId: string, clipType: 'video' | 'audio') => {
        if(clipType === 'video') {
            setVideoTracks(tracks => tracks.map(t => ({
                ...t, clips: t.clips.map(c => c.id === clipId && c.audio ? {...c, audio: {...c.audio, isEnhanced: true}} : c)
            })));
        } else {
            setAudioTracks(tracks => tracks.map(t => ({
                ...t, clips: t.clips.map(c => c.id === clipId ? {...c, isEnhanced: true} : c)
            })));
        }
        setContextMenu(null);
    };

    useEffect(() => {
        const handleClickOutside = () => setContextMenu(null);
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    const totalDuration = Math.max(
      videoTracks.reduce((max, track) => Math.max(max, track.clips.reduce((d, clip) => Math.max(d, clip.startOffset + clip.trimmedDuration), 0)), 0),
      audioTracks.reduce((max, track) => Math.max(max, track.clips.reduce((d, clip) => Math.max(d, clip.startOffset + clip.trimmedDuration), 0)), 0)
    );
    const allClips = [...videoTracks.flatMap(t => t.clips), ...audioTracks.flatMap(t => t.clips)];
    const selectedClip = allClips.find(c => c.id === selectedClipId);
    const selectedMedia = selectedClip ? mediaBin.find(m => m.id === selectedClip.mediaId) : null;
    

    const AudioMixer = () => (
      <div className="space-y-3 text-xs">
        <h3 className="font-bold text-base text-white border-b border-white/10 pb-1">Audio Mixer</h3>
        {audioTracks.map((track, index) => (
          <div key={track.id} className="p-2 bg-[#1e1e1e] rounded-md">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-white">Track A{index + 1}</span>
              <div className="flex gap-1.5">
                <button className={`w-6 h-5 rounded text-xs font-mono ${track.isMuted ? 'bg-red-500 text-white' : 'bg-gray-500'}`}>M</button>
                <button className={`w-6 h-5 rounded text-xs font-mono ${track.isSolo ? 'bg-yellow-500 text-black' : 'bg-gray-500'}`}>S</button>
              </div>
            </div>
            <div>
              <label>Volume</label>
              <input type="range" min="0" max="1" step="0.01" value={track.volume} className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer range-sm" />
            </div>
            <div>
              <label>Pan</label>
              <input type="range" min="-1" max="1" step="0.01" value={track.pan} className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer range-sm" />
            </div>
          </div>
        ))}
      </div>
    );

    return (
    <div className="flex flex-col h-[calc(100vh-80px)] overflow-hidden text-sm bg-[#1e1e1e] text-gray-300 font-sans">
      <div className="grid grid-cols-4 grid-rows-[auto_1fr] h-full gap-2 p-2">
        
        <div className="col-span-1 row-span-1 bg-[#2d2d2d] rounded-md p-2 flex flex-col">
            <h2 className="font-bold text-base text-white mb-2 border-b border-white/10 pb-1">Library</h2>
            <div className="relative border border-dashed border-hot-pink/30 rounded-md p-4 text-center mt-2">
                <UploadIcon className="w-6 h-6 mx-auto text-hot-pink/50 mb-1" />
                <p className="text-gray-400 text-xs">Click to upload</p>
                <input type="file" multiple accept="video/*,audio/*" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
            </div>
            <div className="mt-2 space-y-1 flex-grow overflow-y-auto pr-1">
              {mediaBin.map(item => (
                <div key={item.id} draggable onDragStart={(e) => e.dataTransfer.setData('text/plain', item.id)} className="bg-[#1e1e1e] p-1.5 rounded-md flex items-center gap-2 cursor-grab active:cursor-grabbing">
                    {item.thumbnailUrl ? (
                      <img src={item.thumbnailUrl} alt={item.name} className="w-10 h-7 object-cover rounded-sm flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-7 bg-black/50 flex-shrink-0 rounded-sm flex items-center justify-center">
                          <FilmstripIcon className="w-4 h-4 text-gray-500" />
                      </div>
                    )}
                    <div className='flex-grow overflow-hidden'>
                      <p className="truncate text-xs text-white">{item.name}</p>
                      <p className='text-xs text-gray-400'>{item.duration.toFixed(1)}s</p>
                    </div>
                </div>
              ))}
            </div>
        </div>

        <div className="col-span-2 row-span-1 bg-black rounded-md flex items-center justify-center relative">
            <video ref={previewVideoRef} className="max-w-full max-h-full" />
            <div className="absolute bottom-2 left-2 bg-black/50 p-1 px-2 rounded-md text-xs font-mono">{playheadPosition.toFixed(2)}s / {totalDuration.toFixed(2)}s</div>
        </div>

        <div className="col-span-1 row-span-2 bg-[#2d2d2d] rounded-md p-2 flex flex-col overflow-y-auto">
             <h2 className="font-bold text-base text-white mb-2 border-b border-white/10 pb-1">Inspector</h2>
             {!selectedClip && <AudioMixer />}
             {selectedClip && selectedMedia && (
                 <div className="space-y-3 text-xs">
                     <p className="font-bold truncate text-white">{selectedMedia.name}</p>
                 </div>
             )}
        </div>

        <div className="col-span-3 row-span-1 bg-[#2d2d2d] rounded-md p-2 flex flex-col">
            <div className="flex items-center gap-4 mb-2 px-2 border-b border-white/10 pb-2">
                <button onClick={handlePlayPause} className="bg-hot-pink text-white rounded-md p-1.5">
                    {isPlaying ? <PauseIcon className="w-4 h-4" /> : <PlayIcon className="w-4 h-4" />}
                </button>
                 <button onClick={() => {}} disabled={isExporting} className="ml-auto px-4 py-1.5 text-sm font-bold text-white bg-hot-pink rounded-md shadow-pink-glow hover:bg-magenta-glow disabled:opacity-50">
                    {isExporting ? 'Exporting...' : 'Export'}
                </button>
            </div>
            <div 
                ref={timelineContainerRef}
                onClick={handleTimelineClick}
                className="flex-grow w-full relative overflow-x-auto bg-[#1e1e1e] rounded-md p-2 space-y-1"
            >
                {/* Video Tracks */}
                {videoTracks.map((track, trackIndex) => (
                    <div key={track.id} onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDropOnTimeline(e, track.id, 'video')} className="relative h-12 flex items-center bg-black/10 rounded-md">
                        <div className="absolute left-0 top-0 bottom-0 flex items-center justify-center bg-[#2d2d2d] w-12 text-xs font-bold text-gray-400 rounded-l-md">V{trackIndex + 1}</div>
                        <div className="relative w-full h-full ml-12">
                            {track.clips.map(clip => {
                                const media = mediaBin.find(m => m.id === clip.mediaId);
                                const isEnhanced = clip.audio?.isEnhanced;
                                return (
                                <div 
                                    key={clip.id}
                                    onContextMenu={(e) => handleClipContextMenu(e, clip.id, 'video')}
                                    onClick={(e) => { e.stopPropagation(); setSelectedClipId(clip.id); setContextMenu(null); }}
                                    className={`absolute h-full bg-deep-magenta rounded-md cursor-pointer border-2 overflow-hidden ${selectedClipId === clip.id ? 'border-magenta-glow' : 'border-hot-pink/50'} ${isEnhanced ? 'shadow-inner shadow-cyan-400' : ''}`}
                                    style={{ left: `${clip.startOffset * PIXELS_PER_SECOND}px`, width: `${clip.trimmedDuration * PIXELS_PER_SECOND}px` }}
                                >
                                    <p className="text-xs text-white p-1 truncate">{media?.name}</p>
                                </div>
                            )})}
                        </div>
                    </div>
                ))}
                 {/* Audio Tracks */}
                {audioTracks.map((track, trackIndex) => (
                    <div key={track.id} onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDropOnTimeline(e, track.id, 'audio')} className="relative h-12 flex items-center bg-black/10 rounded-md">
                        <div className="absolute left-0 top-0 bottom-0 flex items-center justify-center bg-[#2d2d2d] w-12 text-xs font-bold text-gray-400 rounded-l-md">A{trackIndex + 1}</div>
                        <div className="relative w-full h-full ml-12">
                            {track.clips.map(clip => {
                                const media = mediaBin.find(m => m.id === clip.mediaId);
                                const isEnhanced = clip.isEnhanced;
                                return (
                                <div 
                                    key={clip.id}
                                    onContextMenu={(e) => handleClipContextMenu(e, clip.id, 'audio')}
                                    onClick={(e) => { e.stopPropagation(); setSelectedClipId(clip.id); setContextMenu(null); }}
                                    className={`absolute h-full bg-teal-800 rounded-md cursor-pointer border-2 overflow-hidden ${selectedClipId === clip.id ? 'border-teal-300' : 'border-teal-600'} ${isEnhanced ? 'shadow-inner shadow-cyan-400' : ''}`}
                                    style={{ left: `${clip.startOffset * PIXELS_PER_SECOND}px`, width: `${clip.trimmedDuration * PIXELS_PER_SECOND}px` }}
                                >
                                    <p className="text-xs text-white p-1 truncate">{media?.name}</p>
                                     <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-black/20 pointer-events-none">
                                        <div className="w-full h-full bg-repeat-x opacity-50" style={{ backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w.org/2000/svg" width="100" height="20"><path d="M0 10 L 5 15 L 10 5 L 15 12 L 20 8 L 25 18 L 30 2 L 35 10 L 100 10" stroke="%232dd4bf" fill="none" stroke-width="1"/></svg>')`}}></div>
                                    </div>
                                </div>
                            )})}
                        </div>
                    </div>
                ))}
                {/* Playhead */}
                <div className="absolute top-0 bottom-0 w-0.5 bg-magenta-glow z-20 pointer-events-none" style={{ left: `calc(${playheadPosition * PIXELS_PER_SECOND}px + 48px)`}}>
                    <div className="absolute -top-1 -left-1.5 w-4 h-4 bg-magenta-glow rounded-full"></div>
                </div>
            </div>
        </div>
      </div>
       {contextMenu && (
        <div
            style={{ top: contextMenu.y, left: contextMenu.x }}
            className="absolute z-50 bg-[#2d2d2d] border border-hot-pink/50 rounded-md shadow-lg py-1 text-sm w-48"
        >
            <button className="w-full text-left px-3 py-1.5 hover:bg-hot-pink/20">Split Clip</button>
            <button onClick={() => handleEnhanceSpeech(contextMenu.clipId, contextMenu.clipType)} className="w-full text-left px-3 py-1.5 hover:bg-hot-pink/20 flex items-center gap-2"><BrainCircuitIcon className="w-4 h-4 text-cyan-400" /> Enhance Speech (AI)</button>
            <div className="my-1 h-px bg-white/10"></div>
            <button className="w-full text-left px-3 py-1.5 text-red-400 hover:bg-red-400/20">Delete</button>
        </div>
        )}
    </div>
    );
};