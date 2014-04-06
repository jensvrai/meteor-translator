Package.describe({
  summary: "A feature rich translation package"
});

Package._transitional_registerBuildPlugin({
  name: 'compileLanguage',
  use: ['underscore'],
  sources: ['plugin/compile-language.js'],
  npmDependencies: { 'js-yaml': '3.0.2' }
});

Package.on_use(function(api) {
  api.use(['underscore', 'ejson', 'deps', 'headers'], ['client', 'server']);
  api.use(['http'], ['client']);

  api.add_files([
    'lib/Locale.js',
    'lib/LanguageArray.js',
    "lib/LanguageArrayAutodetect.js",
    'lib/NamespaceAbstract.js',
    'lib/FilterList.js',
    'lib/Translator.js',
    'lib/FilterList/parameter.js',
    'lib/Translator/globalLang.js'
  ], ['client', 'server']);
  api.add_files([
    'client/Namespace.js',
    'client/helper.js'
  ], ['client']);
  api.add_files([
    'server/Namespace.js'
  ], ['server']);
  
  api.add_files(['Translator.js'], ['client', 'server']);
  api.export(['Translator']);
});

Package.on_test(function (api) {
  api.use(['translator', 'tinytest', 'test-helpers'], ['client', 'server']);
  api.add_files([
    'tests/namespace.de_DE.lang.yml',
    'tests/namespace.en_US.lang.yml'
  ], ['client', 'server']);
  api.add_files([
    'tests/Locale.js',
    'tests/LanguageArray.js',
    'tests/Namespace.js',
    'tests/FilterList.js',
    'tests/FilterList/parameter.js',
    'tests/Translator.js'
  ], ['client', 'server']);
});
