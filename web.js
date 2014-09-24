var analytics = require('ac-koa-hipchat-keenio');
var MongoStore = require('ac-node').MongoStore;
var Karma = require('./lib/karma');

var ack = require('ac-koa').require('hipchat');
var pkg = require('./package.json');
var app = ack(pkg, {store: MongoStore});

var addon = app.addon()
  .hipchat()
  .allowGlobal(true)
  .allowRoom(true)
  .scopes('send_notification', 'view_group');

var addonStore = MongoStore(addon.config.mongoEnv, 'karma');
var tracker = analytics.track(addon);

addon.webhook('room_message', /^\/karma(?:\s+(:)?(.+?)\s*$)?/i, function *() {
  var message;
  var match = this.match;
  var room = this.room;
  var karma = Karma(addonStore, this.tenant.group);
  var enabled = yield karma.isEnabled(room.id);
  var command = match && match[1] === ':' && match[2];
  var subject = match && !match[1] && match[2];
  if (command) {
    if (command === 'on') {
      enabled = true;
      yield karma.setEnabled(room.id, enabled);
      message = 'Karma matching has been enabled in this room.';
    } else if (command === 'off') {
      enabled = false;
      yield karma.setEnabled(room.id, enabled);
      message = 'Karma matching has been disabled in this room.';
    } else {
      message = 'Sorry, I didn\'t understand that.';
    }
  } else if (subject) {
    if (subject.charAt(0) === '@') {
      var user = yield this.tenantClient.getUser(subject);
      var value;
      if (user) {
        subject = user.name;
        value = karma.forUser(user.id);
      } else {
        value = karma.forThing(subject);
      }
    } else {
      value = karma.forThing(subject);
    }
    message = subject + ' has ' + value + ' karma.';
  } else {
    message =
      '<pre>' +
      'Karma matching is currently ' + (enabled ? 'enabled' : 'disabled') + ' in this room.\n\n' +
      'Usage:\n' +
      '  /karma                 print this help message\n' +
      '  /karma {thing}         lookup something\'s current karma\n' +
      '  /karma @{MentionName}  lookup a user\'s current karma\n' +
      '  /karma :on             enable karma matching in the current room\n' +
      '  /karma :off            disable karma matching in the current room\n' +
      '  {subject}++            add karma to a given subject\n' +
      '  {subject}++++          add 3 karma to a given subject\n' +
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
  var store = addonStore.narrow(this.tenant.group);
  if ((yield store.get(roomKey(room.id))) === false) return;

  var karma = Karma(addonStore, this.tenant.group);
  var reIncDec = new RegExp(strIncDec, 'g');
  var match;
  while (match = reIncDec.exec(this.content)) {
    var message;
    var subject;
    var isMention = match[1] && match[1].charAt(0) === '@';
    var change = match[6].length - 1;
    var changed = (change > 0 ? 'increased' : 'decreased');
    var value;
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
          notify.call(this, 'Don\'t be a weasel.');
          return;
        } else {
          subject = user.name;
          value = yield karma.updateUser(user.id, change);
        }
      } else {
        subject = match[1];
        value = karma.updateThing(subject, change);
      }
    } else {
      subject = match[2] || match[3] || match[5];
      value = karma.updateThing(subject, change);
    }
    var possessive = subject + '\'' + (subject.charAt(subject.length - 1) === 's' ? '' : 's');
    message = possessive + ' karma has ' + changed + ' to ' + value + '.';
    notify.call(this, message);
  }
});

app.listen();

function notify(message) {
  this.roomClient.sendNotification(message, {color: 'gray', format: 'html'});
}
