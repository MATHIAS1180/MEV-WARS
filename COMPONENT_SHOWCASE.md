# MEV Wars - Component Showcase

## 🎨 Visual Component Guide

This document showcases all the new components with their props, usage, and visual examples.

---

## 1. Hero Component

### Location
`components/Hero.tsx`

### Purpose
Above-the-fold hero section that immediately communicates the value proposition.

### Features
- SEO-optimized H1 heading
- Clear subheadline
- Social proof bar with 4 trust indicators
- Animated entrance
- Gradient text effects

### Usage
```tsx
import Hero from "@/components/Hero";

<Hero />
```

### Visual Structure
```
┌─────────────────────────────────────────┐
│  MEV Wars Provably Fair Solana Casino  │ ← H1 with gradient
│           Casino Game                    │
│                                          │
│  Join a round. 1 in 3 players wins.     │ ← Subheadline
│  Fully on-chain. Instant payouts.       │
│                                          │
│  [✓] 100% On-chain  [⚡] Provably Fair  │ ← Social proof
│  [⏱] Instant Payouts [◎] Built on Solana│
└─────────────────────────────────────────┘
```

### Customization
Edit the text content directly in the component file.

---

## 2. HowItWorks Component

### Location
`components/HowItWorks.tsx`

### Purpose
Explains the game mechanics in 3 simple steps.

### Features
- 3-step visual process
- Icon-based cards
- Connection lines between steps
- Win probability highlight (33.3%)
- Hover animations

### Usage
```tsx
import HowItWorks from "@/components/HowItWorks";

<HowItWorks />
```

### Visual Structure
```
┌──────────────────────────────────────────────────┐
│           How It Works                            │
│                                                   │
│  ┌──────┐────────┌──────┐────────┌──────┐       │
│  │  👥  │        │  ⏱   │        │  🏆  │       │
│  │Players│        │Round │        │Winners│       │
│  │ Join │        │ Runs │        │Selected│      │
│  └──────┘        └──────┘        └──────┘       │
│                                                   │
│         Your Win Chance: 33.3%                   │
│         1 winner per 3 players                   │
└──────────────────────────────────────────────────┘
```

### Customization
Modify the `steps` array to change content.

---

## 3. WhyDifferent Component

### Location
`components/WhyDifferent.tsx`

### Purpose
Highlights competitive advantages over traditional casinos.

### Features
- 4 key differentiators
- Icon-based cards
- Grid layout (1/2/4 columns responsive)
- Hover scale effects
- Gradient accents

### Usage
```tsx
import WhyDifferent from "@/components/WhyDifferent";

<WhyDifferent />
```

### Visual Structure
```
┌──────────────────────────────────────────────────┐
│        Why MEV Wars is Different                  │
│                                                   │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐        │
│  │  👥  │  │  🛡  │  │  ⚡  │  │  📈  │        │
│  │ PvP  │  │Trans-│  │  No  │  │ Fast │        │
│  │Based │  │parent│  │Manip.│  │Exec. │        │
│  └──────┘  └──────┘  └──────┘  └──────┘        │
└──────────────────────────────────────────────────┘
```

### Customization
Edit the `features` array to add/remove items.

---

## 4. ProvablyFair Component

### Location
`components/ProvablyFair.tsx`

### Purpose
Builds trust by explaining the provably fair mechanism.

### Features
- 2-column layout (responsive)
- Provably fair RNG explanation
- Protocol rules list
- "View on Explorer" CTA
- Gradient background effects

### Usage
```tsx
import ProvablyFair from "@/components/ProvablyFair";

<ProvablyFair />
```

### Visual Structure
```
┌──────────────────────────────────────────────────┐
│  ┌─────────────────┐  ┌─────────────────┐       │
│  │ Provably Fair   │  │ Protocol Rules  │       │
│  │ RNG             │  │                 │       │
│  │                 │  │ → Unlimited     │       │
│  │ Explanation...  │  │ → 1 per 3       │       │
│  │                 │  │ → 95% pool      │       │
│  │ [View Explorer] │  │ → 30s timer     │       │
│  └─────────────────┘  └─────────────────┘       │
└──────────────────────────────────────────────────┘
```

### Customization
Update text content and rules list in the component.

---

## 5. FAQ Component

### Location
`components/FAQ.tsx`

### Purpose
Answers common questions for SEO and user education.

### Features
- 6 pre-written questions
- Accordion interaction
- Smooth expand/collapse
- Chevron rotation animation
- Mobile-optimized

### Usage
```tsx
import FAQ from "@/components/FAQ";

<FAQ />
```

### Visual Structure
```
┌──────────────────────────────────────────────────┐
│     Frequently Asked Questions                    │
│                                                   │
│  ┌─────────────────────────────────────────┐    │
│  │ How does the 1 in 3 system work?    [v]│    │
│  │ Answer text here...                     │    │
│  └─────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────┐    │
│  │ Is this game really fair?            [>]│    │
│  └─────────────────────────────────────────┘    │
│  ...                                             │
└──────────────────────────────────────────────────┘
```

### Customization
Edit the `faqs` array to add/modify questions.

---

## 6. LiveActivity Component

### Location
`components/LiveActivity.tsx`

### Purpose
Shows real-time game activity for social proof.

### Features
- Win/join event display
- Timestamps
- Scrollable feed
- Animated entries
- Mock data (ready for real integration)

### Usage
```tsx
import LiveActivity from "@/components/LiveActivity";

<LiveActivity />
```

