const express = require('express');
const router = express.Router();
const pool = require('../db');
const fs = require('fs');
const multer = require('multer');
const path = require('path');

const profileDir = './public/profiles/';
const profileImg = multer({dest: profileDir});



/* GET/POST users listing. */
router.get('/', function(req, res) {
  res.send('respond with a resource');
});

Date.prototype.format = function (format) {
    var args = {
        "M+": this.getMonth() + 1,
        "d+": this.getDate(),
        "h+": this.getHours(),
        "m+": this.getMinutes(),
        "s+": this.getSeconds(),
        "q+": Math.floor((this.getMonth() + 3) / 3),  //quarter
        "S": this.getMilliseconds()
    };
    if (/(y+)/.test(format))
        format = format.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var i in args) {
        var n = args[i];
        if (new RegExp("(" + i + ")").test(format))
            format = format.replace(RegExp.$1, RegExp.$1.length === 1 ? n : ("00" + n).substr(("" + n).length));
    }
    return format;
};

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

router.post('/signup', function(req, res) {
    let sql = "select * from mobile where account=?";
    sql_query(sql, req.body.account)
        .then(result => {
            if(result.length === 0) {
                let sql = "insert into mobile(account, password, nickname, region, scrQuestion, scrAnswer) values(?, ?, ?, ?, ?, ?)";
                let values = [req.body.account, req.body.password, req.body.nickname, req.body.region, req.body.scrQuestion, req.body.scrAnswer];
                sql_query(sql, values)
                    .then(result => {
                        if(result.affectedRows !== 0)
                            res.send(JSON.stringify({
                                'resultcode': '1',
                                'msg': 'MOBILE_SIGNUP_SUCCESS'
                            }));
                        else
                            res.send(JSON.stringify({
                                'resultcode': '0',
                                'msg': 'MOBILE_SIGNUP_FAILED'
                            }));
                    })
                    .catch(err => {
                        res.send(JSON.stringify({
                            'resultcode': '0',
                            'msg': err.message
                        }));
                    });
            }
            else
                res.end(JSON.stringify({
                    'resultcode': '0',
                    'msg': 'MOBILE_ALREADY_EXIST'
                }));
        })
        .catch(err => {
            res.send(JSON.stringify({
                'resultcode': '0',
                'msg': err.message
            }));
        });
});

router.post('/login', function(req, res) {
    let sql = "select nickname, region, profileUrl from mobile where account=? and password=?";
    let values = [req.body.account, req.body.password];
    sql_query(sql, values)
        .then(result => {
           if(result.length === 0)
               res.send(JSON.stringify({
                   'resultcode': '0',
                   'msg': 'LOGIN_FAILED'
               }));
           else
               res.send(JSON.stringify({
                   'resultcode': '1',
                   'msg': 'LOGIN_SUCCESS',
                   'data': [
                       {
                           'nickname': result[0].nickname,
                           'region': result[0].region,
                           'profileUrl': result[0].profileUrl
                       }
                   ]
               }));
        })
        .catch(err => {
            res.send(JSON.stringify({
                'resultcode': '0',
                'msg': err.message
            }));
        });
});

router.post('/uploadProfile', profileImg.single("profile"), function(req, res) {
    const file = req.file;

    if(file != null) {
        const name = Date.now() + path.extname(file.originalname);
        fs.renameSync(profileDir + file.filename, profileDir + name);

        let sql = "update mobile set profileUrl=? where account=?";
        let values = ['profiles/'+name, req.body.account];
        sql_query(sql, values)
            .then(result => {
                if(result.affectedRows !== 0)
                    res.send(JSON.stringify({
                        'resultcode': '1',
                        'msg': 'PROFILE_UPLOAD_SUCCESS',
                        'data': [
                            {
                                'profileUrl': 'profiles/'+name
                            }
                        ]
                    }));
                else
                    res.send(JSON.stringify({
                        'resultcode': '0',
                        'msg': 'NO_SUCH_ACCOUNT'
                    }));
            })
            .catch(err => {
                res.send(JSON.stringify({
                    'resultcode': '0',
                    'msg': err.message
                }));
            });
    }
    else
        res.send(JSON.stringify({
            'resultcode': '0',
            'msg': 'PROFILE_UPLOAD_FAILED'
        }));
});

router.get('/alert', function(req, res) {
    let sql = "select uid, location from alert where region=?";
    let normalSql = "select uid, location from normal where region=?";
    let data = [];
    sql_query(sql, req.query.region)
        .then(result => {
            result.forEach(itm => {
                let location = itm.location;
                let tmp = location.split(',');
                let longitude = tmp[4];
                let latitude = tmp[2];
                let item = {
                    'uid': itm.uid,
                    'longitude': longitude,
                    'latitude': latitude,
                    'tag': 1
                };
                data.push(item);
            });

        })
        .catch(err => {
            res.send(JSON.stringify({
                'resultcode': 0,
                'msg': err.message
            }));
        });
    sql_query(normalSql, req.query.region)
        .then(result => {
            result.forEach(itm => {
                let location = itm.location;
                let tmp = location.split(',');
                let longitude = tmp[4];
                let latitude = tmp[2];
                let item = {
                    'uid': itm.uid,
                    'longitude': longitude,
                    'latitude': latitude,
                    'tag': 0
                };
                data.push(item);
            });
            res.send(JSON.stringify({
                'resultcode': '1',
                'msg': 'GET_ALERT_SUCCESS',
                'data': data
            }));
        })
        .catch(err => {
            res.send(JSON.stringify({
                'resultcode': 0,
                'msg': err.message
            }));
        });


});

