/* ═══════════════════════════════════════════════════════════════════════════
   AIOS-X · Motion Studio
   Vibe Motion × Cinema Studio — Voice-Driven Deterministic Motion Graphics
   Autonomous TALON Orchestration · Multi-Model Debate Chain
═══════════════════════════════════════════════════════════════════════════ */

// ── SEEDED PRNG (LCG) ────────────────────────────────────────────────────────
function MotionRNG(seed) {
  this.seed = (Math.abs(seed | 0) % 2147483647) || 1;
}
MotionRNG.prototype.next = function () {
  this.seed = (this.seed * 16807) % 2147483647;
  return (this.seed - 1) / 2147483646;
};
MotionRNG.prototype.range = function (lo, hi) { return lo + this.next() * (hi - lo); };
MotionRNG.prototype.int   = function (lo, hi) { return Math.floor(this.range(lo, hi + 0.9999)); };
MotionRNG.prototype.pick  = function (arr)    { return arr[Math.floor(this.next() * arr.length)]; };

function motionHash(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = (h * 0x01000193) >>> 0; }
  return (h % 8999) + 1001;
}

// ── TEMPLATE REGISTRY ────────────────────────────────────────────────────────
var MOTION_TEMPLATES = {
  'product-catalog':     { label: 'Product Catalog',    icon: '🛍️', dur: 6000 },
  'orbit-ring':          { label: 'Orbit Ring',         icon: '⭕',  dur: 5000 },
  'metrics-chart':       { label: 'Metrics Chart',      icon: '📊',  dur: 5000 },
  'analytics-dash':      { label: 'Analytics',          icon: '📈',  dur: 6000 },
  'ui-interaction':      { label: 'UI Interaction',     icon: '🖱️',  dur: 5000 },
  'media-player':        { label: 'Media Player',       icon: '🎵',  dur: 5000 },
  'comment-popup':       { label: 'Comment Pop-up',     icon: '💬',  dur: 4000 },
  'homepage-grid':       { label: 'Homepage Grid',      icon: '🏠',  dur: 6000 },
  'inbox-feed':          { label: 'Inbox Feed',         icon: '📧',  dur: 5000 },
  'shape-gradient':      { label: 'Shape Gradient',     icon: '✨',  dur: 4000 },
  'timeline-3d':         { label: '3D Timeline',        icon: '🎬',  dur: 5000 },
  'caption-overlay':     { label: 'Caption Overlay',    icon: '📝',  dur: 5000 },
};

var MOTION_PATTERNS = [
  [/product|catalog|swipe|iphone|macbook|price.*\$|shop|apple.*pro/i,          'product-catalog'],
  [/ring|orbit|circular.*widget|circling|revolv|emoji.*ring/i,                  'orbit-ring'],
  [/metric|performance.*chart|brand.*color|revenue|gather.*metric/i,            'metrics-chart'],
  [/analytic|three.*graph|youtube.*analytic|separate.*section/i,                'analytics-dash'],
  [/button|cursor.*hover|click.*open|ui.*button|mouse.*cursor/i,                'ui-interaction'],
  [/apple music|music.*widget|album|shuffle|artist|track/i,                     'media-player'],
  [/youtube comment|comment.*pop|user.*profile.*comment|notification.*comment/i,'comment-popup'],
  [/youtube.*home|homepage.*grid|thumbnail.*grid|three.*row|video.*grid/i,      'homepage-grid'],
  [/gmail|inbox|email.*notification|inbox.*filling|sender/i,                    'inbox-feed'],
  [/circular.*widget.*number|three.*circular|blue.*gradient.*widget|number.*badge/i,'shape-gradient'],
  [/3d.*timeline|editing.*timeline|timeline.*anim|mouse.*float.*3d/i,           'timeline-3d'],
  [/caption|subtitle.*clip|text.*overlay|captions.*video/i,                     'caption-overlay'],
];

function motionClassify(prompt) {
  for (var i = 0; i < MOTION_PATTERNS.length; i++) {
    if (MOTION_PATTERNS[i][0].test(prompt)) return MOTION_PATTERNS[i][1];
  }
  return 'shape-gradient';
}

// ── MATH UTILS ───────────────────────────────────────────────────────────────
function mClamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function mLerp(a, b, t)   { return a + (b - a) * t; }
function mRemap(v, a, b, c, d) { return mLerp(c, d, mClamp((v - a) / (b - a), 0, 1)); }
function eOut3(t)   { return 1 - Math.pow(1 - t, 3); }
function eIO3(t)    { return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2; }
function eBack(t)   { var c1=1.70158,c3=c1+1; return 1+c3*Math.pow(t-1,3)+c1*Math.pow(t-1,2); }
function eBounce(t) {
  var n=7.5625,d=2.75;
  if (t < 1/d) return n*t*t;
  if (t < 2/d) { t-=1.5/d; return n*t*t+0.75; }
  if (t < 2.5/d) { t-=2.25/d; return n*t*t+0.9375; }
  t-=2.625/d; return n*t*t+0.984375;
}
function eSlide(t) { return mClamp(t, 0, 1); }

// ── CANVAS HELPERS ───────────────────────────────────────────────────────────
function rrect(ctx, x, y, w, h, r) {
  r = Math.min(r, w/2, h/2);
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.arcTo(x+w, y, x+w, y+h, r);
  ctx.arcTo(x+w, y+h, x, y+h, r);
  ctx.arcTo(x, y+h, x, y, r);
  ctx.arcTo(x, y, x+w, y, r);
  ctx.closePath();
}
function circ(ctx, cx, cy, r) { ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.closePath(); }
function mText(ctx, text, x, y, size, weight, color, align, baseline, maxW) {
  ctx.save();
  ctx.font = (weight||'normal')+' '+(size||14)+"px 'Space Grotesk', sans-serif";
  ctx.fillStyle = color || '#fff';
  ctx.textAlign  = align    || 'left';
  ctx.textBaseline = baseline || 'alphabetic';
  if (maxW) ctx.fillText(text, x, y, maxW);
  else ctx.fillText(text, x, y);
  ctx.restore();
}
function setShadow(ctx, color, blur, ox, oy) {
  ctx.shadowColor = color; ctx.shadowBlur = blur;
  ctx.shadowOffsetX = ox||0; ctx.shadowOffsetY = oy||0;
}
function clrShadow(ctx) { ctx.shadowColor='transparent'; ctx.shadowBlur=0; ctx.shadowOffsetX=0; ctx.shadowOffsetY=0; }

