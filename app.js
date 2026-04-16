// 1. Configuration
const DATA_URLS = {
    styles: 'precinct_ballot_style.json',
    content: 'election_content.json'
};

// 2. Wait for the page to load, then attach the listener
document.addEventListener('DOMContentLoaded', () => {
    const submitBtn = document.getElementById('submit-btn');
    if (submitBtn) {
        submitBtn.addEventListener('click', handleSubmission);
    }
});

// 3. The Main Logic Function (Must be marked 'async')
async function handleSubmission() {
    const inputField = document.getElementById('ballot-input');
    const resultDiv = document.getElementById('results-display');
    const errorDiv = document.getElementById('error-display');
    
    // Extract last two digits and pad with a zero (e.g., "10" or "01")
    const digits = inputField.value.replace(/\D/g, '');
    const styleNumRaw = digits.slice(-2).padStart(2, '0');
    const styleNumber = parseInt(styleNumRaw, 10);

    // Validation
    if (isNaN(styleNumber) || styleNumber < 1 || styleNumber > 35) {
        errorDiv.innerHTML = `<div class="error-box">
            <strong>Invalid Entry:</strong> Please enter a number between 1 and 35. 
            (Example: "39210" or "BS10")
        </div>`;
        errorDiv.classList.remove('hidden');
        resultDiv.classList.add('hidden');
        return;
    }

    const bStyleKey = `BS${styleNumRaw}`;
    errorDiv.classList.add('hidden');
    resultDiv.innerHTML = "<p>Loading your ballot...</p>";
    resultDiv.classList.remove('hidden');

    try {
        // Fetch data files
        const [stylesRes, contentRes] = await Promise.all([
            fetch(DATA_URLS.styles),
            fetch(DATA_URLS.content)
        ]);

        if (!stylesRes.ok || !contentRes.ok) {
            throw new Error("Could not find data files. Check that filenames are lowercase on GitHub.");
        }

        const stylesData = await stylesRes.json();
        const contentData = await contentRes.json();

        // Dig into your specific JSON structure
        const selectedStyle = stylesData.ballot_style_mapping[bStyleKey];

        if (!selectedStyle) {
            throw new Error(`Ballot Style ${bStyleKey} not found in database.`);
        }

        let html = `<h2>Ballot Style: ${bStyleKey}</h2>`;
        
        if (!selectedStyle.element_ids || selectedStyle.element_ids.length === 0) {
            html += "<p>No specific contests found for this ballot style.</p>";
        } else {
            selectedStyle.element_ids.forEach(id => {
                // Find the contest by matching the element_id inside the contests object
                const contestKey = Object.keys(contentData.contests).find(key => 
                    contentData.contests[key].element_id === id
                );
                
                const item = contentData.contests[contestKey];

                if (item) {
                    html += `<div class="contest-card" style="border: 1px solid #ddd; padding: 15px; margin-bottom: 10px; border-radius: 5px;">
                        <h3>${item.title || contestKey.replace(/_/g, ' ')}</h3>
                        <p><strong>Jurisdiction:</strong> ${item.jurisdiction}</p>
                        <p><em>${item.ballot_language || ''}</em></p>
                        ${renderDetails(item)}
                    </div>`;
                }
            });
        }

        resultDiv.innerHTML = html;

    } catch (err) {
        errorDiv.innerHTML = `<div class="error-box"><strong>Error:</strong> ${err.message}</div>`;
        errorDiv.classList.remove('hidden');
        resultDiv.classList.add('hidden');
    }
}

// 4. Helper for rendering candidates or propositions
function renderDetails(item) {
    if (item.type === 'office' && item.candidates) {
        return item.candidates.map(c => `
            <div class="candidate" style="margin-top: 10px; border-top: 1px solid #eee; padding-top: 5px;">
                <strong>${c.name}</strong>
                ${c.content && c.content.support_urls && c.content.support_urls.length > 0 ? 
                    `<br><a href="${c.content.support_urls[0]}" target="_blank">Research Candidate</a>` : ''}
            </div>
        `).join('');
    } else if (item.type === 'proposition') {
        const infoLink = (item.content && item.content.general_info && item.content.general_info[0]) ? item.content.general_info[0] : '#';
        return `
            <div class="proposition" style="margin-top: 10px;">
                <a href="${infoLink}" target="_blank">More Information</a>
            </div>
        `;
    }
    return '';
}