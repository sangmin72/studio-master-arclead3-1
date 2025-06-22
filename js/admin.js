document.addEventListener('DOMContentLoaded', () => {
    const artistForm = document.getElementById('artist-form');
    const artistListContainer = document.getElementById('artist-list-container');

    const API_BASE_URL = '/admin/api';

    /**
     * Fetches all artists and renders them on the page.
     */
    async function loadArtists() {
        try {
            const response = await fetch(`${API_BASE_URL}/artists`);
            if (!response.ok) {
                throw new Error(`Failed to fetch artists: ${response.statusText}`);
            }
            const artists = await response.json();
            renderArtists(artists);
        } catch (error) {
            console.error('Error loading artists:', error);
            artistListContainer.innerHTML = '<p>Error loading artists. Please try again later.</p>';
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
            if (artist.images && artist.images.length > 0) {
                imagesHTML = artist.images.map(imgUrl => 
                    `<img src="${imgUrl}" alt="${artist.name}" class="img-thumbnail" width="100" style="margin-right: 5px;">`
                ).join('');
            }

            artistElement.innerHTML = `
                <h5>${artist.name}</h5>
                <p>${artist.bio || 'No bio provided.'}</p>
                <div class="d-flex flex-wrap">
                    ${imagesHTML}
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
        
        const formData = new FormData();
        formData.append('name', artistNameInput.value);
        formData.append('bio', artistBioInput.value);
        
        for (const file of artistImagesInput.files) {
            formData.append('images', file);
        }

        try {
            const response = await fetch(`${API_BASE_URL}/artists`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save artist.');
            }

            // Clear the form and reload the artists
            artistForm.reset();
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
                        const errorData = await response.json();
                        throw new Error(errorData.error || 'Failed to delete artist.');
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

    // Initial load
    loadArtists();
}); 