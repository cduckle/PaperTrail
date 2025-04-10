import { useCallback, useEffect, useState, useMemo, useRef } from "react";
import { debounce } from "lodash";
import ReactFlow, {
  addEdge,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  Handle,
  Position
} from "reactflow";
import axios from "axios";
import 'reactflow/dist/style.css';

function Node({ data }) {
  const [dimensions] = useState({ width: 250, height: 250 });

  return (
    <div style={{ width: dimensions.width, height: dimensions.height, position: 'relative', display: 'flex', flexDirection:'column', justifyContent:'center',textAlign: 'center' }}>
      <Handle type="target" position={Position.Top} style={{ height: 30, width: 30, background: '#555' }} />
      <a href={data.link} target="_blank" rel="noopener noreferrer">{data.title}
        <img
          src={data.image_url}
          alt={data.title}
          style={{ width: '100%', height: 180, objectFit: 'contain', pointerEvents: 'none' }}
        />
      </a>
      <Handle type="source" position={Position.Bottom} style={{ height: 30, width: 30, background: '#555' }} />
      <Handle type="source" position={Position.Right} style={{ height: 30, width: 30, background: '#555' }} />
      <Handle type="target" position={Position.Left} style={{ height: 30, width: 30, background: '#555' }} />
    </div>
  );
}

function CircleZone({ data }) {
    const { radius = 100, name = "" } = data;
    
    return (
        <div
        className="rounded-full border-2 border-dashed border-gray-400 flex items-center justify-center text-sm text-gray-700"
        style={{
            width: radius * 2,
            height: radius * 2,
            backgroundColor: 'rgba(200, 200, 255, 0.2)',
        }}
        >
        <p className="text-5xl" >{name}</p>
        </div>
    );
    }
const nodeTypes = { resizable: Node, zone: CircleZone};

