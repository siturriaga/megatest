'use client';
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';

// ============================================
// PROTECTED: ALL MESSAGE LOGIC BELOW
// These messages are tied to date, time, vibes
// DO NOT MODIFY
// ============================================

const MESSAGES = {
  happy: ["Hey {name}, you're doing great today.","All good here, {name}. You've got this.","Quiet moment? You've earned it, {name}.","{name}, just wanted to say—you're crushing it.","No fires to put out, {name}. Enjoy the calm.","Your kids are lucky to have you, {name}.","Smooth sailing, {name}. Keep being awesome.","Just vibing over here, {name}. You?","{name}, take a second to appreciate yourself.","Another day, another win, {name}."],
  party: ["Yes! {student} just earned some love, {name}!","That's what it's all about, {name}! 🎉","{name}, you just made someone's whole day.","Points don't lie—{student} earned that, {name}!","See? They notice when you notice them, {name}.","Culture building in real time, {name}!","{student} is gonna remember this, {name}.","This is the good stuff, {name}. Keep it coming.","You're literally changing lives, {name}. No pressure.","W. That's it. That's the message, {name}."],
  high5: ["{student} made it back, {name}. All good.","Look who's back! {student} is in, {name}.","{student} didn't take forever. We love to see it, {name}.","Back safe, {name}. {student} is checked in.","And they return! {student} is here, {name}.","Quick trip, {name}. {student} is back already.","{student} just walked in, {name}. Timer stopped.","Smooth return, {name}. No drama."],
  scan: ["Got it, {name}. {student} is headed to {destination}.","{student} is on the move, {name}. I'm watching the clock.","Pass out, {name}. {student} → {destination}.","Timer started, {name}. {student} has a few minutes.","Logged it, {name}. {student} to {destination}.","They're off, {name}. I'll let you know if it takes too long.","{student} is out, {name}. I've got eyes on the time."],
  wellness: ["Hey {name}—when's the last time you had water?","Quick check: shoulders down, jaw unclenched, {name}.","{name}, take one deep breath. Just one. I'll wait.","You've been going nonstop, {name}. Breathe.","Random reminder that you're doing enough, {name}.","Stretch break? Even 10 seconds helps, {name}.","{name}, you can't pour from an empty cup. Take care of you.","One thing you did well today, {name}. Name it. Own it.","Hey {name}—you matter too. Don't forget that.","The kids need you healthy, {name}. Rest when you can.","Just checking in on YOU, {name}. How are you really doing?","{name}, it's okay to not be okay. But I'm rooting for you."],
  warn: ["Hey {name}, {student} has been out a bit. Maybe check in?","Not rushing you, {name}, but {student} is at {minutes} minutes.","Just a heads up—{student} might need a nudge, {name}.","{name}, {student} is still out. Want me to keep waiting?","Friendly flag: {student} has been gone {minutes}m, {name}.","No stress, {name}, but {student} is pushing it on time."],
  sad: ["Logged it, {name}. Tomorrow's a new day for {student}.","Got it, {name}. You're handling it the right way.","Noted, {name}. You're doing what you gotta do.","It's documented, {name}. Hopefully things turn around.","Tough moment, {name}. But you're being consistent, and that matters.","On the record, {name}. Keep your head up."],
  siren: ["{name}, lockdown is active. Secure your room.","🚨 Lockdown, {name}. Passes are frozen. Stay safe.","This is real, {name}. Follow your protocol.","I'm here with you, {name}. Lockdown mode is on.","{name}, stay calm. Lockdown is in effect. I've got the data.","All passes suspended, {name}. Focus on your kids."],
  alert: ["Heads up, {name}!","Something needs attention, {name}.","Quick look, {name}.","{name}, just flagging this for you."],
  guide: [],
  waitlist: ["{destination} is full right now, {name}. {student} is on the list.","No worries—{student} will get a 3-minute hold when a spot opens, {name}.","I've got {student} in line, {name}. I'll let you know."],
  afterHours: ["{name}, the bell rang a while ago. You're still here?","Most people left already, {name}. You're dedicated.","Hey {name}—the building is getting quiet. Don't overdo it.","Still grinding, {name}? Your effort doesn't go unnoticed.","{name}, you've done enough today. Seriously.","The kids went home, {name}. Maybe you should too?","After-hours mode, {name}. Take it easy on yourself."],
  lateNight: ["{name}... it's getting late. Like, really late.","Okay {name}, this is above and beyond. Go home.","The janitors might lock you in, {name}. Just saying.","{name}, your couch misses you. Your bed misses you.","I'm not saying leave, {name}... but maybe leave?","Still here, {name}? You're built different.","It's dark outside, {name}. The work will be here tomorrow."],
  veryLate: ["{name}... why are you here right now?","It's the middle of the night, {name}. This can't be healthy.","I'm a bot and even I think you should be asleep, {name}.","{name}, go home. That's not a suggestion.","Are you okay, {name}? Seriously. This is late.","I'm worried about you, {name}. Log off.","You're amazing, {name}, but you need sleep to stay that way."],
  weekend: ["It's the weekend, {name}. What are you doing here?","{name}, even superheroes take days off.","Saturday/Sunday is for YOU, {name}. Not grading.","Weekend warrior, {name}? Don't burn out.","{name}, the building is lonely on weekends. Go live your life."],
  sandbox: ["Training mode, {name}! Break stuff. It's fine.","Nothing's real here, {name}. Experiment away.","Sandbox is on, {name}. Play around, learn the ropes."]
};

