var matchUtil = require('../match/match-util');
var config = require('../config/config');
var fs = require('fs');
var _ = require('underscore');
var loadPhrases = require('../utils/loaders').loadPhrases;
var prefixTrie = require('../match/prefixTrie');
var save = require('../utils/utils').save;
var write = require('../utils/utils').write;
var get = require('../utils/utils').get;
var lowerCaseProps = require('../utils/utils').lowerCaseProps;
var PhraseTrie = require('../utils/phraseTrie');
var objToTrie = require('../utils/objToTrie');
var parseCommands = require('../match/parseCommands').parseCommands;
var coreUtils = require('../packages/core-utils');


var get = function (name) {
  return JSON.parse(localStorage.getItem(name));
};

var lowerCaseProps = function (obj) {
  var newObj = {};
  for (var key in obj) {
    newObj[key.toLowerCase()] = obj[key];
  }
  return newObj;
};

module.exports.saveCommands = function (obj) {
  if (typeof obj === 'object') {
    obj = JSON.stringify(obj);
  }
  save('Commands', obj);
};

module.exports.loadPackage = function (commandsPath) {
  var commandObj = {};
  var rawCommands = lowerCaseProps(JSON.parse(fs.readFileSync(commandsPath, 'utf8')));
  // Injects coreUtil functionality into any package that is created
  commandObj.rawCommands = _.defaults(coreUtils, rawCommands);
  commandObj.parsedCommands = parseCommands(rawCommands); // { exactCommands: {}, argCommands: {}}

  commandObj.commandsPath = commandsPath;
  commandObj.phrasesPath = commandsPath.replace('commands.', 'phrases.');

  // here we make the phrases trie
  commandObj.phrases = loadPhrases(commandObj.phrasesPath, commandObj.rawCommands);

  // Create prefixTrie with just the argCommands
    // If prefixTrie returns a prefix, safely assume it is a known command
  prefixTrie.build(Object.keys(commandObj.parsedCommands.argCommands));
  module.exports.saveCommands(commandObj);
};

module.exports.getCommands = function () {
  var commandsObj = get('Commands');
  commandsObj.phrases = objToTrie(commandsObj.phrases);
  return commandsObj;
};

module.exports.updateCommands = function (command) {
  var newCommandsObj = _.extend({}, module.exports.getCommands());
  newCommandsObj.rawCommands = lowerCaseProps(_.extend(module.exports.getCommands().rawCommands, command));
  newCommandsObj.parsedCommands = parseCommands(newCommandsObj.rawCommands);
  module.exports.saveCommands(newCommandsObj);
  write(newCommandsObj.commandsPath, newCommandsObj.rawCommands);
  module.exports.addPhrase(Object.keys(command)[0], Object.keys(command)[0]);
};

module.exports.delCommand = function (command) {
  var commandsObj = module.exports.getCommands();
  delete commandsObj.rawCommands[command];
  delete commandsObj.phrases[command];
  module.exports.saveCommands(commandsObj);
  write(commandsObj.commandsPath, commandsObj.rawCommands);
  write(commandsObj.phrasesPath, commandsObj.phrases);
};

module.exports.addPhrase = function (correctCommand, userCommand) {
  var commandsObj = module.exports.getCommands();
  commandsObj.phrases = objToTrie(commandsObj.phrases);
  commandsObj.phrases.addPhrase(userCommand, correctCommand);
  module.exports.saveCommands(commandsObj);
  write(commandsObj.phrasesPath, commandsObj.phrases);
};
