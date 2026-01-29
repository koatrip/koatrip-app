# Koatrip - Next.js 14 + Tailwind CSS

## 🎨 Tailwind CSS Version

This is the optimized version using Tailwind CSS, maintaining exactly the same visual styles as the original design.

## 📁 Files to Copy to Your Project

```
koatrip-app/
├── app/
│   ├── layout.tsx           # Main layout (replace yours)
│   ├── page.tsx             # Home page (replace yours)
│   └── globals.css          # Global styles (replace yours)
└── tailwind.config.ts       # Tailwind config (replace yours)
```

## 🚀 Quick Installation

You already have Next.js 14 with Tailwind, so you only need to:

### 1. **Replace the Files**
Copy the 4 files to your `koatrip-app` project

### 2. **Verify Tailwind CSS is Installed**
Your `package.json` should have:
```json
{
  "dependencies": {
    "tailwindcss": "^3.x.x",
    "postcss": "^8.x.x",
    "autoprefixer": "^10.x.x"
  }
}
```

### 3. **Start the Server**
```bash
npm run dev
```

Done! Open [http://localhost:3000](http://localhost:3000)

## ✨ What's Included?

### Main Component (`page.tsx`)
- ✅ All React logic with hooks
- ✅ Full TypeScript
- ✅ Textarea state management
- ✅ Handlers for quick questions
- ✅ Enter to submit, Shift+Enter for new line
- ✅ Inline Tailwind classes (easier to maintain)

### Custom Styles (`globals.css`)
- ✅ Google Fonts (Crimson Pro + DM Sans)
- ✅ Custom animations: wave, fadeInUp, bounceIn, fadeIn
- ✅ Configured with `@layer utilities`

### Tailwind Configuration (`tailwind.config.ts`)
- ✅ Custom koala colors:
  - `koala-gray`: #4a4a4a
  - `koala-eucalyptus`: #7c9885
  - `koala-eucalyptus-light`: #a8c4b0
  - `koala-cream`: #faf8f4
  - `koala-sand`: #e8e4dc
- ✅ Animations configured
- ✅ Custom fonts available as `font-serif` and `font-sans`

## 🎯 Advantages of This Version

### vs CSS Modules:
- 🚀 **Faster**: Change classes and see immediate results
- 📦 **Fewer files**: No need for separate `.module.css` files
- 🔍 **More readable**: All styling alongside HTML
- 🎨 **More maintainable**: Visual changes without changing files
- 📱 **Easy responsive**: `md:`, `lg:`, `hover:` integrated

### Usage Examples:
```tsx
// Change color easily
<div className="bg-koala-cream hover:bg-koala-eucalyptus">

// Responsive design
<div className="w-full md:w-1/2 lg:w-1/3">

// Animations
<div className="animate-wave hover:scale-110">
```

## 🛠️ Recommended Next Steps

### 1. Separate into Components
```typescript
// components/Sidebar.tsx
export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 w-[260px]...">
      {/* content */}
    </aside>
  );
}
```

### 2. Add Global State with Zustand
```bash
npm install zustand
```

```typescript
// store/useChatStore.ts
import { create } from 'zustand';

interface ChatStore {
  messages: Message[];
  addMessage: (message: Message) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message]
  })),
}));
```

### 3. Integrate Claude API
```bash
npm install @anthropic-ai/sdk
```

```typescript
// app/api/chat/route.ts
import Anthropic from '@anthropic-ai/sdk';

export async function POST(req: Request) {
  const { message } = await req.json();

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const response = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    messages: [{ role: "user", content: message }],
  });

  return Response.json(response);
}
```

### 4. Create Additional Routes
```
app/
├── page.tsx              # Home (done ✅)
├── itinerarios/
│   └── page.tsx         # Top itineraries
├── mis-viajes/
│   └── page.tsx         # My saved trips
└── settings/
    └── page.tsx         # User settings
```

## 🐨 Quick Customization

### Change Colors:
Edit `tailwind.config.ts`:
```typescript
colors: {
  koala: {
    gray: '#yourColor',
    eucalyptus: '#yourColor',
    // ...
  }
}
```

### Add New Animations:
In `globals.css`:
```css
@keyframes yourAnimation {
  from { /* ... */ }
  to { /* ... */ }
}

.animate-yourAnimation {
  animation: yourAnimation 1s ease-in-out;
}
```

## 📱 Responsive

The design is responsive by default, but you can customize:
```tsx
// Mobile-first approach
<div className="
  w-full          // Mobile
  md:w-1/2        // Tablet
  lg:w-1/3        // Desktop
">
```

## 🎨 Color System

Use koala colors anywhere:
```tsx
// Backgrounds
className="bg-koala-cream"
className="bg-koala-eucalyptus"

// Text
className="text-koala-gray"
className="text-koala-eucalyptus-light"

// Borders
className="border-koala-sand"

// Hover states
className="hover:bg-koala-eucalyptus hover:text-white"
```

## 💡 Tips

- Fonts are already loaded from Google Fonts
- All animations are pure CSS (super performant)
- Koala and leaf emojis are in the code, you can change them
- Sidebar is fixed, content has margin-left
- Focus states are configured for accessibility

## 🐛 Troubleshooting

**Fonts not showing?**
→ Verify that `globals.css` is imported in `layout.tsx`

**Animations not working?**
→ Verify that `tailwind.config.ts` includes the keyframes

**Colors not working?**
→ Make sure to use `koala-eucalyptus` and not `eucalyptus`

---

Questions? The code is ready to use. Let's build Koatrip! 🐨✈️

