const months = [
  { month: "2024-01-01", count: 18 },
  { month: "2024-02-01", count: 26 },
  { month: "2024-03-01", count: 34 },
  { month: "2024-04-01", count: 30 },
  { month: "2024-05-01", count: 42 },
  { month: "2024-06-01", count: 39 },
  { month: "2024-07-01", count: 46 },
  { month: "2024-08-01", count: 29 }
];

const emails = [
  { month: "2024-01-01", sender: "jeevacation@gmail.com", recipient: "lesley groff", thread: "Travel schedules", subject: "January routing", count: 5 },
  { month: "2024-01-01", sender: "lesley groff", recipient: "larry visoski", thread: "Travel schedules", subject: "Plane follow-up", count: 3 },
  { month: "2024-02-01", sender: "jeevacation@gmail.com", recipient: "karyna shuliak", thread: "Dinner planning", subject: "Tuesday dinner", count: 4 },
  { month: "2024-02-01", sender: "lesley groff", recipient: "jeevacation@gmail.com", thread: "Calendar sweep", subject: "Weekend recap", count: 6 },
  { month: "2024-03-01", sender: "jeevacation@gmail.com", recipient: "richard kahn", thread: "Finance notes", subject: "Wire transfer notes", count: 8 },
  { month: "2024-03-01", sender: "richard kahn", recipient: "lesley groff", thread: "Finance notes", subject: "Receipt confirmation", count: 5 },
  { month: "2024-04-01", sender: "jeevacation@gmail.com", recipient: "boris nikolic", thread: "Meeting setup", subject: "Lunch in New York", count: 7 },
  { month: "2024-04-01", sender: "karyna shuliak", recipient: "lesley groff", thread: "Meeting setup", subject: "Guest count", count: 4 },
  { month: "2024-05-01", sender: "jeevacation@gmail.com", recipient: "lesley groff", thread: "Travel schedules", subject: "Manifest updates", count: 10 },
  { month: "2024-05-01", sender: "larry visoski", recipient: "jeevacation@gmail.com", thread: "Travel schedules", subject: "Tail number ready", count: 8 },
  { month: "2024-05-01", sender: "lesley groff", recipient: "karyna shuliak", thread: "Staff coordination", subject: "Guest arrival", count: 5 },
  { month: "2024-06-01", sender: "jeevacation@gmail.com", recipient: "bella klein", thread: "House logistics", subject: "Palm Beach prep", count: 8 },
  { month: "2024-06-01", sender: "bella klein", recipient: "lesley groff", thread: "House logistics", subject: "Supplies update", count: 6 },
  { month: "2024-07-01", sender: "jeevacation@gmail.com", recipient: "lesley groff", thread: "Summer calendar", subject: "July grid", count: 11 },
  { month: "2024-07-01", sender: "lesley groff", recipient: "boris nikolic", thread: "Summer calendar", subject: "Invite list", count: 7 },
  { month: "2024-07-01", sender: "richard kahn", recipient: "jeevacation@gmail.com", thread: "Finance notes", subject: "Amended figures", count: 6 },
  { month: "2024-08-01", sender: "jeevacation@gmail.com", recipient: "karyna shuliak", thread: "Travel schedules", subject: "August return", count: 9 },
  { month: "2024-08-01", sender: "larry visoski", recipient: "lesley groff", thread: "Travel schedules", subject: "Crew update", count: 4 }
];

const parsedMonths = months.map((d) => ({ ...d, date: d3.timeMonth(new Date(d.month)) }));
const emailRows = emails.map((d) => ({ ...d, date: d3.timeMonth(new Date(d.month)) }));
const state = { brushedRange: null };

const rangeLabel = document.getElementById("range-label");
const threadList = d3.select("#thread-list");
const resetButton = document.getElementById("reset-brush");

drawTimeline();
updateViews(emailRows);

