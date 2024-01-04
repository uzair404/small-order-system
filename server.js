const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const app = express();
const port = 3000;

// Enable CORS for all routes
app.use(cors());

const db = mysql.createConnection({
  host: '46.139.105.243',
  user: 'username',
  password: 'password',
  database: 'ExPos',
});

db.connect((err) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Connected to the database');
  }
});

app.use(express.json());

app.post('/api/add-order', (req, res) => {
  const order = req.body;

  db.query('INSERT INTO orders SET ?', order, (err, result) => {
    if (err) {
      console.error('Error inserting order:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.status(200).json({ id: result.insertId });
    }
  });
});

app.post('/api/undo', (req, res) => {
  const selectSqlBeforeUpdate = 'SELECT * FROM orders WHERE removing_time IS NOT NULL ORDER BY id DESC LIMIT 1';
  const updateSql = 'UPDATE orders SET removing_time=NULL WHERE removing_time IS NOT NULL ORDER BY id DESC LIMIT 1';

  // Execute the SELECT query to fetch the record before the update
  db.query(selectSqlBeforeUpdate, (err, originalOrders) => {
    if (err) {
      console.error('Error fetching original order:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      // Execute the UPDATE query
      db.query(updateSql, (err, result) => {
        if (err) {
          console.error('Error updating order:', err);
          res.status(500).json({ error: 'Internal Server Error' });
        } else {
          const updatedOrder = originalOrders[0];
          res.status(200).json({ updatedOrder });
        }
      });
    }
  });
});


app.post('/api/received', (req, res) => {
  const order = req.body;
  db.query('UPDATE orders SET isReceived=1 WHERE id=?', order.id, (err, result) => {
    if (err) {
      console.error('Error updating order:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.status(200).json({ id: result.insertId });
    }
  });
});

app.post('/api/remove', (req, res) => {
  const order = req.body;
  db.query('UPDATE orders SET removing_time=?,isDeleted=1 WHERE id=?', [order.removing_time, order.id], (err, result) => {
    if (err) {
      console.error('Error updating order:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.status(200).json({ id: result.insertId });
    }
  });
});

app.get('/api/orders', (req, res) => {
  db.query('SELECT * FROM orders WHERE removing_time IS NULL', (err, results) => {
    if (err) {
      console.error('Error retrieving orders:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
        res.json(results);
    }
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
