(function ($) {
    'use strict';

    const API_BASE_URL = '/admin/api';

    $(document).ready(function() {
        loadArtistProfile();
    });

    /**
     * Get artist ID from URL parameters
     */
    function getArtistIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id');
    }

    /**
     * Load artist profile data
     */
    async function loadArtistProfile() {
        const artistId = getArtistIdFromUrl();
        
        if (!artistId) {
            showError('No artist ID provided in URL');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/artists`);
            if (!response.ok) {
                throw new Error(`Failed to fetch artists: ${response.statusText}`);
            }
            
            // Check if response is JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('Server returned non-JSON response');
            }
            
            const artists = await response.json();
            const artist = artists.find(a => a.id === artistId);
            
            if (!artist) {
                showError(`Artist with ID "${artistId}" not found`);
                return;
            }

            displayArtistProfile(artist);

        } catch (error) {
            console.error('Error loading artist profile:', error);
            showError(`Error loading artist profile: ${error.message}`);
        }
    }

    /**
     * Display artist profile information
     */
    function displayArtistProfile(artist) {
        console.log('Displaying artist profile:', artist);

        // Update page title
        document.title = `Studio - ${artist.name}`;

        // Display basic information
        $('#artist-name').text(artist.name || 'Unknown Artist');
        $('#artist-short-intro').text(artist.shortIntro || 'No introduction available.');

        // Display images slideshow
        displayImageSlideshow(artist);

        // Display career information
        displayCareerInformation(artist);
    }

    /**
     * Display image slideshow
     */
    function displayImageSlideshow(artist) {
        const $carouselInner = $('#artist-carousel-inner');
        const $carouselIndicators = $('#artist-carousel-indicators');
        
        if (!artist.images || artist.images.length === 0) {
            $carouselInner.html(`
                <div class="carousel-item active h-100">
                    <div class="d-flex align-items-center justify-content-center h-100" style="background-color: #f8f9fa;">
                        <div class="text-center">
                            <i class="fa fa-image fa-3x text-muted mb-3"></i>
                            <p class="text-muted">No images available for this artist</p>
                        </div>
                    </div>
                </div>
            `);
            $carouselIndicators.empty();
            return;
        }

        // Clear existing content
        $carouselInner.empty();
        $carouselIndicators.empty();

        // Create carousel items
        artist.images.forEach((imageUrl, index) => {
            const activeClass = index === 0 ? 'active' : '';
            
            // Create carousel item
            const carouselItem = `
                <div class="carousel-item ${activeClass} h-100">
                    <img src="${imageUrl}" alt="${artist.name} - Image ${index + 1}" class="d-block">
                </div>
            `;
            $carouselInner.append(carouselItem);

            // Create indicator
            const indicator = `
                <li data-target="#artistSlider" data-slide-to="${index}" class="${activeClass}"></li>
            `;
            $carouselIndicators.append(indicator);
        });

        // Reinitialize carousel
        $('#artistSlider').carousel('dispose');
        $('#artistSlider').carousel({
            interval: 4000,
            pause: 'hover'
        });

        console.log(`Slideshow initialized with ${artist.images.length} images`);
    }

    /**
     * Display career information
     */
    function displayCareerInformation(artist) {
        const $careerContent = $('#career-content');
        
        if (!artist.career || Object.keys(artist.career).length === 0) {
            $careerContent.html(`
                <div class="text-center text-muted">
                    <i class="fa fa-info-circle fa-2x mb-3"></i>
                    <p>No career information available for this artist</p>
                </div>
            `);
            return;
        }

        let careerHtml = '';
        const categoryNames = {
            drama: '드라마 (Drama)',
            webdrama: '웹드라마 (Web Drama)',
            movie: '영화 (Movie)',
            commercial: '광고 (Commercial)'
        };

        // Process each career category
        Object.keys(artist.career).forEach(category => {
            const categoryData = artist.career[category];
            
            if (categoryData && categoryData.length > 0) {
                careerHtml += `
                    <div class="career-category">
                        <h4 class="career-category-title">${categoryNames[category] || category}</h4>
                `;

                // Sort by year (descending)
                const sortedYears = categoryData.sort((a, b) => b.year - a.year);

                sortedYears.forEach(yearData => {
                    if (yearData.works && yearData.works.length > 0) {
                        careerHtml += `
                            <div class="career-year-group">
                                <div class="career-year">${yearData.year}년</div>
                                <ul class="career-works">
                        `;

                        yearData.works.forEach(work => {
                            careerHtml += `<li>${work}</li>`;
                        });

                        careerHtml += `
                                </ul>
                            </div>
                        `;
                    }
                });

                careerHtml += `</div>`;
            }
        });

        if (careerHtml === '') {
            $careerContent.html(`
                <div class="text-center text-muted">
                    <i class="fa fa-info-circle fa-2x mb-3"></i>
                    <p>No career information available for this artist</p>
                </div>
            `);
        } else {
            $careerContent.html(careerHtml);
        }

        console.log('Career information displayed');
    }

    /**
     * Show error message
     */
    function showError(message) {
        console.error('Artist Profile Error:', message);
        
        // Update basic info with error
        $('#artist-name').text('Error');
        $('#artist-short-intro').text(message);

        // Show error in slideshow
        $('#artist-carousel-inner').html(`
            <div class="carousel-item active h-100">
                <div class="d-flex align-items-center justify-content-center h-100" style="background-color: #f8f9fa;">
                    <div class="text-center">
                        <i class="fa fa-exclamation-triangle fa-3x text-danger mb-3"></i>
                        <p class="text-danger">${message}</p>
                        <a href="portfolio.html" class="btn btn-primary mt-3">Back to Portfolio</a>
                    </div>
                </div>
            </div>
        `);

        // Show error in career section
        $('#career-content').html(`
            <div class="text-center text-muted">
                <i class="fa fa-exclamation-triangle fa-2x text-danger mb-3"></i>
                <p class="text-danger">Unable to load career information</p>
            </div>
        `);

        // Clear indicators
        $('#artist-carousel-indicators').empty();
    }

})(jQuery); 