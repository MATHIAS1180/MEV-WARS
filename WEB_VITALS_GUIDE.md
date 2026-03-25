# 📊 Web Vitals Optimization Guide

## Core Web Vitals - Cibles Google

| Métrique | Bon | À Améliorer | Mauvais |
|----------|-----|-------------|---------|
| **LCP** (Largest Contentful Paint) | ≤ 2.5s | 2.5s - 4.0s | > 4.0s |
| **FID** (First Input Delay) | ≤ 100ms | 100ms - 300ms | > 300ms |
| **CLS** (Cumulative Layout Shift) | ≤ 0.1 | 0.1 - 0.25 | > 0.25 |
| **FCP** (First Contentful Paint) | ≤ 1.8s | 1.8s - 3.0s | > 3.0s |
| **TTI** (Time to Interactive) | ≤ 3.8s | 3.8s - 7.3s | > 7.3s |
| **TBT** (Total Blocking Time) | ≤ 200ms | 200ms - 600ms | > 600ms |

---

## 🎯 Optimisations Appliquées

### 1. LCP (Largest Contentful Paint) - Cible: < 2.5s

**Problème**: Le plus grand élément visible met trop de temps à charger.

**Solutions Appliquées**:
- ✅ `priority` sur l'image du logo (above-the-fold)
- ✅ Preconnect pour Google Fonts
- ✅ DNS-prefetch pour Solana RPC
- ✅ Images en WebP/AVIF
- ✅ Cache-Control headers agressifs

**Code**:
```tsx
<Image 
  src="/images/trigger-logo.png" 
  alt="MEV Wars" 
  width={120} 
  height={48} 
  priority // ← Force le chargement immédiat
/>
```

---

### 2. FID (First Input Delay) - Cible: < 100ms

**Problème**: Le navigateur met trop de temps à répondre aux interactions.

**Solutions Appliquées**:
- ✅ Code splitting avec dynamic imports
- ✅ Lazy loading des composants lourds
- ✅ Suppression des console.log en production
- ✅ Optimisation des animations (will-change, contain)

**Code**:
```tsx
const WalletMultiButton = dynamic(
  async () => (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false } // ← Charge uniquement côté client
);
```

---

### 3. CLS (Cumulative Layout Shift) - Cible: < 0.1

**Problème**: Les éléments bougent pendant le chargement.

**Solutions Appliquées**:
- ✅ Width & height explicites sur toutes les images
- ✅ Aspect ratio défini pour les conteneurs
- ✅ Skeleton loaders (optionnel)
- ✅ Font display swap

**Code**:
```tsx
<Image 
  src="/logo.png" 
  width={120}  // ← Dimensions explicites
  height={48}  // ← Évite le layout shift
  alt="Logo" 
/>
```

```css
body {
  font-display: swap; /* Évite FOIT */
}
```

---

### 4. FCP (First Contentful Paint) - Cible: < 1.8s

**Problème**: Le premier élément visible met trop de temps à apparaître.

**Solutions Appliquées**:
- ✅ Inline critical CSS (automatique avec Next.js)
- ✅ Preconnect pour ressources externes
- ✅ Compression Brotli/Gzip (Vercel)
- ✅ HTTP/2 Server Push (Vercel)

**Code**:
```tsx
<head>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
</head>
```

---

### 5. TTI (Time to Interactive) - Cible: < 3.8s

**Problème**: La page met trop de temps à devenir interactive.

**Solutions Appliquées**:
- ✅ Réduction du JavaScript initial
- ✅ Code splitting agressif
- ✅ Lazy loading des composants non critiques
- ✅ Tree shaking automatique (Next.js)

---

### 6. TBT (Total Blocking Time) - Cible: < 200ms

**Problème**: Le thread principal est bloqué trop longtemps.

**Solutions Appliquées**:
- ✅ Optimisation des animations (GPU acceleration)
- ✅ Debounce/throttle sur événements fréquents
- ✅ Web Workers pour calculs lourds (si nécessaire)
- ✅ Suppression des long tasks

**Code**:
```css
.glass-card {
  will-change: transform; /* GPU acceleration */
  contain: layout style paint; /* Isolation */
}
```

---

## 🔧 Monitoring en Production

