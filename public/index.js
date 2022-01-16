let userId = '';
let db;

const join = () => {
    userId = document.getElementById('user-id').value;
    if (userId) {
        db.collection('users').doc(userId).get().then(doc => {
            if (doc.exists) {
                const user = doc.data();
                if (!user.isWaiting && !user.competition) {
                    db.collection("users").doc(userId).update({isWaiting: true}).then(() => {
                        document.getElementById('join-block').style.display = 'none';
                        document.getElementById('connecting-block').style.display = 'block';
                        setTimeout(check(), 2000);
                    });
                } else if (user.isWaiting) {
                    document.getElementById('join-block').style.display = 'none';
                    document.getElementById('connecting-block').style.display = 'block';
                    setTimeout(check(), 2000);
                }
            } else {
                alert('No such user');
            }
        });
    }
}

const check = () => {
    if (userId) {
        db.collection('users').doc(userId).get().then(doc => {
            if (doc.exists) {
                const user = doc.data();
                if (user.competition) {
                    alert(`Competition started for user ${userId}`);
                    document.getElementById('join-block').style.display = 'none';
                    document.getElementById('connecting-block').style.display = 'none';
                    document.getElementById('connected-block').style.display = 'block';
                } else if (user.isWaiting) {
                    console.log('user is still waiting');
                    document.getElementById('connecting-block').style.display = 'block';
                    setTimeout(check(), 1000)
                }
            }
        });
    }
}


document.addEventListener('DOMContentLoaded', () => {
    const loadEl = document.querySelector('#load');
// firebase.auth().onAuthStateChanged(user => { });
// firebase.database().ref('/path/to/ref').on('value', snapshot => { });
// firebase.firestore().doc('/foo/bar').get().then(() => { });
// firebase.functions().httpsCallable('yourFunction')().then(() => { });
// firebase.messaging().requestPermission().then(() => { });
// firebase.storage().ref('/path/to/ref').getDownloadURL().then(() => { });
// firebase.analytics(); // call to activate
// firebase.analytics().logEvent('tutorial_completed');
// firebase.performance(); // call to activate

    try {
        let app = firebase.app();
        let features = [
            'auth',
            'database',
            'firestore',
            'functions',
            'messaging',
            'storage',
            'analytics',
            'remoteConfig',
            'performance',
        ].filter(feature => typeof app[feature] === 'function');
        loadEl.textContent = `Firebase SDK loaded with ${features.join(', ')}`;
        db = firebase.firestore();
        db.collection('users').get().then(snapshot => {
            snapshot.docs.forEach(doc => console.log(doc.data()));
        });
    } catch (e) {
        console.error(e);
        loadEl.textContent = 'Error loading the Firebase SDK, check the console.';
    }
})