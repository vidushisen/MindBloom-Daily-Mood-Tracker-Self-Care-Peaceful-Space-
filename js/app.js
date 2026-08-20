/**
 * MindBloom — Core Application Controller
 */

// Affirmations Database
const AFFIRMATIONS = [
  { text: "You don't have to control your thoughts. You just have to stop letting them control you.", author: "Dan Millman" },
  { text: "Peace comes from within. Do not seek it without.", author: "Buddha" },
  { text: "Almost everything will work again if you unplug it for a few minutes, including you.", author: "Anne Lamott" },
  { text: "You are allowed to be both a masterpiece and a work in progress simultaneously.", author: "Sophia Bush" },
  { text: "Give yourself permission to pause. You are doing the best you can.", author: "Mindful Reminder" },
  { text: "Breathe in peace, breathe out tension. This moment is yours.", author: "Zen Wisdom" },
  { text: "Your feelings are valid, but they are not your permanent reality.", author: "Self-Care Truth" }
];

// Smart Mood Advice
const MOOD_ADVICE = {
  5: { title: "Ride the Joy Wave ✨", text: "You're glowing today! Share a kind word with a friend or write down what sparked this energy to look back on later." },
  4: { title: "Gentle Harmony 🌿", text: "A balanced day is a true gift. Enjoy this steady state and keep nurturing yourself." },
  3: { title: "Neutral is Okay ☕", text: "Some days are meant for simply being. Stay hydrated, listen to soft music, and go easy on your goals." },
  2: { title: "Gentle Hug for Your Soul 🫂", text: "Feeling low is a signal to slow down. Try a 5-minute breathing session or a short walk in fresh air." },
  1: { title: "Pause, Breathe, You Are Safe 🌧️", text: "Take one slow breath. Try our 5-4-3-2-1 Grounding tool or guided 4-7-8 breathing to release the pressure." }
};

const THEME_NAMES = {
  midnight: { name: 'Midnight OLED', icon: '🌙' },
  lavender: { name: 'Calm Lavender', icon: '💜' },
  emerald: { name: 'Forest Sage', icon: '🍃' },
  sunset: { name: 'Warm Sunset', icon: '🌅' }
};

// State Object
const state = {
  entries: JSON.parse(localStorage.getItem('mindbloom_entries') || '[]'),
  mindfulMinutes: Number(localStorage.getItem('mindbloom_mindful_mins') || '0'),
  currentTheme: localStorage.getItem('mindbloom_theme') || 'midnight',
  selectedMood: 3,
  selectedTags: new Set(),
  composerMood: 3,
  breathingSession: {
    active: false,
    intervalId: null,
    technique: '4-7-8',
    secondsElapsed: 0
  }
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  initDateHeader();
  initTheme();
  initNavigation();
  initAffirmation();
  initCheckinForm();
  initJournalView();
  initBreathwork();
  initAmbientSounds();
  initGrounding();
  updateStreakAndBadges();
  window.moodAnalytics.render(state.entries);
});

/* ---------------- 1. Date & Theme ---------------- */
function initDateHeader() {
  const dateEl = document.getElementById('current-live-date');
  const greetingEl = document.getElementById('header-greeting');
  const now = new Date();

  if (dateEl) {
    const opts = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
    dateEl.textContent = now.toLocaleDateString('en-US', opts);
  }

  if (greetingEl) {
    const hour = now.getHours();
    let greet = 'Good morning';
    let icon = '☀️';
    if (hour >= 12 && hour < 17) { greet = 'Good afternoon'; icon = '🌤️'; }
    else if (hour >= 17 && hour < 21) { greet = 'Good evening'; icon = '🌿'; }
    else { greet = 'Peaceful night'; icon = '🌙'; }
    greetingEl.textContent = `${greet}, Beautiful Soul ${icon}`;
  }
}

