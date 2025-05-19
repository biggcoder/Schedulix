import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { Box, Typography } from '@mui/material';

const ProcessTree = ({ data }) => {
  const svgRef = useRef();

  useEffect(() => {
    if (!data) {
      // Display a message if no data is available
      const svg = d3.select(svgRef.current);
      svg.selectAll('*').remove();
      
      svg.append('text')
        .attr('x', '50%')
        .attr('y', '50%')
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .style('font-size', '14px')
        .style('fill', '#aaa')
        .text('No process data available');
      
      return;
    }

    const svg = d3.select(svgRef.current);
    const width = parseInt(svg.style('width')) || 800;
    const height = parseInt(svg.style('height')) || 400;

    // Clear previous rendering
    svg.selectAll('*').remove();

    // Create a hierarchical layout
    const root = d3.hierarchy(data);
    
    // Tree layout
    const treeLayout = d3.tree()
      .size([width - 100, height - 100]);
    
    treeLayout(root);

    // Create a group for the entire visualization and center it
    const g = svg.append('g')
      .attr('transform', `translate(50, 50)`);

    // Add links between nodes
    g.selectAll('.link')
      .data(root.links())
      .join('path')
      .attr('class', 'link')
      .attr('d', d3.linkHorizontal()
        .x(d => d.y * 0.8) // Reduce horizontal spacing
        .y(d => d.x))
      .style('fill', 'none')
      .style('stroke', '#555')
      .style('stroke-width', 1.5);

    // Add nodes
    const nodes = g.selectAll('.node')
      .data(root.descendants())
      .join('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.y * 0.8},${d.x})`);

    // Add circles to nodes
    nodes.append('circle')
      .attr('r', 5)
      .style('fill', d => d.children ? '#555' : '#999')
      .style('stroke', '#fff')
      .style('stroke-width', 1.5);

    // Add labels to nodes
    nodes.append('text')
      .attr('dy', '0.31em')
      .attr('x', d => d.children ? -8 : 8)
      .style('text-anchor', d => d.children ? 'end' : 'start')
      .style('font-size', '12px')
      .style('fill', '#fff')
      .text(d => `${d.data.name} (${d.data.pid})`);

  }, [data]);

  return (
    <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
      <svg 
        ref={svgRef} 
        style={{ width: '100%', height: '100%', overflow: 'visible' }}
      />
    </Box>
  );
};

export default ProcessTree;