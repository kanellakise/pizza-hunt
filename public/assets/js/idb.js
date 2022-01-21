// db connection holder
let db;
const request = indexedDB.open('pizza_hunt', 1);

// event emits if the database version changes
request.onupgradeneeded = function(event) {
    // save a reference to the database
    const db = event.target.result;
    // create an object store (table) called `new_pizza`, set it to have an auto incrementing primary key of sorts
    db.createObjectStore('new_pizza', { autoIncrement: true });
};

// upon success
request.onsuccess = function(event) {
    // when db is successfully created with its object store, save reference to db in global variable
    db = event.target.result;

    // check if app is online, if yes run uploadePizza() to send all local db data to api
    if (navigator.onLine) {
        uploadPizza();
    }
};

request.onerror = function(event) {
    // log error here
    console.log(event.target.errorCode);
};

// executed if we attempt to submit a new pizza and there's no internet connection
function saveRecord(record) {
    // open a new transaction with the database with read and write permissions
    const transaction = db.transaction(['new_pizza'], 'readwrite');

    // access the object store for `new_pizza`
    const pizzaObjectStore = transaction.objectStore('new_pizza');

    // add record to your store with add method
    pizzaObjectStore.add(record);
}

function uploadPizza() {
    // open a transaction on db
    const transaction = db.transaction(['new_pizza'], 'readwrite');

    // access object store
    const pizzaObjectStore = transaction.objectStore('new_pizza');

    // get all records from store and set to a variable
    const getAll = pizzaObjectStore.getAll();

    getAll.onsuccess = function() {
        if (getAll.result.length > 0) {
            fetch('/api/pizzas', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
                .then(response => response.json())
                .then(serverResponse => {
                    if (serverResponse.message) {
                        throw new Error(serverResponse);
                    }
                    // open one more transaction
                    const transaction = db.transaction(['new_pizza'], 'readwrite');
                    // access the new_pizza object store
                    const pizzaObjectStore = transaction.objectStore('new_pizza');
                    // clear all items in your store
                    pizzaObjectStore.clear();

                    alert('All saved pizzas have been submitted!');
                })
                .catch(err => {
                    console.log(err);
                });
        }
    };
}

// listen for app coming back online
window.addEventListener('online', uploadPizza);