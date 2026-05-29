const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());


const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'rugoma_global_technologies_ltd'
});

db.connect((err) => {
  if (err) {
    console.log('Database connection failed:', err);
  } else {
    console.log('Database connected successfully');
  }
});

//SIGNUP
app.post('/api/signup', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  db.query('INSERT INTO users (username, password) VALUES (?, ?)',
    [username, hashedPassword],
    (err) => {
      if (err) return res.status(400).json({ message: 'Username already exists' });
      res.json({ message: 'Account created successfully' });
    }
  );
});

//LOGIN 
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
    if (err || results.length === 0) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const user = results[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    res.json({
      message: 'Login successful',
      user: { id: user.id, username: user.username }
    });
  });
});

// visitor-in


app.get('/api/visitor-in', (req, res) => {
  db.query('SELECT * FROM visit_in', (err, results) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json(results);
  });
});


app.post('/api/visitor-in', (req, res) => {
  const { vin_name, purpose } = req.body;

  if (!vin_name) {
    return res.status(400).json({ message: 'Visitor name is required' });
  }

  db.query('INSERT INTO visit_in (vin_name, purpose) VALUES (?, ?)',
    [vin_name, purpose],
    (err, result) => {
      if (err) return res.status(500).json({ message: err.message });
      res.json({ message: 'Visitor checked in successfully', id: result.insertId });
    }
  );
});


app.put('/api/visitor-in/:id', (req, res) => {
  const { vin_name, purpose } = req.body;
  db.query('UPDATE visit_in SET vin_name = ?, purpose = ? WHERE vin_id = ?',
    [vin_name, purpose, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ message: err.message });
      res.json({ message: 'Record updated successfully' });
    }
  );
});


app.delete('/api/visitor-in/:id', (req, res) => {
  db.query('DELETE FROM visit_in WHERE vin_id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json({ message: 'Record deleted' });
  });
});



app.get('/api/visitors-inside', (req, res) => {
  const sql = `SELECT * FROM visit_in 
               WHERE vin_name NOT IN (SELECT vin_name FROM visit_out)`;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json(results);
  });
});


app.get('/api/visitor-out', (req, res) => {
  db.query('SELECT * FROM visit_out ORDER BY time_out DESC', (err, results) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json(results);
  });
});


app.post('/api/visitor-out', (req, res) => {
  const { vin_name } = req.body;

  if (!vin_name) {
    return res.status(400).json({ message: 'Visitor name is required' });
  }

  db.query('SELECT * FROM visit_in WHERE vin_name = ?', [vin_name], (err, rows) => {
    if (err) return res.status(500).json({ message: err.message });
    if (rows.length === 0)
      return res.status(400).json({ message: 'Visitor is not checked in' });


    db.query('SELECT * FROM visit_out WHERE vin_name = ?', [vin_name], (err2, rows2) => {
      if (err2) return res.status(500).json({ message: err2.message });
      if (rows2.length > 0)
        return res.status(400).json({ message: 'Visitor already checked out' });


      db.query('INSERT INTO visit_out (vin_name) VALUES (?)', [vin_name], (err3, result) => {
        if (err3) return res.status(500).json({ message: err3.message });
        res.json({ message: 'Visitor checked out successfully', id: result.insertId });
      });
    });
  });
});

app.put('/api/visitor-out/:id', (req, res) => {
  const { vin_name } = req.body;
  db.query('UPDATE visit_out SET vin_name = ? WHERE vout_id = ?',
    [vin_name, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ message: err.message });
      res.json({ message: 'Record updated successfully' });
    }
  );
});


app.delete('/api/visitor-out/:id', (req, res) => {
  db.query('DELETE FROM visit_out WHERE vout_id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json({ message: 'Record deleted' });
  });
});




app.listen(5000, () => {
  console.log('Server is running on http://localhost:5000');
});
