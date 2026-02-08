(()=> {
  const $ = (id)=>document.getElementById(id);

  // --- Haptics (best-effort) ---
  const haptic = (ms=10)=>{ try{ navigator.vibrate && navigator.vibrate(ms); }catch{} };

  // --- Sound (offline, no files) ---
  let ctx=null;
  const AC = window.AudioContext || window.webkitAudioContext;
  const getCtx = ()=>{ if(ctx) return ctx; try{ ctx=new AC(); }catch{ ctx=null; } return ctx; };
  const tone = (f,ms,type="sine",g=0.05)=>{
    const c=getCtx(); if(!c) return;
    const t0=c.currentTime;
    const o=c.createOscillator(); const gn=c.createGain();
    o.type=type; o.frequency.setValueAtTime(f,t0);
    gn.gain.setValueAtTime(0.0001,t0);
    gn.gain.exponentialRampToValueAtTime(g,t0+0.01);
    gn.gain.exponentialRampToValueAtTime(0.0001,t0+ms/1000);
    o.connect(gn); gn.connect(c.destination);
    o.start(t0); o.stop(t0+ms/1000+0.02);
  };

// --- Dev Banner --- 
  const isDevEnv = () => {
    const h = location.hostname || "";
    return h.startsWith("dev--") || h.includes("localhost") || h.includes("127.0.0.1");
  };
  
  document.addEventListener("DOMContentLoaded", () => {
    const badge = document.getElementById("envBadge");
    if (badge && isDevEnv()) {
      badge.classList.remove("hidden");
    }
  });


  // --- Data ---
  const THEMES = [
    {id:"studio_v1",name:"Glossary Studio",brand:"🐻",accent:"#b8c4ff",bg:"linear-gradient(180deg,#070a14,#0b1020 35%,#070a14)"},
    {id:"quest_v1",name:"Quest Log",brand:"🧭",accent:"#a8ffd8",bg:"linear-gradient(180deg,#050d12,#0a1a20 35%,#050d12)"},
    {id:"battle_v1",name:"Battle Pass",brand:"🎮",accent:"#ffd27d",bg:"linear-gradient(180deg,#110705,#171026 40%,#110705)"},
    {id:"sports_v1",name:"Sports Pack",brand:"🏆",accent:"#8ff0ff",bg:"linear-gradient(180deg,#031118,#061a24 40%,#031118)"}
  ];

  const DECKS = [
    {id:"chapter1_vocab",name:"Chapter 1 — Vocab",words:[
      {word:"Minutiae",definition:"tiny details",synonym:"small details",sentence:"The detective focused on the minutiae of the report."},
      {word:"Benign",definition:"harmless; mild",synonym:"harmless",sentence:"The doctor said the lump was benign."},
      {word:"Insinuate",definition:"hint indirectly",synonym:"suggest",sentence:"She tried to insinuate he was responsible."},
      {word:"Mediator",definition:"a go-between who helps settle conflict",synonym:"go-between",sentence:"They asked a mediator to help them agree."},
      {word:"Ardent",definition:"very passionate",synonym:"enthusiastic",sentence:"He was an ardent supporter."},
      {word:"Discharge",definition:"release; send out",synonym:"release",sentence:"The pipe can’t discharge waste into the river."},
      {word:"Nomad",definition:"a wanderer with no permanent home",synonym:"wanderer",sentence:"As a nomad, she moved often."},
      {word:"Surreptitious",definition:"secret; sneaky",synonym:"stealthy",sentence:"He took a surreptitious glance."},
      {word:"Rapacious",definition:"greedily wanting more",synonym:"greedy",sentence:"The rapacious landlord raised rents again."},
      {word:"Feint",definition:"a fake move meant to trick",synonym:"fake",sentence:"The boxer used a feint."},
      {word:"Blase",definition:"unimpressed; indifferent",synonym:"uninterested",sentence:"She was blasé about the news."},
      {word:"Defray",definition:"pay the cost of",synonym:"cover",sentence:"The grant helped defray expenses."},
      {word:"Attest",definition:"confirm; give proof",synonym:"verify",sentence:"Witnesses can attest he was there."},
      {word:"Miser",definition:"someone who hoards money",synonym:"stingy person",sentence:"The miser refused to spend."},
      {word:"Itinerant",definition:"traveling from place to place",synonym:"wandering",sentence:"An itinerant musician toured towns."},
      {word:"Encroach",definition:"intrude gradually",synonym:"infringe",sentence:"The building may encroach on habitat."},
      {word:"Rail",definition:"complain bitterly",synonym:"protest",sentence:"He began to rail against the rules."},
      {word:"Hovel",definition:"a small, poor home",synonym:"shack",sentence:"They lived in a hovel."},
      {word:"Transgress",definition:"break a rule",synonym:"violate",sentence:"Don’t transgress the code of conduct."},
      {word:"Raiment",definition:"clothing",synonym:"attire",sentence:"The knight wore bright raiment."},
      {word:"Salutary",definition:"beneficial; healthful",synonym:"helpful",sentence:"Sleep has a salutary effect."},
      {word:"Vestige",definition:"a small remaining trace",synonym:"trace",sentence:"A vestige of the wall remains."},
      {word:"Subterfuge",definition:"a trick to hide the truth",synonym:"deception",sentence:"He used subterfuge to avoid questions."},
      {word:"Atone",definition:"make amends for wrongdoing",synonym:"make up",sentence:"She tried to atone by fixing it."},
      {word:"Incensed",definition:"very angry",synonym:"furious",sentence:"He was incensed about the theft."}
    ]},
    {id:"chapter2_vocab_demo",name:"Chapter 2 — Vocab (Demo)",words:[
      {word:"Amiable",definition:"friendly and pleasant",synonym:"friendly",sentence:"The amiable host greeted everyone at the door."},
      {word:"Candid",definition:"truthful and direct",synonym:"frank",sentence:"She gave a candid opinion about the plan."},
      {word:"Coerce",definition:"force someone to do something",synonym:"compel",sentence:"They tried to coerce him into agreeing."},
      {word:"Concur",definition:"agree",synonym:"agree",sentence:"I concur with your assessment."},
      {word:"Copious",definition:"plentiful; in large amounts",synonym:"abundant",sentence:"Copious notes covered the margins of her book."},
      {word:"Deft",definition:"skillful and quick",synonym:"adroit",sentence:"With a deft move, she fixed the bracelet clasp."}
    ]}
  ];

  // --- State ---
  const LS="glossary_app_v2_2_simple";
  const S = {
    profiles:{}, active:{profileId:null, deckId:null},
  };

  const uid = ()=> "p_" + Math.random().toString(16).slice(2) + "_" + Date.now().toString(16);
  const save = ()=> localStorage.setItem(LS, JSON.stringify(S));
  const load = ()=>{ try{ const d=JSON.parse(localStorage.getItem(LS)||"null"); if(!d) return false; Object.assign(S,d); return true; }catch{ return false; } };

  const makeProfile=(name, themeId)=>{
    const id=uid();
    S.profiles[id] = {
      id, name, themeId, burstSize:6, soundOn:true,
      progress:{} // by deck id -> {level,xp,streak,mastery:{},collectibles:[]}
    };
    return S.profiles[id];
  };

  const p = ()=> S.profiles[S.active.profileId];
  const deck = ()=> DECKS.find(d=>d.id===S.active.deckId) || DECKS[0];
  const theme = ()=> THEMES.find(t=>t.id===p().themeId) || THEMES[0];
  const prog = ()=>{
    const pid=p().id, did=deck().id;
    if(!p().progress[did]){
      p().progress[did]={level:1,xp:0,streak:0,mastery:{},collectibles:[]};
    }
    // migrate collectibles
    const pr=p().progress[did];
    if(pr.collectibles.length && typeof pr.collectibles[0] === "string"){
      pr.collectibles = pr.collectibles.map(e=>({emoji:e,rarity:"common",ts:Date.now(),isNew:false}));
    }
    return pr;
  };

  const xpNeed = (lvl)=> Math.round(100 + (lvl-1)*18 + Math.pow(lvl-1,1.15)*6);
  const mastery = (w)=> prog().mastery[w] || 0;
  const mastered = (w)=> mastery(w) >= 3;

  // --- UI: bottom nav + panes ---
  const setPane = (name)=>{
    ["panePlay","paneCloset","paneSettings"].forEach(id=>$(id).classList.add("hidden"));
    if(name==="play") $("panePlay").classList.remove("hidden");
    if(name==="closet") { $("paneCloset").classList.remove("hidden"); renderCloset(true); }
    if(name==="settings") $("paneSettings").classList.remove("hidden");
    ["tabPlay","tabCloset","tabSettings"].forEach(id=>$(id).classList.remove("active"));
    if(name==="play") $("tabPlay").classList.add("active");
    if(name==="closet") $("tabCloset").classList.add("active");
    if(name==="settings") $("tabSettings").classList.add("active");
    updateClosetBadge();
  };

  const applyTheme = ()=>{
    const t=theme();
    document.documentElement.style.setProperty("--accent", t.accent);
    document.documentElement.style.setProperty("--bg", t.bg);
    $("brandMark").textContent = t.brand;
    $("seasonName").textContent = t.name;
    $("deckNamePill").textContent = `Deck: ${deck().name}`;
    $("headerSub").textContent = `Profile: ${p().name} • Deck: ${deck().name}`;
    $("burstThemePill").textContent = t.name;
    $("burstDeckPill").textContent = `Deck: ${deck().name}`;
  };

  const renderHUD = ()=>{
    applyTheme();
    const pr=prog();
    $("streakPill").textContent = `Streak: ${pr.streak}`;
    $("levelText").textContent = `Level ${pr.level}`;
    const need=xpNeed(pr.level);
    $("xpText").textContent = `Glow: ${pr.xp} / ${need}`;
    $("xpBar").style.width = Math.max(0, Math.min(100, (pr.xp/need)*100)).toFixed(1) + "%";
    const masteredCount = deck().words.filter(w=>mastered(w.word)).length;
    $("collectionPill").textContent = `Mastered: ${masteredCount}/${deck().words.length}`;
    let hint="Keep going 💅";
    if(masteredCount>=Math.ceil(deck().words.length*0.75)) hint="Almost there 👑";
    else if(masteredCount>=Math.ceil(deck().words.length*0.5)) hint="Halfway glow ✨";
    else if(masteredCount>=3) hint="Momentum 🔥";
    $("nextMilestone").textContent=hint;
    updateClosetBadge();
  };

  const addXP=(n)=>{
    const pr=prog();
    pr.xp += n;
    while(pr.xp >= xpNeed(pr.level)){
      pr.xp -= xpNeed(pr.level);
      pr.level += 1;
      tone(740,90,"triangle",0.05); tone(988,90,"triangle",0.05); tone(1319,140,"triangle",0.05);
      haptic(12);
      $("toast").textContent="Level up ✨";
    }
    save(); renderHUD();
  };

  // --- Flow screens (profile -> theme -> deck) ---
  const flow = {step:"profiles"};
  const flowScreen = $("flowScreen");

  const flowProfiles = ()=>{
    $("flowTitle").textContent="Welcome";
    $("flowHint").textContent="Pick a profile";
    const cards = Object.values(S.profiles).map(pr=>{
      const t=THEMES.find(x=>x.id===pr.themeId) || THEMES[0];
      return `<button class="secondary" data-p="${pr.id}" style="width:100%;text-align:left;border-radius:18px;padding:14px;">
        <div style="font-weight:900">${t.brand} ${escapeHtml(pr.name)}</div>
        <div class="tiny">${escapeHtml(t.name)} • saved progress</div>
      </button>`;
    }).join("<div class='divider'></div>");
    flowScreen.innerHTML = `
      <div style="display:grid;gap:10px">${cards}</div>
      <div class="divider"></div>
      <div class="row">
        <input id="newProfileName" type="text" placeholder="Add profile name (e.g., Ava, Jack)" />
        <button class="secondary" id="addProfileBtn">Add</button>
      </div>
    `;
    flowScreen.querySelectorAll("button[data-p]").forEach(b=>{
      b.addEventListener("click", ()=>{
        S.active.profileId = b.getAttribute("data-p");
        flow.step="themes";
        save(); renderFlow();
      });
    });
    flowScreen.querySelector("#addProfileBtn").addEventListener("click", ()=>{
      const inp=flowScreen.querySelector("#newProfileName");
      const name=(inp.value||"").trim();
      if(!name) return;
      makeProfile(name, "studio_v1");
      inp.value="";
      save(); renderFlow();
    });
  };

  const flowThemes = ()=>{
    $("flowTitle").textContent="Pick a vibe";
    $("flowHint").textContent="This is the look + rewards";
    flowScreen.innerHTML = `
      <div style="display:grid;gap:10px">
        ${THEMES.map(t=>`
          <button class="secondary" data-t="${t.id}" style="width:100%;text-align:left;border-radius:18px;padding:14px;">
            <div style="font-weight:900">${t.brand} ${escapeHtml(t.name)}</div>
            <div class="tiny">tap to choose</div>
          </button>`).join("")}
      </div>
      <div class="divider"></div>
      <button class="secondary" id="backToProfilesBtn">Back</button>
    `;
    flowScreen.querySelectorAll("button[data-t]").forEach(b=>{
      b.addEventListener("click", ()=>{
        p().themeId = b.getAttribute("data-t");
        flow.step="decks"; save(); renderFlow();
      });
    });
    flowScreen.querySelector("#backToProfilesBtn").addEventListener("click", ()=>{
      flow.step="profiles"; renderFlow();
    });
  };

  const flowDecks = ()=>{
    $("flowTitle").textContent="Pick a deck";
    $("flowHint").textContent="Choose a word list";
    flowScreen.innerHTML = `
      <div style="display:grid;gap:10px">
        ${DECKS.map(d=>`
          <button class="secondary" data-d="${d.id}" style="width:100%;text-align:left;border-radius:18px;padding:14px;">
            <div style="font-weight:900">${escapeHtml(d.name)}</div>
            <div class="tiny">${d.words.length} words</div>
          </button>`).join("")}
      </div>
      <div class="divider"></div>
      <button class="secondary" id="backToThemesBtn">Back</button>
    `;
    flowScreen.querySelectorAll("button[data-d]").forEach(b=>{
      b.addEventListener("click", ()=>{
        S.active.deckId = b.getAttribute("data-d");
        save(); enterApp();
      });
    });
    flowScreen.querySelector("#backToThemesBtn").addEventListener("click", ()=>{
      flow.step="themes"; renderFlow();
    });
  };

  const renderFlow = ()=>{
    $("paneFlow").classList.remove("hidden");
    $("panePlay").classList.add("hidden");
    $("paneCloset").classList.add("hidden");
    $("paneSettings").classList.add("hidden");
    $("bottomNav").classList.add("hidden");
    if(flow.step==="profiles") flowProfiles();
    if(flow.step==="themes") flowThemes();
    if(flow.step==="decks") flowDecks();
  };

  const enterApp = ()=>{
    $("paneFlow").classList.add("hidden");
    $("bottomNav").classList.remove("hidden");
    applyTheme(); renderHUD();
    setPane("play");
  };

  // --- Burst mode + swipes ---
  const burst = {queue:[],pos:0,revealed:false};

  const pickIndex = ()=>{
    const ws=deck().words;
    const weights=ws.map(o=>{
      const m=mastery(o.word);
      return m>=3?0.55:m===2?0.95:m===1?1.15:1.30;
    });
    const total = weights.reduce((a,b)=>a+b,0);
    let r = Math.random()*total;
    for(let i=0;i<weights.length;i++){ r-=weights[i]; if(r<=0) return i; }
    return ws.length-1;
  };

  const setBurst = (on)=>{
    if(on){ document.body.classList.add("burst-on"); $("burstOverlay").setAttribute("aria-hidden","false"); }
    else { document.body.classList.remove("burst-on"); $("burstOverlay").setAttribute("aria-hidden","true"); }
  };

  const cur = ()=> deck().words[burst.queue[burst.pos]];

  const burstRender = ()=>{
    const w=cur();
    burst.revealed=false;
    $("burstProgressPill").textContent = `Burst: ${burst.pos+1}/${burst.queue.length}`;
    $("burstStreakPill").textContent = `Streak: ${prog().streak}`;
    $("burstWord").textContent = w.word;
    $("burstDef").textContent = w.definition;
    $("burstSyn").textContent = w.synonym;
    $("burstSent").textContent = w.sentence;
    $("burstMasteryPill").textContent = `Mastery: ${Math.min(mastery(w.word),3)}/3`;
    $("burstReveal").style.display="none";
    $("burstRevealBtn").classList.remove("hidden");
    $("burstGotItBtn").classList.add("hidden");
    $("burstAgainBtn").classList.add("hidden");
    $("burstToast").textContent="Tap to reveal.";
    $("burstCelebrate").classList.add("hidden");
  };

  const reveal = ()=>{
    burst.revealed=true;
    $("burstReveal").style.display="block";
    $("burstRevealBtn").classList.add("hidden");
    $("burstGotItBtn").classList.remove("hidden");
    $("burstAgainBtn").classList.remove("hidden");
    $("burstToast").textContent="Got it or Again?";
    if(p().soundOn){ tone(660,60,"triangle",0.04); tone(880,70,"triangle",0.035); }
    haptic(8);
  };

  const gotIt = ()=>{
    if(!burst.revealed){ reveal(); return; }
    const w=cur();
    const pr=prog();
    pr.streak += 1;
    pr.mastery[w.word] = Math.min(3, (pr.mastery[w.word]||0) + 1);
    addXP(10);
    if(p().soundOn){ tone(784,70,"sine",0.05); tone(988,90,"sine",0.045); }
    haptic(10);
    nextInBurst();
  };

  const again = ()=>{
    if(!burst.revealed){ reveal(); return; }
    const pr=prog();
    pr.streak = 0;
    addXP(6);
    if(p().soundOn){ tone(220,90,"square",0.03); tone(180,120,"square",0.025); }
    haptic(14);
    // reinsert current card a few spots later
    const curIdx = burst.queue[burst.pos];
    const insertAt = Math.min(burst.pos+3, burst.queue.length);
    burst.queue.splice(insertAt,0,curIdx);
    nextInBurst();
  };

  const confetti = ()=>{
    const box=$("confettiBox");
    box.innerHTML="";
    for(let i=0;i<28;i++){
      const p=document.createElement("i");
      p.style.left = (Math.random()*100)+"%";
      p.style.animationDelay = (Math.random()*120)+"ms";
      p.style.transform = `translateY(0) rotate(${Math.random()*180}deg)`;
      box.appendChild(p);
    }
  };

  const rarityPick = ()=>{
    const r=Math.random();
    if(r<0.10) return "legendary";
    if(r<0.35) return "rare";
    return "common";
  };

  const collectibleEmoji = ()=>{
    const t=theme().id;
    const map = {
      studio_v1:["🧋","🍣","🍦","✨","🫧","🩰","🧸","💖","🧁","🧊","🍩","🫶"],
      quest_v1:["🗡️","🛡️","🧪","🧿","🧭","💎","🗝️","🐉","🏹","🧙","🪄","🧝"],
      battle_v1:["🎖️","🏅","🕹️","🧩","🎯","⚡️","🔥","💥","🥇","🪙","🚀","🎟️"],
      sports_v1:["🏆","⚽️","🏀","🏈","🎾","🥎","⛳️","🥇","📣","🎟️","🥤","🏟️"]
    };
    const arr = map[t] || map.studio_v1;
    return arr[Math.floor(Math.random()*arr.length)];
  };

  const unlockCollectible = ()=>{
    const pr=prog();
    const rar=rarityPick();
    const emo=collectibleEmoji();
    const item={emoji:emo,rarity:rar,ts:Date.now(),isNew:true};
    pr.collectibles.unshift(item);
    save(); updateClosetBadge();
    return item;
  };

  const burstEnd = ()=>{
    if(p().soundOn){ tone(523,80,"triangle",0.05); tone(659,80,"triangle",0.05); tone(784,140,"triangle",0.05); }
    haptic(16);
    confetti();
    const item=unlockCollectible();
    $("collectibleBig").textContent=item.emoji;
    $("collectibleBig").classList.remove("pop");
    void $("collectibleBig").offsetWidth; // restart animation
    $("collectibleBig").classList.add("pop");
    $("collectibleMeta").textContent = `${item.rarity.toUpperCase()} • added to Closet`;
    $("celebrateSub").textContent="You unlocked a collectible. IRL prizes stay secret 🤫";
    $("burstCelebrate").classList.remove("hidden");
  };

  const nextInBurst = ()=>{
    burst.pos += 1;
    save(); renderHUD();
    if(burst.pos >= burst.queue.length) burstEnd();
    else burstRender();
  };

  const startBurst = ()=>{
    const size = p().burstSize || 6;
    burst.queue = Array.from({length:size}, ()=>pickIndex());
    burst.pos=0; burst.revealed=false;
    applyTheme();
    setBurst(true);
    burstRender();
    if(p().soundOn){ tone(520,35,"sine",0.035); }
    haptic(10);
  };

  // --- Closet ---
  const renderCloset = (markSeen)=>{
    const pr=prog();
    if(markSeen){
      pr.collectibles.forEach(c=>c.isNew=false);
      save();
    }
    const g=$("closetGrid");
    if(!pr.collectibles.length){
      g.innerHTML = `<div class="tiny">No collectibles yet. Finish a burst ✨</div>`;
      updateClosetBadge();
      return;
    }
    g.innerHTML = pr.collectibles.slice(0,60).map(c=>`
      <div class="sticker ${c.rarity}">
        <div class="emoji">${c.emoji}</div>
        <div class="meta">${c.rarity}</div>
        ${c.isNew?`<div class="new">NEW</div>`:""}
      </div>
    `).join("");
    updateClosetBadge();
  };

  const updateClosetBadge = ()=>{
    try{
      const hasNew = (prog().collectibles||[]).some(c=>c.isNew);
      $("closetBadge").classList.toggle("hidden", !hasNew);
    }catch{}
  };

  // --- Settings ---
  const updateSettingsUI = ()=>{
    $("burstSize").value = String(p().burstSize || 6);
  };

  // --- Swipes ---
  const wireSwipes = ()=>{
    const card=$("burstCard");
    let x0=0,y0=0,t0=0;
    card.addEventListener("touchstart",(e)=>{
      const t=e.changedTouches[0];
      x0=t.clientX; y0=t.clientY; t0=Date.now();
    },{passive:true});
    card.addEventListener("touchend",(e)=>{
      const t=e.changedTouches[0];
      const dx=t.clientX-x0, dy=t.clientY-y0;
      const dt=Date.now()-t0;
      if(Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 45){
        if(dx>0) gotIt(); else again();
        return;
      }
      // "tap" (quick touch)
      if(Math.abs(dx)<10 && Math.abs(dy)<10 && dt<350){
        if(!burst.revealed) reveal();
      }
    },{passive:true});
  };

  // --- Helpers ---
  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, m=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[m]));
  }

  // --- Events ---
  $("tabPlay").addEventListener("click", ()=>setPane("play"));
  $("tabCloset").addEventListener("click", ()=>setPane("closet"));
  $("tabSettings").addEventListener("click", ()=>setPane("settings"));

  $("startBurstBtn").addEventListener("click", startBurst);
  $("exitBurstBtn").addEventListener("click", ()=>{ setBurst(false); renderHUD(); });
  $("burstRevealBtn").addEventListener("click", ()=>{ tone(520,35,"sine",0.035); haptic(8); reveal(); });
  $("burstGotItBtn").addEventListener("click", gotIt);
  $("burstAgainBtn").addEventListener("click", again);
  $("nextBurstBtn").addEventListener("click", ()=>{ $("burstCelebrate").classList.add("hidden"); startBurst(); });
  $("closeCelebrateBtn").addEventListener("click", ()=>{ $("burstCelebrate").classList.add("hidden"); setBurst(false); });

  $("burstSize").addEventListener("change", (e)=>{ p().burstSize=parseInt(e.target.value,10)||6; save(); });
  $("soundToggleBtn").addEventListener("click", ()=>{ p().soundOn=!p().soundOn; save(); updateSettingsUI(); tone(660,60,"triangle",0.03); });
  $("switchProfileBtn").addEventListener("click", ()=>{ flow.step="profiles"; renderFlow(); });

  // --- Boot ---
  const showSplash = ()=>{
    const sp=$("logoSplash");
    setTimeout(()=>{ sp.style.opacity="0"; sp.style.transition="opacity .35s ease"; }, 950);
    setTimeout(()=>{ sp.remove(); }, 1350);
  };

  (function init(){
    load();
    if(Object.keys(S.profiles).length===0){
      makeProfile("Daughter","studio_v1");
      makeProfile("Son","quest_v1");
      save();
    }
    if(!S.active.profileId) S.active.profileId = Object.keys(S.profiles)[0];
    if(!S.active.deckId) S.active.deckId = DECKS[0].id;

    applyTheme(); updateSettingsUI(); renderHUD();
    $("bottomNav").classList.remove("hidden");
    enterApp();

    wireSwipes();
    showSplash();
  })();

})();