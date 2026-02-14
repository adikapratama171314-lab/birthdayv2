(() => {
  // ===== MUSIC (stable) =====
  const audio = document.getElementById("bgMusic");
  const musicBtn = document.getElementById("musicBtn");
  const musicLabel = document.getElementById("musicLabel");
  const musicHint = document.getElementById("musicHint");

  const KEY_PLAY = "hb_play";
  const KEY_TIME = "hb_time";

  const setUI = (playing) => {
    if (musicLabel) musicLabel.textContent = playing ? "Pause music" : "Play music";
    if (musicHint) musicHint.innerHTML = playing ? "Musik sedang diputar. ✅" : "Klik <b>Play music</b> untuk mulai.";
  };

  // restore time (safe)
  const restoreTime = () => {
    if (!audio) return;
    const t = Number(localStorage.getItem(KEY_TIME) || "0");
    if (!Number.isNaN(t) && t > 0) {
      try { audio.currentTime = t; } catch {}
    }
  };

  // save time (safe)
  const saveTime = () => {
    if (!audio) return;
    if (!audio.paused) localStorage.setItem(KEY_TIME, String(audio.currentTime || 0));
  };

  if (audio) {
    // keep saving
    setInterval(saveTime, 900);
    window.addEventListener("beforeunload", saveTime);

    // if was playing before, try resume (may fail due autoplay)
    const shouldPlay = localStorage.getItem(KEY_PLAY) === "1";
    setUI(false);

    if (shouldPlay) {
      restoreTime();
      audio.play().then(() => setUI(true)).catch(() => setUI(false));
    }
  }

  if (musicBtn) {
    musicBtn.addEventListener("click", async () => {
      if (!audio) return;

      // make sure audio is ready
      audio.load();
      audio.muted = false;
      audio.volume = 1;

      try {
        if (audio.paused) {
          restoreTime();
          await audio.play();
          localStorage.setItem(KEY_PLAY, "1");
          setUI(true);
        } else {
          audio.pause();
          localStorage.setItem(KEY_PLAY, "0");
          setUI(false);
        }
      } catch (e) {
        localStorage.setItem(KEY_PLAY, "0");
        setUI(false);
        alert("Audio gagal diputar. Coba refresh (Ctrl+F5) lalu klik Play lagi.");
        console.log("Audio play failed:", e);
      }
    });
  }

  // ===== COPY (page 2) =====
  const copyBtn = document.getElementById("copyBtn");
  const copyArea = document.getElementById("copyArea");
  if (copyBtn && copyArea) {
    copyBtn.addEventListener("click", async () => {
      const text = copyArea.innerText.trim();
      try {
        await navigator.clipboard.writeText(text);
        copyBtn.textContent = "Copied ✓";
        setTimeout(() => (copyBtn.textContent = "Copy ucapan"), 1200);
      } catch {
        const ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
        copyBtn.textContent = "Copied ✓";
        setTimeout(() => (copyBtn.textContent = "Copy ucapan"), 1200);
      }
    });
  }

  // ===== FX CANVAS (blue petals/hearts) =====
  const canvas = document.getElementById("fx");
  if (!canvas) return;
  const ctx = canvas.getContext("2d", { alpha: true });

  const resize = () => {
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    canvas.width = Math.floor(innerWidth * dpr);
    canvas.height = Math.floor(innerHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  addEventListener("resize", resize);
  resize();

  const rand = (a,b) => a + Math.random()*(b-a);
  const palette = ["rgba(58,160,255,.9)","rgba(106,214,255,.9)","rgba(234,242,255,.65)"];

  const parts = [];
  const MAX = 160;

  function heart(x,y,s){
    ctx.beginPath();
    const t = s*0.3;
    ctx.moveTo(x, y+t);
    ctx.bezierCurveTo(x, y, x-s, y, x-s, y+t);
    ctx.bezierCurveTo(x-s, y+s*0.8, x, y+s*0.95, x, y+s*1.2);
    ctx.bezierCurveTo(x, y+s*0.95, x+s, y+s*0.8, x+s, y+t);
    ctx.bezierCurveTo(x+s, y, x, y, x, y+t);
    ctx.closePath();
  }

  function spawn(n=2, boost=1){
    for(let i=0;i<n;i++){
      if(parts.length>MAX) parts.shift();
      parts.push({
        x: rand(0, innerWidth),
        y: rand(-80, -10),
        vx: rand(-0.25, 0.25),
        vy: rand(0.8, 2.2)*boost,
        r: rand(6, 13),
        rot: rand(0, Math.PI*2),
        vr: rand(-0.015, 0.015),
        a: rand(0.25, 0.55),
        c: palette[(Math.random()*palette.length)|0],
        kind: Math.random()<0.55 ? "heart":"dot"
      });
    }
  }

  setInterval(()=>spawn(2,1), 120);

  const boostBtn = document.getElementById("boostBtn");
  if (boostBtn){
    boostBtn.addEventListener("click", ()=>{
      for(let k=0;k<18;k++) spawn(6, 1.8);
      boostBtn.textContent = "Boosted ✓";
      setTimeout(()=>boostBtn.textContent="Boost efek ✨", 1000);
    });
  }

  function loop(){
    ctx.clearRect(0,0,innerWidth,innerHeight);

    for(const p of parts){
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;

      if(p.y > innerHeight+40){ p.y = rand(-120,-20); p.x = rand(0, innerWidth); }
      if(p.x < -40) p.x = innerWidth+40;
      if(p.x > innerWidth+40) p.x = -40;

      ctx.save();
      ctx.globalAlpha = p.a;
      ctx.shadowColor = "rgba(58,160,255,.22)";
      ctx.shadowBlur = 18;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.c;

      if(p.kind==="heart"){ heart(0,0,p.r); ctx.fill(); }
      else{ ctx.beginPath(); ctx.arc(0,0,p.r*0.45,0,Math.PI*2); ctx.fill(); }

      ctx.restore();
    }

    requestAnimationFrame(loop);
  }
  loop();
})();