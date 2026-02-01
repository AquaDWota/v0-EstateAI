import os
from google.cloud.sql.connector import Connector
import pg8000
from langchain_community.vectorstores.pgvector import PGVector
from langchain_google_vertexai import VertexAIEmbeddings
from google.cloud import bigquery


# Retrieve all Cloud Run release notes from BigQuery 
client = bigquery.Client()
query = """
SELECT
  CONCAT(FORMAT_DATE("%B %d, %Y", published_at), ": ", description) AS release_note
FROM `bigquery-public-data.google_cloud_release_notes.release_notes`
WHERE product_name= "Cloud Run"
ORDER BY published_at DESC
"""
rows = client.query(query)

print(f"Number of release notes retrieved: {rows.result().total_rows}")

# Set up a PGVector instance 
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

store = PGVector(
    connection_string="postgresql+pg8000://",
    use_jsonb=True,
    engine_args=dict(
        creator=getconn,
    ),
    embedding_function=VertexAIEmbeddings(
        model_name="textembedding-gecko@003"
    ),
    pre_delete_collection=True  
)

# Save all release notes into the Cloud SQL database
texts = list(row["release_note"] for row in rows)
ids = store.add_texts(texts)

print(f"Done saving: {len(ids)} release notes")