$(document).ready(function() {
    loadSliderImages();
});

async function loadSliderImages() {
    try {
        const response = await fetch('/admin/api/artists');
        if (!response.ok) {
            console.error('Failed to fetch artists:', response.status);
            return;
        }
        
        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            console.error('Server returned non-JSON response, keeping default slider');
            return;
        }
        
        const artists = await response.json();
        
        if (!artists || artists.length === 0) {
            console.log('No artists found, keeping default slider');
            return;
        }
        
        // Collect home banner images from all artists
        let bannerImages = [];
        artists.forEach(artist => {
            if (artist.images && artist.images.length > 0 && artist.homeBannerIndex !== undefined) {
                const homeBannerUrl = artist.images[artist.homeBannerIndex];
                if (homeBannerUrl) {
                    bannerImages.push({
                        url: homeBannerUrl,
                        artistName: artist.name,
                        shortIntro: artist.shortIntro || ''
                    });
                }
            }
        });
        
        if (bannerImages.length === 0) {
            console.log('No banner images found, keeping default slider');
            return;
        }
        
        // Shuffle banner images for variety
        bannerImages = shuffleArray(bannerImages);
        
        // Take up to 13 images (matching original slider count)
        const selectedImages = bannerImages.slice(0, 13);
        
        // Update carousel items
        const $carouselInner = $('.carousel-inner');
        $carouselInner.empty();
        
        selectedImages.forEach((image, index) => {
            const activeClass = index === 0 ? 'active' : '';
            const slideNumber = String(index + 1).padStart(2, '0');
            
            const carouselItem = `
                <div class="carousel-item h-100 bg-img ${activeClass}" style="background-image: url(${image.url});">
                    <div class="carousel-content h-100">
                        <div class="slide-text">
                            <span>${slideNumber}.</span>
                            <h2>${image.artistName}</h2>
                            ${image.shortIntro ? `<p>${image.shortIntro}</p>` : ''}
                        </div>
                    </div>
                </div>
            `;
            
            $carouselInner.append(carouselItem);
        });
        
        // Update carousel indicators
        const $carouselIndicators = $('.carousel-indicators');
        $carouselIndicators.empty();
        
        selectedImages.forEach((image, index) => {
            const activeClass = index === 0 ? 'active' : '';
            
            const indicator = `
                <li data-target="#welcomeSlider" data-slide-to="${index}" class="${activeClass} bg-img" style="background-image: url(${image.url});"></li>
            `;
            
            $carouselIndicators.append(indicator);
        });
        
        console.log(`Slider updated with ${selectedImages.length} images from artists`);
        
    } catch (error) {
        console.error('Error loading slider images:', error);
    }
}

// Fisher-Yates shuffle algorithm
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
} 