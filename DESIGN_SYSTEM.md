# MEV Wars Design System

## Color Palette (Solana Official)

### Primary Colors
```
Surge Green:  #00FFA3  rgb(0, 255, 163)   - Primary CTAs, Success
Ocean Blue:   #03E1FF  rgb(3, 225, 255)   - Secondary, Info
Purple Dino:  #DC1FFF  rgb(220, 31, 255)  - Highlights, Premium
Black:        #000000  rgb(0, 0, 0)       - Background
```

### Usage Guidelines
- **Surge Green (#00FFA3)**: Primary buttons, win states, positive indicators
- **Ocean Blue (#03E1FF)**: Secondary accents, information, links
- **Purple Dino (#DC1FFF)**: Premium features, highlights, hover states
- **Black (#000000)**: Pure black background for maximum contrast

### Gradients
```css
/* Primary CTA */
background: linear-gradient(90deg, #00FFA3, #03E1FF);

/* Heading Accent */
background: linear-gradient(to right, #00FFA3, #03E1FF, #DC1FFF);

/* Card Hover */
background: linear-gradient(135deg, rgba(220,31,255,0.1), rgba(0,255,163,0.1));
```

## Typography

### Font Families
- **Primary**: Space Grotesk (headings, UI)
- **Secondary**: Inter (body text)
- **Monospace**: System mono (addresses, numbers)

### Scale
```
Hero H1:      48px - 72px  (font-black, uppercase)
Section H2:   32px - 48px  (font-black, uppercase)
Card H3:      20px - 24px  (font-bold, uppercase)
Body:         14px - 16px  (font-medium)
Microcopy:    10px - 12px  (font-bold, uppercase, tracking-widest)
```

### Weights
- **Black (900)**: Headings, CTAs
- **Bold (700)**: Subheadings, labels
- **Medium (500)**: Body text
- **Regular (400)**: Secondary text

## Spacing System

### Base Unit: 4px
```
xs:  4px   (0.25rem)
sm:  8px   (0.5rem)
md:  16px  (1rem)
lg:  24px  (1.5rem)
xl:  32px  (2rem)
2xl: 48px  (3rem)
3xl: 64px  (4rem)
```

### Component Padding
- **Cards**: 24px - 32px
- **Buttons**: 12px - 16px (vertical), 24px - 32px (horizontal)
- **Sections**: 48px - 64px (vertical)

## Border Radius

```
Small:   8px   - Badges, small buttons
Medium:  12px  - Cards, inputs
Large:   16px  - Large cards
XLarge:  20px  - Hero elements
Round:   9999px - Pills, avatars
```

## Shadows & Glows

### Glass Effect
```css
background: linear-gradient(135deg, rgba(255,255,255,0.06), rgba(0,0,0,0.5));
backdrop-filter: blur(24px);
border: 1px solid rgba(255,255,255,0.1);
box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.4);
```

### Neon Glow
```css
/* Green Glow */
box-shadow: 0 0 20px rgba(0, 255, 163, 0.3);
text-shadow: 0 0 10px rgba(0, 255, 163, 0.5);

/* Purple Glow */
box-shadow: 0 0 20px rgba(220, 31, 255, 0.3);
text-shadow: 0 0 10px rgba(220, 31, 255, 0.5);

/* Blue Glow */
box-shadow: 0 0 20px rgba(3, 225, 255, 0.3);
text-shadow: 0 0 10px rgba(3, 225, 255, 0.5);
```

## Buttons

### Primary CTA
```css
.btn-solana {
  background: linear-gradient(90deg, #00FFA3, #03E1FF);
  color: #000;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  border-radius: 12px;
  padding: 14px 28px;
  box-shadow: 0 0 20px rgba(0, 255, 163, 0.3);
}

.btn-solana:hover {
  box-shadow: 0 0 40px rgba(0, 255, 163, 0.5);
  transform: translateY(-2px) scale(1.02);
}
```

### Secondary Button
```css
.btn-secondary {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  border-radius: 12px;
  padding: 12px 24px;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(0, 255, 163, 0.3);
}
```

## Cards

### Glass Card
```css
.glass-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.06), rgba(0, 0, 0, 0.5));
  backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 32px;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.4);
}

.glass-card:hover {
  border-color: rgba(220, 31, 255, 0.6);
  box-shadow: 0 0 40px rgba(220, 31, 255, 0.15);
  transform: translateY(-4px);
}
```

### Stat Card
```css
.stat-card {
  background: linear-gradient(135deg, rgba(255,255,255,0.05), rgba(0,0,0,0.4));
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 16px;
  padding: 20px;
}
```

## Animations

### Timing Functions
```css
/* Smooth ease */
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

/* Bounce */
transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);

/* Snap */
transition: all 0.2s ease;
```

### Keyframes
```css
/* Blob animation */
@keyframes blob {
  0% { transform: translate(0px, 0px) scale(1); }
  33% { transform: translate(30px, -50px) scale(1.1); }
  66% { transform: translate(-20px, 20px) scale(0.9); }
  100% { transform: translate(0px, 0px) scale(1); }
}

/* Pulse */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Spin */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

## Responsive Breakpoints

```css
/* Mobile First */
@media (min-width: 640px)  { /* sm */ }
@media (min-width: 768px)  { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
@media (min-width: 1536px) { /* 2xl */ }
```

### Component Scaling
- **Mobile (< 640px)**: Single column, stacked layout
- **Tablet (640px - 1024px)**: 2-column grid, reduced spacing
- **Desktop (> 1024px)**: Full layout, optimal spacing

## Icons

### Size Scale
```
xs:  12px
sm:  16px
md:  20px
lg:  24px
xl:  32px
2xl: 48px
```

### Usage
- **Lucide React**: Primary icon library
- **Style**: Stroke-based, 2px stroke width
- **Color**: Inherit from parent or use brand colors

## States

### Interactive States
```css
/* Default */
opacity: 1;

/* Hover */
opacity: 1;
transform: translateY(-2px);
box-shadow: enhanced;

/* Active/Pressed */
transform: translateY(2px) scale(0.98);

/* Disabled */
opacity: 0.5;
cursor: not-allowed;
pointer-events: none;

/* Loading */
opacity: 0.7;
cursor: wait;
```

### Status Colors
```
Success:  #00FFA3  (Surge Green)
Info:     #03E1FF  (Ocean Blue)
Warning:  #FFB84D  (Orange)
Error:    #FF6B9D  (Pink)
```

## Layout Grid

### Container
```css
.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 16px;
}

@media (min-width: 640px) {
  .container { padding: 0 24px; }
}

@media (min-width: 1024px) {
  .container { padding: 0 48px; }
}
```

### Grid System
```css
/* 12-column grid */
.grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 24px;
}

/* Common patterns */
.col-span-6  { grid-column: span 6; }  /* Half */
.col-span-4  { grid-column: span 4; }  /* Third */
.col-span-3  { grid-column: span 3; }  /* Quarter */
```

## Accessibility

### Contrast Ratios
- **Text on Black**: Minimum 7:1 (AAA)
- **Large Text**: Minimum 4.5:1 (AA)
- **UI Components**: Minimum 3:1

### Focus States
```css
:focus-visible {
  outline: 2px solid #00FFA3;
  outline-offset: 2px;
}
```

### Motion
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Component Patterns

### Hero Section
- Full viewport height on desktop
- Centered content
- Large heading (48px-72px)
- Subheading (18px-24px)
- Primary CTA prominent
- Social proof bar below

### Card Grid
- 1 column mobile
- 2 columns tablet
- 3-4 columns desktop
- Equal height cards
- Consistent spacing (24px gap)

### Form Elements
- Clear labels (12px, uppercase, tracking-wide)
- Large inputs (48px height)
- Rounded corners (12px)
- Glass effect background
- Focus states with brand colors

## Best Practices

### DO
✓ Use official Solana colors only
✓ Maintain high contrast (text on black)
✓ Keep animations under 300ms
✓ Use glass effect for cards
✓ Implement hover states
✓ Show loading states
✓ Provide clear feedback

### DON'T
✗ Use colors outside the palette
✗ Create cluttered layouts
✗ Overuse animations
✗ Hide important information
✗ Use small touch targets (< 44px)
✗ Forget mobile optimization
✗ Skip accessibility features

## Code Examples

### Glass Card Component
```tsx
<div className="glass-card p-8 hover:border-[#DC1FFF]/60 transition-all">
  <h3 className="text-xl font-black uppercase tracking-tight text-white mb-4">
    Card Title
  </h3>
  <p className="text-zinc-400 text-sm leading-relaxed">
    Card content goes here
  </p>
</div>
```

### Primary Button
```tsx
<button className="btn-solana w-full h-14 text-base font-black">
  ENTER ROUND — 0.1 SOL
</button>
```

### Stat Display
```tsx
<div className="stat-card">
  <p className="stat-label">Players</p>
  <p className="stat-value neon-text-green">12</p>
  <p className="text-xs text-zinc-600 mt-1">4 winners</p>
</div>
```

---

**Version**: 1.0.0  
**Last Updated**: 2026-03-24  
**Maintained By**: MEV Wars Design Team
