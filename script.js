// Set dimensions for the graph
const width = window.innerWidth;
const height = window.innerHeight;

// Create an SVG container
const svg = d3.select("#visualization")
  .append("svg")
    .attr("width", width)
    .attr("height", height);

// Select the info panel
const infoPanel = d3.select("#info-panel");

let selectedNode = null;

// --- NEW: Create a main container for zoom ---
const container = svg.append("g");


d3.json("authors.json").then(function(data) {

  const linkedByIndex = {};
  data.links.forEach(d => {
    linkedByIndex[`${d.source.id},${d.target.id}`] = 1;
  });

  function areNeighbors(a, b) {
    return linkedByIndex[`${a.id},${b.id}`] || linkedByIndex[`${b.id},${a.id}`] || a.id === b.id;
  }
  
  const color = d3.scaleOrdinal(d3.schemeCategory10);

  const simulation = d3.forceSimulation(data.nodes)
      .force("link", d3.forceLink(data.links).id(d => d.id).distance(80))
      .force("charge", d3.forceManyBody().strength(-150))
      .force("center", d3.forceCenter(width / 2, height / 2));

  // --- UPDATED: Append links and nodes to the 'container' group ---
  const link = container.append("g")
      .attr("class", "links")
    .selectAll("line")
    .data(data.links)
    .enter().append("line")
      .attr("class", "link");

  const node = container.append("g")
      .attr("class", "nodes")
    .selectAll("g")
    .data(data.nodes)
    .enter().append("g")
      .attr("class", "node");

  const circles = node.append("circle")
      .attr("r", 8)
      .attr("fill", d => color(d.group));

  const labels = node.append("text")
      .text(d => d.id)
      .attr('x', 12)
      .attr('y', 4);

  
  function updateVisuals(highlightedNode) {
    if (highlightedNode) {
      node.classed("dimmed", true);
      link.classed("dimmed", true);
      node.filter(d => areNeighbors(highlightedNode, d))
        .classed("dimmed", false);
      link.filter(d => d.source.id === highlightedNode.id || d.target.id === highlightedNode.id)
        .classed("dimmed", false);
    } else {
      node.classed("dimmed", false);
      link.classed("dimmed", false);
    }
  }

  function updateInfoPanel(d) {
    if (d) {
      infoPanel.html(`<h2>${d.id}</h2><p>"${d.touchstone}"</p>`);
    } else {
      infoPanel.html(`<p>Hover over an author, or click to select.</p>`);
    }
  }

  node.on("mouseover", (event, d) => {
    updateInfoPanel(d);
    updateVisuals(d);
    circles.filter(n => n.id === d.id).attr("r", 12);
  });

  node.on("mouseout", (event, d) => {
    updateInfoPanel(selectedNode);
    updateVisuals(selectedNode);
    if (!node.filter(n => n.id === d.id).classed("selected")) {
        circles.filter(n => n.id === d.id).attr("r", 8);
    }
  });

  node.on("click", (event, d) => {
    event.stopPropagation();
    if (selectedNode && selectedNode.id === d.id) {
      selectedNode = null;
    } else {
      selectedNode = d;
    }
    node.classed("selected", n => selectedNode && n.id === selectedNode.id);
    updateInfoPanel(selectedNode);
    updateVisuals(selectedNode);
  });
  
  // UPDATED: Background click now also resets zoom
  svg.on("click", (event) => {
    if (event.target.tagName === 'svg') {
      selectedNode = null;
      node.classed("selected", false);
      updateInfoPanel(null);
      updateVisuals(null);
      // --- NEW: Reset zoom on background click ---
      svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity);
    }
  });

  // --- NEW: Zoom functionality ---
  const zoom = d3.zoom()
      .scaleExtent([0.1, 4]) // Set min and max zoom levels
      .on("zoom", (event) => {
        container.attr("transform", event.transform);
      });

  svg.call(zoom);
  // --- END NEW Zoom ---

  node.call(d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended));

  simulation.on("tick", () => {
    link.attr("x1", d => d.source.x).attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x).attr("y2", d => d.target.y);
    node.attr("transform", d => `translate(${d.x},${d.y})`);
  });

  function dragstarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x; d.fy = d.y;
    // NEW: Also make cursor 'grabbing' during drag
    svg.style("cursor", "grabbing");
  }
  function dragged(event, d) {
    d.fx = event.x; d.fy = event.y;
  }
  function dragended(event, d) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null; d.fy = null;
    // NEW: Revert cursor to 'grab' after drag
    svg.style("cursor", "grab");
  }
});
