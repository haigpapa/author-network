// Set dimensions and margins for the graph
const width = window.innerWidth;
const height = window.innerHeight;

// Create an SVG container
const svg = d3.select("#visualization")
  .append("svg")
    .attr("width", width)
    .attr("height", height);

// Load the data from the JSON file
d3.json("authors.json").then(function(data) {

  // Create a color scale for the groups
  const color = d3.scaleOrdinal(d3.schemeCategory10);

  // Initialize the force simulation
  const simulation = d3.forceSimulation(data.nodes)
      .force("link", d3.forceLink(data.links).id(d => d.id).distance(70))
      .force("charge", d3.forceManyBody().strength(-120))
      .force("center", d3.forceCenter(width / 2, height / 2));

  // Add the links (edges)
  const link = svg.append("g")
      .attr("class", "links")
    .selectAll("line")
    .data(data.links)
    .enter().append("line")
      .attr("class", "link")
      .style("stroke-width", d => Math.sqrt(d.value));

  // Add the nodes
  const node = svg.append("g")
      .attr("class", "nodes")
    .selectAll("g")
    .data(data.nodes)
    .enter().append("g")
      .attr("class", "node");

  const circles = node.append("circle")
      .attr("r", 10)
      .attr("fill", d => color(d.group));

  const labels = node.append("text")
      .text(d => d.id)
      .attr('x', 12)
      .attr('y', 4);

  // Add a tooltip for the touchstone
  circles.append("title")
      .text(d => d.touchstone);

  // Define the 'tick' function for the simulation
  simulation.on("tick", () => {
    link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

    node
        .attr("transform", d => `translate(${d.x},${d.y})`);
  });

});