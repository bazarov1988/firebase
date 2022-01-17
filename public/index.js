let userId = '';
let db;


const getCompetitionTemplate = async (id) => {
    return (await db.collection('competition_templates').doc(id).get()).data();
}

const getActualCompetition = async () => {
    const competitionsRes = await db.collection('competitions').where('isActual', '==', true).get();
    if (competitionsRes.size) {
        const competitions = competitionsRes.docs.map(item => ({id: item.id, ...item.data()}));
        return competitions[0];
    } else {
        const competitionsRes = await db.collection('competitions').where('completedTime', '<=', Date.now()).get();
        if (competitionsRes.size) {
            const competitions = competitionsRes.docs.map(item => ({id: item.id, ...item.data()}));
            for (const id of competition[0].users) {
                await db.collection("users").doc(id).update({
                    isWaiting: false,
                    competition: '',
                })
            }
            await db.collection("competitions").doc(competitions[0].id).update({
                users: [],
                startedTime: 0,
                completedTime: 0,
                isActual: true
            });
            return {
                ...competitions[0],
                users: [],
                startedTime: 0,
                completedTime: 0,
                isActual: true
            }
        }
    }
    return null;
}

const join = () => {
    userId = document.getElementById('user-id').value;
    if (userId) {
        db.collection('users').doc(userId).get().then(async doc => {
            if (doc.exists) {
                const user = doc.data();
                if (!user.isWaiting && !user.competition) {
                    db.collection("users").doc(userId).update({isWaiting: true}).then(async () => {
                        document.getElementById('join-block').style.display = 'none';
                        document.getElementById('connecting-block').style.display = 'block';
                        setTimeout(await check(), 1000);
                    });
                } else if (user.isWaiting) {
                    document.getElementById('join-block').style.display = 'none';
                    document.getElementById('connecting-block').style.display = 'block';
                    setTimeout(await check(), 1000);
                }
            } else {
                alert('No such user');
            }
        });
    }
}

const check = async () => {
    if (userId) {
        const doc = await db.collection('users').doc(userId).get();
        if (doc.exists) {
            const user = doc.data();
            if (user.competition && !user.isWaiting) {
                alert(`Competition started for user ${userId}`);
                document.getElementById('join-block').style.display = 'none';
                document.getElementById('connecting-block').style.display = 'none';
                document.getElementById('connected-block').style.display = 'block';
            } else if (user.isWaiting) {
                console.log('user is still waiting');
                document.getElementById('connecting-block').style.display = 'block';

                if (!user.competition) {
                    const currentCompetition = await getActualCompetition();
                    if (currentCompetition) {
                        const currentCompetitionTemplate = await getCompetitionTemplate(currentCompetition.competition);
                        const ids = [...currentCompetition.users, userId];
                        if (ids.length === currentCompetitionTemplate.maxPlayers) {
                            for (const id of ids) {
                                await db.collection("users").doc(id).update({
                                    isWaiting: false,
                                    competition: currentCompetition.id,
                                })
                            }
                            await db.collection("competitions").doc(currentCompetition.id).update({
                                users: ids,
                                isActual: false,
                                startedTime: Date.now(),
                                completedTime: Date.now() + 300000,
                            });
                        } else {
                            await db.collection("competitions").doc(currentCompetition.id).update({
                                users: ids
                            });
                            await db.collection("users").doc(userId).update({
                                isWaiting: true,
                                competition: currentCompetition.id,
                            })
                        }
                    }
                }

                setTimeout(await check(), 1000)
            }
        }

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
