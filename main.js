const fs = require('fs');
const express = require('express');
const app = express();
const formidable = require('formidable');
const { Storage } = require('megajs');
var bodyParser = require('body-parser')
var jsonParser = bodyParser.json()

require('dotenv').config()
const id = process.env.EMAIL;
const pass = process.env.PASSWORD;

app.use((req,res,next)=>{
    res.header("Access-Control-Allow-Origin","*");
    res.header("Access-Control-Allow-Headers","Content-Type, x-requested-with, Origin, Accept");
    next();
})

let storage;
async function initialise(){
    storage = await new Storage({
        email: id,
        password: pass
    }).ready
    console.log("--------------------------------");
    console.log("Link Established Successfully!");
    console.log("--------------------------------");
}
initialise();

let data;
let folder_1;
let folder_2;
let folder_3;
let folder_4;
let dataFile;
let course;
let sem;
let sub;
let type;
let files={};

async function mega_upload(file_name, oldpath, course, sem, sub, type, res) {
    if (typeof course=="undefined" || typeof sem=="undefined" || typeof sub=="undefined"){
        console.log("empty");
        return;
    }
    let stats = fs.statSync(oldpath);
    let fileSizeInBytes = stats.size;
    const file = await storage.upload({
        name: file_name,
        size: fileSizeInBytes
    }, fs.createReadStream(oldpath)).complete
    folder_1 = 0;
    folder_2 = 0;
    folder_3 = 0;
    folder_4 = 0;
    for (i in storage.root.children) {
        if (storage.root.children[i].name == course) {
            folder_1 = storage.root.children[i];
            for (j in folder_1.children) {
                if (folder_1.children[j].name == sem) {
                    folder_2 = folder_1.children[j];
                    for (k in folder_2.children) {
                        if (folder_2.children[k].name == sub) {
                            folder_3 = folder_2.children[k];
                            for (l in folder_3.children){
                                if (folder_3.children[l].name == type) {
                                    folder_4 = folder_3.children[l];
                                }
                            }
                            break;
                        }
                    }
                    break;
                }
            }
            break;
        }
    }
    await file.moveTo(folder_4)
    console.log('File uploaded!');
    fs.unlink(oldpath, function (err) {
        if (err) throw err;
        console.log('File deleted!');
        res.send('Done!');
    })
}

app.post('/fileupload', function (req, res) {
    let form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        let oldpath = files.filetoupload.filepath;
        let file_name = files.filetoupload.originalFilename;
        course = fields.course;
        sem = fields.semester;
        sub = fields.subject;
        type = fields.type;
        mega_upload(file_name, oldpath, course, sem, sub, type, res);
    });
})

app.post('/fetchData', jsonParser, async function(req,res){
    data = req.body;
    course = data.course;
    sem = data.sem;
    sub = data.sub;
    type = data.type;
    files = {};
    for (i in storage.root.children) {
        if (storage.root.children[i].name == course) {
            folder_1 = storage.root.children[i];
            for (j in folder_1.children) {
                if (folder_1.children[j].name == sem) {
                    folder_2 = folder_1.children[j];
                    for (k in folder_2.children) {
                        if (folder_2.children[k].name == sub) {
                            folder_3 = folder_2.children[k];
                            for(l in folder_3.children){
                                if (folder_3.children[l].name == type) {
                                    folder_4 = folder_3.children[l];
                                    for(m in folder_4.children){
                                        dataFile = folder_4.children[m];
                                        let url = await dataFile.link();
                                        files[dataFile.name] =  url;
                                    }
                                }
                            }
                            break;
                        }
                    }
                    break;
                }
            }
            break;
        }
    }
    res.send(JSON.stringify(files));
})

app.get('/mkdir',async function(req,res){

    for (i in storage.root.children) {
        folder_1 = storage.root.children[i];
        for (j in folder_1.children) {
            folder_2 = folder_1.children[j];
            for (k in folder_2.children) {
                folder_3 = folder_2.children[k];
                console.log(folder_3.name);
                await folder_3.mkdir("assignments");
                await folder_3.mkdir("class-notes");
                await folder_3.mkdir("viva-material");
                await folder_3.mkdir("pyq");
                await folder_3.mkdir("practical-file");
                await folder_3.mkdir("books");
            }
        }
    }
    res.send("Hello!");
})

const server = app.listen(8080, function () {
    let host = server.address().address;
    let port = server.address().port;

    console.log("Server started listening at http://%s:%s", host, port);
})