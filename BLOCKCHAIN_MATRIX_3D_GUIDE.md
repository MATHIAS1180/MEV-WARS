# 🎮 Blockchain Matrix 3D - Guide d'Intégration

## 🎯 Vue d'Ensemble

Visualisation 3D AAA sophistiquée pour le lobby MEV Wars PVP. Transforme une grille 2D de 30 blocs en un réseau blockchain 3D massif avec des milliers de cubes interconnectés.

---

## ✨ Caractéristiques

### Structure Visuelle
- **Réseau 3D Massif**: 5400 cubes (18x12x25) avec profondeur étendue
- **Cubes Frosted Glass**: Matériau semi-transparent avec effet de verre dépoli
- **Connecteurs Néon**: Tubes lumineux cyan/bleu reliant les cubes
- **Sol Réfléchissant**: Effet miroir noir avec brouillard numérique

### Animations AAA
- **Mouvement Global**: Ondulation basée sur le bruit de Perlin
- **Cubes Individuels**: Rotation lente unique + pouls émissif asynchrone
- **Data Packets**: 800 particules lumineuses traversant les connecteurs
- **Player Join Effect**: 
  - Transition de couleur fluide (cyan → player.color)
  - Rings holographiques MEV tournants
  - Flash lumineux + propagation électrique

### Effets Post-Processing
- **Bloom Intense**: Glow néon AAA (intensité 3.5)
- **Chromatic Aberration**: Effet de distorsion subtile
- **Vignette**: Assombrissement des bords
- **Digital Fog**: Brouillard volumétrique

---

## 📦 Installation

```bash
# Dépendances déjà installées
npm install @react-three/fiber @react-three/drei @react-three/postprocessing three
```

---

## 🚀 Utilisation

### Import Basique

```tsx
import BlockchainMatrix3DAdvanced from "@/components/BlockchainMatrix3DAdvanced";

// Dans votre composant
<BlockchainMatrix3DAdvanced
  players={players}
  isActive={isSpinning || countdown !== null}
  playerCount={actualPlayerCount}
/>
```

### Interface Player

```typescript
interface Player {
  id: string;      // Identifiant unique
  color: string;   // Couleur hex (ex: "#DC1FFF")
}
```

### Props

```typescript
interface BlockchainMatrix3DProps {
  players: Player[];        // Tableau de joueurs
  isActive?: boolean;       // Active les animations intenses
  playerCount?: number;     // Nombre de joueurs (optionnel)
}
```

---

## 💡 Exemples d'Intégration

### Exemple 1: Remplacement du MiningBlock

```tsx
// Avant (2D SVG)
<MiningBlock 
  playerCount={actualPlayerCount} 
  isSpinning={isSpinning} 
  rotation={rotation} 
  countdown={countdown} 
/>

// Après (3D Matrix)
<div className="w-full h-[600px]">
  <BlockchainMatrix3DAdvanced
    players={players.map((p, i) => ({
      id: p.toString(),
      color: SOLANA_COLORS[i]
    }))}
    isActive={isSpinning || countdown !== null}
    playerCount={actualPlayerCount}
  />
</div>
```

### Exemple 2: Intégration dans page.tsx

```tsx
// Dans app/page.tsx
import BlockchainMatrix3DAdvanced from "@/components/BlockchainMatrix3DAdvanced";

export default function Home() {
  const { gameState } = useGame(roomId);
  
  // Convertir les joueurs en format Player[]
  const players = useMemo(() => {
    if (!gameState?.players) return [];
    
    return (gameState.players as any[])
      .filter(p => p.toString() !== PublicKey.default.toString())
      .map((p, i) => ({
        id: p.toString(),
        color: SOLANA_COLORS[i % SOLANA_COLORS.length]
      }));
  }, [gameState?.players]);
  
  return (
    <div className="glass-card p-6">
      <div className="relative w-full h-[600px]">
        <BlockchainMatrix3DAdvanced
          players={players}
          isActive={isSpinning || countdown !== null}
          playerCount={actualPlayerCount}
        />
      </div>
    </div>
  );
}
```

### Exemple 3: Avec Contrôles UI