const GREETINGS = { morning: "Good morning, {name}! Let's make today count.", afternoon: "Afternoon, {name}! You're halfway there.", evening: "Still at it, {name}? You're dedicated.", night: "It's late, {name}. Don't forget to take care of yourself." };

const HINTS = {
  hallpass: "This is where you send students out, {name}. Pick a student, pick a place, done.",
  infractions: "Log behavior stuff here, {name}. It also tracks parent contacts and MTSS interventions.",
  incentives: "Give points here! Students get 40%, their house gets 60%.",
  safety: "Conflict groups and lockdown controls, {name}. The serious stuff.",
  communication: "Send announcements to every teacher in your school, {name}.",
  analytics: "Charts, MTSS reports, who's going where and when. All the data, {name}.",
  records: "Search any student's history, {name}. Passes, infractions, points—it's all here.",
  admin: "The Box, {name}. Upload rosters, tweak settings, run the show.",
  waitlist: "That spot's full, {name}. Student's in line—they'll get 3 minutes when it opens."
};

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const getTimeContext = () => {
  const now = new Date(), hour = now.getHours(), day = now.getDay();
  if (day === 0 || day === 6) return 'weekend';
  if (hour >= 0 && hour < 5) return 'veryLate';
  if (hour >= 5 && hour < 6) return 'night';
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'afterHours';
  if (hour >= 21) return 'lateNight';
  return 'afternoon';
};

const fillTemplate = (t, c = {}) => t.replace(/{name}/g, c.name || 'friend').replace(/{student}/g, c.student || 'Student').replace(/{destination}/g, c.destination || 'destination').replace(/{minutes}/g, c.minutes || '?');

// ============================================
// END PROTECTED MESSAGE LOGIC
// ============================================

const CORNERS = [{ bottom: 24, right: 24 }, { bottom: 24, left: 24 }, { top: 100, right: 24 }, { top: 100, left: 24 }];

const MOOD_CONFIGS = {
  happy: { gradient: 'from-indigo-400/40', glow: 'rgba(99,102,241,0.4)', pupil: 'bg-emerald-400' },
  party: { gradient: 'from-emerald-400/40', glow: 'rgba(52,211,153,0.5)', pupil: 'bg-emerald-300' },
  high5: { gradient: 'from-sky-400/40', glow: 'rgba(56,189,248,0.4)', pupil: 'bg-sky-300' },
  scan: { gradient: 'from-sky-400/40', glow: 'rgba(56,189,248,0.4)', pupil: 'bg-sky-300' },
  siren: { gradient: 'from-red-500/50', glow: 'rgba(239,68,68,0.6)', pupil: 'bg-red-400' },
  wellness: { gradient: 'from-amber-400/40', glow: 'rgba(251,191,36,0.4)', pupil: 'bg-amber-300' },
  alert: { gradient: 'from-orange-400/40', glow: 'rgba(251,146,60,0.4)', pupil: 'bg-orange-300' },
  warn: { gradient: 'from-orange-500/50', glow: 'rgba(249,115,22,0.5)', pupil: 'bg-orange-400' },
  sad: { gradient: 'from-slate-400/40', glow: 'rgba(148,163,184,0.3)', pupil: 'bg-slate-400' },
  guide: { gradient: 'from-purple-400/40', glow: 'rgba(192,132,252,0.4)', pupil: 'bg-purple-300' },
  waitlist: { gradient: 'from-amber-400/40', glow: 'rgba(251,191,36,0.4)', pupil: 'bg-amber-300' },
};