### Vercel Analytics (Recommandé)

```bash
npm install @vercel/analytics
```

```tsx
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### Google Analytics 4 + Web Vitals

```bash
npm install web-vitals
```

```tsx
// app/layout.tsx
'use client';
import { useEffect } from 'react';
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

export function WebVitals() {
  useEffect(() => {
    getCLS(console.log);
    getFID(console.log);
    getFCP(console.log);
    getLCP(console.log);
    getTTFB(console.log);
  }, []);

  return null;
}
```

---

## 📈 Benchmarks Attendus

### Desktop (Lighthouse)
```
Performance:      100/100 ✅
FCP:              0.8s ✅
LCP:              1.2s ✅
TBT:              50ms ✅
CLS:              0.02 ✅
Speed Index:      1.5s ✅
```

### Mobile (Lighthouse)
```
Performance:      95-100/100 ✅
FCP:              1.5s ✅
LCP:              2.3s ✅
TBT:              150ms ✅
CLS:              0.05 ✅
Speed Index:      2.8s ✅
```

---

## 🚨 Red Flags à Éviter

### ❌ Mauvaises Pratiques

1. **Images sans dimensions**
```tsx
// ❌ Mauvais
<img src="/logo.png" alt="Logo" />

// ✅ Bon
<Image src="/logo.png" width={120} height={48} alt="Logo" />
```

2. **Fonts sans display swap**
```css
/* ❌ Mauvais */
@font-face {
  font-family: 'Custom';
  src: url('/font.woff2');
}

/* ✅ Bon */
@font-face {
  font-family: 'Custom';
  src: url('/font.woff2');
  font-display: swap;
}
```

3. **JavaScript bloquant**
```html
<!-- ❌ Mauvais -->
<script src="/heavy-lib.js"></script>

<!-- ✅ Bon -->
<script src="/heavy-lib.js" defer></script>
```

4. **Animations non optimisées**
```css
/* ❌ Mauvais - Force reflow */
.element {
  animation: move 1s;
}
@keyframes move {
  to { left: 100px; }
}

/* ✅ Bon - GPU accelerated */
.element {
  animation: move 1s;
}
@keyframes move {
  to { transform: translateX(100px); }
}
```

---

## 🎯 Quick Wins

### 1. Lazy Load Images Below Fold

```tsx
<Image 
  src="/image.png" 
  loading="lazy" // ← Charge uniquement quand visible
  alt="Description" 
/>
```

### 2. Preload Critical Assets

```tsx
<link rel="preload" href="/critical.css" as="style" />
<link rel="preload" href="/hero.webp" as="image" />
```

### 3. Defer Non-Critical Scripts

```tsx
<Script 
  src="/analytics.js" 
  strategy="lazyOnload" // ← Charge après interaction
/>
```

### 4. Optimize Fonts

```tsx
// next.config.mjs
export default {
  optimizeFonts: true, // Automatique avec Next.js
};
```

---

## 📊 Testing Tools

### Local Testing
```bash
# Lighthouse CLI
npx lighthouse http://localhost:3000 --view

# WebPageTest
# https://www.webpagetest.org/

# Chrome DevTools
# F12 > Lighthouse > Analyze
```

### Production Testing
```bash
# PageSpeed Insights
# https://pagespeed.web.dev/

# GTmetrix
# https://gtmetrix.com/

# Vercel Analytics
# https://vercel.com/analytics
```

---

## 🏆 Success Criteria

### Minimum Viable Performance
- ✅ LCP < 2.5s
- ✅ FID < 100ms
- ✅ CLS < 0.1
- ✅ Lighthouse Performance > 90

### Optimal Performance
- ✅ LCP < 1.5s
- ✅ FID < 50ms
- ✅ CLS < 0.05
- ✅ Lighthouse Performance = 100

---

## 📞 Resources

- [Web Vitals](https://web.dev/vitals/)
- [Lighthouse Scoring](https://web.dev/performance-scoring/)
- [Next.js Performance](https://nextjs.org/docs/advanced-features/measuring-performance)
- [Vercel Analytics](https://vercel.com/docs/analytics)

---

**Status**: ✅ Optimisé pour Web Vitals  
**Last Updated**: 2024-01-01
