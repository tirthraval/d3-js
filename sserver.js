import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

const data = await d3.csv('./data.csv');
const filterData = data.filter((d) => d.series === 'series_a');

const margin = { top: 20, right: 20, bottom: 30, left: 70 };
const width = 600 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

const svg = d3.select('#time-series')
  .append('svg')
  .attr('width', width + margin.left + margin.right)
  .attr('height', height + margin.top + margin.bottom + height / 2 + margin.bottom)
  .append('g')
  .attr('transform', `translate(${margin.left}, ${margin.top})`);

const parseDate = d3.isoParse;

filterData.forEach((d) => {
  d.timestamp = parseDate(d.timestamp);
  d.value = parseFloat(d.value);
});

const filterDateArray = filterData.map(d => d.timestamp);
const dateDomain = d3.extent(filterDateArray);

const xScale = d3.scaleTime().domain(dateDomain).range([0, width]);
const xAxis = d3.axisBottom(xScale).ticks(7).tickSize(10);

const gX = svg.append("g")
  .attr("class", "x-axis")
  .attr("transform", `translate(0, ${height})`)
  .call(xAxis);

const y = d3.scaleLinear()
  .domain([0, d3.max(filterData, (data) => +data.value)])
  .range([height, 0]);

const gY = svg.append("g")
  .attr("class", "y-axis")
  .call(d3.axisLeft(y));

const line = d3.line()
  .x(d => xScale(d.timestamp))
  .y(d => y(d.value));

const path = svg.append("path")
  .datum(filterData)
  .attr("fill", "none")
  .attr("stroke", "steelblue")
  .attr("stroke-width", 1.5)
  .attr("d", line);

const svg2 = svg.append('g')
  .attr('transform', `translate(0, ${height + margin.bottom + margin.top})`);

const y2 = d3.scaleLinear()
  .domain([0, d3.max(filterData, (data) => +data.value)])
  .range([height / 2 - margin.bottom, margin.top]);

const line2 = d3.line()
  .x(d => xScale(d.timestamp))
  .y(d => y2(d.value));

svg2.append("path")
  .datum(filterData)
  .attr("fill", "none")
  .attr("stroke", "steelblue")
  .attr("stroke-width", 1.5)
  .attr("d", line2);

svg2.append("g")
  .attr("transform", `translate(0, ${height / 2 - margin.bottom})`)
  .call(xAxis);

// Create brushes
const brush = d3.brushX()
  .extent([[0, 0], [width, height / 2 - margin.bottom]])
  .on("brush", brushed)
  .on("end", brushended);

svg2.append("g")
  .attr("class", "brush")
  .call(brush);

const brush1 = d3.brushX()
  .extent([[0, 0], [width, height]])
  .on("end", clearBrush1);

const brush1G = svg.append("g")
  .attr("class", "brush1")
  .call(brush1);

// Brush event handlers
function brushed(event) {
  const selection = event.selection;
  if (selection) {
    const [x0, x1] = selection.map(xScale.invert);
    const newData = filterData.filter(d => d.timestamp >= x0 && d.timestamp <= x1);
    updateGraph(newData);
  }
}

function brushended(event) {
  if (!event.selection) {
    updateGraph(filterData);
  } else {
    // Clear brush1 selection
    brush1G.call(brush1.move, null);
  }
}

function clearBrush1(event) {
  // Do nothing if the brush on the first graph is used
}

// Function to update the first graph
function updateGraph(data) {
  const newXScale = d3.scaleTime().domain(d3.extent(data, d => d.timestamp)).range([0, width]);
  const newYScale = d3.scaleLinear().domain([0, d3.max(data, d => +d.value)]).range([height, 0]);

  const newLine = d3.line()
    .x(d => newXScale(d.timestamp))
    .y(d => newYScale(d.value));

  path.datum(data)
    .transition()
    .attr("d", newLine);

  gX.transition()
    .call(d3.axisBottom(newXScale).ticks(7).tickSize(10));

  gY.transition()
    .call(d3.axisLeft(newYScale));
}