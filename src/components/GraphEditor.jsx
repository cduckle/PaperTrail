import { useCallback, useEffect, useState, useRef } from "react";
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
/* 
function CircleZone({ zone, onDrag }) {
  
    return (
        <motion.div
        className="absolute rounded-full border-2 border-dashed border-gray-400 p-2 text-center text-sm text-gray-700"
        style={{
            width: zone.radius * 2,
            height: zone.radius * 2,
            top: zone.y - zone.radius,
            left: zone.x - zone.radius,
            zIndex: 0,
            backgroundColor: 'rgba(200, 200, 255, 0.2)',
        }}
        drag
        dragMomentum={false}
        onDragEnd={(event, info) => onDrag(zone.id, info.point)}
        >
        </motion.div>
  );
}; */
/* function CircleZone({ zone, onDrag }) {
    const zoneRef = useRef(null);
    const [dragging, setDragging] = useState(false);
  
    const handleMouseDown = (e) => {
      setDragging(true);
      const offsetX = e.clientX - zone.x;
      const offsetY = e.clientY - zone.y;
  
      const handleMouseMove = (moveEvent) => {
        if (!dragging) return;
        const newX = moveEvent.clientX - offsetX;
        const newY = moveEvent.clientY - offsetY;
        onDrag(zone.id, { x: newX, y: newY });
      };
  
      const handleMouseUp = () => {
        setDragging(false);
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
  
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    };
  
    return (
      <div
        ref={zoneRef}
        className="absolute rounded-full border-2 border-dashed border-gray-400 p-2 text-center text-sm text-gray-700 cursor-move"
        style={{
          width: zone.radius * 2,
          height: zone.radius * 2,
          top: zone.y - zone.radius,
          left: zone.x - zone.radius,
          backgroundColor: 'rgba(200, 200, 255, 0.2)',
          zIndex: 0,
        }}
        onMouseDown={handleMouseDown}
      >
        {zone.name}
      </div>
    );
  } */

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
        <p className="text-3xl" >{name}</p>
        </div>
    );
    }
const nodeTypes = { resizable: Node, zone: CircleZone};

export default function GraphEditor({ graphId }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [newNode, setNewNode] = useState({ title: "", link: "", image_url: "" });
  const [selectedNodeId, setSelectedNodeId] = useState(null);

  const [zones, setZones] = useState([]);
  const [newZone, setNewZone] = useState({ name:"", radius: ""});
  

  useEffect(() => {
    axios.get('http://localhost:8000/graph/'+graphId)
    .then(res => {
      const graph = res.data;
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

/*       setEdges(
        graph.nodes.flatMap(node =>
          node.connections.map(conn => ({
            id: `${node.id}-${conn}`,
            source: node.id,
            target: conn,
            animated: true,
            style: { stroke: "#222" },
          }))
        )
      ); */
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

  /* const handleAddZone = () => {
    if (!newZone.name && !newZone.radius) return;
    const id = crypto.randomUUID();
    const zone = {
      id,
      x: Math.random() * 400,
      y: Math.random() * 400,
      type: 'circleZone',
      radius: newZone.radius,
      name: newZone.name,
    };
    setZones((zones) => [...zones, zone]);
    setNewZone({name: "", radius:""});
  }; */

  const handleZoneDrag = (id, newPosition) => {
    setZones((zones) =>
      zones.map((zone) =>
        zone.id === id ? { ...zone, x: newPosition.x, y: newPosition.y } : zone
      )
    );
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

 /*  const onConnect = useCallback(
 
    (params) => {
      console.log("Connect event:", params);


      setEdges((eds) => {
        const exists = eds.some(
          (e) =>
            (e.source === params.source && e.target === params.target) ||
            (e.source === params.target && e.target === params.source)
        );
        console.log("eds", eds);
        console.log("exists", exists);


        if (exists) return eds;
        return addEdge({ ...params, animated: true, style: { stroke: "#222" }, id: crypto.randomUUID(),  }, eds);
      });

    },
    [setEdges]
    
  ); */

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


/*   const handleDeleteNode = () => {
    if (!selectedNodeId) return;
    setNodes((nds) => nds.filter((n) => n.id !== selectedNodeId));
    setEdges((eds) => eds.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId));
    setSelectedNodeId(null);
  }; */

  const handleSaveGraph = async () => {
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
      alert("Graph updated!");
    } catch (err) {
      console.error("Failed to update graph:", err.response?.data || err.message);
    }
  };

  return (
    <ReactFlowProvider>
      <div style={{ position: "relative", width: "100vw", height: "100vh", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 10, left: 10, zIndex: 10 }} className="p-2 rounded">
          <input
            className="border p-1 my-1 w-1/5"
            placeholder="Title"
            value={newNode.title}
            onChange={(e) => setNewNode({ ...newNode, title: e.target.value })}
          />
          <input
            className="border p-1 my-1 w-3/20"
            placeholder="Link"
            value={newNode.link}
            onChange={(e) => setNewNode({ ...newNode, link: e.target.value })}
          />
          <input
            className="border p-1 my-1 w-3/20"
            placeholder="Image URL"
            value={newNode.image_url}
            onChange={(e) => setNewNode({ ...newNode, image_url: e.target.value })}
          />
          <button
            className="bg-blue-500 text-black px-2 py-1 mt-1 mx-2"
            onClick={handleAddNode}
          >
            Add Node
          </button>

        </div>

        <div style={{ position: "absolute", top: 10, right: 10, zIndex: 10 }} className="p-2 rounded">
            <input
                className="border p-1 my-1"
                placeholder="Zone Name"
                value={newZone.name}
                onChange={(e) => setNewZone({ ...newZone, name: e.target.value })}
            />
            <input
                type="number"
                className="border p-1 my-1 w-3/20"
                placeholder="Radius"
                value={newZone.radius}
                onChange={(e) => setNewZone({ ...newZone, radius: e.target.value })}
            />
            <button
                onClick={handleAddZone}
                className="bg-blue-500 text-black px-2 py-1 mt-1 mx-2"
                >
                Add Zone
            </button>

            <button
  className="bg-green-500 text-black px-2 py-1 mt-1"
  onClick={handleSaveGraph}
>
  Save Graph
</button>
        </div>

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