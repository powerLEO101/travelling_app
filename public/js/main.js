// Main JavaScript file for Wanderlust Explorer

document.addEventListener('DOMContentLoaded', function() {
  // Initialize animations
  const animatedElements = document.querySelectorAll('.fade-in');
  animatedElements.forEach(element => {
    element.classList.add('appear');
  });

  // Smooth scrolling for navigation
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      document.querySelector(this.getAttribute('href')).scrollIntoView({
        behavior: 'smooth'
      });
    });
  });
  
  // Destination filters
  const filterButtons = document.querySelectorAll('.filter-btn');
  const destinationCards = document.querySelectorAll('.destination-card');
  
  if (filterButtons.length > 0) {
    filterButtons.forEach(button => {
      button.addEventListener('click', () => {
        // Remove active class from all buttons
        filterButtons.forEach(btn => btn.classList.remove('active'));
        
        // Add active class to clicked button
        button.classList.add('active');
        
        const filter = button.textContent.trim().toLowerCase();
        
        // Show all destinations if "All" is selected
        if (filter === 'all') {
          destinationCards.forEach(card => {
            card.style.display = 'block';
          });
          return;
        }
        
        // Otherwise, filter by region
        destinationCards.forEach(card => {
          const badge = card.querySelector('.destination-badge');
          if (badge && badge.textContent.trim().toLowerCase() === filter) {
            card.style.display = 'block';
          } else {
            card.style.display = 'none';
          }
        });
      });
    });
  }
  
  // Pagination buttons (placeholder functionality)
  const paginationButtons = document.querySelectorAll('.pagination-num');
  
  if (paginationButtons.length > 0) {
    paginationButtons.forEach(button => {
      button.addEventListener('click', () => {
        paginationButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
      });
    });
  }
}); 