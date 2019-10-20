/*
 *  A Dockerised nginx + D3.js + Express.js + MongoDB learning project.
 *  Copyright (C) 2019  Ryan Y.
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */
class Hierarchical {
  constructor() {
    const element = d3.select('.canvas')
      .append('svg')
      .attr('width', 1060)
      .attr('height', 800)

    this.container = element.append('g')
      .attr('transform', 'translate(50, 50)')

    this.stratify = d3.stratify()
      .id(({name}) => name)
      .parentId(({parent}) => parent)
  }

  update(data) {
    const root = this.stratify(data)
      .sum(({amount}) => amount)

    const pack = d3.pack()
      .size([960, 700])
      .padding(5)

    const colour = d3.scaleOrdinal(['#d1c4e9', '#b39ddb', '#9575cd'])

    const nodes = this.container.selectAll('g')
      .data(pack(root).descendants())
      .enter()
      .append('g')
      .attr('transform', ({x, y}) => `translate(${x}, ${y})`)

    nodes.append('circle')
      .attr('r', ({r}) => r)
      .attr('stroke', 'white')
      .attr('stroke-width', 2)
      .attr('fill', ({depth}) => colour(depth))

    nodes.filter(node => !node.children)
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.3em')
      .attr('fill', 'white')
      .style('font-size', ({value}) => value * 5)
      .text(({data: {name}}) => name)
  }
}
