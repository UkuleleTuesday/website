/**
 * Mobile Menu Toggle Functionality
 * Simple JavaScript to handle hamburger menu click and mobile menu display
 */

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.querySelector('.cesis_mobile_menu_switch');
    const mobileMenu = document.querySelector('.header_mobile');
    
    if (hamburger && mobileMenu) {
        hamburger.addEventListener('click', function() {
            // Toggle open class on hamburger for animation
            hamburger.classList.toggle('open');
            
            // Toggle mobile menu visibility
            if (mobileMenu.style.display === 'none' || mobileMenu.style.display === '') {
                mobileMenu.style.display = 'block';
            } else {
                mobileMenu.style.display = 'none';
            }
        });
        
        // Close mobile menu when clicking on menu items (for better UX)
        const menuLinks = mobileMenu.querySelectorAll('a');
        menuLinks.forEach(function(link) {
            link.addEventListener('click', function() {
                hamburger.classList.remove('open');
                mobileMenu.style.display = 'none';
            });
        });
    }
});