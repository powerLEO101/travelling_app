# Travel Partner Matching Application

This application helps users find compatible travel partners based on their preferences and interests.

## System Architecture

The application consists of two main components:

1. **Frontend**: A Node.js Express application serving the web interface
2. **Backend**: A Python FastAPI application providing the matching logic

## Setup and Running

### Prerequisites

- Node.js (v14+)
- Python 3.8+
- pip (Python package manager)

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install the required Python packages:
   ```
   pip install fastapi uvicorn anthropic
   ```

3. Set your Anthropic API key:
   ```
   export CLAUDE_API_KEY="your_api_key_here"
   ```

4. Start the backend server:
   ```
   uvicorn main:app --host 0.0.0.0 --port 8000
   ```

### Frontend Setup

1. From the project root, install Node.js dependencies:
   ```
   npm install
   ```

2. Start the frontend server:
   ```
   node app.mjs
   ```

3. Access the application at: http://localhost:3000

## Using the Application

1. **Sign Up**: Create an account using the signup page. The backend requires a user account to perform matching.

2. **Set Your Preferences**: After signup, you'll be redirected to the preferences page where you can set your travel preferences:
   - Age
   - Interests
   - Preferred destination
   - Budget range

3. **Find Travel Partners**: The system will match you with compatible travel partners based on:
   - Similar age groups
   - Shared interests
   - Compatible destinations
   - Similar budget ranges

4. **Connect**: When you find a compatible travel partner, you can initiate a connection.

## How It Works

The system uses a sophisticated matching algorithm in the Python backend to find compatible travel partners. The matching is based on:

- Age proximity
- Shared interests
- Destination compatibility
- Budget alignment

The matching process leverages Anthropic's Claude AI to select the most compatible partner from the database, considering not just quantitative factors but qualitative compatibility as well.

## Backend Integration Details

The frontend and backend interact in the following ways:

1. **User Registration**: 
   - Frontend collects user details and sends them to `/api/user/register`
   - Backend stores the user in its database and returns the updated user database

2. **Finding Matches**:
   - Frontend sends user ID and preferences to `/api/find-travel-partners`
   - This endpoint forwards the request to the backend's `/api/user/get_matches/{user_id}`
   - The backend uses Claude AI to analyze user profiles and return a single best match (just the UUID)
   - The frontend receives this UUID, looks up the complete user profile, and displays it to the user

3. **Response Processing**:
   - The backend returns a text response with just the UUID of the best match
   - The frontend extracts this UUID and fetches the complete user profile data
   - The match is displayed with compatibility score and user details

## Troubleshooting

### No Matches Found

If the application doesn't return any matches:

1. **Check Backend Connection**: Ensure the Python backend is running at the URL specified in `BACKEND_URL`
2. **Verify API Key**: Make sure your `CLAUDE_API_KEY` is set correctly and active
3. **User Registration**: Confirm that you've registered an account and received a valid user ID
4. **Console Logs**: Check your browser's JavaScript console (F12) for detailed error information
5. **Server Logs**: Examine the terminal output where your Node.js and Python servers are running

### Error Messages

- **"Please register to get personalized travel partner matches"**: You need to create an account before finding matches
- **"Service Temporarily Unavailable"**: The backend might be down or unreachable
- **"Unable to connect to the matching service"**: Check that your Python backend is running

## Environment Variables

The following environment variables can be set:

- `PORT`: Frontend server port (default: 3000)
- `BACKEND_URL`: URL of the backend server (default: http://localhost:8000)
- `AUTO_START_BACKEND`: Set to 'true' to auto-start the backend from the frontend (default: false)
- `CLAUDE_API_KEY`: API key for Anthropic's Claude (required by the backend)

## Developer Notes

The application uses console logging throughout the codebase to help with debugging. When troubleshooting, open your browser's developer tools and check the console output for detailed information about:

- API requests and responses
- User authentication status
- Match processing details
- Error conditions

This information can be invaluable when diagnosing issues with the application.
