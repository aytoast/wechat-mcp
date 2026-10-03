(() => {
  const root = document.querySelector('.product-demo');
  if (!root) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const narrow = matchMedia('(max-width: 800px)');
  // Invert an ease-in-out curve: sparse arrivals at both ends, a busy middle.
  function messageArrivalTimes(count, [first, last] = [0, 0]) {
    if (count < 2) return count ? [first] : [];
    return Array.from({length: count}, (_, index) => Math.round(
      first + (last - first) * Math.acos(1 - 2 * index / (count - 1)) / Math.PI
    ));
  }
  const scrollDuration = 550;
  const promptDuration = 1700;
  const $ = selector => root.querySelector(selector);
  const $$ = selector => [...root.querySelectorAll(selector)];
  const viewport = $('.story-messages');
  const list = $('#story-message-list');
  const aiBody = $('.story-codex-body');
  const question = $('#story-question');
  const promptDraft = $('#story-prompt-draft');
  const promptEntry = $('.story-prompt-entry');
  const draft = $('#story-draft');
  const wxWindow = $('.story-wechat');
  const aiWindow = $('.story-codex');

  // Fictional conversation content. Every decision in the answer has a source here.
  const discussion = [
    ['小周', '大家在吗？首页这版今天得定一下。'],
    ['小许', '在。'],
    ['小周', '先说范围：\n桌面端先支持 Windows，手机只放介绍页。\n导航放左边，内容用双列卡片，这版按这个做。'],
    ['阿远', '消息和图片读取我来接。'],
    ['小许', '手机也双列？320px 怕是塞不下。'],
    ['小周', '手机单列，刚才说的是桌面稿。'],
    ['小岑', '我刚试了一次，首次连接时不知道要先开微信，点完也不清楚下一步做什么。这个得写在连接入口旁边。'],
    ['阿远', '收到，我周五前补首次连接说明。'],
    ['小岑', '还有，没读到消息时整个卡片会空掉。\n最好保留卡片，说明现在没有消息。'],
    ['小许', '对，没消息和连接失败得分开。'],
    ['小周', '移动端稿我周五前补好，顺便检查 320px 的按钮和卡片有没有挤。'],
    ['阿远', '重试入口要不要也加上？'],
    ['小周', '先记到下版，这轮不加。'],
    ['小许', '文案还差两块：\n· 空状态怎么写\n· 连接失败怎么提示\n先排给小林，周五前，等他回来确认。'],
    ['小岑', '锁屏时还显示读取中，会不会误导？'],
    ['阿远', '这个周一实测。\n我周一联调消息和图片读取，和大家一起验收。'],
    ['小许', '锁屏提示也请小林定一下。'],
    ['小周', '新需求都先放下版。设计稿晚点我更新到群里。'],
    ['小岑', '收到'],
    ['小周', '小林的分工等他回来确认。']
  ];
  const imageDiscussion = [
    ['小周', '新版桌面稿整理好了，周一按这版验收。'],
    ['小林', '首次连接说明和空状态，图上都补了吗？', true],
    ['小周', '补了，连接说明放在入口下面，没消息时保留卡片。'],
    ['阿远', '失败提示和重试入口，我周五前补。'],
    ['小林', '我先核对图上的内容，再列出需要实测的项目。', true],
    ['小周', '桌面稿在这里。手机稿还在改，320px 按钮我周五前反馈。', false, true]
  ];
  const replyHistory = [
    ['小周', '周一验收新版首页，移动端稿我周五补齐。'],
    ['阿远', '消息和图片读取我来联调，周一一起验收。'],
    ['小林', '空状态和连接失败的文案我整理，周五给你们更新稿。', true],
    ['小许', '锁屏提示还没实测，先留到周一确认。'],
    ['小周', '@小林 文案改好了吗？重试入口这周加吗？我好排周一验收。']
  ];
  const outgoingText = '文案改好了，周五把更新稿给你们。\n重试入口留到下版，锁屏提示周一实测再定。先按这个排验收。';
  const scenes = {
    read: {
      messages: discussion,
      prompt: '我没跟上这轮群聊。请整理周一上线前已定的事项、负责人和截止时间，单独列出还没定、需要我确认的事。',
      title: '已定安排和需要你确认的事项如下。',
      items: [
        ['方案已定', '桌面采用左侧导航和双列卡片；手机介绍页改为单列，首版支持 Windows。'],
        ['周五前交付', '小周补移动端稿并检查 320px 布局；阿远完成连接说明。'],
        ['周一验收', '阿远联调消息和图片读取；锁屏提示仍待确认。'],
        ['需要你确认', '空状态与文案拟交给你，周五前完成，需要你确认安排；锁屏提示也等你定。']
      ],
      note: '重试入口等新需求留到下版；待确认分工已单列。',
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
      messages: replyHistory,
      prompt: '结合我们刚改的内容、项目约定和我平时的回复习惯，直接回复设计协作群里小周的问题。',
      title: '已回复设计协作群。',
      items: [
        ['本地提交', '已在原有聊天记录后观察到这条回复。']
      ],
      note: '接收端送达状态仍为未验证。',
      captions: ['群里已有讨论，小周正在等你的答复。', 'Codex 读取群聊，结合已加载的记忆与项目上下文组织回复。', 'Codex 将组织好的回复交给 WeChat MCP，提交到原群聊。', '原有讨论保留，新回复出现在聊天记录末尾。']
    }
  };

  // Replying reads the current question before composing from loaded Codex context.
  const timelines = {
    read: {
      duration: 13000, arrivals: [180, 3780], codex: 4400, prompt: 4600, tool: 6600, returned: 7500,
      answers: [8000, 8800, 9600, 10400], note: 11500,
      breaks: [4400, 6600, 8000]
    },
    image: {
      duration: 11000, arrivals: [160, 1360], codex: 2800, prompt: 3000, tool: 5000, returned: 5900,
      answers: [6800, 7500, 8200, 8900], note: 9900,
      breaks: [2800, 5000, 6800]
    },
    send: {
      duration: 12000, codex: 1400, prompt: 1600, tool: 3500, readReturned: 4300,
      composed: 4700, draft: 6800, submitted: 8600, returned: 9400,
      answers: [9900], note: 10700,
      breaks: [3500, 6800, 9400]
    }
  };
  let timing = timelines.read, duration = timing.duration, arrivalTimes = [];

  const designImage = '<svg viewBox="0 0 248 154" role="img" aria-label="桌面首页设计稿：左侧导航，双列卡片，首次连接说明与暂无消息空状态"><rect width="248" height="154" rx="4" fill="#f6f8f2"/><path d="M0 23h248M54 23v131" stroke="#dfe6d5"/><circle cx="11" cy="12" r="3" fill="#8daa74"/><text x="20" y="15" font-size="8" fill="#526b40">工作台</text><rect x="8" y="36" width="38" height="14" rx="3" fill="#e0ebd5"/><text x="14" y="46" font-size="7" fill="#64804f">首页</text><text x="14" y="67" font-size="7" fill="#8b997e">会话</text><text x="65" y="42" font-size="9" fill="#3f5832">连接微信</text><rect x="183" y="30" width="54" height="17" rx="4" fill="#739553"/><text x="194" y="42" font-size="7" fill="white">开始连接</text><text x="65" y="58" font-size="7" fill="#899779">首次连接前，请打开并登录微信。</text><rect x="65" y="69" width="80" height="71" rx="4" fill="white" stroke="#dde6d2"/><rect x="154" y="69" width="83" height="71" rx="4" fill="white" stroke="#dde6d2"/><text x="76" y="86" font-size="8" fill="#5b7548">最近会话</text><text x="83" y="115" font-size="7" fill="#9caa8d">暂无消息</text><text x="165" y="86" font-size="8" fill="#5b7548">工作安排</text><path d="M165 101h59M165 113h48M165 125h54" stroke="#e5ebde" stroke-width="4" stroke-linecap="round"/></svg>';

  let sceneKey = 'read', elapsed = 0, playing = false, visible = false, started = false;
  let frame = 0, previous = 0, selectedSurface = '', shownCount = -1;
  let messageNodes = [], scrollStops = [], answerNodes = [], lastAnswerCount = -1, lastNote = false;
  let aiScroll = null, lastImage = false, lastComposed = false, lastContext = false, lastQuestion = false;
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
  // Original fictional avatars, shared by repeat senders across the three stories.
  function avatarImage(name) {
    const palette = {
      '小周': ['#cbd7ce', '#e7be98', '#425a4b', '#453e39'],
      '小许': ['#d8cedb', '#edc9ac', '#80728c', '#403a49'],
      '阿远': ['#c8d5df', '#dab69a', '#557d97', '#343d46'],
      '小岑': ['#e4d7bf', '#e7c6a2', '#a28b60', '#514836'],
      '小林': ['#c6d4c1', '#dfb99b', '#718868', '#3e4437']
    };
    const [bg, skin, shirt, hair] = palette[name] || palette['小林'];
    return '<svg viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" fill="' + bg + '"/><path d="M3 32c0-9 5-13 13-13s13 4 13 13" fill="' + shirt + '"/><ellipse cx="16" cy="13" rx="7" ry="8" fill="' + skin + '"/><path d="M9 14C5 4 13 2 18 4c7 1 7 7 5 12l-3-8c-3 4-7 1-11 6Z" fill="' + hair + '"/><path d="M12 21l4 4 4-4" fill="' + skin + '"/></svg>';
  }
  function makeMessage([name, content, self, attachment]) {
    const row = document.createElement('div');
    row.className = 'story-message' + (self ? ' self' : '');
    const avatar = document.createElement('i');
    avatar.className = 'story-message-avatar';
    avatar.innerHTML = avatarImage(name);
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
      const at = sceneKey === 'send' ? i < replyHistory.length ? -scrollDuration : timing.submitted : arrivalTimes[i];
      const from = prior ? prior.from + (prior.to - prior.from) * ease((at - prior.at) / scrollDuration) : 0;
      scrollStops.push({at, from, to: target});
    }
    shownCount = -1;
  }
  function mountMessages() {
    messageNodes = scenes[sceneKey].messages.map(makeMessage);
    if (sceneKey === 'send') messageNodes.push(makeMessage(['小林', outgoingText, true]));
    list.replaceChildren(...messageNodes);
    $('.story-message-time').textContent = sceneKey === 'send' ? '今天 10:35' : '今天 10:32';
    measureMessages();
    viewport.scrollTop = sceneKey === 'send' ? scrollPosition(0) : 0;
  }
  function scrollPosition(time) {
    let position = 0;
    for (const stop of scrollStops) {
      if (time < stop.at) break;
      position = stop.from + (stop.to - stop.from) * ease((time - stop.at) / scrollDuration);
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
    const count = sending ? replyHistory.length + Number(isOutgoing) : arrivalTimes.filter(at => elapsed >= at).length;
    if (count !== shownCount) {
      messageNodes.forEach((node, index) => {node.hidden = index >= count;});
      shownCount = count;
      text('#story-message-count', count + ' 条消息');
      text('#story-preview', isOutgoing ? outgoingText : count ? scene.messages[count - 1][1] : '有新消息');
    }
    messageNodes.forEach((node, index) => {
      if (index >= count) return;
      const at = sending ? index < replyHistory.length ? -scrollDuration : timing.submitted : arrivalTimes[index];
      const amount = reduced.matches ? 1 : ease((elapsed - at) / 360);
      node.style.opacity = String(amount);
      node.style.transform = 'translateX(' + ((node.classList.contains('self') ? 1 : -1) * 12 * (1 - amount)) + 'px) scale(' + (.97 + .03 * amount) + ')';
      node.classList.toggle('is-read', elapsed >= timing.tool && elapsed < (sending ? timing.readReturned : timing.returned) && index >= count - 4);
    });
    if (force || (!sending && elapsed <= timing.codex) || (sending && elapsed < timing.submitted + scrollDuration)) viewport.scrollTop = scrollPosition(elapsed);
    const reveal = reduced.matches ? Number(elapsed >= timing.codex) : ease((elapsed - timing.codex) / 600);
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
    const typed = Math.floor(scene.prompt.length * clamp((elapsed - timing.prompt) / promptDuration));
    const hasQuestion = elapsed >= timing.prompt + promptDuration;
    const promptText = hasQuestion ? '' : scene.prompt.slice(0, typed);
    if (promptDraft.textContent !== promptText) {
      promptDraft.textContent = promptText;
      promptEntry.scrollTop = promptEntry.scrollHeight;
    }
    question.textContent = scene.prompt;
    $('.story-question').hidden = !hasQuestion;
    animateInto($('.story-question'), reduced.matches ? 1 : ease((elapsed - timing.prompt - promptDuration) / 350), 5);
    $('.story-codex-composer').classList.toggle('has-prompt', Boolean(promptText));
    $('.story-caret').hidden = elapsed < timing.prompt || hasQuestion || reduced.matches;
    $('.story-caret').style.opacity = String(.3 + .7 * (Math.floor(elapsed / 450) % 2));
    $('.story-tool').hidden = elapsed < timing.tool;
    animateInto($('.story-tool'), reduced.matches ? 1 : ease((elapsed - timing.tool) / 450));
    text('#story-answer-title', scene.title);
    text('#story-tool-name', 'read_messages');
    text('#story-tool-detail', sending ? '设计协作群 · 历史讨论与小周的问题' : sceneKey === 'image' ? '设计协作群 · 读取消息与图片' : '设计协作群 · ' + scene.messages.length + ' 条消息');
    text('#story-tool-status', elapsed >= (sending ? timing.readReturned : timing.returned) ? '已返回' : '读取中');
    const hasContext = sending && elapsed >= timing.readReturned;
    const hasComposed = sending && elapsed >= timing.composed;
    $('.story-context').hidden = !hasContext;
    if (hasContext !== lastContext || hasComposed !== lastComposed) $('.story-context').open = hasContext && !hasComposed;
    $('.story-reply').hidden = !hasComposed;
    animateInto($('.story-context'), reduced.matches ? 1 : ease((elapsed - (timing.readReturned || 0)) / 450));
    animateInto($('.story-reply'), reduced.matches ? 1 : ease((elapsed - (timing.composed || 0)) / 500));
    text('#story-reply-text', outgoingText);
    $('.story-send-tool').hidden = !sending || elapsed < timing.draft;
    text('#story-send-status', elapsed >= timing.returned ? '本地已提交' : '提交中');
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
    $('.story-response-actions').hidden = !hasNote;
    if (force) {
      aiScroll = null;
      aiBody.scrollTop = hasImage || answerCount >= 3 || hasNote ? aiBody.scrollHeight : 0;
    } else if (answerCount !== lastAnswerCount || hasNote !== lastNote || hasImage !== lastImage || hasContext !== lastContext || hasComposed !== lastComposed || hasQuestion !== lastQuestion) {
      aiScroll = {at: elapsed, from: aiBody.scrollTop, to: Math.max(0, aiBody.scrollHeight - aiBody.clientHeight)};
    }
    if (aiScroll && elapsed >= aiScroll.at && elapsed < aiScroll.at + 900) {
      aiBody.scrollTop = aiScroll.from + (aiScroll.to - aiScroll.from) * ease((elapsed - aiScroll.at) / 800);
    }
    lastAnswerCount = answerCount;
    lastNote = hasNote;
    lastImage = hasImage;
    lastContext = hasContext;
    lastComposed = hasComposed;
    lastQuestion = hasQuestion;
    text('#story-chat-title', '设计协作群');
    const draftText = sending && elapsed >= timing.draft && elapsed < timing.submitted ? outgoingText.slice(0, Math.floor(outgoingText.length * clamp((elapsed - timing.draft) / 1100))) : '';
    if (draft.textContent !== draftText) {
      draft.textContent = draftText;
      draft.scrollTop = draft.scrollHeight;
    }
    $('.story-compose').classList.toggle('has-draft', sending && elapsed >= timing.draft && elapsed < timing.submitted);
    const phase = timing.breaks.filter(at => elapsed >= at).length;
    const status = sending
      ? elapsed >= timing.returned ? '已观察到本地提交' : isOutgoing ? '消息已提交，等待回执' : elapsed >= timing.draft ? '正在填写回复' : elapsed >= timing.tool ? '读取讨论，结合 Codex 上下文回复' : '小周正在等你的答复'
      : elapsed < timing.codex ? sceneKey === 'image' ? '群里发来了最新设计稿' : '群里正在讨论新版上线' : elapsed < timing.tool ? '已到最新消息' : elapsed < timing.returned ? sceneKey === 'image' ? '正在获取聊天图片' : '正在读取这轮讨论' : sceneKey === 'image' ? '图片已返回给 Codex' : '这轮讨论已返回给 Codex';
    text('#story-wx-status', status);
    text('#story-caption', scene.captions[phase]);
    text('.story-codex-footer', sending ? 'Codex 组织回复 · WeChat MCP 执行桌面操作' : sceneKey === 'image' ? '根据微信返回的图片分析' : '根据微信返回的消息整理');

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
    arrivalTimes = messageArrivalTimes(scenes[key].messages.length, timing.arrivals);
    elapsed = reduced.matches ? duration : 0;
    playing = autoplay && !reduced.matches;
    selectedSurface = '';
    lastAnswerCount = -1;
    lastNote = false;
    lastImage = false;
    lastContext = false;
    lastComposed = false;
    lastQuestion = false;
    $('.story-context').open = false;
    aiScroll = null;
    aiBody.scrollTop = 0;
    mountMessages();
    const scene = scenes[key];
    text('#story-task-title', {read: '整理上线安排', image: '核对设计稿', send: '回复设计协作群'}[key]);
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
    if (button.dataset.scene === sceneKey) return;
    started = true;
    choose(button.dataset.scene, true);
  }));
  // Interacting with a conversation settles the demo so its content stays readable.
  function finish() {
    if (!playing) return;
    playing = false;
    elapsed = duration;
    schedule(true);
  }
  $('.story-context').addEventListener('click', finish);
  $$('[data-surface]').forEach(button => button.addEventListener('click', () => {
    selectedSurface = button.dataset.surface;
    playing = false;
    elapsed = duration;
    schedule(true);
  }));
  for (const panel of [viewport, aiBody]) {
    for (const event of ['wheel', 'touchstart']) panel.addEventListener(event, finish, {passive: true});
    panel.addEventListener('keydown', event => {
      if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) finish();
    });
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
  $('.story-owner').innerHTML = avatarImage('小林');
  choose('read', false);
  document.fonts.ready.then(() => {measureMessages(); schedule(true);});
  observer.observe(root);
})();
