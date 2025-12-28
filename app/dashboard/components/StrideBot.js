'use client';
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState, useCallback } from 'react';

const MESSAGES = {
  happy: [
    "Hey {name}, you're doing great today.",
    "All good here, {name}. You've got this.",
    "Quiet moment? You've earned it, {name}.",
    "{name}, just wanted to say—you're crushing it.",
    "No fires to put out, {name}. Enjoy the calm.",
    "Your kids are lucky to have you, {name}.",
    "Smooth sailing, {name}. Keep being awesome.",
    "Just vibing over here, {name}. You?",
    "{name}, take a second to appreciate yourself.",
    "Another day, another win, {name}."
  ],
  party: [
    "Yes! {student} just earned some love, {name}!",
    "That's what it's all about, {name}! 🎉",
    "{name}, you just made someone's whole day.",
    "Points don't lie—{student} earned that, {name}!",
    "See? They notice when you notice them, {name}.",
    "Culture building in real time, {name}!",
    "{student} is gonna remember this, {name}.",
    "This is the good stuff, {name}. Keep it coming.",
    "You're literally changing lives, {name}. No pressure.",
    "W. That's it. That's the message, {name}."
  ],
  high5: [
    "{student} made it back, {name}. All good.",
    "Look who's back! {student} is in, {name}.",
    "{student} didn't take forever. We love to see it, {name}.",
    "Back safe, {name}. {student} is checked in.",
    "And they return! {student} is here, {name}.",
    "Quick trip, {name}. {student} is back already.",
    "{student} just walked in, {name}. Timer stopped.",
    "Smooth return, {name}. No drama."
  ],
  scan: [
    "Got it, {name}. {student} is headed to {destination}.",
    "{student} is on the move, {name}. I'm watching the clock.",
    "Pass out, {name}. {student} → {destination}.",
    "Timer started, {name}. {student} has a few minutes.",
    "Logged it, {name}. {student} to {destination}.",
    "They're off, {name}. I'll let you know if it takes too long.",
    "{student} is out, {name}. I've got eyes on the time."
  ],
  wellness: [
    "Hey {name}—when's the last time you had water?",
    "Quick check: shoulders down, jaw unclenched, {name}.",
    "{name}, take one deep breath. Just one. I'll wait.",
    "You've been going nonstop, {name}. Breathe.",
    "Random reminder that you're doing enough, {name}.",
    "Stretch break? Even 10 seconds helps, {name}.",
    "{name}, you can't pour from an empty cup. Take care of you.",
    "One thing you did well today, {name}. Name it. Own it.",
    "Hey {name}—you matter too. Don't forget that.",
    "The kids need you healthy, {name}. Rest when you can.",
    "Just checking in on YOU, {name}. How are you really doing?",
    "{name}, it's okay to not be okay. But I'm rooting for you."
  ],
  warn: [
    "Hey {name}, {student} has been out a bit. Maybe check in?",
    "Not rushing you, {name}, but {student} is at {minutes} minutes.",
    "Just a heads up—{student} might need a nudge, {name}.",
    "{name}, {student} is still out. Want me to keep waiting?",
    "Friendly flag: {student} has been gone {minutes}m, {name}.",
    "No stress, {name}, but {student} is pushing it on time."
  ],
  sad: [
    "Logged it, {name}. Tomorrow's a new day for {student}.",
    "Got it, {name}. You're handling it the right way.",
    "Noted, {name}. You're doing what you gotta do.",
    "It's documented, {name}. Hopefully things turn around.",
    "Tough moment, {name}. But you're being consistent, and that matters.",
    "On the record, {name}. Keep your head up."
  ],
  siren: [
    "{name}, lockdown is active. Secure your room.",
    "🚨 Lockdown, {name}. Passes are frozen. Stay safe.",
    "This is real, {name}. Follow your protocol.",
    "I'm here with you, {name}. Lockdown mode is on.",
    "{name}, stay calm. Lockdown is in effect. I've got the data.",
    "All passes suspended, {name}. Focus on your kids."
  ],
  alert: [
    "Heads up, {name}!",
    "Something needs attention, {name}.",
    "Quick look, {name}.",
    "{name}, just flagging this for you."
  ],
  guide: [],
  waitlist: [
    "{destination} is full right now, {name}. {student} is on the list.",
    "No worries—{student} will get a 3-minute hold when a spot opens, {name}.",
    "I've got {student} in line, {name}. I'll let you know."
  ],
  afterHours: [
    "{name}, the bell rang a while ago. You're still here?",
    "Most people left already, {name}. You're dedicated.",
    "Hey {name}—the building is getting quiet. Don't overdo it.",
    "Still grinding, {name}? Your effort doesn't go unnoticed.",
    "{name}, you've done enough today. Seriously.",
    "The kids went home, {name}. Maybe you should too?",
    "After-hours mode, {name}. Take it easy on yourself."
  ],
  lateNight: [
    "{name}... it's getting late. Like, really late.",
    "Okay {name}, this is above and beyond. Go home.",
    "The janitors might lock you in, {name}. Just saying.",
    "{name}, your couch misses you. Your bed misses you.",
    "I'm not saying leave, {name}... but maybe leave?",
    "Still here, {name}? You're built different.",
    "It's dark outside, {name}. The work will be here tomorrow."
  ],
  veryLate: [
    "{name}... why are you here right now?",
    "It's the middle of the night, {name}. This can't be healthy.",
    "I'm a bot and even I think you should be asleep, {name}.",
    "{name}, go home. That's not a suggestion.",
    "Are you okay, {name}? Seriously. This is late.",
    "I'm worried about you, {name}. Log off.",
    "You're amazing, {name}, but you need sleep to stay that way."
  ],
  weekend: [
    "It's the weekend, {name}. What are you doing here?",
    "{name}, even superheroes take days off.",
    "Saturday/Sunday is for YOU, {name}. Not grading.",
    "Weekend warrior, {name}? Don't burn out.",
    "{name}, the building is lonely on weekends. Go live your life."
  ],
  sandbox: [
    "Training mode, {name}! Break stuff. It's fine.",
    "Nothing's real here, {name}. Experiment away.",
    "Sandbox is on, {name}. Play around, learn the ropes."
  ]
};

