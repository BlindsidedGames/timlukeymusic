// Select the dropdown button and the tabs
const dropdownButton = document.querySelector('.dropdown-button');
const tabs = document.querySelector('.tabs');

// Ensure the tabs are hidden on page load if the screen width is under 900px
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

window.addEventListener('resize', function () {
    var activeTab = document.querySelector('.tabs .tab-active');
    var clonedTab = activeTab.cloneNode(true);
    clonedTab.classList.add('cloned-tab', 'tab-active');

    if (window.innerWidth < 900) {
        if (!document.querySelector('.cloned-tab')) {
            clonedTab.style.width = getComputedStyle(activeTab).width;
            document.querySelector('header').appendChild(clonedTab);
        }
    } else {
        var existingClonedTab = document.querySelector('.cloned-tab');
        if (existingClonedTab) {
            existingClonedTab.remove();
        }
    }
});

window.dispatchEvent(new Event('resize'));