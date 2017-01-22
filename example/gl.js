var regl = require('regl')()
var camera = require('regl-camera')(regl, { distance: 10 })
var glsl = require('glslify')
var mousewheel = require('mouse-wheel')
var mousechange = require('mouse-change')

var proj = require('glsl-proj4')
var p = proj(`+proj=tmerc +lat_0=18.83333333333333 +lon_0=-155.5
  +k_0=6e-6 +x_0=0.01 +y_0=-0.3 +ellps=GRS80 +units=m +no_defs`)

function members (name) {
  var m = p.members(name)
  var x0 = m[name+'.x0']
  var y0 = m[name+'.y0']
  var k0 = m[name+'.k0']
  m[name+'.x0'] = function () { return x0 }
  m[name+'.y0'] = function () { return y0 }
  m[name+'.k0'] = function () { return k0 }
  var prevx = 0, prevy = 0
  mousechange(function (buttons, x, y) {
    var dx = x - prevx, dy = y - prevy
    var m = Math.max(window.innerWidth, window.innerHeight)
    prevx = x, prevy = y
    if (buttons & 1) {
      x0 += dx / m * 2
      y0 -= dy / m * 2
    }
  })
  mousewheel(function (dx, dy) {
    k0 *= 1-dy/1000
    x0 *= 1-dy/1000
    y0 *= 1-dy/1000
  })
  return m
}

var mesh = require('./hawaii.json')
var draw = regl({
  frag: `
    precision mediump float;
    void main () {
      gl_FragColor = vec4(0.5,0.5,0.5,1);
    }
  `,
  vert: glsl`
    precision mediump float;
    #pragma glslify: forward = require('glsl-proj4/tmerc/forward')
    #pragma glslify: proj_t = require('glsl-proj4/tmerc/t')
    uniform proj_t proj;
    attribute vec2 position;
    uniform float aspect;
    void main () {
      vec3 p = forward(proj, position)*vec3(1,aspect,1);
      gl_Position = vec4(p,1);
    }
  `,
  attributes: {
    position: mesh.positions
  },
  uniforms: Object.assign(members('proj'), {
    aspect: function (context) {
      return context.viewportWidth / context.viewportHeight
    }
  }),
  elements: mesh.cells
})
regl.frame(function () {
  regl.clear({ color: [1,1,1,1], depth: true })
  draw()
})
