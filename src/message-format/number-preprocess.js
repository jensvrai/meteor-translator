var cldr = Npm.require('cldr');

/**
 * The resulting expression will only match if the content is not inside quotes
 */
var unescapedExpr = function (s, m) {
  return new RegExp(s + '(?=(?:[^\']|\'[^\']*\')*$)', m);
};

//                             (   num   )(point + number )(     exp.     )
var RX_NUMBER = unescapedExpr('([\\d#@,]+)(?:\\.([\\d#]+))?(?:E(\\+?\\d+))?');
var RX_SPLIT_PATTERNS = unescapedExpr(';');
var RX_IS_SIGNIFICANT = unescapedExpr('@');
var RX_IS_SCIENTIFIC  = unescapedExpr('E');
var RX_PERCENT  = unescapedExpr('%', 'g');
var RX_PERMILLE = unescapedExpr('‰', 'g');
var RX_PLUS  = unescapedExpr('\\+', 'g');
var RX_MINUS = unescapedExpr('\\-', 'g');
var RX_PADDING = unescapedExpr('\\*(.)');

var replaceStaticChars = function (string, locale) {
  var latnSymbols = cldr.extractNumberSymbols(locale, 'latn');
  string = string.replace(RX_PERCENT, latnSymbols.percentSign);
  string = string.replace(RX_PERMILLE, latnSymbols.perMille);
  string = string.replace(RX_PLUS, latnSymbols.plusSign);
  string = string.replace(RX_MINUS, latnSymbols.minusSign);
  return string;
};

var parseNumberFormat = function (string, locale) {
  var numberFormat = {
    isSignificant: RX_IS_SIGNIFICANT.test(string) || void 0,
    isScientific: RX_IS_SCIENTIFIC.test(string) || void 0,
    
    multiplicator: RX_PERCENT.test(string) ? 100
                 : RX_PERMILLE.test(string) ? 1000
                 : void 0,
    
    groups: [] // where groups have to be, eg. [3] = every 3 digits
    // there are cases eg in Hindi where patterns like #,##,##0 [3,2] are needed
    // the last number will be repeated.
    // UTS only requires a primary and secondary group
    
    //'+': ['', ''] // prefix and suffix for a positive number
    //'-': ['', ''] // prefix and suffix for a negative number 
  };
  
  
  // pre and suffix for this number
  var patterns = string.replace(RX_PADDING, ''); // for now remove padding
  patterns = patterns.split(RX_SPLIT_PATTERNS, 2); // split both patterns
  _.each(['+', '-'], function (variant, index) {
    var pattern = patterns[index];
    // it this is the minus pattern put there is no specific for -
    if (pattern == null) {
      pattern = patterns[0];
      if (RX_PLUS.test(pattern)) {
        pattern = pattern.replace(RX_PLUS, '-');
      } else {
        pattern = pattern.replace(RX_NUMBER, '-$&');
      }
    }
    var hash = pattern.split(RX_NUMBER, 2);
    numberFormat[variant] = [
      replaceStaticChars(hash[0] || '', locale),
      replaceStaticChars(hash[4] || '', locale)
    ];
  });
  
  var pattern = patterns[0].match(RX_NUMBER); // only look at the first
  var prePoint = pattern[1] || '';
  var postPoint = pattern[2] || '';
  var exponent = pattern[3] || '';
  
  // parse the main part of the number
  if (numberFormat.isSignificant) {
    if (/\d/.test(prePoint) || postPoint != '') {
      throw new Error("significant number patterns may not contain"
        + " a decimal separator, nor the '0' pattern character."
        + " Patterns such as \"@00\" or \"@.###\" are disallowed.");
    }
    _.extend(numberFormat, { // <=
      min: prePoint.replace(/[^@]/g, '').length,
      max: prePoint.match(/@[@#]*/)[0].length
    })
  } else {
    var padding = string.match(RX_PADDING);
    _.extend(numberFormat, { // <=
      digits: prePoint.replace(/\D/g, '').length,
      minPost: postPoint.match(/^\d*/)[0].length,
      maxPost: postPoint.match(/^[\d#]*/)[0].length,
      divider: parseFloat(pattern[0].replace(/[#@]/g, '0').replace(/,/g, '')) || void 0,
      padNum: padding != null ? prePoint.match(/[\d#]*$/)[0].length : void 0,
      padding: padding != null ? padding : void 0
      
      // TODO the number of digits post has to be overwritten by the currency
      // XXX the scientific case is not well displayed here
    });
  }
  
  // handle groups
  prePoint.replace(/,([\d#]+)/g, function (s, numbers) {
    numberFormat.groups.unshift(numbers.length);
  });
  numberFormat.groups = numberFormat.groups.slice(0, 2); // only 2
  
  // parse the sientific part of the number
  if (numberFormat.isScientific) {
    if (numberFormat.groups.length > 0) {
      throw new Error("Exponential patterns may not contain grouping separators.");
    }
    _.extend(numberFormat, { // <=
      exponentPlus: exponent.charAt(0) === '+' || void 0,
      exponent: exponent.replace(/\D/g, '').length
    });
  }
  
  return numberFormat;
};

var parseNumberFormatWithPlural = function (formats) {
  console.log(formats);
  formats = _.pick(formats, 'zero', 'one', 'two', 'few', 'many', 'other'); // XXX there may be =0
  return _.map(formats, parseNumberFormat);
};





messageFormatPreprocess.number = function (object, data) {
  var locale = data.locale.toString();
  // add cldr information
  var meta = data.meta;
  if (! meta.hasOwnProperty('latnSymbols')) {
    var latnSymbols = cldr.extractNumberSymbols(locale, 'latn');
    meta['latnSymbols'] = _.pick(latnSymbols,
      'decimal',
      'group',
      'plusSign', // only required for exponent
      'minusSign', // only required for exponent
      'exponential',
      'infinity',
      'nan'
    );
  }
  
  // type of number to print
  var type = (object.args && object.args[0]) || 'decimal';
  var formats = cldr.extractNumberFormats(data.locale.toString(), 'latn');
  var format = formats[type] || object.rawArgs; // FIXME this discards spaces
  switch (type) {
    // look at node-cldr documentation to get a roough feeling for whats happening
    // https://github.com/papandreou/node-cldr#cldrextractnumberformatslocaleidroot-numbersystemidlatn
    case 'decimal':
      var length = (object.args && object.args[0]) || 'default';
      if (! format.hasOwnProperty(length)) {
        throw new Error("The number length '" + length
          + "' is unknown for a '" + type + "'");
      }
      
      var formatVariation = format[length];
      if (_.isObject(formatVariation)) { // the thousand etc are objects
        format = _.map(formatVariation, function (format) {
          return parseNumberFormatWithPlural(format);
        });
      } else {
        format = parseNumberFormat(formatVariation);
      }
      break;
    default:
      format = parseNumberFormat(format);
  }
  
  return _.defaults(format, {
    name: object.name,
    method: object.method
  });
};
