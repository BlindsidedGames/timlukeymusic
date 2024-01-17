var originalsButton = document.getElementById('originalsButton');
var coversButton = document.getElementById('coversButton');

// Define the adjustVideoHeight function in the global scope
function adjustVideoHeight() {
    // Select all elements with the class 'bookGigiFrame'
    var frames = document.querySelectorAll('.bookGigiFrame');

    // Iterate over each element
    frames.forEach(function (frame) {
        // Set the height to be 56.25% of the current width
        frame.style.height = frame.offsetWidth * 0.5625 + 'px';
    });
}

originalsButton.addEventListener('click', function () {
    originalsButton.classList.add('active');
    coversButton.classList.remove('active');
    document.getElementById('originals').style.display = 'block';
    document.getElementById('covers').style.display = 'none';
});

coversButton.addEventListener('click', function () {
    coversButton.classList.add('active');
    originalsButton.classList.remove('active');
    document.getElementById('covers').style.display = 'block';
    document.getElementById('originals').style.display = 'none';
    adjustVideoHeight();
});

window.onload = function () {
    // Add the event listener for the window's resize event
    window.addEventListener('resize', adjustVideoHeight);

    // Call the function once initially to set the height correctly when the page first loads
    adjustVideoHeight();
}