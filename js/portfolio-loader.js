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
            
            // Check if response is JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('Server returned non-JSON response');
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

        // Populate filter buttons
        $portfolioMenu.append('<button class="active btn" type="button" data-filter="*">All</button>');
        artists.forEach(artist => {
            if (artist.images && artist.images.length > 0) {
                // Use artist ID for reliable filtering
                const filterClass = `artist-${artist.id}`;
                $portfolioMenu.append(`<button class="btn" type="button" data-filter=".${filterClass}">${artist.name}</button>`);
                console.log(`Added filter button for ${artist.name} with class: ${filterClass}`);
            }
        });

        // Populate gallery items
        let galleryItemsHTML = '';
        artists.forEach(artist => {
            if (artist.images && artist.images.length > 0) {
                // Use artist ID for reliable filtering
                const filterClass = `artist-${artist.id}`;
                artist.images.forEach(imageUrl => {
                    galleryItemsHTML += `
                        <div class="col-12 col-sm-6 col-md-4 col-lg-3 column_single_gallery_item ${filterClass}" data-artist-id="${artist.id}" data-artist-name="${artist.name}">
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

        // Simple JavaScript-based filtering (as primary method)
        function simpleFilter(filterValue) {
            console.log('Simple filter:', filterValue);
            const allItems = $portfolioColumn.find('.column_single_gallery_item');
            
            if (filterValue === '*') {
                // Show all items
                allItems.removeClass('hidden').show();
                console.log('Showing all', allItems.length, 'items');
            } else {
                // Hide all first
                allItems.addClass('hidden').hide();
                
                // Show matching items
                const matchingItems = $portfolioColumn.find(filterValue);
                matchingItems.removeClass('hidden').show();
                
                console.log('Showing', matchingItems.length, 'items for filter:', filterValue);
                
                if (matchingItems.length === 0) {
                    console.warn('No items found for filter:', filterValue);
                    console.log('Available items:');
                    allItems.each(function(index) {
                        console.log(`Item ${index}:`, $(this).attr('class'));
                    });
                }
            }
        }

        // Set up simple click handlers first (primary method)
        $portfolioMenu.off('click', 'button');
        $portfolioMenu.on('click', 'button', function(e) {
            e.preventDefault();
            
            const $button = $(this);
            const filterValue = $button.attr('data-filter');
            
            console.log('=== SIMPLE FILTER ===');
            console.log('Button:', $button.text());
            console.log('Filter:', filterValue);
            
            // Apply simple filter
            simpleFilter(filterValue);
            
            // Update active state
            $portfolioMenu.find('.active').removeClass('active');
            $button.addClass('active');
            
            console.log('=== FILTER COMPLETE ===');
        });

        // 2. Re-initialize Isotope (Masonry Layout)
        if ($.fn.imagesLoaded && $.fn.isotope) {
            $portfolioColumn.imagesLoaded(function () {
                console.log('Images loaded, initializing Isotope...');
                
                // Init Isotope
                const $grid = $portfolioColumn.isotope({
                    itemSelector: '.column_single_gallery_item',
                    percentPosition: true,
                    masonry: {
                        columnWidth: '.column_single_gallery_item'
                    }
                });

                console.log('Isotope initialized with', $portfolioColumn.find('.column_single_gallery_item').length, 'items');
                
                // Log all items and their classes
                $portfolioColumn.find('.column_single_gallery_item').each(function(index) {
                    console.log(`Item ${index} classes:`, $(this).attr('class'));
                });

                // Remove any existing click handlers to prevent duplicates
                $portfolioMenu.off('click', 'button');
                
                // Filter items on button click
                $portfolioMenu.on('click', 'button', function (e) {
                    e.preventDefault();
                    
                    const $button = $(this);
                    const filterValue = $button.attr('data-filter');
                    
                    console.log('=== FILTER CLICKED ===');
                    console.log('Button text:', $button.text());
                    console.log('Filter value:', filterValue);
                    console.log('Total items:', $portfolioColumn.find('.column_single_gallery_item').length);
                    
                    if (filterValue === '*') {
                        console.log('Showing all items');
                        // Show all items manually
                        $portfolioColumn.find('.column_single_gallery_item').show();
                    } else {
                        console.log('Looking for items with class:', filterValue);
                        const matchingItems = $portfolioColumn.find(filterValue);
                        console.log('Found matching items:', matchingItems.length);
                        
                        if (matchingItems.length === 0) {
                            console.error('No matching items found! Available classes:');
                            $portfolioColumn.find('.column_single_gallery_item').each(function(index) {
                                console.log(`Item ${index}:`, $(this).attr('class'));
                            });
                        }
                        
                        // Manual show/hide as fallback
                        $portfolioColumn.find('.column_single_gallery_item').hide();
                        matchingItems.show();
                    }
                    
                    // Apply Isotope filter
                    try {
                        $grid.isotope({
                            filter: filterValue
                        });
                        console.log('Isotope filter applied successfully');
                    } catch (error) {
                        console.error('Isotope filter error:', error);
                    }
                    
                    // Update active class
                    $portfolioMenu.find('.active').removeClass('active');
                    $button.addClass('active');
                    
                    // Force layout after a short delay
                    setTimeout(() => {
                        try {
                            $grid.isotope('layout');
                            console.log('Isotope layout refreshed');
                        } catch (error) {
                            console.error('Isotope layout error:', error);
                        }
                    }, 200);
                    
                    console.log('=== FILTER END ===');
                });
            });
        } else {
            console.error('Isotope or imagesLoaded not available');
            
            // Fallback: Simple show/hide without Isotope
            $portfolioMenu.off('click', 'button');
            $portfolioMenu.on('click', 'button', function (e) {
                e.preventDefault();
                
                const $button = $(this);
                const filterValue = $button.attr('data-filter');
                
                console.log('Fallback filtering by:', filterValue);
                
                if (filterValue === '*') {
                    $portfolioColumn.find('.column_single_gallery_item').show();
                } else {
                    $portfolioColumn.find('.column_single_gallery_item').hide();
                    $portfolioColumn.find(filterValue).show();
                }
                
                $portfolioMenu.find('.active').removeClass('active');
                $button.addClass('active');
            });
        }
    }

    // Wait for the entire page to load, then fetch and build the portfolio
    $window.on('load', function () {
        // We run this on load to ensure all other scripts (like plugins) are ready.
        loadPortfolio();
    });

})(jQuery); 