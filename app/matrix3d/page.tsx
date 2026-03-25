"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { motion } from "framer-motion";

// Dynamic import for 3D component (client-side only)
const BlockchainMatrix3DAdvanced = dynamic(
  () => import("@/components/BlockchainMatrix3DAdvanced"),
  { 
    ssr: false, 
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-black">
        <div className="text-[#00FFFF] text-xl font-bold animate-pulse">
          Loading 3D Matrix...
        </div>
      </div>
    ) 
  }
);

// Couleurs Solana
const SOLANA_COLORS = [
  "#DC1FFF", "#03E1FF", "#00FFA3", "#9945FF", "#14F195",
  "#00C2FF", "#FF6B9D", "#FFB84D", "#A855F7", "#10B981",
];

export default function Matrix3DDemo() {
  const [players, setPlayers] = useState<Array<{ id: string; color: string }>>([]);
  const [isActive, setIsActive] = useState(true);

  const addPlayer = () => {
    const newPlayer = {
      id: `player-${Date.now()}`,
      color: SOLANA_COLORS[players.length % SOLANA_COLORS.length]
    };
    setPlayers([...players, newPlayer]);
  };

  const removePlayer = () => {
    if (players.length > 0) {
      setPlayers(players.slice(0, -1));
    }
  };

  const clearPlayers = () => {
    setPlayers([]);
  };

  return (
    <main className="min-h-screen flex flex-col bg-black">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/80 backdrop-blur-xl">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#00FFA3] via-[#03E1FF] to-[#DC1FFF]">
            Blockchain Matrix 3D Demo
          </h1>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#00FFA3]/10 border border-[#00FFA3]/30 rounded-full">
              <div className="w-2 h-2 rounded-full bg-[#00FFA3] animate-pulse" />
              <span className="text-xs font-bold text-[#00FFA3]">
                {players.length} Players
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4">
        {/* 3D Matrix */}
        <div className="flex-1 glass-card p-6 rounded-2xl overflow-hidden">
          <div className="relative w-full h-[700px] rounded-xl overflow-hidden">
            <BlockchainMatrix3DAdvanced
              players={players}
              isActive={isActive}
              playerCount={players.length}
            />
            
            {/* Overlay Stats */}
            <div className="absolute top-4 left-4 glass-card p-3 backdrop-blur-xl">
              <p className="text-xs text-zinc-400 uppercase mb-1">Network Status</p>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-[#00FFA3]' : 'bg-zinc-500'} animate-pulse`} />
                <span className="text-sm font-bold text-white">
                  {isActive ? 'ACTIVE' : 'IDLE'}
                </span>
              </div>
            </div>
            
            {/* Player List */}
            <div className="absolute top-4 right-4 glass-card p-3 backdrop-blur-xl max-w-[200px]">
              <p className="text-xs text-zinc-400 uppercase mb-2">Active Nodes</p>
              <div className="space-y-1 max-h-[200px] overflow-y-auto">
                {players.map((player, i) => (
                  <div key={player.id} className="flex items-center gap-2 text-xs">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: player.color }}
                    />
                    <span className="text-white">Node #{i + 1}</span>
                  </div>
                ))}
                {players.length === 0 && (
                  <p className="text-xs text-zinc-600">No players yet</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Control Panel */}
        <div className="lg:w-[320px] glass-card p-6 rounded-2xl flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-black text-white mb-4 uppercase tracking-wider">
              Controls
            </h2>
            
            <div className="space-y-3">
              <motion.button
                onClick={addPlayer}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 px-4 bg-gradient-to-r from-[#00FFA3] to-[#03E1FF] text-black font-bold rounded-xl"
              >
                Add Player
              </motion.button>
              
              <motion.button
                onClick={removePlayer}
                disabled={players.length === 0}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 px-4 bg-white/10 text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Remove Player
              </motion.button>
              
              <motion.button
                onClick={clearPlayers}
                disabled={players.length === 0}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 px-4 bg-red-500/20 text-red-400 font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Clear All
              </motion.button>
              
              <div className="h-px bg-white/10 my-4" />
              
              <button
                onClick={() => setIsActive(!isActive)}
                className="w-full py-3 px-4 bg-white/5 text-white font-bold rounded-xl"
              >
                {isActive ? 'Deactivate' : 'Activate'} Network
              </button>
            </div>
          </div>

          <div className="flex-1" />

          <div className="space-y-3 text-xs text-zinc-500">
            <div>
              <p className="font-bold text-zinc-400 mb-1">Features:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>5400 cubes (18x12x25)</li>
                <li>800 data packets</li>
                <li>Perlin noise movement</li>
                <li>Holographic player join</li>
                <li>Post-processing effects</li>
              </ul>
            </div>
            
            <div>
              <p className="font-bold text-zinc-400 mb-1">Performance:</p>
              <p>45-60 FPS on modern GPUs</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
