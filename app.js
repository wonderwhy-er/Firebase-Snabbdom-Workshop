function GUID() {
    return Math.random();
}

//STATE
function createDB(topics) {
    var db = {
        topics: topics
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

    ['createTopic', 'createSubTopic', 'updateTopic', 'updateSubTopic'].forEach(function (key) {
        AddCallbackAfter(db, key, function (db) {
            save(db.topics);
        });
    });
    return db;
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
ref.on('value', function (snapshot) {
    if (!db) {
        db = createDB();
    }
    db.topics = snapshot.val();
    createUI();
});


//STATE

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
        h('div', db.topics.map(function (topic) {
                return topicElement(db, topic);
            }).concat(footer(db))
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

function addSubTopicElement(db, topic, subtopicData, subTopicsElement) {
    var subtopicElement = subtopic(db, topic, subtopicData);
    subTopicsElement.appendChild(subtopicElement);
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