const mysql = require('mysql');

const db_config = {
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'db_drowning_alert'
};

const pool = mysql.createPool(db_config);

pool.on('connection', function(connection) {
    connection.query('SET SESSION auto_increment_increment=1');
});

module.exports = pool;
