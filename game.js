const menu = document.querySelector('.menu')
const gravityButton = document.querySelector('#gravitybox')
const animationToggleButton = document.querySelector('#pause')
const canvas = document.querySelector('#container')
const base = document.querySelector('#base')
const upperString = document.querySelector('#upper_string')
const lowerString = document.querySelector('#lower_string')
const upperBob = document.querySelector('#upper_bob')
const lowerBob = document.querySelector('#lower_bob')
const tracerLine = document.querySelector('#tracer')
let animation

class DoublePendulum {
  constructor({
    width,height,x0,y0,ang0,ang1,v0,v1,acc0,acc1,baseRad,l0,l1,r0,r1,m0, m1,g,massScaleFactor,speedScaleFactor,dt,fps,
  }) {
    this.width = width
    this.height = height
    this.x0 = x0
    this.y0 = y0
    this.ang0 = ang0
    this.ang1 = ang1
    this.v0 = v0
    this.v1 = v1
    this.acc0 = acc0
    this.acc1 = acc1
    this.baseRad = baseRad
    this.l0 = l0
    this.l1 = l1
    this.r0 = r0
    this.r1 = r1
    this.m0 = m0
    this.m1 = m1
    this.g = g
    this.upperBobHold = false
    this.lowerBobHold = false
    this.baseHold = false
    this.massScaleFactor = massScaleFactor
    this.speedScaleFactor = speedScaleFactor
    this.dt = dt
    this.fps = fps
    this.setMoments()
  }

  setWidth(w) {
    this.width = w
  }

  setHeight(h) {
    this.height = h
  }

  setUpperAngle(ang) {
    this.ang0 = ang
  }

  setLowerAngle(ang) {
    this.ang1 = ang
  }

  setUpperVelocity(vel) {
    this.v0 = vel
  }

  setLowerVelocity(vel) {
    this.v1 = vel
  }

  setUpperAcceleration(acc) {
    this.acc0 = acc
  }

  setLowerAcceleration(acc) {
    this.acc1 = acc
  }

  increaseSpeed() {
    this.dt *= this.speedScaleFactor
  }

  decreaseSpeed() {
    this.dt /= this.speedScaleFactor
  }

  increaseUpperMass() {
    this.m0 *= this.massScaleFactor
  }

  decreaseUpperMass() {
    this.m0 /= this.massScaleFactor
  }

  increaseLowerMass() {
    this.m1 *= this.massScaleFactor
  }

  decreaseLowerMass() {
    this.m1 /= this.massScaleFactor
  }

  setGravity(gravity) {
    this.g = gravity
  }

  setMoments() {
    const { m0, m1, ang0, ang1, l0, l1, v0, v1 } = this
    const commonVal = m1 * l0 * l1 * Math.cos(ang0 - ang1)
    this.moment0 = (m0 + m1) * l0 ** 2 * v0 + v1 * commonVal   // considering both pendulum acc/s 
    this.moment1 = m1 * l1 ** 2 * v1 + v0 * commonVal
  }

  setBasePos(x, y) {
    const upperBob = this.getUpperBob()
    const [distX, distY] = [upperBob.x - x, upperBob.y - y]
    this.x0 = x
    this.y0 = y
    this.l0 = Math.sqrt(distX ** 2 + distY ** 2)
    this.ang0 = Math.atan2(distX, distY)
  }

  setUpperBobPos(x, y) {
    const [distX, distY] = [x - this.x0, y - this.y0]
    this.l0 = Math.sqrt(distX ** 2 + distY ** 2)
    this.ang0 = Math.atan2(distX, distY)
  }

  setLowerBobPos(x, y) {
    const upperBobPos = this.getUpperBob()
    const [distX, distY] = [x - upperBobPos.x, y - upperBobPos.y]
    this.l1 = Math.sqrt(distX ** 2 + distY ** 2)
    this.ang1 = -Math.atan2(distX, distY)
  }

  holdBase() {
    this.baseHold = true
  }

  holdUpperBob() {
    this.upperBobHold = true
  }

  holdLowerBob() {
    this.lowerBobHold = true
  }

  dropBase() {
    this.baseHold = false
  }

  dropUpperBob() {
    this.upperBobHold = false
  }

  dropLowerBob() {
    this.lowerBobHold = false
  }

  calculateBobPosition(x0, y0, angle, len) {
    const offsetX = len * Math.sin(angle)
    const offsetY = len * Math.cos(angle)
    const x = x0 + offsetX
    const y = y0 + offsetY
    return { x, y }
  }

