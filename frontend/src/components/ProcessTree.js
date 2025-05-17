import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

const ProcessTree = ({ data }) => {
  const svgRef = useRef();

  useEffect(() => {
    if (!data) return;

    const svg = d3.select(svgRef.current);
    const width = svg.attr('width');
    const height = svg.attr('height');

    // Clear previous rendering
    svg.selectAll('*').remove();

    const root = d3.hierarchy(data);
    const links = root.links();
    const nodes = root.descendants();

    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2));

    const link = svg.append('g')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .selectAll('line')
      .data(links)
      .join('line');

    const node = svg.append('g')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5)
      .selectAll('circle')
      .data(nodes)
      .join('circle')
      .attr('r', 5)
      .attr('fill', d => d.children ? '#555' : '#999');

    const text = svg.append('g')
      .attr('stroke', '#fff')
      .attr('stroke-width', 0.5)
      .selectAll('text')
      .data(nodes)
      .join('text')
      .attr('dy', -10)
      .attr('x', d => d.children ? -6 : 6)
      .text(d => d.data.name)
      .style('font-size', '10px')
      .style('text-anchor', d => d.children ? 'end' : 'start');


    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      node
        .attr('cx', d => d.x)
        .attr('cy', d => d.y);

      text
        .attr('x', d => d.x)
        .attr('y', d => d.y);
    });

  }, [data]);

  return (
    <svg ref={svgRef} width="800" height="600"></svg>
  );
};

export default ProcessTree;