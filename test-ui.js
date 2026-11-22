const { chromium } = require('playwright-core');
const R = [];
const ok = (n, s, p, d) => { R.push(p); console.log(`${p ? 'PASS' : 'FAIL'}  #${n}  ${s}  ${d}`); };

const FILE = 'file:///E:/workbuddy2/2026-11-22-19-53-33/XbwExp/app/src/main/assets/index.html';

(async () => {
  const b = await chromium.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true
  });
  const c = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });

  // 跳过冷启动动画，避免干扰（#1 单独验）
  await c.addInitScript(() => {
    try {
      const d = new Date();
      const k = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      localStorage.setItem('prof.bootAt', k);
    } catch (e) {}
  });

  const p = await c.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  p.on('dialog', async d => { errs.push('原生弹窗:' + d.message()); await d.dismiss(); });

  // ===== 0. 冷启动接入动画（用独立 context，避免 initScript 干扰）=====
  const c2 = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const pB = await c2.newPage();
  pB.on('pageerror', e => errs.push('boot:' + e.message));
  await pB.goto(FILE);
  await pB.waitForTimeout(240);
  const boot0 = await pB.evaluate(() => {
    const el = document.getElementById('bootup');
    return { on: el.classList.contains('on'), txt: document.getElementById('buText').textContent, bg: getComputedStyle(el).backgroundColor };
  });
  await pB.waitForTimeout(1500);
  const boot1 = await pB.evaluate(() => document.getElementById('bootup').classList.contains('on'));
  await c2.close();
  ok(1, '冷启动「接入中」动画：出现→自动消失',
    boot0.on && boot0.txt.length > 0 && boot0.bg === 'rgb(6, 5, 9)' && !boot1,
    `出现=${boot0.on} 打字="${boot0.txt}" 底色=${boot0.bg} 1.4s后仍在=${boot1}`);

  // ===== 2. 配色换到墨底鎏金 =====
  await p.goto(FILE);
  await p.waitForTimeout(700);
  const theme = await p.evaluate(() => {
    const cs = getComputedStyle(document.documentElement);
    const plus = document.querySelector('.plus');
    return {
      acc: cs.getPropertyValue('--acc').trim(),
      bg: cs.getPropertyValue('--bg').trim(),
      gold: cs.getPropertyValue('--gold').trim(),
      tx: cs.getPropertyValue('--tx').trim(),
      plusBg: plus ? getComputedStyle(plus).backgroundImage.slice(0, 44) : ''
    };
  });
  ok(2, '配色为墨底鎏金（不再是青绿）',
    theme.acc === '#d6b36a' && theme.bg === '#0a0910' && theme.gold === '#f0dca8' && theme.tx === '#e9e2d3' && /linear-gradient/.test(theme.plusBg),
    `--acc=${theme.acc} --bg=${theme.bg} --gold=${theme.gold} 加号底=${theme.plusBg}`);

  // ===== 3. 面板方正 + 四角装饰 + 充能条 =====
  const panel = await p.evaluate(() => {
    const g = document.querySelector('.grp');
    const gs = getComputedStyle(g);
    const before = getComputedStyle(g, '::before');
    const bar = g.querySelector('.grp-bar i');
    const bcs = bar ? getComputedStyle(bar) : null;
    return {
      radius: gs.borderRadius,
      border: gs.borderTopColor,
      cornerW: before.width,
      cornerBorder: before.borderTopColor,
      barBg: bcs ? bcs.backgroundImage.slice(0, 40) : ''
    };
  });
  ok(3, '分组面板方正 (3px) + 四角 L 形 + 金色充能条',
    panel.radius === '3px' && /201, 168, 102/.test(panel.border) && panel.cornerW === '9px' && /linear-gradient/.test(panel.barBg),
    `圆角=${panel.radius} 边框=${panel.border} 角宽=${panel.cornerW} 条=${panel.barBg}`);

  // ===== 4. 点加号：光环 class + 加分 =====
  await p.evaluate(() => localStorage.clear());
  await p.reload();
  await p.waitForTimeout(800);
  const t0 = await p.evaluate(() => Number(document.getElementById('numTotal').textContent.replace(/,/g, '')));
  await p.locator('.hrow .plus').first().click();
  await p.waitForTimeout(120);
  const pulse = await p.evaluate(() => {
    const el = document.querySelector('.hrow .plus');
    return { has: el.classList.contains('pulse'), after: getComputedStyle(el, '::after').animationName };
  });
  await p.waitForTimeout(700);
  const t1 = await p.evaluate(() => Number(document.getElementById('numTotal').textContent.replace(/,/g, '')));
  ok(4, '点加号：光环扩散动画 + 加分生效',
    pulse.has && pulse.after === 'plusRing' && t1 === t0 + 10,
    `pulse=${pulse.has} 动画=${pulse.after} 累计 ${t0}→${t1}`);

  // ===== 5. 称号跃迁演出（110 分初学 → 点一次到 120 分入门）=====
  await p.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('prof.v1'));
    const now = Date.now();
    s.records = [];
    for (let i = 0; i < 11; i++) s.records.push({ id: 'pre' + i, ts: now - (i + 1) * 5000, mid: 'rd-careful', p: 10, got: null, tot: null });
    localStorage.setItem('prof.v1', JSON.stringify(s));
  });
  await p.reload();
  await p.waitForTimeout(900);
  const before5 = await p.evaluate(() => {
    const lv = document.querySelector('.grp .lv');
    const pct = document.querySelector('.grp-pct');
    return { lv: lv ? lv.textContent : '', pct: pct ? pct.textContent : '', total: document.getElementById('numTotal').textContent };
  });
  await p.locator('.hrow .plus').first().click();
  await p.waitForTimeout(600);
  const lu = await p.evaluate(() => {
    const el = document.getElementById('levelup');
    return {
      on: el.classList.contains('on'),
      name: document.getElementById('luName').textContent,
      sub: document.getElementById('luSub').textContent,
      nameSize: getComputedStyle(document.getElementById('luName')).fontSize,
      scan: getComputedStyle(document.querySelector('.lu-scan')).animationName
    };
  });
  const lvNow = await p.evaluate(() => document.querySelector('.grp .lv').textContent);
  ok(5, '跨档触发全屏演出：110→120 分，初学→入门',
    before5.lv === '初学' && lvNow === '入门' && lu.on && lu.name === '入门' && /阅读 · 120 \/ 600/.test(lu.sub) && lu.nameSize === '54px' && lu.scan === 'luScan',
    `点前=${before5.lv}(${before5.pct}) 点后=${lvNow}｜演出 on=${lu.on} 大字="${lu.name}" 字号=${lu.nameSize} 副标="${lu.sub}" 光带=${lu.scan}`);

  // ===== 6. 演出自动收场 =====
  await p.waitForTimeout(2100);
  const luGone = await p.evaluate(() => {
    const el = document.getElementById('levelup');
    return { on: el.classList.contains('on'), out: el.classList.contains('out'), display: getComputedStyle(el).display };
  });
  ok(6, '演出 ~1.5s 后自动收场', !luGone.on && luGone.display === 'none',
    `on=${luGone.on} out=${luGone.out} display=${luGone.display}`);

  // ===== 7. 没跨档不演出 =====
  await p.locator('.hrow .plus').first().click();
  await p.waitForTimeout(500);
  const lu7 = await p.evaluate(() => document.getElementById('levelup').classList.contains('on'));
  ok(7, '同档内加分不触发演出', !lu7, `#levelup.on=${lu7}`);

  // ===== 8. 系统提示条（notify）=====
  await p.locator('.tabbar button[data-tab="settings"]').click();
  await p.waitForTimeout(500);
  // 设置页卡片默认折叠，按钮不可见；直接触发 DOM 点击（onclick 仍绑着）
  await p.evaluate(() => document.getElementById('newGoalAdd').click());
  await p.waitForTimeout(300);
  const msg = await p.evaluate(() => {
    const el = document.getElementById('msgbar');
    const cs = getComputedStyle(el);
    const before = getComputedStyle(el, '::before');
    return {
      on: el.classList.contains('on'),
      txt: el.textContent,
      tag: before.content,
      tagColor: before.color,
      borderL: cs.borderLeftColor,
      radius: cs.borderRadius
    };
  });
  ok(8, '系统提示条：左侧金边 + 「系统」标签 + 方正',
    msg.on && msg.txt.length > 0 && /系 统/.test(msg.tag) && msg.radius === '3px' && /214, 179, 106/.test(msg.borderL),
    `on=${msg.on} 标签=${msg.tag} 左边框=${msg.borderL} 圆角=${msg.radius}`);

  // ===== 9. 回归：折叠 / 详情 / 热力图 / 返回键 =====
  await p.locator('.tabbar button[data-tab="today"]').click();
  await p.waitForTimeout(400);
  const hB = await p.evaluate(() => Math.round(document.querySelector('.grp').getBoundingClientRect().height));
  await p.locator('.grp-head').first().click();
  await p.waitForTimeout(450);
  const fold = await p.evaluate(() => {
    const g = document.querySelector('.grp');
    return { closed: g.classList.contains('closed'), h: Math.round(g.getBoundingClientRect().height) };
  });
  await p.locator('.grp-head').first().click();
  await p.waitForTimeout(350);
  await p.locator('.hrow .hname').first().click();
  await p.waitForTimeout(500);
  const goalOpen = await p.evaluate(() => ({
    on: document.getElementById('goalPage').classList.contains('on'),
    mods: document.querySelectorAll('#gpMods .mod').length
  }));
  const back = await p.evaluate(() => window.__xbwBack());
  await p.waitForTimeout(400);
  await p.locator('.tabbar button[data-tab="history"]').click();
  await p.waitForTimeout(600);
  const heat = await p.evaluate(() => {
    const card = document.getElementById('heatCard');
    const c4 = card.querySelector('.hc.h4') || card.querySelector('.hc.h3') || card.querySelector('.hc.h1');
    return {
      cells: card.querySelectorAll('.heat-grid .hc').length,
      today: card.querySelectorAll('.hc.today').length,
      hotColor: c4 ? getComputedStyle(c4).backgroundColor : 'none',
      sum: card.querySelector('.heat-sum').textContent
    };
  });
  ok(9, '回归：折叠/详情/返回键/热力图均正常',
    fold.closed && fold.h < hB && goalOpen.on && goalOpen.mods === 3 && back === true &&
    heat.cells >= 364 && heat.today === 1,
    `折叠 ${hB}→${fold.h}｜详情=${goalOpen.on}(${goalOpen.mods}模块) 返回=${back}｜热力 ${heat.cells}格 今天=${heat.today} 热色=${heat.hotColor}`);

  // ===== 10. 0% 进度条不该有末端光点 =====
  await p.evaluate(() => localStorage.clear());
  await p.reload();
  await p.waitForTimeout(800);
  const zero = await p.evaluate(() => {
    const i = document.querySelector('.grp-bar i');
    return {
      cls: i.className,
      w: i.getAttribute('style'),
      after: getComputedStyle(i, '::after').display
    };
  });
  ok(10, '0% 进度条末端光点隐藏', zero.cls === 'zero' && zero.after === 'none',
    `class="${zero.cls}" style="${zero.w}" 光点 display=${zero.after}`);

  // ===== 11. 首次打卡（未开始→初学）不弹演出 =====
  await p.locator('.hrow .plus').first().click();
  await p.waitForTimeout(600);
  const first11 = await p.evaluate(() => ({
    lv: document.querySelector('.grp .lv').textContent,
    lu: document.getElementById('levelup').classList.contains('on'),
    total: document.getElementById('numTotal').textContent
  }));
  ok(11, '未开始→初学不弹全屏演出，只加分',
    first11.lv === '初学' && !first11.lu && first11.total === '10',
    `称号=${first11.lv} 演出=${first11.lu} 累计=${first11.total}`);

  // ===== 12. 演出期间锁定背景滚动 =====
  await p.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('prof.v1'));
    s.records = [];
    for (let i = 0; i < 11; i++) s.records.push({ id: 'y' + i, ts: Date.now() - i * 3000, mid: 'rd-careful', p: 10, got: 9, tot: 10 });
    localStorage.setItem('prof.v1', JSON.stringify(s));
  });
  await p.reload();
  await p.waitForTimeout(800);
  await p.locator('.hrow .plus').first().click();
  await p.waitForTimeout(650);
  const lockOn = await p.evaluate(() => ({
    lu: document.getElementById('levelup').classList.contains('on'),
    lock: document.body.classList.contains('lu-lock'),
    ov: getComputedStyle(document.body).overflow
  }));
  await p.waitForTimeout(2300);
  const lockOff = await p.evaluate(() => ({
    lu: document.getElementById('levelup').classList.contains('on'),
    lock: document.body.classList.contains('lu-lock')
  }));
  ok(12, '演出时锁背景滚动，收场后解除',
    lockOn.lu && lockOn.lock && lockOn.ov === 'hidden' && !lockOff.lu && !lockOff.lock,
    `演出中 lock=${lockOn.lock} overflow=${lockOn.ov}｜收场后 lu=${lockOff.lu} lock=${lockOff.lock}`);

  // ===== 13. 内存存储（隐私模式）不播冷启动 =====
  const c3 = await b.newContext({ viewport: { width: 390, height: 844 } });
  await c3.addInitScript(() => {
    try { Object.defineProperty(window, 'localStorage', { get() { throw new Error('denied'); } }); } catch (e) {}
  });
  const p3 = await c3.newPage();
  p3.on('pageerror', e => errs.push('mem:' + e.message));
  await p3.goto(FILE);
  await p3.waitForTimeout(900);
  const mem = await p3.evaluate(() => ({
    boot: document.getElementById('bootup').classList.contains('on'),
    groups: document.querySelectorAll('.grp').length,
    notice: document.getElementById('notice').classList.contains('on')
  }));
  ok(13, '内存存储环境跳过冷启动动画，页面正常', !mem.boot && mem.groups === 4 && mem.notice,
    `动画=${mem.boot} 分组=${mem.groups} 降级提示=${mem.notice}`);
  await c3.close();

  ok('E', '全程无 JS 报错、无原生弹窗', errs.length === 0, errs.join(' | ') || '无');

  // ===== 出图 =====
  await p.evaluate(() => localStorage.clear());
  await p.reload();
  await p.waitForTimeout(800);
  await p.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('prof.v1'));
    const noon = n => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - n); return d.getTime(); };
    const mk = (mid, cnt, day, pts) => { const a = []; for (let i = 0; i < cnt; i++) a.push({ id: mid + i, ts: noon(day), mid, p: pts, got: 8, tot: 10 }); return a; };
    s.records = [
      ...mk('rd-careful', 18, 0, 10), ...mk('rd-match', 14, 1, 10), ...mk('rd-blank', 6, 2, 10),
      ...mk('ls-long', 12, 0, 12), ...mk('ls-passage', 5, 3, 12),
      ...mk('trans', 9, 1, 15), ...mk('write', 4, 4, 15)
    ];
    localStorage.setItem('prof.v1', JSON.stringify(s));
  });
  await p.reload();
  await p.waitForTimeout(1000);
  await p.screenshot({ path: '../shot-x-sys-home.png' });

  await p.locator('.grp[data-gid="g-rd"] .hrow .hname').first().click();
  await p.waitForTimeout(600);
  await p.screenshot({ path: '../shot-x-sys-goal.png' });

  // 演出瞬间：把阅读从 380 分推到 600（跨到掌握）
  await p.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('prof.v1'));
    const now = Date.now();
    s.records = s.records.filter(r => r.mid.indexOf('rd-') !== 0);
    for (let i = 0; i < 59; i++) s.records.push({ id: 'rv' + i, ts: now - i * 3000, mid: 'rd-careful', p: 10, got: 9, tot: 10 });
    localStorage.setItem('prof.v1', JSON.stringify(s));
  });
  await p.reload();
  await p.waitForTimeout(900);
  await p.locator('.hrow .plus').first().click();
  await p.waitForTimeout(900);
  await p.screenshot({ path: '../shot-x-sys-levelup.png' });

  await b.close();
  const pass = R.filter(Boolean).length;
  console.log(`\n===== ${pass}/${R.length} 通过 =====`);
  process.exit(pass === R.length ? 0 : 1);
})();
