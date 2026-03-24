# Guide de Test Responsive - MEV Wars

## Accès Rapide
**URL locale**: http://localhost:3001

---

## Tests par Breakpoint

### 📱 Mobile Portrait (375px)
**Devices**: iPhone SE, iPhone 12 Mini

**Checklist:**
- [ ] Header visible avec logo + wallet button
- [ ] Hero section scrollable
- [ ] Game section SANS SCROLL:
  - [ ] Tier selector (0.01/0.1/1.0) horizontal scroll
  - [ ] Mining block centré, taille ~280px
  - [ ] Panel en bas avec stats 2x2
  - [ ] Bouton "Enter Round" visible
- [ ] Sections below (How It Works, etc.) scrollables
- [ ] Pas de débordement horizontal
- [ ] Touch targets ≥ 44px

**Comment tester:**
```
Chrome DevTools → F12 → Ctrl+Shift+M
Sélectionner "iPhone SE" ou custom 375x667
```

---

### 📱 Mobile Landscape (667x375)
**Devices**: iPhone en mode paysage

**Checklist:**
- [ ] Game section utilise toute la hauteur
- [ ] Mining block visible
- [ ] Panel accessible sans scroll
- [ ] Tier selector visible

**Comment tester:**
```
Chrome DevTools → Rotate device icon
```

---

### 📱 Mobile Large (480px - 767px)
**Devices**: iPhone 12 Pro, Pixel 5

**Checklist:**
- [ ] Layout identique à mobile S
- [ ] Espacements légèrement plus généreux
- [ ] Mining block ~320px
- [ ] Panel max-height 35dvh

**Comment tester:**
```
Chrome DevTools → Custom 480x800
```

---

### 📱 Tablette Portrait (768px)
**Devices**: iPad, iPad Mini

**Checklist:**
- [ ] Layout 2 colonnes:
  - [ ] Mining block à gauche (flex: 1)
  - [ ] Panel à droite (300px fixe)
- [ ] Tier selector span 2 colonnes
- [ ] Mining block ~360px
- [ ] Tout visible sans scroll vertical
- [ ] Panel scrollable si contenu long

**Comment tester:**
```
Chrome DevTools → "iPad" (768x1024)
```

---

### 💻 Laptop (1024px - 1439px)
**Devices**: MacBook Air, petits laptops

**Checklist:**
- [ ] Layout 3 colonnes:
  - [ ] Sidebar gauche 72px (optionnelle)
  - [ ] Mining block centre (flex: 1)
  - [ ] Panel droite 380px
- [ ] Tier selector centré, span 3 colonnes
- [ ] Mining block ~400px
- [ ] Panel avec CTA sticky en bas
- [ ] Tout above-the-fold

**Comment tester:**
```
Chrome DevTools → Custom 1280x800
```

---

### 🖥️ Desktop (1440px - 1919px)
**Devices**: MacBook Pro 16", écrans 1440p

**Checklist:**
- [ ] Layout 3 colonnes:
  - [ ] Sidebar 72px
  - [ ] Mining block centre
  - [ ] Panel 420px
- [ ] Espacements généreux (2rem gap)
- [ ] Mining block ~420px
- [ ] Proportions équilibrées
- [ ] Pas d'espace mort excessif

**Comment tester:**
```
Chrome DevTools → Custom 1440x900
```

---

### 🖥️ Wide (≥ 1920px)
**Devices**: Écrans 4K, ultra-wide

**Checklist:**
- [ ] Layout 3 colonnes:
  - [ ] Sidebar 72px
  - [ ] Mining block centre
  - [ ] Panel 440px
- [ ] Max-width 1920px centré
- [ ] Mining block 480px
- [ ] Espacements maximum (2.5rem gap)
- [ ] Contenu centré, pas étiré

**Comment tester:**
```
Chrome DevTools → Custom 1920x1080
```

---

## Tests Fonctionnels

### Wallet Connection
1. [ ] Cliquer "Connect Wallet"
2. [ ] Modal s'ouvre correctement
3. [ ] Sélectionner wallet
4. [ ] Connexion réussie
5. [ ] Bouton change en adresse tronquée

### Room Selection
1. [ ] Cliquer sur tier (0.01 / 0.1 / 1.0)
2. [ ] Room change instantanément
3. [ ] Stats se mettent à jour
4. [ ] Mining block se réinitialise

### Join Round
1. [ ] Connecter wallet
2. [ ] Cliquer "Enter Round"
3. [ ] Transaction popup
4. [ ] Approuver transaction
5. [ ] Toast "Entered round successfully"
6. [ ] Position affichée dans panel
7. [ ] Square s'allume dans mining block

### Countdown
1. [ ] Attendre 3 joueurs
2. [ ] Countdown démarre (5, 4, 3, 2, 1)
3. [ ] Rings animés autour du block
4. [ ] Nombre géant au centre
5. [ ] Mining block spin
6. [ ] Résultat affiché (win/lose overlay)

