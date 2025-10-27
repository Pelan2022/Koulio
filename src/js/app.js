// URL mapping for lessons
const urlMapping = {
    'uvod': 'lekce0',
    '1': 'lekce1',
    '2': 'lekce2',
    '3': 'lekce3',
    '4': 'lekce4',
    '5': 'lekce5',
    '6': 'lekce6',
    '7': 'lekce7',
    '8': 'lekce8',
    '9': 'lekce9',
    '10': 'lekce10',
    '11': 'lekce11',
    '12': 'lekce12',
    '13': 'lekce13',
    '14': 'lekce14'
};

// Reverse mapping for getting URL from tab name
const reverseMapping = {
    'lekce0': 'uvod',
    'lekce1': '1',
    'lekce2': '2',
    'lekce3': '3',
    'lekce4': '4',
    'lekce5': '5',
    'lekce6': '6',
    'lekce7': '7',
    'lekce8': '8',
    'lekce9': '9',
    'lekce10': '10',
    'lekce11': '11',
    'lekce12': '12',
    'lekce13': '13',
    'lekce14': '14'
};

function showTab(tabName, clickedElement) {
    // Skryj všechny tab obsahy
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => {
        content.classList.remove('active');
    });

    // Odstraň aktivní třídu ze všech tabů
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.classList.remove('active');
    });

    // Zobraz vybraný tab obsah
    document.getElementById(tabName).classList.add('active');

    // Přidej aktivní třídu na vybraný tab
    if (clickedElement) {
        clickedElement.classList.add('active');
    }

    // Update URL without page reload
    const urlPath = reverseMapping[tabName];
    if (urlPath) {
        const newUrl = window.location.origin + (urlPath === 'uvod' ? '' : '/' + urlPath);
        window.history.pushState({ tab: tabName }, '', newUrl);
    }
}

function showTabFromUrl(urlPath) {
    const tabName = urlMapping[urlPath];
    if (tabName) {
        const tabElement = document.querySelector(`button[data-tab="${tabName}"]`);
        showTab(tabName, tabElement);
    } else {
        // Default to intro if no valid path
        const tabElement = document.querySelector(`button[data-tab="lekce0"]`);
        showTab('lekce0', tabElement);
    }
}

// Handle browser back/forward buttons
window.addEventListener('popstate', function(event) {
    const urlPath = window.location.pathname.split('/').pop() || 'uvod';
    showTabFromUrl(urlPath);
});

// Initialize tab from URL on page load
document.addEventListener('DOMContentLoaded', function() {
    // Add event listeners to all tab buttons
    const tabButtons = document.querySelectorAll('.tab');
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            showTab(tabName, this);
        });
    });

    // Add delegated event listeners for all buttons with onclick handlers
    document.addEventListener('click', function(event) {
        // Handle add-kulicka-btn buttons
        if (event.target.hasAttribute('data-action')) {
            const action = event.target.getAttribute('data-action');
            
            if (action === 'add-kulicka-section') {
                addKulickaToSection(event.target);
            } else if (action === 'add-kulicka-topic') {
                addKulickaToTopic(event.target);
            } else if (action === 'edit-kulicka') {
                editKulicka(event.target);
            } else if (action === 'delete-kulicka') {
                deleteKulicka(event.target);
            }
        }
    });

    // Initialize tab from URL
    const urlPath = window.location.pathname.split('/').pop() || 'uvod';
    showTabFromUrl(urlPath);
});