function initTheme() {
  const themeBtn = document.getElementById('theme-btn');
  const themeMenu = document.getElementById('theme-menu');
  const nameDisplay = document.getElementById('theme-name-display');
  const iconDisplay = document.getElementById('theme-icon');

  function applyTheme(themeKey) {
    state.currentTheme = themeKey;
    document.body.setAttribute('data-theme', themeKey);
    localStorage.setItem('mindbloom_theme', themeKey);

    const info = THEME_NAMES[themeKey] || { name: 'Midnight OLED', icon: '🌙' };
    if (nameDisplay) nameDisplay.textContent = info.name;
    if (iconDisplay) iconDisplay.textContent = info.icon;

    if (themeMenu) {
      themeMenu.querySelectorAll('button').forEach(b => {
        b.classList.toggle('active', b.dataset.theme === themeKey);
      });
    }
  }

  // Apply initial saved theme
  applyTheme(state.currentTheme);

  if (themeBtn && themeMenu) {
    themeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      themeMenu.classList.toggle('show');
    });

    document.addEventListener('click', () => {
      themeMenu.classList.remove('show');
    });

    themeMenu.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        const theme = btn.dataset.theme;
        applyTheme(theme);
      });
    });
  }
}

/* ---------------- 2. Navigation ---------------- */
function initNavigation() {
  const navBtns = document.querySelectorAll('.nav-item');
  const tabPanes = document.querySelectorAll('.tab-pane');
  const sidebar = document.getElementById('sidebar');
  const toggleBtn = document.getElementById('sidebar-toggle');

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.dataset.tab;

      navBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      tabPanes.forEach(pane => pane.classList.remove('active'));
      const activePane = document.getElementById(`tab-${tabId}`);
      if (activePane) activePane.classList.add('active');

      if (sidebar && window.innerWidth <= 960) {
        sidebar.classList.remove('open');
      }

      if (tabId === 'analytics') {
        setTimeout(() => window.moodAnalytics.render(state.entries), 50);
      }
    });
  });

  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
  }
}

/* ---------------- 3. Affirmation ---------------- */
function initAffirmation() {
  const affText = document.getElementById('affirmation-text');
  const affAuthor = document.getElementById('affirmation-author');
  const refreshBtn = document.getElementById('btn-refresh-aff');

  function setRandomAffirmation() {
    const item = AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)];
    if (affText) affText.textContent = `"${item.text}"`;
    if (affAuthor) affAuthor.textContent = `— ${item.author}`;
  }

  setRandomAffirmation();
  if (refreshBtn) refreshBtn.addEventListener('click', setRandomAffirmation);
}

/* ---------------- 4. Daily Check-in & Storage ---------------- */
function initCheckinForm() {
  const moodCards = document.querySelectorAll('.mood-card');
  const tagPills = document.querySelectorAll('.tag-pill');
  const saveBtn = document.getElementById('btn-save-checkin');
  const journalInput = document.getElementById('journal-input');
  const gratitudeInput = document.getElementById('gratitude-input');
  const statusMsg = document.getElementById('save-status-msg');
  const adviceBox = document.getElementById('smart-advice-box');
  const adviceTitle = document.getElementById('advice-title');
  const adviceText = document.getElementById('advice-text');

  // Mood Selection
  moodCards.forEach(card => {
    card.addEventListener('click', () => {
      moodCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      state.selectedMood = Number(card.dataset.mood);
      updateAdvice();
    });
  });

  // Tag Selection
  tagPills.forEach(pill => {
    pill.addEventListener('click', () => {
      const tag = pill.dataset.tag;
      if (state.selectedTags.has(tag)) {
        state.selectedTags.delete(tag);
        pill.classList.remove('active');
      } else {
        state.selectedTags.add(tag);
        pill.classList.add('active');
      }
    });
  });

  function updateAdvice() {
    const adv = MOOD_ADVICE[state.selectedMood];
    if (adv && adviceBox) {
      adviceTitle.textContent = adv.title;
      adviceText.textContent = adv.text;
      adviceBox.style.display = 'flex';
    }
  }
  updateAdvice();

  // Save Check-in
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const todayStr = new Date().toISOString().split('T')[0];
      const entry = {
        id: 'mb_' + Date.now(),
        title: "Daily Check-in",
        date: todayStr,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        mood: state.selectedMood,
        tags: Array.from(state.selectedTags),
        note: journalInput ? journalInput.value.trim() : '',
        gratitude: gratitudeInput ? gratitudeInput.value.trim() : ''
      };

      // Replace today's checkin or prepend
      const existingIdx = state.entries.findIndex(e => e.date === todayStr && e.title === "Daily Check-in");
      if (existingIdx >= 0) {
        state.entries[existingIdx] = entry;
      } else {
        state.entries.unshift(entry);
      }

      localStorage.setItem('mindbloom_entries', JSON.stringify(state.entries));

      if (statusMsg) {
        statusMsg.textContent = '✨ Check-in saved safely!';
        setTimeout(() => { statusMsg.textContent = ''; }, 3000);
      }

      updateStreakAndBadges();
      renderJournalTimeline();
      window.moodAnalytics.render(state.entries);
    });
  }
}