---

## Tests Visuels

### Animations
- [ ] Blob backgrounds animés
- [ ] Cyber grid défile
- [ ] Scanlines visibles
- [ ] Countdown rings pulse
- [ ] Mining block squares glow
- [ ] Buttons hover effects
- [ ] Panel border glow

### Couleurs Solana
- [ ] Surge Green (#00FFA3) visible
- [ ] Ocean Blue (#03E1FF) visible
- [ ] Purple Dino (#DC1FFF) visible
- [ ] Gradients corrects
- [ ] Neon effects présents

### Typography
- [ ] Titres lisibles
- [ ] Stats lisibles
- [ ] Boutons lisibles
- [ ] Contraste suffisant
- [ ] Pas de texte coupé

---

## Tests Performance

### Lighthouse (Chrome DevTools)
```
1. Ouvrir DevTools → Lighthouse tab
2. Sélectionner "Mobile" ou "Desktop"
3. Cocher "Performance"
4. Cliquer "Analyze page load"
```

**Scores attendus:**
- Performance: ≥ 80
- Accessibility: ≥ 90
- Best Practices: ≥ 90
- SEO: ≥ 80

### Core Web Vitals
- [ ] LCP (Largest Contentful Paint): < 2.5s
- [ ] FID (First Input Delay): < 100ms
- [ ] CLS (Cumulative Layout Shift): < 0.1

---

## Tests Accessibilité

### Keyboard Navigation
1. [ ] Tab through all interactive elements
2. [ ] Focus visible sur tous les boutons
3. [ ] Enter/Space activent les boutons
4. [ ] Escape ferme les modals

### Screen Reader (optionnel)
1. [ ] Activer NVDA (Windows) ou VoiceOver (Mac)
2. [ ] Naviguer dans la page
3. [ ] Vérifier que tout est annoncé
4. [ ] Boutons ont des labels clairs

### Contrast
1. [ ] Texte blanc sur fond sombre: ratio ≥ 7:1
2. [ ] Texte coloré lisible
3. [ ] Boutons suffisamment contrastés

---

## Tests iOS (si disponible)

### iPhone Safari
1. [ ] Ouvrir sur iPhone réel
2. [ ] Vérifier safe area (notch)
3. [ ] Panel ne passe pas sous home indicator
4. [ ] Scroll fluide
5. [ ] Touch targets suffisants
6. [ ] Pas de zoom involontaire

### iPad Safari
1. [ ] Ouvrir sur iPad réel
2. [ ] Tester portrait et landscape
3. [ ] Layout 2 colonnes correct
4. [ ] Pas de débordement

---

## Tests Android (si disponible)

### Chrome Android
1. [ ] Ouvrir sur Android réel
2. [ ] Vérifier navigation bar
3. [ ] Scroll fluide
4. [ ] Touch targets OK
5. [ ] Pas de lag

---

## Bugs Connus à Vérifier

### Potentiels Issues
- [ ] Mining block SVG ne scale pas correctement
- [ ] Panel déborde sur mobile landscape
- [ ] Countdown number trop grand sur petit écran
- [ ] Tier selector scroll horizontal pas smooth
- [ ] CTA button caché sous keyboard mobile
- [ ] Wallet modal déborde sur petit écran

### Si Bug Trouvé
1. Noter le breakpoint exact (ex: 375px)
2. Noter l'orientation (portrait/landscape)
3. Noter le navigateur (Chrome/Safari/Firefox)
4. Prendre screenshot
5. Décrire le comportement attendu vs actuel

---

## Commandes Utiles

### Restart Dev Server
```bash
cd MEV-WARS
npm run dev
```

### Clear Cache
```bash
rm -rf .next
npm run dev
```

### Check Diagnostics
```bash
npm run build
```

### Git Status
```bash
git status
git log --oneline -5
```

---

## Résultats Attendus

### ✅ Tous Breakpoints
- Game section visible sans scroll
- Bouton "Enter Round" toujours accessible
- Mining block proportionné et centré
- Panel lisible et fonctionnel
- Animations fluides
- Pas de débordement horizontal

### ✅ Mobile Spécifique
- Panel en bas accessible
- Tier selector horizontal scroll
- Touch targets ≥ 44px
- Safe area iOS respectée

### ✅ Desktop Spécifique
- 3 colonnes équilibrées
- Sidebar visible
- Panel large et confortable
- Hover effects fonctionnels

---

## Contact

Si problème trouvé:
1. Vérifier RESPONSIVE_IMPLEMENTATION.md
2. Vérifier console browser (F12)
3. Vérifier diagnostics TypeScript
4. Créer issue GitHub avec détails

---

**Status**: Ready for testing ✅
**Server**: http://localhost:3001
**Commit**: ffb0229
