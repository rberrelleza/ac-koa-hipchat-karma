function Karma(addonStore, groupId) {
  if (!(this instanceof Karma)) {
    return new Karma(addonStore, groupId);
  }
  this._store = addonStore.narrow(groupId);
}

var proto = Karma.prototype;

proto.forUser = function (userId) {
  return this._forSubject('user', userId);
};

proto.updateUser = function (userId, change) {
  return this._updateSubject('user', userId, change);
};

proto.forThing = function (thingName) {
  return this._forSubject('thing', thingName);
};

proto.updateThing = function (thingName, change) {
  return this._updateSubject('thing', thingName, change);
};

proto._forSubject = function (type, subject) {
  var self = this;
  return function *() {
    var key = self._subjectKey(type, subject);
    return (yield self._store.get(key)) || 0;
  };
};

proto._updateSubject = function (type, subject, change) {
  var self = this;
  return function *() {
    var key = self._subjectKey(type, subject);
    var karma = ((yield self._store.get(key)) || 0) + change;
    yield self._store.set(key, karma);
    return karma;
  };
};

proto.isEnabled = function (roomId) {
  var self = this;
  return function *() {
    return (yield self._store.get(self._roomKey(roomId))) !== false;
  };
};

proto.setEnabled = function (roomId, isEnabled) {
  var self = this;
  return function *() {
    yield self._store.set(self._roomKey(roomId), isEnabled);
  };
};

proto._subjectKey = function (type, subject) {
  return type + ':' + subject.toString().toLowerCase().trim();
};

proto._roomKey = function (roomId) {
  return 'room:' + roomId;
};

module.exports = Karma;
