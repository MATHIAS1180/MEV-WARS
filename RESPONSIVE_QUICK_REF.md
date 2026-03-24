# MEV Wars - Responsive Quick Reference 🎯

## 🚀 Quick Start

```bash
cd MEV-WARS
npm run dev
# → http://localhost:3001
```

---

## 📐 Breakpoints Cheat Sheet

```
📱 Mobile S      < 480px       1 col, panel bottom
📱 Mobile L      480-767px     1 col, panel bottom
📱 Tablet        768-1023px    2 cols (grid + panel)
💻 Laptop        1024-1439px   3 cols (sidebar + grid + panel)
🖥️ Desktop       1440-1919px   3 cols, wider spacing
🖥️ Wide          ≥ 1920px      3 cols, max-width centered
```

---

## 🎨 Layout Visual

### Mobile (< 768px)
```
┌─────────────────────┐
│      HEADER         │ ← 52px fixed
├─────────────────────┤
│      HERO           │ ← scrollable
├─────────────────────┤
│  ┌───────────────┐  │
│  │ Tier Selector │  │ ← 48px, horizontal scroll
│  └───────────────┘  │
│  ┌───────────────┐  │
│  │               │  │
│  │ Mining Block  │  │ ← flex: 1, centered
│  │    (280px)    │  │
│  │               │  │
│  └───────────────┘  │
│  ┌───────────────┐  │
│  │  Game Panel   │  │ ← max-height 35dvh
│  │  Stats + CTA  │  │
│  └───────────────┘  │
├─────────────────────┤
│   OTHER SECTIONS    │ ← scrollable
└─────────────────────┘
```

### Tablet (768px - 1023px)
```
┌─────────────────────────────────┐
│           HEADER                │ ← 60px fixed
├─────────────────────────────────┤
│           HERO                  │ ← scrollable
├─────────────────────────────────┤
│  ┌─────────────────────────┐   │
│  │    Tier Selector        │   │ ← spans 2 cols
│  └─────────────────────────┘   │
│  ┌──────────┐  ┌──────────┐   │
│  │          │  │  Panel   │   │
│  │  Mining  │  │  300px   │   │
│  │  Block   │  │          │   │
│  │  360px   │  │  Stats   │   │
│  │          │  │   +      │   │
│  │          │  │   CTA    │   │
│  └──────────┘  └──────────┘   │
├─────────────────────────────────┤
│       OTHER SECTIONS            │ ← scrollable
└─────────────────────────────────┘
```

### Desktop (≥ 1024px)
```
┌───────────────────────────────────────────┐
│              HEADER                       │ ← 60px fixed
├───────────────────────────────────────────┤
│              HERO                         │ ← scrollable
├───────────────────────────────────────────┤
│  ┌─────────────────────────────────────┐ │
│  │       Tier Selector (centered)      │ │ ← spans 3 cols
│  └─────────────────────────────────────┘ │
│  ┌──┐  ┌──────────────┐  ┌──────────┐  │
│  │S │  │              │  │  Panel   │  │
│  │i │  │    Mining    │  │  380px+  │  │
│  │d │  │    Block     │  │          │  │
│  │e │  │   400-480px  │  │  Stats   │  │
│  │b │  │              │  │          │  │
│  │a │  │              │  │   CTA    │  │
│  │r │  │              │  │ (sticky) │  │
│  └──┘  └──────────────┘  └──────────┘  │
├───────────────────────────────────────────┤
│          OTHER SECTIONS                   │ ← scrollable
└───────────────────────────────────────────┘
```

---

## 🎯 Key Constraints

### ✅ MUST HAVE
- Game section visible WITHOUT SCROLL
- Enter Round button ALWAYS visible
- Mining block properly sized
- Panel accessible on all breakpoints

### ❌ MUST NOT
- Modify business logic
- Change Solana colors
- Touch wallet integration
- Modify smart contract calls

---

## 📝 CSS Variables

