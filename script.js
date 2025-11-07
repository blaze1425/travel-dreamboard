// Travel Dream Board — script.js

// DOM refs
const loginSection = document.getElementById('loginSection');
const dashboard = document.getElementById('dashboard');
const nameInput = document.getElementById('nameInput');
const loginBtn = document.getElementById('loginBtn');
const userinfo = document.getElementById('userinfo');
const logoutBtn = document.getElementById('logoutBtn');

const btnDestinations = document.getElementById('btnDestinations');
const btnBoards = document.getElementById('btnBoards');
const btnCreateDestination = document.getElementById('btnCreateDestination');
const btnCreateBoard = document.getElementById('btnCreateBoard');

const contentArea = document.getElementById('contentArea');

const modal = document.getElementById('modal');
const modalBody = document.getElementById('modalBody');
const modalClose = document.getElementById('modalClose');

// Data model in localStorage
const STORAGE_KEY = 'travel_dreamboard_v1';

// Default seed data
const defaultState = {
  users: [],
  destinations: [
    { id: 'd1', title: 'Santorini, Greece', location: 'Greece', description: 'Beautiful sunsets and white-washed buildings', imageUrl: '', status: 'dreaming', priority: 'high', date: '', notes: 'Must visit the blue domes', boardId: null, userId: null },
    { id: 'd2', title: 'Tokyo, Japan', location: 'Japan', description: 'Experience the blend of traditional and modern culture', imageUrl: '', status: 'planned', priority: 'high', date: '2025-06-15', notes: 'Plan for cherry blossom season', boardId: null, userId: null }
  ],
  boards: [
    { id: 'b1', title: 'European Adventure', description: 'Dream destinations in Europe', userId: null, destinationIds: [] },
    { id: 'b2', title: 'Asian Journey', description: 'Exploring Asia', userId: null, destinationIds: [] }
  ]
};

function loadState(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultState));
    return JSON.parse(JSON.stringify(defaultState));
  }
  return JSON.parse(raw);
}

function saveState(s){ localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); }

let state = loadState();
let currentUser = null; // {id, name}

// Utility
function uid(prefix='id'){ return prefix + Math.random().toString(36).slice(2,9); }

// Auth
loginBtn.addEventListener('click', () => {
  const name = nameInput.value.trim();
  if (!name) return alert('Enter your name');

  const user = { id: uid('u'), name };
  state.users.push(user);
  saveState(state);
  currentUser = user;
  showDashboard();
});

logoutBtn.addEventListener('click', () => {
  currentUser = null;
  loginSection.classList.remove('hidden');
  dashboard.classList.add('hidden');
  userinfo.textContent = '';
  nameInput.value = '';
});

// Dashboard UI
function showDashboard(){
  loginSection.classList.add('hidden');
  dashboard.classList.remove('hidden');
  userinfo.textContent = `👋 ${currentUser.name}`;
  showDestinations();
}

// Show destinations view
btnDestinations.addEventListener('click', showDestinations);