// ── PARAMETER GENERATORS ─────────────────────────────────────────────────────
function genParams(tplId, prompt, seed) {
  var rng = new MotionRNG(seed);
  switch (tplId) {
    case 'product-catalog': return {
      title: 'Apple',
      products: [
        { name:'iPhone 16 Pro', price:'$1,199', feature:'48MP ProRAW', accent:'#00d4ff' },
        { name:'MacBook Air M4', price:'$1,099', feature:'M4 Neural Engine', accent:'#a78bfa' },
        { name:'AirPods Pro 2', price:'$249',   feature:'H2 Adaptive EQ', accent:'#34d399' },
      ],
      bg1:'#0d0d1a', bg2:'#1a0d2e',
    };
    case 'orbit-ring': {
      var pool = ['⚡','🔥','💎','🚀','🌟','💫','🎯','🔮','🌈','✨','🎪','🦋'];
      return {
        outerEmojis: [rng.pick(pool), rng.pick(pool), rng.pick(pool)],
        innerEmojis: [rng.pick(pool), rng.pick(pool)],
        outerR: 120, innerR: 65, outerSpeed: 0.6, innerSpeed: -1.1,
        ringColor: 'hsl('+rng.int(200,280)+',80%,60%)',
        innerColor: 'hsl('+rng.int(30,80)+',80%,60%)',
        bg1:'#080818', bg2:'#180828',
      };
    }
    case 'metrics-chart': {
      var co = (prompt.match(/for\s+(\w+)/i)||[])[1] || 'Apple';
      var themes = {
        netflix:{ bg1:'#141414',bg2:'#1f1f1f',accent:'#E50914',bars:['#E50914','#c70812','#a50710','#830509','#610407'] },
        apple:  { bg1:'#1c1c1e',bg2:'#2c2c2e',accent:'#007AFF',bars:['#007AFF','#34C759','#FF9F0A','#FF375F','#BF5AF2'] },
        google: { bg1:'#202124',bg2:'#303134',accent:'#4285F4',bars:['#4285F4','#34A853','#FBBC05','#EA4335','#9AA0A6'] },
        youtube:{ bg1:'#0f0f0f',bg2:'#1a1a1a',accent:'#FF0000',bars:['#FF0000','#cc0000','#990000','#ff4444','#ff8888'] },
      };
      var key = co.toLowerCase();
      return {
        company: co.charAt(0).toUpperCase()+co.slice(1),
        theme: themes[key] || themes.apple,
        metrics: [
          { label:'Revenue', value:rng.int(20,80), suffix:'B' },
          { label:'Users',   value:rng.int(100,400), suffix:'M' },
          { label:'Growth',  value:rng.int(5,35),  suffix:'%' },
          { label:'Markets', value:rng.int(50,190), suffix:'' },
          { label:'ARPU',    value:rng.int(10,50),  suffix:'$' },
        ],
      };
    }
    case 'analytics-dash': return {
      title:'YouTube', titleColor:'#FF0000',
      bg1:'#0f0f0f', bg2:'#1a1a1a',
      graphs: [
        { label:'Views',      type:'line', color:'#FF0000', data:[0.4,0.6,0.5,0.8,0.7,0.9,1.0] },
        { label:'Watch Time', type:'bar',  color:'#FF4444', data:[0.5,0.7,0.6,0.9,0.8,1.0] },
        { label:'Revenue',    type:'area', color:'#FF6666', data:[0.3,0.5,0.4,0.7,0.6,0.9] },
      ],
    };
    case 'ui-interaction': {
      var sets = [['Dashboard','Analytics','Settings'],['Profile','Messages','Payments'],['Home','Explore','Notifications']];
      return { buttons: rng.pick(sets), bg1:'#f8fafc', bg2:'#e2e8f0', accent:'#6366f1' };
    }
    case 'media-player': return {
      tracks: [
        { name:'Flowers',       artist:'Miley Cyrus',  dur:'3:21', color:'#ff6b9d' },
        { name:'Anti-Hero',     artist:'Taylor Swift', dur:'3:20', color:'#a855f7' },
        { name:'As It Was',     artist:'Harry Styles', dur:'2:37', color:'#3b82f6' },
        { name:'Blinding Lights',artist:'The Weeknd',  dur:'3:22', color:'#10b981' },
      ],
      bg1:'#1c1c1e', bg2:'#2c2c2e', accent:'#fc3c44',
    };
    case 'comment-popup': {
      var users = ['@CyberWanderer','@TechEnthusiast','@CreatorPro','@DigitalNomad'];
      var coms  = [
        'This is absolutely incredible! Mind-blowing 🔥',
        'I never thought AI could do this. Wow!',
        'Been waiting years for this. Game changer 🚀',
        "The motion is so smooth. Can't believe it's AI",
      ];
      var idx = rng.int(0,3);
      return { username:users[idx], comment:coms[idx], likes:rng.int(120,9800),
               avatarColor:['#FF6B6B','#4ECDC4','#45B7D1','#96CEB4'][idx],
               timestamp:rng.int(1,23)+' hours ago', bg:'#0f0f0f', accent:'#FF0000' };
    }
    case 'homepage-grid': {
      var titles = ['Building AI Apps 2026','The Future of Work','10 Life Habits','React Tutorial',
                    'How I Made $10K/Mo','Deep Sea Mysteries','Top 5 AI Tools','Road Trip Vlog','Cooking Science'];
      var cols   = ['#FF6B6B','#4ECDC4','#45B7D1','#96CEB4','#FFEAA7','#DDA0DD','#98D8C8','#F7D794','#778CA3'];
      return { bg:'#0f0f0f', accent:'#FF0000',
        videos: titles.map(function(t,i){ return { title:t, thumbColor:cols[i], views:rng.int(100,999)+'K' }; }) };
    }
    case 'inbox-feed': {
      var senders  = ['Google','Figma','GitHub','Notion','Linear','Vercel'];
      var subjects = ['Weekly security summary','New team member joined','PR #847 approved',
                      '3 unread comments','Issue assigned to you','Deploy v2.4.1 successful'];
      var dotClrs  = ['#4285F4','#A259FF','#238636','#000000','#5E6AD2','#000000'];
      return { bg1:'#ffffff', bg2:'#f8f9fa', accent:'#1a73e8',
        emails: senders.map(function(s,i){ return { sender:s, subject:subjects[i], color:dotClrs[i], time:rng.int(1,59)+'m' }; }) };
    }
    case 'shape-gradient': return {
      numbers:['1','2','3'],
      bg1:'#0a1628', bg2:'#1a2a4a',
      c1:'#1e3a6e', c2:'#2b52a0', accent:'#60a5fa',
    };
    case 'timeline-3d': {
      var clips  = ['Intro','Interview','B-Roll','Outro','VFX','Audio'];
      var cclrs  = ['#FF6B6B','#4ECDC4','#45B7D1','#96CEB4','#FFEAA7','#A8A8A8'];
      return { bg1:'#1a1a1a', bg2:'#2d2d2d', accent:'#00d4ff', playhead:0.35,
        tracks: clips.map(function(n,i){ return { name:n, color:cclrs[i], len:0.3+i*0.1 }; }) };
    }
    case 'caption-overlay': {
      var lines = [
        ['No.','God, no.','God, please, no no no.'],
        ['This changes everything.','Forever.','No going back.'],
        ['Wait for it...','It\'s coming.','There it is. 🔥'],
        ['Tell me you saw that.','Incredible.','Absolutely wild.'],
      ];
      return { lines:rng.pick(lines), bg1:'#000', style:rng.pick(['bold','impact','minimal']) };
    }
    default: return { numbers:['1','2','3'], bg1:'#0a1628', bg2:'#1a2a4a', c1:'#1e3a6e', c2:'#2b52a0', accent:'#60a5fa' };
  }
}

// ── RENDERERS ─────────────────────────────────────────────────────────────────
function renderProductCatalog(ctx, t, p, W, H) {
  var bg = ctx.createLinearGradient(0,0,0,H);
  bg.addColorStop(0, p.bg1); bg.addColorStop(1, p.bg2);
  ctx.fillStyle = bg; ctx.fillRect(0,0,W,H);

  var tT = mClamp(t*5,0,1);
  ctx.globalAlpha = eOut3(tT);
  mText(ctx, p.title+' Collection', W/2, 48, 22, '700', '#fff', 'center');
  mText(ctx, 'Swipe to explore', W/2, 70, 13, '400', 'rgba(255,255,255,0.4)', 'center');
  ctx.globalAlpha = 1;

  p.products.forEach(function(pr, i) {
    var cT = mClamp((t - i*0.28)/0.35, 0, 1); if (cT <= 0) return;
    var slideX = mLerp(W, 0, eOut3(cT));
    var y = 95 + i*185, cW = W-40, cH = 165;
    ctx.save(); ctx.translate(slideX, 0); ctx.globalAlpha = mClamp(cT*3,0,1);
    setShadow(ctx, pr.accent+'44', 20);
    rrect(ctx, 20, y, cW, cH, 18); ctx.fillStyle='rgba(255,255,255,0.04)'; ctx.fill(); clrShadow(ctx);
    rrect(ctx, 20, y, cW, cH, 18); ctx.strokeStyle='rgba(255,255,255,0.08)'; ctx.lineWidth=1; ctx.stroke();
    var ig = ctx.createLinearGradient(30,y+12,145,y+cH-12);
    ig.addColorStop(0, pr.accent+'33'); ig.addColorStop(1, pr.accent+'88');
    rrect(ctx, 30, y+12, 110, cH-24, 12); ctx.fillStyle=ig; ctx.fill();
    mText(ctx, i===0?'📱':i===1?'💻':'🎧', 85, y+cH/2+10, i===0?36:i===1?28:24, '400', '#fff', 'center');
    mText(ctx, pr.name,    158, y+44, 16, '700', '#fff');
    mText(ctx, pr.price,   158, y+76, 26, '700', pr.accent);
    rrect(ctx, 158, y+90, 145, 26, 13); ctx.fillStyle=pr.accent+'22'; ctx.fill();
    rrect(ctx, 158, y+90, 145, 26, 13); ctx.strokeStyle=pr.accent+'55'; ctx.lineWidth=1; ctx.stroke();
    ctx.save(); ctx.font="11px 'JetBrains Mono',monospace"; ctx.fillStyle=pr.accent; ctx.fillText(pr.feature,165,y+108); ctx.restore();
    ctx.restore();
  });
}

