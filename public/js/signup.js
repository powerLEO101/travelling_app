// Signup page JavaScript for handling form submission and registration

document.addEventListener('DOMContentLoaded', function() {
  const signupForm = document.querySelector('.auth-form');
  
  // Show status message to help users debug
  showNotification('Ready to create account. Check browser console for details (F12).', 'info', 5000);
  console.log('Signup page loaded. User registration will connect to backend at /api/user/register');
  
  if (signupForm) {
    signupForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      // Show loading state
      const submitButton = this.querySelector('button[type="submit"]');
      const originalButtonText = submitButton.textContent;
      submitButton.textContent = 'Creating Account...';
      submitButton.disabled = true;
      
      // Validate passwords match
      const name = document.getElementById('name').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirm-password').value;
      
      console.log(`Processing signup for: ${name} (${email})`);
      
      if (password !== confirmPassword) {
        showNotification('Passwords do not match', 'error');
        submitButton.textContent = originalButtonText;
        submitButton.disabled = false;
        return;
      }
      
      // Get additional information for the backend
      // In a real app, these would be collected from additional form fields
      // For this demo, we'll add some default values
      const userData = {
        name: name,
        email: email,
        age: 30, // Default age
        budget: 3000, // Default budget
        travel_days: 7, // Default travel days
        location: 'Europe', // Default location
        interests: ['culture', 'adventure'], // Default interests
        bio: `Hello, I'm ${name}. I like to travel and explore new places.` // Default bio
      };
      
      console.log('Sending registration data to server:', userData);
      
      try {
        // Register user with the backend
        const response = await fetch('/api/user/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(userData)
        });
        
        console.log('Registration response status:', response.status);
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Registration error:', errorData);
          throw new Error(errorData.error || 'Error registering user');
        }
        
        const data = await response.json();
        console.log('Registration successful, received data:', data);
        
        if (data.success && data.userId) {
          // Save user ID to localStorage for future API calls
          localStorage.setItem('userId', data.userId);
          localStorage.setItem('userName', userData.name);
          
          // Show success notification
          showNotification('Account created successfully! Redirecting to preferences...', 'success');
          
          // Redirect to preferences page after a short delay
          setTimeout(() => {
            window.location.href = '/preferences';
          }, 2000);
        } else {
          // Handle registration errors
          console.warn('Registration returned success=false or no userId:', data);
          showNotification(data.error || 'Failed to create account', 'error');
        }
      } catch (error) {
        console.error('Registration error:', error);
        showNotification('Unable to create account: ' + error.message, 'error');
      } finally {
        // Restore button state
        submitButton.textContent = originalButtonText;
        submitButton.disabled = false;
      }
    });
  }
  
  // Function to show notifications with optional duration
  function showNotification(message, type = 'info', duration = 3000) {
    // Remove any existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
      existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);
    
    // Hide notification after specified duration
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, duration);
  }
}); 