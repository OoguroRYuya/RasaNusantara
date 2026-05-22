'use client';
import { useState } from 'react';
import { Code, Play, AlertCircle } from 'lucide-react';

export default function SparqlPage() {
  const [query, setQuery] = useState(`PREFIX kul: <http://nusantara.org/ontology/kuliner#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?nama ?asal WHERE {
  ?m a kul:Makanan ;
     kul:namaIstilah ?nama ;
     kul:asalDaerah ?asalUri .
  ?asalUri rdfs:label ?asal .
}`);
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const executeSparql = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:8000/api/sparql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Terjadi kesalahan eksekusi kueri');
      
      setResults(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row items-center gap-6 mb-10">
        <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center flex-shrink-0">
          <Code className="text-blue-500" size={32} />
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">
            SPARQL Endpoint Editor
          </h1>
          <p className="text-stone-400">
            Tulis dan eksekusi kueri SPARQL secara langsung ke dalam sistem berbasis RDF/Turtle.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        
        {/* Editor Kiri */}
        <div className="space-y-4">
          <div className="bg-stone-900 rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
            <div className="bg-stone-950 px-4 py-3 border-b border-white/5 flex items-center justify-between">
              <span className="text-sm font-mono text-stone-400">Editor SPARQL</span>
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                <div className="w-3 h-3 rounded-full bg-amber-500/50"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
              </div>
            </div>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              spellCheck="false"
              className="w-full h-[400px] bg-stone-900 text-stone-300 font-mono text-sm p-4 outline-none resize-none"
            />
          </div>
          
          <button
            onClick={executeSparql}
            disabled={loading}
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span className="animate-pulse">Mengeksekusi...</span>
            ) : (
              <>
                <Play size={18} fill="currentColor" /> Eksekusi Kueri
              </>
            )}
          </button>
        </div>

        {/* Hasil Kanan */}
        <div className="bg-stone-900/50 backdrop-blur-xl rounded-2xl p-6 border border-white/5 h-[500px] overflow-auto flex flex-col">
          <h3 className="text-lg font-bold text-white mb-4">Hasil Eksekusi</h3>
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex gap-3 text-sm">
              <AlertCircle size={20} className="flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {!error && !results && !loading && (
            <div className="flex-1 flex flex-col items-center justify-center text-stone-500 text-center">
              <Code size={48} className="mb-4 opacity-20" />
              <p>Tekan tombol eksekusi untuk melihat hasil kembalian (bindings) dari kueri SPARQL Anda.</p>
            </div>
          )}

          {!error && results && results.results && (
            <div className="animate-in fade-in duration-500">
              <div className="mb-4 flex items-center justify-between text-sm">
                <span className="text-stone-400">Ditemukan {results.results.bindings.length} baris</span>
                <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs font-mono">200 OK</span>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-stone-300">
                  <thead className="text-xs uppercase bg-stone-800 text-stone-400">
                    <tr>
                      {results.head.vars.map((v: string) => (
                        <th key={v} className="px-4 py-3 rounded-t-sm">?{v}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {results.results.bindings.map((row: any, i: number) => (
                      <tr key={i} className="border-b border-stone-800/50 hover:bg-stone-800/30">
                        {results.head.vars.map((v: string) => (
                          <td key={v} className="px-4 py-3 font-mono">
                            {row[v] ? row[v].value : <span className="text-stone-600 italic">null</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!error && results && results.message && (
             <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 p-4 rounded-xl text-sm font-mono whitespace-pre-wrap">
               {JSON.stringify(results, null, 2)}
             </div>
          )}
        </div>

      </div>
    </div>
  );
}
