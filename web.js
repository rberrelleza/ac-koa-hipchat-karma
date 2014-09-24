var analytics = require('ac-koa-hipchat-keenio');

var ack = require('ac-koa').require('hipchat');
var pkg = require('./package.json');
var app = ack(pkg, {store: 'MongoStore'});

var addon = app.addon()
  .hipchat()
  .allowGlobal(true)
  .scopes('send_notification', 'view_group');

var tracker = analytics.track(addon);

addon.webhook('room_message', /^\/karma(?:\s+(:)?(.+?)\s*$)?/i, function *() {
  var message;
  var match = this.match;
  var room = this.room;
  var enabled = (yield this.tenantStore.get(roomKey(room.id))) !== false;
  var command = match && match[1] === ':' && match[2];
  var subject = match && !match[1] && match[2];
  if (command) {
    if (command === 'on') {
      enabled = true;
      yield this.tenantStore.set(roomKey(room.id), enabled);
      message = 'Karma matching has been enabled in this room.';
    } else if (command === 'off') {
      enabled = false;
      yield this.tenantStore.set(roomKey(room.id), enabled);
      message = 'Karma matching has been disabled in this room.';
    } else {
      message = 'Sorry, I didn\'t understand that.';
    }
  } else if (subject) {
    if (subject.charAt(0) === '@') {
      var user = yield this.tenantClient.getUser(subject);
      var karma;
      if (user) {
        subject = user.name;
        karma = (yield getSubject('user', user.id)) || 0;
      } else {
        karma = (yield getSubject('thing', subject)) || 0;
      }
    } else {
      karma = (yield getSubject('thing', subject)) || 0;
    }
    message = subject + ' has ' + karma + ' karma.';
  } else {
    message =
      '<pre>' +
      'Karma matching is currently ' + (enabled ? 'enabled' : 'disabled') + ' in this room.\n\n' +
      'Usage:\n' +
      '  /karma                 print this help message\n' +
      '  /karma :on             enable karma matching in the current room\n' +
      '  /karma :off            disable karma matching in the current room\n' +
      '  /karma {thing}         lookup something\'s current karma\n' +
      '  /karma @{MentionName}  lookup a user\'s current karma\n' +
      '  {subject}++            add karma to a given subject\n' +
      '  {subject}--            remove karma to a given subject\n' +
      '  "{subject phrase}"++   add karma to a given subject phrase\n' +
      '  @{MentionName}++       add karma to a given user by mention name\n' +
      '</pre>';
  }
  notify.call(this, message);
});

var strIncDec = '(?:(?:(?:(@\\w+))\\s?)|([\\w]+)|(\\([\\w]+\\))|(?:(["\'])([^\4]+)\\4))(\\+{2,}|-{2,})';
addon.webhook('room_message', new RegExp(strIncDec), function *() {
  var room = this.room;
  var sender = this.sender;
  // don't parse other slash commands
  if (/^\/\w+/.test(this.content)) return;
  // don't respond if disabled in the current room
  if ((yield this.tenantStore.get(roomKey(room.id))) === false) return;

  var reIncDec = new RegExp(strIncDec, 'g');
  var match;
  while (match = reIncDec.exec(this.content)) {
    var message;
    var subject;
    var isMention = match[1] && match[1].charAt(0) === '@';
    var change = match[6].length - 1;
    var changed = (change > 0 ? 'increased' : 'decreased');
    var karma;
    if (match[6].charAt(0) === '-') {
      change = -change;
    }
    if (isMention) {
      var mentionName = match[1].toLowerCase().slice(1);
      var user = this.message.mentions.find(function (user) {
        return user.mention_name.toLowerCase() === mentionName;
      });
      if (user) {
        if (user.id === sender.id) {
          notify.call(this, 'Don\'t be a weasle.');
          return;
        } else {
          subject = user.name;
          karma = yield updateSubject('user', user.id, change);
        }
      } else {
        subject = match[1];
        karma = yield updateSubject('thing', subject, change);
      }
    } else {
      subject = match[2] || match[3] || match[5];
      karma = yield updateSubject('thing', subject, change);
    }
    var possessive = subject + '\'' + (subject.charAt(subject.length - 1) === 's' ? '' : 's');
    message = possessive + ' karma has ' + changed + ' to ' + karma + '.';
    notify.call(this, message);
  }
});

app.listen();

function notify(message) {
  this.roomClient.sendNotification(message, {color: 'gray', format: 'html'});
}

function updateSubject(type, subject, change) {
  return function *() {
    var key = subjectKey(type, subject);
    var karma = ((yield this.tenantStore.get(key)) || 0) + change;
    yield this.tenantStore.set(key, karma);
    return karma;
  };
}

function getSubject(type, subject) {
  return function *() {
    var key = subjectKey(type, subject);
    return yield this.tenantStore.get(key);
  };
}

function subjectKey(type, subject) {
  return type + ':' + subject.toString().toLowerCase().trim();
}

function roomKey(roomId) {
  return 'room:' + roomId;
}
