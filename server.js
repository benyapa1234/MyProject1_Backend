var express = require('express');
var cors = require('cors');
const mysql = require('mysql');

const port = 8000;

const connection = mysql.createConnection({
    host :'sql12.freesqldatabase.com',
    user : 'sql12712112',
    database : 'sql12712112',
    password : 'fE5j68QzaX',
    port:'3306'
});

const table = 'teach_table';

var app = express();
app.use(cors());
app.use(express.json());

connection.connect((err) => {
    if(err){
        console.error('Error connecting to database:', err);
        return;
    }
    console.log(`Connected to database with threadTD ${connection.threadId}`);
});

app.get('/',(req, res) => {
    res.send('Server is working');
});

app.get('/getdata', (req, res) => {
    connection.query(`SELECT * FROM ${table}`, (err, result) => {
        if (err){
            res.status(500).send(err);
        } else {
            res.json(result);
        }
    });
});

// http://localhost:8000/seach?column=id&value=3
app.get('/search', async (req, res) =>{
    const column = req.query.column;
    const value = req.query.value;

    if(!column || !value){
        return res.status(400).send('Column and value query parameters are required'); 
    }

    const query = `SELECT * FROM ${table} WHERE ${column} = ?`;
    
    connection.query(query, value, (err, result) =>{
        if(err){
            console.error(err);
            return res.status(500).json({
                message: 'Database searching failed'
            });
        }

        res.status(200).json(result);
    });
});

//delete?column=name&value=john
// http://localhost:8000/delete?column=name&value=test2
app.delete('/delete', async(req, res) => {
    const column = req.query.column;
    const value = req.query.value;

    if(!column || !value){
        return res.status(400).send('Column and value query parameters are required');
    }

    const query = `DELETE FROM ${table} WHERE ${column} = ?`;

    connection.query(query, value, (err, result) =>{
        if(err){
            console.error(err);
            return res.status(500).json({
                message:'Database deletion failed'
            });
        }

        res.status(200).json({
            message: 'Delete deletion succeded',
            affectedRows: result.affectedRows
        });
    });

});

//INSERT
//http://localhost:8000/insert
app.post('/insert', async (req, res) =>{
    const student_data = req.body;

    if(!student_data|| Object.keys(student_data).length === 0){
        return res.status(400).json({
            message : "No student data provided"
        });
    }

    const {ID, Name} = student_data

    const query = `
        INSERT INTO ${table} (ID,Name)
        VALUES(?,?)
    `;

    const values = [ID,Name];

    connection.query(query, values, (err, result) => {
        if(err){
            console.error(err);
            return res.status(500).json({
                message: 'Database insertion failed'
            });
        }

        res.status(201).json({
            message:`Student data inserted successfully`
        });
    });
});

//http://localhost:8000/update?column=ID&value=1
app.put('/update', async (req, res) => {
    const column = req.query.column;
    const value = req.query.value;

    const update_data = req.body;

    if(!column || !value){
        return res.status(400).send('Column and value query parameters are required ');
    }

    if(!update_data || Object.keys(update_data).length === 0 ){
        return res.status(400).json({
            message: "No student data provided to update"
        });
    }

    const values = [...Object.values(update_data), value]
    const setClause = Object.keys(update_data).map(key => `${key} = ?`).join(', '); 
    const query = `UPDATE ${table} SET ${setClause} WHERE ${column} = ?`

    connection.query(query, values, (err, result) =>{
        if (err) {
            return res.status(500).json ({
                message : 'Database updation failed', err
            });
        }

        res.status(200).json({
            message:'Student data updated successfully',
            affectedRows:result.affectedRows
        });
    });
});

app.listen(port, ()=> {
    console.log(`Server is running on http://localhost:${port}`);
});