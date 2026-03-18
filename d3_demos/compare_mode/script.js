const profiles = {
  "jeevacation@gmail.com": {
    monthly: [
      { month: "Jan", value: 12 },
      { month: "Feb", value: 10 },
      { month: "Mar", value: 18 },
      { month: "Apr", value: 15 },
      { month: "May", value: 24 },
      { month: "Jun", value: 19 }
    ],
    contacts: [
      { name: "lesley groff", value: 30 },
      { name: "larry visoski", value: 18 },
      { name: "richard kahn", value: 16 },
      { name: "karyna shuliak", value: 14 }
    ]
  },
  "lesley groff": {
    monthly: [
      { month: "Jan", value: 8 },
      { month: "Feb", value: 11 },
      { month: "Mar", value: 13 },
      { month: "Apr", value: 17 },
      { month: "May", value: 20 },
      { month: "Jun", value: 22 }
    ],
    contacts: [
      { name: "jeevacation@gmail.com", value: 28 },
      { name: "karyna shuliak", value: 19 },
      { name: "bella klein", value: 15 },
      { name: "ann rodriquez", value: 11 }
    ]
  },
  "richard kahn": {
    monthly: [
      { month: "Jan", value: 4 },
      { month: "Feb", value: 7 },
      { month: "Mar", value: 15 },
      { month: "Apr", value: 9 },
      { month: "May", value: 12 },
      { month: "Jun", value: 8 }
    ],
    contacts: [
      { name: "jeevacation@gmail.com", value: 16 },
      { name: "boris nikolic", value: 9 },
      { name: "lesley groff", value: 6 },
      { name: "finance staff", value: 5 }
    ]
  },
  "karyna shuliak": {
    monthly: [
      { month: "Jan", value: 6 },
      { month: "Feb", value: 9 },
      { month: "Mar", value: 8 },
      { month: "Apr", value: 12 },
      { month: "May", value: 14 },
      { month: "Jun", value: 16 }
    ],
    contacts: [
      { name: "lesley groff", value: 19 },
      { name: "jeevacation@gmail.com", value: 14 },
      { name: "bella klein", value: 12 },
      { name: "house staff", value: 7 }
    ]
  }
};

const options = Object.keys(profiles);
const leftSelect = document.getElementById("left-select");
const rightSelect = document.getElementById("right-select");

populate(leftSelect, options, options[0]);
populate(rightSelect, options, options[1]);

leftSelect.addEventListener("change", render);
rightSelect.addEventListener("change", render);

render();

function populate(select, values, initial) {
  values.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    option.selected = value === initial;
    select.appendChild(option);
  });
}

function render() {
  const left = profiles[leftSelect.value];
  const right = profiles[rightSelect.value];
  drawTimeline(left, right);
  drawMirror(left, right);
}

function drawTimeline(left, right) {
  const container = d3.select("#timeline");
  container.selectAll("*").remove();

  const width = 1040;
  const height = 320;
  const margin = { top: 20, right: 28, bottom: 40, left: 40 };
  const months = left.monthly.map((d) => d.month);
  const x = d3.scalePoint().domain(months).range([margin.left, width - margin.right]);
  const y = d3
    .scaleLinear()
    .domain([0, d3.max([...left.monthly, ...right.monthly], (d) => d.value)])
    .nice()
    .range([height - margin.bottom, margin.top]);

  const svg = container
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("width", "100%");

  const line = d3
    .line()
    .x((d) => x(d.month))
    .y((d) => y(d.value));

  svg
    .append("path")
    .datum(left.monthly)
    .attr("fill", "none")
    .attr("stroke-width", 3)
    .attr("class", "line-left")
    .attr("d", line);

  svg
    .append("path")
    .datum(right.monthly)
    .attr("fill", "none")
    .attr("stroke-width", 3)
    .attr("class", "line-right")
    .attr("d", line);

  [left.monthly, right.monthly].forEach((series, index) => {
    svg
      .append("g")
      .selectAll("circle")
      .data(series)
      .join("circle")
      .attr("cx", (d) => x(d.month))
      .attr("cy", (d) => y(d.value))
      .attr("r", 5)
      .attr("fill", index === 0 ? "#2a9d8f" : "#e76f51");
  });

  svg
    .append("g")
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .call(d3.axisBottom(x));

  svg
    .append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).ticks(5));

  svg
    .append("text")
    .attr("x", width - margin.right - 180)
    .attr("y", margin.top)
    .attr("fill", "#2a9d8f")
    .attr("font-weight", 700)
    .text(leftSelect.value);

  svg
    .append("text")
    .attr("x", width - margin.right - 180)
    .attr("y", margin.top + 22)
    .attr("fill", "#e76f51")
    .attr("font-weight", 700)
    .text(rightSelect.value);
}

function drawMirror(left, right) {
  const container = d3.select("#mirror");
  container.selectAll("*").remove();

  const width = 1040;
  const height = 340;
  const margin = { top: 20, right: 40, bottom: 34, left: 40 };
  const names = Array.from(
    new Set([...left.contacts.map((d) => d.name), ...right.contacts.map((d) => d.name)])
  );
  const valueLookup = (series) =>
    new Map(series.map((d) => [d.name, d.value]));
  const leftMap = valueLookup(left.contacts);
  const rightMap = valueLookup(right.contacts);

  const y = d3.scaleBand().domain(names).range([margin.top, height - margin.bottom]).padding(0.18);
  const x = d3
    .scaleLinear()
    .domain([
      -d3.max(names, (name) => leftMap.get(name) || 0),
      d3.max(names, (name) => rightMap.get(name) || 0)
    ])
    .nice()
    .range([margin.left, width - margin.right]);

  const svg = container
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("width", "100%");

  svg
    .append("line")
    .attr("x1", x(0))
    .attr("x2", x(0))
    .attr("y1", margin.top)
    .attr("y2", height - margin.bottom)
    .attr("stroke", "#9ca3af")
    .attr("stroke-dasharray", "4 4");

  svg
    .append("g")
    .selectAll("rect.left")
    .data(names)
    .join("rect")
    .attr("class", "mirror-left")
    .attr("x", (name) => x(-(leftMap.get(name) || 0)))
    .attr("y", (name) => y(name))
    .attr("width", (name) => x(0) - x(-(leftMap.get(name) || 0)))
    .attr("height", y.bandwidth());

  svg
    .append("g")
    .selectAll("rect.right")
    .data(names)
    .join("rect")
    .attr("class", "mirror-right")
    .attr("x", x(0))
    .attr("y", (name) => y(name))
    .attr("width", (name) => x(rightMap.get(name) || 0) - x(0))
    .attr("height", y.bandwidth());

  svg
    .append("g")
    .selectAll("text.label")
    .data(names)
    .join("text")
    .attr("x", x(0))
    .attr("y", (name) => y(name) + y.bandwidth() / 2 + 4)
    .attr("text-anchor", "middle")
    .attr("font-size", 12)
    .attr("fill", "#334155")
    .text((name) => name);

  svg
    .append("g")
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .call(d3.axisBottom(x).ticks(6).tickFormat((d) => Math.abs(d)));
}
