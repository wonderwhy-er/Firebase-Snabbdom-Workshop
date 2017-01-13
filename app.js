function GUID() {
    return Math.random();
}

//STATE
function createDB(topics) {
    var db = {
        topics: topics
    };

    db.setUser = function (user) {
        db.currentUser = user;
        createUI();
    };

    db.createTopic = function () {
        db.topics.push({
            subtopics: [],
            text: '',
            key: GUID()
        });
        return db.topics[db.topics.length - 1];
    };

    db.getTopic = function (key) {
        return db.topics.filter(function (topic) {
            return topic.key == key;
        })[0];
    };

    db.createSubTopic = function (key) {
        var topic = db.getTopic(key);
        topic.subtopics.push({
            text: '',
            key: GUID()
        });
        return topic.subtopics[topic.subtopics.length - 1];
    };

    db.updateTopic = function (key, text) {
        var topic = db.getTopic(key);
        topic.text = text;
    };

    db.getSubTopic = function (topicKey, subTopicKey) {
        var topic = db.getTopic(topicKey);
        return topic.subtopics.filter(function (subtopic) {
            return subtopic.key == subTopicKey;
        })[0];
    };

    db.updateSubTopic = function (topicKey, subTopicKey, text) {
        var subTopic = db.getSubTopic(topicKey, subTopicKey);
        subTopic.text = text;
    };

    db.setUserPos = function (x, y) {
        firebase.database().ref('users/' + db.currentUser.uid).set({
            name: db.currentUser.displayName,
            email: db.currentUser.email,
            picture: db.currentUser.photoURL,
            x: x,
            y: y,
            time: new Date().getTime()
        });
    };

    ['createTopic', 'createSubTopic', 'updateTopic', 'updateSubTopic'].forEach(function (key) {
        AddCallbackAfter(db, key, function (db) {
            save(db.topics);
        });
    });
    return db;
}

function onUserChanges(userSnapshot) {
    if (!db) {
        db = createDB([]);
    }
    db.users = userSnapshot.val();
    createUI();
}

function AddCallbackAfter(object, name, callback) {
    var original = object[name];
    object[name] = function () {
        var result = original.apply(object, arguments);
        callback(object);
        return result;
    }
}

var ref = firebase.database().ref('planner');
function save(state) {
    ref.set(state);
}

var db;

//STATE
//Auth
var userRef = firebase.database().ref('users');
firebase.auth().onAuthStateChanged(function (user) {
    if (!db) {
        db = createDB([]);
    }
    if(user) {
        userRef.on('value', onUserChanges);
        document.addEventListener('mousemove', mouseMove);
            ref.on('value', function (snapshot) {
            if (!db) {
                db = createDB();
            }
            db.topics = snapshot.val();
            createUI();
        });
    } else {
        userRef.off();
        document.removeEventListener('mousemove', mouseMove);
        ref.off('value');
    }
    db.setUser(user);
});

function mouseMove(e) {
    db.setUserPos(e.pageX, e.pageY);
}

function signOut() {
    firebase.auth().signOut();
}

function signIn() {
    var provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider).catch(function (error) {
        var errorCode = error.code;
        var errorMessage = error.message;
        var email = error.email;
        var credential = error.credential;
        console.log(errorCode, errorMessage, email, credential);
        alert(errorMessage);
    });
}

//Auth


//UI

var patch = snabbdom.init([
    snabbdom_style,
    snabbdom_class,
    snabbdom_props,
    snabbdom_attributes,
    snabbdom_eventlisteners
]);


var container = document.getElementById('container');

var vnode = patch(container, h('span', 'Loading...'));

function button(label, callback) {
    return h('button', {
        on: {
            click: callback
        }
    }, label);
}

function users(db) {

    return h('span',Object.keys(db.users || {}).map(function (userId) {
        var user = db.users[userId];
        return h('img.user', {
            props: {
                src: user.picture,
                title: user.name
            },
            style: {
                left: user.x + 'px',
                top: user.y + 'px'
            }
        })
    }));
}

function userPanel(db) {
    var content = db.currentUser ?
        h('div',[
            h('img',{props:{src: db.currentUser.photoURL}}),
            h('div',[button('Sign Out',signOut)])
        ])
        :
        button('Sign In',signIn);

    return h('div.userPanel',[content]);
}

function input(value, callback) {
    return h('input', {
        on: {
            keyup: callback
        },
        props: {
            value: value
        }
    });
}

function createUI() {
    vnode = patch(vnode,
        h('div',
            (db.currentUser ? db.topics.map(function (topic) {
                return topicElement(db, topic);
            }) : []).concat(footer(db),userPanel(db), users(db))
        )
    );
}





function topicElement(db, topic) {
    return h('div', [
        h('hr'),
        input(topic.text, function () {
            db.updateTopic(topic.key, e.currentTarget.value);
        }),
        button('add subtopic', function () {
            var subtopicData = db.createSubTopic(topic.key);
        })
    ].concat(
        topic.subtopics ?
            topic.subtopics.map(function (subtopic) {
                return subtopicElement(db, topic, subtopic);
            })
            : []
    ))
}


function subtopicElement(db, topic, subtopicData) {
    return h('li', [
        input(subtopicData.text, function (e) {
            db.updateSubTopic(topic.key, subtopicData.key, e.currentTarget.value);
        })
    ])
}

function footer(db, topicContainer) {
    return h('div', [
        h('hr'),
        button('add topic',
            function () {
                db.createTopic()
            }
        )
    ]);
}

//UI