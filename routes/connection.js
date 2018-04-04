const JDBC = require('jdbc');
const jinst = require('jdbc/lib/jinst');
const express = require('express');
const path = require('path');
const router = express.Router();

if (!jinst.isJvmCreated()) {
    jinst.addOption("-Xrs");
    jinst.setupClasspath([
        path.resolve(__dirname, '../jdbc_drivers/mysql-connector-java-5.1.46.jar'),
        path.resolve(__dirname, '../jdbc_drivers/postgresql-42.2.2.jar'),
    ]);
}

function initJDBC({type, url, db, user, password}, options = {minpoolsize: 5, maxpoolsize: 10}) {
    const jdbc = new JDBC({
        url: `jdbc:${type}://${url}/${db}`,
        minpoolsize: options.minpoolsize,
        maxpoolsize: options.maxpoolsize,
        properties: {
            user,
            password
        }
    });

    return new Promise((resolve, reject) => {
        jdbc.initialize((err) => {
            if (err) {
                return reject(err);
            } else {
                return resolve(jdbc);
            }
        });
    });
}

function reserve(db) {
    return new Promise((resolve, reject) => {
        db.reserve((err, connection) => {
            if (err) {
                return reject(err);
            } else {
                return resolve(connection);
            }
        });
    });
}

function release(db, connection) {
    return new Promise((resolve, reject) => {
        db.release(connection, (err) => {
            if (err) {
                return reject(err);
            } else {
                return resolve(null);
            }
        });
    });
}

function createStatement(connection) {
    return new Promise((resolve, reject) => {
        connection.createStatement((err, statement) => {
            if (err) {
                return reject(err);
            } else {
                return resolve(statement);
            }
        });
    });
}


async function query(db, sql) {
    let connection;
    let statement;
    try {
        connection = await reserve(db);
    } catch (e) {
        return console.error('was not able to reserve a connection');
    }
    try {
        statement = await createStatement(connection.conn);
    } catch (e) {
        release(db, connection);
        return console.error('was not able to create a statement');
    }
    return new Promise((resolve, reject) => {
        statement.setFetchSize(1000, (err) => {
            if (err) {
                return reject(err);
            }
            statement.executeQuery(sql, (err, resultset) => {
                if (err) {
                    return reject(err);
                }
                resultset.toObjArray((err, results) => {
                   if (err) {
                       return reject(err);
                   }
                   return resolve(results);
                });
            });
        });
    });
}

async function queryDb(data, sql) {
    const dbInstance = await initJDBC(data);
    return await query(dbInstance, sql);
}

router.post('/', async (req, res, next) => {
    try {
        const queryResults = await queryDb(req.body, `SELECT * from ${req.body.table}`);
        res.json(queryResults);
    } catch (e) {
        res.status(400);
        res.send(e.message);
    }
});

router.post('/recentData/', async (req, res, next) => {
    try {
        const queryResults = await queryDb(req.body, `SELECT * from ${req.body.table} where ${req.body.indexKey} > ${req.body.lastIndexValue}`);
        res.json(queryResults);
    } catch (e) {
        res.status(400);
        res.send(e.message);
    }
});

module.exports = router;
