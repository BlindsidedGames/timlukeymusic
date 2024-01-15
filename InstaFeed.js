// Replace with your Instagram Access Token
const accessToken = 'IGQWRNYllhQVZAKZAEdRTWo3d2wyQ1BCV0JfM0VscnRlVjlPOGxtcnlNNEQxaHVCMUo1T2JYdzRKclRkOTlrRUJJR05WcTdnN2x0UzVraUdvaU5nenZALNTRBV2JvOVpRWGU5YzBudllVaW13UQZDZD';

// Function to fetch and display Instagram feed
function getInstagramFeed() {
    fetch(`https://feeds.behold.so/xCtD8lJEFavXxLO5s5F2`)
        .then(response => response.json())
        .then(data => {
            const carousel = document.querySelector('.carousel');

            data.data.forEach(post => {
                if (post.media_type === 'IMAGE') {
                    const carouselItem = document.createElement('div');
                    carouselItem.className = 'carousel-item';

                    const postLink = document.createElement('a');
                    postLink.href = post.permalink;
                    postLink.target = '_blank';

                    const postImage = document.createElement('img');
                    postImage.src = post.media_url;
                    postImage.className = 'instagram-image';

                    postLink.appendChild(postImage);
                    carouselItem.appendChild(postLink);

                    carousel.appendChild(carouselItem);
                }
            });

            startAutoScroll(carousel);
        })
        .catch(error => console.error(error));
}


function startAutoScroll(carousel) {


    setInterval(() => {
        // Check if the viewport width is less than or equal to 768 pixels
        if (window.innerWidth <= 768) {
            // If true, set pixelsToScroll to a lower value for mobile devices
            pixelsToScroll = 110; // Adjust this value as needed
        } else {
            // If false, set pixelsToScroll to the original value for desktop devices
            pixelsToScroll = 310; // Adjust this value as needed
        }
        // Scroll the carousel by a fixed number of pixels
        carousel.scrollTo({
            left: carousel.scrollLeft + pixelsToScroll,
            behavior: 'smooth'
        });

        // Delay the check for whether the first item is invisible
        setTimeout(() => {
            const firstItemInvisible = carousel.scrollLeft >= pixelsToScroll - 1;

            if (firstItemInvisible) {
                // Move the first item to the end
                const firstItem = carousel.querySelector('.carousel-item');
                carousel.appendChild(firstItem);
                // Reset the scroll position to the beginning
                carousel.scrollTo({left: 0, behavior: 'auto'});

            }
        }, 500); // Adjust this value as needed
    }, 3000);
}

getInstagramFeed();