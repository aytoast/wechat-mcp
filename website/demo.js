(() => {
  const root = document.querySelector('.product-demo');
  if (!root) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const narrow = matchMedia('(max-width: 800px)');
  const allArrivalTimes = [450, 1150, 1850, 2550, 3250, 3950, 4650, 5350, 6050, 6750, 7450, 8150, 8850, 9550];
  const $ = selector => root.querySelector(selector);
  const $$ = selector => [...root.querySelectorAll(selector)];
  const viewport = $('.story-messages');
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
    ['小周', '新版桌面稿整理好了，周一按这版验收。'],
    ['小林', '首次连接说明和空状态，图上都补了吗？', true],
    ['小周', '补了，连接说明放在入口下面，没消息时保留卡片。'],
    ['阿远', '失败提示和重试入口，我周五前补。'],
    ['小林', '我先核对图上的内容，再列出需要实测的项目。', true],
    ['小周', '桌面稿在这里。手机稿还在改，320px 按钮我周五前反馈。', false, true]
  ];
  const outgoingText = '周一 10:00 验收新版首页。小周请准备移动端稿，阿远请演示消息和图片读取。我会核对空状态和锁屏提示。';
  const scenes = {
    read: {
      messages: discussion,
      prompt: '这轮讨论消息比较多。请整理周一上线前已经定下的事项、负责人和截止时间，单独列出还没定、需要我确认的事。',
      title: '周一上线前，你需要跟进这些事。',
      items: [
        ['方案已定', '左侧导航、双列卡片；首版先支持 Windows。'],
        ['周五前交付', '小周补移动端稿；阿远写连接说明；你整理空状态与文案。'],
        ['周一验收', '阿远联调消息和图片读取，你确认锁屏提示。'],
        ['仍需跟进', '等小周反馈 320px 检查结果；锁屏提示待定，新需求留到下版。']
      ],
      note: '按这轮讨论整理，待确认项已单独列出。',
      captions: ['群聊消息持续到达，聊天记录随之向下滚动。', '向 Codex 提问，指定需要读取的这轮讨论。', 'WeChat MCP 读取消息，将内容返回 Codex。', 'Codex 根据返回的消息，整理决定、负责人和待确认项。']
    },
    image: {
      messages: imageDiscussion,
      prompt: '查看设计协作群刚发的桌面稿，核对首次连接说明和空状态是否已经补上，再列出仅凭这张图还无法确认、需要周一实测的项目。',
      title: '这张桌面稿里，可以确认两处改动。',
      items: [
        ['首次连接说明', '连接入口下方已写明：首次连接前，请打开并登录微信。'],
        ['空状态', '最近会话卡片仍保留，内部显示暂无消息。'],
        ['图中未展示', '失败提示、重试入口和锁屏状态，需要在运行界面核对。'],
        ['另行实测', '这张是桌面稿；手机 320px 布局与实际连接行为仍需验证。']
      ],
      note: '图片用于确认可见内容，运行行为仍需实测。',
      captions: ['设计稿作为图片出现在微信会话里。', '请 Codex 核对图中已经修改的内容。', 'WeChat MCP 获取聊天图片，并把图片内容返回 Codex。', 'Codex 查看返回的图片，区分图上可见内容与待实测项目。']
    },
    send: {
      messages: [],
      prompt: '向设计协作群发送这条周一验收提醒：\n' + outgoingText,
      title: '验收提醒已在微信中提交。',
      items: [
        ['目标会话', '设计协作群'],
        ['本地提交', '已在聊天记录中观察到这条验收提醒。']
      ],
      note: '接收端送达状态仍为未验证。',
      captions: ['在 Codex 中指定会话，给出需要发送的消息。', 'WeChat MCP 打开目标会话，填写消息内容。', '消息出现在微信中，等待本地提交回执。', 'Codex 收到本地提交结果，接收端送达状态保留为未验证。']
    }
  };

  // Each feature has its own sequence; sending never calls a reading tool.
  const timelines = {
    read: {
      duration: 28000, codex: 11000, prompt: 11500, tool: 15000, returned: 16800,
      answers: [17400, 18700, 20000, 21300], note: 22600,
      breaks: [11000, 15000, 17400], chapters: [0, 12000, 15700, 22400],
      staticChapters: [10500, 14600, 17000, 28000], labels: ['群聊', '提问', '读取', '总结']
    },
    image: {
      duration: 24000, codex: 7000, prompt: 7500, tool: 11000, returned: 12800,
      answers: [14600, 15900, 17200, 18500], note: 20000,
      breaks: [7000, 11000, 14600], chapters: [5000, 8500, 13500, 22000],
      staticChapters: [6200, 10600, 13800, 24000], labels: ['图片', '提问', '读取', '分析']
    },
    send: {
      duration: 18000, codex: 0, prompt: 500, tool: 7000, draft: 7800, submitted: 10800, returned: 12000,
      answers: [12600, 13900], note: 15100,
      breaks: [7800, 10800, 12000], chapters: [4000, 9500, 11400, 16500],
      staticChapters: [4000, 9500, 11500, 18000], labels: ['指令', '输入', '提交', '回执']
    }
  };
  let timing = timelines.read, duration = timing.duration, arrivalTimes = allArrivalTimes;

  const designImage = '<svg viewBox="0 0 248 154" role="img" aria-label="桌面首页设计稿：左侧导航，双列卡片，首次连接说明与暂无消息空状态"><rect width="248" height="154" rx="4" fill="#f6f8f2"/><path d="M0 23h248M54 23v131" stroke="#dfe6d5"/><circle cx="11" cy="12" r="3" fill="#8daa74"/><text x="20" y="15" font-size="8" fill="#526b40">工作台</text><rect x="8" y="36" width="38" height="14" rx="3" fill="#e0ebd5"/><text x="14" y="46" font-size="7" fill="#64804f">首页</text><text x="14" y="67" font-size="7" fill="#8b997e">会话</text><text x="65" y="42" font-size="9" fill="#3f5832">连接微信</text><rect x="183" y="30" width="54" height="17" rx="4" fill="#739553"/><text x="194" y="42" font-size="7" fill="white">开始连接</text><text x="65" y="58" font-size="7" fill="#899779">首次连接前，请打开并登录微信。</text><rect x="65" y="69" width="80" height="71" rx="4" fill="white" stroke="#dde6d2"/><rect x="154" y="69" width="83" height="71" rx="4" fill="white" stroke="#dde6d2"/><text x="76" y="86" font-size="8" fill="#5b7548">最近会话</text><text x="83" y="115" font-size="7" fill="#9caa8d">暂无消息</text><text x="165" y="86" font-size="8" fill="#5b7548">工作安排</text><path d="M165 101h59M165 113h48M165 125h54" stroke="#e5ebde" stroke-width="4" stroke-linecap="round"/></svg>';

  let sceneKey = 'read', elapsed = 0, playing = false, visible = false, started = false;
  let frame = 0, previous = 0, selectedSurface = '', shownCount = -1, outgoingMode = false;
  let messageNodes = [], scrollStops = [], answerNodes = [], lastAnswerCount = -1, lastNote = false;
  let aiScroll = null, lastOutgoing = false, lastImage = false;
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
      const at = sceneKey === 'send' ? timing.submitted : arrivalTimes[i];
      const from = prior ? prior.from + (prior.to - prior.from) * ease((at - prior.at) / 850) : 0;
      scrollStops.push({at, from, to: target});
    }
    shownCount = -1;
  }
  function mountMessages(outgoing) {
    outgoingMode = outgoing;
    messageNodes = outgoing ? [makeMessage(['小林', outgoingText, true])] : scenes[sceneKey].messages.map(makeMessage);
    list.replaceChildren(...messageNodes);
    $('.story-message-time').textContent = sceneKey === 'send' ? '今天 10:35' : '今天 10:32';
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
    const sending = sceneKey === 'send';
    const isOutgoing = sending && elapsed >= timing.submitted;
    if (outgoingMode !== isOutgoing) mountMessages(isOutgoing);
    const count = sending ? Number(isOutgoing) : arrivalTimes.filter(at => elapsed >= at).length;
    if (count !== shownCount) {
      messageNodes.forEach((node, index) => {node.hidden = index >= count;});
      shownCount = count;
      text('#story-message-count', count + ' 条消息');
      text('#story-preview', sending ? count ? outgoingText : '周一验收提醒' : count ? scene.messages[count - 1][1] : '有新消息');
    }
    messageNodes.forEach((node, index) => {
      if (index >= count) return;
      const amount = reduced.matches ? 1 : ease((elapsed - (isOutgoing ? timing.submitted : arrivalTimes[index])) / 500);
      node.style.opacity = String(amount);
      node.style.transform = 'translateX(' + ((node.classList.contains('self') ? 1 : -1) * 12 * (1 - amount)) + 'px) scale(' + (.97 + .03 * amount) + ')';
      node.classList.toggle('is-read', !sending && elapsed >= timing.tool && elapsed < timing.returned && index >= count - 4);
    });
    if (!sending && (elapsed <= timing.codex || force || lastOutgoing)) viewport.scrollTop = scrollPosition(elapsed);
    if (isOutgoing && (elapsed < timing.submitted + 1000 || force)) viewport.scrollTop = Math.max(0, viewport.scrollHeight - viewport.clientHeight) * (reduced.matches ? 1 : ease((elapsed - timing.submitted) / 850));
    lastOutgoing = isOutgoing;
    const reveal = reduced.matches ? Number(elapsed >= timing.codex) : ease((elapsed - timing.codex) / 900);
    root.style.setProperty('--reveal', reveal);
    root.style.setProperty('--wx-shift', ((1 - reveal) * 43) + '%');
    root.style.setProperty('--codex-y', ((1 - reveal) * 24) + 'px');
    const codexVisible = elapsed >= timing.codex;
    const surface = selectedSurface || (sending && elapsed >= timing.draft && elapsed < timing.returned ? 'wechat' : 'auto');
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
    const typed = Math.floor(scene.prompt.length * clamp((elapsed - timing.prompt) / 2900));
    question.textContent = scene.prompt.slice(0, reduced.matches ? scene.prompt.length : typed);
    $('.story-caret').hidden = elapsed < timing.prompt || elapsed >= timing.prompt + 3100 || reduced.matches;
    $('.story-caret').style.opacity = String(.3 + .7 * (Math.floor(elapsed / 450) % 2));
    $('.story-tool').hidden = elapsed < timing.tool;
    animateInto($('.story-tool'), reduced.matches ? 1 : ease((elapsed - timing.tool) / 450));
    text('#story-answer-title', scene.title);
    text('#story-tool-name', sending ? 'send_message' : 'read_messages');
    text('#story-tool-detail', sending ? '设计协作群 · 发送验收提醒' : sceneKey === 'image' ? '设计协作群 · 读取消息与图片' : '设计协作群 · 14 条消息');
    text('#story-tool-status', elapsed >= timing.returned ? sending ? '本地已提交' : '已返回' : sending ? '提交中' : '读取中');
    const hasImage = sceneKey === 'image' && elapsed >= timing.returned;
    $('.story-image-result').hidden = !hasImage;
    animateInto($('.story-image-result'), reduced.matches ? 1 : ease((elapsed - timing.returned) / 600));
    $('.story-summary').hidden = elapsed < timing.answers[0];
    const answerCount = timing.answers.filter(at => elapsed >= at).length;
    answerNodes.forEach((node, index) => {
      node.hidden = index >= answerCount;
      animateInto(node, reduced.matches ? 1 : ease((elapsed - timing.answers[index]) / 600));
    });
    const hasNote = elapsed >= timing.note;
    $('#story-answer-note').hidden = !hasNote;
    if (force) {
      aiScroll = null;
      aiBody.scrollTop = hasImage || answerCount >= 3 || hasNote ? aiBody.scrollHeight : 0;
    } else if (answerCount !== lastAnswerCount || hasNote !== lastNote || hasImage !== lastImage) {
      aiScroll = {at: elapsed, from: aiBody.scrollTop, to: Math.max(0, aiBody.scrollHeight - aiBody.clientHeight)};
    }
    if (aiScroll && elapsed >= aiScroll.at && elapsed < aiScroll.at + 900) {
      aiBody.scrollTop = aiScroll.from + (aiScroll.to - aiScroll.from) * ease((elapsed - aiScroll.at) / 800);
    }
    lastAnswerCount = answerCount;
    lastNote = hasNote;
    lastImage = hasImage;
    text('#story-chat-title', '设计协作群');
    text('#story-draft', sending && elapsed >= timing.draft && elapsed < timing.submitted ? outgoingText.slice(0, Math.floor(outgoingText.length * clamp((elapsed - timing.draft) / 1600))) : '');
    const chapter = timing.breaks.filter(at => elapsed >= at).length;
    root.dataset.chapter = String(chapter);
    const status = sending
      ? elapsed >= timing.returned ? '已观察到本地提交' : isOutgoing ? '消息已提交，等待回执' : elapsed >= timing.draft ? '正在填写发送内容' : '等待 Codex 发送指令'
      : elapsed < timing.codex ? sceneKey === 'image' ? '群里发来了最新设计稿' : '群里正在讨论新版上线' : elapsed < timing.tool ? '已到最新消息' : elapsed < timing.returned ? sceneKey === 'image' ? '正在获取聊天图片' : '正在读取这轮讨论' : sceneKey === 'image' ? '图片已返回给 Codex' : '这轮讨论已返回给 Codex';
    text('#story-wx-status', status);
    text('#story-caption', scene.captions[chapter]);
    text('.story-codex-footer', sending ? '发送操作由 WeChat MCP 执行' : sceneKey === 'image' ? '根据微信返回的图片分析' : '根据微信返回的消息整理');
    $$('[data-chapter]').forEach(button => {
      if (Number(button.dataset.chapter) === chapter) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });
    scrubber.value = String(elapsed);
    scrubber.style.setProperty('--progress', (elapsed / duration * 100) + '%');
    scrubber.setAttribute('aria-valuetext', Math.floor(elapsed / 1000) + ' 秒，共 ' + duration / 1000 + ' 秒');
    text('#story-clock', '0:' + String(Math.floor(elapsed / 1000)).padStart(2, '0') + ' / 0:' + duration / 1000);
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
    timing = timelines[key];
    duration = timing.duration;
    arrivalTimes = allArrivalTimes.slice(0, scenes[key].messages.length);
    scrubber.max = String(duration);
    $$('[data-chapter]').forEach((button, index) => {button.textContent = timing.labels[index];});
    elapsed = reduced.matches ? duration : 0;
    playing = autoplay && !reduced.matches;
    selectedSurface = '';
    lastAnswerCount = -1;
    lastNote = false;
    lastImage = false;
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
    const positions = reduced.matches ? timing.staticChapters : timing.chapters;
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
  $('.story-image-result').innerHTML = '<figcaption>已收到微信中的图片</figcaption>' + designImage;
  choose('read', false);
  document.fonts.ready.then(() => {measureMessages(); schedule(true);});
  observer.observe(root);
})();
