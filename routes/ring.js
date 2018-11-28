const express = require('express');
const router = express.Router();
const pool = require('../db');

function sql_query(sql, values) {
    return new Promise((resolve, reject) => {
        pool.getConnection((err, connection) => {
            if(err)
                reject(err);
            connection.query(sql, values, (error, result) => {
                if(error) {
                    connection.release();
                    reject(error);
                }
                else {
                    connection.release();
                    resolve(result);
                }
            });
        });
    });
}

router.post('/unsafe', (req, res) => {
    let sql = "select region from ring where uid=?";
    const uid = req.body.uid;
    const location = req.body.location;
    sql_query(sql, [uid])
        .then(result => {
            if(result.length !== 0) {
                const region = result[0].region;
		console.log(region);
                let sql = "update alert set location=? where uid=? and region=?";
                let values = [location, uid, region];
                sql_query(sql, values)
                    .then(result => {
                        if(result.affectedRows !== 0)
                            res.end();
                        else {
                            let sql = "insert into alert(uid, region, location) values(?, ?, ?)";
                            let values = [uid, region, location];
                            sql_query(sql, values)
                                .then(() => {
				    console.log('success');
                                    res.end();
                                })
                                .catch((e) => {
				    console.log(e);
                                    res.end();
                                })
                        }
                    })
                    .catch(() => {
			console.log('f3');
                        res.end();
                    });
            }
            else
		console.log('f4');
                res.end();
        })
        .catch((e) => {
	   console.log(e);
           res.end();
        });
});


//
// router.post('/unsafe', (req, res) => {
//     let sql = "select region from ring where uid=?";
//     const uid = req.body.uid;
//     const location = req.body.location;
//     sql_query(sql, [uid])
//         .then(result => {
//             if(result.length !== 0) {
//                 const region = result[0].region;
//                 console.log(region);
//                 let sql = "update alert set location=? where uid=? and region=?";
//                 let values = [location, uid, region];
//                 sql_query(sql, values)
//                     .then(result => {
//                         if(result.affectedRows !== 0)
//                             res.end();
//                         else {
//                             let sql = "insert into alert(uid, region, location) values(?, ?, ?)";
//                             let values = [uid, region, location];
//                             sql_query(sql, values)
//                                 .then(() => {
//                                     console.log('success');
//                                     res.end();
//                                 })
//                                 .catch((e) => {
//                                     console.log(e);
//                                     res.end();
//                                 })
//                         }
//                     })
//                     .catch(() => {
//                         console.log('f3');
//                         res.end();
//                     });
//             }
//             else
//                 console.log('f4');
//             res.end();
//         })
//         .catch((e) => {
//             console.log(e);
//             res.end();
//         });
// });

router.post('/normal', (req, res) => {
    let sql = "select region from ring where uid=?";
    const uid = req.body.uid;
    const location = req.body.location;
    sql_query(sql, [uid])
        .then(result => {
            if(result.length !== 0) {
                const region = result[0].region;
                console.log(region);
                let sql = "update normal set location=? where uid=? and region=?";
                let values = [location, uid, region];
                sql_query(sql, values)
                    .then(result => {
                        if(result.affectedRows !== 0)
                            res.end();
                        else {
                            let sql = "insert into normal(uid, region, location) values(?, ?, ?)";
                            let values = [uid, region, location];
                            sql_query(sql, values)
                                .then(() => {
                                    console.log('success');
                                    res.end();
                                })
                                .catch((e) => {
                                    console.log(e);
                                    res.end();
                                })
                        }
                    })
                    .catch(() => {
                        console.log('f3');
                        res.end();
                    });
            }
            else
                console.log('f4');
            res.end();
        })
        .catch((e) => {
            console.log(e);
            res.end();
        });
});




module.exports = router;
