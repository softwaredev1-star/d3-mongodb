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
class PieChart {
  get dimensions() {
    return {
      height: 300,
      width: 300,
      radius: 150
    }
  }

  get centre() {
    return {
      x: this.dimensions.width / 2 + 5,
      y: this.dimensions.height / 2 + 5
    }
  }

  constructor() {
    const container = d3.select('.canvas')
      .append('svg')
      .attr('width', this.dimensions.width + 150)
      .attr('height', this.dimensions.height + 150)

    this.graph = container.append('g')
      .attr('transform', `translate(${this.centre.x}, ${this.centre.y})`)

    this.legendContainer = container.append('g')
      .attr('transform', `translate(${this.dimensions.width + 40}, 10)`)

    this.getColourFor = d3.scaleOrdinal(d3['schemeSet3'])

    this.getColourForLegend = d3.legendColor()
      .shape('circle')
      .shapePadding(10)
      .scale(this.getColourFor)

    this.tooltip = d3.tip()
      .attr('class', 'tip card')
      .html(({data}) => `
          <div class="name">
            Name: ${data.name}
          </div>

          <div class="cost">
            Cost: $${data.cost}
          </div>

          <div class="delete">
            Click slice to delete.
          </div>
        `)

    this.graph.call(this.tooltip)
  }

  handleData() {
    const socket = io()

    socket.on('expenses', expenses => {
      this.data = expenses
      this.update()
    })

    socket.on('insertExpense', change => {
      this.data.push(change.fullDocument)
      this.update()
    })

    socket.on('updateExpense', ({documentKey: {_id: id}, updateDescription}) => {
      const index = this.data.findIndex(datum => datum._id === id)
      const expense = this.data[index]
      updateDescription.removedFields.forEach(field => {
        delete expense[field]
      })

      const updated = updateDescription.updatedFields
      Object.keys(updated).forEach(key => {
        expense[key] = updated[key]
      })

      this.update()
    })

    socket.on('deleteExpense', change => {
      this.data = this.data.filter(
        datum => datum._id !== change.documentKey._id)
      this.update()
    })
  }

  update() {
    const self = this
    const makePie = d3.pie()
      .sort(null)
      .value(({cost}) => cost)

    const angles = makePie(this.data)
    const paths = this.graph.selectAll('path')
      .data(angles)

    const tweenInArcs = data => {
      const interpolate = d3.interpolate(data.startAngle, data.endAngle)

      return tick => {
        data.endAngle = interpolate(tick)
        return this.makeArcPath(data)
      }
    }
    
    function tweenAboutArcs(data) {
      const interpolate = d3.interpolate(this.originalData, data)
      this.originalData = data

      return tick => self.makeArcPath(interpolate(tick))
    }

    const tweenOutArcs = data => {
      const interpolate = d3.interpolate(data.endAngle, data.startAngle)

      return tick => {
        data.startAngle = interpolate(tick)
        return this.makeArcPath(data)
      }
    }

    this.getColourFor.domain(this.data.map(({name}) => name))
    this.legendContainer.call(this.getColourForLegend)
    this.legendContainer.selectAll('text')
      .attr('fill', 'white')

    console.log(paths)

    paths.exit()
      .transition().duration(250)
      .attrTween('d', tweenOutArcs)
      .remove()

    paths.attr('d', this.makeArcPath.bind(this))
      .transition().duration(750)
      .attrTween('d', tweenAboutArcs)
    
    const newPaths = paths.enter().append('path')
    this.draw(newPaths)
    newPaths
      .each(function (data) { this.originalData = data })
      .transition().duration(750)
      .attrTween('d', tweenInArcs)

    this.graph.selectAll('path')
      .on('mouseover', this.handleMouseover.bind(this))
      .on('mouseout', this.handleMouseout.bind(this))
      .on('click', this.deleteExpense.bind(this))
  }

  makeArcPath(data) {
    return d3.arc()
      .outerRadius(this.dimensions.radius)
      .innerRadius(this.dimensions.radius / 2)(data)
  }

  draw(selection) {
    selection
      .attr('class', 'arc')
      .attr('d', this.makeArcPath.bind(this))
      .attr('stroke', '#fff')
      .attr('stroke-width', 3)
      .attr('fill', ({data}) => this.getColourFor(data.name))
      .transition().duration(750)
  }

  handleMouseover(data, i, paths) {
    const self = paths[i]
    this.tooltip.show(data, self)
    this.colourElement(self, 'white')
  }

  colourElement(element, colour) {
    d3.select(element)
      .transition('colourElement').duration(300)
      .attr('fill', colour)
  }

  handleMouseout(data, i, paths) {
    this.tooltip.hide()
    this.colourElement(paths[i], this.getColourFor(data.data.name))
  }

  async deleteExpense({data}) {
    try {
      await fetch(`/api/expenses/${data._id}`, {method: 'DELETE'})
    } catch (error) {
      alert(error.message)
    }
  }
}

let pie = new PieChart
pie.handleData()
