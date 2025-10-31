import React, { useState, useCallback, useEffect } from 'react';
import { generateVideo, analyzeVideoPrompt, getCreativePrompt, generateSpeech, generateShotList, extendVideo } from '../services/geminiService';
import { AspectRatio, Scene, MediaItem } from '../types';
// FIX: Removed BrainCircuitIcon as it is not defined in icons.tsx and not used in this component.
import { DownloadIcon, MagicWandIcon, EditorIcon, PlusIcon } from './icons';
import { nanoid } from 'https://cdn.jsdelivr.net/npm/nanoid/nanoid.js';

const loadingMessages = [
  "Initializing hyper-cores...", "Calibrating quantum dream engine...", "Weaving digital visions...", "Consulting with the digital muse...", "Rendering final sequence...", "This can take a few minutes...",
];

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = (error) => reject(error);
  });

const cameraPresets = { "Dolly Zoom": "dolly zoom", "Crane Shot": "crane shot", "Tracking Shot": "tracking shot", "Low Angle": "low angle shot", "Dutch Angle": "dutch angle" };
const stylePresets = { "Cinematic": "cinematic, shallow depth of field, 8K, photorealistic", "Anime": "anime style, cel shaded, vibrant colors", "Documentary": "documentary style, natural lighting", "Noir": "film noir, black and white, high contrast", "VFX": "hyper-detailed, VFX, octane render" };

interface StudioProps {
  onGenerationError: (message: string) => void;
  remixPrompt: string | null;
  onRemixConsumed: () => void;
  onSendToEditor: (mediaItem: MediaItem) => void;
}

