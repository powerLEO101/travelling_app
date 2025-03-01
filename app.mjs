import express from 'express';
import path from 'path';
import hbs from 'hbs';
import url from 'url';
import { spawn } from 'child_process';

// Initialize app
const app = express();
const port = process.env.PORT || 3000;
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Backend server config
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';
let backendProcess = null;

// Function to start the Python backend if needed
const startBackendServer = () => {
  try {
    // Check if we should auto-start the backend
    if (process.env.AUTO_START_BACKEND === 'true') {
      console.log('Starting Python backend server...');
      
      // Start the Python backend using uvicorn
      backendProcess = spawn('uvicorn', ['backend.main:app', '--host', '0.0.0.0', '--port', '8000'], {
        detached: true,
        stdio: 'inherit'
      });
      
      // Log when the backend process exits
      backendProcess.on('exit', (code) => {
        console.log(`Backend process exited with code ${code}`);
      });
      
      // Handle backend process errors
      backendProcess.on('error', (err) => {
        console.error('Failed to start backend:', err);
      });
      
      // Ensure the backend is properly killed when the Node.js process exits
      process.on('exit', () => {
        if (backendProcess) {
          backendProcess.kill();
        }
      });
    } else {
      console.log(`Backend expected to be running at: ${BACKEND_URL}`);
    }
  } catch (error) {
    console.error('Error starting backend server:', error);
  }
};

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

