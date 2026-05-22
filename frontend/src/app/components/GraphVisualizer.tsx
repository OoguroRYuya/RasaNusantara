'use client';
import { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';

interface GraphVisualizerProps {
  uri: string;
  outgoing: { predicate: string; object: string }[];
  incoming: { subject: string; predicate: string }[];
}

const getShortName = (fullUri: string) => {
  if (!fullUri.startsWith('http')) return fullUri.length > 20 ? fullUri.substring(0, 20) + '...' : fullUri;
  return fullUri.substring(fullUri.lastIndexOf('#') + 1) || fullUri.substring(fullUri.lastIndexOf('/') + 1);
};

const cytoscapeStyle: cytoscape.StylesheetStyle[] = [
  {
    selector: 'node',
    style: {
      'label': 'data(label)',
      'text-valign': 'center',
      'text-halign': 'center',
      'font-size': '12px',
      'color': '#fff',
      'text-outline-width': 2,
      'text-outline-color': '#222',
      'min-width': '60px',
      'min-height': '30px',
      'padding': '16px',
      'shape': 'round-rectangle',
    }
  },
  {
    selector: 'node[type="main"]',
    style: {
      'background-color': '#f59e0b',
      'font-weight': 'bold',
      'font-size': '14px',
      'text-outline-color': '#d97706',
    }
  },
  {
    selector: 'node[type="entity"]',
    style: {
      'background-color': '#3b82f6',
      'text-outline-color': '#2563eb',
    }
  },
  {
    selector: 'node[type="literal"]',
    style: {
      'background-color': '#44403c',
      'color': '#d6d3d1',
      'shape': 'ellipse',
      'text-outline-color': '#292524',
    }
  },
  {
    selector: 'edge',
    style: {
      'width': 2,
      'line-color': '#57534e',
      'target-arrow-color': '#57534e',
      'target-arrow-shape': 'triangle',
      'curve-style': 'bezier',
      'label': 'data(label)',
      'font-size': '10px',
      'color': '#a8a29e',
      'text-rotation': 'autorotate',
      'text-margin-y': -10,
      'text-background-color': '#1c1917',
      'text-background-opacity': 1,
      'text-background-padding': '4px',
    }
  }
];

function buildElements(uri: string, outgoing: GraphVisualizerProps['outgoing'], incoming: GraphVisualizerProps['incoming']): cytoscape.ElementDefinition[] {
  const mainNodeId = getShortName(uri);
  const els: cytoscape.ElementDefinition[] = [
    { data: { id: uri, label: mainNodeId, type: 'main' } }
  ];

  outgoing.forEach((rel, idx) => {
    const objId = rel.object.startsWith('http') ? rel.object : `literal_${idx}`;
    if (!els.find(e => e.data.id === objId)) {
      els.push({
        data: {
          id: objId,
          label: getShortName(rel.object),
          type: rel.object.startsWith('http') ? 'entity' : 'literal'
        }
      });
    }
    els.push({
      data: { source: uri, target: objId, label: getShortName(rel.predicate) }
    });
  });

  incoming.forEach((rel) => {
    const subId = rel.subject;
    if (!els.find(e => e.data.id === subId)) {
      els.push({
        data: { id: subId, label: getShortName(rel.subject), type: 'entity' }
      });
    }
    els.push({
      data: { source: subId, target: uri, label: getShortName(rel.predicate) }
    });
  });

  return els;
}

export default function GraphVisualizer({ uri, outgoing, incoming }: GraphVisualizerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);

  // Serialize deps to stable strings — prevents unnecessary re-init
  // when parent re-renders with same data but new array references
  const outgoingKey = JSON.stringify(outgoing);
  const incomingKey = JSON.stringify(incoming);

  useEffect(() => {
    if (!containerRef.current) return;

    const parsedOutgoing = JSON.parse(outgoingKey);
    const parsedIncoming = JSON.parse(incomingKey);
    const elements = buildElements(uri, parsedOutgoing, parsedIncoming);
    if (elements.length === 0) return;

    // Destroy previous instance if it exists
    if (cyRef.current) {
      cyRef.current.destroy();
    }

    const cy = cytoscape({
      container: containerRef.current,
      elements,
      style: cytoscapeStyle as any,
      // Start without layout — we run it separately
      layout: { name: 'preset' },
    });

    cyRef.current = cy;

    // Run cose layout synchronously (animate: false) to avoid
    // the async animation conflicting with React cleanup/destroy
    cy.layout({
      name: 'cose',
      animate: false,
      idealEdgeLength: 100,
      nodeOverlap: 20,
      fit: true,
      padding: 30,
      randomize: false,
      componentSpacing: 100,
      nodeRepulsion: 400000,
      edgeElasticity: 100,
      nestingFactor: 5,
      gravity: 80,
      numIter: 1000,
      initialTemp: 200,
      coolingFactor: 0.95,
      minTemp: 1.0,
    } as any).run();

    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
    };
  }, [uri, outgoingKey, incomingKey]);

  return (
    <div className="w-full h-[500px] bg-stone-950/50 rounded-3xl overflow-hidden ring-1 ring-white/10 relative">
      <div className="absolute top-4 left-4 z-10 flex gap-4 text-xs font-mono">
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500"></div> Entitas Utama</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div> Relasi Entitas (URI)</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-stone-700"></div> Teks Literal</div>
      </div>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