const GREETINGS = {
  morning: "Good morning, {name}! Let's make today count.",
  afternoon: "Afternoon, {name}! You're halfway there.",
  evening: "Still at it, {name}? You're dedicated.",
  night: "It's late, {name}. Don't forget to take care of yourself."
};

const HINTS = {
  hallpass: "This is where you send students out, {name}. Pick a student, pick a place, done. Click any numbered orb to learn more!",
  infractions: "Log behavior stuff here, {name}. It also tracks parent contacts and MTSS interventions. The system auto-calculates tier levels.",
  incentives: "Give points here! Students get 40%, their house gets 60%. Watch the mascots celebrate when you award points, {name}.",
  safety: "Conflict groups and lockdown controls, {name}. The serious stuff. You can define groups of students who shouldn't be in the hall together.",
  communication: "Send announcements to every teacher in your school, {name}. Set priority levels and pin important messages.",
  analytics: "Charts, MTSS reports, who's going where and when. All the data, {name}. Export reports for administrators.",
  records: "Search any student's history, {name}. Passes, infractions, points—it's all here. Filter by type or search by name.",
  admin: "The Box, {name}. Upload rosters, tweak settings, run the show. Only admins see this.",
  waitlist: "That spot's full, {name}. Student's in line—they'll get 3 minutes when it opens."
};

// Corner positions for teleportation
const CORNERS = [
  { bottom: 24, right: 24 },
  { bottom: 24, left: 24 },
  { top: 100, right: 24 },
  { top: 100, left: 24 },
];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function getTimeContext() {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();
  
  if (day === 0 || day === 6) return 'weekend';
  if (hour >= 0 && hour < 5) return 'veryLate';
  if (hour >= 5 && hour < 6) return 'night';
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'afterHours';
  if (hour >= 21) return 'lateNight';
  return 'afternoon';
}

