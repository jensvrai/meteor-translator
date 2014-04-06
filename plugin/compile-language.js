var yaml = Npm.require("js-yaml");

var RX_VALID_KEY = /^\w+$/; // only 0-9, a-z and _
var keyValid = function (key) {
  return RX_VALID_KEY.test(key);
}

/**
 * @param {string} baseKey
 * @param {mixed}  value
 * @param {Object.<string, string>} result
 */
var parseValue = function (baseKey, value, result) {
  if (_.isObject(value) && ! _.isArray(value)) {
    _.each(value, function (value, key) {
      var newKey = baseKey + "." + key;
      
      // if a key does not only contain wordchars
      // it could be more logic involved so pass it though
      if (keyValid(key)) {
        parseValue(newKey, value, result);
      } else {
        result[newKey] = value;
      }
    });
  } else {
    result[baseKey] = value;
  }
}

// compiler for .lang.yml files
var handler = function (compileStep, isLiterate) {
  var source = compileStep.read().toString("utf8");
  try {
    var doc = yaml.safeLoad(source);
    
    // parse the document
    var parsedDoc = {};
    _.each(doc, function (value, key) {
      if (! keyValid(key)) {
        var msg = "Only wordchars and underscores are allowed ";
        msg += "in translation keys. Got '" + baseKey + "'";
        throw new Error(msg);
      }
      parseValue(key, value, parsedDoc);
    });
    var jsonDoc = JSON.stringify(parsedDoc);
    var filename = compileStep.inputPath + ".json";
    
    
    
    if (compileStep.arch == "browser") {
      // save the file asset
      compileStep.addAsset({
        path: filename,
        data: new Buffer(jsonDoc)
      });
    }
    
    if (compileStep.arch == "os") {
      // XXX this entire part is a hack for accessing assets on the server
      filename = compileStep.rootOutputPath + "/" + filename;
      // add it as a js file for the server
      compileStep.addJavaScript({
        path: compileStep.inputPath,
        data: "Translator._files[" + JSON.stringify(filename) + "] = " + jsonDoc,
        sourcePath: compileStep.inputPath,
        bare: false
      });
    }
    
  } catch (e) {
    compileStep.error({
      message: e.message,
      sourcePath: compileStep.inputPath
    });
  }
};

Plugin.registerSourceHandler("lang.yml", handler);
