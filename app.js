const DATA_URLS = {
    styles: 'precinct_ballot_style.json',
    content: 'election_content.json'
};

// Use an async function for the click handler
const handleSubmission = async () => {
    const inputField = document.getElementById('ballot-input');
    const resultDiv = document.getElementById('results-display');
    const errorDiv = document.getElementById('error-display');
    
    // 1. Extract and Validate (Grabs last two digits)
    const digits = inputField.value.replace(/\D/g, '');
    const styleNumRaw = digits.slice(-2);
    const styleNumber = parseInt(styleNumRaw, 10);

    if (isNaN(styleNumber) || styleNumber < 1 || styleNumber > 35) {
        errorDiv.innerHTML = `<div class="error-box">
            <strong>Invalid Entry:</strong> Please enter a number between 1 and 35. 
            (Example: "39210" or "BS10")
        </div>`;
        errorDiv.classList.remove('hidden');
        resultDiv.classList.add('hidden');
        return;
    }

    // Standardize key (e.g., "BS10")
    const bStyleKey = `BS${styleNumRaw.padStart(2, '0')}`;
    errorDiv.classList.add('hidden');
    resultDiv.innerHTML = "<p>Loading your ballot...</p>";
    resultDiv.classList.remove('hidden');

    try {
        // ALL 'await' calls are now safely inside this async block
        const [stylesRes, contentRes] = await Promise.all([
            fetch(DATA_URLS.styles),
            fetch(DATA_URLS.content)
        ]);

        if (!stylesRes.ok || !contentRes.ok) {
            throw new Error("Data files not found. Check filenames on GitHub.");
        }

        const stylesData = await stylesRes.json();
        const contentData = await contentRes.json();

        const selectedStyle = stylesData.ballot_style_mapping[bStyleKey];

        if (!selectedStyle) {
            throw new Error(`Style ${bStyleKey} not found.`);
        }

        let html = `<h2>Ballot Style: ${bStyleKey}</h2>`;
        
        selectedStyle.element_ids.forEach(id => {
            const contestKey = Object.keys(contentData.contests).find(key => 
                contentData.contests[key].element_id === id
            );
            
            const item = contentData.contests[contestKey];

            if (item) {
                html += `<div class="contest-card">
                    <h3>${item.title || contestKey.replace(/_/g, ' ')}</h3>
                    <p><strong>Jurisdiction:</strong> ${item.jurisdiction}</p>
                    <p><em>${item.ballot_language || ''}</em></p>
                    ${renderDetails(item)}
                </div>`;
            }
        });

        resultDiv.innerHTML = html;

    } catch (err) {
        errorDiv.innerHTML = `<div class="error-box"><strong>Error:</strong> ${err.message}</div>`;
        errorDiv.classList.remove('hidden');
        resultDiv.classList.add('hidden');
    }
};

// Helper for rendering candidates or props
function renderDetails(item) {
    if (item.type === 'office' && item.candidates) {
        return item.candidates.map(c => `
            <div style="margin-top: 10px; border-top: 1px solid #eee; padding-top: 5px;">
                <strong>${c.name}</strong>
            </div>
        `).join('');
    } else if (item.type === 'proposition') {
        return `<p><a href="#" target="_blank">More Info</a></p>`;
    }
    return '';
}

// Attach the event listener
document.getElementById('submit-btn').addEventListener('click', handleSubmission);