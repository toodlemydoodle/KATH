// Elements
const book3d = document.getElementById('book3d');
const cover  = document.getElementById('cover');
const book   = document.getElementById('book');
const pages  = [...book.querySelectorAll('.page')].sort(
  (a,b)=>Number(a.dataset.page)-Number(b.dataset.page)
);

let index = 0;
let reversing = false;
let opened = false; // cover state

// Initial: closed book
book3d.classList.add('closed');

// ----- Single background audio -----
const bgMusic = document.getElementById('bg-music');
let soundEnabled = false;

function enableAudioOnce(){
  // Called the first time the cover is opened
  if (soundEnabled) return;
  soundEnabled = true;
  if (!bgMusic) return;

  bgMusic.currentTime = 0;
  bgMusic.volume = 1.0;
  bgMusic.play().catch(()=>{
    // If the browser blocks autoplay, further clicks can try again.
  });
}

// ----- Page state & stacking with curled rest -----
function setStates({ curl = null } = {}){
  pages.forEach((p,i)=>{
    p.classList.remove('left','right','current','curl-forward','curl-back');

    const stackDepth = (i < index) ? (index - i) : 0;
    p.style.setProperty('--stack', stackDepth);

    if(i < index){ p.classList.add('left'); }
    else if(i === index){ p.classList.add('current','right'); }
    else { p.classList.add('right'); }

    p.style.zIndex = String(200 - Math.abs(i - index));
  });

  if(curl && curl.which != null){
    const pg = pages[curl.which];
    if(pg) pg.classList.add(curl.dir === 'forward' ? 'curl-forward' : 'curl-back');
    setTimeout(()=>{ if(pg) pg.classList.remove('curl-forward','curl-back'); }, 750);
  }

  // No more handleAudioForPage(index) here
  if (index === pages.length - 1) startFireworks(); else stopFireworks();
}

// ----- Open / Close cover -----
function openCover(){
  if(opened) return;
  opened = true;
  book3d.classList.remove('closed','closing');
  book3d.classList.add('open');
}
function closeCover(){
  opened = false;
  book3d.classList.remove('open');
  book3d.classList.add('closing');
  setTimeout(()=>{
    book3d.classList.remove('closing');
    book3d.classList.add('closed');
  }, 1100);
}

// ----- Navigation behavior -----
function next(){
  if(!opened){
    openCover();
    enableAudioOnce(); // start music the first time the cover opens
    return;
  }
  if(index < pages.length - 1){
    const turning = index;
    index++;
    setStates({ curl:{ which: turning, dir:'forward' } });
  } else {
    reverseBackToFirstAndClose();
  }
}
function prev(){
  if(!opened) return;
  if(index > 0){
    const turning = index - 1;
    index--;
    setStates({ curl:{ which: turning, dir:'back' } });
  }
}

// Tap / click anywhere
function onAdvance(){ next(); }
document.body.addEventListener('click', onAdvance);
document.body.addEventListener('touchstart', onAdvance, {passive:true});

// Optional keyboard
document.addEventListener('keydown', e=>{
  if(e.key==='ArrowRight') next();
  if(e.key==='ArrowLeft')  prev();
});

// Reverse sequence then close cover
function reverseBackToFirstAndClose(){
  if(reversing) return;
  reversing = true;
  const stepMs = 360;

  const step = ()=>{
    if(index > 0){
      const turning = index - 1;
      index--;
      setStates({ curl:{ which: turning, dir:'back' } });
      setTimeout(step, stepMs);
    } else {
      reversing = false;
      setStates();
      stopFireworks();
      closeCover();
      // If you ever want the music to stop when the book closes, uncomment:
      // if (bgMusic) bgMusic.pause();
    }
  };
  setTimeout(step, stepMs);
}

// Stars
document.querySelectorAll('.stars').forEach(container=>{
  const count = Number(container.getAttribute('data-stars')||10);
  for(let i=0;i<count;i++){
    const s = document.createElement('div');
    s.className='star';
    s.style.left = Math.random()*100+'%';
    s.style.animationDelay = (Math.random()*6)+'s';
    s.style.animationDuration = (6+Math.random()*8)+'s';
    container.appendChild(s);
  }
});

// ----- Fireworks (only on finale) -----
const canvas = document.getElementById('fireworks');
const ctx = canvas.getContext('2d');
let DPR = 1, W = 0, H = 0;
function resize(){
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  W = window.innerWidth;
  H = window.innerHeight;
  canvas.width  = Math.floor(W * DPR);
  canvas.height = Math.floor(H * DPR);
  canvas.style.width='100vw';
  canvas.style.height='100vh';
  ctx.setTransform(DPR,0,0,DPR,0,0);
}
resize();
window.addEventListener('resize', resize);

const sparks = [];
function burst(x,y,color,amount=80){
  for(let i=0;i<amount;i++){
    const a=Math.random()*Math.PI*2;
    const speed=Math.random()*4+1.5;
    sparks.push({
      x,y,
      vx:Math.cos(a)*speed,
      vy:Math.sin(a)*speed,
      life:Math.random()*60+40,
      color
    });
  }
}
function fireworksBurst(amount){
  if(amount<=0) return;
  const colors=[
    '#8cffc9',  // emerald glow
    '#32ff7e',  // bright green
    '#a259ff',  // witchy purple
    '#f8d777',  // warm gold
    '#ffffff'   // white spark
  ];
  for(let i=0;i<amount;i++){
    const x=Math.random()*W;
    const y=Math.random()*(H*0.45)+H*0.05;
    burst(x,y,colors[Math.floor(Math.random()*colors.length)],
          60+Math.floor(Math.random()*25));
  }
}
function loop(){
  ctx.clearRect(0,0,W,H);
  for(let i=sparks.length-1;i>=0;i--){
    const s=sparks[i];
    s.life--;
    if(s.life<=0){
      sparks.splice(i,1);
      continue;
    }
    s.vy+=0.02;
    s.x+=s.vx;
    s.y+=s.vy;
    ctx.globalCompositeOperation='lighter';
    ctx.beginPath();
    ctx.arc(s.x,s.y,2,0,Math.PI*2);
    ctx.fillStyle=s.color;
    ctx.fill();
  }
  requestAnimationFrame(loop);
}
loop();

let fwSmallTimer=null, fwBigTimer=null;
function startFireworks(){
  if(fwSmallTimer||fwBigTimer) return;
  fwSmallTimer=setInterval(()=>fireworksBurst(3),700);
  fwBigTimer=setInterval(()=>fireworksBurst(10),6000+Math.random()*4000);
}
function stopFireworks(){
  if(fwSmallTimer){
    clearInterval(fwSmallTimer);
    fwSmallTimer=null;
  }
  if(fwBigTimer){
    clearInterval(fwBigTimer);
    fwBigTimer=null;
  }
  sparks.length=0;
  ctx.clearRect(0,0,W,H);
}

// Init
setStates();
