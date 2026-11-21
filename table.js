// ============================================================
// table.js — Data table (histori bencana) + Korban Jiwa cards
// ============================================================

let allEvents = [];

// ── RENDER DATA TABLE ────────────────────────────────────────

function renderTable(data) {
  const tbody = document.getElementById('table-body');
  const counter = document.getElementById('table-count');
  if (!tbody) return;

  if (data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" class="text-center py-12 text-gray-400">Tidak ada data yang sesuai filter.</td></tr>`;
    if (counter) counter.textContent = 'Menampilkan 0 data';
    return;
  }

  tbody.innerHTML = data
    .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal))
    .map(ev => {
      const tgl = new Date(ev.tanggal).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' });
      const badgeClass = {
        'Bandang':  'badge-bandang',
        'Genangan': 'badge-genangan',
        'Rob':      'badge-rob',
      }[ev.jenis_banjir] || 'badge-genangan';

      const korbanColor = ev.korban_jiwa > 0 ? 'num num--victim' : 'num';

      return `<tr>
        <td>${tgl}</td>
        <td>${ev.provinsi}</td>
        <td>${ev.kabupaten}</td>
        <td><span class="${badgeClass}">${ev.jenis_banjir}</span></td>
        <td class="num">${ev.ketinggian_cm}</td>
        <td class="${korbanColor}">${ev.korban_jiwa}</td>
        <td class="num hide-mobile">${ev.pengungsi.toLocaleString('id-ID')}</td>
        <td class="num hide-mobile">${ev.kerugian_juta_rupiah.toLocaleString('id-ID')}</td>
        <td class="hide-mobile">${ev.sumber_data}</td>
      </tr>`;
    }).join('');

  if (counter) counter.textContent = `Menampilkan ${data.length} data`;
}

// ── FILTER LOGIC ─────────────────────────────────────────────

function applyFilters() {
  const searchVal = (document.getElementById('search-table')?.value || '').toLowerCase();
  const jenisVal  = document.getElementById('filter-jenis')?.value  || '';
  const tahunVal  = document.getElementById('filter-tahun')?.value  || '';

  const filtered = allEvents.filter(ev => {
    const matchSearch = !searchVal
      || ev.provinsi.toLowerCase().includes(searchVal)
      || ev.kabupaten.toLowerCase().includes(searchVal);
    const matchJenis  = !jenisVal || ev.jenis_banjir === jenisVal;
    const matchTahun  = !tahunVal || ev.tanggal.startsWith(tahunVal);
    return matchSearch && matchJenis && matchTahun;
  });

  renderTable(filtered);
}

function bindTableFilters() {
  document.getElementById('search-table')?.addEventListener('input', applyFilters);
  document.getElementById('filter-jenis')?.addEventListener('change', applyFilters);
  document.getElementById('filter-tahun')?.addEventListener('change', applyFilters);
  document.getElementById('reset-filter')?.addEventListener('click', () => {
    document.getElementById('search-table').value  = '';
    document.getElementById('filter-jenis').value  = '';
    document.getElementById('filter-tahun').value  = '';
    renderTable(allEvents);
  });
}

// ── KORBAN JIWA SECTION ──────────────────────────────────────

function renderKorbanGrid(data) {
  const grid = document.getElementById('korban-grid');
  if (!grid) return;

  const withVictims = data
    .filter(ev => ev.korban_jiwa > 0 || ev.luka_luka > 0)
    .sort((a, b) => b.korban_jiwa - a.korban_jiwa);

  if (withVictims.length === 0) {
    grid.innerHTML = `<div class="col-span-3 text-center text-gray-400 py-8">Tidak ada data korban untuk filter ini.</div>`;
    return;
  }

  grid.innerHTML = withVictims.map(ev => {
    const tgl  = new Date(ev.tanggal).toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' });
    return `<div class="korban-card">
      <div class="korban-card__head">
        <div><strong>${ev.kabupaten}</strong><small>${ev.provinsi} / ${tgl}</small></div>
        <span>${ev.jenis_banjir}</span>
      </div>
      <div class="korban-card__counts">
        <div><strong>${ev.korban_jiwa}</strong><span>Meninggal</span></div>
        <div><strong>${ev.luka_luka}</strong><span>Luka-luka</span></div>
      </div>
      <div><span>${ev.pengungsi.toLocaleString('id-ID')} pengungsi</span></div>
      <div><span>Ketinggian air: ${ev.ketinggian_cm} cm</span><small>Sumber: ${ev.sumber_data}</small></div>
    </div>`;
  }).join('');
}

function bindKorbanFilters() {
  document.getElementById('search-korban')?.addEventListener('input', filterKorban);
  document.getElementById('filter-korban-tahun')?.addEventListener('change', filterKorban);
}

function filterKorban() {
  const searchVal = (document.getElementById('search-korban')?.value || '').toLowerCase();
  const tahunVal  = document.getElementById('filter-korban-tahun')?.value || '';

  const filtered = allEvents.filter(ev => {
    const matchSearch = !searchVal
      || ev.provinsi.toLowerCase().includes(searchVal)
      || ev.kabupaten.toLowerCase().includes(searchVal);
    const matchTahun = !tahunVal || ev.tanggal.startsWith(tahunVal);
    return matchSearch && matchTahun;
  });

  renderKorbanGrid(filtered);
}

// ── HERO STATS ───────────────────────────────────────────────

function animateCount(el, target) {
  if (!el) return;
  let current = 0;
  const step = Math.ceil(target / 40);
  const timer = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = current.toLocaleString('id-ID');
    if (current >= target) clearInterval(timer);
  }, 30);
}

function updateHeroStats(events) {
  const totalKejadian  = events.length;
  const totalKorban    = events.reduce((s, e) => s + e.korban_jiwa, 0);
  const totalPengungsi = events.reduce((s, e) => s + e.pengungsi, 0);
  const provinsiSet    = new Set(events.map(e => e.provinsi));

  animateCount(document.getElementById('stat-kejadian'),  totalKejadian);
  animateCount(document.getElementById('stat-korban'),    totalKorban);
  animateCount(document.getElementById('stat-pengungsi'), totalPengungsi);
  animateCount(document.getElementById('stat-provinsi'),  provinsiSet.size);

  // Korban section summary
  animateCount(document.getElementById('total-jiwa'),             totalKorban);
  animateCount(document.getElementById('total-luka'),             events.reduce((s,e)=>s+e.luka_luka,0));
  animateCount(document.getElementById('total-pengungsi-korban'), totalPengungsi);
}

// ── INIT ─────────────────────────────────────────────────────

async function initTable() {
  allEvents = await window.floodDB.getAll('flood_events');

  // Skeleton removed, render real data
  renderTable(allEvents);
  renderKorbanGrid(allEvents);
  updateHeroStats(allEvents);
  bindTableFilters();
  bindKorbanFilters();
}

window.floodTable = { initTable };
