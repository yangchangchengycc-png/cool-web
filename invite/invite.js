(() => {
  const FOODS = [
    { zh: "日料", en: "Japanese" },
    { zh: "火锅", en: "Hotpot" },
    { zh: "韩餐", en: "Korean" },
    { zh: "烤肉", en: "BBQ" },
    { zh: "杭帮菜", en: "Hangzhou" },
    { zh: "川菜", en: "Sichuan" },
    { zh: "西餐", en: "Western" },
    { zh: "粤菜", en: "Cantonese" },
  ];

  const DAYS = [
    { id: "sat", label: "周六" },
    { id: "sun", label: "周日" },
  ];

  const TIMES = ["20:00", "20:30", "21:00", "21:30", "22:00", "22:30"];

  const state = {
    food: null,
    day: null,
    time: null,
  };

  const screens = {
    start: document.querySelector('[data-screen="start"]'),
    choice: document.querySelector('[data-screen="choice"]'),
    food: document.querySelector('[data-screen="food"]'),
    date: document.querySelector('[data-screen="date"]'),
    finale: document.querySelector('[data-screen="finale"]'),
  };

  const stage = document.getElementById("choice-stage");
  const btnNo = document.getElementById("btn-no");
  const btnYes = document.getElementById("btn-yes");
  const foodGrid = document.getElementById("food-grid");
  const dayRow = document.getElementById("day-row");
  const timeRow = document.getElementById("time-row");
  const btnConfirm = document.getElementById("btn-confirm");
  const summary = document.getElementById("summary");
  const finaleNote = document.getElementById("finale-note");
  const sharePanel = document.getElementById("share-panel");
  const btnShare = document.getElementById("btn-share");
  const shareStatus = document.getElementById("share-status");
  const inviteShot = document.getElementById("invite-shot");
  const finaleInner = document.querySelector(".screen__inner--finale");
  const canvas = document.getElementById("fireworks");
  const ctx = canvas.getContext("2d");

  let currentScreen = "start";
  let fireworksAnim = null;
  let particles = [];
  let rockets = [];
  let lastBurst = 0;
  let fireworksActive = false;
  let shareRevealTimer = null;
  let shotBlob = null;
  let shotUrl = null;

  function goTo(name) {
    if (!screens[name] || name === currentScreen) return;
    screens[currentScreen].classList.remove("is-active");
    screens[name].classList.add("is-active");
    currentScreen = name;

    if (name === "choice") {
      requestAnimationFrame(centerNoButton);
    }
    if (name === "finale") {
      renderSummary();
      startFireworks();
    }
  }

  document.querySelectorAll("[data-action]").forEach((el) => {
    el.addEventListener("click", () => {
      const action = el.getAttribute("data-action");
      if (action === "go-choice") goTo("choice");
      if (action === "go-food") goTo("food");
    });
  });

  function centerNoButton() {
    const rect = stage.getBoundingClientRect();
    const btnW = btnNo.offsetWidth || 132;
    const btnH = btnNo.offsetHeight || 48;
    btnNo.style.left = `${rect.width * 0.5}px`;
    btnNo.style.top = `${rect.height * 0.72}px`;
    btnNo.style.transform = "translate(-50%, -50%)";
    void btnW;
    void btnH;
  }

  function moveNoAway(clientX, clientY) {
    const rect = stage.getBoundingClientRect();
    const btnW = btnNo.offsetWidth;
    const btnH = btnNo.offsetHeight;
    const pad = 8;
    const minX = pad + btnW / 2;
    const maxX = rect.width - pad - btnW / 2;
    const minY = pad + btnH / 2;
    const maxY = rect.height - pad - btnH / 2;

    const localX = clientX - rect.left;
    const localY = clientY - rect.top;
    const curX = parseFloat(btnNo.style.left) || rect.width * 0.5;
    const curY = parseFloat(btnNo.style.top) || rect.height * 0.72;

    const dx = localX - curX;
    const dy = localY - curY;
    const dist = Math.hypot(dx, dy) || 1;

    // Leap away from finger / cursor
    const leap = 110 + Math.random() * 90;
    let nextX = curX - (dx / dist) * leap + (Math.random() - 0.5) * 60;
    let nextY = curY - (dy / dist) * leap + (Math.random() - 0.5) * 50;

    // If still too close, jump to a far corner
    if (Math.hypot(nextX - localX, nextY - localY) < 90) {
      const corners = [
        [minX + 10, minY + 10],
        [maxX - 10, minY + 10],
        [minX + 10, maxY - 10],
        [maxX - 10, maxY - 10],
      ];
      const far = corners.sort(
        (a, b) =>
          Math.hypot(b[0] - localX, b[1] - localY) -
          Math.hypot(a[0] - localX, a[1] - localY)
      )[0];
      nextX = far[0];
      nextY = far[1];
    }

    nextX = Math.min(maxX, Math.max(minX, nextX));
    nextY = Math.min(maxY, Math.max(minY, nextY));

    // Avoid overlapping the Yes button
    const yesRect = btnYes.getBoundingClientRect();
    const yesCX = yesRect.left + yesRect.width / 2 - rect.left;
    const yesCY = yesRect.top + yesRect.height / 2 - rect.top;
    if (Math.hypot(nextX - yesCX, nextY - yesCY) < 100) {
      nextY = nextY < yesCY ? Math.max(minY, yesCY - 120) : Math.min(maxY, yesCY + 120);
    }

    btnNo.style.left = `${nextX}px`;
    btnNo.style.top = `${nextY}px`;
  }

  function nearNo(clientX, clientY) {
    const rect = btnNo.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    return Math.hypot(clientX - cx, clientY - cy) < 88;
  }

  stage.addEventListener(
    "pointermove",
    (e) => {
      if (currentScreen !== "choice") return;
      if (nearNo(e.clientX, e.clientY)) moveNoAway(e.clientX, e.clientY);
    },
    { passive: true }
  );

  stage.addEventListener(
    "pointerdown",
    (e) => {
      if (currentScreen !== "choice") return;
      if (e.target === btnNo || nearNo(e.clientX, e.clientY)) {
        e.preventDefault();
        moveNoAway(e.clientX, e.clientY);
      }
    },
    { passive: false }
  );

  btnNo.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    moveNoAway(e.clientX || stage.getBoundingClientRect().left + 40, e.clientY || stage.getBoundingClientRect().top + 40);
  });

  // Food options
  FOODS.forEach((food, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "food-option";
    btn.setAttribute("role", "option");
    btn.style.animationDelay = `${0.05 + i * 0.03}s`;
    btn.innerHTML = `${food.zh}<span class="food-option__en">${food.en}</span>`;
    btn.addEventListener("click", () => {
      state.food = food;
      foodGrid.querySelectorAll(".food-option").forEach((el) => el.classList.remove("is-selected"));
      btn.classList.add("is-selected");
      setTimeout(() => goTo("date"), 280);
    });
    foodGrid.appendChild(btn);
  });

  // Days
  DAYS.forEach((day) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chip";
    btn.setAttribute("role", "radio");
    btn.textContent = day.label;
    btn.addEventListener("click", () => {
      state.day = day;
      dayRow.querySelectorAll(".chip").forEach((el) => el.classList.remove("is-selected"));
      btn.classList.add("is-selected");
      updateConfirm();
    });
    dayRow.appendChild(btn);
  });

  // Times (after 8pm)
  TIMES.forEach((time) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chip";
    btn.setAttribute("role", "radio");
    btn.textContent = time;
    btn.addEventListener("click", () => {
      state.time = time;
      timeRow.querySelectorAll(".chip").forEach((el) => el.classList.remove("is-selected"));
      btn.classList.add("is-selected");
      updateConfirm();
    });
    timeRow.appendChild(btn);
  });

  function updateConfirm() {
    btnConfirm.disabled = !(state.day && state.time);
  }

  btnConfirm.addEventListener("click", () => {
    if (btnConfirm.disabled) return;
    goTo("finale");
  });

  function buildInviteMessage() {
    const food = state.food ? state.food.zh : "待定";
    const when =
      state.day && state.time ? `${state.day.label} ${state.time}` : "待定";
    return [
      "约会确认 ✓",
      `菜品：${food}`,
      `时间：${when}`,
      "",
      "期待与你见面",
    ].join("\n");
  }

  function setShareStatus(text) {
    if (shareStatus) shareStatus.textContent = text;
  }

  function roundRect(c, x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    c.beginPath();
    c.moveTo(x + radius, y);
    c.arcTo(x + w, y, x + w, y + h, radius);
    c.arcTo(x + w, y + h, x, y + h, radius);
    c.arcTo(x, y + h, x, y, radius);
    c.arcTo(x, y, x + w, y, radius);
    c.closePath();
  }

  function drawCourtLines(c, w, h) {
    c.save();
    c.strokeStyle = "rgba(232, 226, 210, 0.18)";
    c.lineWidth = 2;
    const padX = w * 0.1;
    const padY = h * 0.08;
    c.strokeRect(padX, padY, w - padX * 2, h - padY * 2);
    c.beginPath();
    c.moveTo(w / 2, padY);
    c.lineTo(w / 2, h - padY);
    c.moveTo(padX + (w - padX * 2) * 0.18, h / 2);
    c.lineTo(padX + (w - padX * 2) * 0.82, h / 2);
    c.stroke();
    c.restore();
  }

  function createInviteShot() {
    const food = state.food ? state.food.zh : "待定";
    const foodEn = state.food ? state.food.en : "";
    const when =
      state.day && state.time ? `${state.day.label}  ${state.time}` : "待定";
    const note =
      state.day && state.day.id === "sat"
        ? "星期六的灯光会更温柔一点"
        : "星期天的夜晚刚刚好";

    const width = 720;
    const height = 960;
    const shot = document.createElement("canvas");
    shot.width = width;
    shot.height = height;
    const c = shot.getContext("2d");

    const grad = c.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, "#2a5238");
    grad.addColorStop(0.45, "#1e3d2c");
    grad.addColorStop(1, "#0f1c15");
    c.fillStyle = grad;
    c.fillRect(0, 0, width, height);

    const glow = c.createRadialGradient(width * 0.3, height * 0.18, 20, width * 0.3, height * 0.18, width * 0.55);
    glow.addColorStop(0, "rgba(201, 184, 150, 0.16)");
    glow.addColorStop(1, "rgba(201, 184, 150, 0)");
    c.fillStyle = glow;
    c.fillRect(0, 0, width, height);

    drawCourtLines(c, width, height);

    c.fillStyle = "#c9b896";
    c.font = '500 22px "Outfit", "PingFang SC", sans-serif';
    c.textAlign = "center";
    c.letterSpacing = "6px";
    c.fillText("COURT SIDE  ·  CONFIRMED", width / 2, 150);

    c.fillStyle = "#f3efe4";
    c.font = 'italic 600 64px "Cormorant Garamond", "Songti SC", serif';
    c.fillText("期待与你见面", width / 2, 260);

    c.strokeStyle = "rgba(201, 184, 150, 0.45)";
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(width * 0.28, 300);
    c.lineTo(width * 0.72, 300);
    c.stroke();

    // info card
    const cardX = 90;
    const cardY = 360;
    const cardW = width - 180;
    const cardH = 280;
    c.fillStyle = "rgba(19, 38, 28, 0.55)";
    roundRect(c, cardX, cardY, cardW, cardH, 4);
    c.fill();
    c.strokeStyle = "rgba(201, 184, 150, 0.35)";
    c.lineWidth = 1.5;
    roundRect(c, cardX, cardY, cardW, cardH, 4);
    c.stroke();

    c.fillStyle = "#c9b896";
    c.font = '500 20px "Outfit", "PingFang SC", sans-serif';
    c.fillText("CUISINE", width / 2, cardY + 58);

    c.fillStyle = "#f3efe4";
    c.font = '600 48px "Cormorant Garamond", "PingFang SC", serif';
    c.fillText(food, width / 2, cardY + 118);
    if (foodEn) {
      c.fillStyle = "rgba(201, 184, 150, 0.85)";
      c.font = '400 18px "Outfit", sans-serif';
      c.fillText(foodEn.toUpperCase(), width / 2, cardY + 152);
    }

    c.fillStyle = "#c9b896";
    c.font = '500 20px "Outfit", "PingFang SC", sans-serif';
    c.fillText("WHEN", width / 2, cardY + 205);

    c.fillStyle = "#f3efe4";
    c.font = '600 36px "Cormorant Garamond", "PingFang SC", serif';
    c.fillText(when, width / 2, cardY + 250);

    c.fillStyle = "rgba(243, 239, 228, 0.72)";
    c.font = 'italic 400 26px "Cormorant Garamond", "Songti SC", serif';
    c.fillText(note, width / 2, 720);

    c.fillStyle = "rgba(201, 184, 150, 0.7)";
    c.font = '400 18px "Outfit", "PingFang SC", sans-serif';
    c.fillText("长按保存 · 发给想见面的那个人", width / 2, 860);

    return shot;
  }

  function revokeShotUrl() {
    if (shotUrl) {
      URL.revokeObjectURL(shotUrl);
      shotUrl = null;
    }
    shotBlob = null;
  }

  function prepareInviteShot() {
    const shot = createInviteShot();
    return new Promise((resolve) => {
      shot.toBlob(
        (blob) => {
          revokeShotUrl();
          shotBlob = blob;
          shotUrl = URL.createObjectURL(blob);
          if (inviteShot) {
            inviteShot.src = shotUrl;
          }
          resolve(blob);
        },
        "image/png",
        1
      );
    });
  }

  async function saveInviteShot() {
    if (!shotBlob) {
      await prepareInviteShot();
    }
    if (!shotBlob) {
      setShareStatus("图片生成失败，请长按上方图片保存");
      return;
    }

    const file = new File([shotBlob], "dinner-invite.png", { type: "image/png" });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: "约会确认",
          text: buildInviteMessage(),
        });
        setShareStatus("选择微信等发给 TA");
        return;
      } catch (err) {
        if (err && err.name === "AbortError") {
          setShareStatus("已取消");
          return;
        }
      }
    }

    // Download fallback
    try {
      const a = document.createElement("a");
      a.href = shotUrl;
      a.download = "dinner-invite.png";
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setShareStatus("已保存，去相册发给 TA；也可长按上方图片");
    } catch {
      setShareStatus("请长按上方图片保存后发送");
    }
  }

  function revealSharePanel() {
    if (!sharePanel) return;
    prepareInviteShot().then(() => {
      if (finaleInner) finaleInner.classList.add("is-sharing");
      sharePanel.hidden = false;
      requestAnimationFrame(() => {
        sharePanel.classList.add("is-visible");
      });
      setShareStatus("");
    });
  }

  function resetSharePanel() {
    if (!sharePanel) return;
    sharePanel.classList.remove("is-visible");
    sharePanel.hidden = true;
    if (finaleInner) finaleInner.classList.remove("is-sharing");
    setShareStatus("");
    revokeShotUrl();
    if (inviteShot) inviteShot.removeAttribute("src");
    if (shareRevealTimer) {
      clearTimeout(shareRevealTimer);
      shareRevealTimer = null;
    }
  }

  if (btnShare) {
    btnShare.addEventListener("click", () => {
      saveInviteShot();
    });
  }

  function renderSummary() {
    const food = state.food ? `${state.food.zh} · ${state.food.en}` : "";
    const when = state.day && state.time ? `${state.day.label} ${state.time}` : "";
    summary.textContent = [food, when].filter(Boolean).join("  ·  ");
    if (finaleNote && state.day) {
      finaleNote.textContent =
        state.day.id === "sat"
          ? "星期六的灯光会更温柔一点"
          : "星期天的夜晚刚刚好";
    }
  }

  // ——— Fireworks ———
  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const { width, height } = canvas.parentElement.getBoundingClientRect();
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function spawnRocket() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    rockets.push({
      x: w * (0.2 + Math.random() * 0.6),
      y: h,
      vx: (Math.random() - 0.5) * 1.2,
      vy: -(6.5 + Math.random() * 3.5),
      hue: 35 + Math.random() * 40,
      trail: [],
    });
  }

  function burst(x, y, hue) {
    const count = 48 + Math.floor(Math.random() * 28);
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.2;
      const speed = 1.6 + Math.random() * 3.4;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: 0.012 + Math.random() * 0.015,
        hue: hue + (Math.random() - 0.5) * 20,
        size: 1.4 + Math.random() * 2.2,
      });
    }
  }

  function startFireworks() {
    resizeCanvas();
    particles = [];
    rockets = [];
    lastBurst = performance.now();
    fireworksActive = true;
    resetSharePanel();
    if (fireworksAnim) cancelAnimationFrame(fireworksAnim);

    const startedAt = performance.now();
    const FIREWORKS_MS = 4200;

    const tick = (now) => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);

      if (fireworksActive && now - lastBurst > 550 + Math.random() * 400) {
        spawnRocket();
        lastBurst = now;
      }

      if (fireworksActive && Math.random() < 0.03) {
        burst(w * Math.random(), h * (0.25 + Math.random() * 0.35), 42 + Math.random() * 30);
      }

      if (fireworksActive && now - startedAt > FIREWORKS_MS) {
        fireworksActive = false;
        revealSharePanel();
      }

      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        r.trail.push({ x: r.x, y: r.y });
        if (r.trail.length > 8) r.trail.shift();
        r.x += r.vx;
        r.y += r.vy;
        r.vy += 0.06;

        ctx.beginPath();
        ctx.strokeStyle = `hsla(${r.hue}, 55%, 72%, 0.7)`;
        ctx.lineWidth = 2;
        if (r.trail.length) {
          ctx.moveTo(r.trail[0].x, r.trail[0].y);
          r.trail.forEach((p) => ctx.lineTo(p.x, p.y));
          ctx.stroke();
        }

        if (r.vy >= -1 || r.y < h * 0.25) {
          burst(r.x, r.y, r.hue);
          rockets.splice(i, 1);
        }
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.035;
        p.vx *= 0.99;
        p.life -= p.decay;

        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.fillStyle = `hsla(${p.hue}, 60%, 70%, ${p.life})`;
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      fireworksAnim = requestAnimationFrame(tick);
    };

    setTimeout(() => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      burst(w * 0.5, h * 0.38, 45);
      burst(w * 0.3, h * 0.45, 38);
      burst(w * 0.7, h * 0.42, 52);
    }, 200);

    fireworksAnim = requestAnimationFrame(tick);
  }

  window.addEventListener("resize", () => {
    if (currentScreen === "finale") resizeCanvas();
    if (currentScreen === "choice") centerNoButton();
  });
})();
