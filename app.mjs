// app.mjs
import express from 'express';
import path from 'path';
import url from 'url';
import fs from 'fs';


export let server = null;
export const app = express();

server = app.listen(3000);
console.log('Server started; type CTRL+C to shut down');

app.set('view engine', 'hbs');
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({extended: false}));
app.use((req, res, next) => {
    console.log(req.method);
    console.log(req.path);
    console.log(req.query);
    next();
});

app.get('/', (req, res) => {
  res.render('mainPage');
});