### Visual Structure
```
┌──────────────────────────────────────────────────┐
│  ● Live Activity                                  │
│                                                   │
│  ┌────────────────────────────────────────┐     │
│  │ 🏆 8xA...kP9 won 0.285 SOL    5s ago   │     │
│  ├────────────────────────────────────────┤     │
│  │ 👤 3mB...xL2 joined the round 12s ago  │     │
│  ├────────────────────────────────────────┤     │
│  │ 🏆 5nC...qR7 won 0.95 SOL     25s ago  │     │
│  └────────────────────────────────────────┘     │
└──────────────────────────────────────────────────┘
```

### Customization
Replace mock data with real-time data from your backend.

---

## 7. Footer Component

### Location
`components/Footer.tsx`

### Purpose
Site footer with links and legal information.

### Features
- 3-column layout (responsive)
- Brand information
- Legal links
- Social media icons
- Copyright notice

### Usage
```tsx
import Footer from "@/components/Footer";

<Footer />
```

### Visual Structure
```
┌──────────────────────────────────────────────────┐
│  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │  Brand   │  │  Legal   │  │  Social  │       │
│  │  Logo    │  │  Terms   │  │  [T][D]  │       │
│  │  Tagline │  │  Privacy │  │  [G]     │       │
│  └──────────┘  └──────────┘  └──────────┘       │
│                                                   │
│  © 2026 MEV Wars. Built on Solana.              │
└──────────────────────────────────────────────────┘
```

### Customization
Update links and social media URLs in the component.

---

## 8. MiningBlock Component (Updated)

### Location
`components/MiningBlock.tsx`

### Purpose
Visual representation of the game state with 30 player slots.

### Features
- 30-square grid (5x6)
- Solana official colors
- Dynamic player activation
- Glow effects per player
- Countdown overlay
- Spinning animation
- Gradient borders

### Props
```typescript
interface Props {
  playerCount: number;      // Number of active players
  isSpinning: boolean;      // Spinning animation state
  rotation: number;         // Rotation angle
  countdown: number | null; // Countdown timer
}
```

### Usage
```tsx
import MiningBlock from "@/components/MiningBlock";

<MiningBlock 
  playerCount={12}
  isSpinning={false}
  rotation={0}
  countdown={null}
/>
```

### Visual Structure
```
┌──────────────────────────────────────────────────┐
│                                                   │
│     ┌─────────────────────────────────┐         │
│     │ ■ ■ ■ ■ ■ ■  ← 6 squares/row    │         │
│     │ ■ ■ ■ ■ ■ ■                     │         │
│     │ ■ ■ □ □ □ □  ← Active/Inactive  │         │
│     │ □ □ □ □ □ □                     │         │
│     │ □ □ □ □ □ □  ← 5 rows total     │         │
│     └─────────────────────────────────┘         │
│                                                   │
│     12 players = 12 active squares               │
│     Remaining 18 squares inactive                │
└──────────────────────────────────────────────────┘
```

### Color System
Each square uses a unique Solana color from the 30-color palette:
- Purple Dino (#DC1FFF)
- Ocean Blue (#03E1FF)
- Surge Green (#00FFA3)
- + 27 more variations

---

## 🎨 Styling Patterns

### Glass Card Pattern
```tsx
<div className="glass-card p-8">
  {/* Content */}
</div>
```

### Neon Text
```tsx
<span className="neon-text-green">Text</span>
<span className="neon-text-blue">Text</span>
<span className="neon-text-purple">Text</span>
```

### Primary Button
```tsx
<button className="btn-solana w-full h-14">
  ENTER ROUND
</button>
```

### Stat Card
```tsx
<div className="stat-card">
  <p className="stat-label">Label</p>
  <p className="stat-value neon-text-green">Value</p>
</div>
```

---

## 📱 Responsive Behavior

### Mobile (< 640px)
- Single column layouts
- Stacked components
- Full-width cards
- Touch-optimized

### Tablet (640px - 1024px)
- 2-column grids
- Side-by-side layouts
- Reduced spacing

### Desktop (> 1024px)
- 3-4 column grids
- Full layouts
- Hover effects
- Optimal spacing

---

## 🎭 Animation Patterns

### Entrance Animations
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.1 }}
>
  {/* Content */}
</motion.div>
```

### Scroll Animations
```tsx
<motion.div
  initial={{ opacity: 0, y: 30 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true }}
>
  {/* Content */}
</motion.div>
```

### Hover Effects
```tsx
<motion.div
  whileHover={{ scale: 1.05 }}
  transition={{ duration: 0.2 }}
>
  {/* Content */}
</motion.div>
```

---

## 🔧 Component Composition

### Full Page Structure
```tsx
<main>
  <Header />
  <Hero />
  <GameSection>
    <MiningBlock />
    <GameCard />
  </GameSection>
  <HowItWorks />
  <WhyDifferent />
  <ProvablyFair />
  <LiveActivity />
  <FAQ />
  <Footer />
</main>
```

---

## 💡 Best Practices

### Component Design
- Keep components focused (single responsibility)
- Use TypeScript for type safety
- Document props with interfaces
- Handle loading/error states

### Styling
- Use Tailwind utility classes
- Leverage design system colors
- Maintain consistent spacing
- Ensure responsive design

### Performance
- Lazy load below-fold content
- Optimize images
- Minimize re-renders
- Use React.memo when needed

### Accessibility
- Semantic HTML
- ARIA labels
- Keyboard navigation
- Color contrast

---

## 📚 Additional Resources

### Documentation
- `REDESIGN_NOTES.md` - Complete overview
- `DESIGN_SYSTEM.md` - Design guidelines
- `IMPLEMENTATION_SUMMARY.md` - Technical details
- `QUICK_START.md` - Getting started

### External Links
- [Framer Motion Docs](https://www.framer.com/motion)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Next.js Docs](https://nextjs.org/docs)

---

**Happy Building! 🚀**
