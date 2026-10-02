(() => {
  const root = document.querySelector('.product-demo');
  if (!root) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const narrow = matchMedia('(max-width: 800px)');
  const duration = 28000;
  const arrivalTimes = [450, 1150, 1850, 2550, 3250, 3950, 4650, 5350, 6050, 6750, 7450, 8150, 8850, 9550];
  const answerTimes = [17400, 18700, 20000, 21300];
  const $ = selector => root.querySelector(selector);
  const $$ = selector => [...root.querySelectorAll(selector)];
  const viewport = $('.story-messages');
  const track = $('.story-message-track');
  const list = $('#story-message-list');
  const aiBody = $('.story-codex-body');
  const question = $('#story-question');
  const play = $('#story-play');
  const scrubber = $('.story-scrubber');
  const wxWindow = $('.story-wechat');
  const aiWindow = $('.story-codex');

  // Fictional conversation content. Every decision in the answer has a source here.
  const discussion = [
    ['小林', '首页这版先做 Windows，移动端只看介绍页。', true],
    ['小周', '导航放左边？内容区我想做双列。'],
    ['阿远', '可以，我这边接 MCP 的消息和图片读取。'],
    ['小林', '左侧导航 + 双列卡片，按这个推进。', true],
    ['小周', '手机 320px 宽的时候，卡片改成单列。'],
    ['阿远', '首次连接步骤要补一下，让用户知道先开微信。'],
    ['小林', '还有空状态，没读到内容时需要说清楚。', true],
    ['小周', '我周五前补齐移动端稿，320px 我再检查一遍。'],
    ['阿远', '首次连接说明我来写，也放周五前。'],
    ['小林', '我周五前整理好空状态和页面文案。', true],
    ['小周', '锁屏时的提示还没定，周一验收时一起确认。'],
    ['阿远', '周一我联调消息和图片读取，再一起验收。'],
    ['小林', '我来确认锁屏提示。这轮先收住，新需求放下个版本。', true],
    ['小周', '收到，我把设计稿和待办都更新到群里。']
  ];
  const imageDiscussion = [
    ['小周', '新版首页的验收项，我们在这里对一下。'],
    ['小林', '我负责周一验收，先看阻塞上线的问题。', true],
    ['阿远', '上版第一次连接时，没有提醒先打开微信。'],
    ['小周', '已补说明，我把它放到连接入口下面了。'],
    ['小林', '双列内容保留，窄屏要改成单列。', true],
    ['小周', '手机稿已经改好，320px 的按钮还要检查。'],
    ['阿远', '读取为空时，之前整个区域会消失。'],
    ['小周', '已改成保留卡片，显示暂无消息。'],
    ['小林', '文案也区分一下：没消息、连接失败是两种情况。', true],
    ['阿远', '失败提示我周五前补，保留重试入口。'],
    ['小周', '最新桌面稿发这里，连接说明和空状态都补了。', false, true],
    ['小林', '周一我验收空状态、重试入口和手机按钮。', true],
    ['阿远', '锁屏也要实测一次，确认提示和恢复连接。'],
    ['小周', '我来检查 320px 按钮，周五前反馈；锁屏提示周一一起定。']
  ];
  const savedText = '周一上线验收清单\n\n周五前\n· 小周：移动端稿与 320px 检查\n· 阿远：首次连接说明\n· 小林：空状态与页面文案\n\n周一\n· 阿远：联调消息和图片读取\n· 小林：确认锁屏提示\n\n待确认：320px 检查结果、锁屏提示\n新需求：留到下版';
  const scenes = {
    read: {
      messages: discussion,
      prompt: '我刚开完会，错过了这轮讨论。请整理周一上线前已经定下的事项、负责人和截止时间，单独列出还没定、需要我确认的事。',
      title: '周一上线前，你需要跟进这些事。',
      items: [
        ['方案已定', '左侧导航、双列卡片；首版先支持 Windows。'],
        ['周五前交付', '小周补移动端稿；阿远写连接说明；你整理空状态与文案。'],
        ['周一验收', '阿远联调消息和图片读取，你确认锁屏提示。'],
        ['仍需跟进', '等小周反馈 320px 检查结果；锁屏提示待定，新需求留到下版。']
      ],
      note: '按这轮讨论整理，待确认项已单独列出。',
      captions: ['讨论还在继续，决定散落在一条条消息里。', '错过会议间隙的讨论，先找出自己需要推进的事。', 'Codex 通过 WeChat MCP 读取这轮讨论。', '决定、负责人、截止时间与待确认项，一次对齐。']
    },
    image: {
      messages: imageDiscussion,
      prompt: '我负责周一验收。结合这轮反馈和最新设计稿，列出已经解决的问题、仍需改动的地方，以及上线前要逐项检查的内容。',
      title: '可以按这份清单准备周一验收。',
      items: [
        ['稿上已补', '连接入口下有首次连接说明，空状态保留卡片并显示暂无消息。'],
        ['周五前补齐', '阿远补失败提示与重试入口；小周检查 320px 按钮。'],
        ['周一逐项检查', '你验收空状态、失败重试、窄屏按钮，以及锁屏后的提示和恢复。'],
        ['还不能确认', '这张是桌面稿，手机布局和实际重试行为仍需现场验证。']
      ],
      note: '结合返回的图片与群聊反馈整理。',
      captions: ['反馈陆续补进群里，最新设计稿也来了。', '把设计稿和讨论放在一起，准备一份可执行的验收清单。', 'WeChat MCP 把可获取的图片与消息一起交给 Codex。', '哪些已改、哪些待验，区分清楚再上线。']
    },
    send: {
      messages: discussion,
      prompt: '把群里已经确认的安排整理成我的周一验收清单，保留负责人、截止时间和待确认项，发到文件传输助手，方便我跟进。',
      title: '清单已整理，接着保存到微信。',
      items: [
        ['周五前', '小周补移动端稿；阿远写连接说明；你整理空状态与文案。'],
        ['周一', '阿远联调消息和图片读取，你确认锁屏提示。'],
        ['单列待确认项', '320px 检查结果、锁屏提示继续跟进；新需求留到下版。'],
        ['保存结果', '已在文件传输助手的本地聊天中看到提交。']
      ],
      note: '本地提交已观察到 · 接收端送达未验证',
      captions: ['群里敲定了分工，接下来需要逐项跟进。', '把确认过的安排存回微信，方便周一逐项核对。', 'Codex 先读取讨论，整理负责人和时间。', '清单整理完毕，按你的要求保存到文件传输助手。']
    }
  };

  const designImage = '<svg viewBox="0 0 248 154" role="img" aria-label="桌面首页设计稿：左侧导航，双列卡片，首次连接说明与暂无消息空状态"><rect width="248" height="154" rx="4" fill="#f6f8f2"/><path d="M0 23h248M54 23v131" stroke="#dfe6d5"/><circle cx="11" cy="12" r="3" fill="#8daa74"/><text x="20" y="15" font-size="8" fill="#526b40">工作台</text><rect x="8" y="36" width="38" height="14" rx="3" fill="#e0ebd5"/><text x="14" y="46" font-size="7" fill="#64804f">首页</text><text x="14" y="67" font-size="7" fill="#8b997e">会话</text><text x="65" y="42" font-size="9" fill="#3f5832">连接微信</text><rect x="183" y="30" width="54" height="17" rx="4" fill="#739553"/><text x="194" y="42" font-size="7" fill="white">开始连接</text><text x="65" y="58" font-size="7" fill="#899779">首次连接前，请打开并登录微信。</text><rect x="65" y="69" width="80" height="71" rx="4" fill="white" stroke="#dde6d2"/><rect x="154" y="69" width="83" height="71" rx="4" fill="white" stroke="#dde6d2"/><text x="76" y="86" font-size="8" fill="#5b7548">最近会话</text><text x="83" y="115" font-size="7" fill="#9caa8d">暂无消息</text><text x="165" y="86" font-size="8" fill="#5b7548">工作安排</text><path d="M165 101h59M165 113h48M165 125h54" stroke="#e5ebde" stroke-width="4" stroke-linecap="round"/></svg>';

  let sceneKey = 'read', elapsed = 0, playing = false, visible = false, started = false;
  let frame = 0, previous = 0, selectedSurface = '', shownCount = -1, savedMode = false;
  let messageNodes = [], scrollStops = [], answerNodes = [], lastAnswerCount = -1, lastNote = false;
  let aiScroll = null, lastSaved = false;
  const clamp = x => Math.max(0, Math.min(1, x));
  // Solve cubic-bezier(.22, .68, 0, 1), shared by arrivals, scrolling and window entrance.
  function ease(x) {
    x = clamp(x);
    if (x === 0 || x === 1) return x;
    let low = 0, high = 1, t = x;
    for (let i = 0; i < 12; i++) {
      t = (low + high) / 2;
      const value = 3 * (1-t) * (1-t) * t * .22 + t * t * t;
      if (value < x) low = t; else high = t;
    }
    return 3 * (1-t) * (1-t) * t * .68 + 3 * (1-t) * t * t + t * t * t;
  }
  function text(selector, value) {
    const element = $(selector);
    if (element.textContent !== value) element.textContent = value;
  }
  function makeMessage([name, content, self, attachment]) {
    const row = document.createElement('div');
    row.className = 'story-message' + (self ? ' self' : '');
    const avatar = document.createElement('i');
    avatar.className = 'story-message-avatar';
    avatar.textContent = name.slice(-1);
    avatar.setAttribute('aria-hidden', 'true');
    const body = document.createElement('div');
    body.className = 'story-message-body';
    const author = document.createElement('small');
    author.textContent = self ? '我' : name;
    const bubble = document.createElement('p');
    bubble.textContent = content;
    body.append(author, bubble);
    if (attachment) {
      const figure = document.createElement('figure');
      figure.className = 'story-attachment';
      figure.style.marginInline = '0';
      figure.innerHTML = designImage + '<figcaption>首页设计稿 · 桌面版</figcaption>';
      body.append(figure);
    }
    row.append(avatar, body);
    return row;
  }
  function measureMessages() {
    messageNodes.forEach(node => { node.hidden = false; });
    scrollStops = [];
    for (let i = 0; i < messageNodes.length; i++) {
      const node = messageNodes[i];
      const target = Math.max(0, node.offsetTop + node.offsetHeight + 6 - viewport.clientHeight);
      const prior = scrollStops[i-1];
      const from = prior ? prior.from + (prior.to - prior.from) * ease((arrivalTimes[i] - prior.at) / 850) : 0;
      scrollStops.push({at: arrivalTimes[i], from, to: target});
    }
    shownCount = -1;
  }
  function mountMessages(saved) {
    savedMode = saved;
    messageNodes = saved ? [makeMessage(['小林', savedText, true])] : scenes[sceneKey].messages.map(makeMessage);
    list.replaceChildren(...messageNodes);
    $('.story-message-time').textContent = saved ? '今天 10:35' : '今天 10:32';
    measureMessages();
    viewport.scrollTop = 0;
  }
  function scrollPosition(time) {
    let position = 0;
    for (const stop of scrollStops) {
      if (time < stop.at) break;
      position = stop.from + (stop.to - stop.from) * ease((time - stop.at) / 850);
    }
    return position;
  }
  function animateInto(node, amount, distance = 8) {
    node.style.opacity = String(amount);
    node.style.transform = 'translateY(' + ((1 - amount) * distance) + 'px)';
  }
  function render(force = false) {
    const scene = scenes[sceneKey];
    const isSaved = sceneKey === 'send' && elapsed >= 22000;
    if (savedMode !== isSaved) mountMessages(isSaved);
    const count = isSaved ? Number(elapsed >= 23600) : arrivalTimes.filter(at => elapsed >= at).length;
    if (count !== shownCount) {
      messageNodes.forEach((node, index) => {node.hidden = index >= count;});
      shownCount = count;
      text('#story-message-count', count + ' 条消息');
      if (!isSaved) text('#story-preview', count ? scene.messages[count - 1][1] : '有新消息');
    }
    messageNodes.forEach((node, index) => {
      if (index >= count) return;
      const amount = reduced.matches ? 1 : ease((elapsed - (isSaved ? 23600 : arrivalTimes[index])) / 500);
      node.style.opacity = String(amount);
      node.style.transform = 'translateX(' + ((node.classList.contains('self') ? 1 : -1) * 12 * (1 - amount)) + 'px) scale(' + (.97 + .03 * amount) + ')';
      node.classList.toggle('is-read', !isSaved && elapsed >= 15000 && elapsed < 16800 && index >= count - 4);
    });
    if (!isSaved && (elapsed <= 11000 || force || lastSaved)) viewport.scrollTop = scrollPosition(elapsed);
    if (isSaved && elapsed >= 23600 && (elapsed < 24600 || force)) viewport.scrollTop = Math.max(0, viewport.scrollHeight - viewport.clientHeight) * (reduced.matches ? 1 : ease((elapsed - 23600) / 850));
    lastSaved = isSaved;
    const reveal = reduced.matches ? Number(elapsed >= 11000) : ease((elapsed - 11000) / 900);
    root.style.setProperty('--reveal', reveal);
    root.style.setProperty('--wx-shift', ((1 - reveal) * 43) + '%');
    root.style.setProperty('--codex-y', ((1 - reveal) * 24) + 'px');
    const codexVisible = elapsed >= 11000;
    const surface = selectedSurface || (sceneKey === 'send' && elapsed >= 22000 && elapsed < 25200 ? 'wechat' : 'auto');
    root.dataset.surface = surface;
    root.dataset.codex = String(codexVisible);
    root.dataset.scene = sceneKey;
    root.dataset.elapsed = String(Math.round(elapsed));
    const wxActive = !narrow.matches || surface === 'wechat' || (surface === 'auto' && !codexVisible);
    const aiActive = codexVisible && (!narrow.matches || surface === 'codex' || (surface === 'auto' && codexVisible));
    wxWindow.inert = !wxActive;
    aiWindow.inert = !aiActive;
    wxWindow.setAttribute('aria-hidden', String(!wxActive));
    aiWindow.setAttribute('aria-hidden', String(!aiActive));
    $$('[data-surface]').forEach(button => {
      button.disabled = button.dataset.surface === 'codex' && !codexVisible;
      button.setAttribute('aria-pressed', String(button.dataset.surface === (wxActive && narrow.matches ? 'wechat' : codexVisible ? 'codex' : 'wechat')));
    });
    const typed = Math.floor(scene.prompt.length * clamp((elapsed - 11500) / 2900));
    question.textContent = scene.prompt.slice(0, reduced.matches ? scene.prompt.length : typed);
    $('.story-caret').hidden = elapsed < 11500 || elapsed >= 14600 || reduced.matches;
    $('.story-caret').style.opacity = String(.3 + .7 * (Math.floor(elapsed / 450) % 2));
    $('.story-tool').hidden = elapsed < 15000;
    animateInto($('.story-tool'), reduced.matches ? 1 : ease((elapsed - 15000) / 450));
    const sending = sceneKey === 'send' && elapsed >= 22000;
    text('#story-answer-title', sceneKey === 'send' && elapsed >= 24600 ? '清单已提交到文件传输助手。' : scene.title);
    text('#story-tool-name', sending ? 'send_message' : 'read_messages');
    text('#story-tool-detail', sending ? '文件传输助手 · 保存验收清单' : sceneKey === 'image' ? '设计协作群 · 消息与图片' : '设计协作群 · 14 条消息');
    text('#story-tool-status', sending ? elapsed >= 24600 ? '本地已提交' : '提交中' : elapsed >= 16800 ? '已返回' : '读取中');
    $('.story-summary').hidden = elapsed < 17400;
    const times = sceneKey === 'send' ? [17400, 18700, 20000, 24600] : answerTimes;
    const answerCount = times.filter(at => elapsed >= at).length;
    answerNodes.forEach((node, index) => {
      node.hidden = index >= answerCount;
      animateInto(node, reduced.matches ? 1 : ease((elapsed - times[index]) / 600));
    });
    const hasNote = elapsed >= (sceneKey === 'send' ? 25000 : 22600);
    $('#story-answer-note').hidden = !hasNote;
    if (force) {
      aiScroll = null;
      aiBody.scrollTop = elapsed >= 20000 ? aiBody.scrollHeight : 0;
    } else if (answerCount !== lastAnswerCount || hasNote !== lastNote) {
      aiScroll = {at: elapsed, from: aiBody.scrollTop, to: Math.max(0, aiBody.scrollHeight - aiBody.clientHeight)};
    }
    if (aiScroll && elapsed >= aiScroll.at && elapsed < aiScroll.at + 900) {
      aiBody.scrollTop = aiScroll.from + (aiScroll.to - aiScroll.from) * ease((elapsed - aiScroll.at) / 800);
    }
    lastAnswerCount = answerCount;
    lastNote = hasNote;
    text('#story-chat-title', isSaved ? '文件传输助手' : '设计协作群');
    $$('[data-chat]').forEach(item => item.classList.toggle('selected', item.dataset.chat === (isSaved ? 'saved' : 'group')));
    text('#story-draft', isSaved && elapsed < 23600 ? savedText.slice(0, Math.floor(savedText.length * clamp((elapsed - 22100) / 1200))) : '');
    const chapter = elapsed < 11000 ? 0 : elapsed < 15000 ? 1 : elapsed < 17400 ? 2 : 3;
    root.dataset.chapter = String(chapter);
    const status = isSaved ? elapsed >= 24600 ? '已观察到本地提交' : '正在保存清单' : elapsed < 10000 ? '群里正在讨论新版上线' : elapsed < 15000 ? '已到最新消息' : elapsed < 16800 ? '正在读取这轮讨论' : '这轮讨论已返回给 Codex';
    text('#story-wx-status', status);
    text('#story-caption', scene.captions[chapter]);
    $$('[data-chapter]').forEach(button => {
      if (Number(button.dataset.chapter) === chapter) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });
    scrubber.value = String(elapsed);
    scrubber.style.setProperty('--progress', (elapsed / duration * 100) + '%');
    scrubber.setAttribute('aria-valuetext', Math.floor(elapsed / 1000) + ' 秒，共 28 秒');
    text('#story-clock', '0:' + String(Math.floor(elapsed / 1000)).padStart(2, '0') + ' / 0:28');
    const label = reduced.matches ? '静态展示' : playing ? '暂停 Ⅱ' : elapsed >= duration ? '重播 ↻' : '播放 ▷';
    play.textContent = label;
    play.disabled = reduced.matches;
    play.setAttribute('aria-label', reduced.matches ? '已启用减少动态效果' : playing ? '暂停演示' : elapsed >= duration ? '重播演示' : '播放演示');
  }
  function cancel() {
    cancelAnimationFrame(frame);
    frame = 0;
    previous = 0;
  }
  function tick(now) {
    frame = 0;
    if (!playing || !visible || document.hidden || reduced.matches) return;
    if (previous) elapsed = Math.min(duration, elapsed + now - previous);
    previous = now;
    if (elapsed >= duration) playing = false;
    render();
    if (playing) frame = requestAnimationFrame(tick);
  }
  function schedule(force = false) {
    cancel();
    render(force);
    if (playing && visible && !document.hidden && !reduced.matches) frame = requestAnimationFrame(tick);
  }
  function choose(key, autoplay) {
    sceneKey = key;
    elapsed = reduced.matches ? duration : 0;
    playing = autoplay && !reduced.matches;
    selectedSurface = '';
    lastAnswerCount = -1;
    lastNote = false;
    aiScroll = null;
    aiBody.scrollTop = 0;
    mountMessages(false);
    const scene = scenes[key];
    answerNodes = scene.items.map(([title, body]) => {
      const item = document.createElement('div');
      item.className = 'story-answer-item';
      const heading = document.createElement('b');
      heading.textContent = title;
      const paragraph = document.createElement('p');
      paragraph.textContent = body;
      item.append(heading, paragraph);
      return item;
    });
    $('#story-answer-items').replaceChildren(...answerNodes);
    text('#story-answer-title', scene.title);
    text('#story-answer-note', scene.note);
    $$('[data-scene]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.scene === key)));
    schedule(true);
  }
  $$('[data-scene]').forEach(button => button.addEventListener('click', () => {
    started = true;
    choose(button.dataset.scene, true);
  }));
  play.addEventListener('click', () => {
    if (reduced.matches) return;
    started = true;
    if (elapsed >= duration) { choose(sceneKey, true); return; }
    playing = !playing;
    selectedSurface = '';
    schedule();
  });
  function seek(value) {
    started = true;
    playing = false;
    selectedSurface = '';
    elapsed = value;
    schedule(true);
  }
  $$('[data-chapter]').forEach(button => button.addEventListener('click', () => {
    const positions = reduced.matches ? [10500, 14600, 17000, duration] : [0, 12000, 15700, sceneKey === 'send' ? 26000 : 22400];
    seek(positions[Number(button.dataset.chapter)]);
  }));
  scrubber.addEventListener('input', () => seek(Number(scrubber.value)));
  $$('[data-surface]').forEach(button => button.addEventListener('click', () => {
    selectedSurface = button.dataset.surface;
    playing = false;
    schedule();
  }));
  // Let readers scroll either conversation without autoplay pulling it away.
  for (const panel of [viewport, aiBody]) {
    for (const event of ['wheel', 'touchstart']) panel.addEventListener(event, () => {
      if (playing) { playing = false; schedule(); }
    }, {passive: true});
  }
  const observer = new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (visible && !started) {
      started = true;
      playing = !reduced.matches;
    }
    schedule();
  }, {threshold: .2});
  document.addEventListener('visibilitychange', () => schedule());
  reduced.addEventListener('change', () => {
    if (reduced.matches) {playing = false; elapsed = duration;}
    schedule(true);
  });
  let lastWidth = 0, lastHeight = 0;
  new ResizeObserver(entries => {
    const {width, height} = entries[0].contentRect;
    if (Math.abs(width - lastWidth) < 1 && Math.abs(height - lastHeight) < 1) return;
    lastWidth = width;
    lastHeight = height;
    measureMessages();
    schedule(true);
  }).observe(viewport);
  narrow.addEventListener('change', () => schedule(true));
  choose('read', false);
  document.fonts.ready.then(() => {measureMessages(); schedule(true);});
  observer.observe(root);
})();