```tsx
<div className="relative">
  {/* 3D Matrix */}
  <div className="w-full h-[700px] rounded-2xl overflow-hidden">
    <BlockchainMatrix3DAdvanced
      players={players}
      isActive={isActive}
      playerCount={playerCount}
    />
  </div>
  
  {/* UI Overlay */}
  <div className="absolute top-4 left-4 glass-card p-4">
    <p className="text-xs text-zinc-400 uppercase">Active Nodes</p>
    <p className="text-2xl font-black text-[#00FFA3]">{playerCount}</p>
  </div>
  
  <div className="absolute top-4 right-4 glass-card p-4">
    <p className="text-xs text-zinc-400 uppercase">Network Status</p>
    <p className="text-sm font-bold text-[#00FFFF]">
      {isActive ? "ACTIVE" : "IDLE"}
    </p>
  </div>
</div>
```

---

## 🎨 Personnalisation

### Modifier la Configuration

```tsx
// Dans BlockchainMatrix3DAdvanced.tsx
const MATRIX_CONFIG = {
  gridSize: { x: 18, y: 12, z: 25 },  // Taille de la grille
  spacing: 2.8,                        // Espacement entre cubes
  cubeSize: 0.9,                       // Taille des cubes
  defaultColor: "#00FFFF",             // Couleur par défaut (cyan)
  glowIntensity: 3.0,                  // Intensité du glow
};
```

### Modifier les Couleurs

```tsx
// Couleurs Solana
const SOLANA_COLORS = [
  "#DC1FFF", // Purple Dino
  "#03E1FF", // Ocean Blue  
  "#00FFA3", // Surge Green
  "#9945FF", // Violet
  "#14F195", // Solana Green
  // ... ajoutez plus de couleurs
];
```

### Ajuster la Caméra

```tsx
// Dans CameraRig component
const radius = 70;      // Distance de la caméra
const height = 15;      // Hauteur de la caméra
const speed = 0.08;     // Vitesse de rotation
```

### Modifier le Bloom

```tsx
<Bloom
  intensity={3.5}              // Intensité du glow (1-5)
  luminanceThreshold={0.1}     // Seuil de luminance (0-1)
  luminanceSmoothing={0.9}     // Lissage (0-1)
  radius={0.8}                 // Rayon du bloom (0-1)
/>
```

---

## ⚡ Optimisation Performance

### Réduire le Nombre de Cubes

```tsx
const MATRIX_CONFIG = {
  gridSize: { x: 12, y: 8, z: 15 },  // 1440 cubes au lieu de 5400
  // ...
};
```

### Réduire les Data Packets

```tsx
const particleCount = 400;  // Au lieu de 800
```

### Désactiver les Effets Post-Processing

```tsx
// Commenter dans Scene component
{/* <EffectComposer>...</EffectComposer> */}
```

### Réduire le DPR (Device Pixel Ratio)

```tsx
<Canvas
  dpr={[1, 1.5]}  // Au lieu de [1, 2]
  // ...
/>
```

---

## 🎭 Animations Personnalisées

### Ajouter une Animation de Victoire

```tsx
function VictoryAnimation({ winnerCubeIndex }: { winnerCubeIndex: number }) {
  // Explosion de particules
  // Rings holographiques multiples
  // Flash lumineux intense
  // ...
}
```

### Ajouter un Effet de Spin

```tsx
useFrame((state, delta) => {
  if (isSpinning) {
    // Rotation rapide de toute la matrice
    groupRef.current.rotation.y += delta * 2;
  }
});
```

---

## 🐛 Troubleshooting

### Performance Lente

**Problème**: FPS bas, lag

**Solutions**:
1. Réduire `gridSize` (moins de cubes)
2. Réduire `particleCount` (moins de data packets)
3. Désactiver post-processing
4. Réduire `dpr` à `[1, 1]`
5. Utiliser `powerPreference: "high-performance"`

### Cubes ne s'affichent pas

**Problème**: Écran noir

**Solutions**:
1. Vérifier que Three.js est installé
2. Vérifier la position de la caméra
3. Vérifier le fog (peut cacher les cubes)
4. Ajouter `<ambientLight intensity={1} />` temporairement

### Player Join Effect ne fonctionne pas

**Problème**: Pas d'animation lors du join

**Solutions**:
1. Vérifier que `players` change bien
2. Vérifier que `player.id` est unique
3. Vérifier que `player.color` est valide (hex)
4. Ajouter des `console.log` dans `useEffect`

### Couleurs incorrectes

**Problème**: Cubes ont la mauvaise couleur

**Solutions**:
1. Vérifier le format de `player.color` (doit être "#RRGGBB")
2. Vérifier que `assignedCubes` est mis à jour
3. Vérifier `instanceColor.needsUpdate = true`

