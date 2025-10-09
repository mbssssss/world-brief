const listEl = document.getElementById("list");
const refreshBtn = document.getElementById("refreshBtn");
const langSelect = document.getElementById("langSelect");
const limitSelect = document.getElementById("limitSelect");
const toggleNewsdata = document.getElementById("toggleNewsdata");
const toggleRSS = document.getElementById("toggleRSS");
const toggleIG = document.getElementById("toggleIG");

function timeAgo(iso) {
  try {
    const d = new Date(iso);
    const diff = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    const m = Math.floor(diff/60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m/60);
    if (h < 24) return `${h}h ago`;
    const days = Math.floor(h/24);
    return `${days}d ago`;
  } catch {
    return "";
  }
}

async function load() {
  listEl.innerHTML = `<li class="meta">Loading…</li>`;
  const params = new URLSearchParams({
    lang: langSelect.value,
    limit: limitSelect.value,
    newsdata: toggleNewsdata.checked ? "1" : "0",
    rss: toggleRSS.checked ? "1" : "0",
    ig: toggleIG.checked ? "1" : "0"
  });
  try {
    const res = await fetch(`/api/aggregate?${params.toString()}`);
    if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
    const items = await res.json();
    if (!items.length) {
      listEl.innerHTML = `<li class="meta">No items found.</li>`;
      return;
    }
    const html = items.map((it) => {
      const t = timeAgo(it.ts || it.timestamp || it.date);
      const src = it.source || "source";
      const type = it.type ? `<span class="meta">• ${it.type}</span>` : "";
      return `
        <li>
          <div class="item-top">
            <p class="item-title"><a href="${it.url}" target="_blank" rel="noopener">${it.title}</a></p>
            <span class="meta">${t}</span>
          </div>
          <div class="meta">${src} ${type}</div>
        </li>
      `;
    }).join("");
    listEl.innerHTML = html;
  } catch (err) {
    listEl.innerHTML = `<li class="meta">Error: ${err.message}</li>`;
  }
}

refreshBtn.addEventListener("click", load);
langSelect.addEventListener("change", load);
limitSelect.addEventListener("change", load);
toggleNewsdata.addEventListener("change", load);
toggleRSS.addEventListener("change", load);
toggleIG.addEventListener("change", load);

load();
setInterval(load, 10 * 60 * 1000);