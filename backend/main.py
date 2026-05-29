from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from rdflib import Graph, Namespace
from rdflib.plugins.sparql.processor import SPARQLResult
import os
import google.generativeai as genai
from dotenv import load_dotenv

# Memuat berkas .env untuk membaca API Key
load_dotenv()

app = FastAPI(title="Semantic Web API - Kuliner Tradisional")

# Konfigurasi client Gemini jika API Key tersedia
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
if GEMINI_API_KEY and "YourGeminiApiKey" not in GEMINI_API_KEY and GEMINI_API_KEY != "AIzaSyPlaceholderKeyForTesting" and GEMINI_API_KEY.strip():
    genai.configure(api_key=GEMINI_API_KEY.strip())

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

g = Graph()
rdf_file = os.path.join(os.path.dirname(__file__), "data.ttl")
g.parse(rdf_file, format="turtle")

KUL = Namespace("http://nusantara.org/ontology/kuliner#")

class SparqlRequest(BaseModel):
    query: str

@app.get("/")
def read_root():
    return {"message": "Welcome to Semantic Web API for Kuliner Tradisional (Proposal Version)"}

def _sanitize_sparql_string(value: str) -> str:
    """Escape special characters to prevent SPARQL injection."""
    return value.replace("\\", "\\\\").replace('"', '\\"').replace("'", "\\'")

@app.get("/api/search")
def search_kuliner(q: str = Query("", description="Kata kunci pencarian")):
    query = """
    PREFIX kul: <http://nusantara.org/ontology/kuliner#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

    SELECT DISTINCT ?uri ?nama ?asal ?etimologi WHERE {
      ?uri a kul:Makanan ;
           kul:namaIstilah ?nama ;
           kul:asalDaerah ?asalUri ;
           kul:etimologi ?etimologi .
      ?asalUri rdfs:label ?asal .
    """
    
    if q:
        safe_q = _sanitize_sparql_string(q)
        query += f"""
        FILTER(
            CONTAINS(LCASE(?nama), LCASE("{safe_q}")) || 
            CONTAINS(LCASE(?asal), LCASE("{safe_q}")) ||
            CONTAINS(LCASE(?etimologi), LCASE("{safe_q}"))
        )
        """
    query += "}"
    
    results = g.query(query)
    data = []
    
    for row in results:
        uri_str = str(row.uri)
        # Ambil bahan utama karena bentuknya URI
        ing_query = f"""
        PREFIX kul: <http://nusantara.org/ontology/kuliner#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        SELECT ?bahanName WHERE {{
            <{uri_str}> kul:bahanUtama ?bahanUri .
            ?bahanUri rdfs:label ?bahanName .
        }}
        """
        ingredients = [str(r.bahanName) for r in g.query(ing_query)]
        
        data.append({
            "uri": uri_str,
            "nama": str(row.nama),
            "asal": str(row.asal),
            "etimologi": str(row.etimologi),
            "bahanUtama": ingredients
        })
    return {"data": data}

@app.get("/api/entity")
def get_entity(uri: str):
    if not uri:
        raise HTTPException(status_code=400, detail="URI is required")
    
    # Validate URI format to prevent SPARQL injection
    if not uri.startswith("http://") and not uri.startswith("https://"):
        raise HTTPException(status_code=400, detail="Invalid URI format")
    safe_uri = uri.replace("\\", "").replace('"', '').replace("'", "").replace(">", "").replace("<", "")
    
    outgoing_query = f"""
    SELECT ?p ?o WHERE {{
        <{safe_uri}> ?p ?o .
    }}
    """
    incoming_query = f"""
    SELECT ?s ?p WHERE {{
        ?s ?p <{safe_uri}> .
    }}
    """
    
    outgoing = [{"predicate": str(r.p), "object": str(r.o)} for r in g.query(outgoing_query)]
    incoming = [{"subject": str(r.s), "predicate": str(r.p)} for r in g.query(incoming_query)]
    
    return {
        "uri": uri,
        "outgoing": outgoing,
        "incoming": incoming
    }

