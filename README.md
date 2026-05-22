# RasaNusantara 🍲

RasaNusantara adalah sebuah aplikasi *Semantic Web* yang dirancang untuk mengeksplorasi dan memvisualisasikan data Kuliner Tradisional Indonesia. Aplikasi ini menggunakan teknologi berbasis ontologi (RDF/Turtle) dan SPARQL untuk menghubungkan entitas seperti Makanan, Asal Daerah, Bahan Utama, dan Etimologi.

## 🌟 Fitur Utama
- **Pencarian Semantik:** Mencari makanan tradisional beserta asal dan komposisinya berdasarkan *knowledge graph*.
- **Visualisasi Graf:** Melihat relasi antar entitas (Makanan, Bahan, Daerah, dll) secara interaktif menggunakan *Cytoscape.js*.
- **Eksplorasi Entitas:** Menampilkan properti *incoming* dan *outgoing* dari setiap URI (entitas) dalam graf.
- **SPARQL Endpoint:** Menjalankan *query* SPARQL kustom secara langsung melalui antarmuka web.

## 🛠️ Teknologi yang Digunakan
### Backend
- **Python 3**
- **FastAPI** (Web Framework)
- **RDFLib** (Parsing & Eksekusi Query RDF/SPARQL)
- **Uvicorn** (ASGI Server)

### Frontend
- **Next.js** (React Framework)
- **Tailwind CSS** (Styling & UI)
- **Cytoscape & React-CytoscapeJS** (Visualisasi Graf Relasi)

## 🚀 Cara Menjalankan Proyek Secara Lokal

### 1. Menjalankan Backend (API)
Pastikan Anda sudah menginstal Python di komputer Anda.

```bash
# 1. Masuk ke direktori backend
cd RasaNusantara/backend

# 2. (Opsional) Buat dan aktifkan Virtual Environment
python -m venv venv
# Windows: venv\Scripts\activate
# Mac/Linux: source venv/bin/activate

# 3. Install dependensi
pip install -r requirements.txt

# 4. Jalankan server FastAPI
python main.py
```
*Backend akan berjalan dan dapat diakses di:* `http://localhost:8000`

### 2. Menjalankan Frontend (Web App)
Pastikan Anda sudah menginstal Node.js di komputer Anda.

```bash
# 1. Masuk ke direktori frontend
cd RasaNusantara/frontend

# 2. Install semua dependensi Node.js
npm install

# 3. Jalankan server development
npm run dev
```
*Frontend akan berjalan dan dapat diakses di:* `http://localhost:3000`

## 📁 Struktur Direktori Utama
- `/RasaNusantara/backend`: Berisi *source code* API (`main.py`) dan *knowledge base* data Semantic Web dalam bentuk file Turtle (`data.ttl`).
- `/RasaNusantara/frontend`: Berisi *source code* aplikasi antarmuka Next.js.

## 📝 Catatan
Proyek ini dikembangkan sebagai bagian dari tugas/proposal proyek akhir mata kuliah *Semantic Web* (Semester 6).
