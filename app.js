/**
 * Texas Voter Intelligence - Core Logic
 * Handles data fetching and relational mapping of ballot elements
 */

async function loadVoterGuide(ballotStyleId) {
    try {
        // 1. Fetch both data sources concurrently
        const [contentRes, mappingRes] = await Promise.all([
            fetch('./election_content.json'),
            fetch('./precinct_ballot_style.json')
        ]);

        const electionContent = await contentRes.json();
        const styleMapping = await mappingRes.json();

        // 2. Identify the specific style mapping (e.g., "BS12")
        const selectedStyle = styleMapping.ballot_style_mapping[ballotStyleId];

        if (!selectedStyle) {
            console.error("Ballot Style not found");
            return;
        }

        // 3. Extract the array of element IDs for this style
        const elementIds = selectedStyle.element_ids;

        // 4. Map the IDs to the full content objects
        const ballotData = elementIds.map(id => electionContent[id]);

        renderBallot(ballotData);

    } catch (error) {
        console.error("Error loading ballot data:", error);
    }
}

/**
 * Renders the mapped ballot data to the DOM
 * @param {Array} data - Array of race and issue objects
 */
function renderBallot(data) {
    const container = document.getElementById('ballot-container');
    container.innerHTML = ''; // Clear previous results

    data.forEach(item => {
        const element = document.createElement('div');
        element.className = 'ballot-item card mb-4 p-3';

        if (item.type === 'race') {
            element.innerHTML = `
                <h3 class="h5 text-primary">${item.jurisdiction}</h3>
                <h2 class="h4 font-weight-bold">${item.title}</h2>
                <p class="text-muted italic">${item.selection_rule}</p>
                <ul class="list-group">
                    ${item.candidates.map(c => `
                        <li class="list-group-item d-flex justify-content-between align-items-center">
                            ${c.name}
                            <button class="btn btn-sm btn-outline-info" onclick="showInfo('${c.name}')">Info</button>
                        </li>
                    `).join('')}
                </ul>
            `;
        } else {
            element.innerHTML = `
                <h3 class="h5 text-secondary">${item.jurisdiction}</h3>
                <h2 class="h4 font-weight-bold">${item.title}</h2>
                <div class="alert alert-light mt-2">
                    <p>${item.summary}</p>
                    ${item.impact ? `<p class="badge badge-warning">${item.impact}</p>` : ''}
                    ${item.amount ? `<p class="font-weight-bold text-danger">Bond Amount: ${item.amount}</p>` : ''}
                </div>
            `;
        }
        
        container.appendChild(element);
    });
}

// Example usage: Initialize with a specific Ballot Style
// In production, this would be triggered by a precinct search or URL param
document.addEventListener('DOMContentLoaded', () => {
    loadVoterGuide('BS12'); 
});