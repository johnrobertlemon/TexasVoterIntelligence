const DATA_URLS = {
    styles: './precinct_ballot_style.json',
    content: './election_content.json'
};

document.getElementById('submit-btn').addEventListener('click', handleSubmission);

async function handleSubmission() {
    const inputField = document.getElementById('ballot-input');
    const resultDiv = document.getElementById('results-display');
    const errorDiv = document.getElementById('error-display');
    
    // 1. Extract and Validate
    const digits = inputField.value.replace(/\D/g, '');
    const styleNumber = parseInt(digits.slice(-2), 10);

    if (isNaN(styleNumber) || styleNumber < 1 || styleNumber > 35) {
        errorDiv.innerHTML = `<div class="error-box">
            <strong>Invalid Entry:</strong> Please enter a number between 1 and 35. 
            (Example: "39210" or "BS10")
        </div>`;
        errorDiv.classList.remove('hidden');
        resultDiv.classList.add('hidden');
        return;
    }

    // 2. Clear Errors and Fetch
    errorDiv.classList.add('hidden');
    const bStyleKey = `BS${styleNumber}`;

    try {
        const [stylesRes, contentRes] = await Promise.all([
            fetch(DATA_URLS.styles),
            fetch(DATA_URLS.content)
        ]);

        const styleMap = await stylesRes.json();
        const contentLibrary = await contentRes.json();

        const selectedStyle = styleMap[bStyleKey];

        if (!selectedStyle) {
            throw new Error(`Style ${bStyleKey} not found in database.`);
        }

        // 3. Render Results
        let html = `<h2>Ballot Style: ${bStyleKey}</h2>`;
        selectedStyle.contests.forEach(id => {
            const item = contentLibrary[id];
            if (item) {
                html += `<div class="contest-card">
                    <h3>${id.replace(/_/g, ' ')}</h3>
                    <p>${item.description || item.legal_text || ''}</p>
                    ${renderDetails(item)}
                </div>`;
            }
        });

        resultDiv.innerHTML = html;
        resultDiv.classList.remove('hidden');

    } catch (err) {
        errorDiv.innerHTML = `<div class="error-box">Error loading data: ${err.message}</div>`;
        errorDiv.classList.remove('hidden');
    }
}

function renderDetails(item) {
    if (item.type === 'candidate') {
        return item.candidates.map(c => `
            <div style="margin-bottom:10px;">
                <strong>${c.name}</strong> - <a href="${c.link}" target="_blank">View Bio</a>
                <p style="font-size:0.9em; color:#666;">${c.notes}</p>
            </div>
        `).join('');
    }
    return `<p><strong>Explanation:</strong> ${item.explanation}</p>
            <a href="${item.resource_link}" target="_blank">Full Proposition Text</a>`;
}