function renderOrbitRing(ctx, t, p, W, H) {
  var cx=W/2, cy=H/2;
  var bg = ctx.createRadialGradient(cx,cy,0,cx,cy,H*0.7);
  bg.addColorStop(0,p.bg2); bg.addColorStop(1,p.bg1);
  ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);
  var fi = mClamp(t*4,0,1); ctx.globalAlpha=fi;
  var time = t*Math.PI*2;

  function drawRing(r, color, emojis, speed, eSize) {
    setShadow(ctx, color+'88', 20);
    ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2);
    ctx.strokeStyle=color+'aa'; ctx.lineWidth=2.5; ctx.stroke(); clrShadow(ctx);
    emojis.forEach(function(em,i){
      var a = time*speed + (i/emojis.length)*Math.PI*2;
      var wx=cx+Math.cos(a)*r, wy=cy+Math.sin(a)*r;
      setShadow(ctx, color+'66', 12);
      circ(ctx,wx,wy,eSize+4);
      var wg=ctx.createRadialGradient(wx,wy,0,wx,wy,eSize+4);
      wg.addColorStop(0,color+'44'); wg.addColorStop(1,color+'11');
      ctx.fillStyle=wg; ctx.fill(); clrShadow(ctx);
      ctx.strokeStyle=color+'cc'; ctx.lineWidth=1.5; ctx.stroke();
      mText(ctx,em,wx,wy+eSize*0.35,eSize,'400','#fff','center');
    });
  }
  drawRing(p.outerR, p.ringColor,  p.outerEmojis, p.outerSpeed,  22);
  drawRing(p.innerR, p.innerColor, p.innerEmojis, p.innerSpeed, 18);
  circ(ctx,cx,cy,6); ctx.fillStyle='#ffffff33'; ctx.fill();
  ctx.globalAlpha=1;
}

function renderMetricsChart(ctx, t, p, W, H) {
  var th=p.theme;
  var bg=ctx.createLinearGradient(0,0,0,H); bg.addColorStop(0,th.bg1); bg.addColorStop(1,th.bg2);
  ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);
  ctx.globalAlpha=eOut3(mClamp(t*5,0,1));
  mText(ctx,p.company,W/2,55,28,'800',th.accent,'center');
  mText(ctx,'Performance Metrics',W/2,78,13,'400','rgba(255,255,255,0.4)','center');
  ctx.globalAlpha=1;
  var cX=30,cY=108,cW=W-60,cH=H-220;
  var bW=Math.floor((cW-(p.metrics.length-1)*12)/p.metrics.length);
  var maxV=Math.max.apply(null,p.metrics.map(function(m){return m.value;}));
  p.metrics.forEach(function(m,i){
    var bT=mClamp((t-0.1-i*0.1)/0.35,0,1); if(bT<=0) return;
    var bH2=cH*(m.value/maxV)*eOut3(bT);
    var bx=cX+i*(bW+12), by=cY+cH-bH2;
    setShadow(ctx,th.bars[i%th.bars.length]+'66',15);
    var bg2=ctx.createLinearGradient(bx,by,bx,cY+cH);
    bg2.addColorStop(0,th.bars[i%th.bars.length]); bg2.addColorStop(1,th.bars[i%th.bars.length]+'33');
    rrect(ctx,bx,by,bW,bH2,6); ctx.fillStyle=bg2; ctx.fill(); clrShadow(ctx);
    if(bT>0.6){ ctx.globalAlpha=mClamp((bT-0.6)/0.4,0,1);
      mText(ctx,m.value+m.suffix,bx+bW/2,by-8,14,'700',th.bars[i%th.bars.length],'center');
      ctx.globalAlpha=1; }
    mText(ctx,m.label,bx+bW/2,cY+cH+20,11,'400','rgba(255,255,255,0.5)','center');
  });
  ctx.beginPath(); ctx.moveTo(cX-5,cY+cH); ctx.lineTo(cX+cW+5,cY+cH);
  ctx.strokeStyle='rgba(255,255,255,0.1)'; ctx.lineWidth=1; ctx.stroke();
}

function renderAnalyticsDash(ctx, t, p, W, H) {
  var bg=ctx.createLinearGradient(0,0,0,H); bg.addColorStop(0,p.bg1); bg.addColorStop(1,p.bg2);
  ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);
  ctx.globalAlpha=eOut3(mClamp(t*5,0,1));
  mText(ctx,p.title,W/2,50,30,'800',p.titleColor,'center');
  mText(ctx,'Analytics Dashboard',W/2,72,12,'400','rgba(255,255,255,0.4)','center');
  ctx.globalAlpha=1;
  var gH=(H-130)/3-10;
  p.graphs.forEach(function(g,gi){
    var gT=mClamp((t-0.1-gi*0.25)/0.4,0,1); if(gT<=0) return;
    var gx=20,gy=92+gi*(gH+12),gw=W-40;
    ctx.save(); ctx.globalAlpha=eOut3(gT);
    rrect(ctx,gx,gy,gw,gH,10); ctx.fillStyle='rgba(255,255,255,0.04)'; ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,0.07)'; ctx.lineWidth=1; ctx.stroke();
    mText(ctx,g.label,gx+12,gy+20,12,'600',g.color);
    var dw=gw-24,dh=gH-38,dx=gx+12,dy=gy+28;
    if(g.type==='line'||g.type==='area'){
      var pts=g.data.map(function(v,i){return{x:dx+(i/(g.data.length-1))*dw,y:dy+dh-dh*v*gT};});
      if(g.type==='area'){
        ctx.beginPath(); ctx.moveTo(pts[0].x,dy+dh);
        pts.forEach(function(pt){ctx.lineTo(pt.x,pt.y);}); ctx.lineTo(pts[pts.length-1].x,dy+dh); ctx.closePath();
        var ag=ctx.createLinearGradient(0,dy,0,dy+dh); ag.addColorStop(0,g.color+'44'); ag.addColorStop(1,g.color+'00');
        ctx.fillStyle=ag; ctx.fill();
      }
      ctx.beginPath(); pts.forEach(function(pt,i){if(i===0)ctx.moveTo(pt.x,pt.y);else ctx.lineTo(pt.x,pt.y);});
      ctx.strokeStyle=g.color; ctx.lineWidth=2; ctx.stroke();
      pts.forEach(function(pt){circ(ctx,pt.x,pt.y,3); ctx.fillStyle=g.color; ctx.fill();});
    } else {
      var bw2=Math.floor(dw/g.data.length)-4;
      g.data.forEach(function(v,i){
        var bh2=dh*v*gT, bx2=dx+i*(dw/g.data.length);
        var bg3=ctx.createLinearGradient(bx2,dy+dh-bh2,bx2,dy+dh);
        bg3.addColorStop(0,g.color); bg3.addColorStop(1,g.color+'33');
        rrect(ctx,bx2,dy+dh-bh2,bw2,bh2,3); ctx.fillStyle=bg3; ctx.fill();
      });
    }
    ctx.restore();
  });
}