---

## 📊 Métriques de Performance

### Configuration Recommandée

| Paramètre | Valeur | Performance |
|-----------|--------|-------------|
| Grid Size | 18x12x25 | Moyenne |
| Particles | 800 | Moyenne |
| Post-FX | Tous | Moyenne |
| DPR | [1, 2] | Haute |

### Configuration Optimisée

| Paramètre | Valeur | Performance |
|-----------|--------|-------------|
| Grid Size | 12x8x15 | Haute |
| Particles | 400 | Haute |
| Post-FX | Bloom only | Haute |
| DPR | [1, 1.5] | Très Haute |

### Configuration Ultra

| Paramètre | Valeur | Performance |
|-----------|--------|-------------|
| Grid Size | 25x18x35 | Basse |
| Particles | 1200 | Basse |
| Post-FX | Tous + Shadows | Basse |
| DPR | [1, 3] | Très Basse |

---

## 🎨 Environnement Visuel (Contexte)

### Éléments Statiques Recommandés

Ces éléments doivent être ajoutés autour de la matrice 3D avec Tailwind CSS :

#### 1. Transaction Logs (Côté Gauche)
```tsx
<div className="absolute left-4 top-1/2 -translate-y-1/2 space-y-2">
  <div className="glass-card p-3 text-xs">
    <p className="text-[#00FFA3] font-mono">TX: 0x7a3f...</p>
    <p className="text-zinc-500">+0.5 SOL</p>
  </div>
  {/* Plus de logs */}
</div>
```

#### 2. Leaderboard (Côté Droit)
```tsx
<div className="absolute right-4 top-4 glass-card p-4">
  <h3 className="text-sm font-black uppercase mb-3">Top Players</h3>
  <div className="space-y-2">
    {topPlayers.map((player, i) => (
      <div key={i} className="flex items-center gap-2">
        <span className="text-[#00FFFF]">#{i + 1}</span>
        <span className="text-white">{player.name}</span>
        <span className="text-[#00FFA3] ml-auto">{player.wins}W</span>
      </div>
    ))}
  </div>
</div>
```

#### 3. Status Counter (En Haut)
```tsx
<div className="absolute top-4 left-1/2 -translate-x-1/2 glass-card p-4">
  <div className="flex items-center gap-6">
    <div>
      <p className="text-xs text-zinc-400 uppercase">Active Nodes</p>
      <p className="text-2xl font-black text-[#00FFA3]">{playerCount}</p>
    </div>
    <div>
      <p className="text-xs text-zinc-400 uppercase">Total Pool</p>
      <p className="text-2xl font-black text-[#00FFFF]">{potAmount} SOL</p>
    </div>
  </div>
</div>
```

#### 4. Network Stats (En Bas)
```tsx
<div className="absolute bottom-4 left-4 right-4 glass-card p-3">
  <div className="flex items-center justify-between text-xs">
    <div className="flex items-center gap-2">
      <div className="w-2 h-2 rounded-full bg-[#00FFA3] animate-pulse" />
      <span className="text-zinc-400">Network: LIVE</span>
    </div>
    <span className="text-zinc-500">TPS: 2,847</span>
    <span className="text-zinc-500">Latency: 12ms</span>
  </div>
</div>
```

---

## 🚀 Déploiement

### Build Production

```bash
npm run build
```

### Vérifier la Performance

```bash
# Lighthouse
npm run lighthouse

# Vérifier le bundle size
npm run analyze
```

---

## 📝 Notes Importantes

1. **GPU Requis**: Cette visualisation nécessite un GPU moderne
2. **WebGL 2**: Assurez-vous que WebGL 2 est supporté
3. **Mobile**: Réduire la configuration pour mobile
4. **Accessibilité**: Ajouter un fallback 2D pour les utilisateurs sans GPU

---

## 🎯 Roadmap

### Version 1.1
- [ ] Effet de victoire animé
- [ ] Trails pour les data packets
- [ ] Shadows dynamiques
- [ ] Réflexions en temps réel

### Version 1.2
- [ ] VR support
- [ ] Interaction souris (hover sur cubes)
- [ ] Zoom/Pan caméra
- [ ] Export vidéo

### Version 2.0
- [ ] Shaders personnalisés avancés
- [ ] Physique (collision)
- [ ] Audio réactif
- [ ] Multi-room support

---

**Version**: 1.0.0  
**Date**: 2024-01-01  
**Status**: ✅ Production Ready
