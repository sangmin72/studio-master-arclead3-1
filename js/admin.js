document.addEventListener('DOMContentLoaded', () => {
    const artistForm = document.getElementById('artist-form');
    const artistListContainer = document.getElementById('artist-list-container');
    
    // New form elements
    const artistEnglishNameInput = document.getElementById('artist-english-name');
    const artistNameInput = document.getElementById('artist-name');
    const artistShortIntroInput = document.getElementById('artist-short-intro');
    const artistImagesInput = document.getElementById('artist-images');
    const imagePreviewContainer = document.getElementById('image-preview-container');
    const imagePreviewGrid = document.getElementById('image-preview-grid');
    const homeBannerSelection = document.getElementById('home-banner-selection');
    const artistsBannerSelection = document.getElementById('artists-banner-selection');

    const API_BASE_URL = '/admin/api';
    
    // Career management
    let careerData = {
        drama: {},
        webdrama: {},
        movie: {},
        commercial: {}
    };

    // Image management
    let selectedHomeBannerIndex = 0;
    let selectedArtistsBannerIndex = 0;
    let uploadedImages = [];

    /**
     * Career management functions
     */
    function addCareerYear(category) {
        const container = document.getElementById(`${category}-career`);
        const yearId = `${category}-${Date.now()}`;
        
        const yearItem = document.createElement('div');
        yearItem.className = 'career-year-item';
        yearItem.setAttribute('data-year-id', yearId);
        
        yearItem.innerHTML = `
            <div class="career-year-header">
                <input type="number" class="form-control career-year-input" placeholder="연도" min="1900" max="2100" 
                       onchange="updateCareerYear('${category}', '${yearId}', this.value)">
                <button type="button" class="btn btn-sm btn-remove" onclick="removeCareerYear('${category}', '${yearId}')">연도 삭제</button>
            </div>
            <div class="career-works" id="${yearId}-works">
                <!-- 작품들이 여기에 추가됨 -->
            </div>
            <button type="button" class="btn btn-sm btn-outline-secondary add-work-btn" 
                    onclick="addCareerWork('${category}', '${yearId}')">+ 작품 추가</button>
        `;
        
        container.appendChild(yearItem);
        
        // Initialize career data for this year
        if (!careerData[category]) careerData[category] = {};
        careerData[category][yearId] = { year: '', works: [] };
    }

    function removeCareerYear(category, yearId) {
        const yearItem = document.querySelector(`[data-year-id="${yearId}"]`);
        if (yearItem) {
            yearItem.remove();
            delete careerData[category][yearId];
        }
    }

    function updateCareerYear(category, yearId, year) {
        if (!careerData[category]) careerData[category] = {};
        if (!careerData[category][yearId]) careerData[category][yearId] = { year: '', works: [] };
        careerData[category][yearId].year = year;
    }

    function addCareerWork(category, yearId) {
        const worksContainer = document.getElementById(`${yearId}-works`);
        const workId = `work-${Date.now()}`;
        
        const workItem = document.createElement('div');
        workItem.className = 'career-work-item';
        workItem.setAttribute('data-work-id', workId);
        
        workItem.innerHTML = `
            <input type="text" class="form-control career-work-input" placeholder="작품명" 
                   onchange="updateCareerWork('${category}', '${yearId}', '${workId}', this.value)">
            <button type="button" class="btn btn-sm btn-remove" onclick="removeCareerWork('${category}', '${yearId}', '${workId}')">삭제</button>
        `;
        
        worksContainer.appendChild(workItem);
        
        // Initialize work data
        if (!careerData[category][yearId].works) careerData[category][yearId].works = [];
        careerData[category][yearId].works.push({ id: workId, name: '' });
    }

    function removeCareerWork(category, yearId, workId) {
        const workItem = document.querySelector(`[data-work-id="${workId}"]`);
        if (workItem) {
            workItem.remove();
            // Remove from data
            if (careerData[category] && careerData[category][yearId]) {
                careerData[category][yearId].works = careerData[category][yearId].works.filter(work => work.id !== workId);
            }
        }
    }

    function updateCareerWork(category, yearId, workId, workName) {
        if (!careerData[category]) careerData[category] = {};
        if (!careerData[category][yearId]) careerData[category][yearId] = { year: '', works: [] };
        
        const work = careerData[category][yearId].works.find(w => w.id === workId);
        if (work) {
            work.name = workName;
        }
    }

    // Make functions global for onclick handlers
    window.addCareerYear = addCareerYear;
    window.removeCareerYear = removeCareerYear;
    window.updateCareerYear = updateCareerYear;
    window.addCareerWork = addCareerWork;
    window.removeCareerWork = removeCareerWork;
    window.updateCareerWork = updateCareerWork;

    /**
     * Image handling functions
     */
    function handleImageSelection() {
        const files = artistImagesInput.files;
        if (files.length === 0) {
            imagePreviewContainer.style.display = 'none';
            uploadedImages = [];
            return;
        }

        uploadedImages = Array.from(files);
        imagePreviewContainer.style.display = 'block';
        
        // Reset selections
        selectedHomeBannerIndex = 0;
        selectedArtistsBannerIndex = 0;

        // Clear previous content
        imagePreviewGrid.innerHTML = '';
        homeBannerSelection.innerHTML = '';
        artistsBannerSelection.innerHTML = '';

        // Process each image
        uploadedImages.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                const imageUrl = e.target.result;
                
                // Add to preview grid
                const col = document.createElement('div');
                col.className = 'col-md-3 col-sm-4 col-6';
                col.innerHTML = `
                    <div class="image-item">
                        <img src="${imageUrl}" alt="Image ${index + 1}">
                        <span class="banner-badge home-banner-badge ${index === selectedHomeBannerIndex ? '' : 'd-none'}" id="home-badge-${index}">HOME</span>
                        <span class="banner-badge artists-banner-badge ${index === selectedArtistsBannerIndex ? '' : 'd-none'}" id="artists-badge-${index}">ARTISTS</span>
                    </div>
                `;
                imagePreviewGrid.appendChild(col);

                // Add to banner selection lists
                const homeBannerItem = document.createElement('div');
                homeBannerItem.className = `banner-selection-item ${index === selectedHomeBannerIndex ? 'selected' : ''}`;
                homeBannerItem.innerHTML = `
                    <input type="radio" name="home-banner" value="${index}" ${index === selectedHomeBannerIndex ? 'checked' : ''}>
                    <img src="${imageUrl}" alt="Image ${index + 1}">
                    <span>Image ${index + 1}</span>
                `;
                homeBannerSelection.appendChild(homeBannerItem);

                const artistsBannerItem = document.createElement('div');
                artistsBannerItem.className = `banner-selection-item ${index === selectedArtistsBannerIndex ? 'selected' : ''}`;
                artistsBannerItem.innerHTML = `
                    <input type="radio" name="artists-banner" value="${index}" ${index === selectedArtistsBannerIndex ? 'checked' : ''}>
                    <img src="${imageUrl}" alt="Image ${index + 1}">
                    <span>Image ${index + 1}</span>
                `;
                artistsBannerSelection.appendChild(artistsBannerItem);
            };
            reader.readAsDataURL(file);
        });
    }

    function updateBannerSelection(bannerType, selectedIndex) {
        if (bannerType === 'home') {
            selectedHomeBannerIndex = selectedIndex;
            // Update badges
            uploadedImages.forEach((_, index) => {
                const badge = document.getElementById(`home-badge-${index}`);
                if (badge) {
                    badge.classList.toggle('d-none', index !== selectedIndex);
                }
            });
            // Update selection items
            homeBannerSelection.querySelectorAll('.banner-selection-item').forEach((item, index) => {
                item.classList.toggle('selected', index === selectedIndex);
            });
        } else if (bannerType === 'artists') {
            selectedArtistsBannerIndex = selectedIndex;
            // Update badges
            uploadedImages.forEach((_, index) => {
                const badge = document.getElementById(`artists-badge-${index}`);
                if (badge) {
                    badge.classList.toggle('d-none', index !== selectedIndex);
                }
            });
            // Update selection items
            artistsBannerSelection.querySelectorAll('.banner-selection-item').forEach((item, index) => {
                item.classList.toggle('selected', index === selectedIndex);
            });
        }
    }

    // Setup image input handler
    artistImagesInput.addEventListener('change', handleImageSelection);

    // Setup banner selection handlers
    document.addEventListener('change', function(e) {
        if (e.target.name === 'home-banner') {
            updateBannerSelection('home', parseInt(e.target.value));
        } else if (e.target.name === 'artists-banner') {
            updateBannerSelection('artists', parseInt(e.target.value));
        }
    });

    // Setup career year addition buttons
    document.querySelectorAll('.add-career-year').forEach(button => {
        button.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            addCareerYear(category);
        });
    });

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

            // Create career summary
            let careerSummary = '';
            if (artist.career) {
                const totalWorks = Object.values(artist.career).reduce((total, categoryWorks) => {
                    return total + (Array.isArray(categoryWorks) ? categoryWorks.reduce((sum, yearData) => sum + yearData.works.length, 0) : 0);
                }, 0);
                careerSummary = `총 ${totalWorks}개 작품`;
            }

            // Create images display
            let imagesHTML = '';
            if (artist.images && artist.images.length > 0) {
                imagesHTML += `
                    <div class="image-section mb-2">
                        <h6>업로드된 이미지들 (${artist.images.length}개):</h6>
                        <div class="d-flex flex-wrap">
                            ${artist.images.map((imgUrl, index) => {
                                let badges = '';
                                if (index === artist.homeBannerIndex) {
                                    badges += '<span class="badge badge-success mr-1">HOME</span>';
                                }
                                if (index === artist.artistsBannerIndex) {
                                    badges += '<span class="badge badge-primary mr-1">ARTISTS</span>';
                                }
                                return `
                                    <div class="image-item-admin mr-2 mb-2" style="position: relative;">
                                        <img src="${imgUrl}" alt="Image ${index + 1}" class="img-thumbnail" style="max-width: 100px;">
                                        <div style="position: absolute; top: 5px; right: 5px;">${badges}</div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                        <small class="text-muted">
                            Home Banner: ${artist.homeBannerIndex + 1}번째 이미지, 
                            Artists Banner: ${artist.artistsBannerIndex + 1}번째 이미지
                        </small>
                    </div>
                `;
            }

            if (!imagesHTML) {
                imagesHTML = '<p class="text-muted">이미지 없음</p>';
            }

            artistElement.innerHTML = `
                <div class="row">
                    <div class="col-md-8">
                        <h5>${artist.name} <small class="text-muted">(${artist.englishName || artist.id})</small></h5>
                        <p><strong>짧은 소개:</strong> ${artist.shortIntro || '소개글 없음'}</p>
                        <p><strong>이력:</strong> ${careerSummary || '이력 없음'}</p>
                        ${imagesHTML}
                    </div>
                    <div class="col-md-4 text-right">
                        <button class="btn btn-danger btn-sm delete-artist-btn">Delete</button>
                    </div>
                </div>
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

        // Validation
        if (!artistEnglishNameInput.value.trim()) {
            alert('영문명을 입력해주세요.');
            return;
        }
        
        if (!artistNameInput.value.trim()) {
            alert('이름을 입력해주세요.');
            return;
        }

        if (uploadedImages.length === 0) {
            alert('최소 1개의 이미지를 업로드해주세요.');
            return;
        }

        // Prepare career data for submission
        const processedCareerData = {};
        Object.keys(careerData).forEach(category => {
            processedCareerData[category] = [];
            Object.values(careerData[category]).forEach(yearData => {
                if (yearData.year && yearData.works && yearData.works.length > 0) {
                    const validWorks = yearData.works.filter(work => work.name.trim());
                    if (validWorks.length > 0) {
                        processedCareerData[category].push({
                            year: parseInt(yearData.year),
                            works: validWorks.map(work => work.name.trim())
                        });
                    }
                }
            });
        });
        
        const formData = new FormData();
        formData.append('englishName', artistEnglishNameInput.value.trim());
        formData.append('name', artistNameInput.value.trim());
        formData.append('shortIntro', artistShortIntroInput.value.trim());
        formData.append('career', JSON.stringify(processedCareerData));
        formData.append('homeBannerIndex', selectedHomeBannerIndex.toString());
        formData.append('artistsBannerIndex', selectedArtistsBannerIndex.toString());
        
        // Add all images
        uploadedImages.forEach(file => {
            formData.append('images', file);
        });

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
            careerData = { drama: {}, webdrama: {}, movie: {}, commercial: {} };
            uploadedImages = [];
            selectedHomeBannerIndex = 0;
            selectedArtistsBannerIndex = 0;
            
            // Clear career sections
            ['drama', 'webdrama', 'movie', 'commercial'].forEach(category => {
                document.getElementById(`${category}-career`).innerHTML = '';
            });
            
            // Clear image previews
            imagePreviewContainer.style.display = 'none';
            imagePreviewGrid.innerHTML = '';
            homeBannerSelection.innerHTML = '';
            artistsBannerSelection.innerHTML = '';
            
            loadArtists();
            alert('아티스트가 성공적으로 저장되었습니다.');

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

    // Initial load
    loadArtists();
}); 