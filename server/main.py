# file: main.py

import os
from fastapi import FastAPI, UploadFile, File, Form
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

# LangChain & Groq Imports
from langchain_groq import ChatGroq
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from langchain.prompts import ChatPromptTemplate
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader
from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings

from operator import itemgetter
from langchain.load import dumps, loads

from typing import Optional
import tempfile
import uvicorn
from dotenv import load_dotenv

# Load environment variables from a local .env file (if present).
load_dotenv()

app = FastAPI()

# Comma-separated list of allowed origins; defaults to "*" for local dev.
allowed_origins = os.environ.get("ALLOWED_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware, # https://fastapi.tiangolo.com/tutorial/cors/
    allow_origins=allowed_origins, # restrict to the deployed client in production
    allow_credentials=True, # https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Credentials
    allow_methods=['*'], # https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Methods
    allow_headers=['*'], # https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Headers
)
###############################################################################
#                            SETUP & GLOBAL OBJECTS
###############################################################################

# 1) LLM (Groq)
groq_api_key = os.environ.get("GROQ_API_KEY")
if not groq_api_key:
    raise RuntimeError("GROQ_API_KEY environment variable is not set")

llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    temperature=0,
    groq_api_key=groq_api_key,
    max_tokens=None,
    timeout=None,
    max_retries=2,
)

# 2) Prompt Templates (Now in Bangla)
single_query_prompt_template = """এই অনুচ্ছেদগুলো ব্যবহার করে নিচের প্রশ্নের উত্তর দিন, সম্পূর্ণভাবে বাংলা ভাষায়:

{context}

প্রশ্ন: {question}

আপনার উত্তর সংক্ষিপ্ত ও সহযোগীতামূলক রাখুন।
"""
single_prompt = ChatPromptTemplate.from_template(single_query_prompt_template)

multi_query_template = """আপনি একজন বুদ্ধিমান AI ভাষা মডেল। নিচে প্রদত্ত মূল প্রশ্নের ভিত্তিতে পাঁচটি ভিন্ন প্রশ্ন তৈরি করুন, যা সবই বাংলা ভাষায় লেখা হবে। প্রতিটি প্রশ্ন আলাদা লাইনে দিন।

মূল প্রশ্ন: {question}
"""
multi_query_prompt = ChatPromptTemplate.from_template(multi_query_template)

final_prompt_template = """নিম্নোক্ত তথ্য ব্যবহার করে প্রশ্নটির উত্তর দিন, শুধুমাত্র বাংলা ভাষায়:

{context}

প্রশ্ন: {question}
"""
final_prompt = ChatPromptTemplate.from_template(final_prompt_template)

###############################################################################
#                     UTILITY FUNCTIONS & DATA MODELS
###############################################################################

def format_docs(documents):
    """Convert a list of Documents into a single string for the prompt."""
    return "\n\n".join(doc.page_content for doc in documents)

def get_unique_union(documents: list[list]):
    """Unique union of retrieved docs from multi-query retrieval."""
    flattened_docs = [dumps(doc) for sublist in documents for doc in sublist]
    unique_docs = list(set(flattened_docs))
    return [loads(doc) for doc in unique_docs]

class QueryResponse(BaseModel):
    answer: str

###############################################################################
#                           ENDPOINTS
###############################################################################

