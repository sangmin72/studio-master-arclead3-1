document.addEventListener('DOMContentLoaded', () => {
    const artistForm = document.getElementById('artist-form');
    const artistListContainer = document.getElementById('artist-list-container');
    const artistImagesInput = document.getElementById('artist-images');
    const imagePreviewContainer = document.getElementById('image-preview-container');
    const imagePreviewGrid = document.getElementById('image-preview-grid');

    const API_BASE_URL = '/admin/api';
    let selectedBannerIndex = 0; // Index of selected banner image

    /**
     * Handles image file selection and shows preview
     */
    function handleImageSelection() {
        const files = artistImagesInput.files;
        if (files.length === 0) {
            imagePreviewContainer.style.display = 'none';
            return;
        }

        imagePreviewContainer.style.display = 'block';
        imagePreviewGrid.innerHTML = '';
        selectedBannerIndex = 0; // Reset to first image

        Array.from(files).forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const col = document.createElement('div');
                col.className = 'col-md-3 col-sm-4 col-6 mb-3';
                
                const isSelected = index === selectedBannerIndex;
                col.innerHTML = `
                    <div class="image-preview-item ${isSelected ? 'selected' : ''}" data-index="${index}">
                        <img src="${e.target.result}" class="img-fluid rounded" alt="Preview">
                        <div class="banner-selection mt-2">
                            <input type="radio" name="banner-image" value="${index}" ${isSelected ? 'checked' : ''} id="banner-${index}">
                            <label for="banner-${index}" class="form-check-label">Banner Image</label>
                        </div>
                    </div>
                `;
                
                imagePreviewGrid.appendChild(col);
            };
            reader.readAsDataURL(file);
        });
    }

    /**
     * Handles banner image selection
     */
    function handleBannerSelection(event) {
        if (event.target.name === 'banner-image') {
            selectedBannerIndex = parseInt(event.target.value);
            
            // Update visual selection
            document.querySelectorAll('.image-preview-item').forEach(item => {
                item.classList.remove('selected');
            });
            event.target.closest('.image-preview-item').classList.add('selected');
        }
    }

    /**
     * Fetches all artists and renders them on the page.
     */
    async function loadArtists() {
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
            renderArtists(artists);
        } catch (error) {
            console.error('Error loading artists:', error);
            artistListContainer.innerHTML = '<p>Error loading artists. Please check the console for details.</p>';
        }
    }

    /**
     * Renders a list of artists into the container.
     * @param {Array<Object>} artists - The array of artist objects.
     */
    function renderArtists(artists) {
        if (!artists || artists.length === 0) {
            artistListContainer.innerHTML = '<p>No artists found.</p>';
            return;
        }

        artistListContainer.innerHTML = ''; // Clear existing content
        artists.forEach(artist => {
            const artistElement = document.createElement('div');
            artistElement.className = 'artist-item mb-4 p-3 border rounded';
            artistElement.setAttribute('data-id', artist.id);

            let imagesHTML = '<p>No images.</p>';
            let bannerImageHTML = '';
            if (artist.images && artist.images.length > 0) {
                imagesHTML = artist.images.map((imgUrl, index) => {
                    const isBanner = index === (artist.bannerImageIndex || 0);
                    const bannerBadge = isBanner ? '<span class="badge badge-primary">Banner</span>' : '';
                    return `
                        <div class="image-item-admin" style="display: inline-block; margin-right: 10px; margin-bottom: 10px; text-align: center;">
                            <img src="${imgUrl}" alt="${artist.name}" class="img-thumbnail" width="100">
                            <div>${bannerBadge}</div>
                        </div>
                    `;
                }).join('');
                
                // Show banner image separately
                const bannerIndex = artist.bannerImageIndex || 0;
                if (artist.images[bannerIndex]) {
                    bannerImageHTML = `
                        <div class="banner-image-preview mb-3">
                            <h6>Banner Image:</h6>
                            <img src="${artist.images[bannerIndex]}" alt="${artist.name} Banner" class="img-fluid rounded" style="max-width: 200px;">
                        </div>
                    `;
                }
            }

            artistElement.innerHTML = `
                <h5>${artist.name}</h5>
                <p>${artist.bio || 'No bio provided.'}</p>
                ${bannerImageHTML}
                <div class="all-images">
                    <h6>All Images:</h6>
                    <div class="d-flex flex-wrap">
                        ${imagesHTML}
                    </div>
                </div>
                <button class="btn btn-danger btn-sm mt-3 delete-artist-btn">Delete</button>
            `;
            artistListContainer.appendChild(artistElement);
        });
    }

    /**
     * Handles the artist form submission.
     * @param {Event} event - The form submission event.
     */
    async function handleFormSubmit(event) {
        event.preventDefault();

        const artistNameInput = document.getElementById('artist-name');
        const artistBioInput = document.getElementById('artist-bio');
        const artistImagesInput = document.getElementById('artist-images');
        
        if (artistImagesInput.files.length === 0) {
            alert('Please select at least one image.');
            return;
        }
        
        const formData = new FormData();
        formData.append('name', artistNameInput.value);
        formData.append('bio', artistBioInput.value);
        formData.append('bannerImageIndex', selectedBannerIndex.toString());
        
        for (const file of artistImagesInput.files) {
            formData.append('images', file);
        }

        try {
            const response = await fetch(`${API_BASE_URL}/artists`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                let errorMessage = 'Failed to save artist.';
                try {
                    const contentType = response.headers.get('content-type');
                    if (contentType && contentType.includes('application/json')) {
                        const errorData = await response.json();
                        errorMessage = errorData.error || errorMessage;
                    } else {
                        const textResponse = await response.text();
                        errorMessage = `Server error: ${textResponse.substring(0, 100)}...`;
                    }
                } catch (parseError) {
                    errorMessage = `Server error (${response.status}): ${response.statusText}`;
                }
                throw new Error(errorMessage);
            }

            // Clear the form and reload the artists
            artistForm.reset();
            imagePreviewContainer.style.display = 'none';
            selectedBannerIndex = 0;
            loadArtists();

        } catch (error) {
            console.error('Error submitting form:', error);
            alert(`Error: ${error.message}`);
        }
    }

    /**
     * Handles clicks on the artist list container, specifically for delete buttons.
     * @param {Event} event - The click event.
     */
    async function handleArtistListClick(event) {
        if (event.target.classList.contains('delete-artist-btn')) {
            const artistItem = event.target.closest('.artist-item');
            const artistId = artistItem.getAttribute('data-id');

            if (confirm(`Are you sure you want to delete this artist?`)) {
                try {
                    const response = await fetch(`${API_BASE_URL}/artists/${artistId}`, {
                        method: 'DELETE',
                    });

                    if (!response.ok) {
                        let errorMessage = 'Failed to delete artist.';
                        try {
                            const contentType = response.headers.get('content-type');
                            if (contentType && contentType.includes('application/json')) {
                                const errorData = await response.json();
                                errorMessage = errorData.error || errorMessage;
                            } else {
                                const textResponse = await response.text();
                                errorMessage = `Server error: ${textResponse.substring(0, 100)}...`;
                            }
                        } catch (parseError) {
                            errorMessage = `Server error (${response.status}): ${response.statusText}`;
                        }
                        throw new Error(errorMessage);
                    }
                    
                    // Remove from UI
                    artistItem.remove();

                } catch (error) {
                    console.error('Error deleting artist:', error);
                    alert(`Error: ${error.message}`);
                }
            }
        }
    }


    // Add event listeners
    artistForm.addEventListener('submit', handleFormSubmit);
    artistListContainer.addEventListener('click', handleArtistListClick);
    artistImagesInput.addEventListener('change', handleImageSelection);
    imagePreviewGrid.addEventListener('change', handleBannerSelection);

    // Initial load
    loadArtists();
}); 