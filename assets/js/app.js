/**
 * Artavix Enterprise Core Application Engine
 * Handles JSON Data Ingestion, Dynamic Portfolio Rendering, Modals, Live Visitor Counter, and Direct Form Submission.
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
        this.initVisitorCounter();
        this.setupModalListeners();
    },

    // Set Dynamic Copyright Year
    updateYear() {
        const yearElem = document.getElementById('year');
        if (yearElem) {
            yearElem.textContent = new Date().getFullYear();
        }
    },

    // Live Visitor Counter API
    async initVisitorCounter() {
        const counterElem = document.getElementById('visitor-count');
        if (!counterElem) return;

        try {
            // Free Privacy-Friendly Counter API
            const response = await fetch('https://api.counterapi.dev/v1/artavix-studio-official/visits/up');
            if (!response.ok) throw new Error('Counter API unreachable');
            
            const data = await response.json();
            if (data && data.count) {
                counterElem.textContent = Number(data.count).toLocaleString();
            } else {
                counterElem.textContent = '1,284'; // Fallback display
            }
        } catch (error) {
            console.warn('Visitor counter offline, using fallback:', error);
            counterElem.textContent = '1,284';
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

        // Smart Action Button: If demoVideoUrl has a custom showcase page/link, navigate directly!
        const actionButtonMarkup = project.demoVideoUrl && project.demoVideoUrl.trim() !== ''
            ? `<a href="${this.escapeHTML(project.demoVideoUrl)}" class="btn btn-primary w-full text-sm mt-2 flex items-center justify-center gap-2">
                 <i class="fa-solid fa-arrow-up-right-from-square"></i>
                 <span>Explore Dedicated System Showcase</span>
               </a>`
            : `<button onclick="ArtavixApp.openProjectModal('${project.id}')" class="btn btn-outline w-full text-sm mt-2 flex items-center justify-center gap-2 group-hover:border-cyanAccent">
                 <i class="fa-solid fa-circle-info text-cyanAccent"></i>
                 <span>System Specifications & Demo</span>
               </button>`;

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

                    ${actionButtonMarkup}
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

        const demoBtnMarkup = project.demoVideoUrl && project.demoVideoUrl.trim() !== ''
            ? `<a href="${this.escapeHTML(project.demoVideoUrl)}" class="btn btn-primary text-xs flex items-center gap-1">
                 <i class="fa-solid fa-rocket"></i> Launch Dedicated Page
               </a>`
            : `<button onclick="ArtavixApp.closeModal(); ArtavixApp.openContactModal('Demo Request: ${this.escapeHTML(project.title)}');" class="btn btn-primary text-xs">
                 Request Demo
               </button>`;

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

                    <!-- Video Demo / Dedicated Page Link -->
                    <div class="p-4 rounded-lg bg-indigoPrimary/10 border border-indigoPrimary/30 flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <i class="fa-solid fa-laptop-code text-cyanAccent text-xl"></i>
                            <div>
                                <div class="text-sm font-bold text-white">Full System Showcase</div>
                                <div class="text-xs text-gray-400">Detailed architecture and interactive live specs</div>
                            </div>
                        </div>
                        ${demoBtnMarkup}
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

    // Contact/Demo Request Modal Handlers
    openContactModal(subjectPreset) {
        const modal = document.getElementById('contact-modal');
        const subjectInput = document.getElementById('contact-subject');
        const successMsg = document.getElementById('contact-success-msg');
        const form = document.getElementById('contact-form');

        if (modal) {
            if (subjectInput && subjectPreset) {
                subjectInput.value = subjectPreset;
            }
            if (successMsg) successMsg.classList.add('hidden');
            if (form) form.classList.remove('hidden');
            modal.classList.add('active');
        }
    },

    closeContactModal() {
        const modal = document.getElementById('contact-modal');
        if (modal) {
            modal.classList.remove('active');
        }
    },

    // Serverless Direct Form Submission to artavixai@gmail.com
    async handleContactSubmit(event) {
        event.preventDefault();

        const btn = document.getElementById('contact-submit-btn');
        const form = document.getElementById('contact-form');
        const successMsg = document.getElementById('contact-success-msg');

        const name = document.getElementById('contact-name').value.trim();
        const email = document.getElementById('contact-email').value.trim();
        const subject = document.getElementById('contact-subject').value.trim();
        const message = document.getElementById('contact-message').value.trim();

        if (!name || !email || !message) return;

        btn.disabled = true;
        btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Submitting Request...`;

        try {
            // Direct Serverless Submission via FormSubmit
            const response = await fetch('https://formsubmit.co/ajax/artavixai@gmail.com', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    name: name,
                    email: email,
                    _subject: `Artavix Studio Inquiry: ${subject || 'New Demo Request'}`,
                    message: message,
                    _template: 'table'
                })
            });

            if (response.ok) {
                form.classList.add('hidden');
                successMsg.classList.remove('hidden');
                form.reset();
            } else {
                throw new Error('Submission failed');
            }
        } catch (error) {
            console.error('Contact Form Error:', error);
            alert('Unable to submit inquiry automatically. Please send a direct email to artavixai@gmail.com.');
        } finally {
            btn.disabled = false;
            btn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Submit Inquiry`;
        }
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
            if (e.key === 'Escape') {
                this.closeModal();
                this.closeContactModal();
            }
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