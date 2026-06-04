# RasaNusantara 🍲 — Pustaka Kuliner Tradisional Indonesia Berbasis Semantic Web & AI

**RasaNusantara** adalah sebuah aplikasi *Semantic Web* inovatif yang dirancang untuk mengeksplorasi, memvisualisasikan, dan menganalisis data Kuliner Tradisional Indonesia. Aplikasi ini menggabungkan kekuatan **Knowledge Graph** berbasis ontologi (RDF/Turtle), kueri semantik (**SPARQL**), serta integrasi Kecerdasan Buatan (**RAG - Retrieval-Augmented Generation**) menggunakan **Gemini API** untuk memberikan pengalaman interaktif seputar sejarah, filosofi, resep, dan visualisasi graf hubungan kuliner nusantara.

---

## 🌟 Fitur Utama

### 🔍 1. Pencarian Semantik (Semantic Search)
* Mencari makanan tradisional Indonesia secara dinamis berdasarkan nama istilah, asal daerah, bahan dasar, maupun nilai sejarahnya.
* Hasil pencarian menampilkan informasi dasar seperti daerah asal, ringkasan etimologi, dan tag bahan utama yang terhubung langsung di dalam graf RDF.

### 🌐 2. Visualisasi Graf Interaktif (Interactive Graph Visualizer)
* Visualisasi graf relasi interaktif berbasis **Cytoscape.js** pada halaman detail entitas.
* Menampilkan relasi semantik yang menghubungkan hidangan utama dengan entitas daerah asal, bahan-bahan pendukung, hingga kategori kuliner lainnya secara visual (Node warna-warni untuk membedakan Entitas Utama, Relasi URI, dan Nilai Literal).

### 📖 3. Eksplorasi RDF Triples (Incoming & Outgoing Properties)
* Menampilkan detail lengkap data ontologi asli dalam bentuk tabel triple RDF (*Subject-Predicate-Object*).
* Memisahkan properti keluar (*outgoing*) dan properti masuk (*incoming*) untuk penelusuran graf yang lebih mendalam secara dua arah.

### 🤖 4. Asisten Kuliner AI Terintegrasi (AI Culinary Assistant & Chatbot)
* **AI Narrative Generation (RAG):** Menggunakan Gemini API untuk mengekstrak data RDF dari ontologi kuliner, lalu menghasilkan narasi kaya akan filosofi budaya, sejarah mendalam, resep tradisional praktis rumahan, dan tips penyajian secara otomatis.
* **Interactive AI Chat:** Chatbot interaktif *real-time* yang memungkinkan pengguna bertanya lebih lanjut seputar hidangan yang sedang dibuka (misal: "Apa alternatif bahan x?", "Bagaimana cara menyimpannya agar awet?").

### 💻 5. SPARQL Endpoint Editor
* Menjalankan kueri SPARQL kustom secara langsung melalui editor berbasis web yang interaktif.
* Menampilkan hasil pencarian dalam bentuk tabel data tabular interaktif yang rapi dan mudah dibaca.

---

## 🛠️ Teknologi yang Digunakan

### Backend (API & Knowledge Base)
* **Python 3.10+**
* **FastAPI** (Web API Framework berkinerja tinggi)
* **RDFLib** (Library Python untuk parsing file Turtle `.ttl` dan pengeksekusian kueri SPARQL)
* **Google Generative AI SDK** (Integrasi model bahasa besar `gemini-2.5-flash` untuk narasi dan chatbot)
* **Uvicorn** (Server ASGI lokal)

