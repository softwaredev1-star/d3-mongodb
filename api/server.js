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
const mongoose = require('mongoose')
const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)

mongoose.connect('mongodb://db:27017/test?replicaSet=rs', {
  useNewUrlParser: true,
  autoReconnect: true
})

const db = mongoose.connection
const Dish = mongoose.model('Dish', {name: String, orders: Number})
const Expense = mongoose.model('Expense', {name: String, cost: Number})
const Activity = mongoose.model('Activity', {
  name: String,
  distance: Number,
  date: String
})

const Employee = mongoose.model('Employee', {
  name: String,
  parent: String,
  department: String
})

app.use(bodyParser.json())

db.once('open', () => {
  const initialiseExpenseChanges = async socket => {
    const names = {
      collection: 'expenses',
      type: 'Expense'
    }

    initialiseChanges(names, () => Expense.find())(socket)
  }

  const initialiseChanges = (names, accessor) => async socket => {
    const {collection: name, type} = names
    const collection = db.collection(name)
    const changes = collection.watch()
    socket.emit(name, await accessor())

    changes.on('change', change => {
      socket.emit(`${change.operationType}${type}`, change)
    })
  }

  const initialiseEmployeeChanges = socket => {
    const names = {
      collection: 'employees',
      type: 'Employee'
    }

    initialiseChanges(names, () => Employee.find())(socket)
  }

  const initialiseActivityChanges = socket => {
    const names = {
      collection: 'activities',
      type: 'Activity'
    }

    initialiseChanges(names, () => Activity.find())(socket)
  }

  server.listen(3000)

  app.get('/', (request, response) => {
    response.send('Hello world')
  })

  app.post('/expenses', (request, response) => {
    const {name, cost} = request.body
    const expense = new Expense({name, cost})
    expense.save()
    response.send()
  })

  app.delete('/expenses/:id', (request, response) => {
    const {id: _id} = request.params
    Expense.deleteOne({_id}, error => {
      if (error)
        throw error
      response.status(204).send()
    })
  })

  app.post('/activities', (request, response) => {
    const {name, distance} = request.body
    const activity = new Activity({name, distance, date: new Date()})
    activity.save()
    response.send()
  })

  app.post('/employees', (request, response) => {
    const employee = new Employee(request.body)
    employee.save()
    response.send()
  })

  io.on('connection', socket => {
    initialiseExpenseChanges(socket)
    initialiseActivityChanges(socket)
    initialiseEmployeeChanges(socket)
  })

  console.log('listening on port 3000, awaiting WebSocket connection')
})
