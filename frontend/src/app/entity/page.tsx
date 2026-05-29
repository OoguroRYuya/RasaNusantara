'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Database, Info, Network, Sparkles, Send, MessageSquare, Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
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

  // State untuk Asisten Kuliner AI
  const [aiNarrative, setAiNarrative] = useState<string>('');
  const [aiStatus, setAiStatus] = useState<'loading' | 'success' | 'unconfigured' | 'error'>('loading');
  const [aiErrorMsg, setAiErrorMsg] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<{ sender: 'user' | 'ai'; text: string }[]>([]);
  const [chatInput, setChatInput] = useState<string>('');
  const [chatLoading, setChatLoading] = useState<boolean>(false);
  const [reloadKey, setReloadKey] = useState<number>(0);

  // Memuat data RDF asli
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

  // Memuat analisis narasi AI (RAG)
  useEffect(() => {
    let ignore = false;
    if (uri) {
      setAiStatus('loading');
      setAiNarrative('');
      fetch(`http://localhost:8000/api/entity/ai-narrative?uri=${encodeURIComponent(uri)}`)
        .then(res => {
          if (!res.ok) throw new Error(`Server error: ${res.status}`);
          return res.json();
        })
        .then(resData => {
          if (!ignore) {
            if (resData.status === 'unconfigured') {
              setAiStatus('unconfigured');
              setAiNarrative(resData.narrative);
            } else if (resData.status === 'success') {
              setAiStatus('success');
              setAiNarrative(resData.narrative);
            } else {
              setAiStatus('error');
              setAiErrorMsg(resData.narrative || 'Gagal memuat analisis');
            }
          }
        })
        .catch(err => {
          if (!ignore) {
            console.error(err);
            setAiStatus('error');
            setAiErrorMsg(err.message || 'Gagal memuat data AI dari backend.');
          }
        });
    }
    return () => { ignore = true; };
  }, [uri, reloadKey]);

  // Pengiriman pesan chat tanya-jawab AI
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading || !uri) return;

    const userMsg = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setChatLoading(true);

    try {
      const res = await fetch('http://localhost:8000/api/entity/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uri: uri,
          question: userMsg,
          history: chatMessages
        }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.detail || 'Gagal mendapatkan jawaban AI');

      if (resData.status === 'success') {
        setChatMessages(prev => [...prev, { sender: 'ai', text: resData.reply }]);
      } else {
        setChatMessages(prev => [...prev, { sender: 'ai', text: `⚠️ ${resData.reply}` }]);
      }
    } catch (err: any) {
      console.error(err);
      setChatMessages(prev => [...prev, { sender: 'ai', text: `⚠️ Terjadi kesalahan: ${err.message}` }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Parser cetak tebal Markdown kustom (ringan & 100% aman)
  const parseBold = (text: string) => {
    const parts = text.split(/\*\*([^*]+)\*\*/g);
    return parts.map((part, i) => i % 2 === 1 ? <strong key={i} className="font-semibold text-white">{part}</strong> : part);
  };

  // Parser Markdown lengkap kustom untuk render narasi & chat
  const renderMarkdown = (text: string) => {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, index) => {
      let trimmed = line.trim();
      if (trimmed.startsWith('###')) {
        return (
          <h4 key={index} className="text-base font-extrabold text-amber-400 mt-6 mb-2 flex items-center gap-1.5 border-l-2 border-amber-500 pl-2">
            {trimmed.replace(/^###\s*/, '')}
          </h4>
        );
      }
      if (trimmed.startsWith('##')) {
        return (
          <h3 key={index} className="text-lg font-black text-amber-500 mt-8 mb-3 border-b border-white/5 pb-1.5 flex items-center gap-2">
            ✦ {trimmed.replace(/^##\s*/, '')}
          </h3>
        );
      }
      if (trimmed.startsWith('#')) {
        return (
          <h2 key={index} className="text-xl font-black text-white mt-10 mb-4">
            {trimmed.replace(/^#\s*/, '')}
          </h2>
        );
      }
      if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
        const content = trimmed.replace(/^[-*]\s*/, '');
        return (
          <li key={index} className="ml-4 list-disc text-stone-300 text-sm leading-relaxed mb-1.5 pl-1">
            {parseBold(content)}
          </li>
        );
      }
      if (trimmed === '') {
        return <div key={index} className="h-2" />;
      }
      return (
        <p key={index} className="text-stone-300 text-sm leading-relaxed mb-3 text-justify">
          {parseBold(trimmed)}
        </p>
      );
    });
  };

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

      {/* SECTION ASISTEN KULINER AI RAG */}
      <div className="mb-10 bg-gradient-to-br from-stone-900/80 to-amber-950/20 rounded-3xl p-8 ring-1 ring-amber-500/20 shadow-2xl relative overflow-hidden">
        <div className="absolute top-[-20%] right-[-20%] w-[30%] h-[50%] rounded-full bg-amber-500/10 blur-[80px] pointer-events-none" />
        
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5 relative z-10">
          <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 flex items-center gap-3">
            <Sparkles size={24} className="text-amber-400 animate-pulse" />
            Asisten Kuliner AI RasaNusantara
          </h2>
          {aiStatus !== 'loading' && (
            <button 
              onClick={() => setReloadKey(prev => prev + 1)}
              className="p-2 text-stone-400 hover:text-amber-400 bg-stone-800/50 hover:bg-stone-800 rounded-xl transition-all border border-white/5"
              title="Segarkan Analisis AI"
            >
              <RefreshCw size={16} />
            </button>
          )}
        </div>

        <div className="relative z-10 space-y-6">
          {aiStatus === 'loading' && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3 text-amber-500 animate-pulse text-sm">
                <Loader2 size={18} className="animate-spin" />
                <span>Memulai analisis semantik & meracik penjelasan...</span>
              </div>
              <div className="space-y-2 animate-pulse">
                <div className="h-4 bg-stone-800 rounded-md w-3/4" />
                <div className="h-4 bg-stone-800 rounded-md w-full" />
                <div className="h-4 bg-stone-800 rounded-md w-5/6" />
                <div className="h-4 bg-stone-800 rounded-md w-2/3" />
              </div>
            </div>
          )}

          {aiStatus === 'unconfigured' && (
            <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-6 space-y-4">
              <div className="flex items-start gap-3 text-amber-500">
                <AlertTriangle size={24} className="flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white text-base">Asisten AI Belum Aktif</h4>
                  <p className="text-stone-400 text-sm mt-1">
                    Wah, fitur kecerdasan buatan belum diaktifkan karena kunci API Gemini belum diset pada backend.
                  </p>
                </div>
              </div>
              <div className="bg-stone-950/80 p-4 rounded-xl border border-white/5 font-mono text-xs text-stone-400 space-y-2">
                <p className="text-white font-semibold">Cara Mengaktifkan:</p>
                <p>1. Dapatkan API Key gratis di <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="text-amber-400 underline hover:text-amber-300">Google AI Studio</a>.</p>
                <p>2. Buka atau buat berkas <code className="text-amber-400 bg-stone-900 px-1 py-0.5 rounded">.env</code> di dalam folder <code className="bg-stone-900 px-1 py-0.5 rounded">backend</code>.</p>
                <p>3. Masukkan kunci API Anda:</p>
                <pre className="text-emerald-400 bg-stone-900/50 p-2 rounded border border-white/5 mt-1">GEMINI_API_KEY=KUNCI_API_GEMINI_ANDA</pre>
                <p>4. Setelah disimpan, jalankan ulang backend atau klik tombol segarkan di bawah ini.</p>
              </div>
              <button 
                onClick={() => setReloadKey(prev => prev + 1)}
                className="w-full sm:w-auto px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-900 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-amber-500/10"
              >
                <RefreshCw size={14} /> Segarkan & Coba Lagi
              </button>
            </div>
          )}

          {aiStatus === 'error' && (
            <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-6 text-sm text-red-400 space-y-3">
              <div className="flex items-center gap-2 font-bold text-white">
                <AlertTriangle size={18} />
                <span>Gagal Terhubung dengan AI</span>
              </div>
              <p>{aiErrorMsg}</p>
              <button 
                onClick={() => setReloadKey(prev => prev + 1)}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-white rounded-xl font-medium transition-all text-xs border border-white/5"
              >
                Coba Lagi
              </button>
            </div>
          )}

          {aiStatus === 'success' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="prose prose-invert max-w-none text-stone-300">
                {renderMarkdown(aiNarrative)}
              </div>

              <div className="mt-8 border-t border-white/5 pt-8 space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <MessageSquare size={18} className="text-blue-400" />
                  Tanya Asisten AI tentang {entityName}
                </h3>
                <p className="text-xs text-stone-500">
                  Ajukan pertanyaan seputar asal daerah, resep rahasia, kandungan nutrisi, atau saran hidangan pelengkap makanan ini.
                </p>

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 bg-stone-950/40 border border-white/5 rounded-2xl p-4">
                  {chatMessages.length === 0 ? (
                    <div className="text-center py-6 text-stone-600 text-xs italic">
                      Belum ada percakapan. Mulai tanya AI di bawah!
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {chatMessages.map((msg, i) => (
                        <div 
                          key={i} 
                          className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                            msg.sender === 'user' 
                              ? 'bg-amber-500 text-stone-950 font-medium rounded-tr-none' 
                              : 'bg-stone-900 border border-white/5 text-stone-200 rounded-tl-none prose prose-invert max-w-none'
                          }`}>
                            {msg.sender === 'user' ? msg.text : renderMarkdown(msg.text)}
                          </div>
                        </div>
                      ))}
                      {chatLoading && (
                        <div className="flex justify-start animate-pulse">
                          <div className="bg-stone-900 border border-white/5 text-stone-400 rounded-2xl rounded-tl-none px-4 py-2.5 text-sm flex items-center gap-2">
                            <Loader2 size={14} className="animate-spin text-amber-500" />
                            <span>AI sedang meracik jawaban...</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <form onSubmit={handleChatSubmit} className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder={`Tanyakan hal baru tentang ${entityName}...`}
                    disabled={chatLoading}
                    className="flex-1 bg-stone-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-white placeholder-stone-600 focus:outline-none focus:border-amber-500/50 transition-all disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={chatLoading || !chatInput.trim()}
                    className="bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl px-4 py-3 flex items-center justify-center transition-all disabled:opacity-50"
                  >
                    <Send size={16} />
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
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
