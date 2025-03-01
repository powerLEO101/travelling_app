import express from 'express';
import path from 'path';
import hbs from 'hbs';
import url from 'url';


// Initialize app
const app = express();
const port = process.env.PORT || 3000;
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
// Set up view engine
// app.engine('hbs', hbs.engine({
//   extname: 'hbs',
//   defaultLayout: 'layout',
//   layoutsDir: path.join(__dirname, 'views'),
// }));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
  res.render('home');
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/signup', (req, res) => {
  res.render('signup');
});

app.get('/destinations', (req, res) => {
  res.render('destinations');
});

app.get('/about', (req, res) => {
  res.render('about');
});

app.get('/contact', (req, res) => {
  res.render('contact');
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 