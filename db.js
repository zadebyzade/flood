(function () {
  const DB_NAME = 'SiPADUDB';
  const DB_VERSION = 1;
  let db;

  function openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const database = request.result;
        ['flood_events', 'risk_zones', 'missing_persons'].forEach((name) => {
          if (!database.objectStoreNames.contains(name)) {
            database.createObjectStore(name, { keyPath: name === 'missing_persons' ? 'nik' : 'id', autoIncrement: name !== 'missing_persons' });
          }
        });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function seedIfEmpty(database) {
    const counts = await Promise.all(['flood_events', 'risk_zones', 'missing_persons'].map((store) =>
      new Promise((resolve, reject) => {
        const request = database.transaction(store).objectStore(store).count();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      })
    ));

    if (counts[0] === 0) {
      const events = [
        ['2024-03-12','DKI Jakarta','Jakarta Barat','Genangan',85,3,1200,2800,'BNPB'],
        ['2024-02-18','Jawa Barat','Bandung','Bandang',140,2,3400,5100,'BPBD Jawa Barat'],
        ['2024-01-26','Jawa Tengah','Semarang','Rob',75,0,2100,3200,'BMKG'],
        ['2023-12-09','Aceh','Aceh Besar','Bandang',160,5,2800,4600,'BNPB'],
        ['2023-11-21','Sumatera Barat','Padang','Genangan',110,1,1900,2700,'BPBD Sumatera Barat'],
        ['2023-10-14','Banten','Lebak','Bandang',155,4,2600,3900,'BPBD Banten'],
        ['2022-12-02','Nusa Tenggara Timur','Kupang','Genangan',90,0,1800,2100,'BNPB'],
        ['2022-09-17','Sulawesi Selatan','Makassar','Rob',68,0,1500,1900,'BMKG'],
        ['2021-11-30','Kalimantan Selatan','Banjar','Bandang',175,6,4200,6200,'BNPB'],
        ['2021-04-08','Riau','Pekanbaru','Genangan',95,1,2300,2900,'BPBD Riau'],
        ['2020-12-19','Jawa Timur','Malang','Bandang',150,3,3100,4800,'BNPB'],
        ['2020-02-11','Sulawesi Tengah','Palu','Genangan',82,0,1100,1700,'BPBD Sulawesi Tengah']
      ].map((row, index) => ({
        id: index + 1,
        tanggal: row[0],
        provinsi: row[1],
        kabupaten: row[2],
        jenis_banjir: row[3],
        ketinggian_cm: row[4],
        korban_jiwa: row[5],
        luka_luka: index % 4 + 1,
        pengungsi: row[6],
        kerugian_juta_rupiah: row[7],
        sumber_data: row[8]
      }));
      await putMany(database, 'flood_events', events);
    }

    if (counts[1] === 0) {
      const zones = [
        [1,'DKI Jakarta','Jakarta Barat',-6.1670,106.7637,3,['Drainase padat','Permukaan rendah'],'Bersihkan saluran dan hindari kawasan jalan tergenang.'],
        [2,'Jawa Barat','Bandung',-6.9175,107.6191,3,['Limpasan sungai','Curah hujan tinggi'],'Waspada kanal dan jalur evakuasi terdekat.'],
        [3,'Jawa Tengah','Semarang',-6.9667,110.4167,2,['Rob','Permukiman pesisir'],'Pantau pasang air laut dan pastikan jalur evakuasi terbuka.'],
        [4,'Aceh','Aceh Besar',5.4529,95.4459,3,['Aliran bandang','Hulu sungai'],'Jangan mendekati sungai saat hujan terus-menerus.'],
        [5,'Kalimantan Selatan','Banjar',-3.3170,114.5900,2,['Sungai meluap','Tanah rendah'],'Amankan dokumen dan barang ke lantai atas.'],
        [6,'Sulawesi Selatan','Makassar',-5.1477,119.4327,1,['Drainase lokal'],'Tetap pantau peringatan BMKG sebelum bepergian.']
      ].map((row) => ({
        id: row[0],
        provinsi: row[1],
        kabupaten: row[2],
        koordinat_lat: row[3],
        koordinat_lng: row[4],
        level_risiko: row[5],
        faktor_risiko: row[6],
        rekomendasi: row[7]
      }));
      await putMany(database, 'risk_zones', zones);
    }
  }

  function putMany(database, storeName, records) {
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      records.forEach((record) => store.put(record));
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async function setupDB() {
    db = await openDB();
    await seedIfEmpty(db);
  }

  async function getAll(storeName) {
    if (!db) db = await openDB();
    return new Promise((resolve, reject) => {
      const request = db.transaction(storeName).objectStore(storeName).getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function addRecord(storeName, record) {
    if (!db) db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const request = transaction.objectStore(storeName).add(record);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  window.floodDB = { setupDB, getAll, addRecord };
})();
