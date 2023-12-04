# geowiki2mapnik
Convert a [geowiki](https://geowiki.net) stylesheet into a [Mapnik](https://mapnik.org) stylesheet, for usage with a PostgreSQL/PostGIS database imported by standard [osm2pgsql](https://osm2pgsql.org). To be able to use the [TwigJS](https://github.com/twigjs/twig.js) templates that Geowiki stylesheet (may) use, geowiki2mapnik uses the [plv8](https://plv8.github.io/) extension.

## INSTALLATION
```
git clone https://github.com/geowiki-net/geowiki2mapnik
cd geowiki2mapnik
npm install
```

## USAGE
```
./cli.js stylesheet.yaml
```

This creates two files:
* `stylesheet.xml`, the Mapnik stylesheet
* `stylesheet.sql`, the PostgreSQL/plv8 functions

Load the functions into the database, and you are good to go.
```
psql gis < stylesheet.sql
```

## DOCUMENTATION
Stylesheet use the Geowiki format, which is based on YAML with TwigJS templates.
### Example
```yaml
layers:
- query: way[highway]
  feature:
    style:
      width: 5
      fill: false
      color: '#ff0000'
      dashArray: |-
        {{ tags.highway in ['primary', 'secondary', 'tertiary'] ? '' : '5,5' }}

- query: nwr[natural=water]
  feature:
    style:
      fill: true
      fillColor: '#afafff'
      width: 1
      color: '#0000ff'
      zIndex: -1
```

### TwigJS
#### TwigJS templates
When rendering map features, the following properties are available:
* `id` (the id of the object is always available, prefixed 'n' for nodes, 'w' for ways and 'r' for relations; e.g. 'n1234')
* `osm_id` (the numerical id of the object)
* `type` ('node', 'way' or 'relation')
* `tags.*` (all tags are available with the prefix tags., e.g. tags.amenity)
* `map.scale_denominator` (Scale denominator at the current zoom level)
* `map.zoom` (Current zoom level)
* `const.*` (Values from the 'const' option)

#### TwigJS extra functions and filters
Currently none.
