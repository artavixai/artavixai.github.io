/**
 * Artavix Enterprise Core Application Engine
 * Handles JSON Data Ingestion, Dynamic Portfolio Rendering, and Interactive Modals.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize App Engine
    ArtavixApp.init();
});

const ArtavixApp = {
    // State Memory
    projectsData: [],
    configData: null,

    // Initialize Application
    async init() {
        this.updateYear();
        await this.loadConfig();
        await this.loadProjects();
        this.setupModalListeners();
    },

    // Set Dynamic Copyright Year
    updateYear() {
        const yearElem = document.getElementById('year');
        if (yearElem) {
            yearElem.textContent = new Date().getFullYear();
        }
    },

    // Fetch Site Configuration JSON
    async loadConfig() {
        try {
            const response = await fetch('data/config.json');
            if (!response.ok) throw new Error('Failed to load configuration');
            this.configData = await response.json();
        } catch (error) {
            console.warn('Config Load Warning:', error);
        }
    },

    // Fetch Projects JSON Database
    async loadProjects() {
        const container = document.getElementById('projects-grid');
        if (!container) return;

        try {
            const response = await fetch('data/projects.json');
            if (!response.ok) throw new Error('Failed to fetch projects database');
            
            this.projectsData = await response.json();
            this.renderProjects(this.projectsData, container);
        } catch (error) {
            console.error('Projects Ingestion Error:', error);
            container.innerHTML = `
                <div class="glass-card p-8 text-center col-span-full border-red-500/30">
                    <i class="fa-solid fa-triangle-exclamation text-3xl text-red-400 mb-2"></i>
                    <p class="text-gray-300">Unable to load project data. Please verify data/projects.json exists.</p>
                </div>
            `;
        }
    },

    // Render Project Cards to DOM
    renderProjects(projects, container) {
        if (!projects || projects.length === 0) {
            container.innerHTML = `<p class="text-gray-400 col-span-full text-center">No projects listed yet.</p>`;
            return;
        }

        container.innerHTML = projects.map(project => this.createProjectCardMarkup(project)).join('');
    },

    // Generate HTML for Individual Project Card
    createProjectCardMarkup(project) {
        const tagsMarkup = project.tags
            ? project.tags.map(tag => `<span class="tag-pill">${this.escapeHTML(tag)}</span>`).join('')
            : '';

        const techStackMarkup = project.techStack
            ? project.techStack.map(tech => `<span class="text-xs text-cyanAccent font-mono bg-bgDarker px-2 py-1 rounded border border-surfaceBorder">${this.escapeHTML(tech)}</span>`).join('')
            : '';

        return `
            <article class="glass-card p-6 sm:p-8 flex flex-col justify-between space-y-6 group relative overflow-hidden" data-id="${project.id}">
                <!-- Top Status & Category -->
                <div class="space-y-4">
                    <div class="flex items-center justify-between">
                        <span class="text-xs font-bold text-cyanAccent tracking-wider uppercase bg-cyanAccent/10 px-3 py-1 rounded-full border border-cyanAccent/20">
                            ${this.escapeHTML(project.category)}
                        </span>
                        <span class="text-xs font-mono text-gray-400 flex items-center gap-1">
                            <i class="fa-solid fa-check-circle text-green-400"></i> ${this.escapeHTML(project.status || 'Ready')}
                        </span>
                    </div>

                    <!-- Project Title -->
                    <h3 class="text-2xl font-bold text-white group-hover:text-cyanAccent transition-colors">
                        ${this.escapeHTML(project.title)}
                    </h3>

                    <!-- Project Short Description -->
                    <p class="text-gray-400 text-sm leading-relaxed">
                        ${this.escapeHTML(project.shortDescription)}
                    </p>

                    <!-- Feature Tags -->
                    <div class="flex flex-wrap gap-2 pt-2">
                        ${tagsMarkup}
                    </div>
                </div>

                <!-- Bottom Tech Stack & Action Trigger -->
                <div class="space-y-4 pt-4 border-t border-surfaceBorder">
                    <div class="flex flex-wrap gap-1.5">
                        ${techStackMarkup}
                    </div>

                    <button onclick="ArtavixApp.openProjectModal('${project.id}')" class="btn btn-outline w-full text-sm mt-2 flex items-center justify-center gap-2 group-hover:border-cyanAccent">
                        <i class="fa-solid fa-circle-info text-cyanAccent"></i>
                        <span>System Specifications & Demo</span>
                    </button>
                </div>
            </article>
        `;
    },

    // Open Modal for Detailed View
    openProjectModal(projectId) {
        const project = this.projectsData.find(p => p.id === projectId);
        if (!project) return;

        // Existing modal cleanup
        const existingModal = document.getElementById('project-detail-modal');
        if (existingModal) existingModal.remove();

        const modalHTML = `
            <div id="project-detail-modal" class="modal-backdrop active">
                <div class="modal-content relative space-y-6">
                    <!-- Close Button -->
                    <button onclick="ArtavixApp.closeModal()" class="absolute top-4 right-4 text-gray-400 hover:text-white text-xl p-2">
                        <i class="fa-solid fa-xmark"></i>
                    </button>

                    <!-- Modal Header -->
                    <div class="space-y-2">
                        <span class="text-xs text-cyanAccent uppercase tracking-widest font-bold">${this.escapeHTML(project.category)}</span>
                        <h3 class="text-2xl font-extrabold text-white">${this.escapeHTML(project.title)}</h3>
                    </div>

                    <!-- Full Description -->
                    <div class="space-y-3">
                        <h4 class="text-xs uppercase font-bold text-gray-400 tracking-wider">System Architecture & Capabilities</h4>
                        <p class="text-gray-300 text-sm leading-relaxed bg-bgDarker p-4 rounded-lg border border-surfaceBorder">
                            ${this.escapeHTML(project.fullDescription)}
                        </p>
                    </div>

                    <!-- Tech Stack Breakdown -->
                    <div class="space-y-2">
                        <h4 class="text-xs uppercase font-bold text-gray-400 tracking-wider">Full Tech Stack</h4>
                        <div class="flex flex-wrap gap-2">
                            ${project.techStack.map(t => `<span class="tag-pill text-cyanAccent border-cyanAccent/30">${this.escapeHTML(t)}</span>`).join('')}
                        </div>
                    </div>

                    <!-- Video Demo Placeholder/Link -->
                    <div class="p-4 rounded-lg bg-indigoPrimary/10 border border-indigoPrimary/30 flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <i class="fa-solid fa-video text-cyanAccent text-xl"></i>
                            <div>
                                <div class="text-sm font-bold text-white">Video Demonstration</div>
                                <div class="text-xs text-gray-400">Recorded walkthrough of architecture</div>
                            </div>
                        </div>
                        <a href="mailto:artavixai@gmail.com?subject=Demo Request: ${encodeURIComponent(project.title)}" class="btn btn-primary text-xs">
                            Request Demo
                        </a>
                    </div>

                    <!-- Action Footer -->
                    <div class="flex justify-end gap-3 pt-2">
                        <button onclick="ArtavixApp.closeModal()" class="btn btn-outline text-xs">Close</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    },

    // Close Modal Handler
    closeModal() {
        const modal = document.getElementById('project-detail-modal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
        }
    },

    // Global Listeners
    setupModalListeners() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeModal();
        });
    },

    // Utility: XSS Protection Helper
    escapeHTML(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
};