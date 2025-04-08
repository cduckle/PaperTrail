import { useState, useEffect } from "react";
import { ReactFlowProvider } from "reactflow";
import GraphEditor from "./components/GraphEditor";
import GraphSelectionPage from "./components/GraphSelectionPage";

export default function App() {
  const [graphId, setGraphId] = useState(null);

  return (
    <>
      {!graphId ? (
        <GraphSelectionPage onSelect={(id) => setGraphId(id)} />
      ) : (
        <GraphEditor graphId={graphId} />
      )}
    </>
  );
}