```css
--nav-height: 52px;              /* 60px on desktop */
--tier-bar-height: 48px;
--bottom-panel-height: 140px;    /* mobile only */
--side-panel-width: 380px;       /* desktop */
--sidebar-width: 72px;           /* desktop */
```

---

## 🔧 Key Classes

### Layout
- `.game-layout-root` - Root container (100dvh grid)
- `.game-content-wrapper` - Scrollable wrapper
- `.game-section-fixed` - Fixed game area (no scroll)

### Mobile
- `.tier-selector-mobile`
- `.mining-block-container-mobile`
- `.game-panel-mobile`

### Desktop
- `.tier-selector-desktop`
- `.game-sidebar`
- `.mining-block-container-desktop`
- `.game-panel-desktop`

---

## 🧪 Quick Test

### Chrome DevTools
```
1. F12 (open DevTools)
2. Ctrl+Shift+M (toggle device toolbar)
3. Select device:
   - iPhone SE (375px)
   - iPad (768px)
   - Laptop (1280px)
   - 4K (1920px)
4. Check:
   ✓ Game section visible
   ✓ No vertical scroll in game area
   ✓ Enter button visible
   ✓ Mining block centered
```

---

## 📊 Mining Block Sizes

| Breakpoint | SVG Size | Container |
|------------|----------|-----------|
| Mobile S   | 280px    | flex: 1   |
| Mobile L   | 320px    | flex: 1   |
| Tablet     | 360px    | flex: 1   |
| Laptop     | 400px    | flex: 1   |
| Desktop    | 420px    | flex: 1   |
| Wide       | 480px    | flex: 1   |

---

## 🐛 Common Issues

### Issue: Mining block too big on mobile
**Fix**: Check `.mining-block-wrapper svg` max-width/max-height

### Issue: Panel hidden on mobile
**Fix**: Check `.game-panel-mobile` max-height (should be 35dvh)

### Issue: Horizontal scroll
**Fix**: Check `overflow-x: hidden` on `.game-content-wrapper`

### Issue: CTA button hidden
**Fix**: Check `margin-top: auto` on CTA in panel

### Issue: iOS notch overlap
**Fix**: Check `env(safe-area-inset-bottom)` in panel padding

---

## 📦 Files Modified

```
✏️ app/globals.css          (+500 lines CSS)
✏️ app/page.tsx             (restructured layout)
✏️ components/GameCard.tsx  (responsive sizing)

📄 RESPONSIVE_IMPLEMENTATION.md  (tech docs)
📄 RESPONSIVE_TEST_GUIDE.md      (test guide)
📄 RESPONSIVE_SUMMARY.md         (summary)
📄 RESPONSIVE_QUICK_REF.md       (this file)
```

---

## 🚦 Status Checklist

- [x] Mobile S (< 480px)
- [x] Mobile L (480-767px)
- [x] Tablet (768-1023px)
- [x] Laptop (1024-1439px)
- [x] Desktop (1440-1919px)
- [x] Wide (≥ 1920px)
- [x] iOS safe area
- [x] No business logic changes
- [x] Solana colors preserved
- [x] Documentation complete
- [x] Committed to GitHub
- [x] Dev server running

---

## 🎉 Result

**Before**: Fixed layout, mobile broken, scroll issues
**After**: Fully responsive, 6 breakpoints, no scroll in game area

**Status**: ✅ COMPLETE
**Commit**: 52925ea
**Server**: http://localhost:3001

---

## 📚 Full Documentation

- **Technical**: `RESPONSIVE_IMPLEMENTATION.md`
- **Testing**: `RESPONSIVE_TEST_GUIDE.md`
- **Summary**: `RESPONSIVE_SUMMARY.md`
- **Quick Ref**: `RESPONSIVE_QUICK_REF.md` (this file)

---

## 💡 Pro Tips

1. **Use 100dvh** instead of 100vh (mobile browsers)
2. **Test landscape** mode on mobile
3. **Check iOS safe area** on real device
4. **Verify touch targets** ≥ 44px
5. **Test with real wallet** connection
6. **Check animations** on low-end devices

---

**Happy Testing! 🚀**
