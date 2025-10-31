


import React, { useState, useEffect, useCallback } from 'react';
import { Theme, MediaItem } from './types';
import { SimpleVideoGenerator } from './components/SimpleVideoGenerator';
import { Studio } from './components/Studio';
import { VideoEditor } from './components/VideoEditor';
import { StaticSections } from './components/StaticSections';
import { Header } from './components/Header';
import { LogoIcon } from './components/icons';
import { nanoid } from 'https://cdn.jsdelivr.net/npm/nanoid/nanoid.js';

const ApiKeySelector: React.FC<{ onKeySelected: () => void }> = ({ onKeySelected }) => {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-lg flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-deep-magenta/50 border border-hot-pink rounded-2xl p-8 max-w-md text-center shadow-pink-glow">
        <h2 className="font-display text-3xl font-bold text-white mb-4">Welcome to Xylax Motion</h2>
        <p className="text-gray-300 mb-6">To begin generating videos with our state-of-the-art Veo model, please select an API key. This is a required step for API access.</p>
        <p className="text-xs text-gray-400 mb-6">
            For more information on billing, please visit <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline hover:text-hot-pink">ai.google.dev/gemini-api/docs/billing</a>.
        </p>
        <button
          onClick={async () => {
            if (window.aistudio) {
                await window.aistudio.openSelectKey();
            }
            onKeySelected();
          }}
          className="w-full px-8 py-4 font-bold text-white bg-hot-pink rounded-lg shadow-pink-glow hover:bg-magenta-glow transition-all duration-300"
        >
          Select API Key
        </button>
      </div>
    </div>
  );
};

export type Page = 'generator' | 'studio' | 'editor';

function App() {
  const [theme, setTheme] = useState<Theme>(Theme.Light);
  const [apiKeySelected, setApiKeySelected] = useState(false);
  const [showApiKeySelector, setShowApiKeySelector] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remixPrompt, setRemixPrompt] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>('generator');
  const [initialEditorMedia, setInitialEditorMedia] = useState<MediaItem[]>([]);

  useEffect(() => {
    if (theme === Theme.Dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const checkApiKey = useCallback(async () => {
    if (window.aistudio) {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      setApiKeySelected(hasKey);
      if (!hasKey) {
        setShowApiKeySelector(true);
      }
    } else {
      console.warn("aistudio not found. Assuming API key is set via environment variable.");
      setApiKeySelected(true); 
    }
  }, []);

  useEffect(() => {
    checkApiKey();
  }, [checkApiKey]);

  const handleKeySelected = () => {
    setApiKeySelected(true);
    setShowApiKeySelector(false);
  };

  const handleGenerationError = (message: string) => {
    if(message.includes("API key not found")) {
      setError("Your API key seems to be invalid. Please select a new one.");
      setShowApiKeySelector(true);
      setApiKeySelected(false);
    } else {
      setError(message);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === Theme.Light ? Theme.Dark : Theme.Light);
  };
  
  const handleRemix = (prompt: string) => {
    setRemixPrompt(prompt);
    setCurrentPage('studio');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // FIX: Updated function signature to accept a MediaItem object directly.
  const handleSendToEditor = (mediaItem: MediaItem) => {
    setInitialEditorMedia([mediaItem]);
    setCurrentPage('editor');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPage = () => {
    switch(currentPage) {
        case 'studio':
            return (
                <Studio
                    onGenerationError={handleGenerationError}
                    remixPrompt={remixPrompt}
                    onRemixConsumed={() => setRemixPrompt(null)}
                    onSendToEditor={handleSendToEditor}
                />
            );
        case 'editor':
             return (
                // FIX: Passed the required 'onGenerationError' prop.
                <VideoEditor initialMedia={initialEditorMedia} onClearInitialMedia={() => setInitialEditorMedia([])} onGenerationError={handleGenerationError} />
            );
        case 'generator':
        default:
            return (
                <>
                    {/* Hero Section */}
                    <div className="text-center py-20 sm:py-32 px-4">
                        <div className="inline-block animate-pulse-glow mb-12">
                            <LogoIcon className="w-32 h-32 text-hot-pink "/>
                        </div>
                        <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-black text-black dark:text-white leading-tight">
                            Videos With <br />
                            <span className="text-hot-pink">Infinite Possibilities</span>
                        </h1>
                        <p className="mt-6 max-w-2xl mx-auto text-gray-600 dark:text-gray-300">
                            Transform your ideas into cinematic reality. Our AI, powered by Xylax AI, turns your imagination into breathtaking video content.
                        </p>
                    </div>

                    <SimpleVideoGenerator onGenerationError={handleGenerationError} onSendToEditor={handleSendToEditor} />
                    <StaticSections onRemix={handleRemix} />
                </>
            );
    }
  }

  return (
    <div className="bg-white dark:bg-gradient-to-br dark:from-black dark:via-deep-magenta/50 dark:to-black text-black dark:text-white min-h-screen font-sans transition-colors duration-500">
      {/* Background Animation */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%3E%3Cpath%20d%3D%22M0%2050%20L50%200%20L100%2050%20L50%20100%20Z%22%20fill%3D%22none%22%20stroke%3D%22rgba(0%2C0%2C0%2C0.05)%22%20stroke-width%3D%221%22%2F%3E%3C%2Fsvg%3E')] dark:bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%3E%3Cpath%20d%3D%22M0%2050%20L50%200%20L100%2050%20L50%20100%20Z%22%20fill%3D%22none%22%20stroke%3D%22rgba(255%2C29%2C232%2C0.1)%22%20stroke-width%3D%221%22%2F%3E%3C%2Fsvg%3E')] bg-repeat bg-center opacity-50 dark:opacity-100"></div>
      
      <div className="relative z-10">
        <Header 
            currentPage={currentPage} 
            setCurrentPage={setCurrentPage} 
            theme={theme} 
            toggleTheme={toggleTheme} 
        />

        <main>
          {showApiKeySelector && <ApiKeySelector onKeySelected={handleKeySelected} />}
          
          {error && (
            <div className="max-w-4xl mx-auto my-4 p-4 bg-red-500/20 border border-red-500 text-red-200 rounded-lg text-center">
              <p>{error}</p>
              <button onClick={() => setError(null)} className="mt-2 underline text-sm">Dismiss</button>
            </div>
          )}

          {apiKeySelected ? (
             renderPage()
          ) : (
             !showApiKeySelector && (
                 <div className="flex items-center justify-center h-[50vh]">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-hot-pink"></div>
                    <p className="ml-4 font-display text-xl text-black dark:text-white">Verifying API access...</p>
                 </div>
             )
          )}
        </main>

        <footer className="mt-16 py-8 border-t border-black/10 dark:border-hot-pink/20">
          <div className="max-w-7xl mx-auto text-center px-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">&copy; 2025 Xylax AI. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
