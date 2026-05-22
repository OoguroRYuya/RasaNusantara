'use client';
import { useState, FormEvent } from 'react';
import Link from 'next/link';

interface KulinerData {
  uri: string;
  nama: string;
  asal: string;
  etimologi: string;
  bahanUtama: string[];
}

export default function Home() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<KulinerData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSearched(true);
    setError('');
    
    try {
      const res = await fetch(`http://localhost:8000/api/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      setResults(data.data || []);
    } catch (err: any) {
      console.error("Error fetching data:", err);
      setError(err.message || 'Gagal terhubung ke server');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen relative overflow-hidden selection:bg-amber-500/30">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-amber-600/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-orange-600/10 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-16 sm:py-24">
        <div className="text-center mb-12 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500 pb-2">
            Pencarian Semantik Kuliner
          </h1>
          <p className="text-lg sm:text-xl text-stone-400 max-w-2xl mx-auto font-light">
            Eksplorasi Semantic Web: Asal Daerah, Etimologi, dan Bahan Utama Kuliner Nusantara
          </p>
        </div>

        <div className="max-w-2xl mx-auto mb-16 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-150">
          <form onSubmit={handleSearch} className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative flex items-center bg-stone-900 rounded-2xl ring-1 ring-white/10 overflow-hidden shadow-2xl">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari nama makanan (misal: 'ketoprak')..."
                className="w-full bg-transparent px-6 py-4 text-lg text-white placeholder-stone-500 outline-none"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-4 bg-amber-500 hover:bg-amber-400 text-stone-900 font-semibold transition-colors flex items-center gap-2"
              >
                {loading ? (
                  <span className="animate-spin text-xl">↻</span>
                ) : (
                  <span>Cari</span>
                )}
              </button>
            </div>
          </form>
        </div>

        {searched && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm">
                ⚠ {error}. Pastikan backend berjalan di <code className="bg-stone-800 px-1 rounded">localhost:8000</code>.
              </div>
            )}
            <h2 className="text-xl font-medium mb-6 flex items-center gap-3 text-stone-300">
              <span className="text-amber-500">✦</span>
              {error
                ? 'Terjadi kesalahan'
                : results.length > 0 
                  ? `Ditemukan ${results.length} kuliner` 
                  : "Tidak ditemukan hasil."}
              <span className="h-px bg-white/10 flex-grow ml-4"></span>
            </h2>

            <div className="grid grid-cols-1 gap-6">
              {results.map((item, index) => (
                <Link href={`/entity?uri=${encodeURIComponent(item.uri)}`} key={index}>
                  <div className="group relative bg-stone-900/50 backdrop-blur-xl rounded-3xl p-8 ring-1 ring-white/10 hover:ring-amber-500/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_30px_-5px_rgba(245,158,11,0.2)] flex flex-col md:flex-row gap-8">
                    
                    {/* Kiri: Info Dasar */}
                    <div className="flex-1 space-y-4">
                      <div>
                        <h3 className="text-3xl font-bold text-white mb-2 group-hover:text-amber-400 transition-colors">
                          {item.nama}
                        </h3>
                        <span className="inline-flex items-center rounded-full bg-stone-800 px-3 py-1 text-xs font-medium text-amber-400 ring-1 ring-inset ring-amber-500/20">
                          {item.asal}
                        </span>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-stone-500 uppercase tracking-wider mb-1">Sejarah / Etimologi</h4>
                        <p className="text-stone-300 leading-relaxed text-sm">
                          {item.etimologi}
                        </p>
                      </div>
                    </div>

                    {/* Kanan: Bahan Utama */}
                    <div className="w-full md:w-64 flex-shrink-0 bg-stone-950/50 rounded-2xl p-5 border border-white/5">
                      <h4 className="text-sm font-medium text-stone-500 uppercase tracking-wider mb-3">Bahan Utama</h4>
                      <div className="flex flex-wrap gap-2">
                        {item.bahanUtama.map((bahan, idx) => (
                          <span key={idx} className="bg-stone-800 text-stone-300 text-xs px-2.5 py-1 rounded-md border border-white/5">
                            {bahan}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="absolute top-8 right-8 text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1 hidden md:block">
                      →
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
