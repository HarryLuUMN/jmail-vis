const allLinks = [
  { source: "jeevacation@gmail.com", target: "lesley groff", weight: 28 },
  { source: "jeevacation@gmail.com", target: "richard kahn", weight: 16 },
  { source: "jeevacation@gmail.com", target: "larry visoski", weight: 18 },
  { source: "jeevacation@gmail.com", target: "karyna shuliak", weight: 15 },
  { source: "jeevacation@gmail.com", target: "boris nikolic", weight: 10 },
  { source: "lesley groff", target: "karyna shuliak", weight: 20 },
  { source: "lesley groff", target: "bella klein", weight: 14 },
  { source: "lesley groff", target: "ann rodriquez", weight: 9 },
  { source: "richard kahn", target: "boris nikolic", weight: 6 },
  { source: "larry visoski", target: "pilot crew", weight: 11 },
  { source: "karyna shuliak", target: "bella klein", weight: 13 },
  { source: "boris nikolic", target: "scientific circle", weight: 7 },
  { source: "ann rodriquez", target: "house staff", weight: 8 }
];

const focusContacts = [
  "jeevacation@gmail.com",
  "lesley groff",
  "richard kahn",
  "karyna shuliak"
];

const buttonWrap = d3.select("#contact-buttons");
const table = d3.select("#table");
const focusName = document.getElementById("focus-name");
const strongestTie = document.getElementById("strongest-tie");
const ringCounts = document.getElementById("ring-counts");

let currentFocus = focusContacts[0];

buttonWrap
  .selectAll("button")
  .data(focusContacts)
  .join("button")
  .attr("class", (d) => (d === currentFocus ? "active" : null))
  .text((d) => d)
  .on("click", (_, d) => {
    currentFocus = d;
    buttonWrap.selectAll("button").classed("active", (value) => value === d);
    render(d);
  });

render(currentFocus);

function render(focus) {
  const { nodes, links, oneHop, twoHop } = buildEgoGraph(focus);
  focusName.textContent = focus;

  const directConnections = links
    .filter((link) => link.depth === 1)
    .sort((a, b) => d3.descending(a.weight, b.weight));
  strongestTie.textContent = directConnections.length
    ? otherEnd(directConnections[0], focus)
    : "No direct ties";
  ringCounts.textContent = `1 hop: ${oneHop.length} • 2 hops: ${twoHop.length}`;

  drawNetwork(focus, nodes, links);
  drawTable(focus, directConnections);
}

function buildEgoGraph(focus) {
  const adjacency = new Map();
  allLinks.forEach((link) => {
    if (!adjacency.has(link.source)) {
      adjacency.set(link.source, new Set());
    }
    if (!adjacency.has(link.target)) {
      adjacency.set(link.target, new Set());
    }
    adjacency.get(link.source).add(link.target);
    adjacency.get(link.target).add(link.source);
  });

  const oneHop = Array.from(adjacency.get(focus) || []);
  const twoHop = Array.from(
    new Set(oneHop.flatMap((node) => Array.from(adjacency.get(node) || [])))
  ).filter((node) => node !== focus && !oneHop.includes(node));

  const allowed = new Set([focus, ...oneHop, ...twoHop]);
  const links = allLinks
    .filter((link) => allowed.has(link.source) && allowed.has(link.target))
    .map((link) => ({
      ...link,
      depth:
        link.source === focus || link.target === focus
          ? 1
          : oneHop.includes(link.source) && oneHop.includes(link.target)
            ? 1.5
            : 2
    }));

  const nodes = Array.from(allowed, (id) => ({
    id,
    ring: id === focus ? 0 : oneHop.includes(id) ? 1 : 2
  }));

  return { nodes, links, oneHop, twoHop };
}

function drawNetwork(focus, nodes, links) {
  const container = d3.select("#network");
  container.selectAll("*").remove();

  const width = 720;
  const height = 540;
  const svg = container
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("width", "100%");

  const simulation = d3
    .forceSimulation(nodes.map((d) => ({ ...d })))
    .force("link", d3.forceLink(links.map((d) => ({ ...d }))).id((d) => d.id).distance((d) => (d.depth === 1 ? 110 : 160)))
    .force("charge", d3.forceManyBody().strength(-340))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collision", d3.forceCollide().radius((d) => (d.ring === 0 ? 34 : d.ring === 1 ? 26 : 22)));

  const link = svg
    .append("g")
    .selectAll("line")
    .data(links)
    .join("line")
    .attr("class", "link")
    .attr("stroke-width", (d) => 1 + d.weight * 0.18)
    .attr("stroke", (d) => (d.depth === 1 ? "rgba(231, 111, 81, 0.6)" : "rgba(61, 90, 128, 0.24)"));

  const node = svg
    .append("g")
    .selectAll("circle")
    .data(simulation.nodes())
    .join("circle")
    .attr("class", "node")
    .attr("r", (d) => (d.ring === 0 ? 24 : d.ring === 1 ? 18 : 13))
    .attr("fill", (d) => (d.ring === 0 ? "#e76f51" : d.ring === 1 ? "#3d5a80" : "#b7c6d9"));

  const labels = svg
    .append("g")
    .selectAll("text")
    .data(simulation.nodes())
    .join("text")
    .attr("font-size", (d) => (d.id === focus ? 13 : 12))
    .attr("font-weight", (d) => (d.id === focus ? 700 : 500))
    .attr("fill", "#23313d")
    .text((d) => d.id);

  simulation.on("tick", () => {
    const center = simulation.nodes().find((nodeData) => nodeData.id === focus);
    if (center) {
      center.fx = width / 2;
      center.fy = height / 2;
    }

    link
      .attr("x1", (d) => d.source.x)
      .attr("y1", (d) => d.source.y)
      .attr("x2", (d) => d.target.x)
      .attr("y2", (d) => d.target.y);

    node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
    labels.attr("x", (d) => d.x + 16).attr("y", (d) => d.y + 4);
  });
}

function drawTable(focus, rows) {
  const cards = table.selectAll(".row").data(rows, (d) => `${d.source}-${d.target}`);
  cards.exit().remove();

  const enter = cards.append("article").attr("class", "row");
  enter.append("strong");
  enter.append("p");

  enter
    .merge(cards)
    .select("strong")
    .text((d) => otherEnd(d, focus));

  enter
    .merge(cards)
    .select("p")
    .text((d) => `${d.weight} emails • direct tie with ${focus}`);
}

function otherEnd(link, focus) {
  return link.source === focus ? link.target : link.source;
}
