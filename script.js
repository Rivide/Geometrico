const geometrico = (function () {
  let nextID = 0;
  function getID() {
    return nextID++;
  }
  const geo = (function () {
    const tolerance = 0.00001;
    function sqr(n) {
      return n * n;
    }
    function areEqual(x, y) {
      return Math.abs(x - y) <= tolerance;
    }
    function isGreater(x, y) {
      return x - y > tolerance;
    }
    function isGreaterOrEqual(x, y) {
      return isGreater(x, y) || areEqual(x, y);
    }
    const getIntersection = (function () {
      function getVectorVectorIntersection(vector1, vector2) {
        return vector1.isCongruent(vector2) ? vector1 : null;
      }
      function getVectorCircleIntersection(vector, circle) {
        return areEqual(getDistance(vector, circle.center), circle.r) ? vector : null;
      }
      function getCircleCircleIntersection(circle1, circle2) {
        const displacement = circle2.center.minus(circle1.center);
        const distance = displacement.magnitude;
        if (geo.areEqual(distance, 0)) {
          if (geo.areEqual(circle1.r, circle2.r)) {
            return circle1;
          }
          return null;
        }
        if (geo.isGreater(distance, circle1.r + circle2.r)) {
          return null;
        }

        const centerToIntAxis = (sqr(circle1.r) - sqr(circle2.r) + sqr(distance)) / (2 * distance);

        const intAxisMidpoint = circle1.center.plus(displacement.times(centerToIntAxis / distance));
        if (geo.areEqual(centerToIntAxis, circle1.r)) {
          return intAxisMidpoint;
        }
        const intToCentralAxis = Math.sqrt(sqr(circle1.r) - sqr(centerToIntAxis));
        const difference = new Vector(-displacement.y, displacement.x).dividedBy(distance).times(intToCentralAxis);
        return new Locus([intAxisMidpoint.plus(difference), intAxisMidpoint.minus(difference)]);
      }
      function getLocusLocusIntersection(locus1, locus2) {
        const intersections = [];
        locus1.objects.forEach(obj => {
          const intersection = getIntersection(obj, locus2);
          intersections.push(intersection);
        });
        const locus = new Locus(intersections);
        return locus.isEmpty() ? null : locus;
      }
      return function (obj1, obj2) {
        const arr = [obj1, obj2];
        for (let i = 0; i < arr.length; i++) {
          const obj = arr[i];
          const otherObj = arr[arr.length - 1 - i];

          if (obj instanceof Vector) {
            if (otherObj instanceof Vector) {
              return getVectorVectorIntersection(obj, otherObj);
            }
            else if (otherObj instanceof Circle) {
              return getVectorCircleIntersection(obj, otherObj);
            }
          }
          else if (obj instanceof Circle) {
            if (otherObj instanceof Circle) {
              return getCircleCircleIntersection(obj, otherObj);
            }
          }
          else if (obj instanceof Locus) {
            if (otherObj instanceof Locus) {
              return getLocusLocusIntersection(obj, otherObj);
            }
            else {
              const intersections = [];

              obj.objects.forEach(childObj => {
                intersections.push(geo.getIntersection(childObj, otherObj));
              });

              const locus = new Locus(intersections);
              return locus.isEmpty() ? null : locus;
            }
          }
        }
      }
    })();
    const getDistance = (function () {
      function getVectorVectorDistance(vector1, vector2) {
        return vector1.minus(vector2).magnitude;
      }
      function getVectorCircleDistance(vector, circle) {
        return Math.abs(getVectorVectorDistance(vector, circle.center) - circle.r);
      }
      function getCircleCircleDistance(circle1, circle2) {
        const separation = getVectorVectorDistance(circle1.center, circle2.center);
        //TODO: use compare functions instead of operators
        const boundaryDistance = separation - circle1.r - circle2.r;
        if (isGreaterOrEqual(boundaryDistance, 0)) {
          return boundaryDistance;
        }
        else if (isGreaterOrEqual(separation, Math.abs(circle1.r - circle2.r))) {
          return 0;
        }
        else {
          return Math.abs(circle1.r - circle2.r) - separation;
        }
      }
      return function (obj1, obj2) {
        const arr = [obj1, obj2];
        for (let i = 0; i < arr.length; i++) {
          const obj = arr[i];
          const otherObj = arr[arr.length - 1 - i];
          if (obj instanceof Vector) {
            if (otherObj instanceof Vector) {
              return getVectorVectorDistance(obj1, obj2);
            }
            else if (otherObj instanceof Circle) {
              return getVectorCircleDistance(obj, otherObj);
            }
          }
          else if (obj instanceof Circle) {
            if (otherObj instanceof Circle) {
              return getCircleCircleDistance(obj1, obj2);
            }
          }
        };
      };
    })();
    const inflate = (function() {
      function inflateVector(vector, radius) {
        return new Circle(vector.x, vector.y, radius);
      }
      function inflateCircle(circle, radius) {
        const largerCircle = new Circle(circle.x, circle.y, circle.r + radius);
        if (isGreater(radius, circle.r)) {
          return largerCircle;
        }
        else if (areEqual(radius, circle.r)) {
          return new Locus([largerCircle, circle.center]);
        }
        else {
          return new Locus([largerCircle, new Circle(circle.x, circle.y, circle.r - radius)]);
        }
      }
      function inflateLocus(locus, radius) {
        return new Locus(locus.objects.map(obj => inflate(obj, radius)));
      }
      return function(obj, radius) {
        if (obj instanceof Vector) {
          return inflateVector(obj, radius);
        }
        else if (obj instanceof Circle) {
          return inflateCircle(obj, radius);
        }
        else if (obj instanceof Locus) {
          return inflateLocus(obj, radius);
        }
      }
    })();
    return {
      getDistance,
      areEqual,
      isGreater,
      inflate,
      getIntersection
    }
  })();
  class GeoObject {
    constructor(id) {
      this.id = id;
    }
    withID(id) {
      this.id = id;
      return this;
    }
  }
  class Vector extends GeoObject {
    constructor(x, y, id) {
      super(id);
      this.x = x;
      this.y = y;
    }
    isCongruent(vector) {
      return this.x === vector.x && this.y === vector.y;
    }
    plus(vector) {
      return new Vector(this.x + vector.x, this.y + vector.y);
    }
    minus(vector) {
      return new Vector(this.x - vector.x, this.y - vector.y);
    }
    times(scalar) {
      return new Vector(this.x * scalar, this.y * scalar);
    }
    dividedBy(scalar) {
      return this.times(1 / scalar);
    }
    translate(vector) {
      return this.plus(vector).withID(vector.id);
    }
    get magnitude() {
      return Math.sqrt(this.x * this.x + this.y * this.y);
    }
  }
  class Line extends GeoObject {
    constructor(x1, y1, x2, y2) {
      super();
      this.p1 = new Vector(x1, y1);
      this.p2 = new Vector(x2, y2);
    }
    translate(vector) {
      this.p1 = this.p1.translate(vector);
      this.p2 = this.p2.translate(vector);
    }
  }
  class Circle extends GeoObject {
    constructor(x, y, r) {
      super();
      this.center = new Vector(x, y);
      this.r = r;
    }
    get x() {
      return this.center.x;
    }
    get y() {
      return this.center.y;
    }
  }
  class Locus extends GeoObject {
    constructor(objects) {
      super();
      this.objects = objects.filter(obj => obj);
    }
    isEmpty() {
      return this.objects.length === 0;
    }
  }
  class Camera {
    constructor(x, y, width, height, zoom = 1) {
      this.position = new Vector(x, y);
      this.dimensions = new Vector(width, height);
      this.zoom = zoom;
    }
    project(point) {
      return new Vector(point.x, -point.y).minus(new Vector(this.position.x, -this.position.y)).times(this.zoom).plus(this.dimensions.dividedBy(2));
    }
    clear(ctx) {
      ctx.clearRect(0, 0, this.dimensions.x, this.dimensions.y);
    }
    /**
    *
    *
    * @param {CanvasRenderingContext2D} ctx
    * @param {*} style
    * @memberof Camera
    */
    render(ctx, objects, style) {
      ctx.strokeStyle = style.strokeColor || 'black';
      ctx.fillStyle = style.fillColor || 'black';
      objects.forEach(obj => {
        if (obj instanceof Vector) {
          const projection = this.project(obj);

          ctx.beginPath();
          ctx.arc(projection.x, projection.y, style.pointRadius, 0, 2 * Math.PI);
          ctx.fill();
        }
        else if (obj instanceof Line) {
          const p1Proj = this.project(obj.p1);
          const p2Proj = this.project(obj.p2);

          ctx.lineWidth = style.lineWidth;
          ctx.translate(.5, .5);
          ctx.beginPath();
          ctx.moveTo(p1Proj.x, p1Proj.y);
          ctx.lineTo(p2Proj.x, p2Proj.y);
          ctx.stroke();
          ctx.translate(-.5, -.5);
        }
        else if (obj instanceof Circle) {
          const centerProj = this.project(obj.center);
          const projection = new Circle(centerProj.x, centerProj.y, obj.r * this.zoom);

          ctx.beginPath();
          ctx.arc(projection.x, projection.y, projection.r, 0, 2 * Math.PI);
          ctx.stroke();
        }
        else if (obj instanceof Locus) {
          this.render(ctx, obj.objects, style);
        }
      });
    }
  }
  class Controller {
    constructor() {
      this.objects = [];
      this.scripts = [];
      this.time = 0;
    }
    addObject(object, script) {
      object.id = getID();

      this.scripts[this.objects.length] = script;
      this.objects.push(object);
    }
    update(deltaTime) {
      this.time += deltaTime;

      this.objects = this.objects.map((obj, i) => {
        // removes object if null returned
        // keeps object if undefined returned

        if (this.scripts[i]) {
          const image = this.scripts[i](obj, { deltaTime, time: this.time, objects: this.objects });

          if (image || image === null) {
            return image;
          }
        }
        return obj;
      });
    }
  }
  class ConstraintSolver {
    constructor(objects, constraints) {
      this.objects = objects;
      this.constraints = constraints;
      this.constraintGraph = {};
      this.freeConstraints = [];
      this.freedoms = [];
    }
    solve() {
      let freedoms = this.getFreedoms(this.constraints);
      while (this.freeConstraints.length) {
        console.log(this.freeConstraints);
        const freeDependent = this.freeConstraints[0].dependents[0];
        freedoms = freedoms.concat(this.getFreedoms([...this.freeConstraints, ConstraintSolver.fixConstraint(freeDependent, freeDependent)]));
      }
      console.log(this.freeConstraints);

      
      return freedoms;
    }
    getFreedoms(constraints) {
      const freedoms = [];
      const constraintsHandled = [];
      const constrainedObjs = [];
      let newFreedoms = false;
      constraints.forEach(constraint => {
        if (constraint.dependents.length === 1) {
          const obj = constraint.dependents[0];
          freedoms.push({ obj: obj, freedom: constraint.getFreedom(constraint.dependents[0]) })
          constraintsHandled.push(constraint);
          constrainedObjs.push(obj);
          constraints = constraints.filter(c => c !== constraint);
          newFreedoms = true;
        }
      });
      while (newFreedoms) {
        newFreedoms = false;
        constraints.forEach(constraint => {
          let newObjConstrained;

          constraint.dependents.forEach((dependent, i, arr) => {
            //console.log('i:', i);
            //console.log(constraint);
            if (constrainedObjs.includes(dependent)) {
              const objToConstrain = arr[1 - i];
              
              const newFreedom = constraint.getFreedom(objToConstrain, freedoms);
              if (!freedoms.some(freedom => {
                if (freedom.obj === objToConstrain) {
                  freedom.freedom = geo.getIntersection(freedom.freedom, newFreedom);
                  return true;
                }
                else {
                  return false;
                }
              })) {
                freedoms.push({ obj: objToConstrain, freedom: newFreedom });
              }
              constraints = constraints.filter(c => c !== constraint);
              constraintsHandled.push(constraint);
              if (!constrainedObjs.includes(objToConstrain)) {
                newObjConstrained = objToConstrain;
              }
              freedoms.forEach(freedom => {
                //console.log(freedom.obj.id);
                //console.log(freedom.freedom);
              });
              console.log(' ');
              newFreedoms = true;
            }
          });

          if (newObjConstrained) {
            constrainedObjs.push(newObjConstrained);
          }
        });
      }
      this.freeConstraints = constraints;
      return freedoms;
    }
    static fixConstraint(obj, target) {
      return {
        dependents: [obj],
        validate() {
          return obj.isCongruent(target);
        },
        getFreedom() {
          return target;
        },
        apply() {
          return target;
        }
      }
    }
    static distanceConstraint(obj1, obj2, distance) {
      return {
        dependents: [obj1, obj2],
        validate() {
          return geo.areEqual(geo.getDistance(obj1, obj2), distance);
        },
        getFreedom(obj, freedoms) {
          return geo.inflate(freedoms.find(freedom => freedom.obj === this.dependents.find(otherObj => otherObj.id !== obj.id)).freedom, distance);
        },
        apply() {

        }
      }
    }
  }
  return {
    objects: {
      Vector,
      Line,
      Circle
    },
    Camera,
    Controller,
    ConstraintSolver: ConstraintSolver,
    geo,
    run: function (loop) {
      let now = 0;
      requestAnimationFrame(function loopWrapper(timestamp) {
        loop(timestamp - now);
        now = timestamp;

        requestAnimationFrame(loopWrapper);
      });
    }
  };
})();

