const { v4: uuid } = require('uuid')
const { format } = require('date-fns')
const fs = require('fs')
const path = require('path')

const log = (msg) => {
    const dateTime = `${format(new Date(), 'yyyyMMdd\tHH:mm:ss')}`
    const logItem = `${uuid()}\t${dateTime}\t${msg} \n` 
    if (!fs.existsSync(path.join(__dirname, 'logs'))) {
        fs.mkdir(path.join(__dirname, 'logs'), (err) => {
            if (err) console.log(err)
        })
    }
    fs.appendFile(path.join(__dirname, 'logs', 'event-logs.txt'), logItem, (err) => {
            if (err) console.log(err)
        
    })
}

module.exports = {log}