  getUpperBob() {
    const { x0, y0, ang0, l0 } = this
    const { x, y } = this.calculateBobPosition(x0, y0, ang0, l0)
    return { x, y }
  }

  getLowerBob() {
    const upperBobPos = this.getUpperBob()
    const { ang1, l1 } = this
    const { x, y } = this.calculateBobPosition(
      upperBobPos.x,
      upperBobPos.y,
      -ang1,
      l1,
    )
    return { x, y }
  }

  getAngularVelocities() {
    const { ang0, ang1, l0, l1, v0, v1, m0, m1, g } = this
    const cos0 = Math.cos(ang0)
    const sin0 = Math.sin(ang0)
    const cosDiff = Math.cos(ang0 - ang1)
    const sinDiff = Math.sin(ang0 - ang1)
    const cos2Diff = Math.cos(2 * (ang0 - ang1))
    const sinAng2Diff = Math.sin(ang0 - 2 * ang1)
    const velAng0 = l0 * v0 * v0
    const velAng1 = l1 * v1 * v1
    const massSum = m0 + m1
    const doubleMass1Sum = 2 * m0 + m1
    const baseVal = doubleMass1Sum - m1 * cos2Diff
    const ang0Val = velAng1 + velAng0 * cosDiff
    const ang0UpperVal = -g * doubleMass1Sum * sin0 -m1 * g * sinAng2Diff -2 * sinDiff * m1 * ang0Val
    const acc0 = ang0UpperVal / (l0 * baseVal)
    const ang1Val = (velAng0 + g * cos0) * massSum + velAng1 * m1 * cosDiff
    const ang1UpperVal = 2 * sinDiff * ang1Val
    const acc1 = ang1UpperVal / (l1 * baseVal)
    this.setUpperAcceleration(acc0)
    this.setLowerAcceleration(acc1)
    return { acc0, acc1 }
  }

  //main function to predict the path of the pendulum combination

  hamiltonian(ang0, ang1, moment0, moment1) {
    const { m0, m1, l0, l1, g } = this
    const C0 = l0 * l1 * (m0 + m1 * Math.sin(ang0 - ang1) ** 2)
    const C1 = (moment0 * moment1 * Math.sin(ang0 - ang1)) / C0
    const C2 =((m1 * (l1 * moment0) ** 2 +(m0 + m1) * (l0 * moment1) ** 2 -2 * l0 * l1 * m1 * moment0 * moment1 * Math.cos(ang0 - ang1)) *Math.sin(2 * (ang0 - ang1))) /(2 * C0 ** 2)
    const F_ang0 =(l1 * moment0 - l0 * moment1 * Math.cos(ang0 - ang1)) / (l0 * C0)
    const F_ang1 =(l0 * (m0 + m1) * moment1 -l1 * m1 * moment0 * Math.cos(ang0 - ang1)) /(l1 * m1 * C0)
    const F_moment0 = -(m0 + m1) * g * l0 * Math.sin(ang0) - C1 + C2
    const F_moment1 = -m1 * g * l1 * Math.sin(ang1) + C1 - C2
    return [F_ang0, F_ang1, F_moment0, F_moment1]
  }

  move() {
    const { ang0, ang1, moment0, moment1, dt } = this
    const curr = [ang0, ang1, moment0, moment1]
    const k1 = this.hamiltonian(...curr)
    const k2 = this.hamiltonian(...curr.map((_c, _i) => _c + 0.5 * dt * k1[_i]),)
    const k3 = this.hamiltonian(...curr.map((_c, _i) => _c + 0.5 * dt * k2[_i]),)
    const k4 = this.hamiltonian(...curr.map((_c, _i) => _c + dt * k3[_i]))
    const R = [0, 0, 0, 0].map((_c, _i) => (dt * (k1[_i] + 2 * k2[_i] + 2 * k3[_i] + k4[_i])) / 6,)
    this.ang0 += R[0]
    this.ang1 += R[1]
    this.moment0 += R[2]
    this.moment1 += R[3]
    this.ang0 = ((3 * Math.PI + this.ang0) % (2 * Math.PI)) - Math.PI
    this.ang1 = ((3 * Math.PI + this.ang1) % (2 * Math.PI)) - Math.PI
  }
}

class Tracer {
  constructor() {
    this.points = []
    this.MAX = 500
    this.isActive = true
    this.ctr = 0
    this.smooth = 0.2
    this.smoothen = false
  }

  addPoint({ x, y }) {
    if (this.isActive)
      this.points = [...this.points.slice(-this.MAX), { x, y }]
    else this.points = []
  }

  clearPoints() {
    this.points = []
    this.ctr = 0
  }

