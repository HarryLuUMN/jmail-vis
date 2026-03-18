const threads = [
  { id: "travel schedules", volume: 28, score: 7.5, attachments: 6, lateNight: true, burst: true, heavyAttachment: true, wideCc: false, participants: "Jeffrey, Lesley, Larry" },
  { id: "finance notes", volume: 17, score: 6.2, attachments: 4, lateNight: false, burst: true, heavyAttachment: true, wideCc: false, participants: "Jeffrey, Richard" },
  { id: "invite list", volume: 13, score: 4.6, attachments: 1, lateNight: false, burst: false, heavyAttachment: false, wideCc: true, participants: "Lesley, Boris, Karyna" },
  { id: "house logistics", volume: 15, score: 5.1, attachments: 2, lateNight: true, burst: false, heavyAttachment: false, wideCc: false, participants: "Bella, Lesley" },
  { id: "calendar sweep", volume: 24, score: 6.8, attachments: 0, lateNight: true, burst: true, heavyAttachment: false, wideCc: true, participants: "Jeffrey, Lesley" },
  { id: "guest manifest", volume: 10, score: 3.9, attachments: 5, lateNight: false, burst: false, heavyAttachment: true, wideCc: true, participants: "Lesley, House staff" }
];

const filters = {
  night: document.getElementById("night-filter"),
  burst: document.getElementById("burst-filter"),
  attachment: document.getElementById("attachment-filter"),
  multi: document.getElementById("multi-filter")
};

Object.values(filters).forEach((input) => input.addEventListener("change", render));

render();

function render() {
  const active = {
    night: filters.night.checked,
    burst: filters.burst.checked,
    attachment: filters.attachment.checked,
    multi: filters.multi.checked
  };

  const visible = threads.filter((thread) => {
    if (active.night && !thread.lateNight) return false;
    if (active.burst && !thread.burst) return false;
    if (active.attachment && !thread.heavyAttachment) return false;
    if (active.multi && !thread.wideCc) return false;
    return true;
  });

  document.getElementById("visible-count").textContent = String(visible.length);
  drawScatter(visible);
  drawCards(visible);
}

function drawScatter(rows) {
  const container = d3.select("#scatter");
  container.selectAll("*").remove();

  const width = 860;
  const height = 360;
  const margin = { top: 20, right: 24, bottom: 40, left: 42 };

  const x = d3.scaleLinear().domain([0, 32]).range([margin.left, width - margin.right]);
  const y = d3.scaleLinear().domain([0, 10]).range([height - margin.bottom, margin.top]);
  const radius = d3.scaleSqrt().domain([0, 6]).range([8, 24]);

  const svg = container
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("width", "100%");

  svg
    .append("g")
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .call(d3.axisBottom(x));

  svg
    .append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y));

  svg
    .append("g")
    .selectAll("circle")
    .data(rows)
    .join("circle")
    .attr("class", "point")
    .attr("cx", (d) => x(d.volume))
    .attr("cy", (d) => y(d.score))
    .attr("r", (d) => radius(d.attachments));

  svg
    .append("g")
    .selectAll("text")
    .data(rows)
    .join("text")
    .attr("x", (d) => x(d.volume))
    .attr("y", (d) => y(d.score) - radius(d.attachments) - 6)
    .attr("text-anchor", "middle")
    .attr("font-size", 12)
    .attr("fill", "#334155")
    .text((d) => d.id);
}

function drawCards(rows) {
  const wrap = d3.select("#cards");
  const cards = wrap.selectAll(".card").data(rows, (d) => d.id);
  cards.exit().remove();

  const enter = cards.append("article").attr("class", "card");
  enter.append("strong");
  enter.append("p");
  enter.append("div").attr("class", "badges");

  enter
    .merge(cards)
    .select("strong")
    .text((d) => d.id);

  enter
    .merge(cards)
    .select("p")
    .text((d) => `${d.volume} emails • suspicious score ${d.score} • ${d.participants}`);

  enter
    .merge(cards)
    .select(".badges")
    .each(function (d) {
      const badges = [];
      if (d.lateNight) badges.push("Late night");
      if (d.burst) badges.push("Burst volume");
      if (d.heavyAttachment) badges.push("Attachments");
      if (d.wideCc) badges.push("Wide CC");

      const badgeSelection = d3.select(this).selectAll("span").data(badges);
      badgeSelection.exit().remove();
      badgeSelection.join("span").text((value) => value);
    });
}
