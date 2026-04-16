try {
        const [stylesRes, contentRes] = await Promise.all([
            fetch(DATA_URLS.styles),
            fetch(DATA_URLS.content)
        ]);

        if (!stylesRes.ok || !contentRes.ok) {
            throw new Error("One or more data files could not be found. Check your filenames on GitHub.");
        }

        const stylesData = await stylesRes.json();
        const contentData = await contentRes.json();

        // Fix 1: Look inside the wrapper key "ballot_style_mapping"
        const selectedStyle = stylesData.ballot_style_mapping[bStyleKey];

        if (!selectedStyle) {
            throw new Error(`Style ${bStyleKey} not found in database.`);
        }

        let html = `<h2>Ballot Style: ${bStyleKey}</h2>`;
        
        // Fix 2: Use "element_ids" instead of "contests"
        selectedStyle.element_ids.forEach(id => {
            // Fix 3: Search inside contentData.contests for the matching element_id
            const itemKey = Object.keys(contentData.contests).find(key => 
                contentData.contests[key].element_id === id
            );
            const item = contentData.contests[itemKey];

            if (item) {
                html += `<div class="contest-card">
                    <h3>${item.title || itemKey.replace(/_/g, ' ')}</h3>
                    <p>${item.ballot_language || ''}</p>
                    ${renderDetails(item)}
                </div>`;
            }
        });

        resultDiv.innerHTML = html;
        resultDiv.classList.remove('hidden');

    } catch (err) {
        errorDiv.innerHTML = `<div class="error-box">Error: ${err.message}</div>`;
        errorDiv.classList.remove('hidden');
    }