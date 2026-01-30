# mapnik-geowiki
Render a [geowiki](https://geowiki.net) stylesheet with [Mapnik](https://mapnik.org). Data is being loaded either from an Overpass API server or a .osm/.osm.json/.osm.bz2 file.

## INSTALLATION
tested with Ubuntu 25.10:

```
sudo apt install nik4 nodejs npm # this installs all mapnik dependencies
npm config set prefix /home/username
npm install -g @geowiki-net/mapnik-geowiki
export PATH=$PATH:/home/username/bin # if this has not been added automatically.
```

Notice: In Ubuntu 22.04, libmapnik3.1 has been compiled without support for proj. Therefore you either have to compile it yourself, or use an older or newer Ubuntu version.

## USAGE
```
mapnik-geowiki -z18 --bbox 48.195,16.369,48.197,16.373 [--source file.osm] [--output image.pdf] --style stylesheet.yaml
```

Render the given area at the given zoom level of the data source file.osm (or the default Overpass API server if omitted) to the file image.pdf (image.svg if omitted) using the style of stylesheet.yaml. See below for an example stylesheet.

This creates the following temporary files:
* `data.geojson`: The prepared data for Mapnik
* `example.xml`: The compiled stylesheet for Mapnik

One of the following parameter combinations to define the area has to be used:
* `-z18 --bbox minlat,minlon,maxlat,maxlon`: render the bounding box at zoom level 18, the image will be cropped at the bouding box.
* `--size 100x100 --bbox minlat,minlon,maxlat,maxlon`: the zoom level will automatically be calculated, so that the bounding box will fit into the image. The bouding box is extended to match the image size.
* `-z18 --size 100x100 --center lat,lon`: A bounding box around center will be calculated to match the image size at the specified zoom level.
* `-z18 --size 100x100 --bbox minlat,minlon,maxlat,maxlon`: the bounding box will be extended or cropped to match the image size at the specified zoom level.

## DEVELOPMENT
```
apt install nik4 # this installs all mapnik dependencies
git clone https://github.com/geowiki-net/mapnik-geowiki
cd mapnik-geowiki
npm install
```

Use `cli.js` instead of the `mapnik-geowiki` command.

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
* `meta.*` (meta data of the object, e.g. user, changeset, ...)
* `is_area` (if the way is closed or the relation is a multipolygon)
* `members[]` (an array of all members)
  * `id`, `osm_id`, `type`, `tags`, `meta` (like for the map feature itself)
  * `sequence` (the nth member)
  * `role` (of the member if part of a relation)
  * `connectedPrev`, `connectedNext` (if connected to neighbouring ways in a relation)
  * `dir` (either `forward`, `backward` or null, if connected to neighbouring ways)

These global properties are available:
* `map.metersPerPixel` (Scale denominator at the center of the current view. If you use `width: {{ 3 / map.metersPerPixel }}` you get a line which is 3m wide.)
* `map.zoom` (Current zoom level)
* `const.*` (Values from the 'const' section of the stylesheet)
* `parameters` (The value of the `parameters` argument to the command line interface, JSON decoded)

#### TwigJS extra functions and filters
Currently none.
