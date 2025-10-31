import React, { useState } from 'react';

const HowItWorks = () => (
    <div className="py-16 sm:py-24">
        <div className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-black dark:text-white">How It Works</h2>
            <div className="mt-4 h-1 w-24 bg-hot-pink mx-auto rounded-full shadow-pink-glow-hard"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto text-center px-4">
            <div className="p-8 bg-white/10 dark:bg-black/20 rounded-2xl border border-white/10 dark:border-hot-pink/30 backdrop-blur-lg">
                <div className="text-5xl font-display font-black text-hot-pink mb-4">1</div>
                <h3 className="text-xl font-bold mb-2 text-black dark:text-white">Describe</h3>
                <p className="text-gray-600 dark:text-gray-300">Build a storyboard with detailed prompts for each scene in your video.</p>
            </div>
            <div className="p-8 bg-white/10 dark:bg-black/20 rounded-2xl border border-white/10 dark:border-hot-pink/30 backdrop-blur-lg">
                <div className="text-5xl font-display font-black text-hot-pink mb-4">2</div>
                <h3 className="text-xl font-bold mb-2 text-black dark:text-white">Generate</h3>
                <p className="text-gray-600 dark:text-gray-300">Our advanced AI engine crafts your entire story into stunning, high-definition video.</p>
            </div>
            <div className="p-8 bg-white/10 dark:bg-black/20 rounded-2xl border border-white/10 dark:border-hot-pink/30 backdrop-blur-lg">
                <div className="text-5xl font-display font-black text-hot-pink mb-4">3</div>
                <h3 className="text-xl font-bold mb-2 text-black dark:text-white">Download</h3>
                <p className="text-gray-600 dark:text-gray-300">Instantly download your creation and share it with the world.</p>
            </div>
        </div>
    </div>
);

interface GalleryProps {
    onRemix: (prompt: string) => void;
}

const Gallery: React.FC<GalleryProps> = ({ onRemix }) => {
    const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
    const [filter, setFilter] = useState('all');

    const galleryItems = [
        {
            src: "https://videos.pexels.com/video-files/3209828/3209828-hd_1920_1080_25fps.mp4",
            prompt: "An elegant woman with flowing red hair in a vibrant, futuristic city at night, neon lights reflecting in her eyes, cinematic lighting.",
            tags: ['trending', 'cinematic']
        },
        {
            src: "https://videos.pexels.com/video-files/3845214/3845214-hd_1920_1080_24fps.mp4",
            prompt: "A mysterious figure in a dark hoodie walking through a dense, glowing forest. Particles of light float in the air, creating a magical atmosphere.",
            tags: ['all', 'fantasy']
        },
        {
            src: "https://videos.pexels.com/video-files/1851190/1851190-hd_1280_720_25fps.mp4",
            prompt: "Close up of a cybernetic eye, iris scanning data streams, holographic interfaces flickering across the lens, detailed and hyper-realistic.",
            tags: ['trending', 'sci-fi']
        },
    ];
    
    const filteredItems = filter === 'all' ? galleryItems : galleryItems.filter(item => item.tags.includes(filter));

    return (
        <div className="py-16 sm:py-24">
            <div className="text-center mb-12 px-4">
                <h2 className="font-display text-3xl sm:text-4xl font-bold text-black dark:text-white">Showcase Gallery</h2>
                <p className="text-gray-600 dark:text-gray-300 mt-2 max-w-2xl mx-auto">Explore, get inspired, and remix prompts from the community.</p>
                <div className="mt-4 h-1 w-24 bg-hot-pink mx-auto rounded-full shadow-pink-glow-hard"></div>
                <div className="mt-8 flex justify-center gap-2">
                    <button onClick={() => setFilter('all')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${filter === 'all' ? 'bg-hot-pink text-white' : 'bg-black/10 text-black dark:text-white'}`}>All</button>
                    <button onClick={() => setFilter('trending')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${filter === 'trending' ? 'bg-hot-pink text-white' : 'bg-black/10 text-black dark:text-white'}`}>Trending</button>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto px-4">
                {filteredItems.map((item, index) => (
                    <div key={index} className="group overflow-hidden rounded-xl border-2 border-white/10 dark:border-hot-pink/30 bg-black/20 flex flex-col shadow-lg">
                        <div 
                            className="relative aspect-video cursor-pointer"
                            onClick={() => setSelectedVideo(item.src)}
                        >
                            <video 
                                src={item.src} 
                                autoPlay 
                                loop 
                                muted 
                                playsInline
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                aria-label={`AI Generated Showcase Video ${index + 1}`}
                            />
                             <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <p className="text-white text-3xl font-bold">►</p>
                            </div>
                        </div>
                         <div className="p-4 flex-grow flex flex-col">
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 flex-grow">"{item.prompt}"</p>
                            <button 
                                onClick={() => onRemix(item.prompt)}
                                className="w-full px-4 py-2 text-sm font-bold bg-hot-pink text-white rounded-lg border border-hot-pink hover:bg-magenta-glow transition-all shadow-pink-glow transform hover:scale-105"
                            >
                                Remix This Prompt
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {selectedVideo && (
                <div 
                    className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 animate-fade-in" 
                    onClick={() => setSelectedVideo(null)}
                >
                    <div className="relative w-full max-w-4xl p-4" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={() => setSelectedVideo(null)}
                            className="absolute -top-2 -right-2 m-4 bg-white text-black rounded-full w-10 h-10 flex items-center justify-center z-10 text-2xl font-bold"
                            aria-label="Close video player"
                        >
                            &times;
                        </button>
                        <video
                            src={selectedVideo}
                            controls
                            autoPlay
                            loop
                            className="w-full h-auto rounded-lg shadow-pink-glow"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};


export const StaticSections: React.FC<GalleryProps> = ({ onRemix }) => (
    <>
        <Gallery onRemix={onRemix} />
        <HowItWorks />
    </>
);