const { Vector, Line, Circle } = geometrico.objects;
const ConstraintSolver = geometrico.ConstraintSolver;
geometrico.run(
  (function () {
    const renderStyle = {
      pointRadius: 3,
      lineWidth: 1
    }
    const freedomStyle = {
      ...renderStyle,
      strokeColor: 'green',
      fillColor: 'green'
    }
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    const cam = new geometrico.Camera(0, 0, canvas.width, canvas.height);

    const controller = new geometrico.Controller();
    const v1 = new Vector(30, 30);
    controller.addObject(v1);
    const v2 = new Vector(50, 50);
    controller.addObject(v2);
    /*controller.addObject(new Vector(50, 50), (vector, args) => {
      if (args.time <= args.deltaTime) {
        return vector.translate(new Vector(20, 20));
      }
    });*/
    const v3 = new Vector(75, 75);
    controller.addObject(v3);
    const v4 = new Vector(30, 0);
    controller.addObject(v4);
    let now = 0;
    return function (deltaTime) {
      controller.update(deltaTime);
      if (!now) {
        const freedoms = new ConstraintSolver(controller.objects, [
          //ConstraintSolver.fixConstraint(v1, new Vector(0, 0)),
          ConstraintSolver.distanceConstraint(v2, v1, 10),
          ConstraintSolver.distanceConstraint(v3, v2, 40),
          ConstraintSolver.distanceConstraint(v4, v3, 20),
          ConstraintSolver.distanceConstraint(v4, v2, 20),
          //ConstraintSolver.fixConstraint(v4, v4)
        ]).solve();
        console.log(freedoms);
        cam.clear(ctx);
        cam.render(ctx, controller.objects, renderStyle);
        cam.render(ctx, freedoms.map(freedom => freedom.freedom), freedomStyle);
      }
      now += deltaTime;
    }
  })()
);