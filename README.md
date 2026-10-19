# Miss Sunflower — 3D Scroll Website 🌻

A product landing page for **Miss Sunflower Perfect BB Base Beauty Booster (SPF50 PA++++)**:

- **3D product**: a procedurally modelled squeeze tube (Three.js) with a label painted to match the packaging, gold metal cap, glowing halo, gold dust and sunflower bubbles.
- **Scroll storytelling** (GSAP ScrollTrigger): the tube spins and moves between sections — Benefits → SPF50 shield → cream swoosh texture → How to use → AI advisor.
- **AI Beauty Advisor "Sunny"**: chat powered by **Google Gemini** via a Node.js/Express backend. Answers in Khmer or English, grounded in the product's label claims.

## Setup

```bash
npm install
cp .env.example .env      # then put your key in GEMINI_API_KEY
npm start                  # http://localhost:3000
```

Get a free Gemini API key at https://aistudio.google.com/apikey.
The site works without a key; only the chat will show a "not configured" message.

## Structure

```
server.js            Express server + POST /api/chat (Gemini)
public/index.html    Page sections
public/style.css     Black & gold styling, Khmer fonts
public/js/scene.js   Three.js tube model + scroll animation
public/js/chat.js    Chat widget
public/images/       Product poster
```

To change what the AI says about the product, edit `SYSTEM_PROMPT` in `server.js`.