app.get('/preferences', (req, res) => {
  res.render('preferences');
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

// API routes that interact with the backend
// Route to get the entire user database
app.get('/api/users', async (req, res) => {
  try {
    console.log('Fetching user database from backend...');
    // Since the backend doesn't expose a user database endpoint,
    // we'll create a local version with the known users for demo purposes
    const users = {
      "e991e819-882c-4dd8-b93a-edbfac3cb0a3": {
        "name": "Hugo",
        "age": 19,
        "budget": 1000,
        "travel_days": 2,
        "location": "New York",
        "interests": ["biking"],
        "bio": "CS student at NYU"
      },
      "f09d0f78-35fc-472c-a473-374705759d6c": {
        "name": "Leo",
        "age": 19,
        "budget": 1000,
        "travel_days": 2,
        "location": "New York",
        "interests": ["running"],
        "bio": "CS student at NYU"
      },
      "75df743c-bb84-41a9-b828-6cafd17dc7a6": {
        "name": "Abid",
        "age": 30,
        "budget": 10000000,
        "travel_days": 200,
        "location": "Abu Dhabi",
        "interests": ["cocaine"],
        "bio": "Pakistani guy"
      },
      "2abeaa99-5b17-4ddb-9cba-5a6e18b1fc84": {
        "name": "Jack",
        "age": 30,
        "budget": 10000000,
        "travel_days": 200,
        "location": "Shanghai",
        "interests": ["cocaine"],
        "bio": "Chinese guy"
      }
    };
    
    return res.status(200).json(users);
  } catch (error) {
    console.error('Error accessing user database:', error);
    return res.status(500).json({ error: 'Unable to access the user database.' });
  }
});

// Route to register a new user
app.post('/api/user/register', async (req, res) => {
  try {
    // Validate required fields
    const { name, age, budget, travel_days, location, interests, bio } = req.body;
    
    console.log('Registration request received:', { name, age, location });
    
    if (!name || !age || !budget || !location || !interests || !bio) {
      console.log('Missing required fields in registration request');
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Send registration request to the backend
    console.log('Sending registration request to backend:', `${BACKEND_URL}/api/user/register`);
    const response = await fetch(`${BACKEND_URL}/api/user/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name,
        age: parseInt(age, 10),
        budget: parseInt(budget, 10),
        travel_days: parseInt(travel_days || 7, 10),
        location,
        interests: Array.isArray(interests) ? interests : [interests],
        bio
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend registration failed:', response.status, errorText);
      throw new Error(`Backend returned ${response.status}: ${errorText}`);
    }
    
    const userData = await response.json();
    console.log('Registration successful, response data:', userData);
    
    // Extract the user ID from the returned data
    // The backend returns the entire user database, so we need to find our new user
    const userId = Object.keys(userData).find(key => userData[key].name === name);
    
    if (!userId) {
      console.error('User ID not found in response data');
      throw new Error('User was registered but ID was not returned');
    }
    
    console.log('New user registered with ID:', userId);
    
    return res.status(201).json({ 
      success: true, 
      message: 'User registered successfully',
      userId
    });
  } catch (error) {
    console.error('Error registering user:', error);
    return res.status(500).json({ 
      error: 'Unable to register user. Please try again later.',
      details: error.message
    });
  }
});

// API endpoints
// This endpoint forwards to the existing backend API for finding travel partners
app.post('/api/find-travel-partners', async (req, res) => {
  // We're using the backend matching service running as a separate service
  try {
    // First, check if we have a user ID (for registered users)
    const userId = req.body.userId;
    
    if (!userId) {
      // For unregistered users, prompt them to register
      return res.status(200).json({ 
        matches: [],
        message: "Please register to get personalized travel partner matches"
      });
    }
    
    console.log(`Finding travel partners for user ${userId}`);
    
    // For registered users, use the get_matches endpoint
    const response = await fetch(`${BACKEND_URL}/api/user/get_matches/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`Backend response status: ${response.status}`);
    const headers = Object.fromEntries([...response.headers.entries()]);
    console.log(`Response headers:`, headers);
    
    if (!response.ok) {
      console.error(`Backend returned status ${response.status}`);
      throw new Error(`Backend returned ${response.status}`);
    }
    
    // The FastAPI backend returns the Claude response directly - a plain text match ID
    const responseText = await response.text();
    console.log(`Backend raw response: "${responseText}"`);
    
    if (!responseText || responseText.trim() === '') {
      console.log("Empty response from backend, no match found");
      return res.status(200).json({ 
        matches: [],
        message: "No compatible travel partners found. Try adjusting your preferences."
      });
    }
    
    // Extract UUID using regex - the Claude response should contain a UUID
    const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
    const match = responseText.match(uuidRegex);
    let matchId;
    
    if (match) {
      matchId = match[0];
      console.log(`Found UUID in response: ${matchId}`);
    } else {
      console.log("No UUID found in response, using trimmed response as ID");
      matchId = responseText.trim();
    }
    
    // Now fetch this user's details from our local users endpoint
    console.log(`Looking up user details for match ID: ${matchId}`);
    
    try {
      const usersResponse = await fetch(`${BACKEND_URL}/api/user/register`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!usersResponse.ok) {
        throw new Error(`Failed to fetch user database: ${usersResponse.status}`);
      }
      
      const users = await usersResponse.json();
      console.log(`Got user database with ${Object.keys(users).length} users`);
      
      // Find the matched user in the database
      const matchedUser = users[matchId];
      
      if (matchedUser) {
        console.log(`Found matching user: ${matchedUser.name}`);
        
        // Return full user data
        return res.status(200).json({
          matches: [{
            id: matchId,
            name: matchedUser.name,
            age: matchedUser.age,
            location: matchedUser.location,
            budget: matchedUser.budget,
            interests: matchedUser.interests,
            bio: matchedUser.bio,
            compatibilityScore: 0.85 // Assume high match since backend selected it
          }]
        });
      } else {
        // Fallback to our local database
        console.log(`User ID ${matchId} not found in main database, checking local backup`);
        
        const localUsers = {
          "e991e819-882c-4dd8-b93a-edbfac3cb0a3": {
            "name": "Hugo",
            "age": 19,
            "budget": 1000,
            "location": "New York",
            "interests": ["biking"],
            "bio": "CS student at NYU"
          },
          "f09d0f78-35fc-472c-a473-374705759d6c": {
            "name": "Leo",
            "age": 19,
            "budget": 1000,
            "location": "New York",
            "interests": ["running"],
            "bio": "CS student at NYU"
          },
          "75df743c-bb84-41a9-b828-6cafd17dc7a6": {
            "name": "Abid",
            "age": 30,
            "budget": 10000000,
            "location": "Abu Dhabi",
            "interests": ["cocaine"],
            "bio": "Pakistani guy"
          },
          "2abeaa99-5b17-4ddb-9cba-5a6e18b1fc84": {
            "name": "Jack",
            "age": 30,
            "budget": 10000000,
            "location": "Shanghai",
            "interests": ["cocaine"],
            "bio": "Chinese guy"
          }
        };
        
        const localMatchedUser = localUsers[matchId];
        
        if (localMatchedUser) {
          console.log(`Found match in local database: ${localMatchedUser.name}`);
          // Return local user data
          return res.status(200).json({
            matches: [{
              id: matchId,
              name: localMatchedUser.name,
              age: localMatchedUser.age,
              location: localMatchedUser.location,
              budget: localMatchedUser.budget,
              interests: localMatchedUser.interests,
              bio: localMatchedUser.bio,
              compatibilityScore: 0.85
            }]
          });
        } else {
          console.log(`No user data found for ID: ${matchId}`);
          
          // Just return the ID as minimal data
          return res.status(200).json({
            matches: [{
              id: matchId,
              name: "Travel Partner",
              age: "Unknown",
              location: "Unknown",
              interests: ["Travel"],
              bio: `Details not available for partner with ID: ${matchId}`,
              compatibilityScore: 0.8 // Assume good match since backend selected it
            }]
          });
        }
      }
    } catch (userLookupError) {
      console.error('Error fetching user details:', userLookupError);
      
      // Fall back to just returning the ID as minimal data
      return res.status(200).json({
        matches: [{
          id: matchId,
          name: "Travel Partner",
          age: "Unknown",
          location: "Unknown",
          interests: ["Travel"],
          bio: "User lookup failed. ID: " + matchId,
          compatibilityScore: 0.8 // Assume good match since backend selected it
        }]
      });
    }
  } catch (error) {
    console.error('Error connecting to backend matching service:', error);
    return res.status(500).json({ 
      error: 'Unable to connect to the matching service. Please try again later.',
      details: error.message
    });
  }
});

// Start backend if configured to do so
startBackendServer();

// Start server
app.listen(port, () => {
  console.log(`Frontend server running on port ${port}`);
  console.log(`Backend expected at: ${BACKEND_URL}`);
}); 