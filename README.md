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
./cli.js -z18 --bbox 48.195,16.369,48.197,16.373 [--source file.osm] [--output image.pdf] stylesheet.yaml
```

Render the given area at the given zoom level of the data source file.osm (or the default Overpass API server if omitted) to the file image.pdf (image.svg if omitted).

This creates the following temporary files:
* `data.geojson`: The prepared data for Mapnik
* `example.xml`: The compiled stylesheet for Mapnik

One of the following parameter combinations to define the area has to be used:
* `-z18 --bbox minlat,minlon,maxlat,maxlon`: render the bounding box at zoom level 18, the image will be cropped at the bouding box.
* `--size 100x100 --bbox minlat,minlon,maxlat,maxlon`: the zoom level will automatically be calculated, so that the bounding box will fit into the image. The bouding box is extended to match the image size.
* `-z18 --size 100x100 --center lat,lon`: A bounding box around center will be calculated to match the image size at the specified zoom level.
* `-z18 --size 100x100 --bbox minlat,minlon,maxlat,maxlon`: the bounding box will be extended or cropped to match the image size at the specified zoom level.

## DOCUMENTATION
Stylesheet use the [Geowiki format](https://github.com/geowiki-net/geowiki-spec), which is based on YAML with TwigJS templates. Not all parameters are supported.
### Example
```yaml
background: '#ffffff'

layers:
- query: way[highway]
  feature:
    style:
      width: |
        {% if tags.highway in ['primary', 'secondary', 'tertiary'] %}5
        {% elseif tags.highway in ['cycleway', 'footway', 'service'] %}1.5
        {% else %}3
        {% endif %}
      fill: false
      color: '#000000'
      dashArray: |
        {{ tags.highway in ['cycleway', 'footway', 'service'] ? '5,5' : '' }}
      text: '{{ tags.name }}'
      textOffset: 5

- query: nwr[building]
  feature:
    style:
      width: 0.5
      color: '#7f7f7f'
      fill: true
      fillOpacity: 1
      fillColor: '#afafaf'
```

### TwigJS
#### TwigJS templates
If a value of a stylesheet is a string (notice the '|' symbol after the key), it may contain a function written in [TwigJS](https://github.com/twigjs/twig.js) (see [Twig Syntax](https://en.wikipedia.org/wiki/Twig_(template_engine)#Syntax) for an introduction.

When rendering map features, the following properties are available:
* `id` (the id of the object is always available, prefixed 'n' for nodes, 'w' for ways and 'r' for relations; e.g. 'n1234')
* `osm_id` (the numerical id of the object)
* `type` ('node', 'way' or 'relation')
* `tags.*` (all tags are available with the prefix tags., e.g. `tags.amenity`)
* `map.metersPerPixel` (Scale denominator at the current zoom level)
* `map.zoom` (Current zoom level)
* `const.*` (Values from the 'const' option)

#### TwigJS extra functions and filters
Currently none.
