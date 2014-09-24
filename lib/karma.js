function Karma(addonStore, groupId) {
  if (!(this instanceof Karma)) {
    return new Karma();
  }
  this._store = addonStore.narrow(groupId);
}

Karma.prototype.forUser = function (userId) {
  return this._forSubject('user', userId);
};

Karma.prototype.updateUser = function (userId, change) {
  return this._updateSubject('user', userId, change);
};

Karma.prototype.forThing = function (thingName) {
  return this._forSubject('thing', thingName);
};

Karma.prototype.updateThing = function (thingName, change) {
  return this._updateSubject('thing', thingName, change);
};

Karma.prototype._forSubject = function (type, subject) {
  var self = this;
  return function *() {
    var key = self._subjectKey(type, subject);
    return (yield self._store.get(key)) || 0;
  };
};

Karma.prototype._updateSubject = function (type, subject, change) {
  var self = this;
  return function *() {
    var key = self._subjectKey(type, subject);
    var karma = ((yield self._store.get(key)) || 0) + change;
    yield self._store.set(key, karma);
    return karma;
  };
};

Karma.prototype.isEnabled = function (roomId) {
  var self = this;
  return function *() {
    return (yield self._store.get(self._roomKey(roomId))) !== false;
  };
};

Karma.prototype.setEnabled = function (roomId, isEnabled) {
  var self = this;
  return function *() {
    yield self._store.set(self._roomKey(roomId), isEnabled);
  };
};

Karma.prototype._subjectKey = function (type, subject) {
  return type + ':' + subject.toString().toLowerCase().trim();
};

Karma.prototype._roomKey = function (roomId) {
  return 'room:' + roomId;
};

module.exports = Karma;
