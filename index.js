const { headingTo } =  require('geolocation-utils');
const PORT = process.env.PORT || 4000;
const io = require('socket.io')(PORT, { cors: { origin: '*' } });

let dbArray = [];
let dbObject = [];
let bandeiras = [];

// let dado = '[00,-22.906807,-42.034874,00.2];[03,-22.905594,-42.034946,00.4];[04,-22.907294,-42.034946,00.4];01/01/99 00:40:02'
// let dado2 = '[03,-22.906807,-42.034946,00.4];01/01/99 00:41:02'

function convertStringToArray(str) {
    info = str.replace(/[\[\]]/g, '');
    let array = info.split(';');

    // the lest element of array is the date
    let date = array.pop();
    // add the date to each element of array
    array = array.map(x => x + ',' + date);

    let array2 = [];
    array.forEach(element => {
        array2.push(element.split(','));
    });
    return array2;
}

function convertStringToObject(array) {
    let array2 = [];
    array.forEach(element => {
        let obj = {
            id: element[0],
            lat: element[1],
            lng: element[2],
            speed: element[3],
            date: element[4],
            rotate: element[5]
        }
        array2.push(obj);
    });
    return array2;
}

// a function to verify if the new data is different from the old data in db
// change only the data that is different in array of db
function verifyData(data) {
    let array = convertStringToArray(data);
    array.forEach(element => {
        let index = dbArray.findIndex(x => x[0] === element[0]);
        if (index === -1) {
            // add rotate to element
            element.push(0);
            dbArray.push(element);
        } else {
            // const rotate = headingTo({lat: 51, lon: 4}, {lat: 51.0006, lon: 4.001}) ;
            const rotate = headingTo(
                { 
                    lat: parseFloat(dbArray[index][1]),
                    lon: parseFloat(dbArray[index][2])
                }, 
                { 
                    lat: parseFloat(element[1]),
                    lon: parseFloat(element[2])
                });
            element.push(rotate);
            dbArray[index] = element;
        }
    });
    return dbArray;
}

// function to simulate new update data every 2 seconds
function updateData(randomData) {
    // let array = convertStringToArray(randomData);
    let array = verifyData(randomData);
    dbObject = convertStringToObject(array);
    io.emit('info', dbObject);
}

// execute the function to update data every 2 seconds
// setInterval(() => {
//     // crete a random data
//     let randomData = `[00,-22.90${Math.floor(Math.random() * 10)}807,-42.034${Math.floor(Math.random() * 10)}74,00.2];[03,-22.905594,-42.034946,00.4];[04,-22.907294,-42.034946,00.4];01/01/99 00:4${Math.floor(Math.random() * 10)}:02`
//     updateData(randomData);
// }, 2000);

io.on("connection", socket => {
    console.log("USUARIO: " + socket.id);
    // let result = verifyData(dado);
    // dbObject = convertStringToObject(result);

    // wait 5 seconds to send the data to the client
    setTimeout(() => {
        socket.emit("info", dbObject);
        socket.emit("bandeiras", bandeiras);
    }, 4000);

    socket.on('newinfo', data => {
        console.log(data);
        let result = verifyData(data);
        dbObject = convertStringToObject(result);
        io.emit('info', dbObject);
    })

    socket.on("updateBandeiras", (bandeirasArray) => {
        bandeiras = bandeirasArray
        io.emit("bandeiras", bandeiras)
    })

    socket.on("disconnect", () => {
        console.log("USUARIO DESCONECTADO: " + socket.id);
    });
});
