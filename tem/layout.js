(function () {
  var B = document.body, L = B.dataset.layout || 'myron', MENU = B.dataset.menu || '';
  if (L === 'none') return;

  var css = [
    '.shell{display:flex;min-height:100vh}',
    '.mainw{flex:1;min-width:0;overflow-x:clip}',
    '.mainw>.mct{min-height:calc(100vh - 64px)}',
    /* ---------- Myron sidebar ---------- */
    '.sb{width:240px;flex:none;background:#0d1420;color:#b4bccd;position:sticky;top:0;height:100vh;overflow:auto;padding-bottom:24px;font-family:"DM Sans",Arial,sans-serif}',
    '.sb::-webkit-scrollbar{width:0}',
    '.sb .logo{height:66px;display:flex;align-items:center;gap:10px;padding:0 24px;font-size:24px;font-weight:600;color:#fff;border-bottom:1px solid #1a2331}',
    '.sb .logo .lg{width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,#8d82f8,#c768f2);display:flex;align-items:center;justify-content:center;font-size:16px}',
    '.sb ul{list-style:none;margin:0;padding:0}',
    '.sb .sec{font-size:10px;letter-spacing:1.2px;color:#6c768a;padding:24px 24px 12px}',
    '.sb .it{display:flex;align-items:center;gap:12px;color:#b4bccd;text-decoration:none;font-size:14px;cursor:pointer}',
    '.sb .l0>li>.it{padding:12px 14px;margin:3px 10px;border-radius:6px}',
    '.sb .l0>li.cur>.it{background:linear-gradient(90deg,#8d82f8,#c768f2);color:#fff}',
    '.sb .ic{width:20px;text-align:center;font-size:15px}',
    '.sb .chev{margin-inline-start:auto;font-size:15px;transition:transform .2s}',
    '.sb li.open>.it .chev{transform:rotate(180deg)}',
    '.sb .l1,.sb .l2{display:none}',
    '.sb li.open>ul{display:block}',
    '.sb .l1 .it{padding:10px 14px 10px 14px;margin:0 10px;font-size:13px;padding-inline-start:30px}',
    '.sb .l2 .it{padding-inline-start:52px}',
    '.sb .l1 li.on>.it,.sb .l2 li.on>.it{color:#fff;font-weight:600}',
    '.sb .l1 li.cur>.it{color:#fff}',
    '.sb .dot{width:5px;height:5px;border-radius:50%;background:currentColor;flex:none}',
    '.mtb{height:64px;background:#fff;border-bottom:1px solid #eceef6;display:flex;align-items:center;gap:16px;padding:0 24px;position:sticky;top:0;z-index:5;font-family:"DM Sans",Arial,sans-serif}',
    '.mtb .hb{background:none;border:0;font-size:20px;color:#5b6479;cursor:pointer}',
    '.mtb .srch{display:flex;align-items:center;border:1px solid #e3e5ee;border-radius:20px;padding:0 14px;width:320px;height:38px;background:#fff}',
    '.mtb .srch input{border:0!important;flex:1;font-size:13px;padding:0!important;background:none}',
    '.mtb .tbr{margin-inline-start:auto;display:flex;align-items:center;gap:18px;font-size:18px;color:#5b6479}',
    '.mtb .av{width:36px;height:36px;border-radius:50%;background:#7c6cf6;color:#fff;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:600}',
    /* ---------- Admin sidebar ---------- */
    '.asb{width:264px;flex:none;background:#fff;border-inline-end:1px solid #e5e7eb;position:sticky;top:0;height:100vh;display:flex;flex-direction:column;font-family:Inter,Arial,sans-serif}',
    '.asb .asc{flex:1;overflow:auto;padding:14px 12px}',
    '.asb .st{display:flex;justify-content:space-between;font-size:10.5px;letter-spacing:1.2px;color:#6b7280;font-weight:600;padding:14px 12px 8px}',
    '.asb a{display:flex;align-items:center;gap:12px;padding:9px 12px;border-radius:8px;color:#374151;text-decoration:none;font-size:14px;margin-bottom:2px}',
    '.asb a .ic{width:18px;text-align:center;color:#6b7280}',
    '.asb a.on{background:#ede9fe;color:#4c1d95;font-weight:500}',
    '.asb a.on .ic{color:#6d28d9}',
    '.asb .asu{border-top:1px solid #e5e7eb;padding:14px 16px;display:flex;align-items:center;gap:12px}',
    '.asb .av2{width:32px;height:32px;border-radius:50%;background:#ede9fe;color:#6d28d9;font-size:11px;font-weight:600;display:flex;align-items:center;justify-content:center}',
    '.asb .asu b{display:block;font-size:13px;font-weight:600}.asb .asu small{color:#6b7280;font-size:12px}'
  ].join('\n');
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var kids = [].slice.call(B.childNodes).filter(function (n) { return !(n.nodeType === 1 && n.tagName === 'SCRIPT'); });
  var shell = document.createElement('div'); shell.className = 'shell';
  var side = '', head = '';

  if (L === 'myron') {
    var o = function (n, h, c, i) { return { n: n, h: h, c: c, i: i }; };
    var leaf = function (a) { return a.map(function (x) { return o(x); }); };
    var dash = [o('Sales', 'sales.html'), o('Analytics', 'analytics.html'), o('Ecommerce', 'ecommerce.html')]
      .concat(leaf(['CRM', 'Crypto', 'NFT', 'Projects', 'Jobs', 'HRM', 'Courses', 'Stocks', 'Medical', 'POS System', 'Podcast', 'School', 'Social Media']));
    var pages = [['Products', 'products.html'], ['Shop', 'shop.html'], ['Product Details', 'product-details.html'], ['Cart', 'cart.html'], ['Checkout', 'checkout.html'], ['Orders', 'orders.html'], ['Order Details', 'order-details.html'], ['Customers List', 'customers.html'], ['Transactions', 'transactions.html']]
      .map(function (x) { return o(x[0], x[1]); });
    var admin = [['Plans', 'plans.html'], ['Subscriptions', 'subscriptions.html'], ['Security Center', 'security.html'], ['All Users', 'users.html'], ['Roles', 'roles.html'], ['Telecom Market', 'telecom.html']]
      .map(function (x) { return o(x[0], x[1]); });
    var M = [
      { s: 'MAIN' }, o('Dashboards', 0, dash, '⌂'),
      { s: 'WEB APPS' },
      o('Apps', 0, [o('Chat'), o('Email', 0, [o('Mail App', 'mail.html'), o('Mail Settings')]), o('Full Calendar'), o('File Manager'), o('Gallery'), o('Sweet Alerts'), o('Task', 0, leaf(['Kanban', 'List'])), o('To Do List')], '▦'),
      o('Nested Menu', 0, leaf(['Level 1', 'Level 2']), '◈'),
      { s: 'PAGES' },
      o('Authentication', 0, leaf(['Sign In', 'Sign Up']), '🔒'),
      o('Error', 0, leaf(['404', '500']), 'ⓘ'),
      o('Pages', 0, pages.concat([o('Admin Panel', 0, admin)]), '▤'),
      { s: 'GENERAL' },
      o('Forms', 0, leaf(['Elements', 'Validation']), '▥')
    ];
    var node = function (x, path, lvl) {
      var p = path ? path + '>' + x.n : x.n;
      var on = MENU === p, within = on || MENU.indexOf(p + '>') === 0;
      var s = '<li class="' + (within ? 'cur ' : '') + (on ? 'on ' : '') + (x.c && within ? 'open' : '') + '">' +
        '<a class="it" href="' + (x.h || '#') + '"' + (x.c ? ' data-t="1"' : '') + '>' +
        (lvl === 0 ? '<span class="ic">' + (x.i || '•') + '</span>' : '<span class="dot"></span>') +
        '<span class="tx">' + x.n + '</span>' + (x.c ? '<span class="chev">⌄</span>' : '') + '</a>';
      if (x.c) s += '<ul class="l' + (lvl + 1) + '">' + x.c.map(function (y) { return node(y, p, lvl + 1); }).join('') + '</ul>';
      return s + '</li>';
    };
    side = '<aside class="sb"><div class="logo"><span class="lg">m</span>Myron</div><ul class="l0">' +
      M.map(function (x) { return x.s ? '<li class="sec">' + x.s + '</li>' : node(x, '', 0); }).join('') + '</ul></aside>';
    head = '<header class="mtb"><button class="hb">☰</button><div class="srch"><input placeholder="Search for Results..."><span>🔍</span></div>' +
      '<div class="tbr"><span>☀</span><span>🔔</span><span class="av">JM</span></div></header>';
  } else {
    var A = [
      ['DASHBOARDS', [['Overview', '▦'], ['Analytics', '⌁'], ['Security', '⛉', 'security.html'], ['Onboarding', '☺'], ['Builder', '◈']]],
      ['USERS', [['All Users', '☺', 'users.html'], ['Add User', '＋'], ['Invitations', '✉']]],
      ['ACCESS CONTROL', [['Admins', '☺'], ['Roles', '⚷', 'roles.html'], ['Permissions', '🔒'], ['Modules', '▣']]],
      ['ORGANIZATION', [['Teams', '☺'], ['Groups', '⚇'], ['Sessions', '▭']]],
      ['MONITORING', [['Audit Log', '▤'], ['Reports', '▥']]],
      ['BILLING', [['Subscriptions', '▭', 'subscriptions.html'], ['Plans', '♛', 'plans.html']]]
    ];
    side = '<aside class="asb"><div class="asc">' + A.map(function (s) {
      return '<div class="st"><span>' + s[0] + '</span><span>⌄</span></div>' + s[1].map(function (i) {
        return '<a href="' + (i[2] || '#') + '" class="' + (MENU === i[0] ? 'on' : '') + '"><span class="ic">' + i[1] + '</span>' + i[0] + '</a>';
      }).join('');
    }).join('') + '</div><div class="asu"><span class="av2">AM</span><div><b>Amara Okonkwo</b><small>Workspace Owner</small></div></div></aside>';
  }

  shell.innerHTML = side + '<div class="mainw">' + head + '<div class="mct"></div></div>';
  var ct = shell.querySelector('.mct');
  kids.forEach(function (n) { ct.appendChild(n); });
  B.insertBefore(shell, B.firstChild);

  shell.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a.it,.asb a') : null;
    if (!a) return;
    if (a.getAttribute('href') === '#') e.preventDefault();
    if (a.dataset.t) { e.preventDefault(); a.parentNode.classList.toggle('open'); }
  });
})();
