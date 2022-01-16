const functions = require("firebase-functions");
const admin = require('firebase-admin');
admin.initializeApp();

const addUsersToCompetition = async (ids, competition) => {
    for (const id of ids) {
        await admin.firestore().collection("users").doc(id).update({
            isWaiting: false,
            competition: competition.id,
        })
    }
    await admin.firestore().collection("competitions").doc(competition.id).update({
        users: ids,
        startedTime: Date.now(),
        completedTime: Date.now() + 300000,
    });
    return true;
}

const checkWaitingUsers = async () => {
    const res = await admin.firestore().collection('users').where('isWaiting', '==', true).get();
    if (res.size) {
        let users = res.docs.map(user => ({id: user.id, ...user.data()}));
        const competitionsRes = await admin.firestore().collection('competitions').where('users', '==', []).get();
        if (competitionsRes.size) {
            const competitions = competitionsRes.docs.map(item => ({id: item.id, ...item.data()}));
            for (const competition of competitions) {
                const competitionTemplate = (await admin.firestore().collection('competition_templates').doc(competition.competition).get()).data();
                if (users.length === competitionTemplate.maxPlayers) {
                    const ids = users.map(user => user.id);
                    await addUsersToCompetition(ids, competition);
                    break;
                } else if (users.length > competitionTemplate.maxPlayers) {
                    const competitionUsers = users.slice(0, competitionTemplate.maxPlayers);
                    users = users.slice(competitionTemplate.maxPlayers);
                    const ids = competitionUsers.map(user => user.id);
                    await addUsersToCompetition(ids, competition);
                }
            }
        }
    }
    return true;
}

const resetPlayedUsers = async () => {
    const competitionsRes = await admin.firestore().collection('competitions').where('users', '!=', []).get();
    if (competitionsRes.size) {
        const competitions = competitionsRes.docs.map(item => ({id: item.id, ...item.data()}));
        for (const competition of competitions) {
            if (competition.completedTime <= Date.now() && competition.users.length) {
                for (const id of competition.users) {
                    await admin.firestore().collection("users").doc(id).update({
                        isWaiting: false,
                        competition: '',
                    })
                }
                await admin.firestore().collection("competitions").doc(competition.id).update({
                    users: [],
                    startedTime: 0,
                    completedTime: 0,
                });
            }
        }
    }
    return true;
}

exports.users = functions.https.onRequest(async (request, response) => {
    const user = await admin.firestore().collection('users').doc('zV8JXawErMQFktAglaoO').get();
    response.send(user.data());
});

exports.checkWaitingUsersApi = functions.https.onRequest(async (request, response) => {
    await checkWaitingUsers();
    response.send('okay');
});

exports.checkWaitingUsersCron = functions.pubsub.schedule('*/1 * * * * *').timeZone('Europe/Amsterdam').onRun(async (context) => {
    await checkWaitingUsers();
    return true;
});

exports.resetPlayedUsersApi = functions.https.onRequest(async (request, response) => {
    await resetPlayedUsers();
    response.send('okay');
});

exports.resetPlayedUsersCron = functions.pubsub.schedule('*/1 * * * * *').timeZone('Europe/Amsterdam').onRun(async (context) => {
    await resetPlayedUsers();
    return true;
});