export const Studio: React.FC<StudioProps> = ({ onGenerationError, remixPrompt, onRemixConsumed, onSendToEditor }) => {
  const [scenes, setScenes] = useState<Scene[]>([{ id: nanoid(), prompt: '', imageFile: null }]);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);
  
  const [creativeIdea, setCreativeIdea] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  
  const [shotListIdea, setShotListIdea] = useState('');
  const [isGeneratingShots, setIsGeneratingShots] = useState(false);
  const [generatedShots, setGeneratedShots] = useState<string[]>([]);
  
  const [script, setScript] = useState('');
  const [isGeneratingFromScript, setIsGeneratingFromScript] = useState(false);

  const [voiceoverScript, setVoiceoverScript] = useState('');
  const [isGeneratingSpeech, setIsGeneratingSpeech] = useState(false);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);

  const [projectName, setProjectName] = useState('My Xylax Project');
  const [projectTags, setProjectTags] = useState('');
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [loadSearch, setLoadSearch] = useState('');

  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
  const selectedScene = scenes.find(s => s.id === selectedSceneId);

  useEffect(() => {
    if (remixPrompt) {
      setScenes(currentScenes => {
        const newScenes = [...currentScenes];
        if (newScenes.length > 0 && newScenes[0].prompt === '') {
          newScenes[0].prompt = remixPrompt;
        } else {
          newScenes.unshift({ id: nanoid(), prompt: remixPrompt, imageFile: null });
        }
        return newScenes;
      });
      setSelectedSceneId(scenes[0].id);
      onRemixConsumed();
    }
  }, [remixPrompt, onRemixConsumed]);
  
   useEffect(() => {
    if (scenes.length > 0 && !selectedSceneId) {
      setSelectedSceneId(scenes[0].id);
    } else if (scenes.length === 0) {
        setSelectedSceneId(null);
    }
  }, [scenes, selectedSceneId]);


  const handleSceneChange = (id: string, field: keyof Scene, value: any) => {
    setScenes(scenes.map(scene => scene.id === id ? { ...scene, [field]: value } : scene));
  };
  
  const addScene = (prompt = '') => {
    const newScene = { id: nanoid(), prompt, imageFile: null };
    setScenes([...scenes, newScene]);
    setSelectedSceneId(newScene.id);
  }
  const removeScene = (id: string) => setScenes(scenes.filter(scene => scene.id !== id));
  
  const handleAppendToPrompt = (text: string) => {
    if (!selectedScene) return;
    const currentPrompt = selectedScene.prompt.trim();
    const newPrompt = currentPrompt ? `${currentPrompt}, ${text}` : text;
    handleSceneChange(selectedScene.id, 'prompt', newPrompt);
  };

  const handleCreativePrompt = async () => {
    if (!creativeIdea) return;
    setIsThinking(true);
    try {
      const newPrompt = await getCreativePrompt(creativeIdea);
      if (selectedScene) {
        handleSceneChange(selectedScene.id, 'prompt', newPrompt);
      } else {
        addScene(newPrompt);
      }
    } catch (error) {
       onGenerationError(error instanceof Error ? error.message : 'An unknown error occurred.');
    } finally {
      setIsThinking(false);
    }
  };
  
  const handleGenerateShotList = async () => {
      if(!shotListIdea) return;
      setIsGeneratingShots(true);
      setGeneratedShots([]);
      try {
          const shots = await generateShotList(shotListIdea);
          setGeneratedShots(shots);
      } catch (error) {
          onGenerationError(error instanceof Error ? error.message : 'An unknown error occurred.');
      } finally {
          setIsGeneratingShots(false);
      }
  }

  const handleGenerateFromScript = async () => {
    if(!script) return;
    setIsGeneratingFromScript(true);
    try {
        const shots = await generateShotList(script); // Using shot list as a scene parser
        const newScenes: Scene[] = shots.map(shot => ({ id: nanoid(), prompt: shot, imageFile: null }));
        setScenes(newScenes);
        if (newScenes.length > 0) {
            setSelectedSceneId(newScenes[0].id);
        }
    } catch (error) {
        onGenerationError(error instanceof Error ? error.message : 'An unknown error occurred.');
    } finally {
        setIsGeneratingFromScript(false);
    }
  }


  const handleGenerateStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (scenes.every(s => !s.prompt)) {
      alert("Please enter a prompt in at least one scene."); return;
    }
    setIsLoading(true);

    let messageInterval: ReturnType<typeof setInterval>;
    try {
      let messageIndex = 0;
      messageInterval = setInterval(() => setLoadingMessage(loadingMessages[++messageIndex % loadingMessages.length]), 5000);

      for (const scene of scenes) {
        if (!scene.prompt) continue;
        const imageInput = scene.imageFile ? { imageBytes: await fileToBase64(scene.imageFile), mimeType: scene.imageFile.type } : undefined;
        
        // Negative prompt is handled by the API, not by string manipulation
        const result = await generateVideo(scene.prompt, aspectRatio, imageInput);

        setScenes(cs => cs.map(s => s.id === scene.id ? { ...s, generatedVideoUrl: result.blobUrl, videoOperationResponse: result.operationResponse } : s));
      }
    } catch (error) {
       onGenerationError(error instanceof Error ? error.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
      clearInterval(messageInterval!);
    }
  };

  const handleGenerateSpeech = async () => {
    if(!voiceoverScript) return;
    setIsGeneratingSpeech(true);
    setGeneratedAudioUrl(null);
    try {
      setGeneratedAudioUrl(await generateSpeech(voiceoverScript));
    // FIX: Corrected syntax error in catch block.
    } catch (error) {
      onGenerationError(error instanceof Error ? error.message : 'An unknown error occurred.');
    } finally {
      setIsGeneratingSpeech(false);
    }
  };
  
  const handleSendSceneToEditor = (scene: Scene) => {
    if (!scene.generatedVideoUrl) return;
    
    const mediaItem: MediaItem = {
      id: nanoid(),
      name: `Scene: ${scene.prompt.substring(0, 20)}...`,
      url: scene.generatedVideoUrl,
      duration: 0, // Will be calculated in editor
      // FIX: Added 'hasAudio' property to conform to the MediaItem type.
      hasAudio: false,
      origin: 'generated',
      prompt: scene.prompt,
      negativePrompt: scene.negativePrompt,
      videoOperationResponse: scene.videoOperationResponse,
    };
    onSendToEditor(mediaItem);
  };


  const saveProject = () => {
    try {
      const projectData = {
        projectName,
        scenes: scenes.map(({ id, prompt, negativePrompt }) => ({ id, prompt, negativePrompt })),
        aspectRatio,
        tags: projectTags.split(',').map(t => t.trim()).filter(Boolean),
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
      const p = JSON.parse(savedData);
      setProjectName(p.projectName);
      setAspectRatio(p.aspectRatio);
      setScenes(p.scenes.map((s: any) => ({ ...s, imageFile: null })));
      setProjectTags((p.tags || []).join(', '));
      setShowLoadModal(false);
    }
  };
  
  const getSavedProjects = () => Object.keys(localStorage)
    .filter(k => k.startsWith('xylax_project_'))
    .map(k => JSON.parse(localStorage.getItem(k)!))
    .filter(p => p.projectName.toLowerCase().includes(loadSearch.toLowerCase()) || (p.tags || []).some((t:string) => t.toLowerCase().includes(loadSearch.toLowerCase())));

  return (
    <div className="w-full max-w-7xl mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-hot-pink">Creative Studio</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">The complete AI-powered workspace for video creation.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Content: Storyboard & Results */}
        <div className="lg:col-span-2 space-y-8">
            <div className="p-6 bg-white/5 dark:bg-black/10 border border-white/10 dark:border-hot-pink/20 rounded-2xl backdrop-blur-xl shadow-lg">
                <h2 className="font-display text-2xl font-bold text-hot-pink mb-4">Storyboard</h2>
                <div className="space-y-4">
                {scenes.map((scene, index) => (
                    <div key={scene.id} onClick={() => setSelectedSceneId(scene.id)} className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedSceneId === scene.id ? 'border-hot-pink bg-black/20' : 'border-hot-pink/20 bg-black/10'}`}>
                    <div className="flex items-start gap-4">
                        <span className="bg-hot-pink text-white font-bold rounded-full h-8 w-8 flex items-center justify-center flex-shrink-0 mt-1">{index + 1}</span>
                        <p className="text-sm text-gray-400 flex-grow pt-1 truncate">{scene.prompt || "Empty Scene"}</p>
                        <button type="button" onClick={(e) => { e.stopPropagation(); removeScene(scene.id);}} className="text-red-400 hover:text-red-600 font-bold text-xl">&times;</button>
                    </div>
                    </div>
                ))}
                </div>
                <button type="button" onClick={() => addScene()} className="mt-4 px-4 py-2 text-sm font-bold text-hot-pink border-2 border-hot-pink rounded-lg hover:bg-hot-pink hover:text-white transition-all flex items-center gap-2">
                    <PlusIcon className="w-4 h-4" /> Add Scene
                </button>
            </div>

            {scenes.some(s => s.generatedVideoUrl) && (
              <div className="mt-12 animate-fade-in space-y-12">
                {scenes.filter(s => s.generatedVideoUrl).map((scene) => (
                  <div key={scene.id}>
                    <h2 className="font-display text-2xl sm:text-3xl text-center font-bold text-hot-pink mb-6">Scene {scenes.findIndex(s => s.id === scene.id) + 1} Result</h2>
                    <div className="relative group">
                      <video src={scene.generatedVideoUrl} controls autoPlay loop muted className="w-full rounded-2xl shadow-pink-glow" />
                      <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <a href={scene.generatedVideoUrl} download={`xylax-scene.mp4`} className="bg-black/50 text-white p-3 rounded-full backdrop-blur-sm" aria-label="Download video"><DownloadIcon className="w-6 h-6" /></a>
                         <button onClick={() => handleSendSceneToEditor(scene)} className="bg-black/50 text-white p-3 rounded-full backdrop-blur-sm" aria-label="Edit in Xylax Edit"><EditorIcon className="w-6 h-6" /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </div>

        {/* Right Sidebar: Inspector & Tools */}
        <div className="space-y-8">
            <div className="p-6 bg-white/5 dark:bg-black/10 border border-white/10 dark:border-hot-pink/20 rounded-2xl backdrop-blur-xl shadow-lg">
                <h2 className="font-display text-2xl font-bold text-hot-pink mb-4">Inspector</h2>
                {selectedScene ? (
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-bold text-gray-400">Prompt</label>
                            <textarea value={selectedScene.prompt} onChange={(e) => handleSceneChange(selectedScene.id, 'prompt', e.target.value)} rows={4} className="w-full bg-black/20 border border-hot-pink/30 rounded-lg p-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-hot-pink focus:outline-none mt-1"/>
                        </div>
                         <div>
                            <label className="text-sm font-bold text-gray-400">Negative Prompt (what to avoid)</label>
                            <input type="text" value={selectedScene.negativePrompt || ''} onChange={(e) => handleSceneChange(selectedScene.id, 'negativePrompt', e.target.value)} placeholder="e.g., text, watermarks, blurry" className="w-full bg-black/20 border border-hot-pink/30 rounded-lg p-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-hot-pink focus:outline-none mt-1"/>
                        </div>
                        <div>
                            <label className="text-sm font-bold text-gray-400">Reference Image</label>
                            <input type="file" accept="image/*" onChange={(e) => handleSceneChange(selectedScene.id, 'imageFile', e.target.files ? e.target.files[0] : null)} className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-hot-pink/20 file:text-hot-pink hover:file:bg-hot-pink/40 mt-1"/>
                        </div>
                        <div>
                           <label className="text-sm font-bold text-gray-400">Camera Presets</label>
                           <div className="flex flex-wrap gap-2 mt-1">
                            {Object.entries(cameraPresets).map(([name, value]) => <button key={name} onClick={() => handleAppendToPrompt(value)} className="text-xs px-2 py-1 bg-black/20 border border-hot-pink/30 rounded-md hover:bg-hot-pink/50">{name}</button>)}
                           </div>
                        </div>
                        <div>
                           <label className="text-sm font-bold text-gray-400">Style Presets</label>
                           <div className="flex flex-wrap gap-2 mt-1">
                            {Object.entries(stylePresets).map(([name, value]) => <button key={name} onClick={() => handleAppendToPrompt(value)} className="text-xs px-2 py-1 bg-black/20 border border-hot-pink/30 rounded-md hover:bg-hot-pink/50">{name}</button>)}
                           </div>
                        </div>
                    </div>
                ) : <p className="text-gray-500">Select a scene to inspect and edit.</p>}
            </div>

            <div className="p-6 bg-white/5 dark:bg-black/10 border border-white/10 dark:border-hot-pink/20 rounded-2xl backdrop-blur-xl shadow-lg">
                <h2 className="font-display text-2xl font-bold text-hot-pink mb-4">Creative Assistant</h2>
                <div className="space-y-6">
                    <div>
                        <p className="text-sm text-gray-400 mb-2">Generate a cinematic prompt from an idea.</p>
                        <div className="flex gap-2">
                        <input type="text" value={creativeIdea} onChange={(e) => setCreativeIdea(e.target.value)} placeholder="a cyberpunk city..." className="w-full bg-black/20 border border-hot-pink/30 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-hot-pink focus:outline-none"/>
                        <button onClick={handleCreativePrompt} disabled={isThinking || !creativeIdea} className="px-4 py-2 font-bold text-white bg-hot-pink rounded-lg shadow-pink-glow hover:bg-magenta-glow disabled:opacity-50">Think</button>
                        </div>
                    </div>
                    <div>
                        <p className="text-sm text-gray-400 mb-2">Generate a shot list from a concept.</p>
                         <div className="flex gap-2">
                            <input type="text" value={shotListIdea} onChange={e => setShotListIdea(e.target.value)} placeholder="detective finds a clue..." className="w-full bg-black/20 border border-hot-pink/30 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-hot-pink focus:outline-none"/>
                            <button onClick={handleGenerateShotList} disabled={isGeneratingShots || !shotListIdea} className="px-4 py-2 font-bold text-white bg-hot-pink rounded-lg shadow-pink-glow hover:bg-magenta-glow disabled:opacity-50">Create</button>
                        </div>
                        {generatedShots.length > 0 && <div className="mt-2 space-y-2">{generatedShots.map((shot, i) => <div key={i} className="flex items-center gap-2 text-sm bg-black/20 p-2 rounded-md"><p className="flex-grow text-gray-300">{shot}</p><button onClick={() => addScene(shot)} className="text-hot-pink hover:text-magenta-glow"><PlusIcon className="w-5 h-5"/></button></div>)}</div>}
                    </div>
                    <div>
                        <p className="text-sm text-gray-400 mb-2">Script to Storyboard</p>
                        <textarea value={script} onChange={e => setScript(e.target.value)} placeholder="Paste your full script here..." rows={4} className="w-full bg-black/20 border border-hot-pink/30 rounded-lg p-2 text-white focus:ring-hot-pink focus:outline-none"/>
                        <button onClick={handleGenerateFromScript} disabled={isGeneratingFromScript || !script} className="w-full mt-2 px-4 py-2 font-bold text-white bg-hot-pink rounded-lg shadow-pink-glow hover:bg-magenta-glow disabled:opacity-50">{isGeneratingFromScript ? 'Analyzing Script...' : 'Create Storyboard'}</button>
                    </div>
                    <div>
                        <p className="text-sm text-gray-400 mb-2">Generate a voiceover.</p>
                        <textarea value={voiceoverScript} onChange={e => setVoiceoverScript(e.target.value)} placeholder="Enter script here..." rows={3} className="w-full bg-black/20 border border-hot-pink/30 rounded-lg p-2 text-white focus:ring-hot-pink focus:outline-none"/>
                        <button onClick={handleGenerateSpeech} disabled={isGeneratingSpeech || !voiceoverScript} className="w-full mt-2 px-4 py-2 font-bold text-white bg-hot-pink rounded-lg shadow-pink-glow hover:bg-magenta-glow disabled:opacity-50">{isGeneratingSpeech ? 'Generating...' : 'Generate Voiceover'}</button>
                        {generatedAudioUrl && <div className="mt-2"><audio src={generatedAudioUrl} controls className="w-full" /></div>}
                    </div>
                </div>
            </div>
             <div className="p-6 bg-white/5 dark:bg-black/10 border border-white/10 dark:border-hot-pink/20 rounded-2xl backdrop-blur-xl shadow-lg">
                <h2 className="font-display text-2xl font-bold text-hot-pink mb-4">Project Controls</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-bold text-gray-400">Project Name</label>
                    <input type="text" value={projectName} onChange={e => setProjectName(e.target.value)} className="w-full bg-black/20 border border-hot-pink/30 rounded-lg px-3 py-2 text-white mt-1"/>
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-400">Tags (comma-separated)</label>
                    <input type="text" value={projectTags} onChange={e => setProjectTags(e.target.value)} placeholder="sci-fi, client-work" className="w-full bg-black/20 border border-hot-pink/30 rounded-lg px-3 py-2 text-white mt-1"/>
                  </div>
                   <div className="flex gap-2">
                    <button onClick={saveProject} className="w-full px-4 py-2 font-bold text-white bg-deep-magenta rounded-lg hover:bg-hot-pink">Save Project</button>
                    <button onClick={() => setShowLoadModal(true)} className="w-full px-4 py-2 font-bold text-white bg-deep-magenta rounded-lg hover:bg-hot-pink">Load Project</button>
                   </div>
                   <div className="flex gap-4 pt-4">
                    {(['16:9', '9:16'] as AspectRatio[]).map(ratio => <button key={ratio} type="button" onClick={() => setAspectRatio(ratio)} className={`px-6 py-3 rounded-lg font-bold transition-all w-full ${aspectRatio === ratio ? 'bg-hot-pink text-white shadow-pink-glow' : 'bg-black/20 border-hot-pink/30 text-white'}`}>{ratio}</button>)}
                   </div>
                   <button type="submit" onClick={handleGenerateStory} disabled={isLoading} className="w-full px-12 py-4 font-display text-xl font-bold text-white bg-hot-pink rounded-xl shadow-pink-glow hover:bg-magenta-glow disabled:opacity-50 transform hover:scale-105">
                     {isLoading ? loadingMessage : 'Generate Story'}
                   </button>
                </div>
             </div>
        </div>
      </div>
      
      {showLoadModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-lg flex items-center justify-center z-50 animate-fade-in" onClick={() => setShowLoadModal(false)}>
            <div className="bg-deep-magenta/50 border border-hot-pink rounded-2xl p-6 max-w-lg w-full text-center shadow-pink-glow space-y-4" onClick={e => e.stopPropagation()}>
                <h2 className="font-display text-2xl text-white">Load Project</h2>
                <input type="search" value={loadSearch} onChange={e => setLoadSearch(e.target.value)} placeholder="Search by name or tag..." className="w-full bg-black/20 border border-hot-pink/30 rounded-lg px-3 py-2 text-white"/>
                <div className="max-h-64 overflow-y-auto space-y-2">
                    {getSavedProjects().map(p => (
                        <div key={p.projectName} onClick={() => loadProject(p.projectName)} className="p-3 bg-black/20 rounded-lg text-left cursor-pointer hover:bg-hot-pink/20">
                            <p className="font-bold text-white">{p.projectName}</p>
                            <div className="flex gap-1 mt-1">{p.tags?.map((t:string) => <span key={t} className="text-xs bg-hot-pink/50 text-white px-2 py-0.5 rounded-full">{t}</span>)}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
