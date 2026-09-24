import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/useGameStore';
import { MEME_MANIFEST } from '../memes/manifest';

export function MemeOverlay() {
    const { memeReaction, setMemeReaction } = useGameStore();
    const [isVisible, setIsVisible] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const timeoutRef = useRef<any>(null);

    useEffect(() => {
        if (memeReaction) {
            setIsVisible(true);
            
            // Auto hide after some time if video doesn't fire ended
            const memeData = MEME_MANIFEST.find(m => m.id === memeReaction.reactionId);
            const duration = memeData ? memeData.durationMs + 500 : 3500;
            
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(() => {
                handleClose();
            }, duration);
        }
    }, [memeReaction]);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(() => {
            setMemeReaction(null);
        }, 300); // Wait for exit animation
    };

    if (!memeReaction || !isVisible) return null;

    const memeData = MEME_MANIFEST.find(m => m.id === memeReaction.reactionId);
    if (!memeData) {
        setMemeReaction(null);
        return null; // Missing asset
    }

    let title = '';
    let accentColor = 'border-cyan-500/50';
    let textColor = 'text-cyan-400';
    
    switch (memeReaction.category) {
        case 'hit':
            title = '⚡ DIRECT HIT';
            accentColor = 'border-orange-500/50';
            textColor = 'text-orange-400';
            break;
        case 'miss':
            title = '💦 SHOT MISSED';
            accentColor = 'border-blue-500/50';
            textColor = 'text-blue-400';
            break;
        case 'ship-destroyed':
            title = '💥 VESSEL DESTROYED';
            accentColor = 'border-red-500/70';
            textColor = 'text-red-500';
            break;
        case 'eliminated':
            title = '💀 PLAYER ELIMINATED';
            accentColor = 'border-purple-500/70';
            textColor = 'text-purple-500';
            break;
        case 'victory':
            title = '🏆 BATTLE WON';
            accentColor = 'border-yellow-500/70';
            textColor = 'text-yellow-500';
            break;
    }

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div 
                    className="fixed bottom-6 right-6 z-[9000] pointer-events-none"
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                >
                    <div className={`bg-[#050B12]/95 backdrop-blur-md border ${accentColor} rounded-xl shadow-2xl p-4 w-72 flex flex-col gap-3 relative overflow-hidden pointer-events-auto`}>
                        {/* Glow */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50"></div>
                        
                        {/* Header */}
                        <div className="flex justify-between items-center">
                            <span className={`text-xs font-black tracking-widest ${textColor}`}>{title}</span>
                            <button onClick={handleClose} className="text-slate-500 hover:text-white transition-colors cursor-pointer text-xs">✕</button>
                        </div>

                        {/* Video Container */}
                        <div className="w-full aspect-video bg-black rounded border border-white/10 overflow-hidden relative">
                            <video
                                ref={videoRef}
                                src={memeData.file}
                                autoPlay
                                playsInline
                                onEnded={handleClose}
                                className="w-full h-full object-cover transform-gpu"
                            />
                        </div>

                        {/* Footer Context */}
                        <div className="text-center">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest bg-black/50 px-2 py-1 rounded">
                                {memeReaction.triggeredBy} {memeReaction.category === 'victory' ? 'WINS' : '→'} {memeReaction.targetPlayer && memeReaction.category !== 'victory' ? memeReaction.targetPlayer : ''}
                            </span>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
