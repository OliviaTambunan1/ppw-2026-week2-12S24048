(function () {
    'use strict';

    const projectGrid = document.getElementById('projectGrid');
    const projectFilters = document.getElementById('projectFilters');
    const projectSearch = document.getElementById('projectSearch');
    const projectEmpty = document.getElementById('projectEmpty');
    const projectError = document.getElementById('projectError');
    const projectStatus = document.getElementById('projectStatus');
    const projectTableBody = document.getElementById('projectTableBody');
    const projectTotal = document.getElementById('projectTotal');
    const projectModal = document.getElementById('universalProjectModal');
    const serviceForm = document.querySelector('.service-form');
    const serviceSelect = document.getElementById('service');
    const serviceCatalogStatus = document.getElementById('serviceCatalogStatus');
    const serviceCatalogError = document.getElementById('serviceCatalogError');
    const serviceSubmitButton = document.getElementById('serviceSubmitButton');
    const serviceOrderCount = document.getElementById('serviceOrderCount');
    const serviceToast = document.getElementById('serviceToast');
    const serviceToastTitle = document.getElementById('serviceToastTitle');
    const serviceToastMessage = document.getElementById('serviceToastMessage');
    const serviceToastInstance = window.bootstrap.Toast.getOrCreateInstance(serviceToast, {
        autohide: false
    });
    const serviceOrdersStorageKey = 'serviceOrders';

    let projects = [];
    let activeCategory = 'all';
    let searchQuery = '';
    let projectsLoaded = false;
    let servicesLoaded = false;
    let serviceOrders = [];
    let serviceOrdersAvailable = false;

    function createElement(tagName, className, text) {
        const element = document.createElement(tagName);
        if (className) {
            element.className = className;
        }
        if (text !== undefined) {
            element.textContent = text;
        }
        return element;
    }

    function setProfile(profile) {
        document.getElementById('profileName').textContent = profile.nama;
        document.getElementById('profileNim').textContent = `NIM: ${profile.nim}`;
        document.getElementById('profileEducation').textContent =
            `${profile.programStudi}, ${profile.institusi}`;
        document.getElementById('profileDescription').textContent = profile.deskripsi;

        const skills = document.getElementById('profileSkills');
        const items = profile.keahlian.map(skill => createElement('li', '', skill));
        skills.replaceChildren(...items);
    }

    function setProfileError(error) {
        const profileSkills = document.getElementById('profileSkills');
        profileSkills.replaceChildren();
        const alert = document.getElementById('profileError');
        alert.textContent = `Data profil tidak dapat dimuat. ${error.message}`;
        alert.classList.remove('d-none');
        console.error('Gagal memuat data profil:', error);
    }

    function createProjectCard(project) {
        const column = createElement('div', 'col');
        const article = createElement('article', 'card project-card h-100');
        const banner = createElement('div', 'project-banner');
        const image = createElement('img', 'project-image');
        image.src = project.image;
        image.alt = `Gambar proyek ${project.title}`;
        image.loading = 'lazy';
        banner.append(image);

        const body = createElement('div', 'card-body d-flex flex-column');
        const tags = createElement('div', 'mb-2');
        project.tags.forEach(tag => {
            tags.append(createElement('span', 'badge technology-badge', tag));
        });

        const title = createElement('h3', 'card-title', project.title);
        const description = createElement('p', 'card-text flex-grow-1', project.description);
        body.append(tags, title, description);

        const button = createElement('button', 'btn btn-card mt-auto', 'Lihat Detail');
        button.type = 'button';
        button.dataset.projectId = project.id;
        body.append(button);

        article.append(banner, body);
        column.append(article);
        return column;
    }

    function renderProjectTable() {
        const rows = projects.map(project => {
            const row = document.createElement('tr');
            const title = createElement('th', '', project.title);
            title.scope = 'row';
            row.append(
                title,
                createElement('td', '', project.tags.join(', ')),
                createElement('td', '', project.category)
            );

            const statusCell = document.createElement('td');
            const status = project.metrics.status || 'Status tidak tersedia';
            const badgeClass = status.toLowerCase() === 'selesai'
                ? 'status-badge status-done'
                : 'status-badge status-progress';
            statusCell.append(createElement('span', badgeClass, status));
            row.append(statusCell);
            return row;
        });

        projectTableBody.replaceChildren(...rows);
        projectTotal.textContent = String(projects.length);
    }

    function renderCategoryFilters() {
        const categories = [...new Set(projects.map(project => project.category))];
        const buttons = [
            { value: 'all', label: 'Semua' },
            ...categories.map(category => ({ value: category, label: category }))
        ].map(category => {
            const button = createElement('button', 'filter-btn', category.label);
            button.type = 'button';
            button.dataset.category = category.value;
            button.setAttribute('aria-pressed', String(category.value === activeCategory));
            if (category.value === activeCategory) {
                button.classList.add('active');
            }

            button.addEventListener('click', () => {
                activeCategory = category.value;
                projectFilters.querySelectorAll('button').forEach(filterButton => {
                    const isActive = filterButton.dataset.category === activeCategory;
                    filterButton.classList.toggle('active', isActive);
                    filterButton.setAttribute('aria-pressed', String(isActive));
                });
                renderProjects();
            });
            return button;
        });

        projectFilters.replaceChildren(...buttons);
    }

    function renderProjects() {
        const normalizedQuery = searchQuery.trim().toLocaleLowerCase('id');
        const visibleProjects = projects.filter(project => {
            const matchesCategory = activeCategory === 'all' || project.category === activeCategory;
            const searchableText = [
                project.title,
                project.description,
                ...project.tags
            ].join(' ').toLocaleLowerCase('id');
            return matchesCategory && searchableText.includes(normalizedQuery);
        });

        projectGrid.replaceChildren(...visibleProjects.map(createProjectCard));
        projectGrid.classList.toggle('d-none', visibleProjects.length === 0);
        projectEmpty.classList.toggle('d-none', visibleProjects.length !== 0);
        projectStatus.textContent = visibleProjects.length === 0
            ? 'Tidak ada proyek untuk ditampilkan.'
            : `${visibleProjects.length} proyek ditampilkan.`;
    }

    function setOptionalSection(sectionId, contentId, value) {
        const section = document.getElementById(sectionId);
        const content = document.getElementById(contentId);
        if (typeof value !== 'string' || value.trim() === '') {
            content.textContent = '';
            section.classList.add('d-none');
            return;
        }

        content.textContent = value;
        section.classList.remove('d-none');
    }

    function setProjectModal(project) {
        document.getElementById('projectModalTitle').textContent = project.title;
        document.getElementById('projectModalDescription').textContent = project.description;

        const image = document.getElementById('projectModalImage');
        image.src = project.image;
        image.alt = `Gambar proyek ${project.title}`;
        image.classList.remove('d-none');

        const tags = project.tags.map(tag => createElement('span', 'badge technology-badge', tag));
        document.getElementById('projectModalTags').replaceChildren(...tags);

        const featuresSection = document.getElementById('projectModalFeaturesSection');
        const featuresList = document.getElementById('projectModalFeatures');
        if (Array.isArray(project.features) && project.features.length > 0) {
            const featureItems = project.features.map(feature => createElement('li', '', feature));
            featuresList.replaceChildren(...featureItems);
            featuresSection.classList.remove('d-none');
        } else {
            featuresList.replaceChildren();
            featuresSection.classList.add('d-none');
        }

        setOptionalSection('projectModalDetailSection', 'projectModalDetail', project.detail);
        setOptionalSection(
            'projectModalTechnologySection',
            'projectModalTechnology',
            project.teknologiDetail
        );

        const projectLink = document.getElementById('projectModalLink');
        const linkPlaceholder = document.getElementById('projectModalLinkPlaceholder');
        let safeUrl;
        try {
            safeUrl = new URL(project.link, window.location.href);
        } catch {
            safeUrl = null;
        }

        if (
            safeUrl &&
            ['http:', 'https:'].includes(safeUrl.protocol) &&
            !project.link.startsWith('[')
        ) {
            projectLink.href = safeUrl.href;
            projectLink.classList.remove('d-none');
            linkPlaceholder.classList.add('d-none');
            linkPlaceholder.textContent = '';
        } else {
            projectLink.removeAttribute('href');
            projectLink.classList.add('d-none');
            linkPlaceholder.textContent = `Repositori proyek: ${project.link}`;
            linkPlaceholder.classList.remove('d-none');
        }
    }

    function openProjectModal(projectId, trigger) {
        const project = projects.find(item => item.id === projectId);
        if (!project) {
            console.error('Modal proyek tidak dapat dibuka: ID proyek tidak ditemukan.', projectId);
            return;
        }

        setProjectModal(project);
        window.bootstrap.Modal.getOrCreateInstance(projectModal).show(trigger);
    }

    function showServiceToast(title, message, variant) {
        serviceToastTitle.textContent = title;
        serviceToastMessage.textContent = message;
        serviceToast.classList.remove('text-bg-success', 'text-bg-danger', 'text-bg-warning');
        serviceToast.classList.add(`text-bg-${variant}`);
        serviceToastInstance.show();
    }

    function renderServiceOrderCount() {
        serviceOrderCount.textContent = String(serviceOrders.length);
        serviceOrderCount.setAttribute(
            'aria-label',
            `${serviceOrders.length} pesanan tersimpan`
        );
        serviceOrderCount.classList.remove('text-bg-danger');
        serviceOrderCount.classList.add('text-bg-secondary');
    }

    function readServiceOrders() {
        const storedOrders = window.localStorage.getItem(serviceOrdersStorageKey);
        if (storedOrders === null) {
            return [];
        }

        let parsedOrders;
        try {
            parsedOrders = JSON.parse(storedOrders);
        } catch (error) {
            throw new Error('Data pesanan tersimpan bukan JSON yang valid.', { cause: error });
        }

        const validOrders = Array.isArray(parsedOrders) && parsedOrders.every(order =>
            order &&
            typeof order === 'object' &&
            !Array.isArray(order) &&
            typeof order.name === 'string' &&
            typeof order.email === 'string' &&
            typeof order.phone === 'string' &&
            typeof order.service === 'string'
        );
        if (!validOrders) {
            throw new Error('Format data pesanan tersimpan tidak valid.');
        }

        return parsedOrders;
    }

    function setServiceOrderStorageUnavailable(error) {
        serviceOrdersAvailable = false;
        serviceOrderCount.textContent = '!';
        serviceOrderCount.setAttribute('aria-label', 'Data pesanan tersimpan tidak tersedia');
        serviceOrderCount.classList.remove('text-bg-secondary');
        serviceOrderCount.classList.add('text-bg-danger');
        console.error('State pesanan lokal tidak dapat dimuat:', error);
        showServiceToast(
            'Penyimpanan tidak tersedia',
            `Data pesanan lokal tidak dapat dibaca. ${error.message}`,
            'warning'
        );
    }

    function initializeServiceOrders() {
        try {
            serviceOrders = readServiceOrders();
            serviceOrdersAvailable = true;
            renderServiceOrderCount();
        } catch (error) {
            setServiceOrderStorageUnavailable(error);
        }
    }

    function saveServiceOrder(payload) {
        if (!serviceOrdersAvailable) {
            throw new Error('State pesanan lokal belum dapat dibaca; permintaan tidak disimpan di perangkat ini.');
        }

        const nextOrders = [...serviceOrders, payload];
        window.localStorage.setItem(serviceOrdersStorageKey, JSON.stringify(nextOrders));
        serviceOrders = nextOrders;
        renderServiceOrderCount();
    }

    function renderServices(services) {
        const placeholder = createElement('option', '', 'Pilih layanan');
        placeholder.value = '';
        placeholder.disabled = true;
        placeholder.selected = true;
        const options = services.map(service => {
            const option = createElement('option', '', service.nama);
            option.value = service.id;
            return option;
        });

        serviceSelect.replaceChildren(placeholder, ...options);
        serviceSelect.disabled = false;
        serviceCatalogStatus.classList.add('d-none');
        serviceCatalogError.classList.add('d-none');
        servicesLoaded = true;
    }

    async function loadServices() {
        try {
            const services = await window.ApiService.getServices();
            renderServices(services);
        } catch (error) {
            serviceCatalogStatus.classList.add('d-none');
            serviceCatalogError.textContent = `Katalog layanan tidak dapat dimuat. ${error.message}`;
            serviceCatalogError.classList.remove('d-none');
            console.error('Gagal memuat katalog layanan:', error);
        }
    }

    function setServiceSubmitState(isSubmitting) {
        serviceSubmitButton.disabled = isSubmitting;
        if (isSubmitting) {
            const spinner = createElement('span', 'spinner-border spinner-border-sm me-2');
            spinner.setAttribute('aria-hidden', 'true');
            const label = createElement('span', '', 'Mengirim...');
            serviceSubmitButton.replaceChildren(spinner, label);
            return;
        }

        const icon = createElement('i', 'bi bi-send me-2');
        icon.setAttribute('aria-hidden', 'true');
        serviceSubmitButton.replaceChildren(icon, document.createTextNode('Kirim Permintaan'));
    }

    function createServiceOrderPayload(form) {
        const formData = new FormData(form);
        const payload = Object.fromEntries(formData.entries());
        payload.budget = payload.budget === '' ? null : Number(payload.budget);
        payload.date = payload.date || null;
        payload.tambahan = formData.getAll('tambahan');
        payload.agreement = formData.has('agreement');
        return payload;
    }

    async function submitServiceOrder(event) {
        event.preventDefault();
        serviceForm.classList.add('was-validated');
        if (!serviceForm.checkValidity()) {
            return;
        }

        if (!servicesLoaded) {
            showServiceToast(
                'Katalog layanan belum siap',
                'Muat ulang halaman atau coba kembali setelah daftar layanan tersedia.',
                'warning'
            );
            return;
        }

        setServiceSubmitState(true);
        const payload = createServiceOrderPayload(serviceForm);
        try {
            await window.ApiService.submitServiceOrder(payload);
        } catch (error) {
            console.error('Gagal mengirim permintaan layanan:', error);
            showServiceToast(
                'Pengiriman gagal',
                `Permintaan layanan tidak dapat dikirim. ${error.message}`,
                'danger'
            );
            setServiceSubmitState(false);
            return;
        }

        try {
            saveServiceOrder(payload);
        } catch (error) {
            console.error('Permintaan terkirim, tetapi state pesanan lokal gagal disimpan:', error);
            showServiceToast(
                'Permintaan terkirim',
                `API mock menerima permintaan, tetapi pesanan tidak tersimpan di perangkat ini. ${error.message}`,
                'warning'
            );
            setServiceSubmitState(false);
            return;
        }

        serviceForm.reset();
        serviceForm.classList.remove('was-validated');
        showServiceToast(
            'Permintaan berhasil dikirim',
            'API mock menerima permintaan dan pesanan tersimpan di perangkat ini.',
            'success'
        );
        setServiceSubmitState(false);
    }

    function setProjectError(error) {
        projectGrid.replaceChildren();
        projectGrid.classList.add('d-none');
        projectFilters.classList.add('d-none');
        projectEmpty.classList.add('d-none');
        projectError.textContent = `Data proyek tidak dapat dimuat. ${error.message}`;
        projectError.classList.remove('d-none');
        projectStatus.textContent = 'Terjadi kesalahan saat memuat proyek.';
        console.error('Gagal memuat data proyek:', error);
    }

    async function loadProfile() {
        try {
            const profile = await window.ApiService.getProfile();
            setProfile(profile);
        } catch (error) {
            setProfileError(error);
        }
    }

    async function loadProjects() {
        try {
            projects = await window.ApiService.getProjects();
            projectsLoaded = true;
            renderCategoryFilters();
            renderProjectTable();
            renderProjects();
        } catch (error) {
            setProjectError(error);
        }
    }

    projectSearch.addEventListener('input', event => {
        searchQuery = event.currentTarget.value;
        if (projectsLoaded) {
            renderProjects();
        }
    });

    projectGrid.addEventListener('click', event => {
        const trigger = event.target instanceof Element
            ? event.target.closest('button[data-project-id]')
            : null;
        if (trigger && projectGrid.contains(trigger)) {
            openProjectModal(trigger.dataset.projectId, trigger);
        }
    });

    serviceForm.addEventListener('submit', submitServiceOrder);
    window.addEventListener('storage', event => {
        if (event.key !== serviceOrdersStorageKey && event.key !== null) {
            return;
        }

        try {
            serviceOrders = readServiceOrders();
            serviceOrdersAvailable = true;
            renderServiceOrderCount();
        } catch (error) {
            setServiceOrderStorageUnavailable(error);
        }
    });

    loadProfile();
    loadProjects();
    loadServices();
    initializeServiceOrders();
})();
