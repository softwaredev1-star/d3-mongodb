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
class BarChart {
  // graphHeight, graph, xAxis, yAxis, scaleForXAxis, scaleForYAxis

  constructor() {
    const margin = {top: 20, bottom: 100, right: 20, left: 100}
    this.graphHeight = 600 - margin.top - margin.bottom

    const graphic = d3.select('.canvas')
      .append('svg')
      .attr('width', 600)
      .attr('height', 600)
    this.graph = graphic.append('g')
      .attr('width', 600 - margin.left - margin.right)
      .attr('height', this.graphHeight)
      .attr('transform', `translate(${margin.left}, ${margin.top})`)
    this.xAxis = this.graph.append('g')
      .attr('transform', `translate(0, ${this.graphHeight})`)
    this.yAxis = this.graph.append('g')
    this.init()
  }

  async init() {
    const socket = io.connect('http://uw-va-ryakstis')
    const handlers = {
      expenses: this.getExpenses,
      insertExpense: this.insertExpense,
      updateExpense: this.updateExpense,
      deleteExpense: this.deleteExpense
    }

    Object.keys(handlers).forEach(message =>
      socket.on(message, handlers[message].bind(this)))
  }

  getExpenses(expenses) {
    console.log('expenses', expenses)
    this.data = expenses
    this.update(this.data)
  }

  insertExpense(change) {
    this.data.push(change.fullDocument)
    this.update(this.data)
    console.log('insertExpense', change)
  }

  updateExpense(change) {
    this.data.forEach(datum => {
      if (datum._id === change.documentKey._id) {
        const description = change.updateDescription
        const fields = description.updatedFields

        for (let key in fields)
          datum[key] = fields[key]

        for (let key in description.removedFields)
          delete datum[key]
      }
    })

    this.update(this.data)
    console.log('updateExpense', change)
  }

  deleteExpense(change) {
    const doesNotHaveChangeId = datum => datum._id !== change.documentKey._id
    this.data = this.data.filter(doesNotHaveChangeId)
    this.update(this.data)
  }

  update(data) {
    console.log('data', data)
    const domain = d3.extent(data, ({cost}) => cost)
    this.scaleForXAxis = d3.scaleBand()
      .domain(data.map(({name}) => name))
      .range([0, 500])
      .paddingInner(0.2)
      .paddingOuter(0.2)

    this.scaleForYAxis = d3.scaleLinear()
      .domain(domain)
      .range([this.graphHeight, 0])
    const rects = this.graph.selectAll('rect')
      .data(data)
    rects.exit().remove()
    const newRects = rects.enter().append('rect')
    this.transition(this.drawSelection(rects))
    this.transition(this.drawSelection(newRects)
      .attr('height', 0)
      .attr('y', this.graphHeight))

    this.xAxis.call(d3.axisBottom(this.scaleForXAxis))
    this.xAxis.selectAll('text')
      .attr('transform', 'rotate(-40)')
      .attr('text-anchor', 'end')
      .attr('fill', 'orange')
    this.yAxis.call(d3.axisLeft(this.scaleForYAxis)
      .ticks(3)
      .tickFormat(cost => `${cost} cost`))
  }

  drawSelection(selection) {
    return selection
      .attr('width', this.scaleForXAxis.bandwidth)
      .attr('fill', 'orange')
      .attr('x', ({name}) => this.scaleForXAxis(name))
  }

  transition(selection) {
    return selection
      .transition().duration(500)
      .attr('y', ({cost}) => this.scaleForYAxis(cost))
      .attr('height', ({cost}) =>
        this.graphHeight - this.scaleForYAxis(cost))
  }
}


let chart = new BarChart
