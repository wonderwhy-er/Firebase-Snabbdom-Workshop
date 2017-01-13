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
ref.once('value').then( function (topicsSnapshot) {
    db = createDB(topicsSnapshot.val());
    createUI();
});


//STATE

//UI

var container = document.getElementById('container');
function createUI() {
    container.innerHTML = '';
    var topics = fromHTMLString('<div></div>')[0];
    container.appendChild(topics)
    container.appendChild(footer(db, topics));


    db.topics.forEach(function (topic) {
        addTopicElement(db, topic, topics);
    });
}

function fromHTMLString(str) {
    var div = document.createElement('div');
    div.innerHTML = str;
    return div.children;
}

function topic(db, topic) {
    var topicElement = fromHTMLString(
        `<div><hr>
<input value="${topic.text}"/><button>add subtopic</button>
<div>
<ul></ul>
</div>
</div>`)[0];

    var input = topicElement.children[1];
    input.addEventListener('keyup', function () {
        db.updateTopic(topic.key, input.value);
    });
    var subtopics = topicElement.children[3].children[0];
    topicElement.children[2].addEventListener('click', function () {
        var subtopicData = db.createSubTopic(topic.key);
        addSubTopicElement(db, topic, subtopicData, subtopics);
    });

    if(topic.subtopics) {
        topic.subtopics.forEach(function (subtopicData) {
            addSubTopicElement(db, topic, subtopicData, subtopics);
        });
    }
    
    return topicElement;
}

function addSubTopicElement(db, topic, subtopicData, subTopicsElement) {
    var subtopicElement = subtopic(db, topic, subtopicData);
    subTopicsElement.appendChild(subtopicElement);
}

function subtopic(db, topic, subtopicData) {
    var element = fromHTMLString(`<li><input value="${subtopicData.text}"></li>`)[0];
    var input = element.children[0];
    input.addEventListener('keyup', function () {
        db.updateSubTopic(topic.key, subtopicData.key, input.value);
    });
    return element;
}

function addTopicElement(db, topicData, topicContainer) {
    var topicElement = topic(db, topicData);
    topicContainer.appendChild(topicElement);
}

function footer(db, topicContainer) {
    var footer = fromHTMLString(`<div><hr><button>add topic</button></div>`)[0];
    footer.children[1].addEventListener('click', function () {
        var topicData = db.createTopic();
        addTopicElement(db, topicData, topicContainer);
    });
    return footer;
}

//UI