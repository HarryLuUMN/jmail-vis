const threadData = [
  { month: "Jan", participants: ["jeevacation@gmail.com", "lesley groff"], volume: 12, subject: "Travel schedule reset" },
  { month: "Feb", participants: ["jeevacation@gmail.com", "karyna shuliak"], volume: 8, subject: "Dinner planning" },
  { month: "Mar", participants: ["richard kahn", "jeevacation@gmail.com"], volume: 14, subject: "Finance notes" },
  { month: "Apr", participants: ["boris nikolic", "lesley groff"], volume: 7, subject: "Invite list review" },
  { month: "May", participants: ["larry visoski", "jeevacation@gmail.com"], volume: 16, subject: "Flight routing" },
  { month: "Jun", participants: ["bella klein", "lesley groff"], volume: 11, subject: "House logistics" },
  { month: "Jul", participants: ["jeevacation@gmail.com", "boris nikolic"], volume: 9, subject: "New York lunch" },
  { month: "Aug", participants: ["lesley groff", "karyna shuliak"], volume: 10, subject: "Guest arrival" }
];

const networkLinks = [
  { source: "jeevacation@gmail.com", target: "lesley groff", weight: 18 },
  { source: "jeevacation@gmail.com", target: "richard kahn", weight: 11 },
  { source: "jeevacation@gmail.com", target: "larry visoski", weight: 10 },
  { source: "jeevacation@gmail.com", target: "boris nikolic", weight: 8 },
  { source: "lesley groff", target: "karyna shuliak", weight: 14 },
  { source: "lesley groff", target: "bella klein", weight: 12 },
  { source: "boris nikolic", target: "richard kahn", weight: 5 },
  { source: "larry visoski", target: "lesley groff", weight: 7 }
];

const nodes = Array.from(
  new Set(networkLinks.flatMap((d) => [d.source, d.target])),
  (id) => ({ id })
);

const input = document.getElementById("search-input");
const results = d3.select("#results");

drawHistogram("");
drawNetwork("");
updateResults("");

input.addEventListener("input", (event) => {
  const query = event.target.value.trim().toLowerCase();
  drawHistogram(query);
  drawNetwork(query);
  updateResults(query);
});

function isMatch(query, values) {
  if (!query) {
    return false;
  }
  return values.some((value) => value.toLowerCase().includes(query));
}

function drawHistogram(query) {
  const container = d3.select("#histogram");
  container.selectAll("*").remove();

  const width = 560;
  const height = 300;
  const margin = { top: 14, right: 18, bottom: 34, left: 42 };

  const svg = container
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("width", "100%");

  const x = d3
    .scaleBand()
    .domain(threadData.map((d) => d.month))
    .range([margin.left, width - margin.right])
    .padding(0.24);

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(threadData, (d) => d.volume)])
    .nice()
    .range([height - margin.bottom, margin.top]);

  svg
    .append("g")
    .selectAll("rect")
    .data(threadData)
    .join("rect")
    .attr("class", (d) => `bar${isMatch(query, [...d.participants, d.subject]) ? " match" : ""}`)
    .attr("x", (d) => x(d.month))
    .attr("y", (d) => y(d.volume))
    .attr("width", x.bandwidth())
    .attr("height", (d) => y(0) - y(d.volume));

  svg
    .append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x));

  svg
    .append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).ticks(5));
}

function drawNetwork(query) {
  const container = d3.select("#network");
  container.selectAll("*").remove();

  const width = 640;
  const height = 360;
  const svg = container
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("width", "100%");

  const matchedIds = new Set(
    nodes.filter((node) => query && node.id.toLowerCase().includes(query)).map((node) => node.id)
  );
  const contextualIds = new Set();

  networkLinks.forEach((link) => {
    if (matchedIds.has(link.source) || matchedIds.has(link.target)) {
      contextualIds.add(link.source);
      contextualIds.add(link.target);
    }
  });

  const simulation = d3
    .forceSimulation(nodes.map((d) => ({ ...d })))
    .force("link", d3.forceLink(networkLinks.map((d) => ({ ...d }))).id((d) => d.id).distance(110))
    .force("charge", d3.forceManyBody().strength(-260))
    .force("center", d3.forceCenter(width / 2, height / 2));

  const link = svg
    .append("g")
    .selectAll("line")
    .data(networkLinks)
    .join("line")
    .attr("class", (d) => {
      const highlighted = matchedIds.has(d.source) || matchedIds.has(d.target);
      return `link${highlighted ? " match" : ""}`;
    })
    .attr("stroke-width", (d) => 1 + d.weight * 0.28);

  const node = svg
    .append("g")
    .selectAll("circle")
    .data(simulation.nodes())
    .join("circle")
    .attr("class", (d) => {
      const classes = ["node"];
      if (matchedIds.has(d.id)) {
        classes.push("match");
      } else if (contextualIds.has(d.id)) {
        classes.push("context");
      }
      return classes.join(" ");
    })
    .attr("r", (d) => (matchedIds.has(d.id) ? 18 : 14))
    .attr("fill", (d) => (matchedIds.has(d.id) ? "#f4a261" : contextualIds.has(d.id) ? "#4f6d7a" : "#b7d5e3"));

  const labels = svg
    .append("g")
    .selectAll("text")
    .data(simulation.nodes())
    .join("text")
    .attr("font-size", 12)
    .attr("fill", "#263541")
    .text((d) => d.id);

  simulation.on("tick", () => {
    link
      .attr("x1", (d) => d.source.x)
      .attr("y1", (d) => d.source.y)
      .attr("x2", (d) => d.target.x)
      .attr("y2", (d) => d.target.y);

    node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
    labels.attr("x", (d) => d.x + 16).attr("y", (d) => d.y + 4);
  });
}

function updateResults(query) {
  const filtered = query
    ? threadData.filter((d) => isMatch(query, [...d.participants, d.subject]))
    : threadData;

  const cards = results.selectAll(".result-card").data(filtered, (d) => `${d.month}-${d.subject}`);
  cards.exit().remove();

  const enter = cards.append("article").attr("class", "result-card");
  enter.append("strong");
  enter.append("p");

  enter
    .merge(cards)
    .select("strong")
    .text((d) => `${d.month}: ${d.subject}`);

  enter
    .merge(cards)
    .select("p")
    .text((d) => `${d.volume} emails • ${d.participants.join(" ↔ ")}`);
}
