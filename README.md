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
* `mapnik.xml`, the Mapnik stylesheet
* `mapnik.sql`, the PostgreSQL/plv8 functions

Load the functions into the database, and you are good to go.
```
psql gis < mapnik.sql
```