function renderUiInteraction(ctx, t, p, W, H) {
  var bg=ctx.createLinearGradient(0,0,0,H); bg.addColorStop(0,p.bg1); bg.addColorStop(1,p.bg2);
  ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);
  var og=ctx.createRadialGradient(W/2,H/3,0,W/2,H/3,H*0.8);
  og.addColorStop(0,p.accent+'22'); og.addColorStop(1,'transparent');
  ctx.fillStyle=og; ctx.fillRect(0,0,W,H);
  var wT=mClamp(t*4,0,1),ww=W-60,wh=240,wx=30,wy=(H-wh)/2-20;
  ctx.save(); ctx.globalAlpha=eOut3(wT); ctx.translate(0,mLerp(20,0,eOut3(wT)));
  setShadow(ctx,'rgba(0,0,0,0.15)',30,0,8);
  rrect(ctx,wx,wy,ww,wh,20); ctx.fillStyle='#ffffff'; ctx.fill(); clrShadow(ctx);
  mText(ctx,'Quick Actions',wx+20,wy+32,16,'700','#1e293b');
  var cycleT=(t*2)%1, activeIdx=Math.floor(cycleT*p.buttons.length);
  p.buttons.forEach(function(label,i){
    var bx=wx+16,by=wy+50+i*62,bw2=ww-32,bh2=50,isH=(i===activeIdx&&t>0.2);
    rrect(ctx,bx,by,bw2,bh2,12);
    ctx.fillStyle=isH?'rgba(99,102,241,0.08)':'rgba(248,250,252,1)'; ctx.fill();
    rrect(ctx,bx,by,bw2,bh2,12); ctx.strokeStyle=isH?p.accent+'aa':'rgba(226,232,240,1)'; ctx.lineWidth=1.5; ctx.stroke();
    mText(ctx,label,bx+16,by+32,14,'600',isH?p.accent:'#475569');
    ctx.save(); ctx.strokeStyle=isH?p.accent:'#94a3b8'; ctx.lineWidth=1.5;
    var cx2=bx+bw2-20,cy2=by+bh2/2;
    ctx.beginPath(); ctx.moveTo(cx2-4,cy2-5); ctx.lineTo(cx2+2,cy2); ctx.lineTo(cx2-4,cy2+5); ctx.stroke(); ctx.restore();
  });
  ctx.restore();
  if(t>0.2){
    var curT=mClamp((t-0.2)/0.8,0,1);
    var bi=Math.min(Math.floor(curT*p.buttons.length),p.buttons.length-1);
    var cY2=wy+50+bi*62+25, cX2=mLerp(W*0.7,wx+ww-55,eIO3(mClamp(curT*2,0,1)));
    var cY3=mLerp(H*0.3,cY2,eIO3(mClamp(curT*2,0,1)));
    drawCursor(ctx,cX2,cY3,curT>0.75?mClamp((curT-0.75)/0.25,0,1):0);
  }
}

function drawCursor(ctx,x,y,clickT){
  var sc=clickT>0?mLerp(1,0.85,Math.sin(clickT*Math.PI)):1;
  ctx.save(); ctx.translate(x,y); ctx.scale(sc,sc);
  ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0,20); ctx.lineTo(4.5,16); ctx.lineTo(8,22);
  ctx.lineTo(10,21); ctx.lineTo(6.5,15); ctx.lineTo(12,15); ctx.closePath();
  setShadow(ctx,'rgba(0,0,0,0.4)',6,1,2);
  ctx.fillStyle='#ffffff'; ctx.fill(); clrShadow(ctx);
  ctx.strokeStyle='#1e293b'; ctx.lineWidth=1.5; ctx.stroke(); ctx.restore();
}

function renderMediaPlayer(ctx,t,p,W,H){
  var bg=ctx.createLinearGradient(0,0,0,H); bg.addColorStop(0,p.bg1); bg.addColorStop(1,p.bg2);
  ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);
  ctx.globalAlpha=eOut3(mClamp(t*5,0,1));
  mText(ctx,'♫ Apple Music',W/2,50,20,'700',p.accent,'center'); ctx.globalAlpha=1;
  var sT=mClamp((t-0.1)/0.3,0,1);
  ctx.save(); ctx.globalAlpha=eOut3(sT);
  rrect(ctx,W/2-60,64,120,36,18); ctx.fillStyle=p.accent+'cc'; ctx.fill();
  mText(ctx,'⇄  Shuffle',W/2,88,14,'600','#fff','center'); ctx.restore();
  p.tracks.forEach(function(tr,i){
    var tT=mClamp((t-0.2-i*0.15)/0.3,0,1); if(tT<=0) return;
    var tx=20,ty=115+i*88,tw=W-40,th2=78;
    ctx.save(); ctx.globalAlpha=eOut3(tT); ctx.translate(mLerp(-20,0,eOut3(tT)),0);
    rrect(ctx,tx,ty,tw,th2,14); ctx.fillStyle='rgba(255,255,255,0.05)'; ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,0.08)'; ctx.lineWidth=1; ctx.stroke();
    var ag=ctx.createRadialGradient(tx+46,ty+39,5,tx+46,ty+39,32);
    ag.addColorStop(0,tr.color+'cc'); ag.addColorStop(1,tr.color+'44');
    rrect(ctx,tx+12,ty+11,56,56,8); ctx.fillStyle=ag; ctx.fill();
    mText(ctx,'♪',tx+40,ty+46,24,'400','#fff','center');
    mText(ctx,tr.name,  tx+80,ty+30,15,'700','#fff');
    mText(ctx,tr.artist,tx+80,ty+50,12,'400','rgba(255,255,255,0.5)');
    mText(ctx,tr.dur,   tx+tw-12,ty+30,12,'400','rgba(255,255,255,0.4)','right');
    var pw=tw-92;
    rrect(ctx,tx+80,ty+62,pw,3,1.5); ctx.fillStyle='rgba(255,255,255,0.1)'; ctx.fill();
    var prog=i===0?(t*0.6+0.1)%1:0;
    rrect(ctx,tx+80,ty+62,pw*prog,3,1.5); ctx.fillStyle=tr.color; ctx.fill();
    ctx.restore();
  });
}

function renderCommentPopup(ctx,t,p,W,H){
  var bg=ctx.createLinearGradient(0,0,W,H); bg.addColorStop(0,'#1a1a2e'); bg.addColorStop(1,'#16213e');
  ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);
  var cT=mClamp((t-0.05)/0.4,0,1); if(cT<=0) return;
  var cw=W-40,ch=168,cx2=20,cy2=H/2-ch/2;
  ctx.save(); ctx.globalAlpha=eBounce(cT); ctx.translate(0,mLerp(30,0,eOut3(cT)));
  setShadow(ctx,'rgba(0,0,0,0.5)',30,0,8);
  rrect(ctx,cx2,cy2,cw,ch,16); ctx.fillStyle='#1f1f1f'; ctx.fill(); clrShadow(ctx);
  ctx.strokeStyle='rgba(255,255,255,0.06)'; ctx.lineWidth=1; ctx.stroke();
  mText(ctx,'▶ YouTube',cx2+16,cy2+24,14,'700',p.accent);
  circ(ctx,cx2+28,cy2+58,20); ctx.fillStyle=p.avatarColor; ctx.fill();
  mText(ctx,p.username.charAt(1).toUpperCase(),cx2+28,cy2+65,16,'700','#fff','center');
  mText(ctx,p.username,cx2+56,cy2+54,13,'700','#fff');
  mText(ctx,p.timestamp,cx2+56,cy2+70,11,'400','rgba(255,255,255,0.4)');
  var words=p.comment.split(' '),line='',ly=cy2+96,mW=cw-32;
  ctx.font="14px 'Space Grotesk',sans-serif";
  words.forEach(function(w){
    var test=line+w+' ';
    if(ctx.measureText(test).width>mW&&line){
      mText(ctx,line.trim(),cx2+16,ly,14,'400','rgba(255,255,255,0.85)'); line=w+' '; ly+=22;
    } else line=test;
  });
  mText(ctx,line.trim(),cx2+16,ly,14,'400','rgba(255,255,255,0.85)');
  var lT=mClamp((t-0.5)/0.3,0,1);
  ctx.globalAlpha=eBounce(cT)*eOut3(lT);
  mText(ctx,'👍 '+p.likes.toLocaleString(),cx2+16,cy2+ch-14,12,'400','rgba(255,255,255,0.4)');
  ctx.restore();
}

