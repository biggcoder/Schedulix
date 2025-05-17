import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

const SchedulingTimeline = ({ data, width = 800, height = 200 }) => {
  const svgRef = useRef();

  useEffect(() => {
    if (!data) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous content

    const margin = { top: 20, right: 30, bottom: 30, left: 40 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg.append("g")
                 .attr("transform", `translate(${margin.left},${margin.top})`);

    // Assuming data is an array of objects with { id, start, end, label }
    const startTime = d3.min(data, d => new Date(d.start));
    const endTime = d3.max(data, d => new Date(d.end));

    const xScale = d3.scaleTime()
                     .domain([startTime, endTime])
                     .range([0, innerWidth]);

    const yScale = d3.scaleBand()
                     .domain(data.map(d => d.id))
                     .range([0, innerHeight])
                     .padding(0.1);

    g.selectAll("rect")
      .data(data)
      .enter()
      .append("rect")
      .attr("y", d => yScale(d.id))
      .attr("x", d => xScale(new Date(d.start)))
      .attr("width", d => xScale(new Date(d.end)) - xScale(new Date(d.start)))
      .attr("height", yScale.bandwidth())
      .attr("fill", "steelblue"); // Or a more dynamic color

    g.selectAll("text")
      .data(data)
      .enter()
      .append("text")
      .attr("y", d => yScale(d.id) + yScale.bandwidth() / 2)
      .attr("x", d => xScale(new Date(d.start)) + 5) // Offset label
      .attr("dy", ".35em")
      .text(d => d.label)
      .style("font-size", "12px")
      .style("fill", "white"); // Adjust text color for dark theme

    g.append("g")
     .attr("transform", `translate(0, ${innerHeight})`)
     .call(d3.axisBottom(xScale));

    g.append("g")
     .call(d3.axisLeft(yScale));

  }, [data, width, height]);

  return (
    <svg ref={svgRef} width={width} height={height}></svg>
  );
};

export default SchedulingTimeline;