// Function to handle checkbox changes in kuličky sections
function handleKulickyCheckbox(checkbox) {
    // Handle both old structure (checkbox directly in li) and new structure (checkbox in kulicka-content div)
    let listItem;
    if (checkbox.parentElement.classList.contains('kulicka-content')) {
        listItem = checkbox.parentElement.parentElement;
    } else {
        listItem = checkbox.parentElement;
    }
    
    if (checkbox.checked) {
        listItem.classList.add('checked');
    } else {
        listItem.classList.remove('checked');
    }

    // Save checkbox state to backend (only if kulicka has ID)
    const kulickaId = checkbox.getAttribute('data-kulicka-id');
    const lessonId = getCurrentLessonId();
    
    if (kulickaId && lessonId) {
        saveKulickaState(lessonId, kulickaId, checkbox.checked);
    } else {
        // For kuličky without ID, just save to localStorage as fallback
        const kulickaText = checkbox.nextElementSibling ? checkbox.nextElementSibling.textContent : '';
        if (kulickaText) {
            const storageKey = `kulicka_${lessonId}_${kulickaText}`;
            localStorage.setItem(storageKey, checkbox.checked.toString());
        }
    }
}

// Get current lesson ID from URL
function getCurrentLessonId() {
    const urlPath = window.location.pathname.split('/').pop() || 'uvod';
    if (urlPath === 'uvod') return 0;
    return parseInt(urlPath) || 0;
}

// Save kulicka state to backend
async function saveKulickaState(lessonId, kulickaId, isChecked) {
    try {
        const response = await window.apiClient.checkKulicka(lessonId, kulickaId, isChecked);
        if (!response.success) {
            console.error('Failed to save kulicka state:', response);
            // Revert checkbox state on error
            const checkbox = document.querySelector(`input[data-kulicka-id="${kulickaId}"]`);
            if (checkbox) {
                checkbox.checked = !isChecked;
                handleKulickyCheckbox(checkbox);
            }
        }
    } catch (error) {
        console.error('Error saving kulicka state:', error);
    }
}

// Function to add new kulicka to a main section
async function addKulickaToSection(button) {
    const sectionHeader = button.parentElement;
    const section = sectionHeader.parentElement;
    const kulickyList = section.querySelector('.kuličky-list');
    const lessonId = getCurrentLessonId();
    
    try {
        // Add to backend first
        const response = await window.apiClient.addCustomKulicka(lessonId, 'Nová kulička');
        
        if (response.success) {
            const kulickaData = response.data;
            
            // Create new kulicka item with backend ID
            const newKulicka = document.createElement('li');
            newKulicka.className = 'kulicka-item';
            newKulicka.innerHTML = `
                <div class="kulicka-content">
                    <input type="checkbox" style="margin-right: 8px;" data-kulicka-id="${kulickaData.id}">
                    <span class="kulicka-text">${kulickaData.text}</span>
                </div>
                <div class="kulicka-actions">
                    <button class="edit-kulicka-btn" data-action="edit-kulicka" data-kulicka-id="${kulickaData.id}">✏️</button>
                    <button class="delete-kulicka-btn" data-action="delete-kulicka" data-kulicka-id="${kulickaData.id}">🗑️</button>
                </div>
            `;
            
            kulickyList.appendChild(newKulicka);
            
            // Set up event listener for the new checkbox
            const checkbox = newKulicka.querySelector('input[type="checkbox"]');
            checkbox.addEventListener('change', function() {
                handleKulickyCheckbox(this);
            });
            
            // Auto-edit the new item
            editKulicka(newKulicka.querySelector('.edit-kulicka-btn'));
        } else {
            console.error('Failed to add kulicka:', response);
            alert('Nepodařilo se přidat kuličku. Zkuste to prosím znovu.');
        }
    } catch (error) {
        console.error('Error adding kulicka:', error);
        alert('Chyba při přidávání kuličky. Zkuste to prosím znovu.');
    }
}

