(function () {
  "use strict";

  const $ = id => document.getElementById(id);
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const behavior = () => (reduceMotion.matches ? "auto" : "smooth");
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  /* ================= Mobile menu ================= */
  const menuButton = document.querySelector(".menu-button");
  const nav = $("primary-nav");

  function setMenu(open) {
    menuButton.setAttribute("aria-expanded", String(open));
    nav.classList.toggle("is-open", open);
  }
  menuButton.addEventListener("click", () => setMenu(menuButton.getAttribute("aria-expanded") !== "true"));
  nav.addEventListener("click", e => { if (e.target.closest("a")) setMenu(false); });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && nav.classList.contains("is-open")) { setMenu(false); menuButton.focus(); }
  });
  window.matchMedia("(min-width: 761px)").addEventListener("change", e => { if (e.matches) setMenu(false); });

  $("year").textContent = new Date().getFullYear();

  /* ================= Sample document ================= */
  const SAMPLE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Page Title</title>
  <meta name="description" content="Brief description of the page.">
  <link rel="stylesheet" href="styles.css">
  <script src="app.js" defer><\/script>
</head>
<body>
  <header class="site-header">
    <div class="site-logo">Site Logo</div>
    <button class="menu-button">☰ Menu</button>
    <nav class="primary-nav">
      <ul>
        <li><a href="/">Home</a></li>
        <li><a href="/about">About</a></li>
        <li><a href="/services">Services</a></li>
        <li><a href="/contact">Contact</a></li>
      </ul>
    </nav>
  </header>
  <main id="main">
    <nav class="breadcrumbs">Home › Blog › Article Title</nav>
    <article>
      <header class="article-header">
        <span class="category">Web Development</span>
        <h1 class="article-title">Article Title Goes Here</h1>
        <p class="summary">A short summary of the article.</p>
        <div class="meta">May 20, 2024 | By Jane Doe</div>
      </header>
      <figure>
        <img src="photo.jpg" alt="Article image">
        <figcaption>Image caption describing the image.</figcaption>
      </figure>
      <div class="article-content">
        <h2>Section Heading</h2>
        <p>Paragraph of content…</p>
        <div class="note">
          <p>Tip: nesting depth does not add specificity.</p>
        </div>
        <ul>
          <li>List item one</li>
          <li>List item two</li>
          <li>List item three</li>
        </ul>
      </div>
      <footer class="article-footer">
        <div class="tags">Tag 1, Tag 2, Tag 3</div>
        <nav class="post-navigation">‹ Previous Article | Next Article ›</nav>
      </footer>
    </article>
    <aside class="related-content">
      <h2>Related Articles</h2>
      <ul>
        <li><a href="/post-1">Related Post 1</a></li>
        <li><a href="/post-2">Related Post 2</a></li>
        <li><a href="/post-3">Related Post 3</a></li>
      </ul>
    </aside>
  </main>
  <footer class="site-footer">
    <nav class="footer-nav">
      <ul>
        <li><a href="/privacy">Privacy Policy</a></li>
        <li><a href="/terms">Terms of Service</a></li>
        <li><a href="/sitemap">Sitemap</a></li>
        <li><a href="/contact">Contact</a></li>
      </ul>
    </nav>
    <address>123 Main Street, Anytown, USA</address>
    <div class="copyright">© 2024 Your Site Name. All rights reserved.</div>
  </footer>