@app.post("/rag-query", response_model=QueryResponse)
async def rag_query(
    pdf_file: UploadFile = File(...),
    question: str = Form(...)
):
    """
    সব উত্তরই হবে বাংলায়।
    Single retrieval-augmented generation:
    1. Upload a PDF
    2. Build an embedding index from it
    3. Use a single question to retrieve and generate an answer
    """
    print("[/rag-query] Received request.")
    print("[/rag-query] Saving PDF to temp file...")

    # 1. Save uploaded PDF to a temp file
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        pdf_data = await pdf_file.read()
        tmp.write(pdf_data)
        tmp_path = tmp.name

    print(f"[/rag-query] PDF saved at: {tmp_path}")
    print(f"[/rag-query] Received question: {question}")

    # 2. Load PDF
    print("[/rag-query] Loading PDF with PyPDFLoader...")
    loader = PyPDFLoader(tmp_path)
    docs = loader.load()
    os.unlink(tmp_path)  # PDF is loaded into memory; drop the temp file

    if not docs:
        print("[/rag-query] No documents found in PDF.")
        return {"answer": "আপলোড করা পিডিএফ-এ কোন তথ্য পাওয়া যায়নি।"}
    
    print(f"[/rag-query] Loaded {len(docs)} document(s).")

    # 3. Split docs
    print("[/rag-query] Splitting documents into chunks...")
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    splits = text_splitter.split_documents(docs)
    print(f"[/rag-query] Created {len(splits)} chunks.")

    # 4. Create vector store and retriever
    print("[/rag-query] Creating vector store (Chroma) and retriever...")
    embedding_model = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )
    vectorstore = Chroma.from_documents(splits, embedding_model)
    retriever = vectorstore.as_retriever()

    print("[/rag-query] Building RAG chain (single)...")
    # => { "context": retriever -> format_docs, "question": question }
    rag_chain = (
        {"context": retriever | format_docs, "question": RunnablePassthrough()}
        | single_prompt
        | llm
        | StrOutputParser()
    )

    print("[/rag-query] Invoking chain...")
    answer = rag_chain.invoke(question)
    print("[/rag-query] Chain response received.")

    print(f"[/rag-query] Final answer: {answer}")
    return {"answer": answer}


@app.post("/rag-multi-query", response_model=QueryResponse)
async def rag_multi_query(
    pdf_file: UploadFile = File(...),
    question: str = Form(...)
):
    """
    সব উত্তরই হবে বাংলায়।
    Multi-query approach:
    1. Upload a PDF
    2. Create embeddings
    3. Generate multiple queries for better retrieval coverage
    4. Merge unique docs
    5. LLM final answer
    """
    print("[/rag-multi-query] Received request.")
    print("[/rag-multi-query] Saving PDF to temp file...")

    # 1. Save uploaded PDF
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        pdf_data = await pdf_file.read()
        tmp.write(pdf_data)
        tmp_path = tmp.name

    print(f"[/rag-multi-query] PDF saved at: {tmp_path}")
    print(f"[/rag-multi-query] Received question: {question}")

    # 2. Load PDF
    print("[/rag-multi-query] Loading PDF with PyPDFLoader...")
    loader = PyPDFLoader(tmp_path)
    docs = loader.load()
    os.unlink(tmp_path)  # PDF is loaded into memory; drop the temp file

    if not docs:
        print("[/rag-multi-query] No documents found in PDF.")
        return {"answer": "আপলোড করা পিডিএফ-এ কোন তথ্য পাওয়া যায়নি।"}
    
    print(f"[/rag-multi-query] Loaded {len(docs)} document(s).")

    # 3. Split
    print("[/rag-multi-query] Splitting documents into chunks...")
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    splits = text_splitter.split_documents(docs)
    print(f"[/rag-multi-query] Created {len(splits)} chunks.")

    # 4. Create vector store
    print("[/rag-multi-query] Creating vector store (Chroma) and retriever...")
    embedding_model = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )
    vectorstore = Chroma.from_documents(splits, embedding_model)
    retriever = vectorstore.as_retriever()

    print("[/rag-multi-query] Setting up multi-query subchains...")
    generate_queries_chain = (
        multi_query_prompt
        | llm
        | StrOutputParser()
        | (lambda x: x.split('\n'))
    )
    multi_query_retrieval_chain = generate_queries_chain | retriever.map() | get_unique_union

    # 5. Final chain
    print("[/rag-multi-query] Building final chain with multiple queries...")
    multi_rag_chain = (
        {"context": multi_query_retrieval_chain, "question": itemgetter("question")}
        | final_prompt
        | llm
        | StrOutputParser()
    )

    print("[/rag-multi-query] Invoking chain...")
    answer = multi_rag_chain.invoke({"question": question})
    print("[/rag-multi-query] Chain response received.")

    print(f"[/rag-multi-query] Final answer: {answer}")
    return {"answer": answer}


# Optional: run via "python main.py"
if __name__ == "__main__":
    print("[MAIN] Starting uvicorn server on port 8000...")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
    print("[MAIN] Server shutdown.")
