# mapnik-geowiki
Render a [geowiki](https://geowiki.net) stylesheet with a [Mapnik](https://mapnik.org). Data is being loaded either from an Overpass API server or a .osm/.osm.json/.osm.bz2 file.

## INSTALLATION
```
apt install nik4 # this installs all mapnik dependencies
git clone https://github.com/geowiki-net/mapnik-geowiki
cd mapnik-geowiki
npm install
```

Notice: In Ubuntu 22.04, libmapnik3.1 has been compiled without support for proj. Therefore you either have to compile it yourself, or use an older or newer Ubuntu version.

## USAGE
```
./cli.js stylesheet.yaml
```

This creates a file:
* `stylesheet.xml`, the Mapnik stylesheet

```
./prepare_data.js -z14 --bbox 48.1,16.2,48.3,16.4 [--source file.osm] [--output image.pdf] stylesheet.yaml
```

Render the given area at the given zoom level of the data source file.osm (or the default Overpass API server if omitted) to the file image.pdf (image.svg if omitted).

The creates the following temporary files:
* `data.geojson` The prepared data for Mapnik

## DOCUMENTATION
Stylesheet use the Geowiki format, which is based on YAML with TwigJS templates.
### Example
```yaml
background: '#ffffff'

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
* `map.metersPerPixel` (Scale denominator at the current zoom level)
* `map.zoom` (Current zoom level)
* `const.*` (Values from the 'const' option)

#### TwigJS extra functions and filters
Currently none.
