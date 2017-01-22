var mousewheel = require('mouse-wheel')
var mousechange = require('mouse-change')
var proj = require('glsl-proj4')
var EventEmitter = require('events').EventEmitter

module.exports = function (str) {
  var p = proj(str)
  if (!/\bx_0=/.test(str)) str += ' x_0=0'
  if (!/\by_0=/.test(str)) str += ' y_0=0'
  if (!/\bk_0=/.test(str)) str += ' k_0=0'

  var ev = new EventEmitter
  var ref = p.members('')
  Object.keys(ref).forEach(function (key) {
    ref[key.replace(/^\./,'')] = ref[key]
    delete ref[key]
  })
  var prevx = 0, prevy = 0
  ev.string = function () {
    str = str.replace(/\bx_0=\S+/, 'x_0='+ref.x0)
    str = str.replace(/\by_0=\S+/, 'y_0='+ref.y0)
    str = str.replace(/\bk_0=\S+/, 'k_0='+ref.k0)
    return str
  }
  ev.members = function (name) {
    var m = p.members(name)
    m[name+'.x0'] = function () { return ref.x0 }
    m[name+'.y0'] = function () { return ref.y0 }
    m[name+'.k0'] = function () { return ref.k0 }
    return m
  }
  mousechange(function (buttons, x, y) {
    var dx = x - prevx, dy = y - prevy
    var m = Math.max(window.innerWidth, window.innerHeight)
    prevx = x, prevy = y
    if (buttons & 1) {
      ref.x0 += dx / m * 2
      ref.y0 -= dy / m * 2
      ev.emit('update', ref)
    }
  })
  mousewheel(function (dx, dy) {
    zoom(dy/1000)
  })
  function zoom (x) {
    ref.k0 *= 1-x
    ref.x0 *= 1-x
    ref.y0 *= 1-x
    ev.emit('update', ref)
  }
  window.addEventListener('keydown', function (ev) {
    if (ev.key === '-') {
      zoom(0.3)
    } else if (ev.key === '+' || ev.key === '=') {
      zoom(-0.3)
    }
  })
  return ev
}
