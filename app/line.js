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
class LineGraph {
  constructor(margin, size) {
    this.margin = margin
    this.size = size

    const element = d3.select('.canvas')
      .append('svg')
      .attr('width', this.size.width)
      .attr('height', this.size.height)

    this.container = element.append('g')
      .attr('width', this.dimensions.width)
      .attr('height', this.dimensions.height)
      .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`)

    this.setUpScales()
    this.setUpAxes()
    this.makeLinePathGenerator()
    this.makeLinePathElements()
    this.makeDottedGroup()
    this.makeHorizontalDotted()
    this.makeVerticalDotted()
  }

  get dimensions() {
    return {
      width: this.size.width - this.margin.left - this.margin.right,
      height: this.size.height - this.margin.top - this.margin.bottom
    }
  }

  setUpScales() {
    this.scaleTime = d3.scaleTime()
      .range([0, this.dimensions.width])

    this.scaleLinear = d3.scaleLinear()
      .range([this.dimensions.height, 0])
  }

  setUpAxes() {
    this.xAxisGroup = this.container.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0, ${this.dimensions.height})`)

    this.yAxisGroup = this.container.append('g')
      .attr('class', 'y-axis')
  }

  makeLinePathGenerator() {
    this.generateLinePath = d3.line()
      .x(this.getHorizontalCoordinate.bind(this))
      .y(this.getVerticalCoordinate.bind(this))
  }

  makeLinePathElements() {
    this.linePath = this.container.append('path')
  }

  makeDottedGroup() {
    this.dottedGroup = this.container.append('g')
      .style('opacity', 0)
  }

  makeHorizontalDotted() {
    this.horizontalDotted = this.dottedGroup.append('line')
      .attr('stroke', '#aaa')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', 4)
  }

  makeVerticalDotted() {
    this.verticalDotted = this.dottedGroup.append('line')
      .attr('stroke', '#aaa')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', 4)
  }

  getHorizontalCoordinate({date}) {
    return this.scaleTime(new Date(date))
  }

  getVerticalCoordinate({distance}) {
    return this.scaleLinear(distance)
  }

  update(initial) {
    const data = initial.sort(({date: first}, {date: second}) =>
      new Date(first) - new Date(second))
    this.setScaleDomains(data)
    this.updatePath(data)
    this.createCirclesForObjects(data)
    this.createAxes(data)
    this.callAxes()
    this.rotateAxisText()
  }

  setScaleDomains(data) {
    this.scaleTime.domain(d3.extent(data, ({date}) => new Date(date)))
    this.scaleLinear.domain([0, d3.max(data, ({distance}) => distance)])
  }

  updatePath(data) {
    this.linePath.data([data])
      .attr('fill', 'none')
      .attr('stroke', '#00bfa5')
      .attr('stroke-width', 2)
      .attr('d', this.generateLinePath)
  }

  createCirclesForObjects(data) {
    const circles = this.container.selectAll('circle')
      .data(data)

    circles.exit().remove()
    this.updateCurrentPoints(circles)
    this.updateCurrentPoints(
      circles.enter()
        .append('circle')
        .attr('r', 4)
        .attr('fill', '#ccc'))

    this.container.selectAll('circle').on('mouseover', (data, i, elements) => {
      const initial = {
        x: this.getHorizontalCoordinate({date: new Date(1900, 1, 1)}),
        y: this.getVerticalCoordinate({distance: 0}),
        d: "deja vu, I've been in this place before, higher on the street and I know it's my time to go"
      }

      const tenacious = {
        x: this.getHorizontalCoordinate(data),
        y: this.getVerticalCoordinate(data),
        d: 'this is not the greatest song in the world, no... this is just a tribute'
      }

      d3.select(elements[i])
        .transition().duration(100)
        .attr('r', 8)
        .attr('fill', 'white')
      this.horizontalDotted
        .attr('x1', initial.x)
        .attr('x2', tenacious.x)
        .attr('y1', tenacious.y)
        .attr('y2', tenacious.y)
      this.verticalDotted
        .attr('x1', tenacious.x)
        .attr('x2', tenacious.x)
        .attr('y1', initial.y)
        .attr('y2', tenacious.y)
      this.dottedGroup.style('opacity', 1)
    }).on('mouseleave', (data, i, elements) => {
      d3.select(elements[i])
        .transition().duration(100)
        .attr('r', 4)
        .attr('fill', '#ccc')
      this.dottedGroup
        .style('opacity', 0)
    })
  }

  updateCurrentPoints(circles) {
    circles
      .attr('cx', this.getHorizontalCoordinate.bind(this))
      .attr('cy', this.getVerticalCoordinate.bind(this))
  }

  createAxes(data) {
    this.xAxis = d3.axisBottom(this.scaleTime)
      .ticks(4)
      .tickFormat(d3.timeFormat('%b %d'))

    this.yAxis = d3.axisLeft(this.scaleLinear)
      .ticks(4)
      .tickFormat(distance => `${distance}m`)
  }

  callAxes() {
    this.xAxisGroup.call(this.xAxis)
    this.yAxisGroup.call(this.yAxis)
  }

  rotateAxisText() {
    this.xAxisGroup.selectAll('text')
      .attr('transform', 'rotate(-40)')
      .attr('text-anchor', 'end')
  }
}

