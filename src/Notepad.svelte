<script>
  import { db } from "./firebase";
  import { collectionData } from "rxfire/firestore";
  let text = "";
  let id = 1234;
  let collection = [];

  db.collection("notes")
    .get()
    .then(function(docs) {
      let alldocs = [];
      docs.forEach(element => {
        let x = element.data();
        alldocs.push(x);
      });
      collection = alldocs;
    });

  function addToDb() {
    let x = { id, text };
    db.collection("notes").add(x);
    collection.push(x);
    collection = collection;
    text = "";
  }
</script>

<textarea bind:value={text} />
<button on:click={addToDb}>Add to Firebase</button>

{#each collection as c}
  <p>id: {c.id} text: {c.text}</p>
{/each}
