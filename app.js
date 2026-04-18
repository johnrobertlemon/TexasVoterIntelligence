/**
 * Texas Voter Intelligence: Part Two
 * Logic: User Input (Ballot Style) -> Mapping -> Content Generation
 */

async function fetchAndRenderBallot() {
    const inputField = document.getElementById('ballot-style-input');
    const container = document.getElementById('ballot-container');
    const bsNumber = inputField.value.trim().toUpperCase(); // Normalizes input to "BSXX"

    if (!bsNumber) {
        alert("Please enter a Ballot Style number.");
        return;
    }

    // Show spinner during processing
    container.innerHTML = '<div class="text-center p-5"><div class="spinner-border text-primary"></div></div>';

    try {
        // Fetch entities concurrently
        const [mappingRes, contentRes] = await Promise.all([
            fetch('./precinct_ballot_style.json'),
            fetch('./election_content.json')
        ]);

        const styleMapping = await mappingRes.json();
        const electionContent = await contentRes.json();

        // 1. Find the corresponding entry in precinct_ballot_style.json
        const mappingEntry = styleMapping.ballot_style_mapping[bsNumber];

        if (!mappingEntry) {
            container.innerHTML = `<div class="alert alert-warning">Ballot Style "${bsNumber}" not found in current data.</div>`;
            return;
        }

        // 2. Extract element_ids and consult election_content.json
        const elementIds = mappingEntry.element_ids;
        const ballotData = elementIds.map(id => electionContent[id]);

        // 3. Generate the response page
        renderBallotPage(ballotData);

    } catch (error) {
        console.error("System Error:", error);
        container.innerHTML = `<div class="alert alert-danger">Error: Could not load election files.</div>`;
    }
}

function renderBallotPage(data) {
    const container = document.getElementById('ballot-container');
    container.innerHTML = ''; // Clear spinner/previous content

    data.forEach(item => {
        const div = document.createElement('div');
        div.className = 'ballot-item card mb-4 p-4 shadow-sm bg-white border-0';
        
        if (item.type === 'race') {
            div.innerHTML = `
                <span class="badge bg-primary mb-2">${item.jurisdiction}</span>
                <h2 class="h4 fw-bold">${item.title}</h2>
                <p class="text-muted small italic mb-3">${item.selection_rule}</p>
                <div class="list-group">
                    ${item.candidates.map(c => `<div class="list-group-item border-0 ps-0">• ${c.name}</div>`).join('')}
                </div>`;
        } else {
            div.innerHTML = `
                <span class="badge bg-secondary mb-2">${item.jurisdiction}</span>
                <h2 class="h4 fw-bold">${item.title}</h2>
                <div class="mt-3">
                    <p class="mb-2">${item.summary}</p>
                    ${item.impact ? `<span class="badge bg-danger">${item.impact}</span>` : ''}
                    ${item.amount ? `<p class="mt-2 fw-bold text-dark">Prop. Amount: ${item.amount}</p>` : ''}
                </div>`;
        }
        container.appendChild(div);
    });
}