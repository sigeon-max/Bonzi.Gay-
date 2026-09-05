(function () {

    /* ══════════════════════════════════════════════════════════════
       SHARED AUDIO
    ══════════════════════════════════════════════════════════════ */
    var tsunamiAlarm = null;
    var eewChime     = null;

    function playTsunamiAlarm() {
        try {
            if (!tsunamiAlarm) tsunamiAlarm = new Audio("./audio/tsunami.wav");
            tsunamiAlarm.currentTime = 0;
            tsunamiAlarm.play().catch(function(){});
        } catch(e) {}
    }

    function stopTsunamiAlarm() {
        try { if (tsunamiAlarm) { tsunamiAlarm.pause(); tsunamiAlarm.currentTime = 0; } } catch(e) {}
    }

    function playChime() {
        try {
            if (!eewChime) eewChime = new Audio("./audio/nhkchime.wav");
            eewChime.currentTime = 0;
            eewChime.play().catch(function(){});
        } catch(e) {}
    }

    /* ══════════════════════════════════════════════════════════════
       EARTHQUAKE SCREEN SHAKE
    ══════════════════════════════════════════════════════════════ */
    (function injectShakeCSS() {
        var s = document.createElement("style");
        s.textContent = [
            '@keyframes eq_shake {',
            '  0%,100%{ transform:translate(0,0) rotate(0deg) }',
            '  8%  { transform:translate(-7px,-5px) rotate(-.4deg) }',
            '  16% { transform:translate(8px, 6px) rotate( .5deg) }',
            '  24% { transform:translate(-9px, 4px) rotate(-.3deg) }',
            '  32% { transform:translate( 7px,-7px) rotate( .4deg) }',
            '  40% { transform:translate(-6px, 8px) rotate(-.5deg) }',
            '  48% { transform:translate( 9px,-4px) rotate( .3deg) }',
            '  56% { transform:translate(-5px, 6px) rotate(-.4deg) }',
            '  64% { transform:translate( 7px,-5px) rotate( .2deg) }',
            '  72% { transform:translate(-8px, 4px) rotate(-.3deg) }',
            '  80% { transform:translate( 5px,-6px) rotate( .4deg) }',
            '  90% { transform:translate(-4px, 3px) rotate(-.2deg) }',
            '}',
            '.eq_shaking { animation: eq_shake 0.12s ease-in-out infinite; }'
        ].join('\n');
        document.head.appendChild(s);
    })();

    var shakeTimer = null;
    function shakeScreen(ms) {
        clearTimeout(shakeTimer);
        document.body.classList.add('eq_shaking');
        shakeTimer = setTimeout(function () {
            document.body.classList.remove('eq_shaking');
        }, ms || 2500);
    }

    /* ══════════════════════════════════════════════════════════════
       FLOOD ANNOUNCEMENT BANNER  (top of screen, not full-screen)
    ══════════════════════════════════════════════════════════════ */
    function buildAnnouncementBanner() {
        if (document.getElementById("flood_announce")) return;

        var style = document.createElement("style");
        style.textContent = [
            '#flood_announce {',
            '  position:fixed; top:0; left:0; width:100%; z-index:99995;',
            '  display:none; font-family:"Arial Black",Arial,sans-serif;',
            '  animation: flood_flash 0.4s steps(1) infinite;',
            '}',
            '@keyframes flood_flash {',
            '  0%,100% { background:#b20000; }',
            '  50%     { background:#ff4000; }',
            '}',
            '#flood_announce_inner {',
            '  padding:12px 20px 8px;',
            '  color:#fff; text-shadow:1px 1px 3px #000;',
            '}',
            '#flood_announce_header {',
            '  display:flex; align-items:center; gap:10px;',
            '  border-bottom:2px solid rgba(255,255,255,.35);',
            '  padding-bottom:5px; margin-bottom:7px;',
            '}',
            '#flood_announce_icon {',
            '  font-size:30px;',
            '  animation:flood_icon_blink 0.4s steps(1) infinite;',
            '}',
            '@keyframes flood_icon_blink { 0%,100%{opacity:1} 50%{opacity:0} }',
            '#flood_announce_title { font-size:24px; font-weight:900; letter-spacing:3px; }',
            '#flood_announce_title_jp { font-size:14px; opacity:.85; letter-spacing:2px; }',
            '#flood_announce_body { font-size:15px; font-weight:700; letter-spacing:1px; }',
            '#flood_announce_count {',
            '  font-size:32px; font-weight:900; letter-spacing:4px;',
            '  color:#ffe680; text-shadow:0 0 12px #ff8000, 1px 1px 3px #000;',
            '}',
            '#flood_announce_bar {',
            '  height:4px; background:rgba(255,255,255,.2);',
            '  margin-top:8px; border-radius:2px; overflow:hidden;',
            '}',
            '#flood_announce_bar_fill {',
            '  height:100%; width:100%; background:#ffe680;',
            '  transition:width linear;',
            '}'
        ].join('\n');
        document.head.appendChild(style);

        var el = document.createElement("div");
        el.id = "flood_announce";
        el.innerHTML = [
            '<div id="flood_announce_inner">',
            '  <div id="flood_announce_header">',
            '    <span id="flood_announce_icon">🌊</span>',
            '    <div>',
            '      <div id="flood_announce_title">FLOOD WARNING</div>',
            '      <div id="flood_announce_title_jp">洪水警報 ｜ サーバー接続急増</div>',
            '    </div>',
            '  </div>',
            '  <div id="flood_announce_body">',
            '    <div id="flood_announce_count"></div>',
            '  </div>',
            '  <div id="flood_announce_bar"><div id="flood_announce_bar_fill"></div></div>',
            '</div>'
        ].join('');
        document.body.appendChild(el);
    }

    function showAnnouncementBanner(count, durationMs) {
        buildAnnouncementBanner();
        var el = document.getElementById("flood_announce");
        document.getElementById("flood_announce_count").textContent =
            count + " CONNECTIONS DETECTED — FLOOD INCOMING";
        el.style.display = "block";

        var fill = document.getElementById("flood_announce_bar_fill");
        fill.style.transition = "none"; fill.style.width = "100%";
        requestAnimationFrame(function () { requestAnimationFrame(function () {
            fill.style.transition = "width " + (durationMs / 1000) + "s linear";
            fill.style.width = "0%";
        }); });
    }

    function hideAnnouncementBanner() {
        var el = document.getElementById("flood_announce");
        if (el) el.style.display = "none";
    }

    /* ══════════════════════════════════════════════════════════════
       JAPAN FLOOD WARNING PANEL  (bottom-right corner, not fullscreen)
       Styled after NHK tsunami warning map screen
    ══════════════════════════════════════════════════════════════ */
    function buildFloodPanel() {
        if (document.getElementById("flood_panel")) return;

        var style = document.createElement("style");
        style.textContent = [
            '#flood_panel {',
            '  position:fixed; bottom:12px; right:12px; z-index:99994;',
            '  width:340px; background:#1255a0; border:3px solid #fff;',
            '  box-shadow:0 0 24px rgba(0,0,0,.7);',
            '  display:none; flex-direction:column;',
            '  font-family:Arial,sans-serif; font-size:12px;',
            '  animation: flood_panel_in .3s ease;',
            '}',
            '@keyframes flood_panel_in {',
            '  from { opacity:0; transform:translateY(30px); }',
            '  to   { opacity:1; transform:translateY(0); }',
            '}',
            '#flood_panel_header {',
            '  background:#003580; padding:5px 10px;',
            '  display:flex; align-items:center; justify-content:space-between;',
            '  border-bottom:2px solid #fff;',
            '}',
            '#flood_panel_nhk {',
            '  font-weight:900; font-size:13px; letter-spacing:1px;',
            '  border:2px solid #fff; padding:1px 6px; color:#fff;',
            '}',
            '#flood_panel_hdr_right { color:#cce; font-size:11px; letter-spacing:1px; }',
            '#flood_panel_badge_row {',
            '  display:flex; align-items:center;',
            '  background:#cc0000; padding:4px 10px; gap:8px;',
            '  animation: flood_badge_flash .8s steps(1) infinite;',
            '}',
            '@keyframes flood_badge_flash {',
            '  0%,100%{background:#cc0000} 50%{background:#ff3300}',
            '}',
            '#flood_panel_badge_text {',
            '  color:#fff; font-weight:900; font-size:13px;',
            '  letter-spacing:2px; text-shadow:1px 1px 2px #000;',
            '}',
            '#flood_panel_conn {',
            '  color:#ffe680; font-weight:900; font-size:13px;',
            '  margin-left:auto; letter-spacing:1px;',
            '}',
            '#flood_panel_map_wrap {',
            '  position:relative; background:#1255a0; padding:6px 8px 4px;',
            '  display:flex; gap:6px; align-items:flex-start;',
            '}',
            '#flood_panel_svg { flex:1; max-width:190px; }',
            '#flood_panel_legend {',
            '  background:rgba(0,30,80,.7); border:1px solid #4488cc;',
            '  padding:6px 8px; font-size:11px; color:#fff;',
            '  min-width:112px;',
            '}',
            '#flood_panel_legend_title {',
            '  font-size:12px; font-weight:700; letter-spacing:1px;',
            '  margin-bottom:5px; color:#cce;',
            '}',
            '.fp_legend_row { display:flex; align-items:center; gap:5px; margin-bottom:3px; }',
            '.fp_legend_swatch { width:16px; height:10px; border:1px solid rgba(255,255,255,.5); flex-shrink:0; }',
            '.fp_legend_label { font-size:10px; color:#ddeeff; }',
            '#flood_panel_label_ok { color:#8fc; font-size:10px; }',
            '#flood_panel_label_ok { color:#8fc; font-size:10px; }',
            '#flood_panel_footer {',
            '  background:#001840; padding:4px 10px;',
            '  color:#99bbdd; font-size:10px;',
            '  display:flex; justify-content:space-between;',
            '  border-top:1px solid #3366aa;',
            '}',
            '#flood_panel_timer { color:#fff; font-weight:700; }'
        ].join('\n');
        document.head.appendChild(style);

        /* Japan SVG map — simplified but recognisable */
        var japanSVG = [
            '<svg id="flood_panel_svg" viewBox="0 0 200 280" xmlns="http://www.w3.org/2000/svg">',
            /* ocean */
            '<rect width="200" height="280" fill="#1255a0"/>',
            /* Hokkaido */
            '<polygon fill="#3a9644" points="',
            '  133,8 155,10 178,18 192,32 188,50 ',
            '  170,60 147,64 124,57 112,43 115,25',
            '"/>',
            /* Honshu (green body) */
            '<polygon fill="#3a9644" points="',
            '  118,62 142,58 165,70 180,92 184,118 ',
            '  180,148 172,172 158,190 140,200 ',
            '  118,202 100,192 85,172 76,148 ',
            '  74,120 80,94 93,74',
            '"/>',
            /* Honshu east coast warning overlay (red) */
            '<polygon fill="#cc0000" opacity=".72" points="',
            '  165,70 180,92 184,118 180,148 172,172 158,190 ',
            '  152,185 162,165 168,140 168,112 158,86 146,72',
            '"/>',
            /* Honshu east coast — 大津波警報 stripe (white) */
            '<polyline fill="none" stroke="#fff" stroke-width="2.5" opacity=".7" points="',
            '  165,70 180,92 184,118 180,148 172,172 158,190',
            '"/>',
            /* Shikoku */
            '<ellipse fill="#3a9644" cx="114" cy="215" rx="23" ry="10"/>',
            /* Kyushu */
            '<polygon fill="#3a9644" points="',
            '  73,180 90,174 110,178 120,194 ',
            '  116,214 100,224 80,224 64,212 60,196 66,182',
            '"/>',
            /* Okinawa dots */
            '<ellipse fill="#3a9644" cx="32" cy="260" rx="7" ry="4"/>',
            '<ellipse fill="#3a9644" cx="20" cy="270" rx="5" ry="3"/>',
            /* Labels */
            '<text x="30" y="248" fill="#ddeeff" font-size="9" font-family="Arial">沖縄</text>',
            '<text x="155" y="255" fill="#ddeeff" font-size="8" font-family="Arial">小笠原</text>',
            '<circle cx="164" cy="248" r="2.5" fill="#3a9644" opacity=".7"/>',
            '<circle cx="170" cy="260" r="2" fill="#3a9644" opacity=".7"/>',
            '</svg>'
        ].join('');

        var el = document.createElement("div");
        el.id = "flood_panel";
        el.innerHTML = [
            '<div id="flood_panel_header">',
            '  <span id="flood_panel_nhk">NHK WORLD</span>',
            '  <span id="flood_panel_hdr_right">SERVER FLOOD PREDICTION</span>',
            '</div>',
            '<div id="flood_panel_badge_row">',
            '  <span id="flood_panel_badge_text">⚠ 津波警報 FLOOD WARNING</span>',
            '  <span id="flood_panel_conn"></span>',
            '</div>',
            '<div id="flood_panel_map_wrap">',
            japanSVG,
            '  <div id="flood_panel_legend">',
            '    <div id="flood_panel_legend_title">警報レベル</div>',
            '    <div class="fp_legend_row">',
            '      <div class="fp_legend_swatch" style="background:#fff;border-color:#cc0000;"></div>',
            '      <span class="fp_legend_label">大津波警報</span>',
            '    </div>',
            '    <div class="fp_legend_row">',
            '      <div class="fp_legend_swatch" style="background:#cc0000;"></div>',
            '      <span class="fp_legend_label">津波警報</span>',
            '    </div>',
            '    <div class="fp_legend_row">',
            '      <div class="fp_legend_swatch" style="background:#ffe600;border-color:#aa8800;"></div>',
            '      <span class="fp_legend_label">津波注意報</span>',
            '    </div>',
            '    <div class="fp_legend_row" style="margin-top:6px;">',
            '      <div class="fp_legend_swatch" style="background:#3a9644;"></div>',
            '      <span class="fp_legend_label">Safe Zone</span>',
            '    </div>',
            '  </div>',
            '</div>',
            '<div id="flood_panel_footer">',
            '  <span id="flood_panel_src">Source: Single IP</span>',
            '  <span id="flood_panel_timer"></span>',
            '</div>'
        ].join('');
        document.body.appendChild(el);
    }

    var floodPanelTimer = null;
    var floodPanelCountdown = null;

    function showFloodPanel(count, durationMs) {
        buildFloodPanel();
        clearTimeout(floodPanelTimer);
        clearInterval(floodPanelCountdown);

        document.getElementById("flood_panel_conn").textContent = count + " conn / 10s";

        var el = document.getElementById("flood_panel");
        el.style.display = "flex";

        var remaining = Math.round(durationMs / 1000);
        document.getElementById("flood_panel_timer").textContent = remaining + "s";
        floodPanelCountdown = setInterval(function () {
            remaining--;
            var t = document.getElementById("flood_panel_timer");
            if (t) t.textContent = remaining + "s";
            if (remaining <= 0) clearInterval(floodPanelCountdown);
        }, 1000);

        floodPanelTimer = setTimeout(hideFloodPanel, durationMs);
    }

    function hideFloodPanel() {
        clearInterval(floodPanelCountdown);
        var el = document.getElementById("flood_panel");
        if (el) el.style.display = "none";
    }

    /* ══════════════════════════════════════════════════════════════
       TTS ANNOUNCER
    ══════════════════════════════════════════════════════════════ */
    function speak(text, opts) {
        if (!window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        var u = new SpeechSynthesisUtterance(text);
        u.rate   = (opts && opts.rate)   || 0.92;
        u.pitch  = (opts && opts.pitch)  || 1.0;
        u.volume = (opts && opts.volume) || 1.0;
        /* prefer a US English voice if available */
        var voices = window.speechSynthesis.getVoices();
        var pick = voices.find(function(v) { return /en[-_]US/i.test(v.lang); })
                || voices.find(function(v) { return /en/i.test(v.lang); });
        if (pick) u.voice = pick;
        window.speechSynthesis.speak(u);
    }

    /* ══════════════════════════════════════════════════════════════
       FLOOD EVENT SEQUENCE
       t=0:     earthquake shake + tsunami siren
       t=600:   announcement banner appears
       t=3800:  siren plays again
       t=4200:  announcement banner hides
       t=4500:  Japan warning panel slides in
       t=16500: panel hides
    ══════════════════════════════════════════════════════════════ */
    var floodSequenceTimers = [];

    function clearFloodSequence() {
        floodSequenceTimers.forEach(clearTimeout);
        floodSequenceTimers = [];
        hideAnnouncementBanner();
        hideFloodPanel();
        document.body.classList.remove('eq_shaking');
        clearTimeout(shakeTimer);
    }

    function startFloodSequence(data) {
        clearFloodSequence();

        var count = (data && data.count) ? data.count : "??";

        /* t=0: shake + first siren */
        shakeScreen(2600);
        playTsunamiAlarm();

        /* t=600: show announcement banner + TTS */
        floodSequenceTimers.push(setTimeout(function () {
            showAnnouncementBanner(count, 3200);
            speak("Attention. Flood warning. " + count + " connections detected. A flood is incoming.");
        }, 600));

        /* t=3800: second siren blast */
        floodSequenceTimers.push(setTimeout(function () {
            playTsunamiAlarm();
        }, 3800));

        /* t=4200: hide announcement */
        floodSequenceTimers.push(setTimeout(function () {
            hideAnnouncementBanner();
        }, 4200));

        /* t=4600: Japan panel slides in */
        floodSequenceTimers.push(setTimeout(function () {
            showFloodPanel(count, 14000);
        }, 4600));
    }

    /* ══════════════════════════════════════════════════════════════
       TSUNAMI WARNING  (≥15 connections)
       Full-screen NHK overlay — with earthquake shake at the start
    ══════════════════════════════════════════════════════════════ */
    function buildTsunami() {
        if (document.getElementById("tsun_overlay")) return;

        var style = document.createElement("style");
        style.textContent = [
            '#tsun_overlay {',
            '  position:fixed; inset:0; z-index:99999; display:none;',
            '  background:#0a0a14; color:#fff;',
            '  font-family: Arial, sans-serif;',
            '  flex-direction:column;',
            '}',
            '#tsun_nhk {',
            '  background:#003580; padding:6px 14px;',
            '  display:flex; align-items:center; gap:10px;',
            '  border-bottom:3px solid #fff;',
            '}',
            '#tsun_nhk_logo {',
            '  font-weight:900; font-size:16px; letter-spacing:1px;',
            '  border:2px solid #fff; padding:2px 7px; color:#fff;',
            '}',
            '#tsun_nhk_sub { font-size:12px; opacity:.8; letter-spacing:2px; }',
            '#tsun_title_row {',
            '  background:#111; padding:8px 14px 6px;',
            '  font-size:22px; font-weight:700; letter-spacing:1px;',
            '  border-bottom:2px solid #444;',
            '}',
            '#tsun_badge_row {',
            '  display:flex; align-items:stretch;',
            '  background:#1a1a2e; border-bottom:2px solid #333;',
            '}',
            '#tsun_badge {',
            '  background:#cc0000; color:#fff;',
            '  font-weight:900; font-size:15px; padding:6px 14px;',
            '  white-space:nowrap; display:flex; align-items:center;',
            '  animation:tsun_badge_flash .8s steps(1) infinite;',
            '}',
            '@keyframes tsun_badge_flash {',
            '  0%,100%{background:#cc0000} 50%{background:#ff4400}',
            '}',
            '#tsun_marquee_wrap {',
            '  overflow:hidden; flex:1; display:flex; align-items:center;',
            '  background:#cc0000;',
            '}',
            '#tsun_marquee {',
            '  white-space:nowrap; font-size:18px; font-weight:900;',
            '  color:#fff; letter-spacing:3px;',
            '  animation:tsun_scroll 8s linear infinite;',
            '  padding-left:100%;',
            '}',
            '@keyframes tsun_scroll {',
            '  0%{transform:translateX(0)} 100%{transform:translateX(-200%)}',
            '}',
            '#tsun_table_wrap {',
            '  flex:1; overflow-y:auto; padding:10px 14px;',
            '}',
            '.tsun_table {',
            '  width:100%; border-collapse:collapse; font-size:14px;',
            '}',
            '.tsun_table th {',
            '  background:#222; color:#aaa; font-weight:normal;',
            '  text-align:left; padding:5px 10px;',
            '  border-bottom:1px solid #444;',
            '}',
            '.tsun_table td {',
            '  padding:7px 10px; border-bottom:1px solid #333;',
            '  vertical-align:middle;',
            '}',
            '.tsun_loc_main { font-weight:700; font-size:15px; }',
            '.tsun_loc_sub  { font-size:11px; color:#aaa; }',
            '.tsun_time     { font-size:15px; font-weight:700; color:#fff; white-space:nowrap; }',
            '.tsun_level {',
            '  background:#cc0000; color:#fff;',
            '  font-weight:900; font-size:17px;',
            '  padding:4px 12px; border-radius:3px; text-align:center;',
            '  display:inline-block; min-width:56px;',
            '  animation:tsun_badge_flash .8s steps(1) infinite;',
            '}',
            '#tsun_bottom {',
            '  background:#111; border-top:2px solid #333;',
            '  padding:5px 14px; font-size:11px; color:#888;',
            '  display:flex; justify-content:space-between; align-items:center;',
            '}',
            '#tsun_countdown { color:#fff; font-weight:700; font-size:13px; }',
            '#tsun_bar_wrap  { height:4px; background:#333; flex:1; margin:0 12px; border-radius:2px; overflow:hidden; }',
            '#tsun_bar_fill  { height:100%; width:100%; background:#cc0000; transition:width linear; }'
        ].join('\n');
        document.head.appendChild(style);

        var el = document.createElement("div");
        el.id = "tsun_overlay";
        el.innerHTML = [
            '<div id="tsun_nhk">',
            '  <span id="tsun_nhk_logo">NHK WORLD</span>',
            '  <span id="tsun_nhk_sub">SERVER MONITOR · JAPAN</span>',
            '</div>',
            '<div id="tsun_title_row">Server Flood Predictions</div>',
            '<div id="tsun_badge_row">',
            '  <div id="tsun_badge">⚠ Tsunami Warning</div>',
            '  <div id="tsun_marquee_wrap">',
            '    <div id="tsun_marquee">避難 ｜ つなみにげて！ ｜ 大規模フラッド検知 ｜ MAJOR FLOOD DETECTED ｜ 避難 ｜ つなみにげて！ ｜ 大規模フラッド検知 ｜ MAJOR FLOOD DETECTED ｜ </div>',
            '  </div>',
            '</div>',
            '<div id="tsun_table_wrap">',
            '  <table class="tsun_table">',
            '    <thead><tr>',
            '      <th>Source</th>',
            '      <th>Detected</th>',
            '      <th>Severity</th>',
            '    </tr></thead>',
            '    <tbody id="tsun_tbody"></tbody>',
            '  </table>',
            '</div>',
            '<div id="tsun_bottom">',
            '  <span id="tsun_detail"></span>',
            '  <div id="tsun_bar_wrap"><div id="tsun_bar_fill"></div></div>',
            '  <span id="tsun_countdown"></span>',
            '</div>'
        ].join('');
        document.body.appendChild(el);
    }

    var tsunamiActive          = false;
    var tsunamiTimeout         = null;
    var tsunamiCountdownInterval = null;

    function showTsunami(data) {
        buildTsunami();
        clearFloodSequence();

        if (tsunamiActive) {
            clearTimeout(tsunamiTimeout);
            clearInterval(tsunamiCountdownInterval);
        }
        tsunamiActive = true;

        /* earthquake first, then after 1s the full-screen overlay */
        shakeScreen(3000);

        setTimeout(function () {
            var count   = (data && data.count) ? data.count : "??";
            var now     = new Date();
            var timeStr = now.getHours() + ":" + ("0" + now.getMinutes()).slice(-2);
            var severity = count >= 30 ? "EXTREME" : count >= 20 ? "SEVERE" : "MAJOR";

            document.getElementById("tsun_tbody").innerHTML = [
                '<tr>',
                '  <td><div class="tsun_loc_main">SERVER NETWORK</div><div class="tsun_loc_sub">All Connections</div></td>',
                '  <td><div class="tsun_time">' + timeStr + '</div></td>',
                '  <td><span class="tsun_level">' + severity + '</span></td>',
                '</tr>',
                '<tr>',
                '  <td><div class="tsun_loc_main">FLOOD SOURCE</div><div class="tsun_loc_sub">Single IP</div></td>',
                '  <td><div class="tsun_time">' + timeStr + '</div></td>',
                '  <td><span class="tsun_level">' + count + ' conn</span></td>',
                '</tr>'
            ].join('');

            document.getElementById("tsun_detail").textContent =
                count + " connections from one source in 10 seconds";

            document.getElementById("tsun_overlay").style.display = "flex";

            speak("Tsunami warning. Major flood detected. " + count + " connections from a single source. All users, evacuate immediately.", { rate: 0.85, pitch: 0.9 });
            playTsunamiAlarm();
            startTsunamiBar(20000);

            var remaining = 20;
            document.getElementById("tsun_countdown").textContent = remaining + "s";
            tsunamiCountdownInterval = setInterval(function () {
                remaining--;
                var el = document.getElementById("tsun_countdown");
                if (el) el.textContent = remaining + "s";
                if (remaining <= 0) clearInterval(tsunamiCountdownInterval);
            }, 1000);

            tsunamiTimeout = setTimeout(hideTsunami, 20000);
        }, 1000);
    }

    function hideTsunami() {
        tsunamiActive = false;
        clearInterval(tsunamiCountdownInterval);
        var el = document.getElementById("tsun_overlay");
        if (el) el.style.display = "none";
        stopTsunamiAlarm();
    }

    function startTsunamiBar(ms) {
        var fill = document.getElementById("tsun_bar_fill");
        if (!fill) return;
        fill.style.transition = "none"; fill.style.width = "100%";
        requestAnimationFrame(function () { requestAnimationFrame(function () {
            fill.style.transition = "width " + (ms / 1000) + "s linear";
            fill.style.width = "0%";
        }); });
    }

    /* ══════════════════════════════════════════════════════════════
       WET EFFECT
    ══════════════════════════════════════════════════════════════ */
    var wetStyle = document.createElement("style");
    wetStyle.textContent = [
        '@keyframes wet_drip {',
        '  0%   { transform: translateY(-8px); opacity: 0; }',
        '  20%  { opacity: 1; }',
        '  100% { transform: translateY(60px); opacity: 0; }',
        '}',
        '@keyframes wet_fade_out {',
        '  0%   { opacity: 1; }',
        '  100% { opacity: 0; }',
        '}',
        '.bonzi_wet > canvas, .bonzi_wet .bonzi_placeholder {',
        '  filter: hue-rotate(170deg) saturate(1.6) brightness(0.75);',
        '  transition: filter 2s ease;',
        '}',
        '.bonzi_wet::before, .bonzi_wet::after {',
        '  content: "💧";',
        '  position: absolute;',
        '  top: 0; font-size: 14px;',
        '  animation: wet_drip 1.4s ease-in infinite;',
        '  pointer-events: none; z-index: 1000;',
        '}',
        '.bonzi_wet::before { left: 30%;  animation-delay: 0s; }',
        '.bonzi_wet::after  { left: 65%;  animation-delay: 0.6s; }',
        '.bonzi_drying > canvas, .bonzi_drying .bonzi_placeholder {',
        '  filter: none;',
        '  transition: filter 4s ease;',
        '}',
        '.bonzi_drying::before, .bonzi_drying::after {',
        '  animation: wet_fade_out 3s ease forwards;',
        '}'
    ].join('\n');
    document.head.appendChild(wetStyle);

    var wetTimeout = null;

    function makeWet() {
        clearTimeout(wetTimeout);
        $('.bonzi').removeClass('bonzi_drying').addClass('bonzi_wet');
        wetTimeout = setTimeout(function () {
            $('.bonzi_wet').addClass('bonzi_drying');
            setTimeout(function () {
                $('.bonzi').removeClass('bonzi_wet bonzi_drying');
            }, 4000);
        }, 60000);
    }

    /* ══════════════════════════════════════════════════════════════
       SOCKET LISTENERS
    ══════════════════════════════════════════════════════════════ */
    $(document).ready(function () {
        var patchInterval = setInterval(function () {
            if (!window.socket) return;
            clearInterval(patchInterval);

            window.socket.on("flood", function (data) {
                startFloodSequence(data);
                makeWet();
            });

            window.socket.on("tsunami", function (data) {
                showTsunami(data);
                makeWet();
            });
        }, 50);
    });

    /* apply wet class to any bonzi added during wet period */
    $(document).on('DOMNodeInserted', '.bonzi', function () {
        if ($('.bonzi_wet').length > 0) {
            $(this).addClass('bonzi_wet');
        }
    });

})();
