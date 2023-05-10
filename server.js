const express = require('express');
const request = require('request');
const readExcel = require('read-excel-file/node');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const AdmZip = require("adm-zip");


const URl = 'https://asb.opec.org/data/ASB_Data.php';
const app = express();

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    next();
});

app.get('/', async (req, res) => {
    if (!fs.existsSync('./T91.xlsx')) {
        await upload();
    }
    console.log('page: ', req.query.page);
    if (req.query.page === 'gas-reserves-by-country') {
        let result = await readIt('./T91.xlsx');
        res.json({
            body: result,
            source: req.query.page,
        });
    }
    if (req.query.page === 'gas-consumption-by-country') {
        let result = await readIt('./T96.xlsx');
        res.json({
            body: result,
            source: req.query.page,
        });
    }

    if (req.query.page === 'gas-production-by-country') {
        let result = await readIt('./T93.xlsx');
        res.json({
            body: result,
            source: req.query.page,
        });
    }

});

function readIt(name) {
    return new Promise(function (resolve, reject) {
        readExcel(name).then((data) => {
            let years = [];
            for (j in data[2]) {
                if (data[2][j]) {
                    years.push(data[2][j]);
                }
            }
            let stopCircle = false;
            let resultByCountry = {};
            for (i in data) {
                if (i > 2) {
                    let arr = [];
                    if (data[i][0].toString().includes('Other')
                        || data[i][0].toString().includes('OECD')
                        || data[i][0].toString().includes('Latin')
                        || data[i][0].toString().includes('Middle')
                        || data[i][0].toString().includes('Africa')) {
                        continue;
                    }
                    for (j in data[i]) {
                        if (data[i][j] === 'of which') {
                            stopCircle = true;
                            break;
                        }
                        if (j != 0) {
                            if (name === './T91.xlsx' && data[i][j] != 0 && data[i][j] != 'na') {
                                arr.push({year: data[2][j], value: +data[i][j] * 1000});
                            } else if (data[i][j] == 'na') {
                                arr.push({year: data[2][j], value: '-'});
                            } else {
                                arr.push({year: data[2][j], value: data[i][j]});
                            }

                        }

                    }
                    if (stopCircle) {
                        break;
                    }
                    resultByCountry[data[i][0]] = (arr);
                }
            }
            resolve({resultByCountry: resultByCountry, years: years});
        });
    });
}

const upload = async () => {
    try {
        const file = fs.createWriteStream('./data.zip');
        let data = new FormData();
        data.append(selectData, ['T91.xlsx', 'T93.xlsx', 'T96.xlsx']);
        const resp = await axios.post(URL, data, {
            headers: {
                ...data.getHeaders(),
                'Access-Control-Allow-Origin': '*'
            }
        });
        if (resp.status === 200) {
            file.write(resp.data);
            file.end();
            const zip = new AdmZip("./data.zip");
            zip.extractAllTo("./");
            return 'Upload complete';
        }
    } catch (err) {
        return new Error(err.message);
    }
}


const PORT = 4220;
app.listen(PORT, () => console.log(`listening on ${PORT}`));
