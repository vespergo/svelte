<script>
  import { onDestroy } from 'svelte';
  import {
    collection,
    query,
    orderBy,
    limit,
    where,
    addDoc,
    deleteDoc,
    doc,
    onSnapshot,
  } from 'firebase/firestore';
  import { db } from './firebase';
  import NoteCard from './NoteCard.svelte';

  export let user;

  let notes = [];
  let selectedNoteIds = new Set();
  let deletingSelected = false;
  let deleteError = null;
  let loading = true;
  let error = null;
  $: hasSelection = selectedNoteIds.size > 0;
  let pageLimit = 10;
  let hasMore = false;

  let newTitle = '';
  let newText = '';
  let newTagsStr = '';
  let adding = false;
  let addError = null;

  let searchTerm = '';
  let viewMode = 'grid';
  let selectMode = false;

  let unsubscribe;

  function setupListener(lim) {
    selectedNoteIds.clear();
    deleteError = null;
    if (unsubscribe) unsubscribe();
    loading = true;
    error = null;
    try {
      const q = query(
        collection(db, 'notes'),
        where('uid', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(lim + 1)
      );
      unsubscribe = onSnapshot(
        q,
        (snap) => {
          const docs = snap.docs.map((d) => ({ docId: d.id, ...d.data() }));
          hasMore = docs.length > lim;
          notes = docs.slice(0, lim);
          loading = false;
        },
        (e) => {
          error = e.message;
          loading = false;
        }
      );
    } catch (e) {
      error = e.message;
      loading = false;
    }
  }

  $: setupListener(pageLimit);

  onDestroy(() => {
    if (unsubscribe) unsubscribe();
  });

  $: filteredNotes = searchTerm.trim()
    ? notes.filter(
        (n) =>
          (n.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (n.text || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (n.tags || []).some((t) =>
            t.toLowerCase().includes(searchTerm.toLowerCase())
          )
      )
    : notes;

  function toggleNoteSelected(noteId) {
    const nextSelectedNoteIds = new Set(selectedNoteIds);
    if (nextSelectedNoteIds.has(noteId)) {
      nextSelectedNoteIds.delete(noteId);
    } else {
      nextSelectedNoteIds.add(noteId);
    }
    selectedNoteIds = nextSelectedNoteIds;
  }

  function selectAllFiltered() {
    selectedNoteIds = new Set(filteredNotes.map((note) => note.docId));
  }

  function clearSelection() {
    selectedNoteIds = new Set();
  }

  async function deleteSelectedNotes() {
    if (selectedNoteIds.size === 0) return;

    deletingSelected = true;
    deleteError = null;
    try {
      await Promise.all(
        Array.from(selectedNoteIds).map(id =>
          deleteDoc(doc(db, 'notes', id))
        )
      );
      selectedNoteIds = new Set();
    } catch (e) {
      deleteError = e.message;
    } finally {
      deletingSelected = false;
    }
  }

  async function addNote() {
    if (!newTitle.trim() && !newText.trim()) return;
    adding = true;
    addError = null;
    try {
      const tags = newTagsStr
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      await addDoc(collection(db, 'notes'), {
        uid: user.uid,
        title: newTitle.trim(),
        text: newText.trim(),
        tags,
        createdAt: Date.now(),
      });
      newTitle = '';
      newText = '';
      newTagsStr = '';
    } catch (e) {
      addError = e.message;
    } finally {
      adding = false;
    }
  }

  function formatDate(ts) {
    if (!ts) return '';
    return new Date(ts).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function pluralize(count, singular, plural) {
    return count === 1 ? singular : plural;
  }

  function handleTextKeydown(e) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      addNote();
    }
  }
</script>

<style>
  .selection-toolbar {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
    align-items: center;
    flex-wrap: wrap;
  }

  .notes-container.select-mode {
    --card-padding: 0.75rem;
  }

  .notes-container.select-mode :global(.card) {
    padding: var(--card-padding);
  }

  .notes-container.select-mode :global(.card-header) {
    align-items: center;
  }

  .notes-container.select-mode :global(h3) {
    margin-right: 0.5rem;
  }

  .notes-container.select-mode :global(.date) {
    margin-left: auto;
  }

  .notes-container.select-mode :global(.card-actions) {
    margin-top: 0.5rem;
  }

  @media (max-width: 600px) {
    .selection-toolbar {
      flex-direction: column;
      align-items: stretch;
    }
  }
  .notepad {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1.5rem;
  }

  .add-form {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    margin-bottom: 1.5rem;
    padding: 1.25rem;
  }

  .add-form-inner {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .add-form-inner input[type='text'],
  .add-form-inner textarea {
    width: 100%;
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 0.6rem 0.8rem;
    font-size: 0.95rem;
    margin: 0;
    resize: vertical;
    box-sizing: border-box;
    font-family: inherit;
  }

  .add-form-inner input[type='text']:focus,
  .add-form-inner textarea:focus {
    outline: none;
    border-color: var(--primary);
  }

  .add-form-footer {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .tags-input {
    flex: 1;
  }

  .toolbar {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 1.25rem;
    align-items: center;
  }

  .search-input {
    flex: 1;
    padding: 0.6rem 0.8rem;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    font-size: 0.9rem;
    margin: 0;
    font-family: inherit;
  }

  .search-input:focus {
    outline: none;
    border-color: var(--primary);
  }

  .view-toggle {
    display: flex;
    border: 1px solid var(--border);
    border-radius: 6px;
    overflow: hidden;
  }

  .view-btn {
    padding: 0.5rem 0.85rem;
    border: none;
    background: var(--surface);
    cursor: pointer;
    font-size: 1rem;
    color: var(--text-muted);
    margin: 0;
    border-radius: 0;
    transition: background 0.15s, color 0.15s;
    line-height: 1;
  }

  .view-btn.active {
    background: var(--primary);
    color: #fff;
  }

  .filter-hint {
    font-size: 0.875rem;
    color: var(--text-muted);
    margin: 0 0 1rem;
  }

  .clear-search {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--text-muted);
    margin: 0;
    padding: 0 0.25rem;
    font-size: 0.875rem;
  }

  .clear-search:hover {
    color: var(--text);
  }

  .error-banner {
    background: #fff5f5;
    border: 1px solid #ffcccc;
    color: var(--danger);
    border-radius: 6px;
    padding: 0.75rem 1rem;
    margin-bottom: 1rem;
    font-size: 0.9rem;
  }

  .loading-area {
    display: flex;
    justify-content: center;
    padding: 4rem;
  }

  .spinner {
    width: 36px;
    height: 36px;
    border: 3px solid var(--border);
    border-top-color: var(--primary);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .empty-state {
    text-align: center;
    padding: 4rem 2rem;
    color: var(--text-muted);
  }

  .empty-state p {
    margin: 0;
    font-size: 1rem;
  }

  .notes-container.grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1rem;
  }

  .notes-container.list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .load-more {
    display: flex;
    justify-content: center;
    margin-top: 1.5rem;
  }

  .btn {
    padding: 0.5rem 1.25rem;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--surface);
    cursor: pointer;
    font-size: 0.9rem;
    color: var(--text);
    margin: 0;
    font-family: inherit;
    transition: background 0.15s;
  }

  .btn:hover:not(:disabled) {
    background: var(--bg);
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-primary {
    background: var(--primary);
    color: #fff;
    border-color: var(--primary);
  }

  .btn-primary:hover:not(:disabled) {
    background: #e03600;
    border-color: #e03600;
  }

  .error {
    font-size: 0.8rem;
    color: var(--danger);
    margin: 0;
  }

  @media (max-width: 600px) {
    .notepad {
      padding: 1rem;
    }

    .add-form-footer {
      flex-direction: column;
      align-items: stretch;
    }

    .notes-container.grid {
      grid-template-columns: 1fr;
    }
  }
</style>

<div class="notepad">
  <div class="add-form">
    <div class="add-form-inner">
      <input type="text" placeholder="Title (optional)" bind:value={newTitle} />
      <textarea
        placeholder="Write your note… (Ctrl+Enter to save)"
        bind:value={newText}
        on:keydown={handleTextKeydown}
        rows="3"
      ></textarea>
      <div class="add-form-footer">
        <input
          class="tags-input"
          type="text"
          placeholder="Tags (comma-separated)"
          bind:value={newTagsStr}
        />
        <button
          class="btn btn-primary"
          on:click={addNote}
          disabled={adding || (!newTitle.trim() && !newText.trim())}
        >
          {adding ? 'Adding…' : 'Add Note'}
        </button>
      </div>
      {#if addError}
        <p class="error">{addError}</p>
      {/if}
    </div>
  </div>

  <div class="toolbar">
      {#if selectMode && filteredNotes.length > 0}
        <div class="selection-toolbar">
          <button
            class="btn"
            on:click={selectAllFiltered}
            disabled={selectedNoteIds.size === filteredNotes.length}
          >
            Select all
          </button>
          <button
            class="btn"
            on:click={clearSelection}
            disabled={selectedNoteIds.size === 0}
          >
            Clear
          </button>
          <button
            class="btn btn-danger"
            on:click={deleteSelectedNotes}
            disabled={selectedNoteIds.size === 0 || deletingSelected}
          >
            {deletingSelected ? 'Deleting…' : `Delete selected (${selectedNoteIds.size})`}
          </button>
        </div>
      {/if}
    <input
      type="search"
      class="search-input"
      placeholder="Search notes…"
      bind:value={searchTerm}
    />
    <div class="view-toggle">
          <button
            class="view-btn"
            class:active={!selectMode}
            on:click={() => (selectMode = false)}
            title="View notes"
          >
            📝
          </button>
          <button
            class="view-btn"
            class:active={selectMode}
            on:click={() => (selectMode = true)}
            title="Select notes"
          >
            ✅
          </button>
      <button
        class="view-btn"
        class:active={viewMode === 'grid'}
        on:click={() => (viewMode = 'grid')}
        title="Grid view"
      >⊞</button>
      <button
        class="view-btn"
        class:active={viewMode === 'list'}
        on:click={() => (viewMode = 'list')}
        title="List view"
      >≡</button>
    </div>
  </div>

  {#if searchTerm}
    <p class="filter-hint">
      {filteredNotes.length} result{filteredNotes.length !== 1 ? 's' : ''} for "<strong
        >{searchTerm}</strong
      >"
      <button class="clear-search" on:click={() => (searchTerm = '')}>✕</button>
    </p>
  {/if}

  {#if error || deleteError}
    <div class="error-banner">{error || deleteError}</div>
  {/if}

  {#if loading}
    <div class="loading-area">
      <div class="spinner"></div>
    </div>
  {:else if filteredNotes.length === 0}
    <div class="empty-state">
      {#if searchTerm}
        <p>No notes match your search.</p>
      {:else}
        <p>No notes yet. Add your first note above!</p>
      {/if}
    </div>
  {:else}
    <div
      class="notes-container"
      class:grid={viewMode === 'grid' && !selectMode}
      class:list={viewMode === 'list' && !selectMode}
      class:select-mode={selectMode}
    >
      {#each filteredNotes as note (note.docId)}
        <NoteCard
            {note}
            on:tagFilter={(e) => (searchTerm = e.detail)}
            selectable={selectMode}
            selected={selectedNoteIds.has(note.docId)}
            on:select={() => toggleNoteSelected(note.docId)}
          />
      {/each}
    </div>
    {#if hasMore && !searchTerm}
      <div class="load-more">
        <button class="btn" on:click={() => (pageLimit += 10)}>Load more</button>
      </div>
    {/if}
  {/if}
</div>