function renderHomepageGrid(ctx,t,p,W,H){
  ctx.fillStyle=p.bg; ctx.fillRect(0,0,W,H);
  ctx.globalAlpha=eOut3(mClamp(t*6,0,1));
  rrect(ctx,14,14,W-28,36,18); ctx.fillStyle='rgba(255,255,255,0.07)'; ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,0.1)'; ctx.lineWidth=1; ctx.stroke();
  mText(ctx,'🔍  Search YouTube',34,38,14,'400','rgba(255,255,255,0.3)'); ctx.globalAlpha=1;
  var pad=8,topY=62,cW2=Math.floor((W-pad*4)/3),cH2=Math.floor(cW2*0.6)+38;
  p.videos.forEach(function(v,i){
    var col=i%3,row=Math.floor(i/3);
    var vx=pad+col*(cW2+pad),vy=topY+row*(cH2+pad);
    var vT=mClamp((t-0.05-row*0.15-col*0.05)/0.3,0,1); if(vT<=0) return;
    ctx.save(); ctx.globalAlpha=eOut3(vT); ctx.translate(0,mLerp(10,0,eOut3(vT)));
    var tH=Math.floor(cW2*0.6);
    rrect(ctx,vx,vy,cW2,tH,6); ctx.fillStyle=v.thumbColor+'88'; ctx.fill();
    rrect(ctx,vx+cW2-34,vy+tH-18,30,14,3); ctx.fillStyle='rgba(0,0,0,0.8)'; ctx.fill();
    mText(ctx,v.views,vx+cW2-19,vy+tH-9,9,'400','#fff','center');
    circ(ctx,vx+cW2/2,vy+tH/2,12); ctx.fillStyle='rgba(0,0,0,0.5)'; ctx.fill();
    ctx.fillStyle='#fff'; ctx.beginPath(); ctx.moveTo(vx+cW2/2-3,vy+tH/2-5);
    ctx.lineTo(vx+cW2/2+5,vy+tH/2); ctx.lineTo(vx+cW2/2-3,vy+tH/2+5); ctx.closePath(); ctx.fill();
    mText(ctx,v.title.slice(0,16)+(v.title.length>16?'…':''),vx+2,vy+tH+14,10,'600','#fff',null,null,cW2-4);
    ctx.restore();
  });
}

function renderInboxFeed(ctx,t,p,W,H){
  ctx.fillStyle=p.bg1; ctx.fillRect(0,0,W,H);
  ctx.globalAlpha=eOut3(mClamp(t*5,0,1));
  mText(ctx,'M  Gmail',18,36,20,'700',p.accent);
  mText(ctx,'Inbox',W-18,36,13,'400','rgba(0,0,0,0.4)','right'); ctx.globalAlpha=1;
  ctx.fillStyle='rgba(0,0,0,0.06)'; ctx.fillRect(0,52,W,1);
  var rH=Math.floor((H-56)/p.emails.length);
  p.emails.forEach(function(em,i){
    var eT=mClamp((t-0.1-i*0.12)/0.3,0,1); if(eT<=0) return;
    var ey=56+i*rH;
    ctx.save(); ctx.globalAlpha=eOut3(eT); ctx.translate(mLerp(40,0,eOut3(eT)),0);
    rrect(ctx,0,ey,W,rH,0); ctx.fillStyle=i%2===0?'#fff':'#f8f9fa'; ctx.fill();
    circ(ctx,28,ey+rH/2,18);
    var dg=ctx.createRadialGradient(28,ey+rH/2,0,28,ey+rH/2,18);
    dg.addColorStop(0,em.color); dg.addColorStop(1,em.color+'aa'); ctx.fillStyle=dg; ctx.fill();
    mText(ctx,em.sender.charAt(0),28,ey+rH/2+5,14,'700','#fff','center');
    mText(ctx,em.sender, 55,ey+rH/2-6,14,'700','#202124');
    mText(ctx,em.subject,55,ey+rH/2+12,12,'400','rgba(0,0,0,0.5)',null,null,null,W-90);
    mText(ctx,em.time,  W-12,ey+rH/2-4,11,'400','rgba(0,0,0,0.4)','right');
    ctx.fillStyle='rgba(0,0,0,0.04)'; ctx.fillRect(55,ey+rH-1,W-55,1);
    ctx.restore();
  });
}

function renderShapeGradient(ctx,t,p,W,H){
  var bg=ctx.createLinearGradient(0,0,W,H);
  bg.addColorStop(0,p.bg1); bg.addColorStop(0.5,'#0d1f3c'); bg.addColorStop(1,p.bg2);
  ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);
  var ag=ctx.createRadialGradient(W/2,H/2,0,W/2,H/2,W*0.7);
  ag.addColorStop(0,p.accent+'18'); ag.addColorStop(1,'transparent');
  ctx.fillStyle=ag; ctx.fillRect(0,0,W,H);
  var r=65,gap=20,totalW=3*(r*2)+2*gap,startX=(W-totalW)/2+r,cy=H/2;
  p.numbers.forEach(function(num,i){
    var iT=mClamp((t-i*0.2)/0.4,0,1); if(iT<=0) return;
    var cx2=startX+i*(r*2+gap),sc=eBack(iT);
    ctx.save(); ctx.translate(cx2,cy); ctx.scale(sc,sc);
    var og=ctx.createRadialGradient(0,0,r*0.6,0,0,r*1.2);
    og.addColorStop(0,'transparent'); og.addColorStop(0.7,p.accent+'11'); og.addColorStop(1,p.accent+'00');
    circ(ctx,0,0,r*1.2); ctx.fillStyle=og; ctx.fill();
    var cg=ctx.createRadialGradient(-r*0.2,-r*0.2,0,0,0,r);
    cg.addColorStop(0,p.c2); cg.addColorStop(1,p.c1);
    setShadow(ctx,p.accent+'88',24);
    circ(ctx,0,0,r); ctx.fillStyle=cg; ctx.fill(); clrShadow(ctx);
    circ(ctx,0,0,r); ctx.strokeStyle=p.accent+'aa'; ctx.lineWidth=2; ctx.stroke();
    mText(ctx,num,0,14,38,'800',p.accent,'center');
    ctx.restore();
  });
  var lT=mClamp((t-0.7)/0.3,0,1);
  ctx.globalAlpha=eOut3(lT);
  mText(ctx,'Step by Step',W/2,cy+r+38,14,'400','rgba(255,255,255,0.4)','center');
  ctx.globalAlpha=1;
}

function renderTimeline3D(ctx,t,p,W,H){
  var bg=ctx.createLinearGradient(0,0,0,H); bg.addColorStop(0,p.bg1); bg.addColorStop(1,p.bg2);
  ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);
  ctx.globalAlpha=eOut3(mClamp(t*5,0,1));
  mText(ctx,'🎬 Timeline',W/2,44,20,'700',p.accent,'center'); ctx.globalAlpha=1;
  var tlY=82,tlH=H-180,hW=76,tlW=W-hW-18,trkH=Math.floor((tlH-4)/p.tracks.length)-3;
  var tlT=eOut3(mClamp(t*3,0,1));
  ctx.save(); ctx.globalAlpha=tlT;
  rrect(ctx,8,tlY-8,W-16,tlH+16,8); ctx.fillStyle='rgba(255,255,255,0.03)'; ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,0.06)'; ctx.lineWidth=1; ctx.stroke();
  for(var ti=0;ti<=8;ti++){
    var rx=hW+(ti/8)*tlW+10;
    ctx.beginPath(); ctx.moveTo(rx,tlY-8); ctx.lineTo(rx,tlY);
    ctx.strokeStyle='rgba(255,255,255,0.15)'; ctx.lineWidth=1; ctx.stroke();
    mText(ctx,ti+'s',rx,tlY-2,9,'400','rgba(255,255,255,0.3)','center');
  }
  p.tracks.forEach(function(tr,i){
    var ty=tlY+i*(trkH+3);
    var trkT=eOut3(mClamp(t*3-i*0.08,0,1));
    mText(ctx,tr.name,12,ty+trkH/2+5,10,'400','rgba(255,255,255,0.5)',null,null,null,hW-4);
    var cW2=tlW*tr.len*trkT, cX2=hW+10;
    rrect(ctx,cX2,ty+2,cW2,trkH-4,4);
    var cg=ctx.createLinearGradient(cX2,ty,cX2,ty+trkH);
    cg.addColorStop(0,tr.color+'cc'); cg.addColorStop(1,tr.color+'66');
    ctx.fillStyle=cg; ctx.fill(); ctx.strokeStyle=tr.color; ctx.lineWidth=0.5; ctx.stroke();
  });
  var phX=hW+tlW*p.playhead+10;
  ctx.beginPath(); ctx.moveTo(phX,tlY-8); ctx.lineTo(phX,tlY+tlH+8);
  ctx.strokeStyle=p.accent; ctx.lineWidth=2; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(phX-6,tlY-8); ctx.lineTo(phX+6,tlY-8); ctx.lineTo(phX,tlY-1);
  ctx.fillStyle=p.accent; ctx.fill();
  ctx.restore();
  if(t>0.3){
    var cT2=mClamp((t-0.3)/0.7,0,1);
    var mcX=W*0.65+Math.sin(t*3)*28, mcY=tlY+tlH/2+Math.cos(t*2.5)*18;
    ctx.save(); ctx.globalAlpha=eOut3(cT2)*0.28; drawCursor(ctx,mcX+5,mcY+5,0);
    ctx.globalAlpha=eOut3(cT2); drawCursor(ctx,mcX,mcY,0); ctx.restore();
  }
}

