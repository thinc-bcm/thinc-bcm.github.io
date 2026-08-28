/* ============================================================
   Computational Biology at THINC — site behaviour
   1. research areas (they double as clusters in the hero embedding)
   2. hero latent-space canvas
   3. team loader: reads team/index.json + one Markdown file per person
   ============================================================ */

(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var darkMQ = window.matchMedia("(prefers-color-scheme: dark)");

  /* ---------------------------------------------------------
     1. Research areas — `key` is what team files refer to in
        their `topics:` line, so hovering a person lights up
        the matching cluster.
     --------------------------------------------------------- */
  // Each area's colour lives in styles.css as --c-<key>, defined once per theme.
  // Swatches reference it directly; the canvas reads it back once per frame.
  var AREAS = [
    { key: "rna-processing",
      title: "RNA processing",
      desc: "How transcripts get cut, joined and mis-joined. Splicing fidelity, unannotated junctions and processing defects — read as disease mechanism rather than as noise." },
    { key: "drug-discovery",
      title: "Drug discovery",
      desc: "Targets and biomarkers mined out of genome-scale resources — dependency screens, perturbation atlases, expression reversal — and ranked by what would survive the jump to a patient." },
    { key: "translational",
      title: "Translational data science",
      desc: "Team science, deliberately. We are the analytical partner to translational and clinical investigators — their molecular data, our analysis, from study design through to the paper." }
  ];

  var focus = -1;                 // index of the cluster currently highlighted
  var areaNodes = [];

  var areasEl = document.getElementById("areas");
  AREAS.forEach(function (a, i) {
    var d = document.createElement("div");
    d.className = "area";
    var sw = document.createElement("span");
    sw.className = "swatch";
    sw.style.background = "var(--c-" + a.key + ")";
    var body = document.createElement("div");
    var h3 = document.createElement("h3");
    h3.textContent = a.title;
    var p = document.createElement("p");
    p.textContent = a.desc;
    body.appendChild(h3); body.appendChild(p);
    d.appendChild(sw); d.appendChild(body);
    d.addEventListener("mouseenter", function () { setFocus(i); });
    d.addEventListener("mouseleave", function () { setFocus(-1); });
    areasEl.appendChild(d);
    areaNodes.push(d);
  });

  function setFocus(i) {
    focus = i;
    areaNodes.forEach(function (n, j) { n.classList.toggle("lit", j === i && j >= 0); });
  }

  /* ---------------------------------------------------------
     2. Hero embedding
     --------------------------------------------------------- */
  var cv = document.getElementById("cv");
  var ctx = cv.getContext("2d");
  var W = 0, H = 0, pts = [], t = 0, running = false;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);

  // cluster centroids in normalised [0,1] space, one per research area
  var CENTROIDS = [[0.14, 0.31], [0.47, 0.73], [0.81, 0.26]];

  function build() {
    pts = [];
    var small = window.innerWidth < 760;
    CENTROIDS.forEach(function (c, ci) {
      var n = 190 * (small ? 0.55 : 1);
      var spread = 0.105;
      for (var i = 0; i < n; i++) {
        var r = Math.pow(Math.random(), 0.62) * spread;
        var th = Math.random() * Math.PI * 2;
        pts.push({
          bx: c[0] + Math.cos(th) * r * 0.95,
          by: c[1] + Math.sin(th) * r * 1.2,
          c: ci,
          ph: Math.random() * Math.PI * 2,
          sp: 0.25 + Math.random() * 0.45,
          rr: 1 + Math.random() * 1.5
        });
      }
    });
    // a thin scatter of unassigned points, so it reads as data and not decoration
    var noise = small ? 48 : 95;
    for (var k = 0; k < noise; k++) {
      pts.push({ bx: Math.random(), by: Math.random(), c: -1,
                 ph: Math.random() * Math.PI * 2, sp: 0.2, rr: 0.9 });
    }
  }

  function size() {
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // one getComputedStyle per frame rather than one per point
  function palette() {
    var s = getComputedStyle(document.documentElement);
    var cols = AREAS.map(function (a) {
      return s.getPropertyValue("--c-" + a.key).trim() || "#3b3bd6";
    });
    cols.grey = s.getPropertyValue("--neutral-pt").trim() || "#c9c8c1";
    return cols;
  }

  function paint() {
    var cols = palette();
    var grey = cols.grey;
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < pts.length; i++) {
      var p = pts[i];
      var x = (p.bx + Math.sin(t * p.sp * 2 + p.ph) * 0.006) * W;
      var y = (p.by + Math.cos(t * p.sp * 2.3 + p.ph) * 0.006) * H;
      var col, alpha, r = p.rr;
      if (p.c < 0) { col = grey; alpha = focus >= 0 ? 0.16 : 0.42; }
      else if (focus < 0) { col = cols[p.c]; alpha = 0.20; }
      else if (focus === p.c) { col = cols[p.c]; alpha = 0.75; r = p.rr * 1.3; }
      else { col = grey; alpha = 0.13; }
      ctx.globalAlpha = alpha;
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function loop() {
    if (!running) return;
    t += 0.0045;
    paint();
    requestAnimationFrame(loop);
  }

  build(); size(); paint();

  if (!reduceMotion) {
    running = true;
    requestAnimationFrame(loop);
    // stop burning frames once the hero has scrolled away
    var heroObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting && !running) { running = true; requestAnimationFrame(loop); }
        else if (!e.isIntersecting) { running = false; }
      });
    }, { threshold: 0 });
    heroObs.observe(cv);
  }

  var resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { build(); size(); paint(); }, 150);
  });

  // swatches follow CSS on their own; the canvas is a bitmap, so it needs a nudge
  // (only matters under reduced motion, where nothing is repainting continuously)
  darkMQ.addEventListener("change", function () { paint(); });

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  /* ---------------------------------------------------------
     3. Papers — hand-picked list in papers.json, in a
        deliberate order (not sorted, not a feed)
     --------------------------------------------------------- */
  var OUR_AUTHOR = "Simon LM";   // always kept visible in an elided author list
  var SHOW_ALL_UP_TO = 5;        // shorter lists print in full

  // Authorship symbols, in the order they appear in the legend. A paper's
  // "mark" is any combination of these, e.g. "*+" for both.
  var MARKS = [
    { sym: "*", label: "co-first author" },
    { sym: "+", label: "corresponding author" },
    { sym: "†", label: "co-corresponding author" }
  ];

  // Author lists run to 30+ names. Print the first three, and never elide
  // away either our own name or the senior author.
  function authorParts(list) {
    var n = list.length, keep = [], i;
    if (n <= SHOW_ALL_UP_TO) {
      for (i = 0; i < n; i++) keep.push(i);
    } else {
      keep = [0, 1, 2];
      var mine = list.indexOf(OUR_AUTHOR);
      if (mine > 2 && mine < n - 1) keep.push(mine);
      keep.push(n - 1);
    }
    var out = [], prev = -1;
    keep.forEach(function (idx) {
      if (prev >= 0 && idx > prev + 1) out.push({ gap: true });
      out.push({ name: list[idx], strong: list[idx] === OUR_AUTHOR });
      prev = idx;
    });
    return out;
  }

  function renderPapers(papers) {
    var box = document.getElementById("papers-list");
    box.innerHTML = "";
    papers.forEach(function (p) {
      var row = document.createElement("article");
      row.className = "paper";

      var t = document.createElement("h3");
      t.className = "t";
      var link = document.createElement("a");
      link.href = "https://doi.org/" + p.doi;
      link.target = "_blank"; link.rel = "noreferrer";
      link.textContent = p.title;
      t.appendChild(link);

      var au = document.createElement("p");
      au.className = "au";
      authorParts(p.authors).forEach(function (part, i, arr) {
        if (part.gap) { au.appendChild(document.createTextNode(" … ")); return; }
        var el = part.strong ? document.createElement("strong") : document.createElement("span");
        el.textContent = part.name;
        au.appendChild(el);
        // symbol rides on the name, as it would in the paper itself
        if (part.strong && p.mark) {
          var sup = document.createElement("sup");
          sup.className = "mk";
          sup.textContent = p.mark;
          au.appendChild(sup);
        }
        var next = arr[i + 1];
        if (next && !next.gap) au.appendChild(document.createTextNode(", "));
      });

      var vn = document.createElement("p");
      vn.className = "vn";
      var j = document.createElement("span");
      j.className = "j"; j.textContent = p.venue;
      var sep = document.createElement("span");
      sep.className = "sep"; sep.textContent = "·";
      var y = document.createElement("span");
      y.textContent = p.year;
      vn.appendChild(j); vn.appendChild(sep); vn.appendChild(y);

      row.appendChild(t); row.appendChild(au); row.appendChild(vn);
      box.appendChild(row);
    });

    // legend, listing only the symbols actually used above
    var used = MARKS.filter(function (m) {
      return papers.some(function (p) { return (p.mark || "").indexOf(m.sym) >= 0; });
    });
    if (used.length) {
      var legend = document.createElement("p");
      legend.className = "legend";
      used.forEach(function (m) {
        var item = document.createElement("span");
        var s = document.createElement("b");
        s.textContent = m.sym;
        item.appendChild(s);
        item.appendChild(document.createTextNode(" " + m.label));
        legend.appendChild(item);
      });
      box.appendChild(legend);
    }
  }

  fetch("papers.json", { cache: "no-cache" })
    .then(function (r) { if (!r.ok) throw new Error("papers.json " + r.status); return r.json(); })
    .then(renderPapers)
    .catch(function (err) {
      console.error(err);
      document.getElementById("papers-list").innerHTML =
        '<p class="loading">Papers could not be loaded. If you opened this file directly, ' +
        'serve the folder instead: python -m http.server 8000</p>';
    });

  /* ---------------------------------------------------------
     4. Team — one Markdown file per person
     --------------------------------------------------------- */

  // Deliberately tiny: paragraphs, links, bold, italic, inline code.
  // Bios are short. Anything more and we would be shipping a Markdown library.
  function inline(s) {
    return esc(s)
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
               '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
  }

  function parsePerson(text) {
    var meta = {}, body = text;
    var fm = /^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?/.exec(text);
    if (fm) {
      fm[1].split(/\r?\n/).forEach(function (line) {
        var m = /^([A-Za-z_-]+)\s*:\s*(.*)$/.exec(line.trim());
        if (m) meta[m[1].toLowerCase()] = m[2].trim();
      });
      body = text.slice(fm[0].length);
    }
    meta.topics = (meta.topics || "").split(",")
      .map(function (s) { return s.trim(); }).filter(Boolean);
    meta.bodyHtml = body.trim().split(/\r?\n\s*\r?\n/)
      .map(function (par) { return "<p>" + inline(par.replace(/\s*\r?\n\s*/g, " ").trim()) + "</p>"; })
      .join("");
    return meta;
  }

  function topicLabel(key) {
    for (var i = 0; i < AREAS.length; i++) if (AREAS[i].key === key) return AREAS[i].title;
    return key;
  }
  function topicIndex(key) {
    for (var i = 0; i < AREAS.length; i++) if (AREAS[i].key === key) return i;
    return -1;
  }

  function renderPeople(people) {
    var box = document.getElementById("people");
    box.innerHTML = "";
    people.forEach(function (p) {
      var card = document.createElement("div");
      card.className = "pc";

      var who = document.createElement("div");
      who.className = "who";
      var nm = document.createElement("span"); nm.className = "nm"; nm.textContent = p.name || "";
      var rl = document.createElement("span"); rl.className = "rl"; rl.textContent = p.role || "";
      who.appendChild(nm); who.appendChild(rl);
      if (p.github) {
        var a = document.createElement("a");
        a.className = "hd";
        a.href = "https://github.com/" + p.github;
        a.target = "_blank"; a.rel = "noreferrer";
        a.textContent = "@" + p.github;
        who.appendChild(a);
      }

      var right = document.createElement("div");
      var bio = document.createElement("div");
      bio.className = "bio";
      bio.innerHTML = p.bodyHtml;
      right.appendChild(bio);

      if (p.topics.length) {
        var tg = document.createElement("div");
        tg.className = "tg";
        p.topics.forEach(function (k) {
          var s = document.createElement("span");
          s.textContent = topicLabel(k);
          tg.appendChild(s);
        });
        right.appendChild(tg);
      }

      // hovering a person lights up the cluster they work in
      var firstTopic = -1;
      for (var i = 0; i < p.topics.length && firstTopic < 0; i++) firstTopic = topicIndex(p.topics[i]);
      if (firstTopic >= 0) {
        card.addEventListener("mouseenter", function () { setFocus(firstTopic); });
        card.addEventListener("mouseleave", function () { setFocus(-1); });
      }

      card.appendChild(who); card.appendChild(right);
      box.appendChild(card);
    });
  }

  function teamError(msg) {
    var box = document.getElementById("people");
    box.innerHTML = '<p class="loading">' + esc(msg) + "</p>";
  }

  fetch("team/index.json", { cache: "no-cache" })
    .then(function (r) { if (!r.ok) throw new Error("index.json " + r.status); return r.json(); })
    .then(function (files) {
      return Promise.all(files.map(function (f) {
        return fetch("team/" + f, { cache: "no-cache" })
          .then(function (r) { if (!r.ok) throw new Error(f + " " + r.status); return r.text(); })
          .then(parsePerson);
      }));
    })
    .then(renderPeople)
    .catch(function (err) {
      console.error(err);
      teamError("Team bios could not be loaded. If you opened this file directly, serve the folder instead: python -m http.server 8000");
    });

  /* ---------------------------------------------------------
     misc
     --------------------------------------------------------- */
  document.getElementById("yr").textContent = new Date().getFullYear();

  document.querySelectorAll("section").forEach(function (s) { s.classList.add("reveal"); });
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("on"); io.unobserve(e.target); } });
  }, { threshold: 0.08 });
  document.querySelectorAll(".reveal").forEach(function (e) { io.observe(e); });
})();