function fillTemplate(template, ctx = {}) {
  return template
    .replace(/{name}/g, ctx.name || 'friend')
    .replace(/{student}/g, ctx.student || 'Student')
    .replace(/{destination}/g, ctx.destination || 'destination')
    .replace(/{minutes}/g, ctx.minutes || '?')
    .replace(/{sender}/g, ctx.sender || 'Admin')
    .replace(/{message}/g, ctx.message || '')
    .replace(/{position}/g, ctx.position || '1');
}

const StrideBot = forwardRef(function StrideBot({ 
  theme = 'obsidian', 
  lockdown = false, 
  userGreeting,
  sandboxMode = false,
  botConfig = {},
  activeBroadcast = null
}, ref) {
  const [open, setOpen] = useState(true);
  const [minimized, setMinimized] = useState(false);
  const [mood, setMood] = useState('happy');
  const [message, setMessage] = useState('');
  const [actions, setActions] = useState([]);
  const [lastPushAt, setLastPushAt] = useState(0);
  const [blinking, setBlinking] = useState(false);
  const [hasNotification, setHasNotification] = useState(false);
  
  // Mouse tracking state
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [pupilOffset, setPupilOffset] = useState({ x: 0, y: 0 });
  const botCoreRef = useRef(null);
  
  // Teleportation state
  const [position, setPosition] = useState(CORNERS[0]);
  const [isTeleporting, setIsTeleporting] = useState(false);
  
  // Timers
  const timerRef = useRef(null);
  const blinkRef = useRef(null);
  const customMsgRef = useRef(null);
  const teleportRef = useRef(null);
  const lastBroadcastIdRef = useRef(null);

  const userName = userGreeting?.firstName || 'friend';
  const customMessages = botConfig?.customMessages || [];

  // Mouse tracking for eye follow
  useEffect(() => {
    if (!open || minimized) return;
    
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [open, minimized]);

  // Calculate pupil offset based on mouse position
  useEffect(() => {
    if (!botCoreRef.current || minimized) return;
    
    const rect = botCoreRef.current.getBoundingClientRect();
    const botCenterX = rect.left + rect.width / 2;
    const botCenterY = rect.top + rect.height / 2;
    
    const angle = Math.atan2(mousePos.y - botCenterY, mousePos.x - botCenterX);
    const distance = Math.min(
      Math.hypot(mousePos.x - botCenterX, mousePos.y - botCenterY) / 100,
      1
    );
    
    // Clamp pupil movement to 3px max
    const maxOffset = 3;
    setPupilOffset({
      x: Math.cos(angle) * distance * maxOffset,
      y: Math.sin(angle) * distance * maxOffset
    });
  }, [mousePos, minimized]);

  // Teleportation - move to random corner every 45-90 seconds
  useEffect(() => {
    if (!open || minimized || lockdown) return;
    
    const scheduleTeleport = () => {
      const delay = (45 + Math.random() * 45) * 1000; // 45-90 seconds
      teleportRef.current = setTimeout(() => {
        // Start teleport sequence
        setIsTeleporting(true);
        
        setTimeout(() => {
          // Pick new corner (different from current)
          const currentIndex = CORNERS.findIndex(
            c => c.bottom === position.bottom && c.right === position.right
          );
          let newIndex;
          do {
            newIndex = Math.floor(Math.random() * CORNERS.length);
          } while (newIndex === currentIndex);
          
          setPosition(CORNERS[newIndex]);
          
          setTimeout(() => {
            setIsTeleporting(false);
          }, 100);
        }, 400);
        
        scheduleTeleport();
      }, delay);
    };
    
    scheduleTeleport();
    return () => clearTimeout(teleportRef.current);
  }, [open, minimized, lockdown, position]);

  // Theme-aware colors
  const getThemeColors = () => {
    switch (theme) {
      case 'aero':
        return {
          bg: 'bg-white',
          text: 'text-slate-900',
          border: 'border-slate-200',
          muted: 'text-slate-600',
          bubbleBg: 'bg-white shadow-xl border-slate-200',
          coreBg: 'bg-white border-slate-200',
          eyeBg: 'bg-slate-200',
          pupil: 'bg-indigo-600',
          glow: 'shadow-lg shadow-slate-200/50'
        };
      case 'eclipse':
        return {
          bg: 'bg-black',
          text: 'text-white',
          border: 'border-zinc-800',
          muted: 'text-zinc-400',
          bubbleBg: 'bg-zinc-900 border-zinc-700',
          coreBg: 'bg-black border-zinc-800',
          eyeBg: 'bg-zinc-800',
          pupil: 'bg-yellow-400',
          glow: 'shadow-lg shadow-yellow-500/20'
        };
      case 'obsidian':
      default:
        return {
          bg: 'bg-slate-900',
          text: 'text-white',
          border: 'border-white/10',
          muted: 'text-slate-400',
          bubbleBg: 'bg-slate-900/95 border-white/10 backdrop-blur-xl',
          coreBg: 'bg-indigo-950/90 border-white/10',
          eyeBg: 'bg-white/20',
          pupil: 'bg-emerald-400',
          glow: 'shadow-lg shadow-emerald-500/20'
        };
    }
  };

  const colors = getThemeColors();

  const push = (nextMood, ctx = {}) => {
    const now = Date.now();
    // Guide and siren bypass rate limiting
    if (!['siren', 'guide'].includes(nextMood) && now - lastPushAt < 600) return;
    setLastPushAt(now);
    setMood(nextMood);
    setHasNotification(true);
    setActions(ctx.actions || []);
    
    // Open bot from minimized state for important messages
    if (minimized && ['guide', 'siren', 'alert'].includes(nextMood)) {
      setMinimized(false);
    }
    
    if (minimized) return;
    
    const context = { name: userName, ...ctx };
    
    // If custom message provided (like from guide orbs), use it
    if (ctx.message) {
      setMessage(fillTemplate(ctx.message, context));
      return;
    }
    
    // Otherwise use mood-based messages
    const moodMessages = MESSAGES[nextMood] || MESSAGES.happy;
    if (moodMessages.length > 0) {
      setMessage(fillTemplate(pick(moodMessages), context));
    }
  };

  const showHint = (buttonId) => {
    const hint = HINTS[buttonId];
    if (hint) {
      setMood('guide');
      setMessage(fillTemplate(hint, { name: userName }));
      setHasNotification(true);
      if (minimized) setMinimized(false);
    }
  };

  const showBroadcast = (broadcast) => {
    if (!broadcast) return;
    setMood('alert');
    const prefix = broadcast.priority === 'urgent' ? '🚨 ' : broadcast.priority === 'important' ? '⚠️ ' : '📢 ';
    setMessage(`${prefix}From ${broadcast.senderName}: "${broadcast.message}"`);
    setHasNotification(true);
    if (minimized) setMinimized(false);
  };

  useImperativeHandle(ref, () => ({ push, showHint, showBroadcast }));

  // Initial greeting
  useEffect(() => {
    const timeCtx = getTimeContext();
    let greeting;
    
    if (timeCtx === 'weekend') greeting = pick(MESSAGES.weekend);
    else if (timeCtx === 'veryLate') greeting = pick(MESSAGES.veryLate);
    else if (timeCtx === 'lateNight') greeting = pick(MESSAGES.lateNight);
    else if (timeCtx === 'afterHours') greeting = pick(MESSAGES.afterHours);
    else greeting = GREETINGS[timeCtx] || GREETINGS.afternoon;
    
    if (sandboxMode) greeting = pick(MESSAGES.sandbox);
    
    setMessage(fillTemplate(greeting, { name: userName }));
  }, [userName, sandboxMode]);

  // Blinking with micro-saccades
  useEffect(() => {
    if (!open || minimized) return;
    blinkRef.current = setInterval(() => {
      if (Math.random() > 0.7) {
        setBlinking(true);
        setTimeout(() => setBlinking(false), 150);
      }
    }, 3000 + Math.random() * 2000);
    return () => clearInterval(blinkRef.current);
  }, [open, minimized]);

  // Wellness timer
  useEffect(() => {
    if (!open || lockdown) return;
    const schedule = () => {
      const mins = 7 + Math.floor(Math.random() * 6);
      timerRef.current = setTimeout(() => { push('wellness'); schedule(); }, mins * 60 * 1000);
    };
    schedule();
    return () => clearTimeout(timerRef.current);
  }, [open, lockdown]);

  // Custom messages
  useEffect(() => {
    if (!customMessages.length || lockdown) return;
    const showCustom = () => {
      const msg = pick(customMessages);
      if (msg?.text) {
        setMood('alert');
        setMessage(fillTemplate(msg.text, { name: userName }));
        setHasNotification(true);
        if (minimized) setMinimized(false);
      }
    };
    const interval = (5 + Math.random() * 5) * 60 * 1000;
    customMsgRef.current = setInterval(showCustom, interval);
    return () => clearInterval(customMsgRef.current);
  }, [customMessages, lockdown, userName, minimized]);

  // Broadcasts
  useEffect(() => {
    if (!activeBroadcast || activeBroadcast.id === lastBroadcastIdRef.current) return;
    lastBroadcastIdRef.current = activeBroadcast.id;
    showBroadcast(activeBroadcast);
  }, [activeBroadcast]);

  // Lockdown
  useEffect(() => {
    if (!open) return;
    if (lockdown) push('siren');
    else if (mood === 'siren') push('happy');
  }, [lockdown, open]);

  const toggleMinimize = () => {
    setMinimized(!minimized);
    if (minimized) setHasNotification(false);
  };

  const handleAction = (action) => {
    window.dispatchEvent(new CustomEvent('stridebot-action', { detail: action }));
    setActions([]);
  };

  if (!open) return null;

  const moodColors = {
    happy: 'from-indigo-400/35 via-indigo-400/10',
    party: 'from-emerald-400/35 via-emerald-400/10',
    high5: 'from-sky-400/35 via-sky-400/10',
    scan: 'from-sky-400/35 via-sky-400/10',
    siren: 'from-red-500/40 via-red-500/10',
    wellness: 'from-amber-400/35 via-amber-400/10',
    alert: 'from-orange-400/35 via-orange-400/10',
    warn: 'from-orange-500/40 via-orange-500/10',
    sad: 'from-slate-400/35 via-slate-400/10',
    guide: 'from-purple-400/35 via-purple-400/10',
    waitlist: 'from-amber-400/35 via-amber-400/10'
  };

  // Minimized state
  if (minimized) {
    return (
      <div className="fixed z-50" style={position}>
        <button onClick={toggleMinimize} className={`w-12 h-12 rounded-full border flex items-center justify-center relative ${colors.glow} ${colors.coreBg} ${colors.border}`}>
          <div className={`flex items-center gap-1 ${mood === 'siren' ? 'animate-pulse' : ''}`}>
            <div className={`w-2 h-3 rounded-full transition-transform ${colors.pupil} ${blinking ? 'scale-y-[0.2]' : ''}`} />
            <div className={`w-2 h-3 rounded-full transition-transform ${colors.pupil} ${blinking ? 'scale-y-[0.2]' : ''}`} />
          </div>
          {hasNotification && <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />}
        </button>
      </div>
    );
  }

  return (
    <div 
      className={`fixed z-50 transition-all duration-300 ${isTeleporting ? 'animate-teleport-out' : 'animate-teleport-in'}`}
      style={position}
    >
      <div className="relative">
        {/* Message bubble */}
        <div className={`absolute bottom-[104px] right-0 w-[280px] p-4 rounded-2xl border shadow-xl animate-fadeIn ${colors.bubbleBg}`}>
          <div className={`text-xs font-bold mb-1 ${colors.muted}`}>
            StrideBot {lockdown ? '• EMERGENCY' : sandboxMode ? '• Training' : mood === 'wellness' ? '• Wellness' : mood === 'warn' ? '• Alert' : mood === 'guide' ? '• Guide' : ''}
          </div>
          <div className={`text-sm font-semibold leading-snug ${colors.text}`}>{message}</div>
          
          {actions.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {actions.map((action, i) => (
                <button key={i} onClick={() => handleAction(action)} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${theme === 'aero' ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-white/10 hover:bg-white/20'}`}>
                  {action.label}
                </button>
              ))}
            </div>
          )}
          
          <div className="mt-3 flex items-center justify-between">
            <button className={`text-xs font-bold opacity-70 hover:opacity-100 ${colors.muted}`} onClick={() => push(lockdown ? 'siren' : 'happy')}>Reset</button>
            <button className={`text-xs font-bold opacity-70 hover:opacity-100 ${colors.muted}`} onClick={() => setOpen(false)}>Hide</button>
          </div>
        </div>

        {/* Bot core */}
        <button
          ref={botCoreRef}
          className={`w-20 h-20 rounded-full border flex items-center justify-center relative transition-all duration-500 ${colors.glow} ${colors.coreBg} ${colors.border} ${mood === 'siren' ? 'animate-pulse' : 'stridebot-idle'}`}
          onClick={() => push('happy')}
          onDoubleClick={toggleMinimize}
          title="StrideBot - Double-click to minimize"
        >
          {/* Halo */}
          <div className={`absolute inset-[-8px] rounded-full bg-gradient-to-b ${moodColors[mood] || moodColors.happy} to-transparent blur-xl opacity-70`} />

          {/* Face - Eyes with mouse tracking */}
          <div className={`relative z-10 flex items-center gap-2 ${mood === 'party' ? 'animate-bounce' : ''}`}>
            {/* Left eye */}
            <div className={`w-4 h-4 rounded-full flex items-center justify-center ${colors.eyeBg}`}>
              <div 
                className={`w-2.5 h-2.5 rounded-full transition-transform animate-saccade ${colors.pupil} ${blinking ? 'scale-y-[0.2]' : ''}`} 
                style={{ 
                  transform: `translate(${pupilOffset.x}px, ${pupilOffset.y}px) ${blinking ? 'scaleY(0.2)' : ''}`,
                }} 
              />
            </div>
            {/* Right eye */}
            <div className={`w-4 h-4 rounded-full flex items-center justify-center ${colors.eyeBg}`}>
              <div 
                className={`w-2.5 h-2.5 rounded-full transition-transform animate-saccade ${colors.pupil} ${blinking ? 'scale-y-[0.2]' : ''}`} 
                style={{ 
                  transform: `translate(${pupilOffset.x}px, ${pupilOffset.y}px) ${blinking ? 'scaleY(0.2)' : ''}`,
                  animationDelay: '0.1s'
                }} 
              />
            </div>
          </div>

          {/* Mood badges */}
          {mood === 'scan' && <div className="absolute -top-1 -right-1 text-sky-400 font-black text-[10px] animate-pulse">ID</div>}
          {mood === 'party' && <div className="absolute -top-1 -right-1 text-emerald-400 font-black text-[10px] animate-bounce">W</div>}
          {mood === 'wellness' && <div className="absolute -top-1 -right-1 text-amber-400 font-black text-[10px] animate-bounce">💧</div>}
          {mood === 'warn' && <div className="absolute -top-1 -right-1 text-orange-400 font-black text-[10px] animate-pulse">⚠️</div>}
          {mood === 'guide' && <div className="absolute -top-1 -right-1 text-purple-400 font-black text-[10px] animate-pulse">?</div>}
          {sandboxMode && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-amber-500 text-black text-[8px] font-bold rounded-full">SANDBOX</div>}

          {/* Siren ring */}
          {(mood === 'siren' || lockdown) && <div className="absolute inset-0 rounded-full border-4 border-red-500/70 animate-ping" />}

          {/* Party particles */}
          {mood === 'party' && (
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 rounded-full animate-particle"
                  style={{
                    background: ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'][i % 5],
                    left: '50%',
                    top: '50%',
                    '--angle': `${i * 45}deg`,
                    animationDelay: `${i * 0.05}s`
                  }}
                />
              ))}
            </div>
          )}
        </button>
      </div>
    </div>
  );
});

export default StrideBot;
