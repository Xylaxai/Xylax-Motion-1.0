import React, { useState } from 'react';
import { generateVideo } from '../services/geminiService';
// FIX: Imported MediaItem to use in props and for creating the object to send to the editor.
import { AspectRatio, MediaItem } from '../types';
import { DownloadIcon, EditorIcon } from './icons';
// FIX: Imported nanoid to generate unique IDs for media items.
import { nanoid } from 'https://cdn.jsdelivr.net/npm/nanoid/nanoid.js';

const loadingMessages = [
  "Initializing hyper-cores...",
  "Calibrating quantum dream engine...",
  "Weaving digital visions...",
  "Consulting with the digital muse...",
  "Rendering final sequence...",
  "This can take a few minutes...",
];

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = (error) => reject(error);
  });

interface SimpleVideoGeneratorProps {
  onGenerationError: (message: string) => void;
  // FIX: Updated prop type to accept a MediaItem object.
  onSendToEditor: (mediaItem: MediaItem) => void;
}

export const SimpleVideoGenerator: React.FC<SimpleVideoGeneratorProps> = ({ onGenerationError, onSendToEditor }) => {
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);


  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt) {
      alert("Please enter a prompt.");
      return;
    }

    setIsLoading(true);
    setGeneratedVideoUrl(null);

    let messageInterval: ReturnType<typeof setInterval>;
    try {
      let messageIndex = 0;
      messageInterval = setInterval(() => {
        messageIndex = (messageIndex + 1) % loadingMessages.length;
        setLoadingMessage(loadingMessages[messageIndex]);
      }, 5000);

      const imageInput = imageFile
        ? { imageBytes: await fileToBase64(imageFile), mimeType: imageFile.type }
        : undefined;

      const fullPrompt = negativePrompt ? `${prompt} --no ${negativePrompt}` : prompt;
      const result = await generateVideo(fullPrompt, aspectRatio, imageInput);
      setGeneratedVideoUrl(result.blobUrl);
      
    } catch (error) {
       onGenerationError(error instanceof Error ? error.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
      clearInterval(messageInterval!);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-12 px-4">
      <form onSubmit={handleGenerate} className="space-y-8 p-6 bg-white/5 dark:bg-black/10 border border-white/10 dark:border-hot-pink/20 rounded-2xl backdrop-blur-xl shadow-lg">
        <div>
            <label htmlFor="prompt" className="block font-display text-xl font-bold text-hot-pink mb-4">
                1. Describe Your Vision
            </label>
            <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={`A neon hologram of a cat driving at top speed...`}
                rows={4}
                className="w-full bg-white/10 dark:bg-black/20 border border-white/20 dark:border-hot-pink/30 rounded-lg p-3 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-hot-pink focus:outline-none"
            />
            <input
                type="text"
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                placeholder="Negative prompt (e.g., text, watermarks, blurry)"
                className="w-full mt-2 bg-white/10 dark:bg-black/20 border border-white/20 dark:border-hot-pink/30 rounded-lg p-3 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-hot-pink focus:outline-none"
            />
        </div>

         <div>
            <label htmlFor="image-upload" className="block font-display text-xl font-bold text-hot-pink mb-4">
                2. (Optional) Add a Reference Image
            </label>
            <input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)}
                className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-hot-pink file:text-white hover:file:bg-magenta-glow"
            />
            {imageFile && <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Selected: {imageFile.name}</p>}
        </div>

        <div>
            <h3 className="block font-display text-xl font-bold text-hot-pink mb-4">3. Select Aspect Ratio</h3>
            <div className="flex gap-4">
                {(['16:9', '9:16'] as AspectRatio[]).map(ratio => (
                    <button type="button" onClick={() => setAspectRatio(ratio)} className={`px-6 py-3 rounded-lg font-bold transition-all w-full ${aspectRatio === ratio ? 'bg-hot-pink text-white shadow-pink-glow' : 'bg-white/10 dark:bg-black/20 border border-white/20 dark:border-hot-pink/30 text-black dark:text-white'}`}>
                        {ratio}
                    </button>
                ))}
            </div>
        </div>

        <div className="text-center">
          <button type="submit" disabled={isLoading} className="px-12 py-4 font-display text-xl font-bold text-white bg-hot-pink rounded-xl shadow-pink-glow hover:bg-magenta-glow transition-all disabled:opacity-50 transform hover:scale-105">
            {isLoading ? 'Generating...' : 'Generate Video'}
          </button>
        </div>
      </form>

      {isLoading && (
        <div className="mt-12 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-hot-pink mx-auto"></div>
          <p className="mt-4 font-display text-xl text-magenta-glow">{loadingMessage}</p>
        </div>
      )}
      
      {generatedVideoUrl && (
        <div className="mt-12 animate-fade-in">
            <h2 className="font-display text-2xl sm:text-3xl text-center font-bold text-hot-pink mb-6">Your Generated Video</h2>
            <div className="relative group">
              <video src={generatedVideoUrl} controls autoPlay loop muted className="w-full rounded-2xl shadow-pink-glow" />
              <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <a href={generatedVideoUrl} download={`xylax-video.mp4`} className="bg-black/50 text-white p-3 rounded-full backdrop-blur-sm" aria-label="Download video">
                    <DownloadIcon className="w-6 h-6" />
                </a>
                {/* FIX: Updated onClick to create and send a MediaItem object. */}
                <button onClick={() => {
                  if (generatedVideoUrl) {
                    onSendToEditor({
                      id: nanoid(),
                      name: prompt || 'Generated Video',
                      url: generatedVideoUrl,
                      duration: 0, // Duration will be calculated in the editor
                      // FIX: Added 'hasAudio' property to conform to the MediaItem type.
                      hasAudio: false,
                    });
                  }
                }} className="bg-black/50 text-white p-3 rounded-full backdrop-blur-sm" aria-label="Edit in Xylax Edit">
                    <EditorIcon className="w-6 h-6" />
                </button>
              </div>
            </div>
        </div>
       )}
    </div>
  );
};