export default function GraphEditor({ graphId, onBack}) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [newNode, setNewNode] = useState({ title: "", link: "", image_url: "" });
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [name, setName] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);


  const [zones, setZones] = useState([]);
  const [newZone, setNewZone] = useState({ name:"", radius: ""});
  

  useEffect(() => {
    axios.get('http://localhost:8000/graph/'+graphId)
    .then(res => {
      const graph = res.data;
      setName(graph.name);
      console.log("Loaded graph nodes:", graph.nodes);
      setNodes(graph.nodes.map(node => ({
        id: node.id,
        type: node.type,
        data: node.data,
        position: node.position,
      })));
      console.log("edgees:", graph.edges);
      setEdges(
        graph.edges.map(edge => ({
          ...edge,
          animated: true,
          style: { stroke: "#222" },
        }))
      );


    }).catch((err) => {
        console.error("Error loading graph:", err.response?.data || err.message);
      });
  }, []);

  const handleAddZone = () => {
    if (!newZone.name && !newZone.radius) return;
    const id = crypto.randomUUID();
    const position = { x: Math.random() * 400, y: Math.random() * 400 };
  
    const zoneNode = {
      id,
      type: 'zone',
      position,
      data: {
        name: newZone.name,
        radius: parseInt(newZone.radius, 10)
      },
      style: {
        zIndex: 0, // nodes higher
      },
    };
  
    setNodes((nodes) => [zoneNode, ...nodes]);
    setNewZone({ name: "", radius: "" });
  };


  const onConnect = useCallback(
    (params) => {
      setEdges((eds) => {
        const newEdge = {
          id: `${params.source}-${params.target}`, // Explicit unique ID
          source: params.source,
          sourceHandle: params.sourceHandle,
          target: params.target,
          targetHandle: params.targetHandle,
          animated: true,
          type: 'default', // explicitly set
          style: { stroke: "#A30A00", zIndex: 1000 },
        };
        // Prevent duplicate edges explicitly
        if (eds.some(edge => edge.id === newEdge.id)) return eds;
  
        return [...eds, newEdge];
      });
    },
    [setEdges]
  );

  const handleAddNode = () => {
    if (!newNode.title && !newNode.link && !newNode.image_url) return;
    const id = crypto.randomUUID();
    const position = { x: Math.random() * 400, y: Math.random() * 400 };
    const node = {
      id,
      type: 'resizable',
      data: {
        title: newNode.title,
        link: newNode.link,
        image_url: newNode.image_url
      },
      position,
      style: {
        zIndex: 1, // nodes higher
      },
    };
    setNodes((nds) => [...nds, node]);
    setNewNode({ title: "", link: "", image_url: "" });
  };

  const handleNodeClick = (event, node) => {
    setSelectedNodeId(node.id);
  };

  const handlePaneClick = () => {
    setSelectedNodeId(null);
  };


  const handleSaveGraph = useCallback(async () => {
    const graphData = {

      nodes: nodes.map(({ id, type, data, position, style }) => ({
        id,
        type,
        data,
        position,
        style
      })),
      edges: edges.map(({ id, source, target }) => ({
        id,
        source,
        target
      })),
    };
    console.log("Saving graph:", graphData);

    try {
      await axios.put(`http://localhost:8000/graph/${graphId}`, graphData

      );
      //alert("Graph updated!");
      setLastSaved(new Date());
    } catch (err) {
      console.error("Failed to update graph:", err.response?.data || err.message);
    }
  }, [nodes, edges, graphId]);

  const debouncedSave = useMemo(() => debounce(handleSaveGraph, 1000), [handleSaveGraph]);

  useEffect(() => {
    // This function runs every time nodes or edges change
    console.log("Nodes or edges changed");
    debouncedSave();
    return () => {
      debouncedSave.cancel();
    };
  }, [nodes, edges]);

  return (
    <ReactFlowProvider>
      <div style={{ position: "relative", width: "100vw", height: "100vh", overflow: "hidden" }}>
        {/* Title Input */}
        <input
          className="absolute top-1/50 left-1/100 p-1 w-1/10 z-10"
          placeholder="Title"
          value={newNode.title}
          onChange={(e) => setNewNode({ ...newNode, title: e.target.value })}
        />

        {/* Link Input */}
        <input
          className="absolute top-1/50 left-12/100 p-1 w-1/10 z-10"
          placeholder="Link"
          value={newNode.link}
          onChange={(e) => setNewNode({ ...newNode, link: e.target.value })}
        />

        {/* Image URL Input */}
        <input
          className="absolute top-1/50 left-23/100 p-1 w-1/10 z-10"
          placeholder="Image URL"
          value={newNode.image_url}
          onChange={(e) => setNewNode({ ...newNode, image_url: e.target.value })}
        />

        {/* Add Node Button */}
        <button
          className="absolute top-1/100 left-33/100 bg-blue-500 text-black px-2 py-1 w-4/50 z-10"
          onClick={handleAddNode}
        >
          Add Node
        </button>


        <button className="text-3xl text-black absolute top-1/100 left-47/100 px-2 py-1 z-10"
                onClick={onBack}>
          {name}
        </button>

        
        <input
            className="absolute top-1/50 right-19/100 text-black px-2 py-1 w-1/10 z-10"
            placeholder="Zone Name"
            value={newZone.name}
            onChange={(e) => setNewZone({ ...newZone, name: e.target.value })}
        />
        <input
            type="number"
            className="absolute top-1/50 right-10/100 text-black px-2 py-1 w-3/40 z-10"
            placeholder="Radius"
            value={newZone.radius}
            onChange={(e) => setNewZone({ ...newZone, radius: e.target.value })}
        />
        <button
            onClick={handleAddZone}
            className="absolute top-1/100 right-1/100 text-black px-2 py-1 w-4/50 z-10"
            >
            Add Zone
        </button>

        {lastSaved && (
          <p className="absolute text-l top-6/100 right-1/100 text-gray-500 mt-2 z-10">
            Last saved at {lastSaved.toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'})}
          </p>
        )}

        <div style={{ width: "100%", height: "100%" }}>

          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={handleNodeClick}
            onPaneClick={handlePaneClick}
            nodeTypes={nodeTypes}
            fitView
            minZoom={0.1} 
          >
            {zones.map((zone) => (
                <CircleZone
                key={zone.id}
                zone={zone}
                onDrag={handleZoneDrag}
                />
            ))}
            {/* <MiniMap /> */}
            <Controls />
            <Background />
          </ReactFlow>
        </div>
      </div>
    </ReactFlowProvider>
  );
}