const threads = [
  {
    id: "travel",
    title: "Travel schedules",
    subtitle: "A logistics-heavy thread between Jeffrey, Lesley, and Larry.",
    messages: [
      { time: "2024-05-02T08:30:00", sender: "jeevacation@gmail.com", summary: "Send me the revised routing for Palm Beach." },
      { time: "2024-05-02T09:10:00", sender: "lesley groff", summary: "Larry has the tail number and passenger count." },
      { time: "2024-05-02T09:42:00", sender: "larry visoski", summary: "Crew is confirmed and departure is pushed back 40 minutes." },
      { time: "2024-05-02T10:15:00", sender: "jeevacation@gmail.com", summary: "Keep Lesley copied if any names change." }
    ]
  },
  {
    id: "finance",
    title: "Finance notes",
    subtitle: "A compact chain with Richard Kahn around amended figures.",
    messages: [
      { time: "2024-03-11T11:05:00", sender: "richard kahn", summary: "Attached is the amended figure sheet from this morning." },
      { time: "2024-03-11T11:18:00", sender: "jeevacation@gmail.com", summary: "Please separate the pending wire from the settled one." },
      { time: "2024-03-11T12:01:00", sender: "richard kahn", summary: "Updated and sent. The balance note is highlighted." }
    ]
  },
  {
    id: "invite",
    title: "Invite list",
    subtitle: "A social planning thread crossing Lesley, Boris, and Karyna.",
    messages: [
      { time: "2024-07-14T15:20:00", sender: "lesley groff", summary: "Need a final read on the lunch invite names." },
      { time: "2024-07-14T16:02:00", sender: "boris nikolic", summary: "Two additions from the science side would be good." },
      { time: "2024-07-14T16:35:00", sender: "karyna shuliak", summary: "I can handle seating if the list is final by tonight." },
      { time: "2024-07-14T17:00:00", sender: "lesley groff", summary: "Locking it in and circulating the final version." }
    ]
  }
];

const buttons = d3.select("#thread-buttons");
const titleEl = document.getElementById("thread-title");
const subtitleEl = document.getElementById("thread-subtitle");
const playButton = document.getElementById("play-button");
const resetButton = document.getElementById("reset-button");
const messagesWrap = d3.select("#messages");

let currentThread = threads[0];
let animationTimer = null;

buttons
  .selectAll("button")
  .data(threads)
  .join("button")
  .attr("class", (d) => (d.id === currentThread.id ? "active" : null))
  .text((d) => d.title)
  .on("click", (_, d) => {
    stopReplay();
    currentThread = d;
    buttons.selectAll("button").classed("active", (value) => value.id === d.id);
    renderThread(d, -1);
  });

playButton.addEventListener("click", () => startReplay(currentThread));
resetButton.addEventListener("click", () => {
  stopReplay();
  renderThread(currentThread, -1);
});

renderThread(currentThread, -1);

function renderThread(thread, activeIndex) {
  titleEl.textContent = thread.title;
  subtitleEl.textContent = thread.subtitle;
  drawTimeline(thread, activeIndex);

  const cards = messagesWrap.selectAll(".message-card").data(thread.messages);
  cards.exit().remove();

  const enter = cards.append("article").attr("class", "message-card");
  enter.append("strong");
  enter.append("p");

  enter
    .merge(cards)
    .attr("class", (d, i) => {
      const classes = ["message-card"];
      if (i <= activeIndex) {
        classes.push("visible");
      }
      if (i === activeIndex) {
        classes.push("current");
      }
      return classes.join(" ");
    });

  enter
    .merge(cards)
    .select("strong")
    .text((d) => `${formatClock(d.time)} • ${d.sender}`);

  enter
    .merge(cards)
    .select("p")
    .text((d) => d.summary);
}

function drawTimeline(thread, activeIndex) {
  const container = d3.select("#timeline");
  container.selectAll("*").remove();

  const width = 760;
  const height = 220;
  const margin = { top: 18, right: 26, bottom: 40, left: 40 };

  const parsed = thread.messages.map((d) => ({ ...d, date: new Date(d.time) }));
  const x = d3
    .scaleTime()
    .domain(d3.extent(parsed, (d) => d.date))
    .range([margin.left, width - margin.right]);

  const svg = container
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("width", "100%");

  svg
    .append("line")
    .attr("x1", margin.left)
    .attr("x2", width - margin.right)
    .attr("y1", height / 2)
    .attr("y2", height / 2)
    .attr("stroke", "#bed0dd")
    .attr("stroke-width", 4)
    .attr("stroke-linecap", "round");

  svg
    .append("g")
    .selectAll("circle")
    .data(parsed)
    .join("circle")
    .attr("class", (d, i) => `dot${i < activeIndex ? " done" : ""}${i === activeIndex ? " active" : ""}`)
    .attr("cx", (d) => x(d.date))
    .attr("cy", height / 2)
    .attr("r", (d, i) => (i === activeIndex ? 11 : 8));

  svg
    .append("g")
    .selectAll("text")
    .data(parsed)
    .join("text")
    .attr("x", (d) => x(d.date))
    .attr("y", height / 2 - 18)
    .attr("text-anchor", "middle")
    .attr("font-size", 12)
    .attr("fill", "#445464")
    .text((d) => formatClock(d.time));

  svg
    .append("g")
    .attr("transform", `translate(0, ${height - margin.bottom + 12})`)
    .call(d3.axisBottom(x).ticks(parsed.length).tickFormat(d3.timeFormat("%H:%M")));
}

function startReplay(thread) {
  stopReplay();
  let index = -1;
  animationTimer = window.setInterval(() => {
    index += 1;
    renderThread(thread, index);
    if (index >= thread.messages.length - 1) {
      stopReplay();
    }
  }, 900);
}

function stopReplay() {
  if (animationTimer) {
    window.clearInterval(animationTimer);
    animationTimer = null;
  }
}

function formatClock(value) {
  return d3.timeFormat("%b %d, %H:%M")(new Date(value));
}
