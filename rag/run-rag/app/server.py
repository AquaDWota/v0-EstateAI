from fastapi import FastAPI
from fastapi.responses import RedirectResponse
from langserve import add_routes

import pg8000
import os
from google.cloud.sql.connector import Connector
from langchain_google_vertexai import VertexAI
from langchain_google_vertexai import VertexAIEmbeddings
from langchain_core.runnables import RunnablePassthrough, RunnableParallel
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import PromptTemplate
from langchain_community.vectorstores.pgvector import PGVector

app = FastAPI()


@app.get("/")
async def redirect_root_to_docs() -> RedirectResponse:
    return RedirectResponse("/docs")


# (1) Initialize VectorStore
connector = Connector()


def getconn() -> pg8000.dbapi.Connection:
    conn: pg8000.dbapi.Connection = connector.connect(
        os.getenv("DB_INSTANCE_NAME", ""),
        "pg8000",
        user=os.getenv("DB_USER", ""),
        password=os.getenv("DB_PASS", ""),
        db=os.getenv("DB_NAME", ""),
    )
    return conn


vectorstore = PGVector(
    connection_string="postgresql+pg8000://",
    use_jsonb=True,
    engine_args=dict(
        creator=getconn,
    ),
    embedding_function=VertexAIEmbeddings(
        model_name="textembedding-gecko@003"
    )
)

# (2) Build retriever


def concatenate_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)


notes_retriever = vectorstore.as_retriever() | concatenate_docs

# (3) Create prompt template
prompt_template = PromptTemplate.from_template(
    """You are a Cloud Run expert answering questions. 
Use the retrieved release notes to answer questions
Give a concise answer, and if you are unsure of the answer, just say so.

Release notes: {notes}

Here is your question: {query}
Your answer: """)

# (4) Initialize LLM
llm = VertexAI(
    model_name="gemini-1.0-pro-001",
    temperature=0.2,
    max_output_tokens=100,
    top_k=40,
    top_p=0.95
)

# (5) Chain everything together
chain = (
    RunnableParallel({
        "notes": notes_retriever,
        "query": RunnablePassthrough()
    })
    | prompt_template
    | llm
    | StrOutputParser()
)
add_routes(app, NotImplemented)

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
