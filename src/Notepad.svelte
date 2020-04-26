<script>
  import { db } from "./firebase";
  import { collectionData } from "rxfire/firestore";
  let text = "";
  let id = 1234;
  let collection = [];

  let notes = db
    .collection("notes")
    .orderBy("id", "desc")
    .limit(10);

  notes.get().then(function(docs) {
    let alldocs = [];
    docs.forEach(element => {
      let x = element.data();
      alldocs.push(x);
    });
    collection = alldocs;
  });

  function addToDb() {
    let x = { id: Date.now(), text };
    db.collection("notes").add(x);
    collection.unshift(x);
    collection = collection;
    text = "";
  }

  function checkEnter() {
    if (event.key == "Enter") {
      addToDb();
    }
  }
</script>

<style>
  textarea {
    width: 50%;
    height: 20%;
  }
  .top {
    display: flex;
    justify-content: center;
  }
</style>

<div class="top">
  <textarea bind:value={text} on:keypress={checkEnter} />
  <button on:click={addToDb}>Add to Firebase</button>
</div>
{#each collection as c}
  <p>id: {c.id} text: {c.text}</p>
{/each}