  getLine(p1, p2) {
    const distX = p2.x - p1.x
    const distY = p2.y - p1.y
    const len = Math.sqrt(distX ** 2 + distY ** 2)
    const ang = Math.atan2(distY, distX)
    return { len, ang }
  }

  getControlPoint(current, previous, next, reverse) {
    previous = previous || current
    next = next || current
    let { len, ang } = this.getLine(previous, next)
    ang = ang + (reverse ? Math.PI : 0)
    len = len * this.smooth
    const x = current.x + len * Math.cos(ang)
    const y = current.y + len * Math.sin(ang)
    return { x, y }
  }

  getSmoothPoint(point, i, points) {
    const prevSmooth = this.getControlPoint(
      points[i - 1],
      points[i - 2],
      point,
    )
    const nextSmooth = this.getControlPoint(
      point,
      points[i - 1],
      points[i + 1],
    )
    return `C${prevSmooth.x.toFixed(2)} ${prevSmooth.y.toFixed(
      2,
    )} ${nextSmooth.x.toFixed(2)} ${nextSmooth.y.toFixed(
      2,
    )} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`
  }

  getPointsAsString() {
    if (this.smoothen) {
      return this.points
        .map(
          ({ x, y }, i) =>
            `${
              i == 0
                ? `M${x} ${y}`
                : this.getSmoothPoint({ x, y }, i, this.points)
            }`,
        )
        .join(' ')
    } else {
      const len = this.points.length
      return this.points
        .map(
          ({ x, y }, i) =>
            `${i == 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`,
        )
        .join(' ')
    }
  }

  setActive(active) {
    this.isActive = active
  }

  setMAX(n) {
    this.MAX = n
  }
}

let doublePendulum

const tracer = new Tracer()

function refresh() {
  const scaleWidth = 100
  const scaleHeight = (100 * innerHeight) / innerWidth
  const scale = Math.min(scaleWidth, scaleHeight)

  doublePendulum = new DoublePendulum({
    width: scaleWidth,
    height: scaleHeight,
    x0: scaleWidth / 2,
    y0: scaleHeight / 2,
    ang0: 0,
    ang1: 0,
    v0: 0,
    v1: 0,
    acc0: 0,
    acc1: 0,
    baseRad: scale / 70,
    l0: scale / 4.5,
    l1: scale / 4.5,
    r0: scale / 30,
    r1: scale / 30,
    m0: 100,
    m1: 100,
    g: 0.1,
    massScaleFactor: 1.2,
    speedScaleFactor: 1.2,
    dt: 1,
    fps: 100,
  })

  if (window.location.hash.length > 0) {
    const query = window.location.hash.substring(1)
    try {
      const encoded_JSON = atob(query)
      const config = JSON.parse(encoded_JSON)
      for (let prop in config) {
        doublePendulum[prop] = config[prop]
      }
      doublePendulum.width = scaleWidth
      doublePendulum.height = scaleHeight
      doublePendulum.x0 = (config.x0 / config.width) * scaleWidth
      doublePendulum.y0 = (config.y0 / config.height) * scaleHeight
    } catch (e) {
      window.location.hash = ''
    }
  }

  canvas.setAttribute(
    'viewBox',
    `0 0 ${doublePendulum.width} ${doublePendulum.height}`,
  )
  gravityButton.checked = doublePendulum.g != 0
  tracer.clearPoints()
}

refresh()

function drawPendulum() {
  const {
    x0,
    y0,
    ang0,
    ang1,
    baseRad,
    r0,
    r1
  } = doublePendulum

  const upperBobPos = doublePendulum.getUpperBob()
  const lowerBobPos = doublePendulum.getLowerBob()

  base.setAttribute('r', baseRad)
  base.setAttribute('cx', x0)
  base.setAttribute('cy', y0)

  upperString.setAttribute('x1', x0)
  upperString.setAttribute('y1', y0)

  upperString.setAttribute('x2', upperBobPos.x)
  upperString.setAttribute('y2', upperBobPos.y)

  upperBob.setAttribute('r', r0)
  upperBob.setAttribute('cx', upperBobPos.x)
  upperBob.setAttribute('cy', upperBobPos.y)

  lowerString.setAttribute('x1', upperBobPos.x)
  lowerString.setAttribute('y1', upperBobPos.y)

  lowerString.setAttribute('x2', lowerBobPos.x)
  lowerString.setAttribute('y2', lowerBobPos.y)

  lowerBob.setAttribute('r', r1)
  lowerBob.setAttribute('cx', lowerBobPos.x)
  lowerBob.setAttribute('cy', lowerBobPos.y)

  // const tempAng = ang0 + ang1
  // const tempPlot = Math.min(tempAng, 2 * Math.PI - tempAng)
}

