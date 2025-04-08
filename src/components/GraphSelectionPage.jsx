import { useEffect, useState } from "react";
import axios from "axios";

export default function GraphSelectionPage({ onSelect }) {
  const [graphs, setGraphs] = useState([]);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [newGraphName, setNewGraphName] = useState("");

  useEffect(() => {
    axios.get("http://localhost:8000/graphs")
      .then(res => 
        {setGraphs(res.data)
      console.log(res.data);
  })
      .catch(err => {
        console.error("Failed to load graphs", err);
        setError("Could not fetch graphs");
      });
      
  }, []);

  const handleCreateGraph = async () => {
    if (!newGraphName.trim()) return;

    try {
      const res = await axios.post("http://localhost:8000/graph/create", {
        name: newGraphName.trim(),
      });
      const newGraphId = res.data.id;
      setShowModal(false);
      onSelect(newGraphId);
    } catch (err) {
      console.error("Failed to create graph", err);
      setError("Failed to create new graph");
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Select a Graph</h2>
      {error && <p className="text-red-500">{error}</p>}
      <ul className="space-y-2">
        {graphs.map((graph) => (
          <li key={graph.id}>
            <button
              onClick={() => onSelect(graph.id)}
              className="w-full text-left p-2 border rounded hover:bg-blue-100"
            >
              {graph.name}
            </button>
          </li>
        ))}
      <button
        onClick={() => setShowModal(true)}
        className="w-full text-left p-2 border rounded hover:bg-blue-100"
      >
        + New Graph
      </button>
      </ul>
      
      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-white bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-md w-80">
            <h3 className="text-lg font-bold mb-2">Name your new graph</h3>
            <input
              type="text"
              value={newGraphName}
              onChange={(e) => setNewGraphName(e.target.value)}
              placeholder="e.g. My Research Map"
              className="border p-2 w-full mb-4"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-3 py-1 bg-gray-300 rounded w-1/2"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateGraph}
                className="px-3 py-1 bg-blue-500 text-black rounded w-1/2"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}