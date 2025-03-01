// Preferences page JavaScript for handling form submission and matching

document.addEventListener('DOMContentLoaded', function() {
  const preferencesForm = document.querySelector('.preferences-form');
  const resultsContainer = document.querySelector('.match-results-container');
  const savePreferencesBtn = document.querySelector('.save-preferences-btn');

  console.log('Preferences page loaded. Ready for travel partner matching.');
  
  // Check if user is logged in and show appropriate message
  const userId = localStorage.getItem('userId');
  const userName = localStorage.getItem('userName');
  
  if (userId) {
    console.log(`User logged in: ${userName} (${userId})`);
    showNotification(`Welcome back, ${userName}! Fill out your preferences to find travel partners.`, 'info', 5000);
  } else {
    console.log('No user logged in');
    showNotification('Create an account to find travel partners matched to your preferences.', 'info', 5000);
  }

  if (preferencesForm) {
    // Load saved preferences if available
    loadSavedPreferences();
    
    // Form submission handler for finding partners
    preferencesForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      console.log('Form submitted, searching for travel partners...');
      
      // Show loading state
      const submitButton = this.querySelector('button[type="submit"]');
      const originalButtonText = submitButton.textContent;
      submitButton.textContent = 'Finding matches...';
      submitButton.disabled = true;
      
      // Check if user is logged in
      const userId = localStorage.getItem('userId');
      if (!userId) {
        console.log('No user ID found, showing registration prompt');
        displayRegistrationPrompt('You need to create an account to find travel partners.');
        submitButton.textContent = originalButtonText;
        submitButton.disabled = false;
        return;
      }
      
      console.log('Using user ID:', userId);
      
      // Collect form data
      const formData = new FormData(this);
      const preferences = {
        age: parseInt(formData.get('age'), 10) || 25,
        interests: getSelectedInterests(formData),
        location: formData.get('location'),
        budget: getBudgetValue(formData.get('budget')),
        userId: userId
      };
      
      console.log('Sending preferences to backend:', preferences);
      
      try {
        console.log('Fetching travel partners from API endpoint: /api/find-travel-partners');
        // Fetch travel partners from the backend API
        const response = await fetch('/api/find-travel-partners', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(preferences)
        });
        
        console.log(`API response status: ${response.status}`);
        console.log(`Response headers:`, Object.fromEntries([...response.headers.entries()]));
        
        if (!response.ok) {
          console.error(`Error response from API: ${response.status}`);
          throw new Error(`Error finding travel partners: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Full API response data:', data);
        
        // Check if we received a message about needing to register
        if (data.message && data.message.includes("register")) {
          console.log('Registration required message received');
          displayRegistrationPrompt(data.message);
        } else {
          // Process matches from the backend
          const matches = data.matches || [];
          console.log(`Received ${matches.length} matches:`, matches);
          
          if (matches.length === 0) {
            console.log('No matches found, displaying empty state');
            displayNoMatches("No matches found. The AI may not have found a suitable travel partner.");
          } else {
            console.log(`Displaying ${matches.length} matches to user`);
            displayMatchResults(matches);
          }
        }
        
        // Scroll to results
        if (resultsContainer) {
          resultsContainer.scrollIntoView({ behavior: 'smooth' });
        }
      } catch (error) {
        console.error('API call error:', error);
        
        // Handle API errors gracefully by showing an error message
        displayErrorMessage('Unable to connect to the matching service. Please try again later.');
      } finally {
        // Restore button state
        submitButton.textContent = originalButtonText;
        submitButton.disabled = false;
      }
    });
    
    // Save preferences button handler
    if (savePreferencesBtn) {
      savePreferencesBtn.addEventListener('click', function() {
        const formData = new FormData(preferencesForm);
        const preferences = {
          age: formData.get('age'),
          interests: getSelectedInterests(formData),
          location: formData.get('location'),
          budget: formData.get('budget')
        };
        
        console.log('Saving preferences to localStorage:', preferences);
        // Save to localStorage
        localStorage.setItem('travelPreferences', JSON.stringify(preferences));
        
        // Show success message
        showNotification('Preferences saved successfully!', 'success');
      });
    }
  }
  
  // Helper function to get all selected interests
  function getSelectedInterests(formData) {
    const interests = formData.getAll('interests');
    const customInterest = formData.get('customInterest');
    
    if (customInterest && customInterest.trim() !== '') {
      interests.push(customInterest.trim());
    }
    
    return interests;
  }
  
  // Display match results in the UI
  function displayMatchResults(matches) {
    console.log('Rendering match results to UI');
    
    if (!resultsContainer) {
      // Create results container if it doesn't exist
      console.log('Creating results container');
      const container = document.createElement('div');
      container.className = 'match-results-container';
      document.querySelector('.preferences-container').insertAdjacentElement('afterend', container);
      
      const heading = document.createElement('h2');
      heading.textContent = 'Your Travel Partner Matches';
      heading.className = 'matches-heading';
      container.appendChild(heading);
      
      const matchesGrid = document.createElement('div');
      matchesGrid.className = 'matches-grid';
      container.appendChild(matchesGrid);
      
      // Update resultsContainer reference
      resultsContainer = container;
    }
    
    const matchesGrid = resultsContainer.querySelector('.matches-grid');
    matchesGrid.innerHTML = '';
    
    if (matches.length === 0) {
      console.log('No matches to display');
      matchesGrid.innerHTML = '<div class="no-matches">No travel partners found. Try adjusting your preferences.</div>';
      return;
    }
    
    // Render each match
    matches.forEach((match, index) => {
      console.log(`Rendering match ${index + 1}:`, match);
      
      const matchCard = document.createElement('div');
      matchCard.className = 'match-card';
      
      // The backend might use different property names
      const name = match.name || match.userName || '';
      const age = match.age || match.userAge || '';
      const location = match.location || match.destination || match.region || '';
      const budget = match.budget || match.budgetRange || '';
      const interests = match.interests || match.travelInterests || [];
      const bio = match.bio || match.userBio || match.description || 'No bio available';
      const id = match.id || match._id || match.userId || '';
      
      console.log(`Match ${index + 1} processed properties:`, { name, age, location, budget, interests, id });
      
      // The backend might use a different format for compatibility score (0-1, 0-100, etc.)
      let compatibilityScore = match.compatibilityScore || match.matchScore || match.compatibility || 0;
      // Convert to 0-1 scale if it's on a 0-100 scale
      if (compatibilityScore > 1) {
        compatibilityScore = compatibilityScore / 100;
      }
      
      const matchScore = Math.floor(compatibilityScore * 100);
      const scoreClass = matchScore >= 80 ? 'high' : matchScore >= 60 ? 'medium' : 'low';
      
      console.log(`Match ${index + 1} score: ${matchScore}% (${scoreClass})`);
      
      matchCard.innerHTML = `
        <div class="match-header">
          <h3>${name}${age ? `, ${age}` : ''}</h3>
          <div class="match-score ${scoreClass}">${matchScore}% Match</div>
        </div>
        <div class="match-details">
          <p><strong>Destination:</strong> ${location || 'Not specified'}</p>
          <p><strong>Budget:</strong> ${formatBudget(budget)}</p>
          <div class="match-bio">
            <p>${bio}</p>
          </div>
          <div class="match-interests">
            <strong>Interests:</strong>
            <div class="interest-tags">
              ${Array.isArray(interests) && interests.length > 0 ? 
                interests.map(interest => `<span class="interest-tag">${interest}</span>`).join('') : 
                '<span class="interest-tag">Travel</span>'}
            </div>
          </div>
        </div>
        <button class="button secondary connect-btn" data-user-id="${id}">Connect</button>
      `;
      
      matchesGrid.appendChild(matchCard);
    });
    
    // Add event listeners to connect buttons
    document.querySelectorAll('.connect-btn').forEach(btn => {
      btn.addEventListener('click', async function() {
        const userId = this.getAttribute('data-user-id');
        console.log(`Connecting with user: ${userId}`);
        
        this.textContent = 'Connecting...';
        this.disabled = true;
        
        try {
          // Simulate connecting with the user
          await new Promise(resolve => setTimeout(resolve, 1000));
          this.textContent = 'Connected!';
          this.classList.add('connected');
          console.log(`Successfully connected with user: ${userId}`);
        } catch (error) {
          console.error('Error connecting with user:', error);
          this.textContent = 'Try Again';
          this.disabled = false;
        }
      });
    });
  }
  
  // Format budget display
  function formatBudget(budget) {
    // Return budget string directly if it's already formatted
    if (!budget || typeof budget === 'string' && budget.includes('$')) {
      return budget || 'Not specified';
    }
    
    // Handle different budget formats
    const budgetMap = {
      'budget': 'Under $1,000',
      'moderate': '$1,000 - $3,000',
      'luxury': '$3,000 - $5,000',
      'ultraluxury': 'Over $5,000',
      'low': 'Under $1,000',
      'medium': '$1,000 - $3,000',
      'high': '$3,000 - $5,000',
      'premium': 'Over $5,000'
    };
    
    // If the budget is a number, format it appropriately
    if (typeof budget === 'number') {
      if (budget < 1000) return 'Under $1,000';
      if (budget < 3000) return '$1,000 - $3,000';
      if (budget < 5000) return '$3,000 - $5,000';
      return 'Over $5,000';
    }
    
    return budgetMap[typeof budget === 'string' ? budget.toLowerCase() : budget] || budget;
  }
  
  // Function to display an error message when backend is unavailable
  function displayErrorMessage(message) {
    console.log('Displaying error message:', message);
    
    if (!resultsContainer) {
      // Create results container if it doesn't exist
      const container = document.createElement('div');
      container.className = 'match-results-container';
      document.querySelector('.preferences-container').insertAdjacentElement('afterend', container);
      
      // Update resultsContainer reference
      resultsContainer = container;
    }
    
    resultsContainer.innerHTML = `
      <div class="error-message">
        <h2>Service Temporarily Unavailable</h2>
        <p>${message}</p>
        <button class="button primary retry-btn">Try Again</button>
      </div>
    `;
    
    // Add event listener to retry button
    const retryButton = resultsContainer.querySelector('.retry-btn');
    if (retryButton) {
      retryButton.addEventListener('click', function() {
        console.log('Retry button clicked, resubmitting form');
        // Resubmit the form
        preferencesForm.dispatchEvent(new Event('submit'));
      });
    }
  }
  
  // Helper function to load saved preferences
  function loadSavedPreferences() {
    const savedPrefs = localStorage.getItem('travelPreferences');
    if (savedPrefs) {
      console.log('Loading saved preferences from localStorage');
      try {
        const preferences = JSON.parse(savedPrefs);
        console.log('Saved preferences:', preferences);
        
        // Set age
        if (preferences.age) {
          document.getElementById('age').value = preferences.age;
        }
        
        // Set interests
        if (preferences.interests && preferences.interests.length) {
          // Clear all checkboxes first
          document.querySelectorAll('input[name="interests"]').forEach(checkbox => {
            checkbox.checked = false;
          });
          
          // Check the relevant ones
          preferences.interests.forEach(interest => {
            const checkbox = document.querySelector(`input[value="${interest}"]`);
            if (checkbox) {
              checkbox.checked = true;
            }
          });
          
          // Set custom interest if it was the last one
          const lastInterest = preferences.interests[preferences.interests.length - 1];
          const isCustom = !document.querySelector(`input[value="${lastInterest}"]`);
          if (isCustom) {
            document.getElementById('custom-interest').value = lastInterest;
          }
        }
        
        // Set location
        if (preferences.location) {
          document.getElementById('location').value = preferences.location;
        }
        
        // Set budget
        if (preferences.budget) {
          document.getElementById('budget').value = preferences.budget;
        }
        
        console.log('Preferences loaded successfully');
      } catch (error) {
        console.error('Error loading saved preferences:', error);
      }
    } else {
      console.log('No saved preferences found');
    }
  }

  // Show notification message
  function showNotification(message, type = 'info', duration = 3000) {
    console.log(`Showing notification: ${message} (${type})`);
    
    // Remove any existing notification
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
      existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Add to DOM
    document.body.appendChild(notification);
    
    // Fade in
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);
    
    // Auto remove after delay
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, duration);
  }

  // Function to display a registration prompt
  function displayRegistrationPrompt(message) {
    console.log('Displaying registration prompt:', message);
    
    if (!resultsContainer) {
      // Create results container if it doesn't exist
      const container = document.createElement('div');
      container.className = 'match-results-container';
      document.querySelector('.preferences-container').insertAdjacentElement('afterend', container);
      
      // Update resultsContainer reference
      resultsContainer = container;
    }
    
    resultsContainer.innerHTML = `
      <div class="registration-prompt">
        <h2>Registration Required</h2>
        <p>${message || 'Please register to find travel partners tailored to your preferences.'}</p>
        <div class="registration-actions">
          <a href="/signup" class="button primary">Sign Up</a>
          <a href="/login" class="button secondary">Log In</a>
        </div>
      </div>
    `;
  }

  // Function to convert budget selection to a numeric value for the backend
  function getBudgetValue(budgetSelection) {
    const budgetMap = {
      'budget': 1000,
      'moderate': 3000,
      'luxury': 5000,
      'ultraluxury': 10000
    };
    
    return budgetMap[budgetSelection] || 3000; // Default to moderate if not found
  }

  // Function to display a message when no matches are found
  function displayNoMatches(message) {
    console.log('Displaying no matches message:', message);
    
    if (!resultsContainer) {
      // Create results container if it doesn't exist
      const container = document.createElement('div');
      container.className = 'match-results-container';
      document.querySelector('.preferences-container').insertAdjacentElement('afterend', container);
      
      // Update resultsContainer reference
      resultsContainer = container;
    }
    
    resultsContainer.innerHTML = `
      <div class="no-matches-container">
        <h2>No Travel Partners Found</h2>
        <p>${message || 'Try adjusting your preferences or checking back later.'}</p>
        <div class="no-matches-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
          </svg>
        </div>
        <button class="button primary retry-btn">Try Different Preferences</button>
      </div>
    `;
    
    // Add event listener to retry button
    const retryButton = resultsContainer.querySelector('.retry-btn');
    if (retryButton) {
      retryButton.addEventListener('click', function() {
        console.log('Try different preferences button clicked');
        // Scroll back to the form
        preferencesForm.scrollIntoView({ behavior: 'smooth' });
      });
    }
  }
}); 