function showDestinations(){
  contentArea.innerHTML = '';
  const header = document.createElement('div');
  header.className = 'card';
  header.innerHTML = `<h2>🌍 My Destinations</h2><p class="small">Your travel wishlist and planned trips</p>`;
  contentArea.appendChild(header);

  const userDests = state.destinations.filter(d => d.userId === currentUser.id);
  const allDests = userDests.length > 0 ? userDests : state.destinations.filter(d => !d.userId);

  if (allDests.length === 0){
    const empty = document.createElement('div');
    empty.className = 'card small';
    empty.innerHTML = '<p>No destinations yet. Add your first dream destination!</p>';
    contentArea.appendChild(empty);
    return;
  }

  // Group by status
  const grouped = {
    dreaming: allDests.filter(d => d.status === 'dreaming'),
    planned: allDests.filter(d => d.status === 'planned'),
    visited: allDests.filter(d => d.status === 'visited')
  };

  ['dreaming', 'planned', 'visited'].forEach(status => {
    if (grouped[status].length === 0) return;
    
    const statusHeader = document.createElement('div');
    statusHeader.className = 'card';
    const statusLabels = { dreaming: '💭 Dreaming', planned: '📅 Planned', visited: '✅ Visited' };
    statusHeader.innerHTML = `<h3 style="margin:0;color:#666;font-size:1rem">${statusLabels[status]}</h3>`;
    contentArea.appendChild(statusHeader);

    grouped[status].forEach(dest => {
      const card = document.createElement('div');
      card.className = 'destination-card';
      const priorityColors = { high: '#ff6b6b', medium: '#ffa500', low: '#4ecdc4' };
      const statusColors = { dreaming: '#9b59b6', planned: '#3498db', visited: '#2ecc71' };
      
      card.innerHTML = `
        <div class="dest-header" style="background: linear-gradient(135deg, ${statusColors[dest.status] || '#95a5a6'}, ${priorityColors[dest.priority] || '#bdc3c7'}); padding: 15px; color: white;">
          <h3 style="margin:0;color:white;">${dest.title}</h3>
          <div class="meta" style="color:rgba(255,255,255,0.9);padding:5px 0 0 0;">📍 ${dest.location}</div>
        </div>
        <div style="padding:15px;">
          <p class="small">${dest.description || ''}</p>
          ${dest.date ? `<div class="meta">📅 ${dest.date}</div>` : ''}
          ${dest.priority ? `<div class="meta">⭐ Priority: ${dest.priority}</div>` : ''}
          <div class="btn-row" style="margin-top:10px">
            <button class="btn secondary" data-action="view" data-id="${dest.id}">View Details</button>
            <button class="btn secondary" data-action="edit" data-id="${dest.id}">Edit</button>
            <button class="btn delete-btn" data-action="delete" data-id="${dest.id}">Delete</button>
          </div>
        </div>
      `;
      contentArea.appendChild(card);
    });
  });

  // attach listeners
  contentArea.querySelectorAll('[data-action]').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      const action = btn.getAttribute('data-action');
      const id = btn.getAttribute('data-id');
      if (action === 'view') openViewDestination(id);
      if (action === 'edit') openEditDestination(id);
      if (action === 'delete') deleteDestination(id);
    });
  });
}

// Show boards view
btnBoards.addEventListener('click', showBoards);

function showBoards(){
  contentArea.innerHTML = '';
  const header = document.createElement('div');
  header.className = 'card';
  header.innerHTML = `<h2>📋 Travel Boards</h2><p class="small">Organize your destinations into themed boards</p>`;
  contentArea.appendChild(header);

  const userBoards = state.boards.filter(b => b.userId === currentUser.id);
  const allBoards = userBoards.length > 0 ? userBoards : state.boards.filter(b => !b.userId);

  if (allBoards.length === 0){
    const empty = document.createElement('div');
    empty.className = 'card small';
    empty.innerHTML = '<p>No boards yet. Create your first travel board!</p>';
    contentArea.appendChild(empty);
    return;
  }

  allBoards.forEach(board => {
    const destCount = state.destinations.filter(d => d.boardId === board.id).length;
    const card = document.createElement('div');
    card.className = 'board-card';
    card.innerHTML = `
      <h3>${board.title}</h3>
      <div class="meta">${destCount} destination${destCount !== 1 ? 's' : ''}</div>
      <p class="small">${board.description || ''}</p>
      <div class="btn-row" style="margin-top:10px">
        <button class="btn" data-action="viewBoard" data-id="${board.id}">View Board</button>
        <button class="btn secondary" data-action="editBoard" data-id="${board.id}">Edit</button>
        <button class="btn delete-btn" data-action="deleteBoard" data-id="${board.id}">Delete</button>
      </div>
    `;
    contentArea.appendChild(card);
  });

  contentArea.querySelectorAll('[data-action]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const action = btn.getAttribute('data-action');
      const id = btn.getAttribute('data-id');
      if (action === 'viewBoard') openViewBoard(id);
      if (action === 'editBoard') openEditBoard(id);
      if (action === 'deleteBoard') deleteBoard(id);
    });
  });
}

// View destination
function openViewDestination(destId){
  const dest = state.destinations.find(d => d.id === destId);
  if (!dest) return;
  modalBody.innerHTML = `
    <h3>${dest.title}</h3>
    <div class="meta">📍 ${dest.location}</div>
    <p><strong>Status:</strong> ${dest.status}</p>
    <p><strong>Priority:</strong> ${dest.priority || 'Not set'}</p>
    ${dest.date ? `<p><strong>Date:</strong> ${dest.date}</p>` : ''}
    <p><strong>Description:</strong></p>
    <p>${dest.description || 'No description'}</p>
    ${dest.notes ? `<p><strong>Notes:</strong></p><p>${dest.notes}</p>` : ''}
    ${dest.imageUrl ? `<img src="${dest.imageUrl}" style="max-width:100%;border-radius:10px;margin-top:10px;" onerror="this.style.display='none'">` : ''}
  `;
  modal.classList.remove('hidden');
  setTimeout(initCloseButton, 10);
}

