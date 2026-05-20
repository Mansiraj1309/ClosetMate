# ClosetMate — Complete Bug Fix Guide
## Copy-paste these files into your project. Replace old files entirely.

---

## 🗂️ FILE REPLACEMENT MAP

| Fixed File | Replace In Your Project |
|---|---|
| `backend/routes/stylist.js` | `backend/routes/stylist.js` |
| `frontend/src/pages/Stylist.jsx` | `frontend/src/pages/Stylist.jsx` |
| `frontend/src/pages/Stylist.css` | `frontend/src/pages/Stylist.css` |
| `frontend/src/pages/Wardrobe.jsx` | `frontend/src/pages/Wardrobe.jsx` |
| `frontend/src/components/ScanTagModal.jsx` | `frontend/src/components/ScanTagModal.jsx` |
| `frontend/src/components/FloatingAddButton.jsx` | `frontend/src/components/FloatingAddButton.jsx` |
| `frontend/src/components/AddItemModal.jsx` | `frontend/src/components/AddItemModal.jsx` |
| `frontend/src/components/AddItemModal.css` | `frontend/src/components/AddItemModal.css` |

---

## 🐛 BUG #1 — AI Stylist: Wrong Gemini SDK + Model Name
**File:** `backend/routes/stylist.js`

### What was broken
- Used `@google/generative-ai` (old SDK) with `gemini-pro-latest` (invalid model name)
- This caused ALL AI stylist calls to throw an error before even hitting Gemini

### Fix applied
```js
// ❌ BEFORE
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro-latest" });
// ...called as model.generateContent(prompt)

// ✅ AFTER
const { GoogleGenAI } = require('@google/genai');  // new SDK (already in wardrobe.js!)
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
// ...called as ai.models.generateContent({ model: 'gemini-2.0-flash', ... })
```

Note: `wardrobe.js` already uses the new SDK correctly. `stylist.js` was still on the old one.

---

## 🐛 BUG #2 — AI Stylist: Shopping Suggestions Never Shown
**File:** `frontend/src/pages/Stylist.jsx`

### What was broken
- Backend returns `shoppingSuggestions` array in every response
- Frontend `RecommendationCard` never rendered it — no UI for shopping suggestions at all

### Fix applied
- Added collapsible `ShoppingSuggestions` section inside `RecommendationCard`
- Each suggestion shows item name, price, reason, and clickable store links (Myntra, Ajio, etc.)

---

## 🐛 BUG #3 — AI Stylist: Packing List Never Actually Called
**File:** `frontend/src/pages/Stylist.jsx`

### What was broken
```js
// ❌ BEFORE — detected packing but still called /recommend, just with isPacking:true
if (isPackingRequest) {
    body.isPacking = true;  // backend ignores this field!
}
let endpoint = `${API_BASE}/api/stylist/recommend`;  // NEVER changed to packing endpoint
```

### Fix applied
```js
// ✅ AFTER — actually calls the packing-list endpoint with destination + duration
if (isPackingRequest(text)) {
    const { destination, duration } = extractPackingParams(text);
    endpoint = `${API_BASE}/api/stylist/packing-list`;
    body = { destination, duration, activities: text };
}
```
- Added `PackingCard` component that shows packing list, day-by-day plan, and shopping tabs

---

## 🐛 BUG #4 — AI Stylist: Capacitor Share Crashes on Web
**File:** `frontend/src/pages/Stylist.jsx`

### What was broken
```js
// ❌ BEFORE — @capacitor/share is native-only, throws on web/Vercel
import { Share } from '@capacitor/share';
await Share.share({ ... });
```

### Fix applied
```js
// ✅ AFTER — Web Share API with clipboard fallback
if (navigator.share) {
    await navigator.share(shareData);
} else {
    await navigator.clipboard.writeText('https://closet-mate.vercel.app');
    alert('Link copied to clipboard!');
}
```

---

## 🐛 BUG #5 — Scan Tag: Token Read from localStorage Unreliably
**File:** `frontend/src/components/ScanTagModal.jsx`

### What was broken
- `ScanTagModal` read auth token directly from `localStorage.getItem('closetmate_token')`
- If the token key name is different or session context changes, scan silently fails with 401

### Fix applied
- `ScanTagModal` now accepts `token` as a prop
- `FloatingAddButton` gets the token from `useAuth()` and passes it down
- Falls back to localStorage as secondary option

---

## 🐛 BUG #6 — Scan Tag: Camera Stream Not Stopped Properly
**File:** `frontend/src/components/ScanTagModal.jsx`

### What was broken
- Camera stream was tracked via `videoRef.current.srcObject` — unreliable after component updates
- Stream sometimes stayed on after modal closed (camera indicator kept showing)

### Fix applied
- Added `streamRef` to track the MediaStream object separately
- Cleanup now reliably calls `streamRef.current.getTracks().forEach(track => track.stop())`

---

## 🐛 BUG #7 — Scan Tag: "Edit Details" and "Add Photo" Buttons Did Nothing
**File:** `frontend/src/components/ScanTagModal.jsx`

### What was broken
```jsx
// ❌ BEFORE — buttons had no onClick handlers
<button className="action-btn outline">Edit Details</button>
<button className="action-btn outline"><Camera size={16} /> Add Photo</button>
```

### Fix applied
- Removed dead "Edit Details" button (editing happens in AddItemModal after saving)
- Replaced with a functional "Scan Again" button that resets the flow