const StrideBot = forwardRef(function StrideBot({ theme = 'obsidian', lockdown = false, alertLevel = 'normal', userGreeting, sandboxMode = false, botConfig = {}, activeBroadcast = null }, ref) {
  const [open, setOpen] = useState(true);
  const [minimized, setMinimized] = useState(false);
  const [mood, setMood] = useState('happy');
  const [message, setMessage] = useState('');
  const [actions, setActions] = useState([]);
  const [lastPushAt, setLastPushAt] = useState(0);
  const [blinking, setBlink] = useState(false);
  const [hasNotification, setHasNotification] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [position] = useState(CORNERS[0]);
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const pupilX = useSpring(useTransform(mouseX, [-500, 500], [-4, 4]), { stiffness: 300, damping: 30 });
  const pupilY = useSpring(useTransform(mouseY, [-500, 500], [-4, 4]), { stiffness: 300, damping: 30 });
  
  const botRef = useRef(null);
  const timerRef = useRef(null);
  const blinkRef = useRef(null);
  const customMsgRef = useRef(null);
  const lastBroadcastIdRef = useRef(null);

  const userName = userGreeting?.firstName || 'friend';
  const customMessages = botConfig?.customMessages || [];
  const moodConfig = MOOD_CONFIGS[mood] || MOOD_CONFIGS.happy;

  useEffect(() => {
    if (!open || minimized) return;
    const handleMouseMove = (e) => {
      if (!botRef.current) return;
      const rect = botRef.current.getBoundingClientRect();
      mouseX.set(e.clientX - rect.left - rect.width / 2);
      mouseY.set(e.clientY - rect.top - rect.height / 2);
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [open, minimized, mouseX, mouseY]);

  useEffect(() => {
    if (!open || minimized) return;
    const scheduleBlink = () => {
      blinkRef.current = setTimeout(() => { setBlink(true); setTimeout(() => setBlink(false), 150); scheduleBlink(); }, 2000 + Math.random() * 3000);
    };
    scheduleBlink();
    return () => clearTimeout(blinkRef.current);
  }, [open, minimized]);

  const push = useCallback((nextMood, ctx = {}) => {
    const now = Date.now();
    if (!['siren', 'guide'].includes(nextMood) && now - lastPushAt < 600) return;
    setLastPushAt(now);
    setMood(nextMood);
    setHasNotification(true);
    setActions(ctx.actions || []);
    if (minimized && ['guide', 'siren', 'alert'].includes(nextMood)) setMinimized(false);
    if (minimized) return;
    const context = { name: userName, ...ctx };
    if (ctx.message) { setMessage(fillTemplate(ctx.message, context)); return; }
    const msgs = MESSAGES[nextMood] || MESSAGES.happy;
    if (msgs.length > 0) setMessage(fillTemplate(pick(msgs), context));
  }, [lastPushAt, minimized, userName]);

  const showHint = useCallback((buttonId) => {
    const hint = HINTS[buttonId];
    if (hint) { setMood('guide'); setMessage(fillTemplate(hint, { name: userName })); setHasNotification(true); if (minimized) setMinimized(false); }
  }, [userName, minimized]);

  const showBroadcast = useCallback((broadcast) => {
    if (!broadcast) return;
    setMood('alert');
    const prefix = broadcast.priority === 'urgent' ? '🚨 ' : broadcast.priority === 'important' ? '⚠️ ' : '📢 ';
    setMessage(`${prefix}From ${broadcast.senderName}: "${broadcast.message}"`);
    setHasNotification(true);
    if (minimized) setMinimized(false);
  }, [minimized]);

  useImperativeHandle(ref, () => ({ push, showHint, showBroadcast }));

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

  useEffect(() => {
    if (!open || lockdown) return;
    const schedule = () => { timerRef.current = setTimeout(() => { push('wellness'); schedule(); }, (7 + Math.random() * 6) * 60 * 1000); };
    schedule();
    return () => clearTimeout(timerRef.current);
  }, [open, lockdown, push]);

  useEffect(() => {
    if (!customMessages.length || lockdown) return;
    const showCustom = () => { const msg = pick(customMessages); if (msg?.text) { setMood('alert'); setMessage(fillTemplate(msg.text, { name: userName })); setHasNotification(true); if (minimized) setMinimized(false); } };
    customMsgRef.current = setInterval(showCustom, (5 + Math.random() * 5) * 60 * 1000);
    return () => clearInterval(customMsgRef.current);
  }, [customMessages, lockdown, userName, minimized]);

  useEffect(() => {
    if (!activeBroadcast || activeBroadcast.id === lastBroadcastIdRef.current) return;
    lastBroadcastIdRef.current = activeBroadcast.id;
    showBroadcast(activeBroadcast);
  }, [activeBroadcast, showBroadcast]);

  useEffect(() => { if (open) { if (lockdown) push('siren'); else if (mood === 'siren') push('happy'); } }, [lockdown, open, mood, push]);
  useEffect(() => { if (alertLevel === 'hold' && mood !== 'siren') setMood('warn'); }, [alertLevel, mood]);

  const toggleMinimize = () => { setMinimized(!minimized); if (minimized) setHasNotification(false); };
  const handleAction = (action) => { window.dispatchEvent(new CustomEvent('stridebot-action', { detail: action })); setActions([]); };
  const handleHide = () => { setIsVisible(false); setTimeout(() => setOpen(false), 400); };

  if (!open) return null;

  if (minimized) {
    return (
      <motion.div className="fixed z-50" style={position} initial={{ scale: 0 }} animate={{ scale: 1 }}>
        <motion.button onClick={toggleMinimize} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
          className={`w-14 h-14 rounded-full border-2 flex items-center justify-center backdrop-blur-xl ${mood === 'siren' ? 'border-red-500 bg-red-500/20' : 'border-white/20 bg-card/80'}`}
          style={{ boxShadow: `0 0 30px ${moodConfig.glow}` }}>
          <div className="flex items-center gap-1.5">
            <motion.div className={`w-2.5 h-3 rounded-full ${moodConfig.pupil}`} style={{ scaleY: blinking ? 0.2 : 1 }} />
            <motion.div className={`w-2.5 h-3 rounded-full ${moodConfig.pupil}`} style={{ scaleY: blinking ? 0.2 : 1 }} />
          </div>
          {hasNotification && <motion.div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full" animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }} />}
        </motion.button>
      </motion.div>
    );
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div ref={botRef} className="fixed z-50" style={position}
          initial={{ opacity: 0, scale: 0, rotate: -180 }} animate={{ opacity: 1, scale: 1, rotate: 0 }}
          exit={{ opacity: 0, scale: 0, rotate: 180 }} transition={{ type: 'spring', damping: 20 }}
          drag dragMomentum={false} onDragStart={() => setIsDragging(true)} onDragEnd={() => setIsDragging(false)}>
          <div className="relative">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className={`absolute bottom-[110px] right-0 w-[300px] p-5 rounded-2xl border shadow-2xl backdrop-blur-xl ${theme === 'aero' ? 'bg-white/95 border-slate-200' : 'bg-card/90 border-white/10'}`}
              style={{ boxShadow: `0 20px 60px ${moodConfig.glow}` }}>
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />
              <div className={`text-xs font-bold mb-2 ${theme === 'aero' ? 'text-slate-500' : 'text-slate-400'}`}>
                StrideBot {lockdown ? '• EMERGENCY' : sandboxMode ? '• Training' : mood === 'wellness' ? '• Wellness' : mood === 'guide' ? '• Guide' : ''}
              </div>
              <motion.div key={message} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`text-sm font-semibold leading-relaxed ${theme === 'aero' ? 'text-slate-800' : 'text-white'}`}>
                {message}
              </motion.div>
              {actions.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {actions.map((a, i) => (
                    <motion.button key={i} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => handleAction(a)}
                      className={`px-4 py-2 text-xs font-bold rounded-xl ${theme === 'aero' ? 'bg-slate-100 text-slate-700' : 'bg-white/10'}`}>{a.label}</motion.button>
                  ))}
                </div>
              )}
              <div className="mt-4 flex justify-between">
                <motion.button whileHover={{ scale: 1.05 }} onClick={() => push(lockdown ? 'siren' : 'happy')} className="text-xs font-bold opacity-70 hover:opacity-100">Reset</motion.button>
                <motion.button whileHover={{ scale: 1.05 }} onClick={handleHide} className="text-xs font-bold opacity-70 hover:opacity-100">Hide</motion.button>
              </div>
            </motion.div>

            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => push('happy')} onDoubleClick={toggleMinimize}
              className={`relative w-24 h-24 rounded-full flex items-center justify-center overflow-hidden ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
              style={{ background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2), transparent 50%)`, boxShadow: `0 0 60px ${moodConfig.glow}, inset 0 -10px 30px rgba(0,0,0,0.2)` }}>
              <motion.div className={`absolute inset-[-4px] rounded-full bg-gradient-to-b ${moodConfig.gradient} to-transparent`}
                animate={mood === 'siren' ? { opacity: [0.5, 1, 0.5] } : { opacity: 0.7 }} transition={{ repeat: mood === 'siren' ? Infinity : 0, duration: 0.5 }} />
              <div className={`absolute inset-1 rounded-full backdrop-blur-xl border ${theme === 'aero' ? 'bg-white/80 border-white' : 'bg-slate-900/60 border-white/20'}`}>
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 via-transparent to-transparent" />
              </div>
              <div className={`relative z-10 flex items-center gap-3 ${mood === 'party' ? 'animate-bounce' : ''}`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${theme === 'aero' ? 'bg-slate-200' : 'bg-white/20'}`}>
                  <motion.div className={`w-3 h-3 rounded-full ${moodConfig.pupil}`} style={{ x: pupilX, y: pupilY, scaleY: blinking ? 0.2 : 1 }} />
                </div>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${theme === 'aero' ? 'bg-slate-200' : 'bg-white/20'}`}>
                  <motion.div className={`w-3 h-3 rounded-full ${moodConfig.pupil}`} style={{ x: pupilX, y: pupilY, scaleY: blinking ? 0.2 : 1 }} />
                </div>
              </div>
              {mood === 'party' && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-1 -right-1 text-lg">✨</motion.div>}
              {mood === 'wellness' && <div className="absolute -top-1 -right-1 text-lg">💧</div>}
              {mood === 'guide' && <div className="absolute -top-1 -right-1 text-purple-400 font-black">?</div>}
              {sandboxMode && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-amber-500 text-black text-[8px] font-bold rounded-full">SANDBOX</div>}
              {(mood === 'siren' || lockdown) && <motion.div className="absolute inset-0 rounded-full border-4 border-red-500/70" animate={{ scale: [1, 1.3, 1], opacity: [1, 0, 1] }} transition={{ repeat: Infinity, duration: 1 }} />}
              {mood === 'party' && [...Array(12)].map((_, i) => (
                <motion.div key={i} className="absolute w-2 h-2 rounded-full" style={{ background: ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'][i % 6], left: '50%', top: '50%' }}
                  initial={{ scale: 0, x: 0, y: 0 }} animate={{ scale: [0, 1, 0], x: Math.cos(i * 30 * Math.PI / 180) * 60, y: Math.sin(i * 30 * Math.PI / 180) * 60 }}
                  transition={{ duration: 0.8, delay: i * 0.05 }} />
              ))}
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export default StrideBot;
