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

d3.json("authors.json").then(function(data) {

  // --- NEW: Create a data structure for quick lookups of neighbors ---
  const linkedByIndex = {};
  data.links.forEach(d => {
    linkedByIndex[`${d.source.id},${d.target.id}`] = 1;
  });

  function areNeighbors(a, b) {
    return linkedByIndex[`${a.id},${b.id}`] || linkedByIndex[`${b.id},${a.id}`] || a.id === b.id;
  }
  // --- END NEW DATA STRUCTURE ---


  const color = d3.scaleOrdinal(d3.schemeCategory10);

  const simulation = d3.forceSimulation(data.nodes)
      .force("link", d3.forceLink(data.links).id(d => d.id).distance(80))
      .force("charge", d3.forceManyBody().strength(-150))
      .force("center", d3.forceCenter(width / 2, height / 2));

  const link = svg.append("g")
      .attr("class", "links")
    .selectAll("line")
    .data(data.links)
    .enter().append("line")
      .attr("class", "link");

  const node = svg.append("g")
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

  // --- NEW: Central function to update all visual states ---
  function updateVisuals(highlightedNode) {
    if (highlightedNode) {
      // Dim all nodes and links
      node.classed("dimmed", true);
      link.classed("dimmed", true);

      // Highlight the selected node and its neighbors
      node.filter(d => areNeighbors(highlightedNode, d))
        .classed("dimmed", false);
      link.filter(d => d.source.id === highlightedNode.id || d.target.id === highlightedNode.id)
        .classed("dimmed", false);
    } else {
      // If no node is highlighted, remove all dimming
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


  // --- UPDATED EVENT HANDLERS ---

  node.on("mouseover", (event, d) => {
    updateInfoPanel(d);
    updateVisuals(d);
    circles.filter(n => n.id === d.id).attr("r", 12);
  });

  node.on("mouseout", (event, d) => {
    updateInfoPanel(selectedNode); // Revert panel to selected node, if any
    updateVisuals(selectedNode);  // Revert visuals to selected node, if any
    circles.filter(n => n.id === d.id).attr("r", 8);
  });

  node.on("click", (event, d) => {
    event.stopPropagation(); // Prevent background click from firing
    if (selectedNode && selectedNode.id === d.id) {
      selectedNode = null;
    } else {
      selectedNode = d;
    }
    node.classed("selected", n => selectedNode && n.id === selectedNode.id);
    updateInfoPanel(selectedNode);
    updateVisuals(selectedNode);
  });

  svg.on("click", () => {
    selectedNode = null;
    node.classed("selected", false);
    updateInfoPanel(null);
    updateVisuals(null);
  });


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
  }
  function dragged(event, d) {
    d.fx = event.x; d.fy = event.y;
  }
  function dragended(event, d) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null; d.fy = null;
  }
});