// Function to add new kulicka to a topic
async function addKulickaToTopic(button) {
    const topicHeader = button.parentElement;
    const topicItem = topicHeader.parentElement;
    let kulickyList = topicItem.querySelector('.kuličky-list');
    const lessonId = getCurrentLessonId();
    
    // If no kuličky list exists, create one
    if (!kulickyList) {
        kulickyList = document.createElement('ul');
        kulickyList.className = 'kuličky-list';
        kulickyList.style.marginTop = '10px';
        topicItem.appendChild(kulickyList);
    }
    
    try {
        // Add to backend first
        const response = await window.apiClient.addCustomKulicka(lessonId, 'Nová kulička');
        
        if (response.success) {
            const kulickaData = response.data;
            
            // Create new kulicka item with backend ID
            const newKulicka = document.createElement('li');
            newKulicka.className = 'kulicka-item';
            newKulicka.innerHTML = `
                <div class="kulicka-content">
                    <input type="checkbox" style="margin-right: 8px;" data-kulicka-id="${kulickaData.id}">
                    <span class="kulicka-text">${kulickaData.text}</span>
                </div>
                <div class="kulicka-actions">
                    <button class="edit-kulicka-btn" data-action="edit-kulicka" data-kulicka-id="${kulickaData.id}">✏️</button>
                    <button class="delete-kulicka-btn" data-action="delete-kulicka" data-kulicka-id="${kulickaData.id}">🗑️</button>
                </div>
            `;
            
            kulickyList.appendChild(newKulicka);
            
            // Set up event listener for the new checkbox
            const checkbox = newKulicka.querySelector('input[type="checkbox"]');
            checkbox.addEventListener('change', function() {
                handleKulickyCheckbox(this);
            });
            
            // Auto-edit the new item
            editKulicka(newKulicka.querySelector('.edit-kulicka-btn'));
        } else {
            console.error('Failed to add kulicka:', response);
            alert('Nepodařilo se přidat kuličku. Zkuste to prosím znovu.');
        }
    } catch (error) {
        console.error('Error adding kulicka:', error);
        alert('Chyba při přidávání kuličky. Zkuste to prosím znovu.');
    }
}

// Function to edit kulicka text
async function editKulicka(button) {
    const kulickaActions = button.parentElement;
    const kulickaItem = kulickaActions.parentElement;
    const kulickaContent = kulickaItem.querySelector('.kulicka-content');
    const textSpan = kulickaContent.querySelector('.kulicka-text');
    const currentText = textSpan.textContent;
    const kulickaId = button.getAttribute('data-kulicka-id');
    
    // Create input field
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentText;
    input.style.flex = '1';
    input.style.border = '1px solid #667eea';
    input.style.borderRadius = '3px';
    input.style.padding = '2px 5px';
    
    // Replace text with input
    textSpan.style.display = 'none';
    kulickaContent.insertBefore(input, textSpan);
    input.focus();
    input.select();
    
    // Handle save
    async function saveEdit() {
        const newText = input.value.trim();
        if (newText && newText !== currentText) {
            if (kulickaId) {
                // Update custom kulicka in backend
                try {
                    const response = await window.apiClient.updateCustomKulicka(kulickaId, newText);
                    if (response.success) {
                        textSpan.textContent = newText;
                    } else {
                        console.error('Failed to update kulicka:', response);
                        alert('Nepodařilo se uložit změny. Zkuste to prosím znovu.');
                        input.value = currentText;
                    }
                } catch (error) {
                    console.error('Error updating kulicka:', error);
                    alert('Chyba při ukládání změn. Zkuste to prosím znovu.');
                    input.value = currentText;
                }
            } else {
                textSpan.textContent = newText;
            }
        }
        textSpan.style.display = '';
        input.remove();
    }
    
    // Handle cancel
    function cancelEdit() {
        textSpan.style.display = '';
        input.remove();
    }
    
    // Event listeners
    input.addEventListener('blur', saveEdit);
    input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            saveEdit();
        } else if (e.key === 'Escape') {
            cancelEdit();
        }
    });
}