@app.get("/api/ontology")
def get_ontology():
    classes_query = """
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    SELECT ?class WHERE { ?class a rdfs:Class }
    """
    props_query = """
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    SELECT ?prop WHERE { ?prop a rdf:Property }
    """
    
    classes = [str(r["class"]) for r in g.query(classes_query)]
    properties = [str(r["prop"]) for r in g.query(props_query)]
    
    return {
        "classes": classes,
        "properties": properties
    }

@app.post("/api/sparql")
def execute_sparql(req: SparqlRequest):
    try:
        results = g.query(req.query)
        bindings = []
        if isinstance(results, SPARQLResult) and results.type == 'SELECT':
            for row in results:
                row_dict = {}
                for var in results.vars:
                    val = row[var]
                    if val is not None:
                        row_dict[str(var)] = {"value": str(val), "type": type(val).__name__}
                bindings.append(row_dict)
            return {"head": {"vars": [str(v) for v in results.vars]}, "results": {"bindings": bindings}}
        elif results.type in ['ASK', 'CONSTRUCT', 'DESCRIBE']:
             return {"message": "Only SELECT queries are fully formatted currently.", "type": results.type}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

class ChatRequest(BaseModel):
    uri: str
    question: str
    history: list = []

def _get_entity_context(uri: str) -> str:
    """Helper untuk mengambil hubungan RDF dari entitas sebagai konteks RAG."""
    safe_uri = uri.replace("\\", "").replace('"', '').replace("'", "").replace(">", "").replace("<", "")
    
    # Ambil label atau nama istilah
    name_query = f"""
    PREFIX kul: <http://nusantara.org/ontology/kuliner#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    SELECT ?nama WHERE {{
        <{safe_uri}> kul:namaIstilah|rdfs:label ?nama .
    }} LIMIT 1
    """
    name_res = list(g.query(name_query))
    if name_res and name_res[0].nama:
        name = str(name_res[0].nama)
    else:
        name = uri.split("#")[-1].split("/")[-1]
        
    # Ambil hubungan keluar (outgoing properties)
    out_query = f"""
    SELECT ?p ?o WHERE {{
        <{safe_uri}> ?p ?o .
    }}
    """
    outgoing = []
    for r in g.query(out_query):
        p_name = str(r.p).split("#")[-1].split("/")[-1]
        o_val = str(r.o)
        if o_val.startswith("http"):
            o_val = o_val.split("#")[-1].split("/")[-1]
        outgoing.append(f"- {p_name}: {o_val}")
        
    # Ambil hubungan masuk (incoming properties)
    in_query = f"""
    SELECT ?s ?p WHERE {{
        ?s ?p <{safe_uri}> .
    }}
    """
    incoming = []
    for r in g.query(in_query):
        s_name = str(r.s).split("#")[-1].split("/")[-1]
        p_name = str(r.p).split("#")[-1].split("/")[-1]
        incoming.append(f"- {s_name} (sebagai {p_name})")
        
    context = f"Nama Entitas Kuliner: {name}\nURI: {uri}\n\nKarakteristik & Hubungan RDF Terdaftar:\n"
    context += "\n".join(outgoing) if outgoing else "- Tidak ada data relasi keluar."
    context += "\n\nEntitas Terkait Lainnya (Hubungan Masuk):\n"
    context += "\n".join(incoming) if incoming else "- Tidak ada data relasi masuk."
    
    return context