// Helper to show modal and re-init close button
function showModal() {
  modal.classList.remove('hidden');
  setTimeout(initCloseButton, 10);
}

// Create/Edit destination
btnCreateDestination.addEventListener('click', () => openEditDestination(null));

function openEditDestination(destId){
  const dest = destId ? state.destinations.find(d => d.id === destId) : null;
  modalBody.innerHTML = `
    <h3>${dest ? 'Edit' : 'Add'} Destination</h3>
    <input id="destTitle" placeholder="Destination name (e.g., Paris, France)" value="${dest ? dest.title : ''}" />
    <input id="destLocation" placeholder="Location/Country" value="${dest ? dest.location : ''}" />
    <textarea id="destDesc" placeholder="Description">${dest ? dest.description : ''}</textarea>
    <input id="destImage" placeholder="Image URL (optional)" value="${dest ? dest.imageUrl : ''}" />
    <select id="destStatus">
      <option value="dreaming" ${dest && dest.status === 'dreaming' ? 'selected' : ''}>💭 Dreaming</option>
      <option value="planned" ${dest && dest.status === 'planned' ? 'selected' : ''}>📅 Planned</option>
      <option value="visited" ${dest && dest.status === 'visited' ? 'selected' : ''}>✅ Visited</option>
    </select>
    <select id="destPriority">
      <option value="high" ${dest && dest.priority === 'high' ? 'selected' : ''}>⭐ High Priority</option>
      <option value="medium" ${dest && dest.priority === 'medium' ? 'selected' : ''}>⭐ Medium Priority</option>
      <option value="low" ${dest && dest.priority === 'low' ? 'selected' : ''}>⭐ Low Priority</option>
    </select>
    <input id="destDate" type="date" placeholder="Planned date (optional)" value="${dest ? dest.date : ''}" />
    <textarea id="destNotes" placeholder="Notes (optional)">${dest ? dest.notes : ''}</textarea>
    <button id="saveDestBtn" class="btn">${dest ? 'Update' : 'Add'} Destination</button>
  `;
  showModal();
  
  document.getElementById('saveDestBtn').addEventListener('click', ()=>{
    const title = document.getElementById('destTitle').value.trim();
    const location = document.getElementById('destLocation').value.trim();
    if (!title) return alert('Destination name is required');
    
    const destData = {
      title,
      location: location || title,
      description: document.getElementById('destDesc').value.trim(),
      imageUrl: document.getElementById('destImage').value.trim(),
      status: document.getElementById('destStatus').value,
      priority: document.getElementById('destPriority').value,
      date: document.getElementById('destDate').value,
      notes: document.getElementById('destNotes').value.trim(),
      userId: currentUser.id,
      boardId: dest ? dest.boardId : null
    };

    if (dest) {
      Object.assign(dest, destData);
    } else {
      destData.id = uid('d');
      state.destinations.push(destData);
    }
    saveState(state);
    modal.classList.add('hidden');
    showDestinations();
  });
}

// Delete destination
function deleteDestination(destId){
  if (!confirm('Are you sure you want to delete this destination?')) return;
  state.destinations = state.destinations.filter(d => d.id !== destId);
  saveState(state);
  showDestinations();
}

// Create/Edit board
btnCreateBoard.addEventListener('click', () => openEditBoard(null));

function openEditBoard(boardId){
  const board = boardId ? state.boards.find(b => b.id === boardId) : null;
  modalBody.innerHTML = `
    <h3>${board ? 'Edit' : 'Create'} Travel Board</h3>
    <input id="boardTitle" placeholder="Board name" value="${board ? board.title : ''}" />
    <textarea id="boardDesc" placeholder="Description">${board ? board.description : ''}</textarea>
    <button id="saveBoardBtn" class="btn">${board ? 'Update' : 'Create'} Board</button>
  `;
  showModal();
  
  document.getElementById('saveBoardBtn').addEventListener('click', ()=>{
    const title = document.getElementById('boardTitle').value.trim();
    if (!title) return alert('Board name is required');
    
    if (board) {
      board.title = title;
      board.description = document.getElementById('boardDesc').value.trim();
    } else {
      state.boards.push({
        id: uid('b'),
        title,
        description: document.getElementById('boardDesc').value.trim(),
        userId: currentUser.id,
        destinationIds: []
      });
    }
    saveState(state);
    modal.classList.add('hidden');
    showBoards();
  });
}

