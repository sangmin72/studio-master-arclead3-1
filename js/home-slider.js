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
        
        // If no banner images found, create default slides to maintain 13 slides
        if (bannerImages.length === 0) {
            console.log('No banner images found, creating default slides');
            bannerImages = [
                { url: 'img/bg-img/1.jpg', artistName: 'Believe you can fly', shortIntro: '' },
                { url: 'img/bg-img/2.jpg', artistName: 'Believe you can fly', shortIntro: '' },
                { url: 'img/bg-img/3.jpg', artistName: 'Believe you can fly', shortIntro: '' }
            ];
        }
        
        // Shuffle banner images for variety
        bannerImages = shuffleArray(bannerImages);
        
        // Always maintain 13 slides by repeating images if necessary
        const selectedImages = [];
        const targetSlideCount = 13;
        
        for (let i = 0; i < targetSlideCount; i++) {
            const imageIndex = i % bannerImages.length;
            const originalImage = bannerImages[imageIndex];
            
            // Add cycle information for repeated images
            const cycleNumber = Math.floor(i / bannerImages.length) + 1;
            const isRepeated = cycleNumber > 1;
            
            selectedImages.push({
                ...originalImage,
                cycleNumber: cycleNumber,
                isRepeated: isRepeated,
                originalIndex: imageIndex
            });
        }
        
        console.log(`Created ${selectedImages.length} slides from ${bannerImages.length} unique banner images`);
        
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
        
        // Reinitialize the carousel to ensure proper functionality
        $('#welcomeSlider').carousel('dispose');
        $('#welcomeSlider').carousel({
            interval: 5000,
            pause: 'hover'
        });
        
        console.log(`Slider updated with ${selectedImages.length} slides (${bannerImages.length} unique images, repeated as needed)`);
        
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