</body>
</html>`;

  const DESCRIPTIONS = {
    "#document": "The root of the tree. In JavaScript this is the document object, the starting point for every query.",
    "#doctype": "Tells the browser to render in standards mode. It is a node in the tree but not an element.",
    html: "The root element. Every other element is its descendant.",
    head: "Metadata for the browser: encoding, title, styles and scripts. Nothing here is drawn on the page.",
    meta: "Machine-readable information about the page, such as encoding, viewport or description.",
    title: "The text shown in the browser tab and in search results.",
    link: "Connects an outside resource to the page. Here it loads the stylesheet.",
    script: "Loads JavaScript. The defer attribute runs it after the document has been parsed.",
    body: "Holds everything the reader sees.",
    header: "Introductory content for its nearest section, or for the whole page when it sits directly in body.",
    nav: "A block of navigation links.",
    ul: "An unordered list. Its children should be li elements.",
    ol: "An ordered list. Its children should be li elements.",
    li: "One item in a list.",
    a: "A link to another page or another place on this one.",
    div: "A generic container with no meaning of its own. Usually a hook for styling.",
    span: "A generic inline container.",
    button: "A control the user can press.",
    main: "The content unique to this page. A page should have only one.",
    article: "A self-contained piece that would make sense on its own, such as a post or a card.",
    section: "A thematic group of content, usually with a heading.",
    h1: "The top-level heading.",
    h2: "A second-level heading.",
    h3: "A third-level heading.",
    p: "A paragraph of text.",
    figure: "Self-contained media, such as an image, with an optional caption.",
    img: "An image. The alt text describes it for people who cannot see it.",
    figcaption: "The caption for its figure.",
    aside: "Content related to the main content but separate from it.",
    footer: "Closing content for its nearest section, or for the whole page when it sits directly in body.",
    address: "Contact information for the page or article author."
  };
  const BRANCH_NAMES = {
    doc: "Document root", doctype: "Document type", html: "html element", head: "head section", body: "body section",
    header: "Site header", main: "main section", article: "article", aside: "aside section", footer: "Site footer"
  };
  const SHOW_ATTRS = ["lang", "charset", "name", "rel", "href", "src", "defer"];
  const ATTR_TAGS = new Set(["HTML", "META", "LINK", "SCRIPT", "IMG"]);

  /* ================= Tree state ================= */
  const tree = $("tree");
  const treeScroll = $("tree-scroll");
  const inspector = $("inspector");
  let doc = null;
  let nodeMap = new Map();     // parsed node -> rendered <li>
  let majors = [];
  let selected = null;
  let matches = [];
  let matchIndex = -1;
  let jumpTargets = [];
  let uid = 0;

  const isTopLevel = n => (n.nodeName === "HEADER" || n.nodeName === "FOOTER") && n.parentNode && n.parentNode.nodeName === "BODY";
  const isMajor = n => n.nodeType === 9 || ["HTML", "HEAD", "BODY", "MAIN", "ARTICLE"].includes(n.nodeName) || isTopLevel(n);

  function branchOf(n) {
    if (n.nodeType === 10) return "doctype";
    for (let p = n; p; p = p.parentNode) {
      if (p.nodeType === 9) return "doc";
      const t = p.nodeName;
      if (t === "ARTICLE") return "article";
      if (t === "ASIDE") return "aside";
      if (t === "MAIN") return "main";
      if (isTopLevel(p)) return t.toLowerCase();
      if (t === "HEAD") return "head";
      if (t === "BODY") return "body";
      if (t === "HTML") return "html";
    }
    return "doc";
  }

  function plainName(n) {
    if (n.nodeType === 9) return "#document";
    if (n.nodeType === 10) return "<!DOCTYPE " + (n.name || "html") + ">";
    let s = n.localName;
    if (n.id) s += "#" + n.id;
    n.classList.forEach(c => { s += "." + c; });
    return s;
  }

  function labelOf(n, withAttrs) {
    if (n.nodeType === 9) return '<span class="tg">#document</span>';
    if (n.nodeType === 10) return `<span class="tg">&lt;!DOCTYPE ${esc(n.name || "html")}&gt;</span>`;
    let h = `<span class="tg">${esc(n.localName)}</span>`;
    if (n.id) h += `<span class="id">#${esc(n.id)}</span>`;
    n.classList.forEach(c => { h += `<span class="cl">.${esc(c)}</span>`; });
    if (withAttrs && ATTR_TAGS.has(n.nodeName)) {
      SHOW_ATTRS.forEach(a => {
        if (!n.hasAttribute(a)) return;
        const v = n.getAttribute(a);
        h += `<span class="at"> ${a}${v ? `="${esc(v)}"` : ""}</span>`;
      });
    }
    return h;
  }

  function kidsOf(n) {
    if (n.nodeType === 9) return [...n.childNodes].filter(c => c.nodeType === 1 || c.nodeType === 10);
    if (n.nodeType === 1) return [...n.children];
    return [];
  }

  function depthOf(n) {
    let d = 0;
    for (let p = n.parentNode; p; p = p.parentNode) d++;
    return d;
  }

  const truncate = (s, max) => (s.length > max ? s.slice(0, max - 1) + "…" : s);
  const chevSVG = '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 4.5l3 3 3-3"/></svg>';

  function render(n) {
    const li = document.createElement("li");
    li.className = `node b-${branchOf(n)}`;
    li.domNode = n;
    nodeMap.set(n, li);
    const kids = kidsOf(n);
    const major = isMajor(n) && kids.length > 0;
    const text = n.nodeType === 1 && kids.length === 0 ? n.textContent.trim().replace(/\s+/g, " ") : "";
    const gid = `g${++uid}`;

    const row = document.createElement("div");
    row.className = "row";
    let html = "";
    if (major) {
      li.classList.add("major");
      const total = n.querySelectorAll("*").length;
      html += `<button type="button" class="chev" tabindex="-1" aria-expanded="true" aria-controls="${gid}" aria-label="Collapse ${esc(plainName(n))}"><span aria-hidden="true">${chevSVG}</span></button>`;
      html += `<button type="button" class="pick" tabindex="-1" aria-pressed="false"><span class="lbl">${labelOf(n, true)}</span><span class="count">${total} inside</span></button>`;
    } else {
      html += `<button type="button" class="pick" tabindex="-1" aria-pressed="false"><span class="lbl">${labelOf(n, true)}</span>${text ? `<span class="txt">${esc(truncate(text, 48))}</span>` : ""}</button>`;
    }
    row.innerHTML = html;
    li.appendChild(row);

    if (kids.length) {
      const ul = document.createElement("ul");
      ul.className = "inner";
      kids.forEach(k => ul.appendChild(render(k)));
      if (major) {
        const wrap = document.createElement("div");
        wrap.className = "kids";
        wrap.id = gid;
        wrap.appendChild(ul);
        li.appendChild(wrap);
        majors.push(li);
      } else {
        li.appendChild(ul);
      }
    }
    return li;
  }

  const pickOf = li => li.querySelector(":scope > .row > .pick");
  const chevOf = li => li.querySelector(":scope > .row > .chev");
  const isOpen = li => chevOf(li).getAttribute("aria-expanded") === "true";

  function setOpen(li, open) {
    const chev = chevOf(li);
    if (!chev) return;
    chev.setAttribute("aria-expanded", String(open));
    chev.setAttribute("aria-label", `${open ? "Collapse" : "Expand"} ${plainName(li.domNode)}`);
    li.classList.toggle("collapsed", !open);
    const k = li.querySelector(":scope > .kids");
    k.classList.toggle("closed", !open);
    k.inert = !open;
    fixRoving();
  }

  /* Roving tabindex: only one node in the tree is in the Tab order. */
  function setRoving(btn) {
    const cur = tree.querySelector('.pick[tabindex="0"]');
    if (cur && cur !== btn) cur.tabIndex = -1;
    btn.tabIndex = 0;
  }
  function fixRoving() {
    const cur = tree.querySelector('.pick[tabindex="0"]');
    if (cur && !cur.closest("[inert]")) return;
    let li = cur ? cur.closest(".node") : null;
    while (li && li.closest("[inert]")) li = li.parentElement.closest(".node");
    const target = li ? pickOf(li) : tree.querySelector(".pick");
    if (!target) return;
    const hadFocus = document.activeElement === cur;
    setRoving(target);
    if (hadFocus) target.focus();
  }
  const visiblePicks = () => [...tree.querySelectorAll(".pick")].filter(b => !b.closest("[inert]"));

  function scrollRowIntoView(li, delay) {
    const run = () => {
      const row = li.querySelector(":scope > .row");
      const c = treeScroll.getBoundingClientRect();
      const r = row.getBoundingClientRect();
      if (r.top < c.top + 8 || r.bottom > c.bottom - 8) {
        treeScroll.scrollTo({ top: treeScroll.scrollTop + (r.top - c.top) - c.height / 3, behavior: behavior() });
      }
      if (r.left < c.left || r.left > c.right - 80) {
        treeScroll.scrollTo({ left: treeScroll.scrollLeft + (r.left - c.left) - 24, behavior: behavior() });
      }
    };
    if (delay && !reduceMotion.matches) setTimeout(run, 330); else run();
  }

  function select(n, opts) {
    const { reveal = true, focus = false } = opts || {};
    const li = nodeMap.get(n);
    if (!li) return;
    tree.querySelectorAll(".node.selected, .node.on-path").forEach(x => x.classList.remove("selected", "on-path"));
    tree.querySelectorAll('.pick[aria-pressed="true"]').forEach(b => b.setAttribute("aria-pressed", "false"));
    selected = n;
    li.classList.add("selected");
    pickOf(li).setAttribute("aria-pressed", "true");
    let opened = false;
    for (let p = li.parentElement.closest(".node"); p; p = p.parentElement.closest(".node")) {
      p.classList.add("on-path");
      if (reveal && p.classList.contains("major") && !isOpen(p)) { setOpen(p, true); opened = true; }
    }
    setRoving(pickOf(li));
    if (focus) pickOf(li).focus({ preventScroll: true });
    if (reveal) scrollRowIntoView(li, opened);
    renderInspector(n);
  }

  /* ================= Inspector ================= */
  function cssPath(el) {
    if (!el || el.nodeType !== 1) return null;
    const parts = [];
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      if (n.id) { parts.unshift("#" + CSS.escape(n.id)); break; }
      let part = n.localName + [...n.classList].map(c => "." + CSS.escape(c)).join("");
      const parent = n.parentElement;
      if (parent) {
        const same = [...parent.children].filter(s => s.localName === n.localName);
        if (same.length > 1 && same.filter(s => s.matches(part)).length > 1) part += `:nth-of-type(${same.indexOf(n) + 1})`;
      }
      parts.unshift(part);
      try { if (doc.querySelectorAll(parts.join(" > ")).length === 1) break; } catch (e) { /* keep climbing */ }
    }
    return parts.join(" > ");
  }

  function jumpBtn(n, current) {
    jumpTargets.push(n);
    return `<button type="button" class="jump b-${branchOf(n)}" data-j="${jumpTargets.length - 1}"${current ? ' aria-current="true"' : ""}>${esc(plainName(n))}</button>`;
  }

  function renderInspector(n) {
    jumpTargets = [];
    const branch = branchOf(n);
    const key = n.nodeType === 9 ? "#document" : n.nodeType === 10 ? "#doctype" : n.localName;
    const kids = kidsOf(n);
    const type = n.nodeType === 9 ? "Document" : n.nodeType === 10 ? "Doctype" : "Element";
    const depth = depthOf(n);

    let h = `<div class="insp-head b-${branch}">
      <span class="insp-branch"><i></i>${esc(BRANCH_NAMES[branch] || "")}</span>
      <h3 class="insp-title">${labelOf(n, false)}</h3>
      <p class="insp-desc">${esc(DESCRIPTIONS[key] || "An HTML element.")}</p>
    </div>
    <dl class="facts">
      <div><dt>Type</dt><dd>${type}</dd></div>
      <div><dt>Depth</dt><dd>${depth}</dd></div>
      <div><dt>Children</dt><dd>${kids.length}</dd></div>
    </dl>`;

    const chain = [];
    for (let p = n; p; p = p.parentNode) chain.unshift(p);
    if (chain.length > 1) {
      h += `<div class="insp-block"><h4>Path from the root</h4><ol class="path">${chain.map(p => `<li>${jumpBtn(p, p === n)}</li>`).join("")}</ol></div>`;
    }

    if (kids.length) {
      h += `<div class="insp-block"><h4>Children</h4><div class="kid-list">${kids.map(k => jumpBtn(k, false)).join("")}</div></div>`;
    }

    if (n.nodeType === 1) {
      const attrs = [...n.attributes];
      h += `<div class="insp-block"><h4>Attributes</h4>${attrs.length
        ? `<table class="attrs"><tbody>${attrs.map(a => `<tr><th scope="row">${esc(a.name)}</th><td>${a.value ? esc(a.value) : "<em>(no value)</em>"}</td></tr>`).join("")}</tbody></table>`
        : '<p class="empty">No attributes.</p>'}</div>`;

      if (!kids.length && n.textContent.trim()) {
        h += `<div class="insp-block"><h4>Text</h4><p class="insp-text">${esc(n.textContent.trim().replace(/\s+/g, " "))}</p></div>`;
      }

      const path = cssPath(n);
      const js = `document.querySelector("${path.replace(/"/g, '\\"')}")`;
      h += `<div class="insp-block"><h4>Select it with JavaScript</h4>
        <code class="code-line" id="insp-code">${esc(js)}</code>
        <div class="insp-row"><span>Specificity</span>${specHTML(maxSpec(path))}
        <button type="button" class="btn btn--small" id="insp-copy">Copy</button>
        <button type="button" class="btn btn--small" id="insp-try">Highlight with this</button></div>
      </div>`;
      inspector.dataset.path = path;
      inspector.dataset.js = js;
    }
    inspector.innerHTML = h;
  }

  inspector.addEventListener("click", e => {
    const j = e.target.closest(".jump");
    if (j && j.getAttribute("aria-current") !== "true") {
      select(jumpTargets[+j.dataset.j], { reveal: true });
      return;
    }
    if (e.target.closest("#insp-copy")) {
      const btn = e.target.closest("#insp-copy");
      const text = inspector.dataset.js;
      const done = label => { btn.textContent = label; setTimeout(() => { btn.textContent = "Copy"; }, 1600); };
      const fallback = () => {
        const range = document.createRange();
        range.selectNodeContents($("insp-code"));
        const s = window.getSelection();
        s.removeAllRanges();
        s.addRange(range);
        done("Selected, press Ctrl+C");
      };
      try {
        navigator.clipboard.writeText(text).then(() => done("Copied"), fallback);
      } catch (err) { fallback(); }
      return;
    }
    if (e.target.closest("#insp-try")) {
      selInput.value = inspector.dataset.path;
      runSelector();
    }
  });

  /* ================= Tree events ================= */
  tree.addEventListener("click", e => {
    const chev = e.target.closest(".chev");
    if (chev) {
      const li = chev.closest(".node");
      setOpen(li, !isOpen(li));
      return;
    }
    const pick = e.target.closest(".pick");
    if (pick) select(pick.closest(".node").domNode, { reveal: false });
  });

  tree.addEventListener("dblclick", e => {
    const pick = e.target.closest(".pick");
    const li = pick && pick.closest(".node.major");
    if (li) setOpen(li, !isOpen(li));
  });

  tree.addEventListener("keydown", e => {
    const b = e.target.closest(".pick");
    if (!b) return;
    const list = visiblePicks();
    const i = list.indexOf(b);
    const li = b.closest(".node");
    const major = li.classList.contains("major");
    let target = null;
    switch (e.key) {
      case "ArrowDown": target = list[i + 1]; break;
      case "ArrowUp": target = list[i - 1]; break;
      case "Home": target = list[0]; break;
      case "End": target = list[list.length - 1]; break;
      case "ArrowRight":
        if (major && !isOpen(li)) setOpen(li, true);
        else if (major && list[i + 1] && li.contains(list[i + 1])) target = list[i + 1];
        break;
      case "ArrowLeft":
        if (major && isOpen(li)) setOpen(li, false);
        else {
          const p = li.parentElement.closest(".node");
          if (p) target = pickOf(p);
        }
        break;
      default: return;
    }
    e.preventDefault();
    if (target) {
      select(target.closest(".node").domNode, { reveal: false, focus: true });
      target.scrollIntoView({ block: "nearest", inline: "nearest" });
    }
  });

  $("expand-all").addEventListener("click", () => majors.forEach(li => setOpen(li, true)));
  $("collapse-all").addEventListener("click", () => {
    majors.forEach(li => setOpen(li, li === tree.firstElementChild));
    treeScroll.scrollTo({ top: 0, left: 0 });
  });

  /* ================= Specificity ================= */
  function readIdent(s, i) {
    while (i < s.length) {
      const ch = s[i];
      if (ch === "\\") { i += 2; continue; }
      if (/[\w-]/.test(ch) || ch.charCodeAt(0) > 127) { i++; continue; }
      break;
    }
    return i;
  }
  function closeOf(s, i) {
    const open = s[i], close = open === "(" ? ")" : "]";
    let depth = 0, q = null;
    for (let j = i; j < s.length; j++) {
      const ch = s[j];
      if (q) { if (ch === "\\") j++; else if (ch === q) q = null; continue; }
      if (ch === '"' || ch === "'") { q = ch; continue; }
      if (ch === open) depth++;
      else if (ch === close && --depth === 0) return j;
    }
    return s.length - 1;
  }
  function splitList(s) {
    const out = [];
    let depth = 0, q = null, start = 0;
    for (let j = 0; j < s.length; j++) {
      const ch = s[j];
      if (q) { if (ch === "\\") j++; else if (ch === q) q = null; continue; }
      if (ch === '"' || ch === "'") { q = ch; continue; }
      if (ch === "(" || ch === "[") depth++;
      else if (ch === ")" || ch === "]") depth--;
      else if (ch === "," && depth === 0) { out.push(s.slice(start, j)); start = j + 1; }
    }
    out.push(s.slice(start));
    return out.map(x => x.trim()).filter(Boolean);
  }
  const cmpSpec = (x, y) => { for (let k = 0; k < 3; k++) if (x[k] !== y[k]) return x[k] - y[k]; return 0; };
  const LEGACY_PSEUDO_ELEMENTS = new Set(["before", "after", "first-line", "first-letter"]);

  function specOne(s) {
    const r = [0, 0, 0];
    const add = v => { r[0] += v[0]; r[1] += v[1]; r[2] += v[2]; };
    let i = 0;
    while (i < s.length) {
      const ch = s[i];
      if (ch === "#") { r[0]++; i = readIdent(s, i + 1); }
      else if (ch === ".") { r[1]++; i = readIdent(s, i + 1); }
      else if (ch === "[") { r[1]++; i = closeOf(s, i) + 1; }
      else if (ch === ":") {
        if (s[i + 1] === ":") {
          r[2]++;
          i = readIdent(s, i + 2);
          if (s[i] === "(") i = closeOf(s, i) + 1;
        } else {
          const end = readIdent(s, i + 1);
          const name = s.slice(i + 1, end).toLowerCase();
          let arg = null;
          i = end;
          if (s[i] === "(") { const c = closeOf(s, i); arg = s.slice(i + 1, c); i = c + 1; }
          if (LEGACY_PSEUDO_ELEMENTS.has(name)) r[2]++;
          else if (name === "where") { /* always 0-0-0 */ }
          else if ((name === "is" || name === "not" || name === "has") && arg !== null) add(maxSpec(arg));
          else if ((name === "nth-child" || name === "nth-last-child") && arg && /\sof\s/i.test(arg)) {
            r[1]++;
            add(maxSpec(arg.split(/\sof\s/i).slice(1).join(" of ")));
          }
          else r[1]++;
        }
      }
      else if (ch === "*") i++;
      else if (/[A-Za-z_\\-]/.test(ch) || ch.charCodeAt(0) > 127) { r[2]++; i = readIdent(s, i); }
      else i++;
    }
    return r;
  }
  function maxSpec(list) {
    return splitList(list).map(specOne).reduce((m, s) => (cmpSpec(s, m) > 0 ? s : m), [0, 0, 0]);
  }
  function isValidSelector(s) {
    try { document.createDocumentFragment().querySelector(s); return true; } catch (e) { return false; }
  }
  const fmt = s => s.join("-");
  const specHTML = s => `<span class="spec" role="img" aria-label="specificity ${fmt(s)}"><b class="a">${s[0]}</b><b class="b">${s[1]}</b><b class="c">${s[2]}</b></span>`;

  /* ================= Selector highlighter ================= */
  const selForm = $("sel-form");
  const selInput = $("sel-input");
  const selStatus = $("sel-status");

  function clearMatches() {
    tree.querySelectorAll(".node.match").forEach(n => n.classList.remove("match"));
    matches = [];
    matchIndex = -1;
  }

  function runSelector() {
    const s = selInput.value.trim();
    clearMatches();
    selInput.removeAttribute("aria-invalid");
    selStatus.classList.remove("is-error");
    if (!s) { selStatus.textContent = ""; return; }

    let found;
    try { found = [...doc.querySelectorAll(s)]; }
    catch (e) {
      selInput.setAttribute("aria-invalid", "true");
      selStatus.classList.add("is-error");
      selStatus.textContent = `"${s}" isn't a valid CSS selector. Check for a missing bracket, quote or stray combinator.`;
      return;
    }

    matches = found.map(n => nodeMap.get(n)).filter(Boolean);
    matches.forEach(li => {
      li.classList.add("match");
      for (let p = li.parentElement.closest(".node"); p; p = p.parentElement.closest(".node")) {
        if (p.classList.contains("major") && !isOpen(p)) setOpen(p, true);
      }
    });

    const parts = splitList(s);
    const n = matches.length;
    let msg = `<span><strong>${n}</strong> match${n === 1 ? "" : "es"}</span><span>Specificity ${specHTML(maxSpec(s))}${parts.length > 1 ? " (highest in the list)" : ""}</span>`;
    if (!n && /::|:(before|after|first-line|first-letter)\b/i.test(s)) {
      msg += "<span>Pseudo-elements style part of an element, so they never match a node in the tree.</span>";
    }
    selStatus.innerHTML = msg;
    if (n > 1) {
      const next = document.createElement("button");
      next.type = "button";
      next.className = "btn";
      next.textContent = "Next match";
      next.addEventListener("click", () => {
        matchIndex = (matchIndex + 1) % matches.length;
        select(matches[matchIndex].domNode, { reveal: true });
      });
      selStatus.appendChild(next);
    }
    if (n) { matchIndex = 0; select(matches[0].domNode, { reveal: true }); }
  }

  selForm.addEventListener("submit", e => { e.preventDefault(); runSelector(); });
  $("sel-clear").addEventListener("click", () => {
    selInput.value = "";
    selInput.removeAttribute("aria-invalid");
    selStatus.classList.remove("is-error");
    clearMatches();
    selStatus.textContent = "";
    selInput.focus();
  });
  selForm.querySelector(".chips").addEventListener("click", e => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    selInput.value = chip.dataset.sel;
    runSelector();
  });

  /* ================= Example list ================= */
  const EXAMPLES = [
    { sel: "p", why: "One type selector." },
    { sel: ".note", why: "One class. Beats any number of type selectors." },
    { sel: "#main", why: "One ID. Beats any number of classes." },
    { sel: "#main .note p", why: "One of each column." },
    { sel: ".note p", why: "One class plus one type." },
    { sel: "html body main article div div p", why: "Seven type selectors. Long, but it only fills column C." }
  ];
  $("examples").innerHTML = EXAMPLES.map((x, i) => `<li class="example">
      <code>${esc(x.sel)}</code>${specHTML(maxSpec(x.sel))}
      <p>${esc(x.why)}</p>
      <button type="button" class="btn" data-ex="${i}">Highlight in the explorer</button>
    </li>`).join("");
  $("examples").addEventListener("click", e => {
    const b = e.target.closest("[data-ex]");
    if (!b) return;
    selInput.value = EXAMPLES[+b.dataset.ex].sel;
    runSelector();
    $("explorer").scrollIntoView({ behavior: behavior(), block: "start" });
  });

  /* ================= Comparator ================= */
  const cmpA = $("cmp-a");
  const cmpB = $("cmp-b");
  const COLS = ["ID", "class", "type"];

  function compare() {
    const a = cmpA.value.trim(), b = cmpB.value.trim();
    const verdict = $("verdict");
    const tbody = document.querySelector("#cmp-table tbody");
    verdict.classList.remove("is-error");
    cmpA.toggleAttribute("aria-invalid", !!a && !isValidSelector(a));
    cmpB.toggleAttribute("aria-invalid", !!b && !isValidSelector(b));
    if (cmpA.hasAttribute("aria-invalid")) cmpA.setAttribute("aria-invalid", "true");
    if (cmpB.hasAttribute("aria-invalid")) cmpB.setAttribute("aria-invalid", "true");

    const bad = [!a || !isValidSelector(a) ? "A" : null, !b || !isValidSelector(b) ? "B" : null].filter(Boolean);
    if (bad.length) {
      tbody.innerHTML = "";
      verdict.classList.add("is-error");
      verdict.textContent = `Selector ${bad.join(" and ")} ${bad.length > 1 ? "are" : "is"} empty or not valid CSS yet.`;
      return;
    }

    const sa = maxSpec(a), sb = maxSpec(b);
    let d = -1;
    for (let k = 0; k < 3; k++) if (sa[k] !== sb[k]) { d = k; break; }
    const winner = d < 0 ? null : (sa[d] > sb[d] ? "A" : "B");

    const row = (name, sel, s) => `<tr><td>${name}: ${esc(sel)}</td>${[0, 1, 2].map(k => {
      const cls = [];
      if (k === d) { cls.push("decide"); if (winner === name) cls.push("win"); }
      else if (d >= 0 && k > d) cls.push("skip");
      return `<td class="${cls.join(" ")}">${s[k]}</td>`;
    }).join("")}</tr>`;
    tbody.innerHTML = row("A", a, sa) + row("B", b, sb);

    let msg;
    if (d < 0) {
      msg = `<strong>Tie at ${fmt(sa)}.</strong> Specificity can't decide, so source order does: the rule written later wins.`;
    } else {
      const ties = [];
      for (let k = 0; k < d; k++) ties.push(`${COLS[k]} columns tie at ${sa[k]}`);
      msg = (ties.length ? ties.join(", ") + ". " : "") +
        `The <strong>${COLS[d]}</strong> column decides, ${sa[d]} vs ${sb[d]}, so <strong>${winner}</strong> wins.` +
        (d < 2 ? " Columns to its right are never checked." : "");
    }
    let note;
    try {
      const setA = new Set(doc.querySelectorAll(a));
      const overlap = [...doc.querySelectorAll(b)].filter(n => setA.has(n)).length;
      note = a === b ? "Same selector on both sides."
        : overlap ? `Both match ${overlap} of the same element${overlap === 1 ? "" : "s"} in the explorer's tree, so they really compete there.`
        : "In the explorer's tree these selectors match different elements, so they never actually compete.";
    } catch (e) { note = ""; }
    if (splitList(a).length > 1 || splitList(b).length > 1) note += " Selector lists are scored per selector; this uses the highest.";
    verdict.innerHTML = `${msg}<small>${note}</small>`;
  }
  cmpA.addEventListener("input", compare);
  cmpB.addEventListener("input", compare);

  /* ================= Build ================= */
  const source = $("source");
  const sourceStatus = $("source-status");

  function build(html) {
    doc = new DOMParser().parseFromString(html, "text/html");
    nodeMap = new Map();
    majors = [];
    tree.textContent = "";
    tree.appendChild(render(doc));
    majors.forEach(li => {
      const n = li.domNode;
      if (n.nodeName === "HEAD" || isTopLevel(n)) setOpen(li, false);
    });
    const first = tree.querySelector(".pick");
    if (first) first.tabIndex = 0;
    select(doc.querySelector(".note p") || doc.body || doc, { reveal: true });
    if (selInput.value.trim()) runSelector();
    compare();
  }

  source.value = SAMPLE;
  $("rebuild").addEventListener("click", () => {
    build(source.value);
    sourceStatus.textContent = `Rebuilt: ${doc.querySelectorAll("*").length} elements.`;
  });
  $("reset").addEventListener("click", () => {
    source.value = SAMPLE;
    build(SAMPLE);
    sourceStatus.textContent = "Sample restored.";
  });

  build(SAMPLE);
  treeScroll.scrollTop = 0;
})();
