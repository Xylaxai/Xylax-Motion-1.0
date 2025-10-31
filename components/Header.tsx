import React from 'react';
import { LogoIcon, MoonIcon, SunIcon } from './icons';
import { Theme } from '../types';
import { Page } from '../App';


interface HeaderProps {
    currentPage: Page;
    setCurrentPage: (page: Page) => void;
    theme: Theme;
    toggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentPage, setCurrentPage, theme, toggleTheme }) => {
    const navLinkClasses = "px-4 py-2 rounded-md text-sm font-bold transition-colors";
    const activeLinkClasses = "bg-hot-pink text-white";
    const inactiveLinkClasses = "text-black dark:text-white hover:bg-hot-pink/20";

    return (
        <header className="p-4 sticky top-0 z-40 bg-white/80 dark:bg-black/80 backdrop-blur-lg border-b border-black/10 dark:border-white/10">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
                <div 
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => setCurrentPage('generator')}
                >
                    <LogoIcon className="w-12 h-12 text-hot-pink" />
                    <span className="font-display text-xl font-bold hidden sm:block text-black dark:text-white">Xylax Motion</span>
                </div>
                <nav className="flex items-center gap-1 sm:gap-2 p-1 bg-gray-200/50 dark:bg-black/20 rounded-lg">
                    <button 
                        onClick={() => setCurrentPage('generator')} 
                        className={`${navLinkClasses} ${currentPage === 'generator' ? activeLinkClasses : inactiveLinkClasses}`}
                    >
                        Generator
                    </button>
                    <button 
                        onClick={() => setCurrentPage('studio')} 
                        className={`${navLinkClasses} ${currentPage === 'studio' ? activeLinkClasses : inactiveLinkClasses}`}
                    >
                        Creative Studio
                    </button>
                     <button 
                        onClick={() => setCurrentPage('editor')} 
                        className={`${navLinkClasses} ${currentPage === 'editor' ? activeLinkClasses : inactiveLinkClasses}`}
                    >
                        Video Editor
                    </button>
                </nav>
                <button onClick={toggleTheme} className="p-2 rounded-full bg-white/10 dark:bg-black/20 text-hot-pink backdrop-blur-sm">
                    {theme === 'dark' ? <SunIcon className="w-6 h-6" /> : <MoonIcon className="w-6 h-6" />}
                </button>
            </div>
        </header>
    );
};