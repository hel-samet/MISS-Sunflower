const msgs = document.getElementById('msgs');
const form = document.getElementById('chat-form');
const input = document.getElementById('chat-input');
const send = document.getElementById('send');
const chips = document.getElementById('chips');

// Conversation sent back to the server for context
const history = [];

function addMessage(text, role, extra = '') {
  const el = document.createElement('div');
  el.className = `msg ${role} ${extra}`.trim();
  el.textContent = text;
  msgs.appendChild(el);
  msgs.scrollTop = msgs.scrollHeight;
  return el;
}

// Render Gemini's **bold** markdown safely (text nodes only, no innerHTML)
function renderReply(el, text) {
  el.textContent = '';
  text.split(/(\*\*[^*]+\*\*)/g).forEach((part) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      const b = document.createElement('b');
      b.textContent = part.slice(2, -2);
      el.appendChild(b);
    } else {
      el.appendChild(document.createTextNode(part.replace(/^\* /gm, '• ')));
    }
  });
}

async function ask(question) {
  const text = question.trim();
  if (!text || send.disabled) return;

  addMessage(text, 'user');
  input.value = '';
  send.disabled = true;
  chips.style.display = 'none';
  const pending = addMessage('', 'model', 'typing');

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, history }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);

    pending.classList.remove('typing');
    renderReply(pending, data.reply || '…');
    history.push({ role: 'user', text }, { role: 'model', text: data.reply || '' });
  } catch (err) {
    pending.classList.remove('typing');
    pending.classList.add('error');
    pending.textContent = err.message;
  } finally {
    send.disabled = false;
    msgs.scrollTop = msgs.scrollHeight;
    input.focus();
  }
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  ask(input.value);
});

chips.addEventListener('click', (e) => {
  if (e.target.tagName === 'BUTTON') ask(e.target.textContent);
});
