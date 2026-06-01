<script>
  import { createEventDispatcher } from 'svelte';
  import { db } from './firebase';
  import { doc, deleteDoc, updateDoc } from 'firebase/firestore';

  export let note;
  export let selectable = false;
  export let selected = false;

  const dispatch = createEventDispatcher();

  function handleSelect() {
    dispatch('select');
  }

  let editing = false;
  let confirming = false;
  let editTitle = '';
  let editText = '';
  let editTagsStr = '';
  let error = null;
  let saving = false;

  function startEdit() {
    editTitle = note.title || '';
    editText = note.text || '';
    editTagsStr = (note.tags || []).join(', ');
    error = null;
    editing = true;
  }

  function cancelEdit() {
    editing = false;
    error = null;
  }

  async function save() {
    saving = true;
    error = null;
    try {
      const tags = editTagsStr
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      await updateDoc(doc(db, 'notes', note.docId), {
        title: editTitle.trim(),
        text: editText.trim(),
        tags,
      });
      editing = false;
    } catch (e) {
      error = e.message;
    } finally {
      saving = false;
    }
  }

  async function remove() {
    try {
      await deleteDoc(doc(db, 'notes', note.docId));
    } catch (e) {
      error = e.message;
      confirming = false;
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
</script>

<style>
  .card.selected {
    border-color: var(--primary);
    background-color: var(--primary-light);
  }

  .select-checkbox {
    margin-right: 0.5rem;
    width: 18px;
    height: 18px;
    cursor: pointer;
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 1rem;
    box-shadow: var(--shadow);
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    transition: box-shadow 0.15s;
  }

  .card:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 0.5rem;
  }

  h3 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: var(--text);
    flex: 1;
  }

  .date {
    font-size: 0.75rem;
    color: var(--text-muted);
    white-space: nowrap;
    flex-shrink: 0;
  }

  .text {
    margin: 0;
    font-size: 0.9rem;
    color: var(--text);
    white-space: pre-wrap;
    word-break: break-word;
    line-height: 1.5;
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
  }

  .tag {
    background: var(--tag-bg);
    color: var(--tag-color);
    border: none;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    margin: 0;
    transition: opacity 0.15s;
  }

  .tag:hover {
    opacity: 0.75;
  }

  .card-actions {
    display: flex;
    gap: 0.4rem;
    margin-top: 0.25rem;
  }

  .confirm-delete {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: #fff5f5;
    border-radius: 6px;
    padding: 0.5rem 0.75rem;
    font-size: 0.85rem;
    flex-wrap: wrap;
  }

  .confirm-delete span {
    flex: 1;
    color: var(--danger);
    font-weight: 500;
    min-width: 120px;
  }

  .edit-form {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .edit-form input,
  .edit-form textarea {
    width: 100%;
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 0.5rem 0.6rem;
    font-size: 0.9rem;
    resize: vertical;
    margin: 0;
    box-sizing: border-box;
    font-family: inherit;
  }

  .edit-form textarea {
    min-height: 80px;
  }

  .edit-form input:focus,
  .edit-form textarea:focus {
    outline: none;
    border-color: var(--primary);
  }

  .edit-actions {
    display: flex;
    gap: 0.4rem;
  }

  .error {
    font-size: 0.8rem;
    color: var(--danger);
    margin: 0;
  }

  .btn {
    padding: 0.3rem 0.7rem;
    border-radius: 6px;
    border: 1px solid var(--border);
    background: #fff;
    cursor: pointer;
    font-size: 0.825rem;
    color: var(--text);
    margin: 0;
    font-family: inherit;
    transition: background 0.15s, border-color 0.15s;
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

  .btn-danger {
    background: var(--danger);
    color: #fff;
    border-color: var(--danger);
  }

  .btn-danger:hover:not(:disabled) {
    background: #c82333;
    border-color: #c82333;
  }
</style>

<div class="card" class:selected={selected}>
  {#if editing}
    <div class="edit-form">
      <input type="text" placeholder="Title" bind:value={editTitle} />
      <textarea placeholder="Note body" bind:value={editText}></textarea>
      <input
        type="text"
        placeholder="Tags (comma-separated)"
        bind:value={editTagsStr}
      />
      {#if error}
        <p class="error">{error}</p>
      {/if}
      <div class="edit-actions">
        <button class="btn btn-primary" on:click={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button class="btn" on:click={cancelEdit}>Cancel</button>
      </div>
    </div>
  {:else}
    <div class="card-header">
        {#if selectable}
          <input
            type="checkbox"
            class="select-checkbox"
            checked={selected}
            on:change={handleSelect}
          />
        {/if}
      {#if note.title}
        <h3>{note.title}</h3>
      {/if}
      <span class="date">{formatDate(note.createdAt)}</span>
    </div>
    {#if note.text}
      <p class="text">{note.text}</p>
    {/if}
    {#if (note.tags || []).length > 0}
      <div class="tags">
        {#each note.tags as tag}
          <button class="tag" on:click={() => dispatch('tagFilter', tag)}>
            {tag}
          </button>
        {/each}
      </div>
    {/if}
    {#if error}
      <p class="error">{error}</p>
    {/if}
    {#if confirming}
      <div class="confirm-delete">
        <span>Delete this note?</span>
        <button class="btn btn-danger" on:click={remove}>Delete</button>
        <button class="btn" on:click={() => (confirming = false)}>Cancel</button>
      </div>
    {:else}
      <div class="card-actions">
        <button class="btn" on:click={startEdit}>Edit</button>
        <button
          class="btn btn-danger"
          on:click={() => (confirming = true)}
        >Delete</button>
      </div>
    {/if}
  {/if}
</div>
