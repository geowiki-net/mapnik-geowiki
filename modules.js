module.exports = [
  // Various twig functions
  require('@geowiki-net/geowiki-twig-functions'),

  // Geometric functions using the Turf.js library
  require('geowiki-module-turf'),

  // Merge line strings
  require('geowiki-module-merge-line-strings'),

  // Enable support for color functions
  require('geowiki-module-color'),
]
