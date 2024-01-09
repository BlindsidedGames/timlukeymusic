// Select the dropdown button and the tabs
const dropdownButton = document.querySelector('.dropdown-button');
const tabs = document.querySelector('.tabs');

// Ensure the tabs are hidden on page load if the screen width is under 768px
if (window.innerWidth < 900) {
    tabs.style.display = 'none';
}

// Add a click event listener to the dropdown button
dropdownButton.addEventListener('click', () => {
    // Toggle the display of the tabs
    if (tabs.style.display === 'none') {
        tabs.style.display = 'flex';
    } else {
        tabs.style.display = 'none';
    }
});

window.addEventListener('resize', () => {
    // Update the display of the tabs based on the window width
    if (window.innerWidth >= 900) {
        tabs.style.display = 'flex';
    } else if (tabs.style.display === 'flex') {
        tabs.style.display = 'none';
    }
});