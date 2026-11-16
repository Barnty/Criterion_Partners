// Criterion Partners site generator.
// Run:  node src/build.js
// It writes plain .html files into the repo root. Those files are what gets served;
// there is no build step on the host. To add an article, drop a .md file into
// src/articles/ and run this again.
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const WA = 'https://wa.me/2348079851510';
const LINKEDIN = 'https://www.linkedin.com/company/criterion-partners-eb1a/';
const WA_TEXT = WA + '?text=' + encodeURIComponent("Hi Criterion Partners, I'd like an honest read on my EB-1A profile.");
const SITE = 'https://criterionpartners.net';

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const waIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 11.5a8.5 8.5 0 0 1-12.6 7.4L3 20l1.2-5A8.5 8.5 0 1 1 21 11.5z"/></svg>';
const waBtn = (label, cls) => '<a class="btn ' + (cls || 'btn-p') + '" href="' + WA_TEXT + '" target="_blank" rel="noopener">' + waIcon + label + '</a>';

/* ---------- article art ---------- */
const ART = {
  bars: '<svg viewBox="0 0 200 90" fill="none" stroke="#F5F8F4" stroke-width="2"><rect x="20" y="50" width="22" height="30"/><rect x="56" y="38" width="22" height="42"/><rect x="92" y="56" width="22" height="24"/><rect x="128" y="14" width="22" height="66" fill="#12B76A" stroke="#12B76A"/><path d="M8 30h184" stroke-dasharray="6 5"/></svg>',
  doc: '<svg viewBox="0 0 200 90" fill="none" stroke="#F5F8F4" stroke-width="2"><rect x="50" y="12" width="100" height="66" rx="4"/><path d="M64 30h72M64 44h72M64 58h44"/></svg>',
  rings: '<svg viewBox="0 0 200 90" fill="none" stroke="#F5F8F4" stroke-width="2"><circle cx="70" cy="45" r="26"/><circle cx="130" cy="45" r="26" stroke="#7EE0B0"/></svg>',
  trend: '<svg viewBox="0 0 200 90" fill="none" stroke="#F5F8F4" stroke-width="2"><path d="M30 70l40-30 30 18 60-40"/><path d="M140 18h20v20"/></svg>',
  scales: '<svg viewBox="0 0 200 90" fill="none" stroke="#F5F8F4" stroke-width="2"><path d="M100 12v66M60 28h80"/><path d="M60 28l-18 30h36zM140 28l-18 30h36z"/></svg>',
  calendar: '<svg viewBox="0 0 200 90" fill="none" stroke="#F5F8F4" stroke-width="2"><rect x="40" y="20" width="120" height="56" rx="4"/><path d="M40 36h120M64 12v16M136 12v16"/></svg>'
};

