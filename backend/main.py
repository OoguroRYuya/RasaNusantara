from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from rdflib import Graph, Namespace
from rdflib.plugins.sparql.processor import SPARQLResult
import os

app = FastAPI(title="Semantic Web API - Kuliner Tradisional")

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