function drawTracer() {
  tracerLine.setAttribute('d', tracer.getPointsAsString())
}

function animate() {
  doublePendulum.move()
  drawPendulum()

  tracer.addPoint(doublePendulum.getLowerBob())
  drawTracer()
}

animation = setInterval(animate, 1000 / doublePendulum.fps)

function animationToggle() {
  if (!animation) {
    animation = setInterval(animate, 1000 / doublePendulum.fps)
    animationToggleButton.innerHTML = '| |'
  } else {
    clearInterval(animation)
    animation = null
    animationToggleButton.innerHTML = '>'
  }
}

function toggleMenu() {
  if (menu.style.transform == 'translate(-50%, -97%)') {
    menu.style.transform = 'translate(-50%, 0%)'
  } else {
    menu.style.transform = 'translate(-50%, -97%)'
  }
}

function togglePendulum(show) {
  base.style.display = show ? 'block' : 'none'
  upperString.style.display = show ? 'block' : 'none'
  upperBob.style.display = show ? 'block' : 'none'
  lowerString.style.display = show ? 'block' : 'none'
  lowerBob.style.display = show ? 'block' : 'none'
}

function handleHold(clickX, clickY) {
  const { x0, y0, baseRad, r0, r1 } = doublePendulum
  const upperBob = doublePendulum.getUpperBob()
  const lowerBob = doublePendulum.getLowerBob()
  if ((clickX - x0) ** 2 + (clickY - y0) ** 2 < 2.25 * baseRad ** 2) {
    tracer.clearPoints()
    doublePendulum.holdBase()
  }
  if (
    (clickX - upperBob.x) ** 2 + (clickY - upperBob.y) ** 2 <
    2.25 * r0 ** 2
  ) {
    clearInterval(animation)
    animation = null
    tracer.clearPoints()
    doublePendulum.holdUpperBob()
  }
  if (
    (clickX - lowerBob.x) ** 2 + (clickY - lowerBob.y) ** 2 <
    2.25 * r1 ** 2
  ) {
    clearInterval(animation)
    animation = null
    tracer.clearPoints()
    doublePendulum.holdLowerBob()
  }
}

function handleMove(clickX, clickY) {
  if (doublePendulum.baseHold) {
    doublePendulum.setBasePos(clickX, clickY)
    drawPendulum()
  }
  if (doublePendulum.upperBobHold) {
    doublePendulum.setUpperBobPos(clickX, clickY)
    drawPendulum()
  }
  if (doublePendulum.lowerBobHold) {
    doublePendulum.setLowerBobPos(clickX, clickY)
    drawPendulum()
  }
}

function handleDrop() {
  if (!animation)
    animation = setInterval(animate, 1000 / doublePendulum.fps)
  doublePendulum.dropUpperBob()
  doublePendulum.dropLowerBob()
  doublePendulum.dropBase()
}

window.addEventListener('mousedown', (e) => {
  const clickX = (e.x * doublePendulum.width) / canvas.clientWidth
  const clickY = (e.y * doublePendulum.height) / canvas.clientHeight
  handleHold(clickX, clickY)
})

window.addEventListener('touchstart', (e) => {
  const clickX =
    (e.touches[0].clientX * doublePendulum.width) / canvas.clientWidth
  const clickY =
    (e.touches[0].clientY * doublePendulum.height) / canvas.clientHeight
  handleHold(clickX, clickY)
})

window.addEventListener('mousemove', (e) => {
  const clickX = (e.x * doublePendulum.width) / canvas.clientWidth
  const clickY = (e.y * doublePendulum.height) / canvas.clientHeight
  handleMove(clickX, clickY)
})

window.addEventListener('touchmove', (e) => {
  const clickX =
    (e.touches[0].clientX * doublePendulum.width) / canvas.clientWidth
  const clickY =
    (e.touches[0].clientY * doublePendulum.height) / canvas.clientHeight
  handleMove(clickX, clickY)
})

window.addEventListener('mouseup', handleDrop)
window.addEventListener('touchend', handleDrop)

Array.from(menu.children).forEach((option) => {
  option.addEventListener('click', (e) => e.stopPropagation())
  option.addEventListener('mouseup', (e) => e.stopPropagation())
  option.addEventListener('touchend', (e) => e.stopPropagation())
})

animationToggleButton.addEventListener('click', animationToggle)

window.addEventListener('keyup', (e) => {
  if (e.keyCode == 32 || e.key == ' ') animationToggle()
})