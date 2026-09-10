// js/builds.js

import { syncToFirebase } from './firebase.js';

export let userBuilds = { poe1: [], poe2: [], d2: [], le: [], d4: [] };
export let editingIndex = { poe1: null, poe2: null, d2: null, le: null, d4: null };

export function loadMyBuildsUI() {
  ['poe1', 'poe2', 'd2', 'le', 'd4'].forEach(game => {
    const ul = document.getElementById(`my-builds-${game}`);
    if (!ul) return;
    ul.innerHTML = '';
    if (!userBuilds[game] || userBuilds[game].length === 0) {
      ul.innerHTML = '<li><span style="color: var(--text-muted); font-style:italic;">Nessuna build salvata.</span></li>';
      return;
    }
    userBuilds[game].forEach((build, index) => {
      ul.innerHTML += `<li><div class="dash-list-item-content"><a href="${build.link}" class="saved-link" target="_blank">${build.name}</a><span class="build-version">v. ${build.version || 'N/A'}</span><span class="build-note">- ${build.note || ''}</span></div><div class="dash-list-actions"><button class="edit-btn" onclick="window.editBuild('${game}', ${index})">✏️</button><button class="delete-btn" onclick="window.deleteBuild('${game}', ${index})">❌</button></div></li>`;
    });
  });
}

export function filterSavedBuilds(game) {
  let filter = document.getElementById(`filter-saved-${game}`).value.toLowerCase();
  let li = document.getElementById(`my-builds-${game}`)?.getElementsByTagName("li");
  if (!li) return;
  for (let i = 0; i < li.length; i++) {
    if (!li[i].innerText.includes("Nessuna build"))
      li[i].style.display = (li[i].innerText.toLowerCase().indexOf(filter) > -1) ? "" : "none";
  }
}

export function editBuild(game, index) {
  const build = userBuilds[game][index];
  document.getElementById(`name-${game}`).value = build.name;
  document.getElementById(`link-${game}`).value = build.link;
  document.getElementById(`version-${game}`).value = build.version;
  document.getElementById(`note-${game}`).value = build.note;
  editingIndex[game] = index;
  document.getElementById(`submit-btn-${game}`).textContent = "Aggiorna";
  document.getElementById(`cancel-btn-${game}`).style.display = "inline-block";
}

export function cancelEdit(game) {
  editingIndex[game] = null;
  document.getElementById(`form-${game}`).reset();
  document.getElementById(`submit-btn-${game}`).textContent = "Salva";
  document.getElementById(`cancel-btn-${game}`).style.display = "none";
}

export async function saveBuild(event, game) {
  event.preventDefault();
  const b = {
    name: document.getElementById(`name-${game}`).value,
    link: document.getElementById(`link-${game}`).value,
    version: document.getElementById(`version-${game}`).value,
    note: document.getElementById(`note-${game}`).value
  };
  if (!userBuilds[game]) userBuilds[game] = [];
  if (editingIndex[game] !== null) {
    userBuilds[game][editingIndex[game]] = b;
  } else {
    userBuilds[game].push(b);
  }
  await syncToFirebase(userBuilds);
  cancelEdit(game);
  loadMyBuildsUI();
}

export async function deleteBuild(game, index) {
  if (!confirm("Eliminare?")) return;
  userBuilds[game].splice(index, 1);
  await syncToFirebase(userBuilds);
  loadMyBuildsUI();
}

export async function quickSave(game, name, version, link) {
  if (!userBuilds[game]) userBuilds[game] = [];
  userBuilds[game].push({ name, link, version, note: "Dal Catalogo" });
  await syncToFirebase(userBuilds);
  loadMyBuildsUI();
  alert("Build Salvata!");
}

// Inizializza userBuilds da localStorage se non c'è Firebase
if (!localStorage.getItem('arpgBuildHubInitialized')) {
  const stored = localStorage.getItem('arpgBuildHub');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      ['poe1', 'poe2', 'd2', 'le', 'd4'].forEach(game => {
        if (parsed[game]) userBuilds[game] = parsed[game];
      });
    } catch (e) {
      console.warn("Errore nel parsing di arpgBuildHub da localStorage.", e);
    }
  }
  localStorage.setItem('arpgBuildHubInitialized', 'true');
}