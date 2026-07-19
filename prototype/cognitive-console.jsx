import React, { useState, useEffect, useRef, useCallback } from "react";

// ── palette ──────────────────────────────────────────────────────────────
const C = {
  bg: "#0B0F17",
  panel: "#141B27",
  panelHi: "#1B2432",
  border: "#26303F",
  text: "#E4EAF2",
  muted: "#8091A6",
  cyan: "#2FD4E8",
  violet: "#9D7BFF",
  amber: "#F5B94A",
  rose: "#FF6B7A",
  green: "#57E39A",
  blue: "#5AA9FF",
};
const mono = { fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" };
const now = () => performance.now();

// ── shared bits ────────────────────────────────────────────────────────────
function Pulse() {
  return (
    <div className="flex items-center gap-1" style={mono}>
      <span className="inline-block h-2 w-2 rounded-full" style={{ background: C.cyan, boxShadow: `0 0 8px ${C.cyan}` }} />
      <span className="text-xs tracking-widest" style={{ color: C.muted }}>LIVE</span>
    </div>
  );
}
function Btn({ children, onClick, color = C.cyan, big, style, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="rounded-xl font-semibold transition active:scale-95 disabled:opacity-40"
      style={{ background: "transparent", border: `1.5px solid ${color}`, color,
        padding: big ? "16px 22px" : "11px 18px", fontSize: big ? 17 : 15, letterSpacing: "0.02em", ...style }}>
      {children}
    </button>
  );
}
function StatLine({ label, value, color = C.text }) {
  return (
    <div className="flex items-baseline justify-between py-1">
      <span className="text-xs tracking-wider" style={{ color: C.muted, ...mono }}>{label}</span>
      <span className="text-base font-bold" style={{ color, ...mono }}>{value}</span>
    </div>
  );
}
function GameShell({ title, sub, color, onExit, children }) {
  return (
    <div className="flex min-h-full flex-col">
      <div className="mb-6 flex items-center justify-between">
        <button onClick={onExit} className="text-sm transition active:scale-95" style={{ color: C.muted, ...mono }}>← exit</button>
        <div className="text-right">
          <div className="text-lg font-extrabold tracking-tight" style={{ color }}>{title}</div>
          <div className="text-xs tracking-widest" style={{ color: C.muted, ...mono }}>{sub.toUpperCase()}</div>
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center">{children}</div>
    </div>
  );
}
function Results({ headline, tag, color, children, onAgain, onExit, best }) {
  return (
    <div className="flex w-full flex-col items-center gap-5">
      <div className="text-center">
        <div className="text-6xl font-extrabold tracking-tight" style={{ color }}>{headline}</div>
        <div className="mt-1 text-xs tracking-widest" style={{ color: C.muted, ...mono }}>{tag.toUpperCase()}</div>
        {best != null && (
          <div className="mt-2 text-xs" style={{ color: C.muted, ...mono }}>
            SESSION BEST · <span style={{ color }}>{best}</span>
          </div>
        )}
      </div>
      {children && (
        <div className="w-full rounded-xl p-4" style={{ background: C.panel, border: `1px solid ${C.border}` }}>{children}</div>
      )}
      <div className="flex w-full gap-3">
        <Btn onClick={onAgain} color={color} style={{ flex: 1 }}>AGAIN</Btn>
        <Btn onClick={onExit} color={C.muted} style={{ flex: 1 }}>MENU</Btn>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// 1. N-BACK — working memory (2-back / 3-back)
// ════════════════════════════════════════════════════════════════════════
function NBack({ onExit, onRecord, bestFor }) {
  const TOTAL = 24;
  const ISI = 2400;
  const [phase, setPhase] = useState("intro");
  const [N, setN] = useState(2);
  const [seq, setSeq] = useState([]);
  const [idx, setIdx] = useState(-1);
  const [active, setActive] = useState(null);
  const [flash, setFlash] = useState(null);
  const stats = useRef({ hit: 0, miss: 0, fa: 0, cr: 0 });
  const respondedRef = useRef(false);
  const timer = useRef(null);

  const buildSeq = (n) => {
    const s = [];
    for (let i = 0; i < TOTAL; i++) {
      if (i >= n && Math.random() < 0.32) s.push(s[i - n]);
      else s.push(Math.floor(Math.random() * 9));
    }
    return s;
  };
  const start = (n) => {
    const nn = n || N;
    setN(nn);
    stats.current = { hit: 0, miss: 0, fa: 0, cr: 0 };
    setSeq(buildSeq(nn));
    setIdx(0);
    setPhase("run");
  };

  useEffect(() => {
    if (phase !== "run" || idx < 0) return;
    if (idx >= TOTAL) {
      const s = stats.current;
      const scored = s.hit + s.miss + s.fa + s.cr;
      const acc = scored ? Math.round(((s.hit + s.cr) / scored) * 100) : 0;
      onRecord({ game: "nback", label: `N-Back ${N}`, value: acc, unit: "%", higher: true, key: `nback${N}` });
      setPhase("done");
      return;
    }
    setActive(seq[idx]);
    respondedRef.current = false;
    timer.current = setTimeout(() => {
      const isMatch = idx >= N && seq[idx] === seq[idx - N];
      if (isMatch && !respondedRef.current) { stats.current.miss++; setFlash("miss"); }
      else if (!isMatch && !respondedRef.current) { stats.current.cr++; }
      setActive(null);
      setTimeout(() => { setFlash(null); setIdx((i) => i + 1); }, 260);
    }, ISI);
    return () => clearTimeout(timer.current);
  }, [phase, idx, seq, N]);

  const callMatch = () => {
    if (respondedRef.current || idx < 0 || idx >= TOTAL) return;
    respondedRef.current = true;
    const isMatch = idx >= N && seq[idx] === seq[idx - N];
    if (isMatch) { stats.current.hit++; setFlash("hit"); }
    else { stats.current.fa++; setFlash("fa"); }
  };

  const s = stats.current;
  const scored = s.hit + s.miss + s.fa + s.cr;
  const acc = scored ? Math.round(((s.hit + s.cr) / scored) * 100) : 0;

  return (
    <GameShell title="N-BACK" sub={`working memory · ${N}-back`} color={C.cyan} onExit={onExit}>
      {phase === "intro" && (
        <div className="flex flex-col items-center gap-5 text-center">
          <p className="text-sm leading-relaxed" style={{ color: C.muted }}>
            A cell lights up every couple of seconds. Tap <b style={{ color: C.cyan }}>MATCH</b> when the lit
            cell equals the one from <b style={{ color: C.cyan }}>N steps back</b>. 3-back is a real step up.
          </p>
          <div className="flex gap-3">
            <Btn onClick={() => start(2)} big color={C.cyan}>2-BACK</Btn>
            <Btn onClick={() => start(3)} big color={C.violet}>3-BACK</Btn>
          </div>
        </div>
      )}
      {phase === "run" && (
        <div className="flex flex-col items-center gap-6">
          <div className="text-xs tracking-widest" style={{ color: C.muted, ...mono }}>{idx + 1} / {TOTAL}</div>
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 9 }).map((_, i) => {
              const on = active === i;
              const glow = flash === "hit" ? C.green : flash === "fa" ? C.rose : C.cyan;
              return <div key={i} className="rounded-xl transition-all duration-150"
                style={{ width: 74, height: 74, background: on ? glow : C.panelHi,
                  border: `1px solid ${on ? glow : C.border}`, boxShadow: on ? `0 0 22px ${glow}` : "none" }} />;
            })}
          </div>
          <div className="h-5 text-sm font-semibold" style={mono}>
            {flash === "miss" && <span style={{ color: C.rose }}>missed a match</span>}
            {flash === "hit" && <span style={{ color: C.green }}>match</span>}
            {flash === "fa" && <span style={{ color: C.rose }}>not a match</span>}
          </div>
          <Btn onClick={callMatch} big color={C.cyan} style={{ minWidth: 200 }}>MATCH</Btn>
        </div>
      )}
      {phase === "done" && (
        <Results color={C.cyan} onAgain={() => start(N)} onExit={onExit} headline={`${acc}%`} tag={`${N}-back accuracy`} best={bestFor(`nback${N}`)}>
          <StatLine label="HITS" value={s.hit} color={C.green} />
          <StatLine label="MISSED MATCHES" value={s.miss} color={C.rose} />
          <StatLine label="FALSE ALARMS" value={s.fa} color={C.rose} />
          <StatLine label="CORRECT PASSES" value={s.cr} color={C.text} />
        </Results>
      )}
    </GameShell>
  );
}

