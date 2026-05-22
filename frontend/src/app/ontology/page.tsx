'use client';
import { useEffect, useState } from 'react';
import { Network, Search, Database } from 'lucide-react';
import Link from 'next/link';

interface OntologyData {
  classes: string[];
  properties: string[];
}

export default function OntologyPage() {
  const [data, setData] = useState<OntologyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:8000/api/ontology')
      .then(res => {
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return res.json();
      })
      .then(resData => {
        setData(resData);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 animate-in fade-in duration-700">
      <div className="text-center mb-12 space-y-4">
        <div className="inline-flex items-center justify-center p-4 bg-amber-500/10 rounded-full mb-4">
          <Network className="text-amber-500" size={40} />
        </div>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500 pb-2">
          Struktur Ontologi
        </h1>
        <p className="text-lg text-stone-400 max-w-2xl mx-auto font-light">
          Jelajahi kelas dan properti yang mendefinisikan *Knowledge Graph* Pustaka Rasa Nusantara.
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-amber-500 animate-pulse flex flex-col items-center gap-4">
          <Database size={40} className="animate-bounce" />
          <p>Menganalisis skema RDF...</p>
        </div>
      ) : !data ? (
        <div className="p-8 text-center text-red-500 bg-red-500/10 rounded-2xl">
          Gagal terhubung ke *SPARQL Endpoint*. Pastikan backend berjalan.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-8">
          
          <div className="bg-stone-900/50 backdrop-blur-xl rounded-3xl p-8 ring-1 ring-white/10 relative overflow-hidden group hover:ring-blue-500/50 transition-all">
            <div className="absolute -right-10 -top-10 opacity-5 group-hover:opacity-10 transition-opacity">
              <Database size={160} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm">C</span>
              Kelas (Classes)
            </h2>
            <div className="space-y-3 relative z-10">
              {data.classes.map((cls, idx) => (
                <div key={idx} className="bg-stone-950 p-4 rounded-xl border border-white/5 text-stone-300 font-mono text-sm break-all flex items-center justify-between group/item hover:border-blue-500/30 transition-colors">
                   <span>{cls}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-stone-900/50 backdrop-blur-xl rounded-3xl p-8 ring-1 ring-white/10 relative overflow-hidden group hover:ring-amber-500/50 transition-all">
            <div className="absolute -right-10 -top-10 opacity-5 group-hover:opacity-10 transition-opacity">
              <Network size={160} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-sm">P</span>
              Properti (Properties)
            </h2>
            <div className="space-y-3 relative z-10">
              {data.properties.map((prop, idx) => (
                <div key={idx} className="bg-stone-950 p-4 rounded-xl border border-white/5 text-stone-300 font-mono text-sm break-all flex items-center justify-between group/item hover:border-amber-500/30 transition-colors">
                  <span>{prop}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      <div className="mt-16 text-center">
        <Link href="/sparql" className="inline-flex items-center gap-2 px-6 py-3 bg-stone-800 hover:bg-stone-700 text-white rounded-full transition-colors text-sm font-medium">
          <Search size={16} /> Lakukan Kueri Kustom (SPARQL)
        </Link>
      </div>
    </div>
  );
}