// View board
function openViewBoard(boardId){
  const board = state.boards.find(b => b.id === boardId);
  if (!board) return;
  
  const boardDests = state.destinations.filter(d => d.boardId === boardId);
  let html = `<h3>${board.title}</h3><p>${board.description || ''}</p><hr/>`;
  
  if (boardDests.length === 0) {
    html += '<p class="small">No destinations in this board yet.</p>';
  } else {
    boardDests.forEach(dest => {
      html += `
        <div style="margin-bottom:15px;padding:10px;background:#f5f7ff;border-radius:8px;">
          <strong>${dest.title}</strong> - ${dest.location}
          <button class="btn secondary" style="float:right;padding:5px 10px;font-size:0.85rem;" data-action="removeFromBoard" data-dest="${dest.id}" data-board="${boardId}">Remove</button>
        </div>
      `;
    });
  }
  
  html += `<hr/><h4>Add Destination to Board</h4>`;
  const availableDests = state.destinations.filter(d => d.userId === currentUser.id && d.boardId !== boardId);
  if (availableDests.length === 0) {
    html += '<p class="small">No available destinations. Create destinations first!</p>';
  } else {
    html += `<select id="addDestSelect"><option value="">Select destination...</option>`;
    availableDests.forEach(d => {
      html += `<option value="${d.id}">${d.title} - ${d.location}</option>`;
    });
    html += `</select><button id="addToBoardBtn" class="btn">Add to Board</button>`;
  }
  
  modalBody.innerHTML = html;
  showModal();
  
  modalBody.querySelectorAll('[data-action="removeFromBoard"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const destId = btn.getAttribute('data-dest');
      const dest = state.destinations.find(d => d.id === destId);
      if (dest) {
        dest.boardId = null;
        saveState(state);
        openViewBoard(boardId);
      }
    });
  });
  
  const addBtn = document.getElementById('addToBoardBtn');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      const destId = document.getElementById('addDestSelect').value;
      if (!destId) return alert('Select a destination');
      const dest = state.destinations.find(d => d.id === destId);
      if (dest) {
        dest.boardId = boardId;
        saveState(state);
        openViewBoard(boardId);
      }
    });
  }
}

// Delete board
function deleteBoard(boardId){
  if (!confirm('Are you sure you want to delete this board? Destinations will not be deleted.')) return;
  // Remove board reference from destinations
  state.destinations.forEach(d => {
    if (d.boardId === boardId) d.boardId = null;
  });
  state.boards = state.boards.filter(b => b.id !== boardId);
  saveState(state);
  showBoards();
}

// Close modal function
function closeModal() {
  if (modal) {
    modal.classList.add('hidden');
  }
}

// Set up close button handler - re-initialize every time modal opens
function initCloseButton() {
  const closeBtn = document.getElementById('modalClose');
  if (closeBtn) {
    // Remove all existing listeners by cloning and replacing
    const newBtn = closeBtn.cloneNode(true);
    closeBtn.parentNode.replaceChild(newBtn, closeBtn);
    
    // Set up fresh handlers
    newBtn.onclick = function(e) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      closeModal();
      return false;
    };
    
    newBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      closeModal();
      return false;
    }, true);
    
    newBtn.addEventListener('mousedown', function(e) {
      e.preventDefault();
      e.stopPropagation();
      closeModal();
      return false;
    }, true);
    
    newBtn.addEventListener('touchstart', function(e) {
      e.preventDefault();
      e.stopPropagation();
      closeModal();
      return false;
    }, true);
  }
}

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    initCloseButton();
    // Re-initialize whenever modal is shown
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          if (!modal.classList.contains('hidden')) {
            setTimeout(initCloseButton, 50);
          }
        }
      });
    });
    observer.observe(modal, { attributes: true, attributeFilter: ['class'] });
  });
} else {
  initCloseButton();
  // Re-initialize whenever modal is shown
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        if (!modal.classList.contains('hidden')) {
          setTimeout(initCloseButton, 50);
        }
      }
    });
  });
  if (modal) {
    observer.observe(modal, { attributes: true, attributeFilter: ['class'] });
  }
}

// Event delegation as ultimate backup - check for close button
document.addEventListener('click', function(e) {
  const target = e.target;
  if (target && (target.id === 'modalClose' || target.classList.contains('close-btn') || target.closest('#modalClose'))) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    closeModal();
    return false;
  }
}, true); // Use capture phase

// Close on background click
if (modal) {
  modal.addEventListener('click', function(e) { 
    if (e.target === modal) {
      closeModal();
    }
  });
}

// Close with Escape key
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
    closeModal();
  }
});
