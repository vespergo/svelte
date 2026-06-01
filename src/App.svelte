<script>
  import { onMount } from 'svelte';
  import { auth } from './firebase';
  import {
    onAuthStateChanged,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
  } from 'firebase/auth';
  import Notepad from './Notepad.svelte';

  let user = undefined; // undefined = loading, null = signed out, object = signed in
  let loginError = null;

  onMount(() => {
    return onAuthStateChanged(auth, (u) => {
      user = u;
    });
  });

  async function login() {
    loginError = null;
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (e) {
      loginError = e.message;
    }
  }

  async function logout() {
    try {
      await signOut(auth);
    } catch (e) {
      console.error(e);
    }
  }
</script>

<style>
  .loading-screen,
  .auth-screen {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background: var(--bg);
  }

  .auth-screen h1 {
    font-size: 3rem;
    color: var(--primary);
    margin: 0 0 0.5rem;
    font-weight: 300;
    letter-spacing: -1px;
  }

  .auth-screen p {
    color: var(--text-muted);
    margin: 0 0 2rem;
  }

  .sign-in-btn {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    background: #fff;
    border: 1px solid var(--border);
    padding: 0.75rem 1.5rem;
    border-radius: var(--radius);
    font-size: 1rem;
    cursor: pointer;
    box-shadow: var(--shadow);
    transition: box-shadow 0.15s;
    margin: 0;
  }

  .sign-in-btn:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  }

  .sign-in-btn img {
    width: 20px;
    height: 20px;
  }

  .error-msg {
    color: var(--danger);
    font-size: 0.875rem;
    margin-top: 1rem;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--border);
    border-top-color: var(--primary);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .app-layout {
    min-height: 100vh;
    background: var(--bg);
    display: flex;
    flex-direction: column;
  }

  header {
    background: #fff;
    border-bottom: 1px solid var(--border);
    padding: 0 1.5rem;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .logo {
    font-size: 1.4rem;
    font-weight: 700;
    color: var(--primary);
    letter-spacing: -0.5px;
  }

  .user-area {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .user-area img {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 2px solid var(--border);
  }

  .user-name {
    font-size: 0.9rem;
    color: var(--text);
    font-weight: 500;
  }

  .sign-out-btn {
    background: none;
    border: 1px solid var(--border);
    padding: 0.3rem 0.75rem;
    border-radius: var(--radius);
    font-size: 0.825rem;
    cursor: pointer;
    color: var(--text-muted);
    margin: 0;
    transition: background 0.15s;
  }

  .sign-out-btn:hover {
    background: var(--bg);
  }

  main {
    flex: 1;
  }
</style>

{#if user === undefined}
  <div class="loading-screen">
    <div class="spinner"></div>
  </div>
{:else if user === null}
  <div class="auth-screen">
    <h1>Notepad</h1>
    <p>Sign in to access your notes</p>
    <button class="sign-in-btn" on:click={login}>
      <img
        src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
        alt=""
      />
      Sign in with Google
    </button>
    {#if loginError}
      <p class="error-msg">{loginError}</p>
    {/if}
  </div>
{:else}
  <div class="app-layout">
    <header>
      <span class="logo">Notepad</span>
      <div class="user-area">
        {#if user.photoURL}
          <img src={user.photoURL} alt={user.displayName || ''} />
        {/if}
        <span class="user-name">{user.displayName || user.email}</span>
        <button class="sign-out-btn" on:click={logout}>Sign out</button>
      </div>
    </header>
    <main>
      <Notepad {user} />
    </main>
  </div>
{/if}