function renderCaptionOverlay(ctx,t,p,W,H){
  ctx.fillStyle=p.bg1; ctx.fillRect(0,0,W,H);
  var vg=ctx.createLinearGradient(0,0,W,H);
  vg.addColorStop(0,'#111'); vg.addColorStop(0.5,'#1a1a1a'); vg.addColorStop(1,'#0a0a0a');
  ctx.fillStyle=vg; ctx.fillRect(0,0,W,H);
  var boxY=H-150;
  p.lines.forEach(function(line,i){
    var lT=mClamp((t-i*0.28)/0.25,0,1); if(lT<=0) return;
    var ly=boxY+i*36;
    ctx.save(); ctx.globalAlpha=lT;
    if(p.style==='bold'){
      var sz=28-i*2;
      ctx.font='italic 900 '+sz+"px 'Space Grotesk',sans-serif";
      var tw=ctx.measureText(line).width;
      ctx.fillStyle='rgba(0,0,0,0.7)'; ctx.fillRect(W/2-tw/2-8,ly-sz-2,tw+16,sz+8);
      mText(ctx,line,W/2,ly,sz,'900','#fff','center');
    } else if(p.style==='impact'){
      var sz2=30-i*4;
      ctx.font='800 '+sz2+"px 'Space Grotesk',sans-serif";
      ctx.strokeStyle='#000'; ctx.lineWidth=3; ctx.strokeText(line,W/2,ly);
      ctx.textAlign='center'; ctx.fillStyle='#FFFF00'; ctx.fillText(line,W/2,ly);
    } else {
      var sz3=22-i;
      ctx.font='600 '+sz3+"px 'Space Grotesk',sans-serif"; ctx.textAlign='center';
      var tw3=ctx.measureText(line).width;
      rrect(ctx,W/2-tw3/2-12,ly-sz3-2,tw3+24,sz3+10,6);
      ctx.fillStyle='rgba(255,255,255,0.1)'; ctx.fill();
      mText(ctx,line,W/2,ly,sz3,'600','#fff','center');
    }
    ctx.restore();
  });
}

// ── RENDER DISPATCHER ────────────────────────────────────────────────────────
function motionRenderFrame(ctx, tplId, t, params, W, H) {
  ctx.clearRect(0,0,W,H);
  switch(tplId) {
    case 'product-catalog':  renderProductCatalog(ctx,t,params,W,H);  break;
    case 'orbit-ring':       renderOrbitRing(ctx,t,params,W,H);       break;
    case 'metrics-chart':    renderMetricsChart(ctx,t,params,W,H);    break;
    case 'analytics-dash':   renderAnalyticsDash(ctx,t,params,W,H);   break;
    case 'ui-interaction':   renderUiInteraction(ctx,t,params,W,H);   break;
    case 'media-player':     renderMediaPlayer(ctx,t,params,W,H);     break;
    case 'comment-popup':    renderCommentPopup(ctx,t,params,W,H);    break;
    case 'homepage-grid':    renderHomepageGrid(ctx,t,params,W,H);    break;
    case 'inbox-feed':       renderInboxFeed(ctx,t,params,W,H);       break;
    case 'shape-gradient':   renderShapeGradient(ctx,t,params,W,H);   break;
    case 'timeline-3d':      renderTimeline3D(ctx,t,params,W,H);      break;
    case 'caption-overlay':  renderCaptionOverlay(ctx,t,params,W,H);  break;
  }
}

// ── EDIT FIELDS ───────────────────────────────────────────────────────────────
function motionEditFields(tplId, params) {
  switch(tplId){
    case 'product-catalog': return [
      { key:'title', label:'Collection Title', type:'text', val:params.title },
      { key:'products.0.name',  label:'Product 1 Name',  type:'text', val:params.products[0].name },
      { key:'products.0.price', label:'Product 1 Price', type:'text', val:params.products[0].price },
      { key:'products.0.accent',label:'Product 1 Color', type:'color',val:params.products[0].accent },
      { key:'products.1.name',  label:'Product 2 Name',  type:'text', val:params.products[1].name },
      { key:'products.1.price', label:'Product 2 Price', type:'text', val:params.products[1].price },
      { key:'products.2.name',  label:'Product 3 Name',  type:'text', val:params.products[2].name },
      { key:'products.2.price', label:'Product 3 Price', type:'text', val:params.products[2].price },
    ];
    case 'orbit-ring': return [
      { key:'outerEmojis.0', label:'Outer Widget 1', type:'text', val:params.outerEmojis[0] },
      { key:'outerEmojis.1', label:'Outer Widget 2', type:'text', val:params.outerEmojis[1] },
      { key:'outerEmojis.2', label:'Outer Widget 3', type:'text', val:params.outerEmojis[2] },
      { key:'innerEmojis.0', label:'Inner Widget 1', type:'text', val:params.innerEmojis[0] },
      { key:'innerEmojis.1', label:'Inner Widget 2', type:'text', val:params.innerEmojis[1] },
      { key:'ringColor', label:'Outer Ring Color', type:'color', val:params.ringColor },
    ];
    case 'metrics-chart': return [
      { key:'company', label:'Company Name', type:'text', val:params.company },
      { key:'metrics.0.value', label:'Metric 1 Value', type:'number', val:params.metrics[0].value },
      { key:'metrics.1.value', label:'Metric 2 Value', type:'number', val:params.metrics[1].value },
      { key:'metrics.2.value', label:'Metric 3 Value', type:'number', val:params.metrics[2].value },
    ];
    case 'comment-popup': return [
      { key:'username', label:'Username',     type:'text',     val:params.username },
      { key:'comment',  label:'Comment Text', type:'textarea', val:params.comment },
      { key:'likes',    label:'Like Count',   type:'number',   val:params.likes },
      { key:'avatarColor', label:'Avatar Color', type:'color', val:params.avatarColor },
    ];
    case 'shape-gradient': return [
      { key:'numbers.0', label:'Circle 1', type:'text', val:params.numbers[0] },
      { key:'numbers.1', label:'Circle 2', type:'text', val:params.numbers[1] },
      { key:'numbers.2', label:'Circle 3', type:'text', val:params.numbers[2] },
      { key:'accent',    label:'Accent Color', type:'color', val:params.accent },
    ];
    case 'caption-overlay': return [
      { key:'lines.0', label:'Line 1', type:'text', val:params.lines[0] },
      { key:'lines.1', label:'Line 2', type:'text', val:params.lines[1] },
      { key:'lines.2', label:'Line 3', type:'text', val:params.lines[2] },
      { key:'style',   label:'Style',  type:'select', val:params.style, opts:['bold','impact','minimal'] },
    ];
    default: return [];
  }
}

