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
conn = new Mongo()
rs.initiate()
db = conn.getDB('test')
db.createCollection('dishes')
db.dishes.insertMany([{
  name: 'meat soup',
  orders: 200
}, {
  name: 'meat burger',
  orders: 500
}, {
  name: 'meat stew',
  orders: 900
}, {
  name: 'meat special',
  orders: 1200
}, {
  name: 'meat curry',
  orders: 800
}])

db.createCollection('expenses')
db.expenses.insertMany([{
  name: 'rent',
  cost: 500
}, {
  name: 'social',
  cost: 100
}])