/* ---------------- 5. Streak & Badges ---------------- */
function updateStreakAndBadges() {
  const badgeEl = document.getElementById('journal-count-badge');
  const streakText = document.getElementById('streak-days-text');
  const streakBar = document.getElementById('streak-bar');
  const totalEntries = state.entries.length;

  if (badgeEl) badgeEl.textContent = totalEntries;

  let streak = 0;
  if (totalEntries > 0) {
    const dates = Array.from(new Set(state.entries.map(e => e.date))).sort().reverse();
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (dates[0] === today || dates[0] === yesterday) {
      streak = 1;
      let curr = new Date(dates[0]);
      for (let i = 1; i < dates.length; i++) {
        const prev = new Date(dates[i]);
        const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          streak++;
          curr = prev;
        } else {
          break;
        }
      }
    }
  }

  if (streakText) streakText.textContent = `${streak} Day${streak === 1 ? '' : 's'}`;
  if (streakBar) {
    const pct = Math.min(100, Math.max(10, streak * 15));
    streakBar.style.width = `${pct}%`;
  }
}

/* ---------------- 6. Journal View & Direct In-Page Writing ---------------- */
function initJournalView() {
  const openComposerBtn = document.getElementById('btn-open-journal-composer');
  const closeComposerBtn = document.getElementById('btn-close-composer');
  const cancelComposerBtn = document.getElementById('btn-cancel-composer');
  const composerBox = document.getElementById('journal-composer-box');
  const saveEntryBtn = document.getElementById('btn-save-journal-entry');
  const composerMoodPills = document.querySelectorAll('#composer-mood-pills .mood-pill');
  const titleInput = document.getElementById('composer-title');
  const textInput = document.getElementById('composer-text');
  const gratitudeInput = document.getElementById('composer-gratitude');
  const filterSelect = document.getElementById('journal-filter-mood');

  // Open / Close Composer
  if (openComposerBtn && composerBox) {
    openComposerBtn.addEventListener('click', () => {
      composerBox.style.display = 'block';
      if (titleInput) titleInput.focus();
    });
  }

  const hideComposer = () => {
    if (composerBox) composerBox.style.display = 'none';
    if (titleInput) titleInput.value = '';
    if (textInput) textInput.value = '';
    if (gratitudeInput) gratitudeInput.value = '';
  };

  if (closeComposerBtn) closeComposerBtn.addEventListener('click', hideComposer);
  if (cancelComposerBtn) cancelComposerBtn.addEventListener('click', hideComposer);

  // Composer Mood Picker
  composerMoodPills.forEach(pill => {
    pill.addEventListener('click', () => {
      composerMoodPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      state.composerMood = Number(pill.dataset.mood);
    });
  });

  // Save Direct Journal Entry
  if (saveEntryBtn) {
    saveEntryBtn.addEventListener('click', () => {
      const text = textInput ? textInput.value.trim() : '';
      if (!text) {
        alert('Please write something in your journal entry before saving.');
        if (textInput) textInput.focus();
        return;
      }

      const todayStr = new Date().toISOString().split('T')[0];
      const entryTitle = titleInput && titleInput.value.trim() ? titleInput.value.trim() : "Personal Reflection";

      const newEntry = {
        id: 'mb_' + Date.now(),
        title: entryTitle,
        date: todayStr,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        mood: state.composerMood,
        tags: ['Journal', 'Reflection'],
        note: text,
        gratitude: gratitudeInput ? gratitudeInput.value.trim() : ''
      };

      state.entries.unshift(newEntry);
      localStorage.setItem('mindbloom_entries', JSON.stringify(state.entries));

      hideComposer();
      renderJournalTimeline();
      updateStreakAndBadges();
      window.moodAnalytics.render(state.entries);
    });
  }

  if (filterSelect) {
    filterSelect.addEventListener('change', () => {
      renderJournalTimeline(filterSelect.value);
    });
  }

  renderJournalTimeline();
}

