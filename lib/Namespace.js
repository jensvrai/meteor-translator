/**
 * The namespace is actually a bounch of files but one file per locale. eg.:
 * myTool.en_US.lang.yml
 * myTool.de_DE.lang.yml
 *
 * This is the server implementation which means it blocks.
 *
 * @protected
 * @constructor
 * @param {string} name
 */
Namespace = function (name) {
  var self = this;
  self._name = name;
  self._init(name);
};

/**
 * @private
 * @type {Object.<string, !Namespace>}
 */
Namespace._instances = {};

/**
 * @param {string} filename
 * @return {!Namespace}
 */
Namespace.instance = function (name) {
  var self = this; // reference to the Namespace implementation
  var hasInstance = self._instances.hasOwnProperty(name);
  if (! hasInstance) {
    self._instances[name] = new self(name);
  }
  return self._instances[name];
};

/**
 * This is the constructor of the specific implementation (client, server)
 *
 * @protected
 * @param {string} name
 */
//Namespace.prototype._init = function (name) {};

/**
 * @protected
 * @param {string} locale
 * @param {string} filename
 * @param {mixed}  error    additional error information
 */
Namespace.prototype._loadError = function (locale, filename, error) {
  console.error(
    "couldn't load translation namespace '"
    + this._name + "' for locale '" + locale + "'"
    + "tried to access '" + filename + "' ",
    error.message, error
  );
};

/**
 * Tells if a reactive call could happen. This is true if a call to ::get()
 * has not found a match but there are fallbacks that are loading right now.
 *
 * This is mostly usefull for tests but can also come in handy if you try to
 * do something that shouldn't be recomputed like:
 *
 * var message = translator.get("messages.my_message");
 * if (! translator.isLoading()) {
 *   sendMessage(message);
 *   Deps.currentComputation.stop();
 * }
 *
 * @return {bool}
 */
//Namespace.prototype.isLoading = function () {
//  return false;
//};

/**
 * Prepares the Namespace for a language.
 * It may download/interpret files for that.
 * The call to this method should be optional!
 * 
 * @param {!Language} language
 */
//Namespace.prototype.prepare = function (language) {
//  throw new Error("missing implementation of Namespace::prepare");
//};

/**
 * Has to return the value of the given key.
 * If there is no value return undefined, not null!
 *
 * @param {string}    key
 * @param {!Language} language
 * @return {undefined|mixed}
 */
//Namespace.prototype.get = function (key, language) {
//  throw new Error("missing implementation of Namespace::get");
//};

/**
 * @param {string}    key
 * @param {!Language} language
 * @return {bool}
 */
Namespace.prototype.has = function (key, language) {
  return this.get(key, language) !== undefined;
};

/**
 * Simply returns the name of this namespace.
 *
 * @return {string}
 */
Namespace.prototype.toString = function () {
  return this._name;
};