function drawTimeline() {
  const width = 1120;
  const height = 260;
  const margin = { top: 16, right: 20, bottom: 40, left: 48 };

  const svg = d3
    .select("#timeline")
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("width", "100%")
    .attr("height", "100%");

  const x = d3
    .scaleBand()
    .domain(parsedMonths.map((d) => d.date))
    .range([margin.left, width - margin.right])
    .padding(0.2);

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(parsedMonths, (d) => d.count)])
    .nice()
    .range([height - margin.bottom, margin.top]);

  const bars = svg
    .append("g")
    .selectAll("rect")
    .data(parsedMonths)
    .join("rect")
    .attr("class", "bar")
    .attr("x", (d) => x(d.date))
    .attr("y", (d) => y(d.count))
    .attr("width", x.bandwidth())
    .attr("height", (d) => y(0) - y(d.count));

  svg
    .append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .call(d3.axisBottom(x).tickFormat(d3.timeFormat("%b")));

  svg
    .append("g")
    .attr("class", "axis")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).ticks(5));

  const brush = d3
    .brushX()
    .extent([
      [margin.left, margin.top],
      [width - margin.right, height - margin.bottom]
    ])
    .on("brush end", ({ selection }) => {
      if (!selection) {
        state.brushedRange = null;
        bars.classed("inactive", false);
        rangeLabel.textContent = "All months";
        updateViews(emailRows);
        return;
      }

      const [x0, x1] = selection;
      const selectedMonths = parsedMonths.filter((d) => {
        const start = x(d.date);
        const end = start + x.bandwidth();
        return end >= x0 && start <= x1;
      });

      if (!selectedMonths.length) {
        return;
      }

      const minDate = d3.min(selectedMonths, (d) => d.date);
      const maxDate = d3.max(selectedMonths, (d) => d.date);
      state.brushedRange = [minDate, maxDate];
      bars.classed("inactive", (d) => d.date < minDate || d.date > maxDate);
      rangeLabel.textContent = `${d3.timeFormat("%b %Y")(minDate)} - ${d3.timeFormat("%b %Y")(maxDate)}`;
      updateViews(emailRows.filter((d) => d.date >= minDate && d.date <= maxDate));
    });

  svg.append("g").call(brush);

  resetButton.addEventListener("click", () => {
    svg.select(".brush").call(brush.move, null);
  });
}

function updateViews(filteredEmails) {
  drawNetwork(filteredEmails);
  drawThreadList(filteredEmails);
}

function drawNetwork(filteredEmails) {
  const container = d3.select("#network");
  container.selectAll("*").remove();

  const width = 720;
  const height = 420;
  const svg = container
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("width", "100%")
    .attr("height", "100%");

  const linkMap = d3.rollups(
    filteredEmails,
    (rows) => d3.sum(rows, (row) => row.count),
    (d) => d.sender,
    (d) => d.recipient
  );

  const links = [];
  linkMap.forEach(([source, targets]) => {
    targets.forEach(([target, weight]) => links.push({ source, target, weight }));
  });

  const nodes = Array.from(
    new Set(filteredEmails.flatMap((d) => [d.sender, d.recipient])),
    (id) => ({ id })
  );

  const simulation = d3
    .forceSimulation(nodes)
    .force("link", d3.forceLink(links).id((d) => d.id).distance(120))
    .force("charge", d3.forceManyBody().strength(-260))
    .force("center", d3.forceCenter(width / 2, height / 2));

  const link = svg
    .append("g")
    .selectAll("line")
    .data(links)
    .join("line")
    .attr("class", "link")
    .attr("stroke-width", (d) => 1 + d.weight * 0.5);

  const node = svg
    .append("g")
    .selectAll("circle")
    .data(nodes)
    .join("circle")
    .attr("class", "node")
    .attr("r", 14)
    .attr("fill", (d, i) => d3.schemeTableau10[i % 10]);

  const labels = svg
    .append("g")
    .selectAll("text")
    .data(nodes)
    .join("text")
    .attr("font-size", 12)
    .attr("font-weight", 600)
    .attr("fill", "#25313c")
    .text((d) => d.id);

  simulation.on("tick", () => {
    link
      .attr("x1", (d) => d.source.x)
      .attr("y1", (d) => d.source.y)
      .attr("x2", (d) => d.target.x)
      .attr("y2", (d) => d.target.y);

    node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
    labels.attr("x", (d) => d.x + 18).attr("y", (d) => d.y + 4);
  });
}

function drawThreadList(filteredEmails) {
  const threadRows = d3
    .rollups(
      filteredEmails,
      (rows) => ({
        total: d3.sum(rows, (row) => row.count),
        span: d3.extent(rows, (row) => row.date),
        participants: Array.from(new Set(rows.flatMap((row) => [row.sender, row.recipient])))
      }),
      (d) => d.thread
    )
    .sort((a, b) => d3.descending(a[1].total, b[1].total));

  const cards = threadList.selectAll(".thread-card").data(threadRows, (d) => d[0]);

  cards.exit().remove();

  const enter = cards.append("article").attr("class", "thread-card");
  enter.append("strong");
  enter.append("div").attr("class", "thread-meta");

  enter
    .merge(cards)
    .select("strong")
    .text(([thread]) => thread);

  enter
    .merge(cards)
    .select(".thread-meta")
    .text(([, meta]) => {
      const start = d3.timeFormat("%b")(meta.span[0]);
      const end = d3.timeFormat("%b")(meta.span[1]);
      return `${meta.total} emails • ${start} to ${end} • ${meta.participants.join(", ")}`;
    });
}