router.get('/recommend', function(req, res) {
    let sql = "select imageUrl, title, content from recommend";
    sql_query(sql, [])
        .then(result => {
            res.send(JSON.stringify({
                'resultcode': '1',
                'msg': 'GET_RECOMMEND_SUCCESS',
                'data': result
            }));
        })
        .catch(err => {
            res.send(JSON.stringify({
                'resultcode': '0',
                'msg': err.message
            }));
        });
});

router.get('/zone', function(req, res) {
    let sql = "select postId, profileUrl, nickname, issueTime, content, likeNum from zone limit ?, ?";
    let pageNum = req.query.pageNum - 1;
    let pageSize = req.query.pageSize - 0;
    let values = [pageNum*pageSize, pageSize];
    sql_query(sql, values)
        .then(result => {
            let response = [];
            let sql = "select nickname, comment from comment where postId=?";
            result.forEach((itm, idx) => {
                result[idx] = sql_query(sql, itm.postId)
                    .then(result => {
                        let tmp = {
                            'postId': itm.postId,
                            'profileUrl': itm.profileUrl,
                            'nickname': itm.nickname,
                            'issueTime': itm.issueTime,
                            'content': itm.content,
                            'likeNum': itm.likeNum,
                            'comments': result
                        };
                        response.push(tmp);
                    })
                    .catch(() => {
                        let tmp = {
                            'postId': itm.postId,
                            'profileUrl': itm.profileUrl,
                            'nickname': itm.nickname,
                            'issueTime': itm.issueTime,
                            'content': itm.content,
                            'likeNum': itm.likeNum,
                            'comments': []
                        };
                        response.push(tmp);
                    })
            });
            Promise.all(result).then(() => {
                res.send(JSON.stringify({
                    'resultcode': '1',
                    'msg': 'GET_ZONE_SUCCESS',
                    'data': response
                }));
            });
        })
        .catch(err => {
           res.send(JSON.stringify({
               'resultcode': '0',
               'msg': err.message
           }));
        });
});

router.post('/issue', function(req, res) {
    let sql = "select profileUrl, nickname from mobile where account=?";
    console.log(req.body.account);
    sql_query(sql, [req.body.account])
        .then(result => {
            if(result.length !== 0) {
                let issueTime = new Date().format("yyyy-MM-dd hh:mm:ss");
                let sql = "insert into zone (profileUrl, nickname, issueTime, content, likeNum) values(?, ?, ?, ?, ?)";
                let values = [result[0].profileUrl, result[0].nickname, issueTime, req.body.content, 0];
                sql_query(sql, values)
                    .then(result => {
                        if(result.affectedRows !== 0)
                            res.send(JSON.stringify({
                                'resultcode': '1',
                                'msg': 'ADD_ISSUE_SUCCESS'
                            }));
                        else
                            res.send(JSON.stringify({
                                'resultcode': '0',
                                'msg': 'ADD_ISSUE_FAILED'
                            }));
                    })
                    .catch(err => {
                        res.send(JSON.stringify({
                            'resultcode': '0',
                            'msg': err.message
                        }));
                    })
            }
            else
                res.send(JSON.stringify({
                    'resultcode': '0',
                    'msg': 'NO_SUCH_ACCOUNT'
                }));
        })
        .catch(err => {
            res.send(JSON.stringify({
                'resultcode': '0',
                'msg': err.message
            }));
        });
});

router.post('/comment', function(req, res) {
    let sql = "select postId from zone where postId=?";
    sql_query(sql, req.body.postId)
        .then(result => {
            if(result.length !== 0) {
                let sql = "insert into comment(nickname, postId, comment) values(?, ?, ?)";
                let values = [req.body.nickname, req.body.postId, req.body.comment];
                sql_query(sql, values)
                    .then(result => {
                        if(result.affectedRows === 0)
                            res.send(JSON.stringify({
                                'resultcode': '0',
                                'msg': 'ADD_COMMENT_FAILED'
                            }));
                        else
                            res.send(JSON.stringify({
                                'resultcode': '1',
                                'msg': 'ADD_COMMENT_SUCCESS'
                            }));
                    })
                    .catch(err => {
                        res.send(JSON.stringify({
                            'resultcode': '0',
                            'msg': err.message
                        }));
                    })
            }
            else
                res.send(JSON.stringify({
                    'resultcode': '0',
                    'msg': 'NO_SUCH_ZONE'
                }));
        })
        .catch(err => {
            res.send(JSON.stringify({
                'resultcode': '0',
                'msg': err.message
            }));
        });
});

router.get('/like', function(req, res) {
    let sql = "update zone set likeNum=(likeNum+1) where postId=?";
    sql_query(sql, req.query.postId)
        .then(result => {
            if(result.affectedRows !== 0)
                res.send(JSON.stringify({
                    'resultcode': '1',
                    'msg': 'LIKE_SUCCESS'
                }));
            else
                res.send(JSON.stringify({
                    'resultcode': '0',
                    'msg': 'NO_SUCH_ZONE'
                }));
        })
        .catch(err => {
            res.send(JSON.stringify({
                'resultcode': '0',
                'msg': err.message
            }));
        });

});

module.exports = router;