### Frontend (User Interface)
* **Next.js 16** (React Framework modern dengan App Router)
* **Tailwind CSS** (Desain antarmuka premium bertema gelap/*dark mode* dan responsif)
* **Cytoscape.js & React-CytoscapeJS** (Library visualisasi graf relasi jaringan)
* **Lucide React** (Koleksi ikon modern)

---

## 🚀 Panduan Instalasi dan Menjalankan Proyek

Pastikan komputer Anda sudah terinstal **Python 3.10+**, **Node.js 18+**, dan **Git**.

### Langkah 1: Klon Repositori
Buka terminal/command prompt Anda, lalu jalankan:
```bash
git clone https://github.com/OoguroRYuya/RasaNusantara.git
cd RasaNusantara
```

### Langkah 2: Setup dan Menjalankan Backend (API)

1. Masuk ke direktori backend:
   ```bash
   cd backend
   ```

2. Buat Virtual Environment (Opsional tetapi sangat disarankan):
   ```bash
   python -m venv venv
   ```

3. Aktifkan Virtual Environment:
   * **Windows (PowerShell/CMD):**
     ```powershell
     .\venv\Scripts\activate
     ```
   * **macOS / Linux:**
     ```bash
     source venv/bin/activate
     ```

4. Instal seluruh dependensi Python:
   ```bash
   pip install -r requirements.txt
   ```

5. Konfigurasi Kunci API Gemini:
   * Salin berkas `.env.example` menjadi `.env`:
     ```bash
     cp .env.example .env
     ```
   * Buka berkas `.env` baru tersebut, lalu ganti nilai `GEMINI_API_KEY` dengan kunci API Gemini Anda sendiri. Kunci API Gemini dapat diperoleh secara **gratis** melalui **[Google AI Studio](https://aistudio.google.com/)**.
     ```env
     GEMINI_API_KEY=AIzaSyYourRealGeminiApiKeyHere
     ```
     *(Catatan: Jika API Key tidak diatur atau dibiarkan bawaan, aplikasi tetap dapat berjalan tetapi fitur narasi AI dan chatbot akan dinonaktifkan).*

6. Jalankan server FastAPI:
   ```bash
   python main.py
   ```
   *Backend kini berjalan secara lokal di:* `http://localhost:8000`

---

### Langkah 3: Setup dan Menjalankan Frontend (Web App)

1. Buka jendela terminal baru dan masuk ke direktori frontend:
   ```bash
   cd RasaNusantara/frontend
   ```

2. Instal dependensi Node.js:
   ```bash
   npm install
   ```

3. Jalankan server pengembangan Next.js:
   ```bash
   npm run dev
   ```
   *Frontend kini berjalan secara lokal di:* `http://localhost:3000`

---

## 📖 Panduan Pemakaian Aplikasi Web

Setelah kedua server berjalan, buka browser Anda dan navigasikan ke `http://localhost:3000`.

### 1. Halaman Pencarian (Home - `/`)
* **Cara Menggunakan:** Ketik kata kunci kuliner yang ingin Anda cari (misal: `ketoprak`, `gudeg`, `rendang`, atau daerah tertentu seperti `Jakarta`) pada kolom pencarian utama, kemudian klik tombol **Cari**.
* **Interaksi:** Hasil pencarian akan tampil di bawah kolom pencarian. Klik kartu kuliner yang muncul untuk diarahkan ke halaman detail entitas tersebut.

### 2. Halaman Detail Entitas & Visualisasi Graf (`/entity?uri=...`)
Halaman ini terbagi menjadi 3 bagian utama:
* **Visualisasi Graf:** Di bagian atas, sebuah graf visual akan dimuat secara otomatis. Anda dapat melakukan *zoom in/out*, menggeser graf, atau memindahkan node untuk melihat bagaimana entitas makanan terhubung dengan bahan dan daerah asal secara langsung.
* **Asisten Kuliner AI (RAG):**
  * Jika API Key sudah diset, Anda akan langsung melihat analisis narasi sejarah, filosofi, resep tradisional praktis, dan tips penyajian dari hidangan tersebut.
  * Anda bisa berinteraksi langsung melalui kolom tanya jawab di bagian bawah blok AI untuk menanyakan info tambahan spesifik mengenai hidangan tersebut.
* **Informasi Ontologi (RDF Triples):** Di bagian paling bawah, Anda dapat melihat tabel properti relasi keluar (*outgoing*) dan properti masuk (*incoming*) dalam struktur RDF formal. Jika Anda mengklik tautan URI pada kolom nilai, Anda akan langsung berpindah ke halaman entitas terkait.

### 3. Halaman Struktur Ontologi (`/ontology`)
* **Cara Menggunakan:** Klik menu **Ontologi** di bilah navigasi atas.
* **Interaksi:** Halaman ini menampilkan skema dasar yang digunakan di dalam *Knowledge Graph* RasaNusantara. Anda dapat melihat daftar Kelas (*Classes*) dan Properti (*Properties*) ontologi kuliner yang telah terdaftar dalam berkas RDF.

### 4. SPARQL Endpoint Editor (`/sparql`)
* **Cara Menggunakan:** Klik menu **SPARQL** di bilah navigasi atas.
* **Interaksi:** Anda akan disuguhkan editor kode untuk menulis kueri SPARQL Anda sendiri secara kustom. Klik tombol **Eksekusi Kueri** untuk mengeksekusi kueri ke basis data Turtle backend. Hasil kueri akan langsung ditampilkan di kolom bagian kanan dalam bentuk tabel.

#### Contoh Kueri SPARQL yang Bisa Anda Coba:
**Kueri 1: Menampilkan seluruh makanan beserta asal daerahnya**
```sparql
PREFIX kul: <http://nusantara.org/ontology/kuliner#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?nama ?asal WHERE {
  ?m a kul:Makanan ;
     kul:namaIstilah ?nama ;
     kul:asalDaerah ?asalUri .
  ?asalUri rdfs:label ?asal .
}
```

**Kueri 2: Mencari makanan yang menggunakan bahan utama "Bawang Putih"**
```sparql
PREFIX kul: <http://nusantara.org/ontology/kuliner#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?namaMakanan WHERE {
  ?m a kul:Makanan ;
     kul:namaIstilah ?namaMakanan ;
     kul:bahanUtama ?bahan .
  ?bahan rdfs:label "Bawang Putih" .
}
```

---

## 📁 Struktur Direktori Proyek

```text
RasaNusantara/
│
├── backend/
│   ├── data.ttl             # Knowledge Base RDF/Turtle Kuliner Tradisional
│   ├── main.py              # Server FastAPI, API endpoint, & Logika Integrasi RAG Gemini
│   ├── requirements.txt     # Daftar dependensi modul Python
│   ├── .env.example         # Templat berkas konfigurasi lingkungan
│   └── .env                 # Berkas konfigurasi lingkungan privat (Gemini API Key)
│
├── frontend/
│   ├── src/
│   │   └── app/
│   │       ├── components/  # Komponen pendukung (GraphVisualizer.tsx)
│   │       ├── entity/      # Halaman detail entitas & Asisten AI
│   │       ├── ontology/    # Halaman visualisasi kelas & properti
│   │       ├── sparql/      # Halaman editor SPARQL & eksekusi kueri
│   │       ├── layout.tsx   # Kerangka dasar web & navigasi
│   │       └── page.tsx     # Halaman beranda pencarian semantik
│   ├── package.json         # Konfigurasi dependensi project Next.js/Node.js
│   └── README.md            # Dokumentasi frontend bawaan Next.js
│
└── README.md                # Dokumentasi utama proyek RasaNusantara (Berkas ini)
```

---

## 📝 Catatan Proyek
Proyek ini dikembangkan sebagai bagian dari tugas proyek akhir mata kuliah **Semantic Web** (Semester 6) untuk memperagakan implementasi *Knowledge Graph*, pemodelan ontologi RDF, query engine SPARQL, dan pemanfaatan asisten AI berbasis RAG pada data kebudayaan nusantara.
