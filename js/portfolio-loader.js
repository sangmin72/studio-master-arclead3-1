// js/portfolio-loader.js

(function ($) {
    'use strict';

    const $window = $(window);
    const API_BASE_URL = '/admin/api';

    async function loadPortfolio() {
        try {
            const response = await fetch(`${API_BASE_URL}/artists`);
            if (!response.ok) {
                throw new Error(`Failed to fetch artists: ${response.statusText}`);
            }
            const artists = await response.json();
            
            populatePortfolio(artists);

        } catch (error) {
            console.error('Error loading portfolio:', error);
            $('.portfolio-column').html('<p>Error loading portfolio data.</p>');
        }
    }

    function populatePortfolio(artists) {
        const $portfolioMenu = $('.portfolio-menu');
        const $portfolioColumn = $('.portfolio-column');

        if (!artists || artists.length === 0) {
            $portfolioColumn.html('<p>No works found.</p>');
            return;
        }

        // Clear existing items
        $portfolioMenu.empty();
        $portfolioColumn.empty();

        // Function to create safe CSS class names
        function createSafeClassName(name) {
            return 'artist-' + name.toLowerCase()
                .replace(/\s+/g, '-')           // Replace spaces with hyphens
                .replace(/[^a-z0-9\-가-힣]/g, '') // Allow Korean characters, remove others
                .replace(/--+/g, '-')           // Replace multiple hyphens with single
                .replace(/^-|-$/g, '');         // Remove leading/trailing hyphens
        }

        // Populate filter buttons
        $portfolioMenu.append('<button class="active btn" type="button" data-filter="*">All</button>');
        artists.forEach(artist => {
            if (artist.images && artist.images.length > 0) {
                const filterClass = createSafeClassName(artist.name);
                $portfolioMenu.append(`<button class="btn" type="button" data-filter=".${filterClass}">${artist.name}</button>`);
                console.log(`Added filter button for ${artist.name} with class: ${filterClass}`);
            }
        });

        // Populate gallery items
        let galleryItemsHTML = '';
        artists.forEach(artist => {
            if (artist.images && artist.images.length > 0) {
                const filterClass = createSafeClassName(artist.name);
                artist.images.forEach(imageUrl => {
                    galleryItemsHTML += `
                        <div class="col-12 col-sm-6 col-md-4 col-lg-3 column_single_gallery_item ${filterClass}">
                            <img src="${imageUrl}" alt="${artist.name}">
                            <div class="hover_overlay">
                                <a class="gallery_img" href="${imageUrl}"><i class="fa fa-eye"></i></a>
                            </div>
                        </div>
                    `;
                });
                console.log(`Added ${artist.images.length} images for ${artist.name} with class: ${filterClass}`);
            }
        });
        $portfolioColumn.html(galleryItemsHTML);

        // -- Re-initialize plugins after populating the gallery --

        // 1. Re-initialize Magnific Popup for the new gallery items
        if ($.fn.magnificPopup) {
            $('.gallery_img').magnificPopup({
                type: 'image',
                removalDelay: 300,
                mainClass: 'mfp-fade',
                gallery: {
                    enabled: true,
                    preload: [0, 2],
                    navigateByImgClick: true,
                    arrowMarkup: '<button title="%title%" type="button" class="mfp-arrow mfp-arrow-%dir%"></button>',
                    tPrev: 'Previous (Left arrow key)',
                    tNext: 'Next (Right arrow key)',
                    tCounter: '<span class="mfp-counter">%curr% of %total%</span>'
                }
            });
        }

        // 2. Re-initialize Isotope (Masonry Layout)
        if ($.fn.imagesLoaded && $.fn.isotope) {
            $portfolioColumn.imagesLoaded(function () {
                // Init Isotope
                const $grid = $portfolioColumn.isotope({
                    itemSelector: '.column_single_gallery_item',
                    percentPosition: true,
                    masonry: {
                        columnWidth: '.column_single_gallery_item'
                    }
                });

                // Remove any existing click handlers to prevent duplicates
                $portfolioMenu.off('click', 'button');
                
                // Filter items on button click
                $portfolioMenu.on('click', 'button', function () {
                    const filterValue = $(this).attr('data-filter');
                    console.log('Filtering by:', filterValue); // Debug log
                    
                    $grid.isotope({
                        filter: filterValue
                    });
                    
                    // Update active class
                    $portfolioMenu.find('.active').removeClass('active');
                    $(this).addClass('active');
                });
                
                console.log('Isotope initialized with', $portfolioColumn.find('.column_single_gallery_item').length, 'items');
            });
        }
    }

    // Wait for the entire page to load, then fetch and build the portfolio
    $window.on('load', function () {
        // We run this on load to ensure all other scripts (like plugins) are ready.
        loadPortfolio();
    });

})(jQuery); 