function renderJournalTimeline(filterMood = 'all') {
  const listEl = document.getElementById('journal-timeline-list');
  if (!listEl) return;

  const moodEmojis = { 5: '✨', 4: '😊', 3: '😐', 2: '😔', 1: '🌧️' };
  const moodNames = { 5: 'Radiant', 4: 'Good', 3: 'Okay', 2: 'Low', 1: 'Overwhelmed' };

  let filtered = state.entries;
  if (filterMood !== 'all') {
    filtered = filtered.filter(e => String(e.mood) === String(filterMood));
  }

  if (filtered.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📖</div>
        <h3>Your Journal is Clear & Peaceful</h3>
        <p>Click "<strong>✍️ Write New Entry</strong>" above to write your thoughts and reflections.</p>
      </div>
    `;
    return;
  }

  listEl.innerHTML = filtered.map(entry => {
    const formattedDate = new Date(entry.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const tagBadges = (entry.tags || []).map(t => `<span class="journal-tag-badge">#${t}</span>`).join('');

    return `
      <div class="journal-card" data-id="${entry.id}">
        <button class="btn-delete-entry" onclick="deleteJournalEntry('${entry.id}')" title="Delete reflection">&times;</button>
        <div class="journal-mood-side">
          <span class="journal-emoji">${moodEmojis[entry.mood] || '😐'}</span>
          <span class="journal-mood-text">${moodNames[entry.mood] || 'Okay'}</span>
        </div>
        <div class="journal-main">
          <div class="journal-header">
            <span class="journal-date">${formattedDate} at ${entry.timestamp || ''}</span>
          </div>
          ${entry.title ? `<h4 class="journal-title">${escapeHtml(entry.title)}</h4>` : ''}
          ${tagBadges ? `<div class="journal-tags">${tagBadges}</div>` : ''}
          ${entry.note ? `<p class="journal-note">${escapeHtml(entry.note)}</p>` : ''}
          ${entry.gratitude ? `<div class="journal-gratitude"><strong>Grateful for:</strong> ${escapeHtml(entry.gratitude)}</div>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

window.deleteJournalEntry = function(id) {
  if (confirm('Are you sure you want to remove this journal reflection?')) {
    state.entries = state.entries.filter(e => e.id !== id);
    localStorage.setItem('mindbloom_entries', JSON.stringify(state.entries));
    renderJournalTimeline();
    updateStreakAndBadges();
    window.moodAnalytics.render(state.entries);
  }
};

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* ---------------- 7. Guided Breathwork ---------------- */
function initBreathwork() {
  const startBtn = document.getElementById('btn-start-breathe');
  const stopBtn = document.getElementById('btn-stop-breathe');
  const circle = document.getElementById('breath-circle');
  const glow = document.getElementById('breath-glow');
  const instruction = document.getElementById('breath-instruction');
  const counter = document.getElementById('breath-count');
  const timerText = document.getElementById('breath-session-timer');
  const techniqueBtns = document.querySelectorAll('.technique-btn');
  const techniqueInfo = document.getElementById('technique-info');

  const techniques = {
    '4-7-8': {
      name: '4-7-8 Relax',
      cycle: [
        { phase: 'Inhale', duration: 4, scale: 1.35, sound: 528 },
        { phase: 'Hold', duration: 7, scale: 1.35, sound: 639 },
        { phase: 'Exhale', duration: 8, scale: 0.85, sound: 432 }
      ],
      info: 'Inhale through nose for <strong>4s</strong>, hold breath for <strong>7s</strong>, exhale slowly for <strong>8s</strong>.'
    },
    'box': {
      name: 'Box Breathing (4-4-4-4)',
      cycle: [
        { phase: 'Inhale', duration: 4, scale: 1.3, sound: 528 },
        { phase: 'Hold', duration: 4, scale: 1.3, sound: 639 },
        { phase: 'Exhale', duration: 4, scale: 0.9, sound: 432 },
        { phase: 'Hold', duration: 4, scale: 0.9, sound: 528 }
      ],
      info: 'Equal <strong>4-second</strong> intervals for Inhale, Hold, Exhale, and Rest. Enhances tactical calm & focus.'
    },
    'deep': {
      name: 'Deep Calm (5-5)',
      cycle: [
        { phase: 'Inhale Deeply', duration: 5, scale: 1.4, sound: 528 },
        { phase: 'Exhale Slowly', duration: 5, scale: 0.85, sound: 432 }
      ],
      info: 'Even <strong>5-second</strong> deep belly breathing to balance autonomic heart rate variability.'
    }
  };

  let currentPhaseIndex = 0;
  let phaseSecondsLeft = 0;
  let totalSessionSeconds = 0;

  techniqueBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      techniqueBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.breathingSession.technique = btn.dataset.technique;
      if (techniqueInfo) {
        techniqueInfo.innerHTML = `<h4>How it Works:</h4><p>${techniques[state.breathingSession.technique].info}</p>`;
      }
      stopBreathing();
    });
  });

  function startBreathing() {
    state.breathingSession.active = true;
    startBtn.style.display = 'none';
    stopBtn.style.display = 'inline-flex';
    totalSessionSeconds = 0;
    currentPhaseIndex = 0;

    const currentCycle = techniques[state.breathingSession.technique].cycle;
    phaseSecondsLeft = currentCycle[0].duration;

    runPhase(currentCycle[0]);

    state.breathingSession.intervalId = setInterval(() => {
      totalSessionSeconds++;
      phaseSecondsLeft--;

      const mins = String(Math.floor(totalSessionSeconds / 60)).padStart(2, '0');
      const secs = String(totalSessionSeconds % 60).padStart(2, '0');
      if (timerText) timerText.textContent = `Session: ${mins}:${secs}`;

      if (phaseSecondsLeft <= 0) {
        currentPhaseIndex = (currentPhaseIndex + 1) % currentCycle.length;
        const nextPhase = currentCycle[currentPhaseIndex];
        phaseSecondsLeft = nextPhase.duration;
        runPhase(nextPhase);
      } else {
        if (counter) counter.textContent = phaseSecondsLeft;
      }
    }, 1000);
  }

  function runPhase(phaseObj) {
    if (instruction) instruction.textContent = phaseObj.phase;
    if (counter) counter.textContent = phaseObj.duration;
    if (circle) {
      circle.style.transform = `scale(${phaseObj.scale})`;
      circle.style.transitionDuration = `${phaseObj.duration}s`;
    }
    if (glow) {
      glow.style.transform = `scale(${phaseObj.scale * 1.2})`;
      glow.style.opacity = phaseObj.phase.includes('Inhale') ? '0.4' : '0.15';
      glow.style.transitionDuration = `${phaseObj.duration}s`;
    }
    if (window.soundEngine) {
      window.soundEngine.playBell(phaseObj.sound || 528);
    }
  }

  function stopBreathing() {
    state.breathingSession.active = false;
    if (state.breathingSession.intervalId) {
      clearInterval(state.breathingSession.intervalId);
    }
    if (startBtn) startBtn.style.display = 'inline-flex';
    if (stopBtn) stopBtn.style.display = 'none';
    if (instruction) instruction.textContent = 'Click Start';
    if (counter) counter.textContent = '';
    if (circle) circle.style.transform = 'scale(1)';
    if (glow) glow.style.transform = 'scale(1)';

    if (totalSessionSeconds >= 30) {
      state.mindfulMinutes += Math.round(totalSessionSeconds / 60);
      localStorage.setItem('mindbloom_mindful_mins', state.mindfulMinutes);
      const mindfulEl = document.getElementById('metric-mindful-mins');
      if (mindfulEl) mindfulEl.textContent = `${state.mindfulMinutes} min`;
    }
  }

  if (startBtn) startBtn.addEventListener('click', startBreathing);
  if (stopBtn) stopBtn.addEventListener('click', stopBreathing);
}

