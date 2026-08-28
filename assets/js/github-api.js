/**
 * Artavix GitHub Contents API Connector
 * Enables Serverless CMS functionality by committing directly to the repository.
 */

const GitHubAPI = {
    owner: 'artavixai',
    repo: 'artavixai.github.io',
    filePath: 'data/projects.json',

    // Fetch File SHA and Content from GitHub Repository
    async getFileDetails(token) {
        const url = `https://api.github.com/repos/${this.owner}/${this.repo}/contents/${this.filePath}`;
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!response.ok) {
            throw new Error(`GitHub API Error: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    },

    // Commit Updated JSON Data Back to Repository
    async updateProjectsDatabase(token, updatedProjectsData, commitMessage) {
        try {
            // Step 1: Get current file SHA
            const fileDetails = await this.getFileDetails(token);
            const sha = fileDetails.sha;

            // Step 2: Encode updated JSON string to Base64 (UTF-8 safe)
            const jsonString = JSON.stringify(updatedProjectsData, null, 2);
            const contentBase64 = this.utf8ToBase64(jsonString);

            // Step 3: Send PUT request to update file
            const url = `https://api.github.com/repos/${this.owner}/${this.repo}/contents/${this.filePath}`;
            const bodyData = {
                message: commitMessage || 'CMS: Update projects database via Artavix Admin Portal',
                content: contentBase64,
                sha: sha
            };

            const updateResponse = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/vnd.github.v3+json'
                },
                body: JSON.stringify(bodyData)
            });

            if (!updateResponse.ok) {
                const errData = await updateResponse.json();
                throw new Error(errData.message || 'Failed to commit updates to GitHub.');
            }

            return await updateResponse.json();
        } catch (error) {
            console.error('GitHub API Commit Error:', error);
            throw error;
        }
    },

    // Helper: UTF-8 Safe Base64 Encoder
    utf8ToBase64(str) {
        return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => {
            return String.fromCharCode('0x' + p1);
        }));
    }
};