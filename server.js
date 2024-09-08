var express = require('express');
var cors = require('cors');
const mysql = require('mysql');

const port = 8000;

const connection = mysql.createConnection({
    host :'localhost',
    user : 'root',
    database : 'plo_nodejs',
    password : '',
    port:'3306'
});

const table = 'plo';

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

//http://localhost:8000/insert
app.post('/insert', async(req,res) =>{
    const data_list = req.body;

    if(!data_list || !Array.isArray(data_list) || data_list.length === 0){
        return res.status(400).json({
            message:"No data provided or data is not in correct format"
        });
    }
// ?,?
    const columns = Object.keys(data_list[0]).join(',');
    const placeholders = data_list.map(() => `(${Object.keys(data_list[0]).map(() =>'?').join(', ')})`).join(', ');
    const data = data_list.reduce((acc,item) => acc.concat(Object.values(item)),[]);

    const query = ` INSERT INTO ${table} (${columns}) VALUES ${placeholders}`;

    connection.query(query,data, (err,result) =>{
        if(err){
            console.error(err);
            return res.status(500).json({
                message:'Database insertion failed: ' +err
            });
        }

        res.status(201).json({
            message:'Data inserted successfully'
        });
    });
});

// http://localhost:8000/seach?column=id&value=3
app.get('/search', async (req, res) =>{
    const data = req.query;

    if(!data){
        return res.status(400).json({
            message:"No data provided"
    }); 
    }

    keys = Object.keys(data)
    values = Object.values(data)

    //Create the WHERE clause by joining column names with placeholders
    const whereClause = keys.map(col => `${col} = ?`).join(' AND ');

    const query = `SELECT * FROM ${table} WHERE ${whereClause}`;
    
    connection.query(query, values, (err, results) =>{
        if(err){
            console.error(err);
            return res.status(500).json({
                message: 'Database searching failed'
            });
        }

        res.status(200).json(results);
    });
});

//delete?column=name&value=john
// http://localhost:8000/delete?column=name&value=test2
app.delete('/delete', async(req, res) => {
    const data_select = req.query;

    if(!data_select){
        return res.status(400).json({
            message:"No data provided"
        });
    }

    keys = Object.keys(data_select);
    values = Object.values(data_select);

    //Create WHERE clause
    const whereClause = keys.map(col => `${col} = ?`).join(' AND ');

    const query = ` DELETE FROM ${table} WHERE ${whereClause}`;

    console.log(query)

    connection.query(query, values, (err, result) =>{
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

//http://localhost:8000/update?column=ID&value=1
app.put('/update', async (req, res) => {
    const data_select = req.query;
    const data_update = req.body;

    if(!data_select || !data_update) {
        return res.status(400).json({
            message: "No data provided"
        });
    }

    const keys_select = Object.keys(data_select); //keys is ข้อมูลข้างหน้าที่เลือก
    const values_select = Object.values(data_select); //values is ข้อมูลข้างหลัง
    const keys_update = Object.keys(data_update);//keys is ข้อมูลข้างหน้าที่จะอัพเดต
    const values_update = Object.values(data_update)//values is ข้อมูลข้างหลัง

    //Crate setClause set=ค่าที่จะเอาไปทับ clause =ก้อนที่เอาไปทับ
    const setClause = keys_update.map(key => `${key} = ?`).join(', ');
     
    //Crate WhereClause คือ condition
    const whereClause = keys_select.map(col => `${col} = ?`).join(' AND ');

    //  SQL
    const query = ` UPDATE ${table} SET ${setClause} WHERE ${whereClause}`;

    const values = [...values_update,...values_select];

    connection.query(query, values, (err, result) =>{
        if (err) {
            console.error(err);
            return res.status(500).json ({
                message : 'Database updation failed', err
            });
        }

        res.status(200).json({
            message:' data updated successfully',
            affectedRows:result.affectedRows
        });
    });
});

app.listen(port, ()=> {
    console.log(`Server is running on http://localhost:${port}`);
});