/* ---------- tiny markdown ---------- */
function inline(s) {
  return esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');
}
function md(src) {
  const out = []; let list = null;
  const close = () => { if (list) { out.push('</' + list + '>'); list = null; } };
  src.split(/\r?\n/).forEach(line => {
    let m;
    if (!line.trim()) { close(); return; }
    if ((m = line.match(/^## (.+)/))) { close(); out.push('<h2>' + inline(m[1]) + '</h2>'); return; }
    if ((m = line.match(/^### (.+)/))) { close(); out.push('<h3>' + inline(m[1]) + '</h3>'); return; }
    if ((m = line.match(/^> (.+)/))) { close(); out.push('<p class="note">' + inline(m[1]) + '</p>'); return; }
    if ((m = line.match(/^- (.+)/))) { if (list !== 'ul') { close(); out.push('<ul>'); list = 'ul'; } out.push('<li>' + inline(m[1]) + '</li>'); return; }
    if ((m = line.match(/^\d+\. (.+)/))) { if (list !== 'ol') { close(); out.push('<ol>'); list = 'ol'; } out.push('<li>' + inline(m[1]) + '</li>'); return; }
    close(); out.push('<p>' + inline(line) + '</p>');
  });
  close();
  return out.join('\n');
}
function loadArticles() {
  const dir = path.join(__dirname, 'articles');
  return fs.readdirSync(dir).filter(f => f.endsWith('.md')).sort().reverse().map(f => {
    const raw = fs.readFileSync(path.join(dir, f), 'utf8');
    const cut = raw.indexOf('\n---');
    const meta = {};
    raw.slice(0, cut).split(/\r?\n/).forEach(l => { const i = l.indexOf(':'); if (i > 0) meta[l.slice(0, i).trim()] = l.slice(i + 1).trim(); });
    meta.html = md(raw.slice(raw.indexOf('\n', cut + 1) + 1));
    meta.dateText = new Date(meta.date + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
    return meta;
  });
}

/* ---------- structured data (schema.org JSON-LD) ---------- */
const TODAY = new Date().toISOString().slice(0, 10);
const ORG_ID = SITE + '/#organization', SITE_ID = SITE + '/#website', FOUNDER_ID = SITE + '/about.html#founder';
const ORG = {
  '@type': 'ProfessionalService', '@id': ORG_ID, name: 'Criterion Partners', url: SITE + '/',
  logo: { '@type': 'ImageObject', url: SITE + '/assets/icon-512.png', width: 512, height: 512 },
  image: SITE + '/assets/og.jpg',
  description: 'EB-1A profile building consultancy for researchers and professionals: research paper development, journal placement, peer review appointments, memberships, awards and earned media.',
  email: 'hello@criterionpartners.net', telephone: '+2348079851510', areaServed: 'Worldwide',
  founder: { '@id': FOUNDER_ID }, foundingDate: '2020', sameAs: [LINKEDIN],
  knowsAbout: ['EB-1A visa', 'Extraordinary ability green card', 'EB-2 National Interest Waiver', 'Peer review', 'Scholarly publishing'],
  contactPoint: [{ '@type': 'ContactPoint', contactType: 'customer service', telephone: '+2348079851510', email: 'hello@criterionpartners.net', availableLanguage: 'English' }]
};
const WEBSITE = { '@type': 'WebSite', '@id': SITE_ID, url: SITE + '/', name: 'Criterion Partners', publisher: { '@id': ORG_ID }, inLanguage: 'en' };
const FOUNDER = { '@type': 'Person', '@id': FOUNDER_ID, name: 'Adeyeye Barnabas', jobTitle: 'Founder', worksFor: { '@id': ORG_ID }, image: SITE + '/assets/founder.jpg', url: SITE + '/about.html' };
const crumbs = list => ({ '@type': 'BreadcrumbList', itemListElement: list.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c[0], item: SITE + '/' + c[1] })) });

/* ---------- layout ---------- */
function page(o) {
  const r = o.root || '';
  const nav = [['services.html', 'Services'], ['peer-review.html', 'Peer review proof'], ['articles.html', 'Articles'], ['about.html', 'About'], ['contact.html', 'Contact']];
  const url = SITE + '/' + (o.file === 'index.html' ? '' : o.file);
  const graph = [WEBSITE, ORG].concat(o.schema || []);
  const ld = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c');
  return '<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n' +
    // fallback until GitHub's "Enforce HTTPS" is ticked: send http visitors to https
    '<script>if(location.protocol==="http:"&&/(^|\\.)criterionpartners\\.net$/.test(location.hostname))location.replace("https://"+location.host+location.pathname+location.search+location.hash)</script>\n' +
    '<title>' + esc(o.title) + '</title>\n<meta name="description" content="' + esc(o.desc) + '">\n' +
    '<meta name="robots" content="' + (o.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large, max-snippet:-1') + '">\n<meta name="theme-color" content="#0E3B2A">\n' +
    '<meta name="author" content="' + (o.article ? 'Adeyeye Barnabas' : 'Criterion Partners') + '">\n' +
    '<meta property="og:type" content="' + (o.article ? 'article' : 'website') + '">\n<meta property="og:site_name" content="Criterion Partners">\n<meta property="og:locale" content="en_US">\n' +
    '<meta property="og:title" content="' + esc(o.title) + '">\n<meta property="og:description" content="' + esc(o.desc) + '">\n' +
    '<meta property="og:url" content="' + url + '">\n<meta property="og:image" content="' + SITE + '/assets/og.jpg">\n' +
    '<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">\n<meta property="og:image:alt" content="Criterion Partners: EB-1A profile building">\n' +
    (o.article ? '<meta property="article:published_time" content="' + o.article.date + '">\n<meta property="article:modified_time" content="' + o.article.date + '">\n<meta property="article:section" content="' + (o.article.type === 'news' ? 'News' : 'Education') + '">\n' : '') +
    '<meta name="twitter:card" content="summary_large_image">\n<meta name="twitter:title" content="' + esc(o.title) + '">\n<meta name="twitter:description" content="' + esc(o.desc) + '">\n<meta name="twitter:image" content="' + SITE + '/assets/og.jpg">\n' +
    (o.noindex ? '' : '<link rel="canonical" href="' + url + '">\n') +
    '<link rel="icon" href="' + r + 'favicon.ico" sizes="48x48">\n<link rel="icon" href="' + r + 'assets/icon.svg" type="image/svg+xml">\n' +
    '<link rel="apple-touch-icon" href="' + r + 'assets/apple-touch-icon.png">\n<link rel="manifest" href="' + r + 'site.webmanifest">\n' +
    '<link rel="alternate" type="application/rss+xml" title="Criterion Partners articles" href="' + SITE + '/feed.xml">\n' +
    '<script type="application/ld+json">' + ld + '</script>\n' +
    '<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
    '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Newsreader:ital,wght@0,400;0,500;1,400;1,500&family=Public+Sans:wght@400;500;600;700&display=swap">\n' +
    '<link rel="stylesheet" href="' + r + 'assets/site.css">\n</head>\n<body>\n<a class="skip" href="#main">Skip to content</a>\n' +
    '<header class="nav">\n  <div class="wrap nav-in">\n    <a class="brand" href="' + r + 'index.html" aria-label="Criterion Partners home"><i>CP</i><span>Criterion <b>Partners</b></span></a>\n' +
    '    <nav class="links" id="menu" aria-label="Main">\n' +
    nav.map(n => '      <a href="' + r + n[0] + '"' + (o.current === n[0] ? ' aria-current="page"' : '') + '>' + n[1] + '</a>').join('\n') +
    '\n    </nav>\n    <div class="nav-act">' + waBtn('Chat on WhatsApp', 'btn-p nav-wa') +
    '<button class="burger" id="burger" aria-label="Open menu" aria-expanded="false" aria-controls="menu"><span></span><span></span></button></div>\n  </div>\n</header>\n' +
    '<main id="main" tabindex="-1">\n' + o.body + '\n</main>\n' +
    '<footer class="foot">\n  <div class="wrap">\n    <div class="foot-grid">\n' +
    '      <div><a class="brand" href="' + r + 'index.html"><i>CP</i><span>Criterion <b>Partners</b></span></a><p>EB-1A profile building for researchers and professionals whose work is real.</p></div>\n' +
    '      <div><h4>Site</h4><ul>' + nav.map(n => '<li><a href="' + r + n[0] + '">' + n[1] + '</a></li>').join('') + '</ul></div>\n' +
    '      <div><h4>Contact</h4><ul><li><a href="' + WA + '" target="_blank" rel="noopener">WhatsApp: +234 807 985 1510</a></li><li><a href="mailto:hello@criterionpartners.net">hello@criterionpartners.net</a></li><li><a href="' + LINKEDIN + '" target="_blank" rel="noopener">LinkedIn</a></li></ul></div>\n' +
    '      <div><h4>Please note</h4><p>Criterion Partners is a profile building consultancy. We are not a law firm and nothing on this site is legal advice.</p></div>\n' +
    '    </div>\n    <p class="foot-base">&copy; 2026 Criterion Partners.</p>\n  </div>\n</footer>\n' +
    '<script src="' + r + 'assets/site.js"></script>\n' +
    "<script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','1530658892080552');fbq('track','PageView');</script>\n" +
    '</body>\n</html>\n';
}

const cta = (h, p) => '<section class="sec-cta"><div class="wrap"><div class="cta"><div><h2>' + h + '</h2><p>' + p + '</p></div>' + waBtn('Chat on WhatsApp') + '</div></div></section>';
const head = (eyebrow, h1, lede) => '<section class="page-head"><div class="wrap"><p class="eyebrow">' + eyebrow + '</p><h1>' + h1 + '</h1>' + (lede ? '<p class="lede">' + lede + '</p>' : '') + '</div></section>';

/* ---------- data ---------- */
const SERVICES = [
  ['01', 'Research Paper Development', 'Methodology, drafting and revision on work that is yours. We do not sell authorship on somebody else\'s paper.', 'Scholarly articles, Original contributions', 'Core'],
  ['02', 'Journal Placement', 'Targeting, submission strategy and peer review navigation at journals with real rejection rates.', 'Scholarly articles', 'Core'],
  ['03', 'Fellowship and Society Membership', 'Applications to societies that elect on achievement, not on an entry fee.', 'Membership', 'Core'],
  ['04', 'Awards and Nominations', 'We shortlist awards that have an actual selection process, then position and submit. If the entry fee is the only barrier, it is not on our list.', 'Awards', 'Core'],
  ['05', 'Peer Review Appointments', 'Reviewer roles at conferences and journals where the invitation means something.', 'Judging', 'Core'],
  ['06', 'Recommendation Strategy', 'Who should write for you, what each letter has to carry, and how to ask. Drafted with you, signed by them.', 'Original contributions, Leading role', 'Core'],
  ['07', 'Book and Chapter Publication', 'Proposals, chapter development and placement with academic and industry publishers.', 'Scholarly articles, Original contributions', 'Premium'],
  ['08', 'Editorial Board Appointments', 'Board seats at peer-reviewed journals, which is judging and a leading role in a single piece of evidence.', 'Judging, Leading role', 'Premium'],
  ['09', 'Earned Media', 'We build the story and take it to journalists who cover your field. No paid placements, no wire releases dressed up as coverage.', 'Published material', 'Premium'],
  ['10', 'Research Visibility', 'Preprints, repositories, talks, and the plumbing that makes your work findable by people who cite honestly. No citation trading.', 'Scholarly articles, Original contributions', 'Premium']
];
const svcCard = s => '<article class="card"><span class="n">' + s[0] + '</span><h3>' + s[1] + '</h3><p>' + s[2] + '</p>' + s[3].split(', ').map(t => '<span class="tag">' + t + '</span>').join(' ') + '</article>';

const CERTS = [
  ['14', 'access', 'IEEE Access', 'Certificate of reviewer recognition'], ['12', 'elsevier', 'Artificial Intelligence in Medicine (Elsevier)', 'Certificate of reviewing'],
  ['20', 'iot', 'IEEE Internet of Things Journal', 'Certificate of completion'], ['18', 'elsevier', 'Future Generation Computer Systems (Elsevier)', 'Certificate of reviewing'],
  ['22', 'access', 'IEEE Access', 'Certificate of reviewer recognition'], ['23', 'elsevier', 'Engineering Applications of Artificial Intelligence (Elsevier)', 'Certificate of reviewing'],
  ['08', 'iot', 'IEEE Internet of Things Journal', 'Certificate of completion'], ['07', 'access', 'IEEE Access', 'Certificate of reviewer recognition'],
  ['11', 'iot', 'IEEE Internet of Things Journal', 'Certificate of completion'], ['10', 'access', 'IEEE Access', 'Certificate of reviewer recognition'],
  ['13', 'iot', 'IEEE Internet of Things Journal', 'Certificate of completion'], ['15', 'access', 'IEEE Access', 'Certificate of reviewer recognition'],
  ['16', 'iot', 'IEEE Internet of Things Journal', 'Certificate of completion'], ['17', 'iot', 'IEEE Internet of Things Journal', 'Certificate of completion'],
  ['19', 'iot', 'IEEE Internet of Things Journal', 'Certificate of completion'], ['21', 'iot', 'IEEE Internet of Things Journal', 'Certificate of completion'],
  ['24', 'iot', 'IEEE Internet of Things Journal', 'Certificate of completion'], ['25', 'iot', 'IEEE Internet of Things Journal', 'Certificate of completion']
];
const SHORT = { access: 'IEEE Access', iot: 'IEEE IoT Journal', elsevier: 'Elsevier' };
const certFig = (c, r) => '<figure class="cert" data-g="' + c[1] + '"><button type="button" data-full="' + r + 'assets/proof/cert-' + c[0] + '.jpg" aria-label="Enlarge: ' + c[3] + ', ' + c[2] + '">' +
  '<img src="' + r + 'assets/proof/cert-' + c[0] + '-s.jpg" alt="' + c[3] + ' from ' + c[2] + ', client name blurred" loading="lazy" width="640" height="495"></button><figcaption>' + SHORT[c[1]] + '</figcaption></figure>';

const QUOTES = [
  ['Criterion Partners built my profile from 2 criteria to 7 in under 8 months. My attorney said it was the strongest evidence package she\'d ever seen.', 'Dr. A. Mehta', 'AI Researcher, EB-1A approved'],
  ['I had publications but no media coverage, no editorial board seats, no awards. They filled every gap systematically. Petition approved without an RFE.', 'S. Okonkwo, PhD', 'Economist, EB-1A approved'],
  ['The citation strategy alone transformed my case. They took my h-index from 8 to 19 in 10 months. The roadmap was worth every penny.', 'Prof. L. Zhang', 'Engineering, EB-1A approved']
];
const quotes = '<div class="grid3">' + QUOTES.map(q => '<figure class="quote"><p>' + q[0] + '</p><figcaption><b>' + q[1] + '</b><span>' + q[2] + '</span></figcaption></figure>').join('') + '</div>';

const REFUSE = [
  ['Pay-to-publish journals', 'If a journal accepts your paper in 48 hours, it will not survive a second look.'],
  ['Traded citations', 'A citation ring is the easiest pattern to spot from the outside.'],
  ['Awards you can buy', 'If the entry fee is the only barrier, an officer will find that out.'],
  ['Placed press', 'A release on a site that publishes anything is not media coverage.']
];
const refuseList = '<ul>' + REFUSE.map(x => '<li><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M6 6l12 12"/></svg><div><b>' + x[0] + '</b><span>' + x[1] + '</span></div></li>').join('') + '</ul>';

const STEPS = [
  ['Assess', 'We score your profile against all ten criteria and tell you where you stand, including when the honest answer is not yet.'],
  ['Plan', 'We map the fastest legitimate route to a case that clears the bar, and we put dates on it.'],
  ['Build', 'Papers, submissions, applications, appointments, coverage. You keep doing your work.'],
  ['Hand over', 'A structured evidence package your attorney can file from, every exhibit tied to its criterion.']
];
const steps = '<div class="steps">' + STEPS.map((s, i) => '<div class="step"><span class="n">' + (i + 1) + '</span><h3>' + s[0] + '</h3><p>' + s[1] + '</p></div>').join('') + '</div>';

const FAQ = [
  ['Is this the kind of service USCIS is scrutinising?', 'No, and the distinction is the reason we exist. The practices drawing scrutiny are paid journals, traded citations, bought awards and placed press. We refuse all four, in writing, in your engagement letter. Everything we build is either work you actually did or an opportunity you actually earned.'],
  ['Can you guarantee approval?', 'No. Anyone who guarantees it is telling you something they cannot know. What we can do is tell you honestly whether your profile is close, and what closing the distance would take.'],
  ['Do you file the petition?', 'No. We are not a law firm and nothing we give you is legal advice. We build and organise the evidence, then hand it to the immigration attorney you choose.'],
  ['What if I have no publications at all?', 'Then that is where we start. Most people in that position have real work that has never been written up. Turning it into a publishable paper takes three to six months, and it has to be your work.'],
  ['How long until I am petition-ready?', 'Six to twelve months for most profiles. Three if you already meet several criteria. If someone offers you three weeks, be careful.'],
  ['What fields do you work in?', 'All of them. STEM, economics, medicine, engineering, business, law, policy, social sciences, the arts. The ten criteria are the same everywhere. The evidence that satisfies them is field-specific.'],
  ['Will you tell me if I am not a good candidate?', 'Yes, and we do it regularly. Taking money to build a case that will not clear the bar helps nobody.']
];
const faq = '<div class="faq">' + FAQ.map(f => '<details class="faq-item"><summary>' + f[0] + '<span class="faq-ico" aria-hidden="true"></span></summary><p>' + f[1] + '</p></details>').join('') + '</div>';

const postCard = (a, r) => '<a class="post" href="' + r + 'articles/' + a.slug + '.html" data-t="' + a.type + '"><div class="art ' + (a.type === 'news' ? 'n' : 'e') + '">' + ART[a.icon] + '</div>' +
  '<div class="body"><div class="meta"><span class="chip ' + (a.type === 'news' ? 'p' : 's') + '">' + (a.type === 'news' ? 'News' : 'Education') + '</span><span>' + a.minutes + ' min read</span></div>' +
  '<h3>' + esc(a.title) + '</h3><p>' + esc(a.summary) + '</p><span class="read">Read article →</span></div></a>';

/* ---------- pages ---------- */
const articles = loadArticles();
const write = (file, html) => { fs.mkdirSync(path.dirname(path.join(ROOT, file)), { recursive: true }); fs.writeFileSync(path.join(ROOT, file), html); console.log('wrote', file); };

// HOME
write('index.html', page({
  file: 'index.html', title: 'EB-1A Profile Building Consultancy | Criterion Partners',
  desc: 'EB-1A profile building for researchers and professionals: genuine publications, peer review appointments and recognition that hold up to USCIS scrutiny.',
  schema: [{ '@type': 'WebPage', '@id': SITE + '/#webpage', url: SITE + '/', name: 'EB-1A Profile Building Consultancy', isPartOf: { '@id': SITE_ID }, about: { '@id': ORG_ID } }],
  body:
    '<section class="hero"><div class="wrap hero-grid"><div>' +
    '<p class="eyebrow">EB-1A profile building</p><h1>Three ticks do not clear <em>the bar</em>.</h1>' +
    '<p class="lede">Meeting three criteria makes you eligible to be considered. Approval takes a record that holds up when an officer looks closely. We help researchers and professionals build that record, honestly.</p>' +
    '<div class="hero-cta">' + waBtn('Chat with us on WhatsApp') + '<a class="btn btn-g" href="peer-review.html">See real client proof</a></div>' +
    '<div class="facts"><div><b>200+</b><span>profiles built</span></div><div><b>94%</b><span>approval rate</span></div><div><b>45</b><span>countries served</span></div></div></div>' +
    '<aside class="assess" aria-label="Sample assessment"><div class="assess-top"><small>Sample assessment</small><span class="chip p">Illustration</span></div>' +
    '<div class="score"><svg class="dial" viewBox="0 0 80 80" aria-hidden="true"><circle cx="40" cy="40" r="33" fill="none" stroke="#DCE7DE" stroke-width="7"/><circle class="dial-arc" cx="40" cy="40" r="33" fill="none" stroke="#12B76A" stroke-width="7" stroke-linecap="round" stroke-dasharray="207" stroke-dashoffset="124" transform="rotate(-90 40 40)"/><text x="40" y="46" text-anchor="middle" font-family="Newsreader,serif" font-size="22" fill="#0E3B2A">4/10</text></svg>' +
    '<p><b>Four criteria ticked.</b><br>Two of them would not survive a close read yet.</p></div>' +
    '<ul class="rows"><li>Scholarly articles <span class="chip s">Strong</span></li><li>Original contributions <span class="chip s">Strong</span></li><li>Judging the work of others <span class="chip b">Building</span></li><li>Published material about you <span class="chip b">Building</span></li><li>Membership in associations <span class="chip g">Gap</span></li></ul>' +
    '<p class="bar-note"><b>What we would do first:</b> peer review appointments at indexed journals, then one fellowship application.</p></aside></div></section>' +

    '<div class="strip"><div class="wrap strip-in"><small>Journals our clients have reviewed for</small><span>IEEE Access</span><span>IEEE Internet of Things Journal</span><span>Artificial Intelligence in Medicine</span><span>Future Generation Computer Systems</span></div></div>' +

    '<section class="sec"><div class="wrap"><div class="sec-head"><div><p class="eyebrow">What we do</p><h2>Ten services. Each one tied to a criterion.</h2></div><a class="more" href="services.html">All ten services →</a></div>' +
    '<div class="grid3">' + [0, 1, 4, 2, 3, 8].map(i => svcCard(SERVICES[i])).join('') + '</div></div></section>' +

    '<section class="sec band"><div class="wrap"><div class="sec-head"><div><p class="eyebrow">Peer review proof</p><h2>Real certificates. Real journals. Names withheld.</h2>' +
    '<p class="lede">Reviewer recognition our clients earned from IEEE and Elsevier journals. Client names are blurred at their request.</p></div><a class="more" href="peer-review.html">See all 18 certificates →</a></div>' +
    '<div class="certs">' + CERTS.slice(0, 6).map(c => certFig(c, '')).join('') + '</div></div></section>' +

    '<section class="sec"><div class="wrap"><div class="sec-head"><div><p class="eyebrow">How we work</p><h2>From assessment to petition-ready.</h2></div></div>' + steps + '</div></section>' +

    '<section class="sec tint"><div class="wrap refuse"><div><p class="eyebrow">Why this matters now</p><h2>Shortcuts are being <em>caught</em>.</h2>' +
    '<p class="lede">Petitions built on purchased credentials are drawing closer scrutiny. Four practices come up again and again. Many firms sell exactly those. We refuse all four, in writing.</p>' +
    '<a class="more" href="articles/four-practices-that-put-a-petition-at-risk.html" style="display:inline-block;margin-top:18px">Read the full explainer →</a></div>' + refuseList + '</div></section>' +

    '<section class="sec"><div class="wrap"><div class="sec-head"><div><p class="eyebrow">News and education</p><h2>Learn the process before you pay anyone.</h2></div><a class="more" href="articles.html">All articles →</a></div>' +
    '<div class="grid3">' + articles.slice(0, 3).map(a => postCard(a, '')).join('') + '</div></div></section>' +

    '<section class="sec" style="padding-top:0"><div class="wrap"><div class="sec-head"><div><p class="eyebrow">Client results</p><h2>What clients say.</h2></div></div>' + quotes + '</div></section>' +
    cta('Find out where you actually stand.', 'Message us on WhatsApp. Tell us your field and what you have so far, and we will give you an honest read. No cost, no obligation.')
}));

// SERVICES
const PLANS = [
  ['Foundation', '$1,500', 'For candidates building two or three specific criteria.', ['Profile gap analysis', 'Three services of your choice', 'USCIS criteria mapping', '30-day email support', 'One strategy session'], false],
  ['Accelerator', '$3,500', 'Full profile building for petition-ready candidates.', ['Comprehensive EB-1A assessment', 'Six services of your choice', 'Criteria mapping and evidence plan', '90-day priority support', 'Three strategy sessions', '12-month action roadmap', 'Recommendation letter strategy'], true],
  ['Extraordinary', '$8,000', 'End-to-end. We build the entire record.', ['All ten services included', 'Dedicated profile strategist', 'Full petition evidence package', '12-month unlimited support', 'Weekly strategy sessions', 'Earned media programme', 'Research visibility programme', 'Priority processing'], false]
];
write('services.html', page({
  file: 'services.html', current: 'services.html', title: 'EB-1A Profile Building Services and Pricing | Criterion Partners',
  desc: 'Ten EB-1A profile building services, each tied to a USCIS criterion: research papers, journal placement, peer review, memberships, awards and earned media.',
  schema: [crumbs([['Home', ''], ['Services', 'services.html']]),
    { '@type': 'Service', name: 'EB-1A profile building', serviceType: 'Immigration evidence and profile building consultancy', provider: { '@id': ORG_ID }, areaServed: 'Worldwide',
      hasOfferCatalog: { '@type': 'OfferCatalog', name: 'EB-1A profile building packages', itemListElement: PLANS.map(p => ({ '@type': 'Offer', name: p[0], description: p[2],
        priceSpecification: { '@type': 'PriceSpecification', minPrice: Number(p[1].replace(/\D/g, '')), priceCurrency: 'USD' } })) } }],
  body: head('Services', 'Ten services. Each one tied to a criterion.', 'Nothing here exists to look busy. Each service is chosen because it moves a specific EB-1A criterion, and we tell you which one.') +
    '<section class="sec" style="padding-top:10px"><div class="wrap"><h2 class="group">Core services</h2><div class="grid3">' + SERVICES.filter(s => s[4] === 'Core').map(svcCard).join('') + '</div>' +
    '<h2 class="group">Premium services</h2><div class="grid2">' + SERVICES.filter(s => s[4] === 'Premium').map(svcCard).join('') + '</div></div></section>' +
    '<section class="sec tint"><div class="wrap"><div class="sec-head"><div><p class="eyebrow">How we work</p><h2>From assessment to petition-ready.</h2></div></div>' + steps + '</div></section>' +
    '<section class="sec" id="pricing"><div class="wrap"><div class="sec-head"><div><p class="eyebrow">Investment</p><h2>Three ways in.</h2><p class="lede">Every package includes criteria mapping and a dated roadmap. Prices are starting points; we confirm yours after the assessment.</p></div></div>' +
    '<div class="grid3 plans">' + PLANS.map(p => '<article class="plan' + (p[4] ? ' hot' : '') + '">' + (p[4] ? '<span class="ribbon">Most chosen</span>' : '') + '<h3>' + p[0] + '</h3><p class="price">' + p[1] + '<small>starting from</small></p><p class="pd">' + p[2] + '</p><ul>' + p[3].map(f => '<li>' + f + '</li>').join('') + '</ul>' + waBtn('Ask about ' + p[0], p[4] ? 'btn-p' : 'btn-g') + '</article>').join('') + '</div></div></section>' +
    cta('Not sure which services you need?', 'Most people do not need all ten. Tell us what you have and we will say which two or three would matter most.')
}));

// PEER REVIEW PROOF
write('peer-review.html', page({
  file: 'peer-review.html', current: 'peer-review.html', title: 'EB-1A Peer Review Certificates | Criterion Partners',
  schema: [crumbs([['Home', ''], ['Peer review proof', 'peer-review.html']]),
    { '@type': 'ImageGallery', name: 'Client peer review certificates', description: 'Reviewer certificates from IEEE and Elsevier journals earned by Criterion Partners clients. Names blurred.',
      image: CERTS.map(c => ({ '@type': 'ImageObject', contentUrl: SITE + '/assets/proof/cert-' + c[0] + '.jpg', caption: c[3] + ', ' + c[2] })) }],
  desc: '18 peer review certificates our clients earned from IEEE Access, the IEEE Internet of Things Journal and Elsevier journals. Names withheld.',
  body: head('Peer review proof', 'Eighteen certificates. Every one earned.', 'Judging the work of others is one of the ten EB-1A criteria. These are reviewer certificates our clients received after completing real reviews for established journals. Client names are blurred at their request.') +
    '<section class="sec" style="padding-top:6px"><div class="wrap">' +
    '<div class="strip-facts"><div><b>18</b><span>certificates shown</span></div><div><b>5</b><span>journals</span></div><div><b>2</b><span>publishers: IEEE and Elsevier</span></div></div>' +
    '<div class="toolbar"><div class="tabs" role="tablist" aria-label="Filter certificates" id="certTabs">' +
    '<button class="tab" role="tab" aria-selected="true" data-f="all">All (18)</button><button class="tab" role="tab" aria-selected="false" data-f="iot">IEEE IoT Journal (10)</button>' +
    '<button class="tab" role="tab" aria-selected="false" data-f="access">IEEE Access (5)</button><button class="tab" role="tab" aria-selected="false" data-f="elsevier">Elsevier (3)</button></div></div>' +
    '<div class="certs light" id="certGrid">' + CERTS.map(c => certFig(c, '')).join('') + '</div>' +
    '<p class="fine">Certificates are shown with permission. Names are blurred to protect client privacy. Manuscript titles and journal names are as issued.</p></div></section>' +
    '<section class="sec tint"><div class="wrap two"><div><p class="eyebrow">Why it counts</p><h2>An invitation is not evidence. A completed review is.</h2></div>' +
    '<div class="prose"><p>The criterion asks for evidence that you have judged the work of others. A request to review, on its own, shows very little. What carries weight is confirmation from the journal that the review was completed.</p>' +
    '<p>That is why we show certificates and not invitation emails. Each one here was issued by the journal after the review was done.</p>' +
    '<p><a class="more" href="articles/what-counts-as-judging-the-work-of-others.html">Read: what counts as judging the work of others →</a></p></div></div></section>' +
    '<div class="lightbox" id="lightbox" hidden><button class="lb-x" aria-label="Close">Close ✕</button><img alt="Enlarged certificate, client name blurred"></div>' +
    cta('Want reviewer appointments like these?', 'Tell us your field and publication history. We will tell you which journals are realistic for you.')
}));

// ARTICLES HUB
const feat = articles.find(a => a.featured) || articles[0];
write('articles.html', page({
  file: 'articles.html', current: 'articles.html', title: 'EB-1A News and Guides | Criterion Partners',
  desc: 'Plain-English guides to the EB-1A criteria, EB-2 NIW and peer review, plus news on what USCIS is doing, checked against official sources.',
  schema: [crumbs([['Home', ''], ['Articles', 'articles.html']]),
    { '@type': 'Blog', name: 'Criterion Partners: EB-1A news and education', url: SITE + '/articles.html', publisher: { '@id': ORG_ID },
      blogPost: articles.map(a => ({ '@type': 'BlogPosting', headline: a.title, url: SITE + '/articles/' + a.slug + '.html', datePublished: a.date })) }],
  body: head('News and education', 'Understand EB-1A before you spend a dollar.', 'Plain-English guides to the criteria, and news on what USCIS is doing, checked against official sources.') +
    '<section style="padding-bottom:40px"><div class="wrap"><div class="toolbar"><div class="tabs" role="tablist" aria-label="Filter articles" id="postTabs">' +
    '<button class="tab" role="tab" aria-selected="true" data-f="all">All</button><button class="tab" role="tab" aria-selected="false" data-f="news">News</button><button class="tab" role="tab" aria-selected="false" data-f="education">Education</button></div>' +
    '<label class="search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg><input type="search" id="q" placeholder="Search articles" aria-label="Search articles"></label></div>' +
    '<a class="feature" href="articles/' + feat.slug + '.html" data-t="' + feat.type + '" id="feature"><div class="art">' + ART[feat.icon] + '</div><div class="body"><div class="meta"><span class="chip s">' + (feat.type === 'news' ? 'News' : 'Education') + '</span><span>Featured</span><span>' + feat.minutes + ' min read</span></div>' +
    '<h2>' + esc(feat.title) + '</h2><p class="lede">' + esc(feat.summary) + '</p><span class="more">Read article →</span></div></a>' +
    '<div class="grid3" id="posts">' + articles.filter(a => a !== feat).map(a => postCard(a, '')).join('') + '</div><p id="none" hidden class="fine">No articles match that search.</p></div></section>' +
    cta('Have a question an article did not answer?', 'Ask us directly. We reply on WhatsApp, usually the same day.')
}));

// ARTICLE PAGES
articles.forEach(a => {
  const others = articles.filter(x => x !== a).slice(0, 3);
  write('articles/' + a.slug + '.html', page({
    root: '../', file: 'articles/' + a.slug + '.html', current: 'articles.html', article: a,
    title: a.title.length > 48 ? a.title : a.title + ' | Criterion Partners', desc: a.description || a.summary,
    schema: [crumbs([['Home', ''], ['Articles', 'articles.html'], [a.title, 'articles/' + a.slug + '.html']]), FOUNDER,
      { '@type': a.type === 'news' ? 'NewsArticle' : 'BlogPosting', headline: a.title, description: a.description || a.summary,
        url: SITE + '/articles/' + a.slug + '.html', mainEntityOfPage: SITE + '/articles/' + a.slug + '.html',
        datePublished: a.date, dateModified: a.date, image: [SITE + '/assets/og.jpg'], inLanguage: 'en',
        articleSection: a.type === 'news' ? 'News' : 'Education', wordCount: a.html.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length,
        author: { '@id': FOUNDER_ID }, publisher: { '@id': ORG_ID } }],
    body: '<article class="article"><div class="wrap narrow"><a class="back" href="../articles.html">← All articles</a>' +
      '<div class="meta"><span class="chip ' + (a.type === 'news' ? 'p' : 's') + '">' + (a.type === 'news' ? 'News' : 'Education') + '</span><span>' + a.dateText + '</span><span>' + a.minutes + ' min read</span></div>' +
      '<h1>' + esc(a.title) + '</h1><p class="lede">' + esc(a.summary) + '</p><div class="art-hero ' + (a.type === 'news' ? 'n' : 'e') + '">' + ART[a.icon] + '</div>' +
      '<div class="prose">' + a.html + '</div></div></article>' +
      '<section class="sec tint"><div class="wrap"><div class="sec-head"><div><p class="eyebrow">Keep reading</p><h2>More articles</h2></div><a class="more" href="../articles.html">All articles →</a></div><div class="grid3">' + others.map(x => postCard(x, '../')).join('') + '</div></div></section>' +
      cta('Want an honest read on your own profile?', 'Message us on WhatsApp with your field and what you have so far.')
  }));
});

// ABOUT
write('about.html', page({
  file: 'about.html', current: 'about.html', title: 'About Criterion Partners and Founder Adeyeye Barnabas',
  schema: [crumbs([['Home', ''], ['About', 'about.html']]), FOUNDER,
    { '@type': 'AboutPage', url: SITE + '/about.html', name: 'About Criterion Partners', about: { '@id': ORG_ID }, mainEntity: { '@id': FOUNDER_ID } }],
  desc: 'Criterion Partners was founded by Adeyeye Barnabas to help researchers build EB-1A evidence that is real, earned and able to stand up to scrutiny.',
  body: head('About', 'We build records that hold up.', 'Criterion Partners is a profile building consultancy for EB-1A candidates. We are not a law firm. We do the work that makes a petition strong before an attorney files it.') +
    '<section class="sec" style="padding-top:10px"><div class="wrap founder"><figure><img src="assets/founder.jpg" alt="Adeyeye Barnabas, founder of Criterion Partners" width="720" height="720"></figure>' +
    '<div><p class="eyebrow">Founder</p><h2>Adeyeye Barnabas</h2><div class="prose">' +
    '<p>Adeyeye Barnabas is the founder of Criterion Partners. He started the firm on a simple conviction: talented people should not have to choose between a weak petition and a dishonest one.</p>' +
    '<p>He leads the firm\'s work with researchers and professionals across 45 countries, helping them turn real work into evidence that satisfies the EB-1A criteria: publications in journals with genuine peer review, reviewer appointments, memberships that are earned, and recognition a stranger can verify.</p>' +
    '<p>His rule for every engagement is the same. If an officer spent ten minutes checking a piece of evidence, it should look stronger, not weaker.</p></div>' + waBtn('Message Barnabas on WhatsApp') + '</div></div></section>' +
    '<section class="sec tint"><div class="wrap refuse"><div><p class="eyebrow">Our standards</p><h2>Four things we will not do.</h2><p class="lede">These are the shortcuts that put petitions at risk. We refuse them in writing, in every engagement letter.</p></div>' + refuseList + '</div></section>' +
    '<section class="sec"><div class="wrap"><div class="sec-head"><div><p class="eyebrow">By the numbers</p><h2>Our record so far.</h2></div></div>' +
    '<div class="strip-facts big"><div><b>200+</b><span>profiles built</span></div><div><b>94%</b><span>approval rate</span></div><div><b>45</b><span>countries served</span></div></div></div></section>' +
    '<section class="sec" style="padding-top:0"><div class="wrap">' + quotes + '</div></section>' +
    cta('Talk to us before you commit to anyone.', 'An honest first conversation costs nothing.')
}));

// CONTACT
write('contact.html', page({
  file: 'contact.html', current: 'contact.html', title: 'Contact Criterion Partners | Free EB-1A Profile Read',
  schema: [crumbs([['Home', ''], ['Contact', 'contact.html']]),
    { '@type': 'ContactPage', url: SITE + '/contact.html', name: 'Contact Criterion Partners', about: { '@id': ORG_ID } },
    { '@type': 'FAQPage', mainEntity: FAQ.map(f => ({ '@type': 'Question', name: f[0], acceptedAnswer: { '@type': 'Answer', text: f[1] } })) }],
  desc: 'Chat with Criterion Partners on WhatsApp for an honest read on your EB-1A profile. +234 807 985 1510 or hello@criterionpartners.net.',
  body: head('Contact', 'Start with a conversation.', 'Tell us your field, your highest degree, and what you have so far: papers, reviews, awards, press. We will tell you honestly where you stand.') +
    '<section class="sec" style="padding-top:10px"><div class="wrap contact">' +
    '<a class="ccard main" href="' + WA_TEXT + '" target="_blank" rel="noopener"><span class="ico">' + waIcon + '</span><h2>WhatsApp</h2><p class="big">+234 807 985 1510</p><p>The fastest way to reach us. We usually reply the same day.</p><span class="btn btn-p">Open WhatsApp chat</span></a>' +
    '<a class="ccard" href="mailto:hello@criterionpartners.net"><span class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg></span><h2>Email</h2><p class="big">hello@criterionpartners.net</p><p>Best for longer messages and attachments. We answer within 24 hours.</p><span class="btn btn-g">Send an email</span></a>' +
    '<a class="ccard" href="' + LINKEDIN + '" target="_blank" rel="noopener"><span class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 10v7M8 7v.01M12 17v-4a2 2 0 0 1 4 0v4M12 10v7"/></svg></span><h2>LinkedIn</h2><p class="big">Criterion Partners</p><p>Follow us for EB-1A news, guides and updates on our work.</p><span class="btn btn-g">Visit our page</span></a>' +
    '</div></section>' +
    '<section class="sec tint"><div class="wrap narrow"><p class="eyebrow">Straight answers</p><h2 style="margin:12px 0 24px">Questions people ask first.</h2>' + faq + '</div></section>'
}));

// styles and script: source lives in src/, the served copies in assets/
const css = fs.readFileSync(path.join(__dirname, 'base.css'), 'utf8').replace(/\/\* preview ribbon \*\/[\s\S]*?\n\n/, '') +
  fs.readFileSync(path.join(__dirname, 'extra.css'), 'utf8');
fs.writeFileSync(path.join(ROOT, 'assets', 'site.css'), css);
fs.copyFileSync(path.join(__dirname, 'site.js'), path.join(ROOT, 'assets', 'site.js'));

// 404 page (GitHub Pages serves 404.html for any missing URL)
write('404.html', page({
  file: '404.html', noindex: true, title: 'Page not found | Criterion Partners', desc: 'This page does not exist.',
  body: head('404', 'That page is not here.', 'It may have moved. These are the places most people are looking for:') +
    '<section class="sec" style="padding-top:0"><div class="wrap"><div class="grid3">' +
    [['index.html', 'Home', 'What we do and how we work.'], ['articles.html', 'Articles', 'EB-1A news and plain-English guides.'], ['contact.html', 'Contact', 'Message us on WhatsApp.']]
      .map(x => '<a class="card" href="/' + (x[0] === 'index.html' ? '' : x[0]) + '"><h3>' + x[1] + '</h3><p>' + x[2] + '</p></a>').join('') + '</div></div></section>'
}).replace(/(href|src)="(assets\/|favicon|site\.webmanifest|index\.html|services\.html|peer-review\.html|articles\.html|about\.html|contact\.html)/g, '$1="/$2'));

// sitemap, with images for the proof gallery
const pages = [['', '1.0', 'weekly'], ['services.html', '0.9', 'monthly'], ['peer-review.html', '0.8', 'monthly'], ['articles.html', '0.8', 'weekly'], ['about.html', '0.7', 'monthly'], ['contact.html', '0.7', 'monthly']];
const sm = pages.map(p => '  <url><loc>' + SITE + '/' + p[0] + '</loc><lastmod>' + TODAY + '</lastmod><changefreq>' + p[2] + '</changefreq><priority>' + p[1] + '</priority>' +
    (p[0] === 'peer-review.html' ? CERTS.map(c => '<image:image><image:loc>' + SITE + '/assets/proof/cert-' + c[0] + '.jpg</image:loc></image:image>').join('') : '') +
    (p[0] === 'about.html' ? '<image:image><image:loc>' + SITE + '/assets/founder.jpg</image:loc></image:image>' : '') + '</url>')
  .concat(articles.map(a => '  <url><loc>' + SITE + '/articles/' + a.slug + '.html</loc><lastmod>' + a.date + '</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>'));
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n' + sm.join('\n') + '\n</urlset>\n');
fs.writeFileSync(path.join(ROOT, 'robots.txt'), 'User-agent: *\nAllow: /\nDisallow: /src/\nDisallow: /preview/\n\nSitemap: ' + SITE + '/sitemap.xml\n');

// RSS feed for articles
fs.writeFileSync(path.join(ROOT, 'feed.xml'), '<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel>\n' +
  '<title>Criterion Partners: EB-1A news and education</title><link>' + SITE + '/articles.html</link><description>Plain-English EB-1A guides and news.</description><language>en</language>\n' +
  '<atom:link href="' + SITE + '/feed.xml" rel="self" type="application/rss+xml"/>\n' +
  articles.slice().sort((x, y) => y.date.localeCompare(x.date)).map(a => '<item><title>' + esc(a.title) + '</title><link>' + SITE + '/articles/' + a.slug + '.html</link><guid>' + SITE + '/articles/' + a.slug + '.html</guid>' +
    '<pubDate>' + new Date(a.date + 'T09:00:00Z').toUTCString() + '</pubDate><description>' + esc(a.summary) + '</description></item>').join('\n') + '\n</channel></rss>\n');

// web app manifest
fs.writeFileSync(path.join(ROOT, 'site.webmanifest'), JSON.stringify({ name: 'Criterion Partners', short_name: 'Criterion', start_url: '/', display: 'browser', background_color: '#F5F8F4', theme_color: '#0E3B2A',
  icons: [{ src: '/assets/icon-192.png', sizes: '192x192', type: 'image/png' }, { src: '/assets/icon-512.png', sizes: '512x512', type: 'image/png' }] }, null, 2) + '\n');

console.log('done:', articles.length, 'articles');
