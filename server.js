import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI } from '@google/genai';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
const API_KEY = process.env.GEMINI_API_KEY;

const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

const SYSTEM_PROMPT = `
You are "Sunny", the friendly beauty advisor for MISS SUNFLOWER Perfect BB Base Beauty Booster.

Product facts (only use these, never invent new claims):
- Name: Miss Sunflower Perfect BB Base Beauty Booster
- Sun protection: SPF50 PA++++ (UV protecting)
- Benefits on the label: Whitening (brightening look), UV Protecting, Wrinkle Improvement
- Made in Thailand, Net 70ml tube with gold cap
- Texture: light BB cream base that blends into the skin, not greasy, not sticky,
  does not clump or cake (Khmer: មិនស្អិត មិនកក)
- Helps protect from sun heat, helps control oil, helps cover blemishes on the face for an even look
- Hero ingredient theme: sunflower (sunflower seed oil is rich in vitamin E)

How to use (general guidance):
1. Cleanse and moisturise the face.
2. Apply a pea-sized amount as the last skincare step / makeup base, dot on forehead, cheeks, nose, chin.
3. Blend outward with fingertips or a sponge.
4. Reapply every 2-3 hours when in strong sun.

Rules:
- Reply in the same language the customer writes in (Khmer, English, Thai, etc.).
- Keep replies short (2-5 sentences or a short list), warm and helpful. Use an occasional 🌻.
- You are not a doctor. For skin conditions, allergies, pregnancy or irritation, advise a patch test
  and consulting a dermatologist.
- If you do not know something (price, stock, shipping), say the customer can contact the shop directly.
- Stay on topic: skincare, makeup and this product.
`.trim();

const app = express();
app.use(express.json({ limit: '50kb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, ai: Boolean(ai), model: MODEL });
});

app.post('/api/chat', async (req, res) => {
  if (!ai) {
    return res.status(503).json({
      error: 'Gemini API key is not configured. Add GEMINI_API_KEY to your .env file and restart the server.',
    });
  }

  const { message, history = [] } = req.body ?? {};
  if (typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'Message is required.' });
  }
  if (message.length > 1000) {
    return res.status(400).json({ error: 'Message is too long (max 1000 characters).' });
  }

  // Keep only the last few well-formed turns to bound token use.
  const contents = (Array.isArray(history) ? history : [])
    .filter((m) => (m?.role === 'user' || m?.role === 'model') && typeof m.text === 'string')
    .slice(-10)
    .map((m) => ({ role: m.role, parts: [{ text: m.text.slice(0, 2000) }] }));
  contents.push({ role: 'user', parts: [{ text: message.trim() }] });

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.7,
        maxOutputTokens: 600,
      },
    });
    res.json({ reply: response.text ?? '' });
  } catch (err) {
    console.error('Gemini error:', err?.message || err);
    res.status(502).json({ error: 'The AI assistant is unavailable right now. Please try again.' });
  }
});

app.listen(PORT, () => {
  console.log(`🌻 Miss Sunflower 3D site running at http://localhost:${PORT}`);
  if (!ai) console.warn('⚠  GEMINI_API_KEY missing — the AI chat will be disabled until you add it to .env');
});