// ════════════════════════════════════════════════════════════════════════
// 2. STROOP
// ════════════════════════════════════════════════════════════════════════
const SC = [
  { name: "RED", hex: "#FF6B7A" }, { name: "GREEN", hex: "#57E39A" },
  { name: "BLUE", hex: "#5AA9FF" }, { name: "AMBER", hex: "#F5B94A" },
];
function Stroop({ onExit, onRecord, bestFor }) {
  const LEN = 45;
  const [phase, setPhase] = useState("intro");
  const [trial, setTrial] = useState(null);
  const [time, setTime] = useState(LEN);
  const [flash, setFlash] = useState(null);
  const score = useRef({ correct: 0, wrong: 0 });
  const next = () => {
    const word = SC[Math.floor(Math.random() * 4)];
    let ink = SC[Math.floor(Math.random() * 4)];
    if (Math.random() < 0.75) while (ink.name === word.name) ink = SC[Math.floor(Math.random() * 4)];
    setTrial({ word, ink });
  };
  const start = () => { score.current = { correct: 0, wrong: 0 }; setTime(LEN); setPhase("run"); next(); };
  useEffect(() => {
    if (phase !== "run") return;
    if (time <= 0) {
      onRecord({ game: "stroop", label: "Stroop", value: score.current.correct, unit: "", higher: true, key: "stroop" });
      setPhase("done"); return;
    }
    const t = setTimeout(() => setTime((x) => x - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, time]);
  const answer = (picked) => {
    if (!trial) return;
    if (picked === trial.ink.name) { score.current.correct++; setFlash("ok"); }
    else { score.current.wrong++; setFlash("no"); }
    setTimeout(() => setFlash(null), 150); next();
  };
  const s = score.current, total = s.correct + s.wrong, acc = total ? Math.round((s.correct / total) * 100) : 0;
  return (
    <GameShell title="STROOP" sub="attention · inhibition" color={C.violet} onExit={onExit}>
      {phase === "intro" && (
        <div className="flex flex-col items-center gap-5 text-center">
          <p className="text-sm leading-relaxed" style={{ color: C.muted }}>
            Tap the button matching the <b style={{ color: C.violet }}>ink color</b>, not the word. 45 seconds.
            The urge to read the word is the enemy.
          </p>
          <Btn onClick={start} big color={C.violet}>START</Btn>
        </div>
      )}
      {phase === "run" && trial && (
        <div className="flex w-full flex-col items-center gap-6">
          <div className="flex w-full items-center justify-between" style={mono}>
            <span className="text-xs tracking-widest" style={{ color: C.muted }}>{s.correct} correct</span>
            <span className="text-sm font-bold" style={{ color: time <= 10 ? C.rose : C.text }}>{time}s</span>
          </div>
          <div className="flex h-32 w-full items-center justify-center rounded-2xl"
            style={{ background: C.panelHi, border: `1px solid ${flash === "ok" ? C.green : flash === "no" ? C.rose : C.border}`, transition: "border-color 120ms" }}>
            <span className="text-5xl font-extrabold tracking-tight" style={{ color: trial.ink.hex }}>{trial.word.name}</span>
          </div>
          <div className="grid w-full grid-cols-2 gap-3">
            {SC.map((c) => (
              <button key={c.name} onClick={() => answer(c.name)}
                className="rounded-xl py-4 font-bold transition active:scale-95"
                style={{ background: c.hex, color: "#0B0F17", ...mono }}>{c.name}</button>
            ))}
          </div>
        </div>
      )}
      {phase === "done" && (
        <Results color={C.violet} onAgain={start} onExit={onExit} headline={s.correct} tag="correct answers" best={bestFor("stroop")}>
          <StatLine label="ACCURACY" value={`${acc}%`} color={C.violet} />
          <StatLine label="CORRECT" value={s.correct} color={C.green} />
          <StatLine label="WRONG" value={s.wrong} color={C.rose} />
        </Results>
      )}
    </GameShell>
  );
}

// ════════════════════════════════════════════════════════════════════════
// 3. SEQUENCE — memory span
// ════════════════════════════════════════════════════════════════════════
const PADS = [
  { hex: "#2FD4E8", dim: "#123842" }, { hex: "#9D7BFF", dim: "#2A2247" },
  { hex: "#57E39A", dim: "#14372A" }, { hex: "#F5B94A", dim: "#3C2F14" },
];
function Sequence({ onExit, onRecord, bestFor }) {
  const [phase, setPhase] = useState("intro");
  const [seq, setSeq] = useState([]);
  const [lit, setLit] = useState(null);
  const [best, setBest] = useState(0);
  const inputPos = useRef(0);
  const accepting = useRef(false);
  const playback = useCallback((s) => {
    setPhase("show"); accepting.current = false;
    let i = 0;
    const step = () => {
      if (i >= s.length) { setLit(null); accepting.current = true; inputPos.current = 0; setPhase("input"); return; }
      setLit(s[i]);
      setTimeout(() => { setLit(null); setTimeout(() => { i++; step(); }, 200); }, 480);
    };
    setTimeout(step, 500);
  }, []);
  const start = () => { const s = [Math.floor(Math.random() * 4)]; setSeq(s); setBest(0); playback(s); };
  const grow = (prev) => { const s = [...prev, Math.floor(Math.random() * 4)]; setSeq(s); playback(s); };
  const finish = (chain) => {
    setBest(chain);
    onRecord({ game: "sequence", label: "Sequence", value: chain, unit: "", higher: true, key: "sequence" });
    setTimeout(() => setPhase("done"), 300);
  };
  const tap = (i) => {
    if (!accepting.current) return;
    setLit(i); setTimeout(() => setLit(null), 160);
    if (seq[inputPos.current] === i) {
      inputPos.current++;
      if (inputPos.current === seq.length) {
        accepting.current = false; setBest(seq.length); setTimeout(() => grow(seq), 550);
      }
    } else { accepting.current = false; finish(seq.length - 1); }
  };
  return (
    <GameShell title="SEQUENCE" sub="memory span" color={C.green} onExit={onExit}>
      {phase === "intro" && (
        <div className="flex flex-col items-center gap-5 text-center">
          <p className="text-sm leading-relaxed" style={{ color: C.muted }}>
            Watch the pads flash, then repeat the pattern. Each round adds one step. One wrong tap ends the run.
          </p>
          <Btn onClick={start} big color={C.green}>START</Btn>
        </div>
      )}
      {(phase === "show" || phase === "input") && (
        <div className="flex flex-col items-center gap-6">
          <div className="text-xs tracking-widest" style={{ color: C.muted, ...mono }}>
            LENGTH {seq.length} · {phase === "show" ? "WATCH" : "YOUR TURN"}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {PADS.map((p, i) => (
              <button key={i} onClick={() => tap(i)} className="rounded-2xl transition-all duration-100"
                style={{ width: 96, height: 96, background: lit === i ? p.hex : p.dim,
                  border: `1px solid ${lit === i ? p.hex : C.border}`, boxShadow: lit === i ? `0 0 26px ${p.hex}` : "none" }} />
            ))}
          </div>
        </div>
      )}
      {phase === "done" && (
        <Results color={C.green} onAgain={start} onExit={onExit} headline={best} tag="longest chain" best={bestFor("sequence")}>
          <p className="text-xs leading-relaxed" style={{ color: C.muted }}>
            {best <= 4 ? "Typical span is around 5 to 9 items. Keep going."
              : best <= 7 ? "Right in the classic 'magical number seven' band."
              : "Above average span. Strong chunking."}
          </p>
        </Results>
      )}
    </GameShell>
  );
}

// ════════════════════════════════════════════════════════════════════════
// 4. MATH SPRINT — processing speed
// ════════════════════════════════════════════════════════════════════════
function MathSprint({ onExit, onRecord, bestFor }) {
  const LEN = 60;
  const [phase, setPhase] = useState("intro");
  const [q, setQ] = useState(null);
  const [time, setTime] = useState(LEN);
  const [flash, setFlash] = useState(null);
  const [streak, setStreak] = useState(0);
  const score = useRef({ correct: 0, wrong: 0, bestStreak: 0 });
  const make = () => {
    const ops = ["+", "-", "×"]; const op = ops[Math.floor(Math.random() * 3)];
    let a, b, ans;
    if (op === "+") { a = 5 + Math.floor(Math.random() * 45); b = 5 + Math.floor(Math.random() * 45); ans = a + b; }
    else if (op === "-") { a = 20 + Math.floor(Math.random() * 60); b = 5 + Math.floor(Math.random() * (a - 4)); ans = a - b; }
    else { a = 3 + Math.floor(Math.random() * 10); b = 3 + Math.floor(Math.random() * 10); ans = a * b; }
    const opts = new Set([ans]);
    while (opts.size < 4) { const d = ans + (Math.floor(Math.random() * 13) - 6); if (d >= 0) opts.add(d); }
    setQ({ a, b, op, ans, choices: [...opts].sort(() => Math.random() - 0.5) });
  };
  const start = () => { score.current = { correct: 0, wrong: 0, bestStreak: 0 }; setStreak(0); setTime(LEN); setPhase("run"); make(); };
  useEffect(() => {
    if (phase !== "run") return;
    if (time <= 0) {
      onRecord({ game: "math", label: "Math Sprint", value: score.current.correct, unit: "", higher: true, key: "math" });
      setPhase("done"); return;
    }
    const t = setTimeout(() => setTime((x) => x - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, time]);
  const answer = (v) => {
    if (!q) return;
    if (v === q.ans) { score.current.correct++; const ns = streak + 1; setStreak(ns); score.current.bestStreak = Math.max(score.current.bestStreak, ns); setFlash("ok"); }
    else { score.current.wrong++; setStreak(0); setFlash("no"); }
    setTimeout(() => setFlash(null), 130); make();
  };
  const s = score.current, total = s.correct + s.wrong, acc = total ? Math.round((s.correct / total) * 100) : 0;
  return (
    <GameShell title="MATH SPRINT" sub="processing speed" color={C.amber} onExit={onExit}>
      {phase === "intro" && (
        <div className="flex flex-col items-center gap-5 text-center">
          <p className="text-sm leading-relaxed" style={{ color: C.muted }}>
            As many as you can in 60 seconds. Four choices, one right. Chain correct answers for a streak.
          </p>
          <Btn onClick={start} big color={C.amber}>START</Btn>
        </div>
      )}
      {phase === "run" && q && (
        <div className="flex w-full flex-col items-center gap-6">
          <div className="flex w-full items-center justify-between" style={mono}>
            <span className="text-xs tracking-widest" style={{ color: streak > 1 ? C.amber : C.muted }}>
              {streak > 1 ? `🔥 ${streak} streak` : `${s.correct} solved`}
            </span>
            <span className="text-sm font-bold" style={{ color: time <= 10 ? C.rose : C.text }}>{time}s</span>
          </div>
          <div className="flex h-28 w-full items-center justify-center rounded-2xl"
            style={{ background: C.panelHi, border: `1px solid ${flash === "ok" ? C.green : flash === "no" ? C.rose : C.border}`, transition: "border-color 100ms" }}>
            <span className="text-4xl font-extrabold" style={{ color: C.text, ...mono }}>{q.a} {q.op} {q.b}</span>
          </div>
          <div className="grid w-full grid-cols-2 gap-3">
            {q.choices.map((c, i) => (
              <button key={i} onClick={() => answer(c)} className="rounded-xl py-5 text-2xl font-bold transition active:scale-95"
                style={{ background: C.panelHi, border: `1px solid ${C.border}`, color: C.text, ...mono }}>{c}</button>
            ))}
          </div>
        </div>
      )}
      {phase === "done" && (
        <Results color={C.amber} onAgain={start} onExit={onExit} headline={s.correct} tag="solved in 60s" best={bestFor("math")}>
          <StatLine label="ACCURACY" value={`${acc}%`} color={C.amber} />
          <StatLine label="CORRECT" value={s.correct} color={C.green} />
          <StatLine label="WRONG" value={s.wrong} color={C.rose} />
          <StatLine label="BEST STREAK" value={s.bestStreak} color={C.text} />
        </Results>
      )}
    </GameShell>
  );
}

// ════════════════════════════════════════════════════════════════════════
// 5. REACTION — raw response time
// ════════════════════════════════════════════════════════════════════════
function Reaction({ onExit, onRecord, bestFor }) {
  const TRIALS = 5;
  const [phase, setPhase] = useState("intro"); // intro | wait | go | early | done
  const [times, setTimes] = useState([]);
  const goAt = useRef(0);
  const waitTimer = useRef(null);
  const trialRef = useRef(0);

  const scheduleTrial = useCallback(() => {
    setPhase("wait");
    const delay = 1400 + Math.random() * 2600;
    waitTimer.current = setTimeout(() => { goAt.current = now(); setPhase("go"); }, delay);
  }, []);
  const start = () => { setTimes([]); trialRef.current = 0; scheduleTrial(); };
  useEffect(() => () => clearTimeout(waitTimer.current), []);

  const handleTap = () => {
    if (phase === "wait") {
      clearTimeout(waitTimer.current); setPhase("early");
      return;
    }
    if (phase === "early") { scheduleTrial(); return; }
    if (phase === "go") {
      const rt = Math.round(now() - goAt.current);
      const nt = [...times, rt]; setTimes(nt); trialRef.current++;
      if (trialRef.current >= TRIALS) {
        const best = Math.min(...nt);
        onRecord({ game: "reaction", label: "Reaction", value: best, unit: "ms", higher: false, key: "reaction" });
        setPhase("done");
      } else scheduleTrial();
    }
  };

  const avg = times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;
  const best = times.length ? Math.min(...times) : 0;
  const bg = phase === "go" ? C.green : phase === "early" ? C.rose : C.panelHi;

  return (
    <GameShell title="REACTION" sub="response time" color={C.rose} onExit={onExit}>
      {phase === "intro" && (
        <div className="flex flex-col items-center gap-5 text-center">
          <p className="text-sm leading-relaxed" style={{ color: C.muted }}>
            The panel is dark, then turns <b style={{ color: C.green }}>green</b>. Tap the instant it does.
            5 trials, we keep your fastest. Don't jump early.
          </p>
          <Btn onClick={start} big color={C.rose}>START</Btn>
        </div>
      )}
      {(phase === "wait" || phase === "go" || phase === "early") && (
        <div className="flex w-full flex-col items-center gap-5">
          <div className="text-xs tracking-widest" style={{ color: C.muted, ...mono }}>
            TRIAL {Math.min(trialRef.current + 1, TRIALS)} / {TRIALS}
          </div>
          <button onClick={handleTap} className="flex w-full items-center justify-center rounded-2xl transition-colors"
            style={{ height: 260, background: bg, border: `1px solid ${C.border}` }}>
            <span className="text-xl font-extrabold" style={{ color: phase === "go" ? "#0B0F17" : C.text, ...mono }}>
              {phase === "wait" && "wait…"}
              {phase === "go" && "TAP"}
              {phase === "early" && "too soon — tap to retry"}
            </span>
          </button>
          {times.length > 0 && (
            <div className="text-sm" style={{ color: C.muted, ...mono }}>last: {times[times.length - 1]} ms</div>
          )}
        </div>
      )}
      {phase === "done" && (
        <Results color={C.rose} onAgain={start} onExit={onExit} headline={`${best}`} tag="fastest (ms)" best={bestFor("reaction") != null ? `${bestFor("reaction")} ms` : null}>
          <StatLine label="FASTEST" value={`${best} ms`} color={C.green} />
          <StatLine label="AVERAGE" value={`${avg} ms`} color={C.text} />
          <p className="pt-2 text-xs leading-relaxed" style={{ color: C.muted }}>
            {best < 250 ? "Elite range. Sharp." : best < 350 ? "Solidly average human range." : "A little sluggish — try again warmed up."}
          </p>
        </Results>
      )}
    </GameShell>
  );
}

// ════════════════════════════════════════════════════════════════════════
// 6. GO / NO-GO — response inhibition
// ════════════════════════════════════════════════════════════════════════
function GoNoGo({ onExit, onRecord, bestFor }) {
  const TRIALS = 28, WINDOW = 850, BLANK = 320;
  const [phase, setPhase] = useState("intro"); // intro | run | done
  const [stim, setStim] = useState(null); // { type: 'go'|'nogo' }
  const [flash, setFlash] = useState(null);
  const responded = useRef(false);
  const rts = useRef([]);
  const idxRef = useRef(0);
  const stats = useRef({ hit: 0, omission: 0, commission: 0, cr: 0 });
  const stimAt = useRef(0);
  const timers = useRef([]);

  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  useEffect(() => () => clearTimers(), []);

  const runTrial = useCallback((i) => {
    if (i >= TRIALS) {
      const s = stats.current;
      const acc = Math.round(((s.hit + s.cr) / TRIALS) * 100);
      onRecord({ game: "gonogo", label: "Go / No-Go", value: acc, unit: "%", higher: true, key: "gonogo" });
      setPhase("done"); return;
    }
    const type = Math.random() < 0.68 ? "go" : "nogo";
    responded.current = false;
    stimAt.current = now();
    setStim({ type });
    const t1 = setTimeout(() => {
      if (!responded.current) {
        if (type === "go") stats.current.omission++;
        else stats.current.cr++;
      }
      setStim(null);
      const t2 = setTimeout(() => { idxRef.current = i + 1; runTrial(i + 1); }, BLANK);
      timers.current.push(t2);
    }, WINDOW);
    timers.current.push(t1);
  }, []);

  const start = () => {
    clearTimers();
    stats.current = { hit: 0, omission: 0, commission: 0, cr: 0 };
    rts.current = []; idxRef.current = 0;
    setPhase("run"); runTrial(0);
  };
  const tap = () => {
    if (phase !== "run" || !stim || responded.current) return;
    responded.current = true;
    if (stim.type === "go") { stats.current.hit++; rts.current.push(now() - stimAt.current); setFlash("ok"); }
    else { stats.current.commission++; setFlash("no"); }
    setTimeout(() => setFlash(null), 160);
  };

  const s = stats.current;
  const done = s.hit + s.omission + s.commission + s.cr;
  const acc = done ? Math.round(((s.hit + s.cr) / done) * 100) : 0;
  const avgRt = rts.current.length ? Math.round(rts.current.reduce((a, b) => a + b, 0) / rts.current.length) : 0;

  return (
    <GameShell title="GO / NO-GO" sub="response inhibition" color={C.blue} onExit={onExit}>
      {phase === "intro" && (
        <div className="flex flex-col items-center gap-5 text-center">
          <p className="text-sm leading-relaxed" style={{ color: C.muted }}>
            Tap fast on a <b style={{ color: C.green }}>green circle</b>. Do <b style={{ color: C.rose }}>nothing</b> on a
            <b style={{ color: C.rose }}> red square</b>. It's easy to go; the skill is stopping.
          </p>
          <Btn onClick={start} big color={C.blue}>START</Btn>
        </div>
      )}
      {phase === "run" && (
        <div className="flex w-full flex-col items-center gap-5">
          <div className="text-xs tracking-widest" style={{ color: C.muted, ...mono }}>{idxRef.current + 1} / {TRIALS}</div>
          <button onClick={tap} className="flex w-full items-center justify-center rounded-2xl"
            style={{ height: 260, background: C.panelHi, border: `1px solid ${flash === "no" ? C.rose : flash === "ok" ? C.green : C.border}`, transition: "border-color 120ms" }}>
            {stim ? (
              stim.type === "go" ? (
                <span style={{ width: 120, height: 120, borderRadius: "50%", background: C.green, boxShadow: `0 0 30px ${C.green}` }} />
              ) : (
                <span style={{ width: 120, height: 120, borderRadius: 14, background: C.rose, boxShadow: `0 0 30px ${C.rose}` }} />
              )
            ) : (
              <span style={{ color: C.muted, ...mono }}>·</span>
            )}
          </button>
          <div className="text-sm" style={{ color: C.muted, ...mono }}>hits {s.hit} · slips {s.commission}</div>
        </div>
      )}
      {phase === "done" && (
        <Results color={C.blue} onAgain={start} onExit={onExit} headline={`${acc}%`} tag="accuracy" best={bestFor("gonogo") != null ? `${bestFor("gonogo")}%` : null}>
          <StatLine label="HITS (go)" value={s.hit} color={C.green} />
          <StatLine label="CORRECT STOPS" value={s.cr} color={C.green} />
          <StatLine label="SLIPPED (tapped red)" value={s.commission} color={C.rose} />
          <StatLine label="MISSED (no tap on go)" value={s.omission} color={C.rose} />
          <StatLine label="AVG GO SPEED" value={`${avgRt} ms`} color={C.text} />
        </Results>
      )}
    </GameShell>
  );
}

// ════════════════════════════════════════════════════════════════════════
// SESSION LOG
// ════════════════════════════════════════════════════════════════════════
function LogScreen({ log, onExit, onClear }) {
  return (
    <div className="flex min-h-full flex-col">
      <div className="mb-6 flex items-center justify-between">
        <button onClick={onExit} className="text-sm transition active:scale-95" style={{ color: C.muted, ...mono }}>← exit</button>
        <div className="text-lg font-extrabold tracking-tight" style={{ color: C.text }}>SESSION LOG</div>
      </div>
      {log.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-center">
          <p className="text-sm" style={{ color: C.muted }}>No runs yet. Finish a drill and it lands here.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            {[...log].reverse().map((r, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl px-4 py-3"
                style={{ background: C.panel, border: `1px solid ${C.border}` }}>
                <div>
                  <div className="text-sm font-bold" style={{ color: C.text }}>{r.label}</div>
                  <div className="text-xs" style={{ color: C.muted, ...mono }}>{r.clock}</div>
                </div>
                <div className="text-lg font-extrabold" style={{ color: C.cyan, ...mono }}>{r.value}{r.unit}</div>
              </div>
            ))}
          </div>
          <button onClick={onClear} className="mt-6 text-xs tracking-widest transition active:scale-95"
            style={{ color: C.muted, ...mono }}>CLEAR SESSION LOG</button>
        </>
      )}
    </div>
  );
}

// ── home hub ────────────────────────────────────────────────────────────
const GAMES = [
  { id: "nback", name: "N-Back", faculty: "Working memory", color: C.cyan, glyph: "◉", keys: ["nback2", "nback3"], unit: "%" },
  { id: "stroop", name: "Stroop", faculty: "Attention · inhibition", color: C.violet, glyph: "▲", keys: ["stroop"], unit: "" },
  { id: "sequence", name: "Sequence", faculty: "Memory span", color: C.green, glyph: "◆", keys: ["sequence"], unit: "" },
  { id: "math", name: "Math Sprint", faculty: "Processing speed", color: C.amber, glyph: "✦", keys: ["math"], unit: "" },
  { id: "reaction", name: "Reaction", faculty: "Response time", color: C.rose, glyph: "⚡", keys: ["reaction"], unit: "ms", lower: true },
  { id: "gonogo", name: "Go / No-Go", faculty: "Response inhibition", color: C.blue, glyph: "⊘", keys: ["gonogo"], unit: "%" },
];

export default function App() {
  const [screen, setScreen] = useState("home");
  const [log, setLog] = useState([]);
  const [best, setBest] = useState({}); // key -> value

  const onRecord = useCallback((entry) => {
    const clock = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setLog((l) => [...l, { ...entry, clock }]);
    setBest((b) => {
      const cur = b[entry.key];
      const better = cur == null || (entry.higher ? entry.value > cur : entry.value < cur);
      return better ? { ...b, [entry.key]: entry.value } : b;
    });
  }, []);
  const bestFor = useCallback((key) => (best[key] != null ? best[key] : null), [best]);

  const go = () => setScreen("home");
  const cardBest = (g) => {
    const vals = g.keys.map((k) => best[k]).filter((v) => v != null);
    if (!vals.length) return null;
    const v = g.lower ? Math.min(...vals) : Math.max(...vals);
    return `${v}${g.unit}`;
  };

  return (
    <div className="flex min-h-screen w-full justify-center" style={{ background: C.bg, color: C.text }}>
      <div className="flex w-full max-w-md flex-col px-5 py-7" style={{ minHeight: "100vh" }}>
        {screen === "home" && (
          <>
            <div className="mb-1 flex items-center justify-between">
              <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: C.text }}>
                CORTEX<span style={{ color: C.cyan }}>·</span>DECK
              </h1>
              <Pulse />
            </div>
            <p className="mb-6 text-sm" style={{ color: C.muted }}>
              Six drills, six faculties. Scores persist for this session and stay honest.
            </p>
            <div className="flex flex-col gap-3">
              {GAMES.map((g) => {
                const b = cardBest(g);
                return (
                  <button key={g.id} onClick={() => setScreen(g.id)}
                    className="flex items-center gap-4 rounded-2xl p-4 text-left transition active:scale-[0.98]"
                    style={{ background: C.panel, border: `1px solid ${C.border}` }}>
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl"
                      style={{ background: C.panelHi, color: g.color, border: `1px solid ${g.color}44` }}>{g.glyph}</div>
                    <div className="flex-1">
                      <div className="text-base font-bold" style={{ color: C.text }}>{g.name}</div>
                      <div className="text-xs tracking-wide" style={{ color: C.muted, ...mono }}>{g.faculty.toUpperCase()}</div>
                    </div>
                    {b != null && (
                      <div className="text-right" style={mono}>
                        <div className="text-sm font-bold" style={{ color: g.color }}>{b}</div>
                        <div className="text-[10px] tracking-widest" style={{ color: C.muted }}>BEST</div>
                      </div>
                    )}
                    <span style={{ color: g.color }}>→</span>
                  </button>
                );
              })}
            </div>
            <button onClick={() => setScreen("log")}
              className="mt-4 flex items-center justify-center gap-2 rounded-2xl p-3 transition active:scale-[0.98]"
              style={{ background: "transparent", border: `1px dashed ${C.border}`, color: C.muted, ...mono }}>
              SESSION LOG {log.length > 0 && `· ${log.length} run${log.length > 1 ? "s" : ""}`}
            </button>
            <p className="mt-auto pt-6 text-center text-xs leading-relaxed" style={{ color: C.muted }}>
              These train the specific task, not general IQ. You get better at what you practice. Enjoy the reps.
            </p>
          </>
        )}
        {screen !== "home" && (
          <div className="flex flex-1 flex-col">
            {screen === "nback" && <NBack onExit={go} onRecord={onRecord} bestFor={bestFor} />}
            {screen === "stroop" && <Stroop onExit={go} onRecord={onRecord} bestFor={bestFor} />}
            {screen === "sequence" && <Sequence onExit={go} onRecord={onRecord} bestFor={bestFor} />}
            {screen === "math" && <MathSprint onExit={go} onRecord={onRecord} bestFor={bestFor} />}
            {screen === "reaction" && <Reaction onExit={go} onRecord={onRecord} bestFor={bestFor} />}
            {screen === "gonogo" && <GoNoGo onExit={go} onRecord={onRecord} bestFor={bestFor} />}
            {screen === "log" && <LogScreen log={log} onExit={go} onClear={() => setLog([])} />}
          </div>
        )}
      </div>
    </div>
  );
}
