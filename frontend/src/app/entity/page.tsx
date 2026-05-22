'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Database, Info, Network } from 'lucide-react';
import dynamic from 'next/dynamic';

const GraphVisualizer = dynamic(() => import('../components/GraphVisualizer'), { ssr: false });

interface EntityData {
  uri: string;
  outgoing: { predicate: string; object: string }[];
  incoming: { subject: string; predicate: string }[];
}

function EntityContent() {
  const searchParams = useSearchParams();
  const uri = searchParams.get('uri');
  const [data, setData] = useState<EntityData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    if (uri) {
      setLoading(true);
      setData(null);
      fetch(`http://localhost:8000/api/entity?uri=${encodeURIComponent(uri)}`)
        .then(res => {
          if (!res.ok) throw new Error(`Server error: ${res.status}`);
          return res.json();
        })
        .then(resData => {
          if (!ignore) {
            setData(resData);
            setLoading(false);
          }
        })
        .catch(err => {
          if (!ignore) {
            console.error(err);
            setLoading(false);
          }
        });
    }
    return () => { ignore = true; };
  }, [uri]);

  if (!uri) return <div className="p-8 text-center text-stone-400">URI tidak ditemukan</div>;
  if (loading) return <div className="p-8 text-center text-amber-500 animate-pulse">Memuat entitas...</div>;
  if (!data) return <div className="p-8 text-center text-red-500">Gagal memuat entitas</div>;

  const entityName = uri.substring(uri.lastIndexOf('#') + 1) || uri.substring(uri.lastIndexOf('/') + 1);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 animate-in fade-in duration-700">
      <Link href="/" className="inline-flex items-center gap-2 text-stone-400 hover:text-amber-500 mb-8 transition-colors">
        <ArrowLeft size={20} /> Kembali ke Pencarian
      </Link>

      <div className="mb-10 p-8 bg-stone-900 rounded-3xl ring-1 ring-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
           <Database size={120} />
        </div>
        <h1 className="text-4xl font-black text-white mb-2 relative z-10">{entityName}</h1>
        <p className="text-stone-500 font-mono text-sm break-all relative z-10 bg-stone-950/50 p-2 rounded-lg inline-block border border-white/5 mt-2">
          {uri}
        </p>
      </div>

      <div className="mb-10">
        <h2 className="text-xl font-bold text-blue-500 mb-6 flex items-center gap-2">
          <Network size={20} /> Visualisasi Graf Entitas
        </h2>
        <GraphVisualizer uri={uri} outgoing={data.outgoing} incoming={data.incoming} />
      </div>

      <div className="space-y-6">
        <div className="bg-stone-900/50 rounded-3xl p-8 ring-1 ring-white/10">
          <h2 className="text-xl font-bold text-amber-500 mb-6 flex items-center gap-2">
            <Info size={20} /> Informasi Ontologi (RDF Triples)
          </h2>
          
          <div className="space-y-4">
            {data.outgoing.map((rel, i) => {
              const predicateName = rel.predicate.substring(rel.predicate.lastIndexOf('#') + 1) || rel.predicate.substring(rel.predicate.lastIndexOf('/') + 1);
              const isUri = rel.object.startsWith('http');
              const objectName = isUri 
                  ? (rel.object.substring(rel.object.lastIndexOf('#') + 1) || rel.object.substring(rel.object.lastIndexOf('/') + 1))
                  : rel.object;

              return (
                <div key={i} className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 pb-4 border-b border-white/5 last:border-0">
                  <div className="w-full md:w-1/3 text-stone-500 font-mono text-sm">
                    {predicateName}
                  </div>
                  <div className="flex-1">
                    {isUri ? (
                       <Link href={`/entity?uri=${encodeURIComponent(rel.object)}`} className="text-amber-400 hover:underline inline-flex items-center gap-1 font-medium bg-amber-500/10 px-2 py-1 rounded">
                         {objectName}
                       </Link>
                    ) : (
                       <span className="text-stone-300 bg-stone-800/50 px-3 py-1.5 rounded text-sm block">
                         "{rel.object}"
                       </span>
                    )}
                  </div>
                </div>
              );
            })}
            {data.outgoing.length === 0 && <div className="text-stone-500 text-sm">Tidak ada data</div>}
          </div>
        </div>

        {data.incoming.length > 0 && (
          <div className="bg-stone-900/50 rounded-3xl p-8 ring-1 ring-white/10 mt-6">
            <h2 className="text-xl font-bold text-stone-400 mb-6 flex items-center gap-2">
              <Database size={20} /> Entitas yang Merujuk ke Sini
            </h2>
            <div className="space-y-4">
              {data.incoming.map((rel, i) => {
                const predicateName = rel.predicate.substring(rel.predicate.lastIndexOf('#') + 1) || rel.predicate.substring(rel.predicate.lastIndexOf('/') + 1);
                const subjectName = rel.subject.substring(rel.subject.lastIndexOf('#') + 1) || rel.subject.substring(rel.subject.lastIndexOf('/') + 1);

                return (
                  <div key={i} className="flex items-center gap-4">
                    <Link href={`/entity?uri=${encodeURIComponent(rel.subject)}`} className="text-blue-400 hover:underline bg-blue-500/10 px-2 py-1 rounded text-sm">
                      {subjectName}
                    </Link>
                    <span className="text-stone-600 text-xs font-mono">menghubungkan via</span>
                    <span className="text-stone-500 font-mono text-xs bg-stone-900 px-2 py-1 rounded border border-white/5">{predicateName}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function EntityPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-amber-500">Menyiapkan halaman...</div>}>
      <EntityContent />
    </Suspense>
  );
}