function motionSetParam(params, keyPath, value) {
  var keys = keyPath.split('.');
  var obj = params;
  for (var i = 0; i < keys.length-1; i++) {
    var k = keys[i], nxt = keys[i+1];
    if (!isNaN(parseInt(k))) obj = obj[parseInt(k)];
    else obj = obj[k];
  }
  var last = keys[keys.length-1];
  if (!isNaN(parseInt(last))) obj[parseInt(last)] = value;
  else obj[last] = value;
}

// ── VOICE / TALON ORCHESTRATION ───────────────────────────────────────────────
var TALON_STEPS = [
  { id:'voice',   label:'Voice Input Received',      ms:120 },
  { id:'nlp',     label:'NLP Intent Extraction',     ms:180 },
  { id:'debate',  label:'Debate Chain Resolving',    ms:400 },
  { id:'select',  label:'Template Selected',         ms:100 },
  { id:'params',  label:'Parameters Generated',      ms:150 },
  { id:'render',  label:'Motion Rendered',           ms:80  },
];

var DEBATE_MODELS = [
  { name:'DeepSeek V4',  color:'#38bdf8', role:'Structure Analyst' },
  { name:'Llama 4',      color:'#a78bfa', role:'Creative Director' },
  { name:'Mistral 3',    color:'#34d399', role:'Brand Strategist'  },
];

function runTalonPipeline(prompt, onStep, onDone) {
  var elapsed = 0;
  TALON_STEPS.forEach(function(step, i){
    elapsed += step.ms + i*60;
    setTimeout(function(){
      onStep(step);
      if (i === TALON_STEPS.length-1) setTimeout(onDone, 80);
    }, elapsed);
  });
}

function runDebateChain(templateId, prompt, onVote, onConsensus) {
  DEBATE_MODELS.forEach(function(m, i){
    setTimeout(function(){
      var votes = ['Agreed — template suits narrative intent','Strong match for visual composition','Brand alignment confirmed'];
      onVote(m, votes[i]);
    }, 250 + i*220);
  });
  setTimeout(function(){
    onConsensus(templateId);
  }, 250 + DEBATE_MODELS.length*220 + 150);
}

// ── VOICE RECOGNITION ─────────────────────────────────────────────────────────
var motionSpeechRec = null;

function initVoiceRecognition() {
  var SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRec) return;
  motionSpeechRec = new SpeechRec();
  motionSpeechRec.continuous = false;
  motionSpeechRec.interimResults = true;
  motionSpeechRec.lang = 'en-US';

  motionSpeechRec.onresult = function(e) {
    var transcript = '';
    for (var i = e.resultIndex; i < e.results.length; i++) {
      transcript += e.results[i][0].transcript;
    }
    var inp = document.getElementById('motionPrompt');
    if (inp) inp.value = transcript;
    if (e.results[e.results.length-1].isFinal) {
      stopVoice();
      handleMotionGenerate();
    }
  };
  motionSpeechRec.onerror = function() { stopVoice(); };
  motionSpeechRec.onend   = function() { stopVoice(); };
}

function startVoice() {
  if (!motionSpeechRec) { showToast('Voice not supported in this browser','warning'); return; }
  var btn = document.getElementById('motionVoiceBtn');
  if (btn) { btn.classList.add('voice-active'); btn.innerHTML='<i class="fas fa-circle"></i> Listening...'; }
  motionSpeechRec.start();
  motionLog('info','Voice input active — speak your prompt');
}

function stopVoice() {
  if (motionSpeechRec) { try { motionSpeechRec.stop(); } catch(e){} }
  var btn = document.getElementById('motionVoiceBtn');
  if (btn) { btn.classList.remove('voice-active'); btn.innerHTML='<i class="fas fa-microphone"></i> Voice'; }
}

// ── STATE ─────────────────────────────────────────────────────────────────────
var mState = {
  tplId: null, params: null, seed: 42, prompt: '',
  playing: false, t: 0, startTime: null, rafId: null,
};

// ── INIT ──────────────────────────────────────────────────────────────────────
function initMotion() {
  buildGallery();
  bindMotionEvents();
  initVoiceRecognition();
  setTimeout(function(){ renderGalleryThumbs(); }, 600);
  selectMotionTemplate('shape-gradient', '', 42);
  motionLog('success','Motion Studio v1.0 · TALON Orchestration Ready');
  motionLog('info','12 templates · Voice-driven · Deterministic seeding · Debate-chain routing');
}

// ── GALLERY ───────────────────────────────────────────────────────────────────
function buildGallery() {
  var el = document.getElementById('motionGallery');
  if (!el) return;
  el.innerHTML = '';
  Object.keys(MOTION_TEMPLATES).forEach(function(id){
    var m = MOTION_TEMPLATES[id];
    var div = document.createElement('div');
    div.className = 'mgallery-thumb';
    div.dataset.tpl = id;
    div.innerHTML =
      '<canvas class="mthumb-canvas" width="110" height="82"></canvas>'+
      '<div class="mthumb-label"><span>'+m.icon+'</span><span>'+m.label+'</span></div>';
    div.addEventListener('click', function(){
      selectMotionTemplate(id, mState.prompt, mState.seed);
    });
    el.appendChild(div);
  });
}

