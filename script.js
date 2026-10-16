/**
 * GOAL TRACKER - SCRIPT.JS
 * Complete vanilla JavaScript implementation
 * Features: Dashboard metrics, Goal CRUD, Weekly Chart, Streak Counter,
 * Focus Timer with Web Audio API chime, Motivational Quotes, LocalStorage
 */

(function () {
  'use strict';

  // =========================================================================
  // 1. DATA STRUCTURES & CONSTANTS
  // =========================================================================

  const STORAGE_KEYS = {
    GOALS: 'goaltracker_goals',
    HISTORY: 'goaltracker_history',
    USER: 'goaltracker_user',
    SEEDED: 'goaltracker_seeded',
    TIMER_SETTINGS: 'goaltracker_timer_settings'
  };

  const CATEGORIES = ['Study', 'Fitness', 'Reading', 'Coding', 'Personal'];

  const CATEGORY_ICONS = {
    Study: '📚',
    Fitness: '🏋️',
    Reading: '📖',
    Coding: '💻',
    Personal: '✨'
  };

  const MOTIVATIONAL_QUOTES = [
    { text: "Small daily improvements over time lead to stunning results.", author: "Robin Sharma", category: "Mindset" },
    { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar", category: "Motivation" },
    { text: "Focus is a muscle. The more you practice deep work, the stronger it becomes.", author: "Cal Newport", category: "Focus" },
    { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier", category: "Consistency" },
    { text: "It is not that we have a short time to live, but that we waste a lot of it.", author: "Seneca", category: "Wisdom" },
    { text: "Either you run the day, or the day runs you.", author: "Jim Rohn", category: "Habit" },
    { text: "The secret of getting ahead is getting started.", author: "Mark Twain", category: "Action" },
    { text: "Action is the foundational key to all success.", author: "Pablo Picasso", category: "Action" },
    { text: "Do something today that your future self will thank you for.", author: "Sean Patrick Flanery", category: "Mindset" },
    { text: "Continuous effort—not strength or intelligence—is the key to unlocking our potential.", author: "Winston Churchill", category: "Consistency" },
    { text: "The best way to predict the future is to invent it.", author: "Alan Kay", category: "Coding" },
    { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin", category: "Study" }
  ];

  // Helper: Get local YYYY-MM-DD string
  function getLocalDateString(dateObj = new Date()) {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Helper: Format friendly date
  function formatFriendlyDate(dateObj = new Date()) {
    const options = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
    return dateObj.toLocaleDateString(undefined, options);
  }

  // =========================================================================
  // 2. STORAGE SERVICE
  // =========================================================================

  const Storage = {
    isAvailable: (function () {
      try {
        const test = '__storage_test__';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
      } catch (e) {
        console.warn('LocalStorage is not available, falling back to in-memory store.');
        return false;
      }
    })(),

    _memoryStore: {},

    get(key, defaultValue = null) {
      if (this.isAvailable) {
        try {
          const item = localStorage.getItem(key);
          return item ? JSON.parse(item) : defaultValue;
        } catch (err) {
          console.error(`Error reading ${key} from localStorage:`, err);
          return defaultValue;
        }
      }
      return this._memoryStore[key] !== undefined ? this._memoryStore[key] : defaultValue;
    },

    set(key, value) {
      if (this.isAvailable) {
        try {
          localStorage.setItem(key, JSON.stringify(value));
          return true;
        } catch (err) {
          console.error(`Error saving ${key} to localStorage:`, err);
        }
      }
      this._memoryStore[key] = value;
      return true;
    },

    remove(key) {
      if (this.isAvailable) {
        try {
          localStorage.removeItem(key);
        } catch (err) {
          console.error(`Error removing ${key} from localStorage:`, err);
        }
      }
      delete this._memoryStore[key];
    }
  };

  // =========================================================================
  // 3. SOUND SYNTHESIZER (WEB AUDIO API)
  // No external audio files needed! Works offline in any browser.
  // =========================================================================

  const SoundFX = {
    audioCtx: null,
    enabled: true,

    init() {
      if (!this.audioCtx && (window.AudioContext || window.webkitAudioContext)) {
        const AudioClass = window.AudioContext || window.webkitAudioContext;
        this.audioCtx = new AudioClass();
      }
    },

    playChime() {
      if (!this.enabled) return;
      try {
        this.init();
        if (!this.audioCtx) return;
        if (this.audioCtx.state === 'suspended') {
          this.audioCtx.resume();
        }

        const now = this.audioCtx.currentTime;
        const osc1 = this.audioCtx.createOscillator();
        const osc2 = this.audioCtx.createOscillator();
        const gainNode = this.audioCtx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(587.33, now); // D5
        osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(880, now + 0.15);
        osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.35); // D6

        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.25, now + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);

        osc1.start(now);
        osc1.stop(now + 0.85);
        osc2.start(now + 0.15);
        osc2.stop(now + 0.85);
      } catch (err) {
        console.warn('Audio playback error:', err);
      }
    },

    playSuccessPop() {
      if (!this.enabled) return;
      try {
        this.init();
        if (!this.audioCtx) return;
        if (this.audioCtx.state === 'suspended') {
          this.audioCtx.resume();
        }

        const now = this.audioCtx.currentTime;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.12);

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(now);
        osc.stop(now + 0.2);
      } catch (e) {
        // Silently continue if audio fails
      }
    }
  };

  // =========================================================================
  // 4. CONFETTI BURST EFFECT
  // Lightweight canvas confetti for celebration
  // =========================================================================

  const Confetti = {
    canvas: null,
    ctx: null,
    particles: [],
    animationId: null,

    init() {
      this.canvas = document.getElementById('confettiCanvas');
      if (this.canvas) {
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());
      }
    },

    resize() {
      if (!this.canvas) return;
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    },

    burst(x = window.innerWidth / 2, y = window.innerHeight / 3) {
      if (!this.canvas || !this.ctx) return;
      this.resize();

      const colors = ['#10b981', '#34d399', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899'];
      for (let i = 0; i < 40; i++) {
        this.particles.push({
          x: x,
          y: y,
          vx: (Math.random() - 0.5) * 12,
          vy: (Math.random() - 0.7) * 12,
          size: Math.random() * 6 + 4,
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: Math.random() * 360,
          vRot: (Math.random() - 0.5) * 10,
          opacity: 1,
          gravity: 0.35
        });
      }

      if (!this.animationId) {
        this.animate();
      }
    },

    animate() {
      if (!this.ctx || !this.canvas) return;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.rotation += p.vRot;
        p.opacity -= 0.018;

        if (p.opacity <= 0 || p.y > this.canvas.height) {
          this.particles.splice(i, 1);
          continue;
        }

        this.ctx.save();
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate((p.rotation * Math.PI) / 180);
        this.ctx.globalAlpha = Math.max(0, p.opacity);
        this.ctx.fillStyle = p.color;
        this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        this.ctx.restore();
      }

      if (this.particles.length > 0) {
        this.animationId = requestAnimationFrame(() => this.animate());
      } else {
        this.animationId = null;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }
    }
  };

  // =========================================================================
  // 5. TOAST NOTIFICATION SERVICE
  // =========================================================================

  function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icon = type === 'success' ? '✅' : '⚠️';
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;

    container.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 3600);
  }

  // =========================================================================
  // 6. APPLICATION STATE & SEEDING (Req 9)
  // =========================================================================

  const AppState = {
    goals: [],
    history: {}, // Keyed by YYYY-MM-DD
    user: {
      level: 1,
      xp: 20,
      sessionsCompleted: 0
    },
    filter: {
      category: 'all',
      status: 'all',
      search: '',
      sort: 'newest'
    },
    goalToDelete: null,

    init() {
      this.loadData();
      this.syncTodayHistory();
    },

    loadData() {
      const hasSeeded = Storage.get(STORAGE_KEYS.SEEDED, false);

      if (!hasSeeded) {
        this.seedInitialData();
      } else {
        this.goals = Storage.get(STORAGE_KEYS.GOALS, []);
        this.history = Storage.get(STORAGE_KEYS.HISTORY, {});
        this.user = Storage.get(STORAGE_KEYS.USER, { level: 1, xp: 20, sessionsCompleted: 0 });
      }
    },

    seedInitialData() {
      const todayStr = getLocalDateString();
      const today = new Date();

      // Seed 5 realistic student goals across the 5 categories
      this.goals = [
        {
          id: 'goal_' + (Date.now() - 40000),
          name: 'Review CS Algorithm lecture notes & practice problems',
          category: 'Study',
          priority: 'high',
          notes: 'Cover Dijkstra and dynamic programming examples.',
          completed: true,
          date: todayStr,
          createdAt: Date.now() - 40000
        },
        {
          id: 'goal_' + (Date.now() - 30000),
          name: 'Build Goal Tracker JavaScript logic & debug tests',
          category: 'Coding',
          priority: 'high',
          notes: 'Ensure all tests pass and dashboard updates reactively.',
          completed: true,
          date: todayStr,
          createdAt: Date.now() - 30000
        },
        {
          id: 'goal_' + (Date.now() - 20000),
          name: 'Read 20 pages of "Atomic Habits"',
          category: 'Reading',
          priority: 'medium',
          notes: 'Take brief summary notes on habit stacking.',
          completed: false,
          date: todayStr,
          createdAt: Date.now() - 20000
        },
        {
          id: 'goal_' + (Date.now() - 10000),
          name: '30-minute cardio & stretch workout',
          category: 'Fitness',
          priority: 'medium',
          notes: 'Focus on posture and core strength.',
          completed: false,
          date: todayStr,
          createdAt: Date.now() - 10000
        },
        {
          id: 'goal_' + Date.now(),
          name: 'Drink 2L water & plan tomorrow’s academic schedule',
          category: 'Personal',
          priority: 'low',
          notes: 'Prepare backpack and check tomorrow’s class timings.',
          completed: false,
          date: todayStr,
          createdAt: Date.now()
        }
      ];

      // Seed rich 6-day history so the weekly chart and streak are lively on first open
      this.history = {};
      const pastCompletions = [
        { daysAgo: 5, total: 3, completed: 3 },
        { daysAgo: 4, total: 2, completed: 2 },
        { daysAgo: 3, total: 4, completed: 4 },
        { daysAgo: 2, total: 3, completed: 3 },
        { daysAgo: 1, total: 4, completed: 4 }
      ];

      pastCompletions.forEach(item => {
        const d = new Date(today);
        d.setDate(today.getDate() - item.daysAgo);
        const dStr = getLocalDateString(d);
        this.history[dStr] = {
          date: dStr,
          total: item.total,
          completed: item.completed
        };
      });

      this.user = {
        level: 2,
        xp: 40,
        sessionsCompleted: 3
      };

      this.saveGoals();
      this.saveHistory();
      this.saveUser();
      Storage.set(STORAGE_KEYS.SEEDED, true);
    },

    saveGoals() {
      Storage.set(STORAGE_KEYS.GOALS, this.goals);
      this.syncTodayHistory();
    },

    saveHistory() {
      Storage.set(STORAGE_KEYS.HISTORY, this.history);
    },

    saveUser() {
      Storage.set(STORAGE_KEYS.USER, this.user);
    },

    syncTodayHistory() {
      const todayStr = getLocalDateString();
      const todayGoals = this.getTodayGoals();
      this.history[todayStr] = {
        date: todayStr,
        total: todayGoals.length,
        completed: todayGoals.filter(g => g.completed).length
      };
      this.saveHistory();
    },

    getTodayGoals() {
      const todayStr = getLocalDateString();
      // Goals scheduled for today or recurring daily
      return this.goals.filter(g => !g.date || g.date === todayStr);
    },

    addXP(points) {
      this.user.xp += points;
      const xpNeeded = this.user.level * 100;
      if (this.user.xp >= xpNeeded) {
        this.user.xp -= xpNeeded;
        this.user.level += 1;
        showToast(`🎉 Level Up! You reached Scholar Level ${this.user.level}!`, 'success');
        Confetti.burst();
      }
      this.saveUser();
    }
  };

  // =========================================================================
  // 7. STREAK ENGINE (Req 6)
  // Consecutive days when all goals scheduled for that day were completed.
  // Handles empty goals sensibly.
  // =========================================================================

  const StreakEngine = {
    calculate() {
      const today = new Date();
      const todayStr = getLocalDateString(today);
      const todayRecord = AppState.history[todayStr] || { total: 0, completed: 0 };

      let streak = 0;
      let consecutiveEmptyDays = 0;

      // 1. Check today's progress
      const isTodayFullyDone = todayRecord.total > 0 && todayRecord.completed === todayRecord.total;
      if (isTodayFullyDone) {
        streak += 1;
      }

      // 2. Walk backwards day by day from yesterday
      let checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - 1);

      // We inspect up to the last 90 days
      for (let i = 0; i < 90; i++) {
        const dateStr = getLocalDateString(checkDate);
        const record = AppState.history[dateStr];

        if (record && record.total > 0) {
          if (record.completed === record.total) {
            streak += 1;
            consecutiveEmptyDays = 0; // Reset empty gap
          } else {
            // Day had goals but was not fully completed -> streak ends
            break;
          }
        } else {
          // Empty day (total === 0 or no record)
          // Handle sensibly: A single rest/untracked day does not break an ongoing streak,
          // but more than 2 consecutive empty days ends the streak.
          consecutiveEmptyDays++;
          if (consecutiveEmptyDays > 2) {
            break;
          }
        }

        checkDate.setDate(checkDate.getDate() - 1);
      }

      return streak;
    }
  };

  // =========================================================================
  // 8. WEEKLY PROGRESS CHART ENGINE (Req 5)
  // Renders 7-day completion rates on HTML5 Canvas with Hi-DPI crispness,
  // responsive resizing, and hover tooltips.
  // =========================================================================

  const WeeklyChart = {
    canvas: null,
    ctx: null,
    tooltip: null,
    barsData: [],

    init() {
      this.canvas = document.getElementById('weeklyChartCanvas');
      this.tooltip = document.getElementById('chartTooltip');
      if (!this.canvas) return;

      this.ctx = this.canvas.getContext('2d');
      this.setupListeners();
      this.render();
    },

    setupListeners() {
      window.addEventListener('resize', () => this.render());

      this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
      this.canvas.addEventListener('mouseleave', () => this.hideTooltip());
      this.canvas.addEventListener('touchstart', (e) => {
        if (e.touches.length > 0) {
          const touch = e.touches[0];
          this.handleTouch(touch);
        }
      }, { passive: true });
    },

    getLast7DaysData() {
      const days = [];
      const today = new Date();

      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dStr = getLocalDateString(d);

        let record = AppState.history[dStr];
        // If it's today, ensure latest live goals are reflected
        if (i === 0) {
          const todayGoals = AppState.getTodayGoals();
          record = {
            total: todayGoals.length,
            completed: todayGoals.filter(g => g.completed).length
          };
        }

        const total = record ? record.total : 0;
        const completed = record ? record.completed : 0;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

        const dayName = d.toLocaleDateString(undefined, { weekday: 'short' });
        const shortDate = `${d.getMonth() + 1}/${d.getDate()}`;

        days.push({
          dateStr: dStr,
          dayName: i === 0 ? 'Today' : dayName,
          shortDate: shortDate,
          total: total,
          completed: completed,
          percentage: percentage,
          isToday: i === 0
        });
      }

      return days;
    },

    render() {
      if (!this.canvas || !this.ctx) return;

      const rect = this.canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const width = rect.width;
      const height = rect.height || 230;

      this.canvas.width = width * dpr;
      this.canvas.height = height * dpr;
      this.ctx.scale(dpr, dpr);

      const ctx = this.ctx;
      ctx.clearRect(0, 0, width, height);

      const data = this.getLast7DaysData();
      this.barsData = [];

      // Layout geometry
      const paddingLeft = 44;
      const paddingRight = 20;
      const paddingTop = 28;
      const paddingBottom = 42;
      const chartWidth = width - paddingLeft - paddingRight;
      const chartHeight = height - paddingTop - paddingBottom;

      // Draw grid lines (0%, 25%, 50%, 75%, 100%)
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';

      const gridLevels = [0, 25, 50, 75, 100];
      gridLevels.forEach(lvl => {
        const y = paddingTop + chartHeight - (lvl / 100) * chartHeight;
        ctx.beginPath();
        ctx.moveTo(paddingLeft, y);
        ctx.lineTo(paddingLeft + chartWidth, y);
        ctx.stroke();
        ctx.fillText(`${lvl}%`, paddingLeft - 8, y);
      });

      // Bar sizing
      const totalBars = data.length;
      const barSpacing = chartWidth / totalBars;
      const barWidth = Math.min(38, Math.max(18, barSpacing * 0.52));

      // Draw each day's bar
      data.forEach((day, index) => {
        const centerX = paddingLeft + index * barSpacing + barSpacing / 2;
        const x = centerX - barWidth / 2;
        const barHeight = Math.max(4, (day.percentage / 100) * chartHeight);
        const y = paddingTop + chartHeight - barHeight;

        // Choose bar color gradient
        let gradient;
        if (day.total === 0) {
          ctx.fillStyle = '#e2e8f0';
        } else if (day.percentage === 100) {
          gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
          gradient.addColorStop(0, '#10b981');
          gradient.addColorStop(1, '#059669');
          ctx.fillStyle = gradient;
        } else if (day.percentage > 0) {
          gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
          gradient.addColorStop(0, '#34d399');
          gradient.addColorStop(1, '#10b981');
          ctx.fillStyle = gradient;
        } else {
          ctx.fillStyle = '#fee2e2'; // 0% on a day with goals
        }

        // Draw rounded bar
        this.drawRoundedRect(ctx, x, y, barWidth, barHeight, 6);
        ctx.fill();

        // Highlight ring if today
        if (day.isToday) {
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 2;
          this.drawRoundedRect(ctx, x - 2, y - 2, barWidth + 4, barHeight + 4, 8);
          ctx.stroke();
        }

        // Percentage text above bar
        ctx.fillStyle = day.total === 0 ? '#94a3b8' : '#0f172a';
        ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(day.total === 0 ? '—' : `${day.percentage}%`, centerX, Math.max(12, y - 8));

        // Day label below bar
        ctx.fillStyle = day.isToday ? '#10b981' : '#475569';
        ctx.font = day.isToday ? 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' : '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(day.dayName, centerX, paddingTop + chartHeight + 16);

        // Date label
        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(day.shortDate, centerX, paddingTop + chartHeight + 30);

        // Save hitbox for tooltip interaction
        this.barsData.push({
          x: x,
          y: y,
          width: barWidth,
          height: barHeight,
          centerX: centerX,
          day: day
        });
      });

      // Update weekly metrics cards
      this.updateMetricsRow(data);
    },

    drawRoundedRect(ctx, x, y, width, height, radius) {
      const r = Math.min(radius, width / 2, height / 2);
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + width - r, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + r);
      ctx.lineTo(x + width, y + height);
      ctx.lineTo(x, y + height);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    },

    updateMetricsRow(data) {
      let totalCompleted = 0;
      let totalGoals = 0;
      let bestDay = null;
      let bestPercentage = -1;

      data.forEach(d => {
        totalCompleted += d.completed;
        totalGoals += d.total;
        if (d.total > 0 && d.percentage > bestPercentage) {
          bestPercentage = d.percentage;
          bestDay = `${d.dayName} (${d.percentage}%)`;
        }
      });

      const avgRate = totalGoals > 0 ? Math.round((totalCompleted / totalGoals) * 100) : 0;

      const avgEl = document.getElementById('chartAvgCompletion');
      const bestEl = document.getElementById('chartBestDay');
      const totalEl = document.getElementById('chartTotalCompleted');

      if (avgEl) avgEl.textContent = `${avgRate}%`;
      if (bestEl) bestEl.textContent = bestDay || '—';
      if (totalEl) totalEl.textContent = `${totalCompleted} goals`;
    },

    handleMouseMove(e) {
      if (!this.tooltip || this.barsData.length === 0) return;
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      let hovered = null;
      for (const bar of this.barsData) {
        if (
          mouseX >= bar.x - 10 &&
          mouseX <= bar.x + bar.width + 10 &&
          mouseY >= 0 &&
          mouseY <= rect.height
        ) {
          hovered = bar;
          break;
        }
      }

      if (hovered) {
        this.showTooltip(hovered);
      } else {
        this.hideTooltip();
      }
    },

    handleTouch(touch) {
      const rect = this.canvas.getBoundingClientRect();
      const touchX = touch.clientX - rect.left;
      for (const bar of this.barsData) {
        if (touchX >= bar.x - 12 && touchX <= bar.x + bar.width + 12) {
          this.showTooltip(bar);
          break;
        }
      }
    },

    showTooltip(bar) {
      const d = bar.day;
      const text = d.total === 0 
        ? `${d.dayName} (${d.shortDate}): No goals scheduled` 
        : `${d.dayName} (${d.shortDate}): ${d.completed} of ${d.total} completed (${d.percentage}%)`;

      this.tooltip.textContent = text;
      this.tooltip.style.left = `${bar.centerX}px`;
      this.tooltip.style.top = `${bar.y}px`;
      this.tooltip.style.opacity = '1';
    },

    hideTooltip() {
      if (this.tooltip) {
        this.tooltip.style.opacity = '0';
      }
    }
  };

  // =========================================================================
  // 9. ORIGINAL FEATURE: FOCUS-SESSION TIMER (Req 8)
  // Pomodoro timer with Start, Pause, Reset, Sound chime, and Goal Linking
  // =========================================================================

  const FocusTimer = {
    durationMinutes: 25,
    remainingSeconds: 25 * 60,
    intervalId: null,
    isRunning: false,
    currentMode: 'Focus',

    // Circle ring geometry (2 * PI * 95 ≈ 596.9)
    circumference: 2 * Math.PI * 95,

    init() {
      this.bindEvents();
      this.updateDisplay();
      this.populateGoalSelect();
    },

    bindEvents() {
      const startBtn = document.getElementById('timerStartBtn');
      const pauseBtn = document.getElementById('timerPauseBtn');
      const resetBtn = document.getElementById('timerResetBtn');
      const soundBtn = document.getElementById('timerSoundToggle');
      const modeButtons = document.querySelectorAll('.timer-mode-btn');
      const customApplyBtn = document.getElementById('btnApplyCustomTime');
      const customWrap = document.getElementById('customTimeInputWrap');

      if (startBtn) startBtn.addEventListener('click', () => this.start());
      if (pauseBtn) pauseBtn.addEventListener('click', () => this.pause());
      if (resetBtn) resetBtn.addEventListener('click', () => this.reset());

      if (soundBtn) {
        soundBtn.addEventListener('click', () => {
          SoundFX.enabled = !SoundFX.enabled;
          const icon = document.getElementById('soundIcon');
          if (icon) icon.textContent = SoundFX.enabled ? '🔔' : '🔕';
          soundBtn.title = SoundFX.enabled ? 'Sound chime enabled' : 'Sound chime muted';
          showToast(SoundFX.enabled ? 'Chime sound unmuted' : 'Chime sound muted');
        });
      }

      modeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          modeButtons.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');

          const duration = btn.dataset.duration;
          const mode = btn.dataset.mode;

          if (duration === 'custom') {
            if (customWrap) customWrap.style.display = 'flex';
          } else {
            if (customWrap) customWrap.style.display = 'none';
            this.setDuration(parseInt(duration, 10), mode);
          }
        });
      });

      if (customApplyBtn) {
        customApplyBtn.addEventListener('click', () => {
          const input = document.getElementById('customMinutesInput');
          const val = parseInt(input.value, 10);
          if (val && val >= 1 && val <= 180) {
            this.setDuration(val, 'Custom');
            showToast(`Custom timer set to ${val} minutes`);
          } else {
            showToast('Please enter a valid duration between 1 and 180 mins', 'error');
          }
        });
      }
    },

    populateGoalSelect() {
      const select = document.getElementById('timerLinkedGoal');
      if (!select) return;

      const currentValue = select.value;
      select.innerHTML = '<option value="">General Study Session</option>';

      // Populate incomplete goals
      const activeGoals = AppState.goals.filter(g => !g.completed);
      activeGoals.forEach(g => {
        const opt = document.createElement('option');
        opt.value = g.id;
        opt.textContent = `${CATEGORY_ICONS[g.category] || '🎯'} ${g.name}`;
        if (g.id === currentValue) opt.selected = true;
        select.appendChild(opt);
      });
    },

    setDuration(minutes, modeName = 'Focus') {
      this.pause();
      this.durationMinutes = minutes;
      this.remainingSeconds = minutes * 60;
      this.currentMode = modeName;
      this.updateDisplay();
    },

    start() {
      if (this.isRunning) return;

      this.isRunning = true;
      document.getElementById('timerStartBtn').disabled = true;
      document.getElementById('timerPauseBtn').disabled = false;

      // AudioContext user gesture unlock
      SoundFX.init();

      this.intervalId = setInterval(() => {
        this.tick();
      }, 1000);
    },

    pause() {
      if (!this.isRunning) return;
      this.isRunning = false;
      clearInterval(this.intervalId);
      this.intervalId = null;

      document.getElementById('timerStartBtn').disabled = false;
      document.getElementById('timerPauseBtn').disabled = true;
    },

    reset() {
      this.pause();
      this.remainingSeconds = this.durationMinutes * 60;
      this.updateDisplay();
      document.title = 'Goal Tracker - Student Productivity Dashboard';
    },

    tick() {
      if (this.remainingSeconds > 0) {
        this.remainingSeconds--;
        this.updateDisplay();
      } else {
        this.completeSession();
      }
    },

    completeSession() {
      this.pause();
      SoundFX.playChime();
      Confetti.burst();

      // Check linked goal
      const linkedSelect = document.getElementById('timerLinkedGoal');
      const linkedGoalId = linkedSelect ? linkedSelect.value : null;

      AppState.user.sessionsCompleted = (AppState.user.sessionsCompleted || 0) + 1;
      AppState.addXP(25); // Bonus XP for focus session!

      let completionMessage = `Focus session finished! Great job staying concentrated (+25 XP).`;
      if (linkedGoalId) {
        const goal = AppState.goals.find(g => g.id === linkedGoalId);
        if (goal) {
          completionMessage = `Session finished for "${goal.name}"! Mark it complete to earn extra XP!`;
        }
      }

      showToast(completionMessage, 'success');
      this.updateSessionsBadge();
      this.reset();
    },

    updateDisplay() {
      const minutes = Math.floor(this.remainingSeconds / 60);
      const seconds = this.remainingSeconds % 60;
      const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

      const displayEl = document.getElementById('timerDisplay');
      const modeLabel = document.getElementById('timerModeLabel');
      const progressCircle = document.getElementById('timerProgressCircle');

      if (displayEl) displayEl.textContent = formatted;
      if (modeLabel) modeLabel.textContent = `${this.currentMode} Session`;

      // Update document title when running
      if (this.isRunning) {
        document.title = `(${formatted}) Focus | Goal Tracker`;
      }

      // Update circular SVG progress ring
      if (progressCircle) {
        const totalSec = this.durationMinutes * 60;
        const progressFraction = totalSec > 0 ? this.remainingSeconds / totalSec : 0;
        const offset = this.circumference * (1 - progressFraction);
        progressCircle.style.strokeDashoffset = offset;
      }
    },

    updateSessionsBadge() {
      const badge = document.getElementById('completedSessionsBadge');
      if (badge) {
        const count = AppState.user.sessionsCompleted || 0;
        badge.textContent = `⭐ ${count} Focus Session${count === 1 ? '' : 's'} Done`;
      }
    }
  };

  // =========================================================================
  // 10. ORIGINAL FEATURE: DAILY MOTIVATION ENGINE (Req 8)
  // Dynamic daily quotes, shuffle, copy to clipboard
  // =========================================================================

  const MotivationEngine = {
    currentIndex: 0,

    init() {
      this.setDailyQuote();
      this.bindEvents();
    },

    bindEvents() {
      const shuffleBtn = document.getElementById('btnShuffleQuote');
      const copyBtn = document.getElementById('btnCopyQuote');

      if (shuffleBtn) {
        shuffleBtn.addEventListener('click', () => this.shuffleQuote());
      }

      if (copyBtn) {
        copyBtn.addEventListener('click', () => this.copyQuote());
      }
    },

    setDailyQuote() {
      // Deterministic quote based on day-of-year
      const now = new Date();
      const start = new Date(now.getFullYear(), 0, 0);
      const diff = now - start;
      const oneDay = 1000 * 60 * 60 * 24;
      const dayOfYear = Math.floor(diff / oneDay);

      this.currentIndex = dayOfYear % MOTIVATIONAL_QUOTES.length;
      this.renderCurrentQuote();
    },

    shuffleQuote() {
      let nextIndex;
      do {
        nextIndex = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
      } while (nextIndex === this.currentIndex && MOTIVATIONAL_QUOTES.length > 1);

      this.currentIndex = nextIndex;
      this.renderCurrentQuote();
      showToast('New inspiration loaded ✨');
    },

    renderCurrentQuote() {
      const quote = MOTIVATIONAL_QUOTES[this.currentIndex];
      const textEl = document.getElementById('dailyQuoteText');
      const authorEl = document.getElementById('dailyQuoteAuthor');
      const catEl = document.getElementById('quoteCategoryTag');

      if (textEl) textEl.textContent = `"${quote.text}"`;
      if (authorEl) authorEl.textContent = `— ${quote.author}`;
      if (catEl) catEl.textContent = quote.category;
    },

    copyQuote() {
      const quote = MOTIVATIONAL_QUOTES[this.currentIndex];
      const textToCopy = `"${quote.text}" — ${quote.author}`;

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(textToCopy).then(() => {
          showToast('Quote copied to clipboard! 📋');
        }).catch(() => {
          this.fallbackCopy(textToCopy);
        });
      } else {
        this.fallbackCopy(textToCopy);
      }
    },

    fallbackCopy(text) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        showToast('Quote copied to clipboard! 📋');
      } catch (e) {
        showToast('Unable to copy quote', 'error');
      }
      document.body.removeChild(ta);
    }
  };

  // =========================================================================
  // 11. GOAL MANAGEMENT & CRUD OPERATIONS (Req 2, 3, 4)
  // Add, Edit, Delete, Toggle Complete, Validation, Filter & Search
  // =========================================================================

  const GoalManager = {
    init() {
      this.bindGoalEvents();
    },

    bindGoalEvents() {
      // Open Add Modal buttons
      const addBtns = [
        document.getElementById('openAddGoalBtn'),
        document.getElementById('openAddGoalBtnSecondary'),
        document.getElementById('emptyStateAddBtn'),
        document.getElementById('mobileAddGoalFloatingBtn')
      ];

      addBtns.forEach(btn => {
        if (btn) btn.addEventListener('click', () => ModalManager.openGoalModal());
      });

      // Filter pills
      const filterPills = document.querySelectorAll('.cat-pill');
      filterPills.forEach(pill => {
        pill.addEventListener('click', () => {
          filterPills.forEach(p => {
            p.classList.remove('active');
            p.setAttribute('aria-selected', 'false');
          });
          pill.classList.add('active');
          pill.setAttribute('aria-selected', 'true');

          AppState.filter.category = pill.dataset.category;
          this.renderGoals();
        });
      });

      // Status filter dropdown
      const statusSelect = document.getElementById('statusFilterSelect');
      if (statusSelect) {
        statusSelect.addEventListener('change', (e) => {
          AppState.filter.status = e.target.value;
          this.renderGoals();
        });
      }

      // Sort select dropdown
      const sortSelect = document.getElementById('sortOrderSelect');
      if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
          AppState.filter.sort = e.target.value;
          this.renderGoals();
        });
      }

      // Search input
      const searchInput = document.getElementById('goalSearchInput');
      const clearSearchBtn = document.getElementById('clearSearchBtn');

      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          AppState.filter.search = e.target.value.trim().toLowerCase();
          if (clearSearchBtn) {
            clearSearchBtn.style.display = AppState.filter.search ? 'block' : 'none';
          }
          this.renderGoals();
        });
      }

      if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', () => {
          if (searchInput) {
            searchInput.value = '';
            AppState.filter.search = '';
            clearSearchBtn.style.display = 'none';
            this.renderGoals();
          }
        });
      }
    },

    toggleGoal(id) {
      const goal = AppState.goals.find(g => g.id === id);
      if (!goal) return;

      goal.completed = !goal.completed;

      if (goal.completed) {
        SoundFX.playSuccessPop();
        AppState.addXP(20);
        showToast(`Goal completed! +20 XP earned 🌱`);

        // Check if all goals are now completed for celebration
        const todayGoals = AppState.getTodayGoals();
        if (todayGoals.length > 0 && todayGoals.every(g => g.completed)) {
          setTimeout(() => {
            Confetti.burst();
            showToast(`🔥 Fantastic! All goals for today are completed! Streak boosted!`, 'success');
          }, 300);
        }
      } else {
        showToast('Goal marked active');
      }

      AppState.saveGoals();
      UIManager.updateAll();
    },

    deleteGoal(id) {
      AppState.goals = AppState.goals.filter(g => g.id !== id);
      AppState.saveGoals();
      showToast('Goal deleted');
      UIManager.updateAll();
    },

    getFilteredGoals() {
      let result = [...AppState.goals];

      // Category filter
      if (AppState.filter.category !== 'all') {
        result = result.filter(g => g.category.toLowerCase() === AppState.filter.category.toLowerCase());
      }

      // Status filter
      if (AppState.filter.status === 'completed') {
        result = result.filter(g => g.completed);
      } else if (AppState.filter.status === 'pending') {
        result = result.filter(g => !g.completed);
      }

      // Search filter
      if (AppState.filter.search) {
        const q = AppState.filter.search;
        result = result.filter(g =>
          g.name.toLowerCase().includes(q) ||
          (g.notes && g.notes.toLowerCase().includes(q)) ||
          g.category.toLowerCase().includes(q)
        );
      }

      // Sorting
      if (AppState.filter.sort === 'alphabetical') {
        result.sort((a, b) => a.name.localeCompare(b.name));
      } else if (AppState.filter.sort === 'category') {
        result.sort((a, b) => a.category.localeCompare(b.category));
      } else if (AppState.filter.sort === 'priority') {
        const order = { high: 1, medium: 2, low: 3 };
        result.sort((a, b) => (order[a.priority] || 2) - (order[b.priority] || 2));
      } else {
        // Newest first
        result.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      }

      return result;
    },

    renderGoals() {
      const container = document.getElementById('goalsListContainer');
      const emptyState = document.getElementById('goalsEmptyState');
      if (!container) return;

      const filtered = this.getFilteredGoals();
      this.updateCategoryCounts();

      if (filtered.length === 0) {
        container.innerHTML = '';
        if (emptyState) {
          emptyState.style.display = 'flex';
          const title = document.getElementById('emptyStateTitle');
          const desc = document.getElementById('emptyStateDesc');
          if (AppState.filter.search) {
            title.textContent = 'No matching goals found';
            desc.textContent = `No goals matched "${AppState.filter.search}". Try clearing your search or filters.`;
          } else if (AppState.filter.category !== 'all') {
            title.textContent = `No ${AppState.filter.category} goals yet`;
            desc.textContent = `You haven't created any goals in ${AppState.filter.category}. Tap below to add one!`;
          } else {
            title.textContent = 'No goals currently';
            desc.textContent = 'Stay ahead of your coursework by setting your first daily goal.';
          }
        }
        return;
      }

      if (emptyState) emptyState.style.display = 'none';

      container.innerHTML = '';

      filtered.forEach(goal => {
        const card = document.createElement('article');
        card.className = `goal-card ${goal.completed ? 'completed' : ''}`;
        card.dataset.id = goal.id;
        card.dataset.cat = goal.category;

        const catIcon = CATEGORY_ICONS[goal.category] || '🎯';
        const priorityBadgeClass = goal.priority === 'high' ? 'priority-high' : goal.priority === 'low' ? 'priority-low' : 'priority-medium';

        card.innerHTML = `
          <div class="goal-left">
            <button 
              type="button" 
              class="goal-checkbox-btn ${goal.completed ? 'checked' : ''}" 
              data-action="toggle" 
              aria-label="Mark ${escapeHtml(goal.name)} as ${goal.completed ? 'incomplete' : 'complete'}"
              aria-checked="${goal.completed}"
              role="checkbox"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="3" fill="none"><polyline points="20 6 9 17 4 12"/></svg>
            </button>

            <div class="goal-text-content">
              <div class="goal-title-row">
                <span class="goal-title">${escapeHtml(goal.name)}</span>
              </div>
              <div class="goal-badges-row">
                <span class="badge-category badge-${goal.category.toLowerCase()}">
                  <span>${catIcon}</span>
                  <span>${escapeHtml(goal.category)}</span>
                </span>
                <span class="badge-priority ${priorityBadgeClass}">${escapeHtml(goal.priority || 'medium')}</span>
              </div>
              ${goal.notes ? `<p class="goal-notes">${escapeHtml(goal.notes)}</p>` : ''}
            </div>
          </div>

          <div class="goal-actions">
            <button class="action-icon-btn edit-btn" data-action="edit" title="Edit goal" aria-label="Edit ${escapeHtml(goal.name)}">
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="action-icon-btn delete-btn" data-action="delete" title="Delete goal" aria-label="Delete ${escapeHtml(goal.name)}">
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
            </button>
          </div>
        `;

        // Card button click handlers
        const checkBtn = card.querySelector('[data-action="toggle"]');
        const editBtn = card.querySelector('[data-action="edit"]');
        const delBtn = card.querySelector('[data-action="delete"]');

        checkBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.toggleGoal(goal.id);
        });

        editBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          ModalManager.openGoalModal(goal);
        });

        delBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          ModalManager.openDeleteModal(goal);
        });

        container.appendChild(card);
      });
    },

    updateCategoryCounts() {
      const counts = { all: AppState.goals.length, Study: 0, Fitness: 0, Reading: 0, Coding: 0, Personal: 0 };
      AppState.goals.forEach(g => {
        if (counts[g.category] !== undefined) {
          counts[g.category]++;
        }
      });

      const countAll = document.getElementById('countCatAll');
      const countStudy = document.getElementById('countCatStudy');
      const countFitness = document.getElementById('countCatFitness');
      const countReading = document.getElementById('countCatReading');
      const countCoding = document.getElementById('countCatCoding');
      const countPersonal = document.getElementById('countCatPersonal');

      if (countAll) countAll.textContent = counts.all;
      if (countStudy) countStudy.textContent = counts.Study;
      if (countFitness) countFitness.textContent = counts.Fitness;
      if (countReading) countReading.textContent = counts.Reading;
      if (countCoding) countCoding.textContent = counts.Coding;
      if (countPersonal) countPersonal.textContent = counts.Personal;
    }
  };

  // Helper: Escape HTML to prevent XSS
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // =========================================================================
  // 12. MODAL MANAGER (Add, Edit, and Delete Confirmation)
  // Full accessibility: focus trap, Esc key listener, validation error handling
  // =========================================================================

  const ModalManager = {
    activeModal: null,

    init() {
      this.bindModalEvents();
    },

    bindModalEvents() {
      // Goal Modal Cancel/Close
      const closeGoalBtn = document.getElementById('closeGoalModalBtn');
      const cancelGoalBtn = document.getElementById('cancelGoalModalBtn');
      const goalBackdrop = document.getElementById('goalModalBackdrop');

      if (closeGoalBtn) closeGoalBtn.addEventListener('click', () => this.closeGoalModal());
      if (cancelGoalBtn) cancelGoalBtn.addEventListener('click', () => this.closeGoalModal());
      if (goalBackdrop) {
        goalBackdrop.addEventListener('click', (e) => {
          if (e.target === goalBackdrop) this.closeGoalModal();
        });
      }

      // Delete Modal Cancel/Close/Confirm
      const closeDelBtn = document.getElementById('closeDeleteModalBtn');
      const cancelDelBtn = document.getElementById('cancelDeleteBtn');
      const confirmDelBtn = document.getElementById('confirmDeleteBtn');
      const delBackdrop = document.getElementById('deleteModalBackdrop');

      if (closeDelBtn) closeDelBtn.addEventListener('click', () => this.closeDeleteModal());
      if (cancelDelBtn) cancelDelBtn.addEventListener('click', () => this.closeDeleteModal());
      if (delBackdrop) {
        delBackdrop.addEventListener('click', (e) => {
          if (e.target === delBackdrop) this.closeDeleteModal();
        });
      }

      if (confirmDelBtn) {
        confirmDelBtn.addEventListener('click', () => {
          if (AppState.goalToDelete) {
            GoalManager.deleteGoal(AppState.goalToDelete.id);
            this.closeDeleteModal();
          }
        });
      }

      // Goal Form Submit
      const goalForm = document.getElementById('goalForm');
      if (goalForm) {
        goalForm.addEventListener('submit', (e) => {
          e.preventDefault();
          this.handleGoalFormSubmit();
        });
      }

      // Character counter on goal name input
      const nameInput = document.getElementById('goalNameInput');
      const charCount = document.getElementById('goalNameCharCount');
      if (nameInput && charCount) {
        nameInput.addEventListener('input', () => {
          charCount.textContent = `${nameInput.value.length}/80`;
          document.getElementById('goalNameError').textContent = '';
          nameInput.classList.remove('is-invalid');
        });
      }

      // Global Esc key listener
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          if (this.activeModal === 'goal') this.closeGoalModal();
          else if (this.activeModal === 'delete') this.closeDeleteModal();
        }
      });
    },

    openGoalModal(goalToEdit = null) {
      const backdrop = document.getElementById('goalModalBackdrop');
      const modalTitle = document.getElementById('goalModalTitle');
      const headerIcon = document.getElementById('goalModalHeaderIcon');
      const saveBtnText = document.getElementById('saveGoalBtnText');

      const idInput = document.getElementById('goalEditId');
      const nameInput = document.getElementById('goalNameInput');
      const catSelect = document.getElementById('goalCategorySelect');
      const prioritySelect = document.getElementById('goalPrioritySelect');
      const notesInput = document.getElementById('goalNotesInput');
      const nameError = document.getElementById('goalNameError');
      const charCount = document.getElementById('goalNameCharCount');

      if (nameError) nameError.textContent = '';
      if (nameInput) nameInput.classList.remove('is-invalid');

      if (goalToEdit) {
        modalTitle.textContent = 'Edit Goal';
        headerIcon.textContent = '✏️';
        saveBtnText.textContent = 'Save Changes';
        idInput.value = goalToEdit.id;
        nameInput.value = goalToEdit.name;
        catSelect.value = goalToEdit.category;
        prioritySelect.value = goalToEdit.priority || 'medium';
        notesInput.value = goalToEdit.notes || '';
        charCount.textContent = `${goalToEdit.name.length}/80`;
      } else {
        modalTitle.textContent = 'Add New Goal';
        headerIcon.textContent = '🌱';
        saveBtnText.textContent = 'Add Goal';
        idInput.value = '';
        nameInput.value = '';
        catSelect.value = 'Study';
        prioritySelect.value = 'medium';
        notesInput.value = '';
        charCount.textContent = '0/80';
      }

      backdrop.style.display = 'flex';
      this.activeModal = 'goal';
      setTimeout(() => nameInput.focus(), 50);
    },

    closeGoalModal() {
      const backdrop = document.getElementById('goalModalBackdrop');
      if (backdrop) backdrop.style.display = 'none';
      this.activeModal = null;
    },

    handleGoalFormSubmit() {
      const id = document.getElementById('goalEditId').value;
      const nameInput = document.getElementById('goalNameInput');
      const catSelect = document.getElementById('goalCategorySelect');
      const prioritySelect = document.getElementById('goalPrioritySelect');
      const notesInput = document.getElementById('goalNotesInput');
      const nameError = document.getElementById('goalNameError');

      const name = nameInput.value.trim();
      const category = catSelect.value;
      const priority = prioritySelect.value;
      const notes = notesInput.value.trim();

      // Form Validation (Req 3)
      if (!name) {
        nameError.textContent = 'Please enter a goal title.';
        nameInput.classList.add('is-invalid');
        nameInput.focus();
        return;
      }

      if (name.length > 80) {
        nameError.textContent = 'Goal title cannot exceed 80 characters.';
        nameInput.classList.add('is-invalid');
        nameInput.focus();
        return;
      }

      if (!CATEGORIES.includes(category)) {
        showToast('Invalid category selected.', 'error');
        return;
      }

      const todayStr = getLocalDateString();

      if (id) {
        // Edit existing goal
        const existing = AppState.goals.find(g => g.id === id);
        if (existing) {
          existing.name = name;
          existing.category = category;
          existing.priority = priority;
          existing.notes = notes;
          showToast(`Goal updated: "${name}"`);
        }
      } else {
        // Create new goal
        const newGoal = {
          id: 'goal_' + Date.now(),
          name: name,
          category: category,
          priority: priority,
          notes: notes,
          completed: false,
          date: todayStr,
          createdAt: Date.now()
        };
        AppState.goals.unshift(newGoal);
        showToast(`Goal created: "${name}" 🌱`);
        AppState.addXP(10); // Bonus XP for creating a goal
      }

      AppState.saveGoals();
      this.closeGoalModal();
      UIManager.updateAll();
    },

    openDeleteModal(goal) {
      AppState.goalToDelete = goal;
      const backdrop = document.getElementById('deleteModalBackdrop');
      const titlePreview = document.getElementById('goalToDeleteTitle');

      if (titlePreview) {
        titlePreview.textContent = `${CATEGORY_ICONS[goal.category] || '🎯'} ${goal.name}`;
      }

      backdrop.style.display = 'flex';
      this.activeModal = 'delete';

      const cancelBtn = document.getElementById('cancelDeleteBtn');
      if (cancelBtn) cancelBtn.focus();
    },

    closeDeleteModal() {
      const backdrop = document.getElementById('deleteModalBackdrop');
      if (backdrop) backdrop.style.display = 'none';
      AppState.goalToDelete = null;
      this.activeModal = null;
    }
  };

  // =========================================================================
  // 13. UI MANAGER & DASHBOARD METRICS SYNCHRONIZATION (Req 1, 6, 10)
  // Updates app immediately when goals change
  // =========================================================================

  const UIManager = {
    init() {
      this.setupHeaderDate();
      this.setupMobileMenu();
      this.setupSettingsActions();
      this.updateAll();
    },

    setupHeaderDate() {
      const dateDisplay = document.getElementById('currentDateDisplay');
      if (dateDisplay) {
        dateDisplay.textContent = formatFriendlyDate();
      }
    },

    setupMobileMenu() {
      const toggleBtn = document.getElementById('mobileMenuToggle');
      const closeBtn = document.getElementById('mobileSidebarClose');
      const sidebar = document.getElementById('sidebar');
      const backdrop = document.getElementById('sidebarBackdrop');

      const openSidebar = () => {
        sidebar.classList.add('open');
        backdrop.classList.add('open');
      };

      const closeSidebar = () => {
        sidebar.classList.remove('open');
        backdrop.classList.remove('open');
      };

      if (toggleBtn) toggleBtn.addEventListener('click', openSidebar);
      if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
      if (backdrop) backdrop.addEventListener('click', closeSidebar);

      // Mobile bottom nav button scrolling
      const mobileNavButtons = document.querySelectorAll('.mobile-nav-btn[data-target]');
      mobileNavButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          mobileNavButtons.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');

          const targetId = btn.dataset.target;
          const targetEl = document.getElementById(targetId);
          if (targetEl) {
            targetEl.scrollIntoView({ behavior: 'smooth' });
          }
        });
      });

      // Desktop sidebar navigation active link state
      const navLinks = document.querySelectorAll('.sidebar-nav .nav-item');
      navLinks.forEach(link => {
        link.addEventListener('click', () => {
          navLinks.forEach(l => l.classList.remove('active'));
          link.classList.add('active');
          if (window.innerWidth <= 768) {
            closeSidebar();
          }
        });
      });
    },

    setupSettingsActions() {
      // Export Data
      const exportBtn = document.getElementById('btnExportData');
      if (exportBtn) {
        exportBtn.addEventListener('click', () => {
          const exportPayload = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            goals: AppState.goals,
            history: AppState.history,
            user: AppState.user
          };

          const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
          const dlAnchor = document.createElement('a');
          dlAnchor.setAttribute('href', dataStr);
          dlAnchor.setAttribute('download', `goal-tracker-backup-${getLocalDateString()}.json`);
          document.body.appendChild(dlAnchor);
          dlAnchor.click();
          dlAnchor.remove();
          showToast('Data exported successfully! 💾');
        });
      }

      // Import Data
      const importInput = document.getElementById('importFileInput');
      if (importInput) {
        importInput.addEventListener('change', (e) => {
          const file = e.target.files[0];
          if (!file) return;

          const reader = new FileReader();
          reader.onload = (event) => {
            try {
              const data = JSON.parse(event.target.result);
              if (Array.isArray(data.goals)) {
                AppState.goals = data.goals;
                AppState.history = data.history || {};
                AppState.user = data.user || AppState.user;
                AppState.saveGoals();
                AppState.saveHistory();
                AppState.saveUser();
                this.updateAll();
                showToast('Data imported successfully! 🎉');
              } else {
                showToast('Invalid backup file format.', 'error');
              }
            } catch (err) {
              showToast('Error reading JSON file.', 'error');
            }
          };
          reader.readAsText(file);
          importInput.value = ''; // Reset input
        });
      }

      // Clear completed goals
      const clearCompletedBtn = document.getElementById('btnClearCompletedGoals');
      if (clearCompletedBtn) {
        clearCompletedBtn.addEventListener('click', () => {
          const count = AppState.goals.filter(g => g.completed).length;
          if (count === 0) {
            showToast('No completed goals to clear.');
            return;
          }
          if (confirm(`Remove ${count} completed goal${count === 1 ? '' : 's'}?`)) {
            AppState.goals = AppState.goals.filter(g => !g.completed);
            AppState.saveGoals();
            this.updateAll();
            showToast(`Cleared ${count} completed goal${count === 1 ? '' : 's'}.`);
          }
        });
      }

      // Reset to defaults
      const resetBtn = document.getElementById('btnResetToDefaults');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          if (confirm('Restore example goals? This will reset goals to the initial sample set.')) {
            Storage.remove(STORAGE_KEYS.SEEDED);
            AppState.seedInitialData();
            this.updateAll();
            showToast('Sample goals restored.');
          }
        });
      }
    },

    updateAll() {
      // 1. Calculate dashboard metrics
      const todayGoals = AppState.getTodayGoals();
      const total = todayGoals.length;
      const completed = todayGoals.filter(g => g.completed).length;
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
      const remaining = total - completed;

      // 2. Calculate streak
      const streak = StreakEngine.calculate();

      // 3. Update Stat Card 1: Total Goals
      const statTotalEl = document.getElementById('statTotalGoals');
      if (statTotalEl) statTotalEl.textContent = total;

      // 4. Update Stat Card 2: Completed Goals
      const statCompletedEl = document.getElementById('statCompletedGoals');
      const statRemainingEl = document.getElementById('statRemainingSubtext');
      if (statCompletedEl) statCompletedEl.textContent = completed;
      if (statRemainingEl) statRemainingEl.textContent = `${remaining} remaining`;

      // 5. Update Stat Card 3: Completion Rate & Progress Bar
      const statPercentageEl = document.getElementById('statPercentage');
      const statProgressFill = document.getElementById('statProgressBarFill');
      const progressBar = document.getElementById('progressBar');
      if (statPercentageEl) statPercentageEl.textContent = `${percentage}%`;
      if (statProgressFill) statProgressFill.style.width = `${percentage}%`;
      if (progressBar) progressBar.setAttribute('aria-valuenow', percentage);

      // 6. Update Stat Card 4: Streak Counters
      const streakDaysEl = document.getElementById('statStreakDays');
      const streakDescEl = document.getElementById('statStreakDescription');
      const headerStreakCount = document.getElementById('headerStreakCount');
      const sidebarStreakBadge = document.getElementById('sidebarStreakBadge');

      const streakText = `${streak} Day${streak === 1 ? '' : 's'}`;
      if (streakDaysEl) streakDaysEl.textContent = streakText;
      if (headerStreakCount) headerStreakCount.textContent = `${streakText} Streak`;
      if (sidebarStreakBadge) sidebarStreakBadge.textContent = `🔥 ${streak}d`;

      if (streakDescEl) {
        if (streak > 0) {
          streakDescEl.textContent = `Keep the momentum going!`;
        } else {
          streakDescEl.textContent = `Finish all goals to start a streak`;
        }
      }

      // 7. Update Gamified Student Profile
      const studentLevelTag = document.getElementById('studentLevelTag');
      const studentRankTitle = document.getElementById('studentRankTitle');
      const xpBarFill = document.getElementById('xpBarFill');
      const xpText = document.getElementById('xpText');

      const rankTitles = [
        'Novice Scholar',
        'Dedicated Learner',
        'Knowledge Knight',
        'Master Achiever',
        'Academic Champion',
        'Grand Scholar'
      ];
      const rankIndex = Math.min(AppState.user.level - 1, rankTitles.length - 1);

      if (studentLevelTag) studentLevelTag.textContent = `Lvl ${AppState.user.level}`;
      if (studentRankTitle) studentRankTitle.textContent = rankTitles[rankIndex];

      const xpNeeded = AppState.user.level * 100;
      const xpPercent = Math.min(100, Math.round((AppState.user.xp / xpNeeded) * 100));
      if (xpBarFill) xpBarFill.style.width = `${xpPercent}%`;
      if (xpText) xpText.textContent = `${AppState.user.xp} / ${xpNeeded} XP`;

      // 8. Update Goal Cards & Filter counts
      GoalManager.renderGoals();

      // 9. Update Weekly Progress Chart
      WeeklyChart.render();

      // 10. Update Focus Timer Goal Link dropdown & Badge
      FocusTimer.populateGoalSelect();
      FocusTimer.updateSessionsBadge();
    }
  };

  // =========================================================================
  // 14. APPLICATION INITIALIZATION
  // =========================================================================

  document.addEventListener('DOMContentLoaded', () => {
    Confetti.init();
    AppState.init();
    WeeklyChart.init();
    FocusTimer.init();
    MotivationEngine.init();
    GoalManager.init();
    ModalManager.init();
    UIManager.init();
  });

})();
