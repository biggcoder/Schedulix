import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { useTheme } from '@mui/material/styles';

const SchedulingTimeline = ({ data, width = 800, height = 200 }) => {
  const svgRef = useRef();
  const theme = useTheme(); // Access MUI theme

  useEffect(() => {
    if (!data) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 30, bottom: 30, left: 40 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Append dark background
    svg.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', theme.palette.background.paper);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const startTime = d3.min(data, d => new Date(d.start));
    const endTime = d3.max(data, d => new Date(d.end));

    const xScale = d3.scaleTime()
      .domain([startTime, endTime])
      .range([0, innerWidth]);

    const yScale = d3.scaleBand()
      .domain(data.map(d => d.id))
      .range([0, innerHeight])
      .padding(0.1);

    // Bars
    g.selectAll('rect.task')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'task')
      .attr('y', d => yScale(d.id))
      .attr('x', d => xScale(new Date(d.start)))
      .attr('width', d => xScale(new Date(d.end)) - xScale(new Date(d.start)))
      .attr('height', yScale.bandwidth())
      .attr('fill', theme.palette.primary.main)
      .attr('rx', 4); // rounded corners

    // Labels
    g.selectAll('text.label')
      .data(data)
      .enter()
      .append('text')
      .attr('class', 'label')
      .attr('y', d => yScale(d.id) + yScale.bandwidth() / 2)
      .attr('x', d => xScale(new Date(d.start)) + 6)
      .attr('dy', '.35em')
      .text(d => d.label)
      .style('fill', theme.palette.text.primary)
      .style('font-size', '12px');

    // X Axis
    g.append('g')
      .attr('transform', `translate(0, ${innerHeight})`)
      .call(d3.axisBottom(xScale).tickSizeOuter(0))
      .selectAll('text')
      .style('fill', theme.palette.text.secondary);

    // Y Axis
    g.append('g')
      .call(d3.axisLeft(yScale).tickSizeOuter(0))
      .selectAll('text')
      .style('fill', theme.palette.text.secondary);

    // Axis lines
    svg.selectAll('.domain, .tick line')
      .attr('stroke', '#555');

  }, [data, width, height, theme]);

  return <svg ref={svgRef} width={width} height={height}></svg>;
};

export default SchedulingTimeline;
