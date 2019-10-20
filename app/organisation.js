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
const modal = document.querySelector('.modal')
M.Modal.init(modal)

const form = document.querySelector('form')
const name = document.querySelector('#name')
const parent = document.querySelector('#parent')
const department = document.querySelector('#department')

form.addEventListener('submit', async event => {
  event.preventDefault()

  await fetch('/api/employees', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      name: name.value,
      parent: parent.value,
      department: department.value
    })
  })

  M.Modal.getInstance(modal).close()
  form.reset()
})

const socket = io()
const graph = new Tree({
  size: {
    height: 500,
    width: 1100
  },

  margin: {
    left: 100,
    top: 100
  }
})
let data = []

const redraw = () => graph.update(data)

socket.on('employees', employees => {
  data = employees
  redraw()
})

socket.on('insertEmployee', change => {
  data.push(change.fullDocument)
  redraw()
})

const updateEmployee = ({documentKey: {_id: id}, fullDocument}) => {
  const index = data.findIndex(datum => datum._id === id)
  data[index] = fullDocument
  redraw()
}

socket.on('updateEmployee', updateEmployee)
socket.on('replaceEmployee', updateEmployee)

socket.on('deleteEmployee', ({documentKey: key}) => {
  data = data.filter(datum => datum._id !== key._id)
  redraw()
})
