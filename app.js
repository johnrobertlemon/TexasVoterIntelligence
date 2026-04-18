async function loadVoterGuide(ballotStyleId) {
    try {
        const [contentRes, mappingRes] = await Promise.all([
            fetch('./election_content.json'),
            fetch('./precinct_ballot_style.json')
        ]);

        if (!contentRes.ok || !mappingRes.ok) throw new Error("Files not found");

        const electionContent = await contentRes.json();
        const styleMapping = await mappingRes.json();

        const selectedStyle = styleMapping.ballot_style_mapping[ballotStyleId];
        if (!selectedStyle) throw new Error("Ballot Style not found");

        const ballotData = selectedStyle.element_ids.map(id => electionContent[id]);
        renderBallot(ballotData);

    } catch (error) {
        console.error("Error loading ballot data:", error);
        document.getElementById('ballot-container').innerHTML = `
            <div class="alert alert-danger">Error: ${error.message}. Check JSON formatting.</div>
        `;
    }
}

// Map of Precincts to Styles (Expand this as needed)
const precinctToStyleMap = {
    "392": "BS12",
    "393": "BS05"
};

function lookupByPrecinct() {
    const input = document.getElementById('precinct-input').value.trim();
    const styleId = precinctToStyleMap[input];

    if (styleId) {
        loadVoterGuide(styleId);
    } else {
        document.getElementById('ballot-container').innerHTML = `
            <div class="alert alert-warning">Precinct ${input} not found in our database.</div>
        `;
    }
}

// Note: No event listener here. The script only runs when lookupByPrecinct() is called via HTML.