@app.get("/api/entity/ai-narrative")
def get_ai_narrative(uri: str = Query(..., description="URI entitas kuliner")):
    global GEMINI_API_KEY
    if not GEMINI_API_KEY or "YourGeminiApiKey" in GEMINI_API_KEY or GEMINI_API_KEY == "AIzaSyPlaceholderKeyForTesting" or not GEMINI_API_KEY.strip():
        return {
            "status": "unconfigured",
            "narrative": "### 🌟 Fitur Asisten Kuliner AI Belum Aktif\n\nUntuk menjelajahi sejarah mendalam, filosofi kebudayaan, tips penyajian, serta resep otomatis untuk kuliner ini, silakan pasang **API Key** Anda terlebih dahulu di berkas `.env` pada direktori backend:\n\n```env\nGEMINI_API_KEY=KUNCI_API_ANDA\n```\n\n*Catatan: Anda dapat membuat kunci API gratis di **[Google AI Studio](https://aistudio.google.com/)**.*"
        }
        
    try:
        context = _get_entity_context(uri)
        prompt = f"""
Anda adalah pakar kuliner tradisional Indonesia terkemuka bernama "Rasa Nusantara AI". 
Tugas Anda adalah menulis narasi kuliner tradisional yang sangat menarik, kaya akan sejarah, nilai budaya, filosofi, tips penyajian, serta resep berdasarkan data ontologi RDF terstruktur yang diberikan di bawah ini.

DATA RDF ENTITAS:
\"\"\"
{context}
\"\"\"

Format tulisan Anda dalam bahasa Indonesia yang ramah, profesional, dan menggugah selera. Gunakan format Markdown yang menarik (termasuk emoji, judul, dan daftar terformat). Jangan mengada-ada informasi yang bertentangan dengan data RDF (terutama tentang Bahan Utama dan Asal Daerah), namun Anda sangat dipersilakan menambahkan konteks sejarah umum, resep tradisional rumahan yang lezat, serta cara penyajian yang otentik.

Struktur tulisan yang diharapkan:
1. **Filosofi & Sejarah Singkat**: Ceritakan sejarah, etimologi (jika ada), atau latar belakang budaya/filosofi dari hidangan ini.
2. **Karakteristik Rasa & Bahan Utama**: Jelaskan perpaduan rasa dari bahan utama yang tercantum di data RDF.
3. **Resep Tradisional Praktis**: Tuliskan langkah-langkah singkat dan jelas cara membuat hidangan ini secara rumahan.
4. **Tips Penyajian**: Bagaimana cara terbaik menyajikan hidangan ini agar rasanya lebih menggugah selera.

Buatlah tulisan yang rapi, bersih, dan menggugah selera!
"""
        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content(prompt)
        
        return {
            "status": "success",
            "narrative": response.text
        }
    except Exception as e:
        return {
            "status": "error",
            "narrative": f"Gagal menghasilkan narasi AI: {str(e)}"
        }

@app.post("/api/entity/ai-chat")
def post_ai_chat(req: ChatRequest):
    global GEMINI_API_KEY
    if not GEMINI_API_KEY or "YourGeminiApiKey" in GEMINI_API_KEY or GEMINI_API_KEY == "AIzaSyPlaceholderKeyForTesting" or not GEMINI_API_KEY.strip():
        return {
            "status": "unconfigured",
            "reply": "Asisten AI belum terkonfigurasi. Silakan tambahkan GEMINI_API_KEY Anda pada berkas .env di direktori backend terlebih dahulu."
        }
        
    try:
        context = _get_entity_context(req.uri)
        system_instruction = f"""
Anda adalah virtual chatbot ahli kuliner tradisional Indonesia bernama "Rasa Nusantara AI". 
Saat ini Anda sedang mengobrol dengan pengguna mengenai entitas kuliner berikut:
{context}

Gunakan data RDF tersebut sebagai kebenaran utama. Jika pengguna bertanya di luar topik kuliner Indonesia atau entitas makanan ini, ingatkan mereka secara sopan bahwa Anda adalah asisten kuliner khusus. Jawablah setiap pertanyaan secara bersahabat, edukatif, dan menarik dalam bahasa Indonesia yang baik.
"""
        model = genai.GenerativeModel(
        model_name="gemini-2.5-flash",
            system_instruction=system_instruction
        )
        
        # Susun riwayat obrolan dalam bentuk teks gabungan
        chat_prompt = "Berikut adalah riwayat percakapan kita:\n"
        for msg in req.history:
            sender_name = "User" if msg.get("sender") == "user" else "Rasa Nusantara AI"
            chat_prompt += f"{sender_name}: {msg.get('text')}\n"
            
        chat_prompt += f"\nUser: {req.question}\n\nJawablah sebagai Rasa Nusantara AI secara ringkas, ramah, dan informatif menggunakan format Markdown."
        
        response = model.generate_content(chat_prompt)
        
        return {
            "status": "success",
            "reply": response.text
        }
    except Exception as e:
        return {
            "status": "error",
            "reply": f"Terjadi kesalahan saat memproses pertanyaan Anda: {str(e)}"
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
