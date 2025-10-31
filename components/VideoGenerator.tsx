import React, { useState, useCallback, useEffect } from 'react';
import { generateVideo, analyzeVideoPrompt, getCreativePrompt, generateSpeech } from '../services/geminiService';
import { AspectRatio, Scene } from '../types';
import { DownloadIcon, MagicWandIcon, EditorIcon } from './icons';
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

interface StudioProps {
  onGenerationError: (message: string) => void;
  remixPrompt: string | null;
  onRemixConsumed: () => void;
  onSendToEditor: (videoUrl: string, name: string) => void;
}

export const Studio: React.FC<StudioProps> = ({ onGenerationError, remixPrompt, onRemixConsumed, onSendToEditor }) => {
  const [scenes, setScenes] = useState<Scene[]>([{ id: nanoid(), prompt: '', imageFile: null }]);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);
  const [videoAnalysis, setVideoAnalysis] = useState<{ [sceneId: string]: string }>({});
  const [isAnalyzing, setIsAnalyzing] = useState<string | null>(null);

  const [creativeIdea, setCreativeIdea] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  
  const [voiceoverScript, setVoiceoverScript] = useState('');
  const [isGeneratingSpeech, setIsGeneratingSpeech] = useState(false);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);

  const [projectName, setProjectName] = useState('My Xylax Project');

  useEffect(() => {
    if (remixPrompt) {
      setScenes(currentScenes => {
        const newScenes = [...currentScenes];
        if (newScenes.length === 0) {
          newScenes.push({ id: nanoid(), prompt: remixPrompt, imageFile: null });
        } else {
          newScenes[0].prompt = remixPrompt;
        }
        return newScenes;
      });
      onRemixConsumed();
    }
  }, [remixPrompt, onRemixConsumed]);

  const handleSceneChange = (id: string, field: 'prompt' | 'imageFile', value: string | File | null) => {
    setScenes(scenes.map(scene => scene.id === id ? { ...scene, [field]: value } : scene));
  };
  
  const addScene = () => setScenes([...scenes, { id: nanoid(), prompt: '', imageFile: null }]);
  const removeScene = (id: string) => setScenes(scenes.filter(scene => scene.id !== id));

  const handleCreativePrompt = useCallback(async () => {
    if (!creativeIdea) return;
    setIsThinking(true);
    try {
      const newPrompt = await getCreativePrompt(creativeIdea);
      // Put prompt in the first scene
      handleSceneChange(scenes[0].id, 'prompt', newPrompt);
    } catch (error) {
       onGenerationError(error instanceof Error ? error.message : 'An unknown error occurred.');
    } finally {
      setIsThinking(false);
    }
  }, [creativeIdea, onGenerationError, scenes]);

  const handleGenerateStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (scenes.every(s => !s.prompt)) {
      alert("Please enter a prompt in at least one scene.");
      return;
    }

    setIsLoading(true);
    setVideoAnalysis({});

    let messageInterval: ReturnType<typeof setInterval>;
    try {
      let messageIndex = 0;
      messageInterval = setInterval(() => {
        messageIndex = (messageIndex + 1) % loadingMessages.length;
        setLoadingMessage(loadingMessages[messageIndex]);
      }, 5000);

      for (const scene of scenes) {
        if (!scene.prompt) continue; // Skip empty scenes
        
        const imageInput = scene.imageFile
          ? { imageBytes: await fileToBase64(scene.imageFile), mimeType: scene.imageFile.type }
          : undefined;

        const result = await generateVideo(scene.prompt, aspectRatio, imageInput);
        
        setScenes(currentScenes => 
          currentScenes.map(s => s.id === scene.id ? { ...s, generatedVideoUrl: result.blobUrl, videoOperationResponse: result.operationResponse } : s)
        );
      }
    } catch (error) {
       onGenerationError(error instanceof Error ? error.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
      clearInterval(messageInterval!);
    }
  };

  const handleAnalyze = async (scene: Scene) => {
      if (!scene.prompt) return;
      setIsAnalyzing(scene.id);
      setVideoAnalysis(prev => ({...prev, [scene.id]: ''}));
      try {
          const analysis = await analyzeVideoPrompt(scene.prompt);
          setVideoAnalysis(prev => ({...prev, [scene.id]: analysis}));
      } catch (error) {
          onGenerationError(error instanceof Error ? error.message : 'An unknown error occurred.');
      } finally {
          setIsAnalyzing(null);
      }
  }

  const handleGenerateSpeech = async () => {
    if(!voiceoverScript) return;
    setIsGeneratingSpeech(true);
    setGeneratedAudioUrl(null);
    try {
      const audioUrl = await generateSpeech(voiceoverScript);
      setGeneratedAudioUrl(audioUrl);
    } catch (error) {
      onGenerationError(error instanceof Error ? error.message : 'An unknown error occurred.');
    } finally {
      setIsGeneratingSpeech(false);
    }
  };

  const saveProject = () => {
    try {
      // We can't save File objects in JSON, so we just save prompts.
      const projectData = {
        projectName,
        scenes: scenes.map(({ id, prompt }) => ({ id, prompt })),
        aspectRatio,
      };
      localStorage.setItem(`xylax_project_${projectName}`, JSON.stringify(projectData));
      alert(`Project "${projectName}" saved!`);
    } catch (e) {
      onGenerationError("Failed to save project. Local storage might be full.");
    }
  };

  const loadProject = (name: string) => {
    const savedData = localStorage.getItem(`xylax_project_${name}`);
    if (savedData) {
      const projectData = JSON.parse(savedData);
      setProjectName(projectData.projectName);
      setAspectRatio(projectData.aspectRatio);
      setScenes(projectData.scenes.map((s: any) => ({ ...s, imageFile: null }))); // Images need to be re-added
    }
  };

  const getSavedProjects = () => {
    return Object.keys(localStorage)
      .filter(key => key.startsWith('xylax_project_'))
      .map(key => key.replace('xylax_project_', ''));
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-12 px-4">
      
      {/* --- Creative Assistant & Project Management --- */}
      <div className="mb-12 p-6 bg-white/5 dark:bg-black/10 border border-white/10 dark:border-hot-pink/20 rounded-2xl backdrop-blur-xl shadow-lg space-y-8">
        <div>
            <div className="text-center mb-8">
                <h1 className="font-display text-4xl sm:text-5xl font-bold text-hot-pink">Creative Studio</h1>
                <p className="text-gray-600 dark:text-gray-300 mt-2">Build, manage, and enhance your video projects.</p>
            </div>
            {/* Project Management */}
            <div className='mb-6'>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Manage your projects.</p>
                <div className="flex flex-col sm:flex-row gap-2">
                    <input type="text" value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="Project Name" className="flex-grow bg-white/10 dark:bg-black/20 border border-white/20 dark:border-hot-pink/30 rounded-lg px-4 py-2 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-hot-pink focus:outline-none"/>
                    <button onClick={saveProject} className="px-4 py-2 text-sm font-bold text-white bg-deep-magenta rounded-lg hover:bg-hot-pink transition-all">Save Project</button>
                    <select onChange={e => loadProject(e.target.value)} defaultValue="" className="bg-white/10 dark:bg-black/20 border border-white/20 dark:border-hot-pink/30 rounded-lg px-4 py-2 text-black dark:text-white focus:ring-2 focus:ring-hot-pink focus:outline-none">
                        <option value="" disabled>Load Project</option>
                        {getSavedProjects().map(name => <option key={name} value={name}>{name}</option>)}
                    </select>
                </div>
            </div>
            {/* Creative Prompt */}
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Stuck for ideas? Describe a concept, and our AI will craft a cinematic prompt for you.</p>
              <div className="flex flex-col sm:flex-row gap-4">
                <input type="text" value={creativeIdea} onChange={(e) => setCreativeIdea(e.target.value)} placeholder="e.g., a cyberpunk city in the rain" className="flex-grow bg-white/10 dark:bg-black/20 border border-white/20 dark:border-hot-pink/30 rounded-lg px-4 py-3 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-hot-pink focus:outline-none"/>
                <button onClick={handleCreativePrompt} disabled={isThinking || !creativeIdea} className="px-6 py-3 font-bold text-white bg-hot-pink rounded-lg shadow-pink-glow hover:bg-magenta-glow transition-all disabled:opacity-50 flex items-center justify-center">
                  {isThinking ? 'Thinking...' : 'Generate Prompt'}
                </button>
              </div>
            </div>
             {/* AI Voiceover */}
            <div className='mt-6'>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Generate a voiceover for your story.</p>
              <div className="flex flex-col sm:flex-row gap-4">
                  <textarea value={voiceoverScript} onChange={e => setVoiceoverScript(e.target.value)} placeholder="Enter your voiceover script here..." rows={2} className="flex-grow bg-white/10 dark:bg-black/20 border border-white/20 dark:border-hot-pink/30 rounded-lg p-3 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-hot-pink focus:outline-none"/>
                  <button onClick={handleGenerateSpeech} disabled={isGeneratingSpeech || !voiceoverScript} className="px-6 py-3 font-bold text-white bg-hot-pink rounded-lg shadow-pink-glow hover:bg-magenta-glow transition-all disabled:opacity-50 flex items-center justify-center">
                      {isGeneratingSpeech ? 'Generating...' : 'Generate Voiceover'}
                  </button>
              </div>
              {generatedAudioUrl && (
                  <div className="mt-4 p-3 bg-black/20 rounded-lg">
                      <audio src={generatedAudioUrl} controls className="w-full" />
                      <a href={generatedAudioUrl} download={`xylax-voiceover-${Date.now()}.wav`} className="text-sm text-hot-pink hover:underline mt-2 inline-block">Download Audio</a>
                  </div>
              )}
            </div>
        </div>
      </div>
      
      {/* --- Storyboard Form --- */}
      <form onSubmit={handleGenerateStory} className="space-y-8">
        <div className="p-6 bg-white/5 dark:bg-black/10 border border-white/10 dark:border-hot-pink/20 rounded-2xl backdrop-blur-xl shadow-lg">
          <h2 className="font-display text-2xl font-bold text-hot-pink mb-4">Storyboard</h2>
          
          <div className="space-y-6">
            {scenes.map((scene, index) => (
              <div key={scene.id} className="p-4 bg-black/10 rounded-lg border border-hot-pink/20 relative">
                <span className="absolute -top-3 -left-3 bg-hot-pink text-white font-bold rounded-full h-8 w-8 flex items-center justify-center">{index + 1}</span>
                <div className="flex justify-end mb-2">
                   {scenes.length > 1 && <button type="button" onClick={() => removeScene(scene.id)} className="text-red-400 hover:text-red-600 font-bold text-xl">&times;</button>}
                </div>
                <textarea
                  value={scene.prompt}
                  onChange={(e) => handleSceneChange(scene.id, 'prompt', e.target.value)}
                  placeholder={`Scene ${index + 1}: A neon hologram of a cat...`}
                  rows={3}
                  className="w-full bg-white/10 dark:bg-black/20 border border-white/20 dark:border-hot-pink/30 rounded-lg p-3 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-hot-pink focus:outline-none"
                />
                <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleSceneChange(scene.id, 'imageFile', e.target.files ? e.target.files[0] : null)}
                    className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-hot-pink file:text-white hover:file:bg-magenta-glow mt-2"
                />
                {scene.imageFile && <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Selected: {scene.imageFile.name}</p>}
              </div>
            ))}
          </div>
          <button type="button" onClick={addScene} className="mt-4 px-4 py-2 text-sm font-bold text-hot-pink border-2 border-hot-pink rounded-lg hover:bg-hot-pink hover:text-white transition-all">Add Scene</button>
        </div>

        <div className="p-6 bg-white/5 dark:bg-black/10 border border-white/10 dark:border-hot-pink/20 rounded-2xl backdrop-blur-xl shadow-lg">
            <h3 className="block font-display text-xl font-bold text-hot-pink mb-4">Project Settings</h3>
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
            {isLoading ? 'Generating Story...' : 'Generate Story'}
          </button>
        </div>
      </form>

      {isLoading && (
        <div className="mt-12 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-hot-pink mx-auto"></div>
          <p className="mt-4 font-display text-xl text-magenta-glow">{loadingMessage}</p>
        </div>
      )}
      
      {/* --- Results Section --- */}
      <div className="mt-12 animate-fade-in space-y-12">
        {scenes.filter(s => s.generatedVideoUrl).map((scene, index) => (
          <div key={scene.id}>
            <h2 className="font-display text-2xl sm:text-3xl text-center font-bold text-hot-pink mb-6">Scene {scenes.findIndex(s => s.id === scene.id) + 1} Result</h2>
            <div className="relative group">
              <video src={scene.generatedVideoUrl} controls autoPlay loop muted className="w-full rounded-2xl shadow-pink-glow" />
              <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                 <a href={scene.generatedVideoUrl} download={`xylax-scene-${index + 1}.mp4`} className="bg-black/50 text-white p-3 rounded-full backdrop-blur-sm" aria-label="Download video">
                    <DownloadIcon className="w-6 h-6" />
                </a>
                <button onClick={() => onSendToEditor(scene.generatedVideoUrl!, `Scene ${index + 1}`)} className="bg-black/50 text-white p-3 rounded-full backdrop-blur-sm" aria-label="Edit in Xylax Edit">
                    <EditorIcon className="w-6 h-6" />
                </button>
              </div>

            </div>
            <div className="text-center mt-6">
              <button onClick={() => handleAnalyze(scene)} disabled={isAnalyzing === scene.id} className="px-6 py-3 font-bold text-white bg-deep-magenta rounded-lg hover:bg-hot-pink transition-all disabled:opacity-50">
                {isAnalyzing === scene.id ? 'Analyzing...' : 'Analyze Scene with Gemini Pro'}
              </button>
            </div>
            {videoAnalysis[scene.id] && (
              <div className="mt-6 p-6 bg-white/5 dark:bg-black/10 border border-white/10 dark:border-hot-pink/20 rounded-2xl backdrop-blur-xl shadow-lg animate-fade-in">
                  <h3 className="font-display text-xl font-bold text-hot-pink mb-4">Scene Analysis</h3>
                  <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap font-sans">{videoAnalysis[scene.id]}</p>
              </div>
            )}
          </div>
        ))}
      </div>

    </div>
  );
};