/* ---------------- 8. Ambient Soundscapes ---------------- */
function initAmbientSounds() {
  const soundCards = document.querySelectorAll('.sound-card');
  const stopAllBtn = document.getElementById('btn-stop-all-sounds');

  soundCards.forEach(card => {
    const soundKey = card.dataset.sound;
    const toggleBtn = card.querySelector('.sound-toggle-btn');
    const volumeSlider = card.querySelector('.volume-slider');

    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const isPlaying = window.soundEngine.toggleSound(soundKey);
        if (isPlaying) {
          card.classList.add('playing');
          toggleBtn.textContent = '⏸ Pause';
        } else {
          card.classList.remove('playing');
          toggleBtn.textContent = '▶ Play';
        }
      });
    }

    if (volumeSlider) {
      volumeSlider.addEventListener('input', (e) => {
        const val = Number(e.target.value) / 100;
        window.soundEngine.setVolume(soundKey, val);
      });
    }
  });

  if (stopAllBtn) {
    stopAllBtn.addEventListener('click', () => {
      window.soundEngine.stopAll();
      soundCards.forEach(card => {
        card.classList.remove('playing');
        const btn = card.querySelector('.sound-toggle-btn');
        if (btn) btn.textContent = '▶ Play';
      });
    });
  }
}

/* ---------------- 9. 5-4-3-2-1 Grounding ---------------- */
function initGrounding() {
  const steps = document.querySelectorAll('.grounding-stepper .step-card');
  const doneBox = document.getElementById('grounding-done-box');
  const restartBtn = document.getElementById('btn-restart-grounding');

  steps.forEach((step, idx) => {
    const input = step.querySelector('.grounding-input');
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && input.value.trim() !== '') {
          if (idx + 1 < steps.length) {
            steps[idx + 1].classList.add('active');
            const nextInput = steps[idx + 1].querySelector('.grounding-input');
            if (nextInput) nextInput.focus();
          } else {
            if (doneBox) doneBox.style.display = 'block';
          }
        }
      });
    }
  });

  if (restartBtn) {
    restartBtn.addEventListener('click', () => {
      steps.forEach((s, i) => {
        if (i === 0) s.classList.add('active');
        else s.classList.remove('active');
        const inp = s.querySelector('.grounding-input');
        if (inp) inp.value = '';
      });
      if (doneBox) doneBox.style.display = 'none';
    });
  }
}
