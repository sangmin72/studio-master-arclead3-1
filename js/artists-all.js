$(document).ready(function() {
    loadAllArtists();
    
    // Resize handler to adjust grid when window size changes
    $(window).resize(function() {
        adjustGridSize();
    });
});

async function loadAllArtists() {
    try {
        const response = await fetch('/admin/api/artists');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Response is not JSON');
        }
        
        const artists = await response.json();
        console.log('Loaded artists:', artists);
        
        if (artists && artists.length > 0) {
            displayArtistsGrid(artists);
        } else {
            displayNoArtists();
        }
    } catch (error) {
        console.error('Error loading artists:', error);
        displayErrorMessage();
    }
}

function displayArtistsGrid(artists) {
    const gridContainer = $('#artistsGrid');
    gridContainer.empty();
    
    // Filter artists that have artistsBannerIndices
    const artistsWithBanners = artists.filter(artist => 
        artist.artistsBannerIndices && 
        artist.artistsBannerIndices.length > 0 && 
        artist.images && 
        artist.images.length > 0
    );
    
    if (artistsWithBanners.length === 0) {
        displayNoArtists();
        return;
    }
    
    // Calculate grid dimensions
    const gridDimensions = calculateGridDimensions(artistsWithBanners.length);
    
    artistsWithBanners.forEach((artist, index) => {
        const bannerIndex = artist.artistsBannerIndices[0]; // Use first banner image
        const bannerImage = artist.images[bannerIndex];
        
        if (bannerImage) {
            const artistItem = createArtistItem(artist, bannerImage, gridDimensions);
            gridContainer.append(artistItem);
        }
    });
    
    // Apply grid layout
    applyGridLayout(gridDimensions);
}

function calculateGridDimensions(artistCount) {
    const viewportWidth = $(window).width();
    const viewportHeight = $(window).height();
    const headerHeight = $('.header-area').outerHeight() || 80;
    const availableHeight = viewportHeight - headerHeight - 40; // 40px for padding
    const availableWidth = viewportWidth - 120; // Account for sidebar
    
    // Calculate optimal grid dimensions
    let cols, rows;
    
    if (artistCount <= 4) {
        cols = Math.min(artistCount, 2);
        rows = Math.ceil(artistCount / cols);
    } else if (artistCount <= 9) {
        cols = 3;
        rows = Math.ceil(artistCount / cols);
    } else if (artistCount <= 16) {
        cols = 4;
        rows = Math.ceil(artistCount / cols);
    } else {
        cols = 5;
        rows = Math.ceil(artistCount / cols);
    }
    
    // Calculate item dimensions
    const itemWidth = Math.floor(availableWidth / cols) - 20; // 20px for margins
    const itemHeight = Math.floor(availableHeight / rows) - 40; // 40px for name tag and margins
    
    return {
        cols: cols,
        rows: rows,
        itemWidth: itemWidth,
        itemHeight: itemHeight,
        availableWidth: availableWidth,
        availableHeight: availableHeight
    };
}

function createArtistItem(artist, bannerImage, gridDimensions) {
    const artistName = artist.koreanName || artist.englishName || 'Unknown';
    const imageUrl = `/images/${artist.englishName}/${bannerImage}`;
    
    return `
        <div class="artist-item" data-artist-id="${artist.englishName}">
            <div class="artist-name-tag">${artistName}</div>
            <div class="artist-image-container">
                <img src="${imageUrl}" alt="${artistName}" class="artist-banner-image">
            </div>
        </div>
    `;
}

function applyGridLayout(dimensions) {
    const gridContainer = $('#artistsGrid');
    
    // Set grid container styles
    gridContainer.css({
        'display': 'grid',
        'grid-template-columns': `repeat(${dimensions.cols}, 1fr)`,
        'grid-template-rows': `repeat(${dimensions.rows}, 1fr)`,
        'gap': '20px',
        'padding': '20px',
        'height': `${dimensions.availableHeight}px`,
        'width': '100%',
        'box-sizing': 'border-box'
    });
    
    // Set individual item styles
    $('.artist-item').each(function() {
        $(this).css({
            'position': 'relative',
            'width': '100%',
            'height': '100%',
            'display': 'flex',
            'flex-direction': 'column',
            'cursor': 'pointer'
        });
        
        // Add click handler to navigate to artist profile
        $(this).click(function() {
            const artistId = $(this).data('artist-id');
            window.location.href = `artist.html?artist=${encodeURIComponent(artistId)}`;
        });
    });
    
    // Style name tags
    $('.artist-name-tag').css({
        'position': 'absolute',
        'top': '-30px',
        'left': '0',
        'right': '0',
        'background': 'rgba(0, 0, 0, 0.8)',
        'color': 'white',
        'padding': '5px 10px',
        'font-size': '14px',
        'font-weight': 'bold',
        'text-align': 'center',
        'border-radius': '5px',
        'z-index': '10'
    });
    
    // Style image containers
    $('.artist-image-container').css({
        'width': '100%',
        'height': '100%',
        'overflow': 'hidden',
        'border-radius': '10px',
        'box-shadow': '0 4px 15px rgba(0, 0, 0, 0.2)',
        'transition': 'transform 0.3s ease, box-shadow 0.3s ease'
    });
    
    // Style images
    $('.artist-banner-image').css({
        'width': '100%',
        'height': '100%',
        'object-fit': 'cover',
        'transition': 'transform 0.3s ease'
    });
    
    // Add hover effects
    $('.artist-item').hover(
        function() {
            $(this).find('.artist-image-container').css({
                'transform': 'scale(1.05)',
                'box-shadow': '0 8px 25px rgba(0, 0, 0, 0.3)'
            });
            $(this).find('.artist-banner-image').css('transform', 'scale(1.1)');
        },
        function() {
            $(this).find('.artist-image-container').css({
                'transform': 'scale(1)',
                'box-shadow': '0 4px 15px rgba(0, 0, 0, 0.2)'
            });
            $(this).find('.artist-banner-image').css('transform', 'scale(1)');
        }
    );
}

function adjustGridSize() {
    // Reload and recalculate grid when window is resized
    setTimeout(function() {
        loadAllArtists();
    }, 100);
}

function displayNoArtists() {
    const gridContainer = $('#artistsGrid');
    gridContainer.html(`
        <div class="no-artists-message">
            <h3>등록된 아티스트가 없습니다.</h3>
            <p>관리자 페이지에서 아티스트를 등록해주세요.</p>
        </div>
    `);
    
    // Style no artists message
    $('.no-artists-message').css({
        'text-align': 'center',
        'padding': '50px',
        'color': '#666',
        'font-family': 'Arial, sans-serif'
    });
}

function displayErrorMessage() {
    const gridContainer = $('#artistsGrid');
    gridContainer.html(`
        <div class="error-message">
            <h3>데이터를 불러오는 중 오류가 발생했습니다.</h3>
            <p>잠시 후 다시 시도해주세요.</p>
        </div>
    `);
    
    // Style error message
    $('.error-message').css({
        'text-align': 'center',
        'padding': '50px',
        'color': '#d32f2f',
        'font-family': 'Arial, sans-serif'
    });
} 