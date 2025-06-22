$(document).ready(function() {
    loadSliderImages();
    
    // 페이지 로드 후 카루셀 자동 재생 확인
    setTimeout(() => {
        if ($('#welcomeSlider').length) {
            $('#welcomeSlider').carousel('cycle');
        }
    }, 1000);
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
        
        // Update carousel indicators with low-res images
        const $carouselIndicators = $('.carousel-indicators');
        $carouselIndicators.empty();
        
        // Create low-res versions for indicators
        const indicatorPromises = selectedImages.map((image, index) => {
            return new Promise((resolve) => {
                // 로컬 이미지나 CORS 문제가 있을 수 있으므로 원본 이미지도 대비
                if (image.url.startsWith('/images/') || image.url.startsWith('img/')) {
                    // API 이미지나 로컬 이미지는 저해상도 처리 시도
                    createLowResImageForIndicator(image.url, (lowResUrl) => {
                        const activeClass = index === 0 ? 'active' : '';
                        
                        const indicator = `
                            <li data-target="#welcomeSlider" data-slide-to="${index}" class="${activeClass} bg-img" style="background-image: url(${lowResUrl});"></li>
                        `;
                        
                        resolve({ index, indicator });
                    });
                } else {
                    // 외부 이미지는 원본 사용
                    const activeClass = index === 0 ? 'active' : '';
                    
                    const indicator = `
                        <li data-target="#welcomeSlider" data-slide-to="${index}" class="${activeClass} bg-img" style="background-image: url(${image.url});"></li>
                    `;
                    
                    resolve({ index, indicator });
                }
            });
        });
        
        // Add indicators in order
        Promise.all(indicatorPromises).then((results) => {
            results.sort((a, b) => a.index - b.index);
            results.forEach(result => {
                $carouselIndicators.append(result.indicator);
            });
        });
        
        // Reinitialize the carousel to ensure proper functionality
        $('#welcomeSlider').carousel('dispose');
        $('#welcomeSlider').carousel({
            interval: 4000,  // 4초마다 자동 슬라이드
            pause: 'hover',  // 마우스 호버 시 일시정지
            ride: 'carousel' // 자동 시작
        });
        
        // 강제로 자동 재생 시작
        setTimeout(() => {
            $('#welcomeSlider').carousel('cycle');
        }, 100);
        
        console.log(`Slider updated with ${selectedImages.length} slides (${bannerImages.length} unique images, repeated as needed)`);
        
    } catch (error) {
        console.error('Error loading slider images:', error);
        
        // 에러 발생 시에도 기본 카루셀 자동 재생 활성화
        setTimeout(() => {
            $('#welcomeSlider').carousel({
                interval: 4000,
                pause: 'hover',
                ride: 'carousel'
            });
            $('#welcomeSlider').carousel('cycle');
        }, 500);
    }
}

// Create low-resolution image for indicators
function createLowResImageForIndicator(originalImageUrl, callback) {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // CORS 처리
    img.onload = function() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // 인디케이터용 매우 작은 크기 (최대 100px)
        const maxSize = 100;
        let { width, height } = img;
        
        if (width > height) {
            if (width > maxSize) {
                height = (height * maxSize) / width;
                width = maxSize;
            }
        } else {
            if (height > maxSize) {
                width = (width * maxSize) / height;
                height = maxSize;
            }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress heavily
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to very low quality JPEG for indicators
        const lowResImageUrl = canvas.toDataURL('image/jpeg', 0.3);
        callback(lowResImageUrl);
    };
    
    img.onerror = function() {
        // 에러 시 원본 이미지 사용
        callback(originalImageUrl);
    };
    
    img.src = originalImageUrl;
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