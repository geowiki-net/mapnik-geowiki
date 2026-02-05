/* for each field, the following parameters can be set:
   - depend: a list of fields, this value depends upon (default: the field)
   - fun: a function which will calculate the final value
*/
module.exports = {
  _spacing: {
    depend: ['textRepeat', 'textRepeatSpacing'],
    fun: properties => {
      if (properties.textRepeat) {
        return properties.textRepeatSpacing === 0 ? 0.0001 : properties.textRepeatSpacing
      } else {
        return 0
      }
    }
  }
}
