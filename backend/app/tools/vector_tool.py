import chromadb
from chromadb.utils import embedding_functions

client = chromadb.PersistentClient(path="./chroma_db")

embedding_fn = embedding_functions.DefaultEmbeddingFunction()

collection = client.get_or_create_collection(
    name="financial_documents",
    embedding_function=embedding_fn
)

def add_document(doc_id: str, text: str, metadata: dict):
    try:
        collection.add(
            documents=[text],
            metadatas=[metadata],
            ids=[doc_id]
        )
        return {"success": True, "doc_id": doc_id}
    except Exception as e:
        return {"error": str(e)}

def search_documents(query: str, n_results: int = 3) -> dict:
    try:
        results = collection.query(
            query_texts=[query],
            n_results=n_results
        )
        
        documents = []
        for i, doc in enumerate(results["documents"][0]):
            documents.append({
                "content": doc,
                "metadata": results["metadatas"][0][i],
                "source": results["metadatas"][0][i].get("source", "Document DB")
            })
        
        return {"results": documents, "query": query}
    except Exception as e:
        return {"error": str(e), "results": []}