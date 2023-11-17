function filter2mapnik (query) {
  if (query.or) {
    return query.or.map(f => '(' + filter2mapnik(f) + ')').join(' OR ')
  }
  else if (query.and) {
    return query.and.map(f => '(' + filter2mapnik(f) + ')').join(' AND ')
  }
  else if (Array.isArray(query)) {
    return query.map(f => '(' + filter2mapnik(f) + ')').join(' AND ')
  }
  else if (query.type) {
    return 
  }

  return ''
}

module.exports = filter2mapnik