// Function to delete kulicka
async function deleteKulicka(button) {
    if (confirm('Opravdu chcete smazat tuto kuličku?')) {
        const kulickaActions = button.parentElement;
        const kulickaItem = kulickaActions.parentElement;
        const kulickaId = button.getAttribute('data-kulicka-id');
        
        if (kulickaId) {
            // Delete custom kulicka from backend
            try {
                const response = await window.apiClient.deleteCustomKulicka(kulickaId);
                if (response.success) {
                    kulickaItem.remove();
                } else {
                    console.error('Failed to delete kulicka:', response);
                    alert('Nepodařilo se smazat kuličku. Zkuste to prosím znovu.');
                }
            } catch (error) {
                console.error('Error deleting kulicka:', error);
                alert('Chyba při mazání kuličky. Zkuste to prosím znovu.');
            }
        } else {
            // Remove from DOM only (for basic kulicky)
            kulickaItem.remove();
        }
    }
}

// Function to convert existing kuličky items to new format
function convertKulickyItems() {
    // Handle main Kuličky sections
    const allKulickySections = document.querySelectorAll('.section.kuličky');
    allKulickySections.forEach(function(section) {
        // Add section header with + button if not already present
        let sectionHeader = section.querySelector('.section-header');
        if (!sectionHeader) {
            const h3 = section.querySelector('h3');
            if (h3) {
                sectionHeader = document.createElement('div');
                sectionHeader.className = 'section-header';
                sectionHeader.innerHTML = `
                    ${h3.outerHTML}
                    <button class="add-kulicka-btn" data-action="add-kulicka-section">+</button>
                `;
                h3.remove();
                section.insertBefore(sectionHeader, section.firstChild);
            }
        }
        
        // Convert list items
        const kulickyList = section.querySelector('.kuličky-list');
        if (kulickyList) {
            convertKulickyListItems(kulickyList);
        }
    });
    
    // Handle Témata sections
    const allTopicsLists = document.querySelectorAll('.topics-list');
    allTopicsLists.forEach(function(topicsList) {
        const kulickyLists = topicsList.querySelectorAll('.kuličky-list');
        kulickyLists.forEach(function(kulickyList) {
            convertKulickyListItems(kulickyList);
        });
    });
}

// Helper function to convert kuličky list items
function convertKulickyListItems(kulickyList) {
    const listItems = kulickyList.querySelectorAll('li');
    listItems.forEach(function(item) {
        // Skip if already converted (has kulicka-item class)
        if (item.classList.contains('kulicka-item')) {
            return;
        }
        
        // Get the text content
        let text = '';
        const checkbox = item.querySelector('input[type="checkbox"]');
        if (checkbox) {
            text = item.textContent.replace(checkbox.value || '', '').trim();
            // Remove the checkbox from the text
            text = text.replace(/^\s*/, '');
        } else {
            text = item.textContent.trim();
            // Add a checkbox if none exists
            const newCheckbox = document.createElement('input');
            newCheckbox.type = 'checkbox';
            newCheckbox.style.marginRight = '8px';
            item.insertBefore(newCheckbox, item.firstChild);
        }
        
        // Convert to new format
        item.className = 'kulicka-item';
        item.innerHTML = `
            <div class="kulicka-content">
                <input type="checkbox" style="margin-right: 8px;" ${checkbox ? (checkbox.checked ? 'checked' : '') : ''}>
                <span class="kulicka-text">${text}</span>
            </div>
            <div class="kulicka-actions">
                <button class="edit-kulicka-btn" data-action="edit-kulicka">✏️</button>
                <button class="delete-kulicka-btn" data-action="delete-kulicka">🗑️</button>
            </div>
        `;
    });
}

// Load kulicky data from backend
async function loadKulickyData(lessonId) {
    try {
        const response = await window.apiClient.getKulicky(lessonId);
        if (response && response.success && response.data && response.data.kulicky) {
            return response.data.kulicky;
        } else {
            console.error('Failed to load kulicky data:', response);
            return [];
        }
    } catch (error) {
        console.error('Error loading kulicky data:', error);
        return [];
    }
}

