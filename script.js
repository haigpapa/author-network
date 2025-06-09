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

// --- NEW: A variable to store the currently selected node ---
let selectedNode = null;


// Load the data from the JSON file
d3.json("authors.json").then(function(data) {

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

  // --- UPDATED EVENT HANDLERS ---

  // Update info panel
  function updateInfoPanel(d) {
    if (d) {
      infoPanel.html(`<h2>${d.id}</h2><p>"${d.touchstone}"</p>`);
    } else {
      infoPanel.html(`<p>Hover over an author, or click to select.</p>`);
    }
  }

  // Handle mouseover
  node.on("mouseover", (event, d) => {
    if (!selectedNode) { // Only show hover effect if nothing is selected
      updateInfoPanel(d);
    }
    d3.select(event.currentTarget).select("circle").attr("r", 12);
  });

  // Handle mouseout
  node.on("mouseout", (event, d) => {
    if (!selectedNode) {
      updateInfoPanel(null);
    }
    d3.select(event.currentTarget).select("circle").attr("r", 8);
  });

  // --- NEW: Handle click events ---
  node.on("click", (event, d) => {
    if (selectedNode && selectedNode.id === d.id) {
      // If the clicked node is already selected, unselect it
      selectedNode = null;
      node.classed("selected", false); // Remove selected class from all nodes
    } else {
      // Otherwise, select the new node
      selectedNode = d;
      node.classed("selected", n => n.id === d.id); // Set selected class on the clicked node
    }
    updateInfoPanel(selectedNode);
  });

  // --- NEW: Clear selection when clicking the background ---
  svg.on("click", (event) => {
    if (event.target.tagName === 'svg') { // Ensure we clicked the SVG, not a node
      selectedNode = null;
      node.classed("selected", false);
      updateInfoPanel(null);
    }
  });


  // Make nodes draggable
  node.call(d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended));

  simulation.on("tick", () => {
    link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);
    node
        .attr("transform", d => `translate(${d.x},${d.y})`);
  });

  // Drag functions
  function dragstarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }
  function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
  }
  function dragended(event, d) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }
});
