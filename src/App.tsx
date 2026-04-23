/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, X, Image as ImageIcon, Trash2, Maximize2, Ghost, Plus } from 'lucide-react';

interface GalleryImage {
  id: string;
  url: string;
  name: string;
  size: number;
  timestamp: number;
}

export default function App() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [isHovering, setIsHovering] = useState(false);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;

    const newImages: GalleryImage[] = Array.from(files)
      .filter(file => file.type.startsWith('image/'))
      .map(file => ({
        id: Math.random().toString(36).substring(7),
        url: URL.createObjectURL(file),
        name: file.name,
        size: file.size,
        timestamp: Date.now(),
      }));

    setImages(prev => [...newImages, ...prev]);
  }, []);

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsHovering(true);
  };

  const onDragLeave = () => setIsHovering(false);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsHovering(false);
    handleFiles(e.dataTransfer.files);
  };

  const deleteImage = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setImages(prev => {
      const filtered = prev.filter(img => img.id !== id);
      const deleted = prev.find(img => img.id === id);
      if (deleted) URL.revokeObjectURL(deleted.url);
      return filtered;
    });
  };

  return (
    <div className="flex min-h-screen bg-[#050505] text-[#d1cec9] font-sans overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="w-72 border-r border-[#1a1a1a] flex flex-col p-10 hidden lg:flex sticky top-0 h-screen">
        <h1 className="text-2xl tracking-[0.3em] uppercase text-[#bfa280] font-serif font-light mb-16">
          Aura
        </h1>
        
        <nav className="flex flex-col gap-8 text-[11px] uppercase tracking-[0.2em] font-sans">
          <a href="#" className="text-[#bfa280]">Main Gallery</a>
          <a href="#" className="opacity-40 hover:opacity-100 transition-opacity">Collections</a>
          <a href="#" className="opacity-40 hover:opacity-100 transition-opacity">Exhibitions</a>
          <a href="#" className="opacity-40 hover:opacity-100 transition-opacity">Archive</a>
        </nav>

        <div className="mt-auto">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="group cursor-pointer border border-[#bfa280]/30 p-6 flex flex-col items-center gap-3 hover:bg-[#bfa280]/5 transition-all text-center"
          >
            <div className="w-8 h-8 flex items-center justify-center border border-[#bfa280] rounded-full text-lg font-light text-[#bfa280]">
              +
            </div>
            <p className="text-[10px] uppercase tracking-[0.15em] text-[#bfa280]">Upload Asset</p>
          </div>
          
          <div className="mt-8 pt-8 border-t border-[#1a1a1a] flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#111] border border-[#222]"></div>
            <div>
              <p className="text-[10px] font-sans uppercase tracking-wider">Julian Vane</p>
              <p className="text-[9px] font-sans uppercase tracking-wider opacity-30">Pro Curator</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 p-6 lg:p-14 flex flex-col h-screen overflow-y-auto w-full">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 border-b border-[#1a1a1a] pb-10 gap-6">
          <div>
            <h2 className="text-4xl md:text-5xl font-serif font-light italic text-white tracking-tight">
              Lumina Palette
            </h2>
            <p className="text-[11px] font-sans uppercase tracking-[0.4em] mt-3 opacity-40">
              Curated Selection · {images.length} Objects
            </p>
          </div>
          
          <div className="flex gap-8 md:gap-12 font-sans text-[10px] uppercase tracking-[0.2em]">
            <div className="flex flex-col gap-1">
              <span>Filter</span>
              <span className="opacity-30">All Media</span>
            </div>
            <div className="flex flex-col gap-1">
              <span>Sort</span>
              <span className="opacity-30">Date Added</span>
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="lg:hidden flex items-center gap-2 text-[#bfa280]"
            >
              <Plus className="w-3 h-3" />
              <span>Upload</span>
            </button>
          </div>
        </header>

        {/* Dynamic Content Area */}
        <div className="flex-1 min-h-0">
          <input 
            ref={fileInputRef}
            type="file" 
            multiple 
            accept="image/*" 
            className="hidden" 
            onChange={(e) => handleFiles(e.target.files)}
          />

          {images.length === 0 ? (
            <section 
              className="h-[400px] border border-[#1a1a1a] bg-[#0a0a0a] flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-[#111] transition-colors"
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="text-2xl text-[#bfa280] opacity-40">+</div>
              <span className="text-[11px] font-sans uppercase tracking-[0.3em] opacity-40">
                {isHovering ? "Ready to import" : "Quick Add / Drop Assets"}
              </span>
            </section>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              <AnimatePresence mode="popLayout" initial={false}>
                {images.map((image, index) => (
                  <motion.div
                    key={image.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ 
                      duration: 0.5, 
                      delay: (index % 12) * 0.05,
                      ease: [0.19, 1, 0.22, 1]
                    }}
                    className="relative group aspect-square bg-[#0a0a0a] border border-[#1a1a1a] overflow-hidden cursor-zoom-in group"
                    onClick={() => setSelectedImage(image)}
                  >
                    <img 
                      src={image.url} 
                      alt={image.name}
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    
                    {/* Minimal Theme Overlay */}
                    <div className="absolute inset-x-0 bottom-0 p-6 z-20 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                      <span className="text-[9px] font-sans uppercase tracking-[0.3em] block mb-1 text-[#bfa280]">
                        Object {String(index + 1).padStart(3, '0')}
                      </span>
                      <h3 className="text-xl font-serif font-light text-white truncate max-w-full italic">
                        {image.name.split('.')[0]}
                      </h3>
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" />
                    
                    <button 
                      onClick={(e) => deleteImage(image.id, e)}
                      className="absolute top-4 right-4 z-30 p-2 bg-black/40 text-white/40 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all duration-300"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        <footer className="mt-16 flex justify-between items-center text-[9px] font-sans uppercase tracking-[0.3em] opacity-30 py-8 border-t border-[#1a1a1a]">
          <span>Archive Status: Active Session</span>
          <span>Security: Local Instance</span>
        </footer>
      </main>

      {/* Cinematic Viewer (Adapted for Theme) */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#050505]/98 backdrop-blur-3xl flex items-center justify-center p-8 lg:p-24"
            onClick={() => setSelectedImage(null)}
          >
            <motion.button 
              className="absolute top-10 right-10 text-[#bfa280] opacity-40 hover:opacity-100 transition-opacity"
              onClick={() => setSelectedImage(null)}
            >
              <X className="w-8 h-8 font-light" />
            </motion.button>

            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="relative max-w-7xl w-full h-full flex flex-col items-center justify-center gap-12"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-full h-full flex flex-col items-center justify-center overflow-hidden">
                <img 
                  src={selectedImage.url} 
                  alt={selectedImage.name}
                  className="max-w-full max-h-[85vh] object-contain border border-[#1a1a1a]"
                  referrerPolicy="no-referrer"
                />
              </div>
              
              <div className="flex flex-col items-center text-center">
                <span className="text-[10px] font-sans uppercase tracking-[0.4em] mb-3 text-[#bfa280]">
                  Gallery Inspection
                </span>
                <h3 className="text-4xl font-serif italic font-light text-white">{selectedImage.name}</h3>
                <p className="text-[10px] font-sans uppercase tracking-[0.2em] opacity-30 mt-4">
                  {(selectedImage.size / 1024 / 1024).toFixed(2)} MB · RAW ASSET
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drag & Drop Overlay Only when dragging elsewhere */}
      <AnimatePresence>
        {isHovering && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onDragLeave={onDragLeave}
            onDragOver={onDragOver}
            onDrop={onDrop}
            className="fixed inset-0 z-[60] bg-[#bfa280]/5 backdrop-blur-sm border-4 border-dashed border-[#bfa280] flex items-center justify-center"
          >
            <div className="text-center">
              <Plus className="w-16 h-16 text-[#bfa280] mx-auto mb-6 opacity-40" />
              <p className="text-xl font-serif italic tracking-[0.2em] text-[#bfa280]">Release to Curate</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
