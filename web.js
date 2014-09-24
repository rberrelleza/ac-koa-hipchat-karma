var MongoStore = require('ac-node').MongoStore;
var track = require('ac-koa-hipchat-keenio').track;
var Notifier = require('ac-koa-hipchat-notifier').Notifier;
var Karma = require('./lib/karma');

var ack = require('ac-koa').require('hipchat');
var pkg = require('./package.json');
var app = ack(pkg, {store: 'MongoStore'});

var addon = app.addon()
  .hipchat()
  .allowGlobal(true)
  .allowRoom(true)
  .scopes('send_notification', 'view_group');

track(addon);

var addonStore = MongoStore(app.config.MONGO_ENV, 'karma');
var notifier = Notifier({format: 'html', dir: __dirname + '/messages'});

addon.webhook('room_message', /^\/karma(?:\s+(:)?(.+?)\s*$)?/i, function *() {
  var match = this.match;
  var room = this.room;
  var karma = Karma(addonStore, this.tenant.group);
  var enabled = yield karma.isEnabled(room.id);
  var command = match && match[1] === ':' && match[2];
  var subject = match && !match[1] && match[2];
  if (command) {
    if (command === 'enable') {
      enabled = true;
      yield karma.setEnabled(room.id, enabled);
      return yield notifier.send('Karma matching has been enabled in this room.');
    } else if (command === 'disable') {
      enabled = false;
      yield karma.setEnabled(room.id, enabled);
      return yield notifier.send('Karma matching has been disabled in this room.');
    } else {
      return yield notifier.send('Sorry, I didn\'t understand that.');
    }
  } else if (subject) {
    if (subject.charAt(0) === '@') {
      var user = yield this.tenantClient.getUser(subject);
      var value;
      if (user) {
        subject = user.name;
        value = yield karma.forUser(user.id);
      } else {
        value = yield karma.forThing(subject);
      }
    } else {
      value = yield karma.forThing(subject);
    }
    return yield notifier.send(subject + ' has ' + value + ' karma.');
  } else {
    return yield notifier.sendTemplate('help', {
      enabled: enabled ? 'enabled' : 'disabled'
    });
  }
});

var strIncDec = '(?:(?:(?:(@\\w+))\\s?)|([\\w]+)|(\\([\\w]+\\))|(?:(["\'])([^\4]+)\\4))(\\+{2,}|-{2,})';
addon.webhook('room_message', new RegExp(strIncDec), function *() {
  var room = this.room;
  var sender = this.sender;
  var karma = Karma(addonStore, this.tenant.group);

  // don't parse other slash commands
  if (/^\/\w+/.test(this.content)) return;
  // don't respond if disabled in the current room
  if (!(yield karma.isEnabled(room.id))) return;

  var reIncDec = new RegExp(strIncDec, 'g');
  var match;
  while (match = reIncDec.exec(this.content)) {
    var subject;
    var isMention = match[1] && match[1].charAt(0) === '@';
    var change = match[6].length - 1;
    var maxed = false;
    if (change > 5) {
      change = 5;
      maxed = true;
    }
    var value;
    if (match[6].charAt(0) === '-') {
      change = -change;
    }
    var changed = (change > 0 ? 'increased' : 'decreased');
    if (isMention) {
      var mentionName = match[1].toLowerCase().slice(1);
      var user = this.message.mentions.find(function (user) {
        return user.mention_name.toLowerCase() === mentionName;
      });
      if (user) {
        if (user.id === sender.id) {
          return yield notifier.send(change > 0 ? 'Don\'t be a weasel.' : 'Aw, don\'t be so hard on yourself.');
        } else {
          subject = user.name;
          value = yield karma.updateUser(user.id, change);
        }
      } else {
        subject = match[1];
        value = yield karma.updateThing(subject, change);
      }
    } else {
      subject = match[2] || match[3] || match[5];
      value = yield karma.updateThing(subject, change);
    }
    var possessive = subject + '\'' + (subject.charAt(subject.length - 1) === 's' ? '' : 's');
    var message = possessive + ' karma has ' + changed + ' to ' + value;
    if (maxed) {
      message += ' (maximum change of 5 points enforced)';
    }
    message +='.';
    return yield notifier.send(message);
  }
});

app.listen();
