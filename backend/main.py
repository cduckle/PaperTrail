from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
from sqlalchemy import create_engine, Column, Integer, String, DateTime, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.sql import func

# === Database setup ===
SQLALCHEMY_DATABASE_URL = "sqlite:///./backend/graph.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()

# === FastAPI app ===
app = FastAPI()

# Optional: Allow CORS from frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or use specific origins like ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === Database model ===
class Graph(Base):
    __tablename__ = "graphs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    nodes = Column(JSON)
    edges = Column(JSON)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

Base.metadata.create_all(bind=engine)

# === Pydantic models ===
class Node(BaseModel):
    id: str
    type: str
    position: Dict[str, float]
    data: Dict[str, Any]
    style: Dict[str, Any] = {}

class Edge(BaseModel):
    id: str
    source: str
    target: str

class GraphCreate(BaseModel):
    nodes: List[Node]
    edges: List[Edge]

# === Dependency for DB session ===
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# === Routes ===
@app.post("/graph/save")
def save_graph(graph: GraphCreate, db: Session = Depends(get_db)):
    db_graph = Graph(
        name=graph.name,
        nodes=[node.dict() for node in graph.nodes],
        edges=[edge.dict() for edge in graph.edges],
    )
    db.add(db_graph)
    db.commit()
    db.refresh(db_graph)
    return db_graph

@app.get("/graph/{graph_id}")
def load_graph(graph_id: int, db: Session = Depends(get_db)):
    graph = db.query(Graph).filter(Graph.id == graph_id).first()
    if graph is None:
        return {"error": "Graph not found"}
    return graph

@app.get("/graphs")
def list_graphs(db: Session = Depends(get_db)):
    return db.query(Graph).all()

@app.put("/graph/{graph_id}")
def upsert_graph(graph_id: int, graph: GraphCreate, db: Session = Depends(get_db)):
    db_graph = db.query(Graph).filter(Graph.id == graph_id).first()
    if db_graph:
        db_graph.nodes = [node.dict() for node in graph.nodes]
        db_graph.edges = [edge.dict() for edge in graph.edges]
    else:
        print("WHATTTTT")

    db.commit()
    db.refresh(db_graph)
    return db_graph

class GraphCreateRequest(BaseModel):
    name: str

@app.post("/graph/create")
def create_graph(request: GraphCreateRequest, db: Session = Depends(get_db)):
    new_graph = Graph(name=request.name, nodes=[], edges=[])
    db.add(new_graph)
    db.commit()
    db.refresh(new_graph)
    return new_graph