// Apply loaded data to DOM
function applyKulickyData(kulickyData) {
    // Group kulicky by section/topic
    const kulickyBySection = {};
    
    kulickyData.forEach(kulicka => {
        // For now, we'll add all kulicky to the main kulicky section
        // In the future, we could extend this to handle different sections
        if (!kulickyBySection['main']) {
            kulickyBySection['main'] = [];
        }
        kulickyBySection['main'].push(kulicka);
    });
    
    // Apply to main kulicky section
    const mainKulickySection = document.querySelector('.section.kuličky');
    if (mainKulickySection && kulickyBySection['main']) {
        const kulickyList = mainKulickySection.querySelector('.kuličky-list');
        if (kulickyList) {
            // Clear existing items
            kulickyList.innerHTML = '';
            
            // Add loaded kulicky
            kulickyBySection['main'].forEach(kulicka => {
                const kulickaItem = document.createElement('li');
                kulickaItem.className = 'kulicka-item';
                
                if (kulicka.is_custom) {
                    // Custom kulicka with edit/delete buttons
                    kulickaItem.innerHTML = `
                        <div class="kulicka-content">
                            <input type="checkbox" style="margin-right: 8px;" data-kulicka-id="${kulicka.id}" ${kulicka.is_checked ? 'checked' : ''}>
                            <span class="kulicka-text">${kulicka.text}</span>
                        </div>
                        <div class="kulicka-actions">
                            <button class="edit-kulicka-btn" data-action="edit-kulicka" data-kulicka-id="${kulicka.id}">✏️</button>
                            <button class="delete-kulicka-btn" data-action="delete-kulicka" data-kulicka-id="${kulicka.id}">🗑️</button>
                        </div>
                    `;
                } else {
                    // Basic kulicka without edit/delete buttons
                    kulickaItem.innerHTML = `
                        <div class="kulicka-content">
                            <input type="checkbox" style="margin-right: 8px;" data-kulicka-id="${kulicka.id}" ${kulicka.is_checked ? 'checked' : ''}>
                            <span class="kulicka-text">${kulicka.text}</span>
                        </div>
                    `;
                }
                
                kulickyList.appendChild(kulickaItem);
                
                // Set up event listener for checkbox
                const checkbox = kulickaItem.querySelector('input[type="checkbox"]');
                checkbox.addEventListener('change', function() {
                    handleKulickyCheckbox(this);
                });
                
                // Apply checked state styling
                if (kulicka.is_checked) {
                    handleKulickyCheckbox(checkbox);
                }
            });
        }
    }
}

// Load checkbox states from localStorage
function loadCheckboxStatesFromStorage(lessonId) {
    const allCheckboxes = document.querySelectorAll('.kuličky-list input[type="checkbox"]');
    allCheckboxes.forEach(function(checkbox) {
        const kulickaText = checkbox.nextElementSibling ? checkbox.nextElementSibling.textContent : '';
        if (kulickaText) {
            const storageKey = `kulicka_${lessonId}_${kulickaText}`;
            const savedState = localStorage.getItem(storageKey);
            if (savedState === 'true') {
                checkbox.checked = true;
                handleKulickyCheckbox(checkbox);
            }
        }
    });
}

// Initialize all checkboxes when page loads
document.addEventListener('DOMContentLoaded', async function() {
    // Convert all existing kuličky items to new format first
    convertKulickyItems();
    
    // Load data from backend
    const lessonId = getCurrentLessonId();
    const kulickyData = await loadKulickyData(lessonId);
    
    if (kulickyData && kulickyData.length > 0) {
        // Apply loaded data
        applyKulickyData(kulickyData);
    } else {
        // Load states from localStorage for existing checkboxes
        loadCheckboxStatesFromStorage(lessonId);
        
        // Set up event listeners for existing checkboxes
        const allCheckboxes = document.querySelectorAll('.kuličky-list input[type="checkbox"]');
        allCheckboxes.forEach(function(checkbox) {
            // Set up event listener
            checkbox.addEventListener('change', function() {
                handleKulickyCheckbox(this);
            });
        });
    }
});

// Application initialization without authentication
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the application without authentication checks
    console.log('Koulio application initialized');
});

// User info functions removed - no authentication needed
