/**
 * Artavix Admin Portal Management Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    ArtavixAdmin.init();
});

const ArtavixAdmin = {
    projects: [],
    tokenKey: 'artavix_github_pat',

    init() {
        this.checkToken();
        this.loadLocalProjects();
        this.setupFormListeners();
    },

    // Retrieve Token from LocalStorage
    getToken() {
        return localStorage.getItem(this.tokenKey) || '';
    },

    checkToken() {
        const token = this.getToken();
        const statusElem = document.getElementById('token-status');
        if (token) {
            statusElem.innerHTML = `<span class="text-green-400 font-bold"><i class="fa-solid fa-key"></i> GitHub Token Active</span>`;
        } else {
            statusElem.innerHTML = `<span class="text-yellow-400"><i class="fa-solid fa-triangle-exclamation"></i> Token Missing. Required for syncing.</span>`;
        }
    },

    saveToken() {
        const input = document.getElementById('pat-token-input').value.trim();
        if (!input) {
            alert('Please enter a valid GitHub Personal Access Token.');
            return;
        }
        localStorage.setItem(this.tokenKey, input);
        this.checkToken();
        alert('GitHub Access Token saved securely in browser storage.');
    },

    // Fetch Local JSON
    async loadLocalProjects() {
        try {
            const res = await fetch('data/projects.json');
            this.projects = await res.json();
            this.renderAdminProjectList();
        } catch (e) {
            console.error('Admin Load Error:', e);
        }
    },

    // Render Manageable List
    renderAdminProjectList() {
        const listElem = document.getElementById('admin-projects-list');
        if (!listElem) return;

        if (this.projects.length === 0) {
            listElem.innerHTML = `<p class="text-gray-400 text-center">No projects available.</p>`;
            return;
        }

        listElem.innerHTML = this.projects.map((p, idx) => `
            <div class="glass-card p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <h4 class="font-bold text-white text-lg">${this.escapeHTML(p.title)}</h4>
                    <p class="text-xs text-cyanAccent">${this.escapeHTML(p.category)} | ID: ${this.escapeHTML(p.id)}</p>
                </div>
                <div class="flex items-center gap-2">
                    <button onclick="ArtavixAdmin.deleteProject(${idx})" class="btn btn-outline text-xs text-red-400 border-red-500/30 hover:bg-red-500/20">
                        <i class="fa-solid fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');
    },

    // Add New Project Handler
    async handleAddProject(e) {
        e.preventDefault();
        
        const token = this.getToken();
        if (!token) {
            alert('Error: You must set your GitHub Personal Access Token first to publish changes!');
            return;
        }

        const newProject = {
            id: document.getElementById('proj-id').value.trim().toLowerCase().replace(/\s+/g, '-'),
            title: document.getElementById('proj-title').value.trim(),
            category: document.getElementById('proj-category').value.trim(),
            shortDescription: document.getElementById('proj-short-desc').value.trim(),
            fullDescription: document.getElementById('proj-full-desc').value.trim(),
            tags: document.getElementById('proj-tags').value.split(',').map(t => t.trim()).filter(Boolean),
            techStack: document.getElementById('proj-stack').value.split(',').map(t => t.trim()).filter(Boolean),
            demoVideoUrl: document.getElementById('proj-video').value.trim(),
            featured: true,
            status: "Production-Ready"
        };

        // Add to array
        this.projects.unshift(newProject);

        // Sync with GitHub API
        const btn = document.getElementById('submit-btn');
        btn.disabled = true;
        btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Syncing with GitHub...`;

        try {
            await GitHubAPI.updateProjectsDatabase(token, this.projects, `CMS: Added new project [${newProject.title}]`);
            alert('Success! Project committed to GitHub. Your live site will update in 30 seconds.');
            document.getElementById('add-project-form').reset();
            this.renderAdminProjectList();
        } catch (error) {
            alert(`Deployment Error: ${error.message}`);
            // Rollback local state
            this.projects.shift();
        } finally {
            btn.disabled = false;
            btn.innerHTML = `<i class="fa-solid fa-cloud-arrow-up"></i> Publish System to Live Site`;
        }
    },

    // Delete Project Handler
    async deleteProject(index) {
        const token = this.getToken();
        if (!token) {
            alert('GitHub Token required to commit deletions.');
            return;
        }

        if (!confirm(`Are you sure you want to delete "${this.projects[index].title}"?`)) return;

        const deletedTitle = this.projects[index].title;
        this.projects.splice(index, 1);

        try {
            await GitHubAPI.updateProjectsDatabase(token, this.projects, `CMS: Removed project [${deletedTitle}]`);
            alert('Project removed successfully from GitHub.');
            this.renderAdminProjectList();
        } catch (error) {
            alert(`Delete Error: ${error.message}`);
            await this.loadLocalProjects(); // Reload from file
        }
    },

    setupFormListeners() {
        const form = document.getElementById('add-project-form');
        if (form) {
            form.addEventListener('submit', (e) => this.handleAddProject(e));
        }
    },

    escapeHTML(str) {
        return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
};