function renderGalleryThumbs() {
  document.querySelectorAll('.mgallery-thumb').forEach(function(div){
    var id = div.dataset.tpl;
    var canvas = div.querySelector('.mthumb-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var p = genParams(id, '', 42);
    motionRenderFrame(ctx, id, 0.45, p, 110, 82);
  });
}

// ── EVENTS ────────────────────────────────────────────────────────────────────
function bindMotionEvents() {
  var gen = document.getElementById('motionGenerate');
  if (gen) gen.addEventListener('click', handleMotionGenerate);

  var inp = document.getElementById('motionPrompt');
  if (inp) inp.addEventListener('keydown', function(e){
    if (e.ctrlKey && e.key === 'Enter') handleMotionGenerate();
  });

  var vbtn = document.getElementById('motionVoiceBtn');
  if (vbtn) vbtn.addEventListener('click', function(){
    var active = vbtn.classList.contains('voice-active');
    if (active) stopVoice(); else startVoice();
  });

  var playBtn = document.getElementById('motionPlay');
  if (playBtn) playBtn.addEventListener('click', toggleMotionPlay);

  var regenBtn = document.getElementById('motionRegen');
  if (regenBtn) regenBtn.addEventListener('click', function(){
    var ns = Math.floor(Math.random()*8999)+1001;
    document.getElementById('motionSeed').value = ns;
    mState.seed = ns;
    selectMotionTemplate(mState.tplId, mState.prompt, ns);
    motionLog('info','Regenerated — seed: '+ns);
  });

  var copyBtn = document.getElementById('motionCopyCode');
  if (copyBtn) copyBtn.addEventListener('click', function(){
    var code = buildExportCode();
    navigator.clipboard.writeText(code).then(function(){
      copyBtn.innerHTML='<i class="fas fa-check"></i>';
      setTimeout(function(){ copyBtn.innerHTML='<i class="fas fa-code"></i>'; }, 2000);
      motionLog('success','Code copied to clipboard');
    });
  });

  var frBtn = document.getElementById('motionExportFrame');
  if (frBtn) frBtn.addEventListener('click', function(){
    var c = document.getElementById('motionCanvas');
    if (!c) return;
    var a = document.createElement('a');
    a.download = 'motion-'+mState.tplId+'-'+Date.now()+'.png';
    a.href = c.toDataURL('image/png'); a.click();
    motionLog('success','Frame exported as PNG');
  });

  var seedInp = document.getElementById('motionSeed');
  if (seedInp) seedInp.addEventListener('change', function(){
    mState.seed = parseInt(this.value)||42;
  });

  // Touch swipe on gallery
  var gallery = document.getElementById('motionGallery');
  if (gallery) {
    var sx = 0;
    gallery.addEventListener('touchstart', function(e){ sx = e.touches[0].clientX; }, {passive:true});
    gallery.addEventListener('touchmove', function(e){
      gallery.scrollLeft += (sx - e.touches[0].clientX)*0.8;
      sx = e.touches[0].clientX;
    }, {passive:true});
  }

  // Progress bar scrub
  var bar = document.getElementById('motionProgressBar');
  if (bar) bar.addEventListener('click', function(e){
    var r = bar.getBoundingClientRect();
    mState.t = (e.clientX - r.left) / r.width;
    if (!mState.playing) renderMotionFrame(mState.t);
  });
}

// ── GENERATE ──────────────────────────────────────────────────────────────────
function handleMotionGenerate() {
  var prompt = (document.getElementById('motionPrompt')||{}).value || '';
  var seed   = parseInt((document.getElementById('motionSeed')||{}).value) || 42;
  var tplId  = prompt ? motionClassify(prompt) : (mState.tplId || 'shape-gradient');
  var fSeed  = prompt ? ((seed ^ motionHash(prompt)) % 8999 + 1001) : seed;

  setMotionStatus('running');
  motionLog('info', 'Prompt received: "'+prompt+'"');

  runDebateChain(tplId, prompt,
    function(model, vote){
      motionLog('info', '['+model.name+'] '+vote);
    },
    function(resolvedId){
      motionLog('success','Consensus → '+MOTION_TEMPLATES[resolvedId].label);
      runTalonPipeline(prompt,
        function(step){ motionLog('info', '▸ TALON: '+step.label); },
        function(){
          selectMotionTemplate(resolvedId, prompt, fSeed);
          setMotionStatus('idle');
        }
      );
    }
  );
}

// ── SELECT TEMPLATE ───────────────────────────────────────────────────────────
function selectMotionTemplate(tplId, prompt, seed) {
  stopMotionPlay();
  mState.tplId = tplId; mState.prompt = prompt; mState.seed = seed; mState.t = 0;
  mState.params = genParams(tplId, prompt, seed);

  document.querySelectorAll('.mgallery-thumb').forEach(function(el){
    el.classList.toggle('active', el.dataset.tpl === tplId);
  });

  var nm = document.getElementById('motionTplName');
  var meta = MOTION_TEMPLATES[tplId];
  if (nm) nm.textContent = meta.icon + ' ' + meta.label;

  renderMotionFrame(0);
  buildEditControls(tplId, mState.params);
  startMotionPlay();
}

// ── PLAYBACK ──────────────────────────────────────────────────────────────────
function startMotionPlay() {
  if (!mState.tplId) return;
  mState.playing = true;
  var dur = MOTION_TEMPLATES[mState.tplId].dur;
  mState.startTime = performance.now() - mState.t * dur;
  updatePlayBtn();
  mState.rafId = requestAnimationFrame(motionLoop);
}

function stopMotionPlay() {
  mState.playing = false;
  if (mState.rafId) cancelAnimationFrame(mState.rafId);
  updatePlayBtn();
}

function toggleMotionPlay() {
  if (mState.playing) stopMotionPlay(); else startMotionPlay();
}

function motionLoop(now) {
  if (!mState.playing) return;
  var dur = MOTION_TEMPLATES[mState.tplId].dur;
  mState.t = ((now - mState.startTime) % dur) / dur;
  renderMotionFrame(mState.t);
  updateMotionProgress(mState.t, (now - mState.startTime) % dur, dur);
  mState.rafId = requestAnimationFrame(motionLoop);
}

function renderMotionFrame(t) {
  var canvas = document.getElementById('motionCanvas');
  if (!canvas || !mState.params) return;
  motionRenderFrame(canvas.getContext('2d'), mState.tplId, t, mState.params, canvas.width, canvas.height);
}

function updatePlayBtn() {
  var btn = document.getElementById('motionPlay');
  if (btn) btn.innerHTML = '<i class="fas fa-'+(mState.playing?'pause':'play')+'"></i>';
}

function updateMotionProgress(t, elapsed, dur) {
  var fill = document.getElementById('motionProgFill');
  if (fill) fill.style.width = (t*100)+'%';
  var td = document.getElementById('motionTime');
  if (td) {
    var s = Math.floor(elapsed/1000), ms = Math.floor((elapsed%1000)/10);
    td.textContent = s+':'+(ms<10?'0':'')+ms;
  }
}

// ── EDIT CONTROLS ─────────────────────────────────────────────────────────────
function buildEditControls(tplId, params) {
  var body = document.getElementById('motionEditorBody');
  if (!body) return;
  var fields = motionEditFields(tplId, params);
  if (!fields.length) {
    body.innerHTML = '<div class="medit-placeholder"><i class="fas fa-sliders-h"></i><p>No editable fields for this template</p></div>';
    return;
  }
  body.innerHTML = fields.map(function(f){
    if (f.type==='textarea') return '<div class="mfield"><label>'+f.label+'</label><textarea class="mfield-input" data-key="'+f.key+'">'+f.val+'</textarea></div>';
    if (f.type==='select')   return '<div class="mfield"><label>'+f.label+'</label><select class="mfield-input" data-key="'+f.key+'">'+f.opts.map(function(o){return'<option'+(o===f.val?' selected':'')+'>'+o+'</option>';}).join('')+'</select></div>';
    return '<div class="mfield"><label>'+f.label+'</label><input type="'+f.type+'" class="mfield-input" data-key="'+f.key+'" value="'+f.val+'"></div>';
  }).join('');

  body.querySelectorAll('[data-key]').forEach(function(inp){
    inp.addEventListener('input', function(){
      var v = inp.type==='number' ? parseFloat(inp.value) : inp.value;
      motionSetParam(mState.params, inp.dataset.key, v);
      renderMotionFrame(mState.t);
    });
  });
}

// ── STATUS ────────────────────────────────────────────────────────────────────
function setMotionStatus(s) {
  var dot = document.getElementById('motionStatusDot');
  var txt = document.getElementById('motionStatusTxt');
  if (!dot || !txt) return;
  dot.className = 'mstatus-dot '+(s==='running'?'running':'');
  txt.textContent = s==='running' ? 'TALON Processing...' : 'Ready';
}

// ── PIPELINE LOG ──────────────────────────────────────────────────────────────
function motionLog(type, msg) {
  var log = document.getElementById('motionLog');
  if (!log) return;
  var icons = { info:'◈', success:'✓', warn:'⚠', error:'✗' };
  var colors = { info:'var(--accent-blue)', success:'var(--accent-green)', warn:'var(--accent-yellow)', error:'var(--accent-red)' };
  var ts = new Date().toLocaleTimeString('en-US',{hour12:false,hour:'2-digit',minute:'2-digit',second:'2-digit'});
  var e = document.createElement('div');
  e.className = 'mlog-entry';
  e.innerHTML = '<span class="mlog-icon" style="color:'+colors[type]+'">'+icons[type]+'</span><span class="mlog-msg">'+msg+'</span><span class="mlog-ts">'+ts+'</span>';
  log.appendChild(e);
  log.scrollTop = log.scrollHeight;
  while (log.children.length > 30) log.removeChild(log.firstChild);
}

// ── EXPORT CODE ───────────────────────────────────────────────────────────────
function buildExportCode() {
  var meta = MOTION_TEMPLATES[mState.tplId];
  return '<!-- AIOS-X Motion Studio Export\n     Template: '+meta.label+' | Seed: '+mState.seed+'\n     Generated: '+new Date().toISOString()+' -->\n'+
    '<!-- Load motion.js then call:\n     motionRenderFrame(ctx, "'+mState.tplId+'", t, params, W, H)\n     in a requestAnimationFrame loop (t: 0→1 over '+meta.dur+'ms) -->\n'+
    '/* Params: '+JSON.stringify(mState.params, null, 2)+' */';
}

// ── GLOBAL EXPOSE ─────────────────────────────────────────────────────────────
window.initMotion           = initMotion;
window.startVoice           = startVoice;
window.stopVoice            = stopVoice;
window.handleMotionGenerate = handleMotionGenerate;
window.selectMotionTemplate = selectMotionTemplate;
window.toggleMotionPlay     = toggleMotionPlay;
