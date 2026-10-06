(function () {
    'use strict';

    async function fetchJson(path) {
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error(`Permintaan ${path} gagal: HTTP ${response.status} ${response.statusText}.`);
        }

        return response.json();
    }

    async function getProjects() {
        const projects = await fetchJson('data/projects.json');
        if (!Array.isArray(projects)) {
            throw new Error('Format data proyek tidak valid: data harus berupa array.');
        }

        const validProjects = projects.every(project =>
            project &&
            typeof project.id === 'string' &&
            typeof project.title === 'string' &&
            typeof project.description === 'string' &&
            typeof project.category === 'string' &&
            Array.isArray(project.tags) &&
            project.tags.every(tag => typeof tag === 'string') &&
            typeof project.image === 'string' &&
            typeof project.link === 'string' &&
            project.metrics &&
            typeof project.metrics === 'object' &&
            !Array.isArray(project.metrics)
        );

        if (!validProjects) {
            throw new Error('Format data proyek tidak valid: ada field proyek yang wajib tetapi tidak tersedia.');
        }

        return projects;
    }

    async function getProfile() {
        const profile = await fetchJson('data/profile.json');
        if (
            !profile ||
            typeof profile.nama !== 'string' ||
            typeof profile.nim !== 'string' ||
            typeof profile.programStudi !== 'string' ||
            typeof profile.institusi !== 'string' ||
            typeof profile.deskripsi !== 'string' ||
            !Array.isArray(profile.keahlian) ||
            !profile.keahlian.every(skill => typeof skill === 'string')
        ) {
            throw new Error('Format data profil tidak valid.');
        }

        return profile;
    }

    window.ApiService = { getProjects, getProfile };
})();