---

## 🐛 BUG #8 — Scan Tag: onScanned Passed Incomplete Data to AddItemModal
**File:** `frontend/src/components/FloatingAddButton.jsx` + `ScanTagModal.jsx`

### What was broken
- `onScanned(data)` passed the raw AI response
- `AddItemModal` only read `brand`, `size`, `price` from `initialData`
- Color, category, type, style, season, occasions were all ignored

### Fix applied
- `ScanTagModal.handleSaveToCloset` now maps all AI fields to the correct `initialData` shape
- `AddItemModal` already reads all these fields from `initialData` in its `useEffect`

---

## 🐛 BUG #9 — Wardrobe Filter: Category & Gender Values Don't Match Database
**File:** `frontend/src/pages/Wardrobe.jsx`

### What was broken
```js
// ❌ BEFORE — these don't match what's stored in MongoDB
const CATEGORY_OPTIONS = ['Dresses / Suits', 'Shoes', 'Ethnic'];  
const GENDER_OPTIONS = ['Menswear', 'Womenswear', 'Unisex'];
// DB stores: 'Dresses', 'Footwear', 'Ethnic Wear', 'Men', 'Women'
// → Filters NEVER matched any item!
```

### Fix applied
```js
// ✅ AFTER — exact match with constants.js and MongoDB values
const CATEGORY_OPTIONS = ['Tops', 'Bottoms', 'Dresses', 'Ethnic Wear', 'Loungewear', 
    'Footwear', 'Accessories', 'Jewelry', 'Outerwear', 'Activewear'];
const GENDER_OPTIONS = ['Men', 'Women', 'Unisex'];
```

---

## 🐛 BUG #10 — AddItemModal: Auto-Saves on Step 3 Without Clicking Save
**File:** `frontend/src/components/AddItemModal.jsx`

### What was broken
- Save button was `type="submit"` inside a `<form onSubmit={handleSubmit}>`
- `type="number"` input for price triggers form submit on mobile keyboard "Done"
- `onKeyDown` guard only caught physical Enter key, not mobile keyboard submit

### Fix applied
- Changed form to `onSubmit={(e) => e.preventDefault()}` — form submit does nothing
- Changed Save button from `type="submit"` to `type="button" onClick={handleSubmit}`
- Changed price input from `type="number"` to `type="text" inputMode="numeric"` (same UX, no auto-submit)
- Added individual `onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}` to each input

---

## 🐛 BUG #11 — AddItemModal: 3 Fields in State but No UI to Fill Them
**File:** `frontend/src/components/AddItemModal.jsx`

### What was broken
These fields were in `formData` state and saved to DB, but had NO input fields in any step:
- `purchaseDate` — never shown anywhere
- `occasions` — never shown (so items always saved with empty occasions array, breaking AI matching)
- `styleNotes` — never shown

### Fix applied
All three fields added to Step 3 with proper inputs. Occasions uses tap-to-select chips.

---

## 🐛 BUG #12 — AddItemModal: Item Name Field Missing
**File:** `frontend/src/components/AddItemModal.jsx`

### What was broken
- `name` field existed in formData state and was saved to DB
- But there was no input for it in any step
- Items always saved with empty name, falling back to "Black Tops" etc. in the UI

### Fix applied
- Added "Item Name" text input to Step 2 (right at the top, clearly labeled as optional)

---

## 🐛 BUG #13 — FloatingAddButton: No token or onAdd Passed
**File:** `frontend/src/components/FloatingAddButton.jsx`

### What was broken
- `AddItemModal` inside FloatingAddButton had no `token` prop → uploads fail silently
- `onAdd` callback missing → new items from FAB don't appear in wardrobe grid without refresh

### Fix applied
- `FloatingAddButton` now accepts `onAdd` prop (pass it from wherever FAB is used)
- Gets `token` from `useAuth()` and passes to both `AddItemModal` and `ScanTagModal`

### Update your App.jsx or wherever FloatingAddButton is used:
```jsx
// Pass onAdd if you want new items to update the wardrobe in real time
<FloatingAddButton onAdd={handleAddItem} />
```

---

## ✅ SUMMARY — What Now Works

| Feature | Before | After |
|---|---|---|
| AI Stylist chat | ❌ 500 error every time | ✅ Works |
| Shopping suggestions | ❌ Never shown | ✅ Shown with store links |
| Packing list | ❌ Called wrong endpoint | ✅ Full packing + day-by-day plan |
| System Share button | ❌ App crash on web | ✅ Web Share API + clipboard fallback |
| Scan Tag camera | ❌ Stream cleanup broken | ✅ Clean start/stop |
| Scan Tag AI read | ❌ Auth token unreliable | ✅ Token from context |
| Scan Tag → AddItem | ❌ Only brand/size passed | ✅ All fields pre-filled |
| Wardrobe filters | ❌ Category/gender never matched | ✅ Exact DB value match |
| Add Item auto-save bug | ❌ Price input triggers save | ✅ Fixed, won't auto-save |
| Occasions field | ❌ No UI, always empty | ✅ Tap-to-select chips |
| Purchase date | ❌ No UI, never saved | ✅ Date picker added |
| Style notes | ❌ No UI, never saved | ✅ Input field added |
| Item name | ❌ No UI, always blank | ✅ Name field in step 2 |
