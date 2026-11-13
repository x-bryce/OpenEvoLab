/* Original, procedural F36-inspired preview geometry. No vehicle or OEM assets. */
(function () {
  "use strict";
  globalThis.OpenEvoVehicle = {
    create: function (T, renderer, scene) {
      const car = new T.Group();
      const highlighted = { trunk: [], doors: [], engine: [], lights: [] };
      const bodyMat = new T.MeshPhysicalMaterial({
        color: 0x05070a,
        metalness: 0.32,
        roughness: 0.26,
        envMapIntensity: 0.75,
        clearcoat: 0.85,
        clearcoatRoughness: 0.19,
        side: T.DoubleSide,
      });
      const glassMat = new T.MeshPhysicalMaterial({
        color: 0x07171a,
        metalness: 0.12,
        roughness: 0.17,
        envMapIntensity: 0.6,
        clearcoat: 0.45,
        side: T.DoubleSide,
        transparent: true,
        opacity: 0.92,
      });
      const black = new T.MeshStandardMaterial({
        color: 0x07090b,
        roughness: 0.67,
      });
      const rubber = new T.MeshStandardMaterial({
        color: 0x0b0c0e,
        roughness: 0.87,
      });
      const chrome = new T.MeshStandardMaterial({
        color: 0xb5b9bd,
        metalness: 1,
        roughness: 0.19,
      });
      const alloy = new T.MeshStandardMaterial({
        color: 0x939ba5,
        metalness: 0.92,
        roughness: 0.24,
      });
      const brake = new T.MeshStandardMaterial({
        color: 0x71767c,
        metalness: 0.8,
        roughness: 0.5,
      });
      const frameMat = new T.LineBasicMaterial({
        color: 0x535c66,
        transparent: true,
        opacity: 0.52,
      });
      const selectedMat = new T.LineBasicMaterial({ color: 0xf12c35 });
      const seam = new T.LineBasicMaterial({
        color: 0x343b45,
        transparent: true,
        opacity: 0.75,
      });
      const frontLampMat = new T.MeshBasicMaterial({
        color: 0xe5efff,
        transparent: true,
      });
      const backLampMat = new T.MeshBasicMaterial({
        color: 0xb61c29,
        transparent: true,
        opacity: 0.8,
      });

      // A local reflection studio gives black paint shape without network HDRIs.
      const studio = new T.Scene();
      studio.background = new T.Color(0x252b32);
      function softbox(w, h, position, color, intensity) {
        const panel = new T.Mesh(
          new T.PlaneGeometry(w, h),
          new T.MeshBasicMaterial({
            color: new T.Color(color).multiplyScalar(intensity),
            side: T.DoubleSide,
          }),
        );
        panel.position.set(...position);
        panel.lookAt(0, 0.6, 0);
        studio.add(panel);
      }
      softbox(9, 1.4, [0, 5, 2], 0xe7efff, 2.5);
      softbox(10, 0.6, [0, 2, -5], 0xffffff, 3);
      softbox(8, 0.8, [0, 2.8, 5], 0xffffff, 2);
      softbox(3, 3, [6, 2, 0], 0xd7e4ff, 1.5);
      softbox(3, 1, [-5, 1.5, -2], 0xc52734, 1.3);
      const pmrem = new T.PMREMGenerator(renderer);
      const environment = pmrem.fromScene(studio, 0.035, 0.1, 40);
      scene.environment = environment.texture;
      pmrem.dispose();
      studio.traverse(function (object) {
        if (object.isMesh) {
          object.geometry.dispose();
          object.material.dispose();
        }
      });

      function mesh(geometry, material, parent) {
        const m = new T.Mesh(geometry, material);
        (parent || car).add(m);
        return m;
      }
      function box(w, h, d, x, y, z, material, parent) {
        const m = mesh(new T.BoxGeometry(w, h, d), material, parent);
        m.position.set(x, y, z);
        return m;
      }
      function line(points, material, parent, smooth) {
        let vertices = points.map((p) => new T.Vector3(...p));
        if (smooth)
          vertices = new T.CatmullRomCurve3(
            vertices,
            false,
            "catmullrom",
            0.15,
          ).getPoints(80);
        const m = new T.Line(
          new T.BufferGeometry().setFromPoints(vertices),
          material || frameMat,
        );
        (parent || car).add(m);
        return m;
      }
      function tube(points, radius, material, parent, closed) {
        const curve = new T.CatmullRomCurve3(
          points.map((p) => new T.Vector3(...p)),
          !!closed,
          "catmullrom",
          0.18,
        );
        return mesh(
          new T.TubeGeometry(curve, 80, radius, 6, !!closed),
          material,
          parent,
        );
      }
      function surface(rows, material, parent, closed, keep) {
        const vertices = [],
          indices = [],
          count = rows[0].length;
        rows.forEach(function (row, i) {
          row.forEach((p) => vertices.push(...p));
          if (!i) return;
          for (let j = 0; j < count - (closed ? 0 : 1); j++) {
            if (keep && !keep(i, j)) continue;
            const a = (i - 1) * count + j,
              b = (i - 1) * count + ((j + 1) % count);
            const c = i * count + j,
              d = i * count + ((j + 1) % count);
            indices.push(a, b, c, b, d, c);
          }
        });
        const geometry = new T.BufferGeometry();
        geometry.setAttribute(
          "position",
          new T.Float32BufferAttribute(vertices, 3),
        );
        geometry.setIndex(indices);
        geometry.computeVertexNormals();
        return mesh(geometry, material, parent);
      }
      function interpolate(table, x) {
        let i = 0;
        while (i < table.length - 2 && x > table[i + 1][0]) i++;
        const a = table[i],
          b = table[i + 1];
        const t = T.MathUtils.clamp((x - a[0]) / (b[0] - a[0]), 0, 1);
        const previous = table[Math.max(0, i - 1)],
          next = table[Math.min(table.length - 1, i + 2)];
        const span = b[0] - a[0];
        return a.map(function (n, k) {
          if (k === 0) return x;
          const m0 = ((b[k] - previous[k]) / (b[0] - previous[0])) * span;
          const m1 = ((next[k] - a[k]) / (next[0] - a[0])) * span;
          return (
            (2 * t * t * t - 3 * t * t + 1) * n +
            (t * t * t - 2 * t * t + t) * m0 +
            (-2 * t * t * t + 3 * t * t) * b[k] +
            (t * t * t - t * t) * m1
          );
        });
      }
      // 4.64 m silhouette, four doors, long bonnet and a low fastback roof.
      const bodyProfile = [
        [-2.32, 0.75, 0.74],
        [-2.22, 0.9, 0.86],
        [-1.94, 0.95, 0.9],
        [-1.39, 0.97, 0.91],
        [-0.8, 0.96, 0.91],
        [0, 0.94, 0.905],
        [0.85, 0.95, 0.9],
        [1.42, 0.93, 0.9],
        [1.9, 0.86, 0.875],
        [2.17, 0.79, 0.83],
        [2.32, 0.72, 0.73],
      ];
      const bodyRows = [];
      for (let i = 0; i <= 180; i++) {
        const x = -2.32 + (i * 4.64) / 180;
        const [, top, w] = interpolate(bodyProfile, x);
        const bottom = 0.2;
        const ring = [
          [x, top - 0.025, 0],
          [x, top - 0.01, w * 0.45],
          [x, top + 0.007, w * 0.76],
          [x, top - 0.055, w * 0.955],
          [x, top - 0.17, w],
          [x, top - 0.31, w * 0.987],
          [x, bottom + 0.03, w * 0.955],
          [x, bottom, w * 0.78],
          [x, bottom, 0],
          [x, bottom, -w * 0.78],
          [x, bottom + 0.03, -w * 0.955],
          [x, top - 0.31, -w * 0.987],
          [x, top - 0.17, -w],
          [x, top - 0.055, -w * 0.955],
          [x, top + 0.007, -w * 0.76],
          [x, top - 0.01, -w * 0.45],
        ];
        const curve = new T.CatmullRomCurve3(
          ring.map((p) => new T.Vector3(...p)),
          true,
          "catmullrom",
          0.2,
        );
        const distance = Math.min(Math.abs(x + 1.39), Math.abs(x - 1.42));
        const arch =
          distance < 0.39 ? 0.35 + Math.sqrt(0.39 ** 2 - distance ** 2) : 0.2;
        bodyRows.push(
          curve
            .getPoints(64)
            .slice(0, 64)
            .map(function (p) {
              if (Math.abs(p.z) > w * 0.74) p.y = Math.max(p.y, arch);
              if (p.x > 2.0) p.x = Math.min(p.x, noseX(p.z) - 0.025);
              return [p.x, p.y, p.z];
            }),
        );
      }
      surface(bodyRows, bodyMat, car, true, function (i, j) {
        const a = bodyRows[i][j],
          b = bodyRows[i][(j + 1) % 64];
        return !(
          a[0] < -1.08 &&
          a[0] > -2.21 &&
          (a[1] + b[1]) / 2 > 0.86 &&
          Math.abs((a[2] + b[2]) / 2) < 0.73
        );
      });
      box(1.1, 0.06, 1.42, -1.65, 0.63, 0, black);
      box(0.06, 0.26, 1.42, -1.07, 0.76, 0, black);
      function bodySidePoint(p, side) {
        const x = p[0],
          y = p[1];
        if (y > 0.93) return windowPoint([x, y], side);
        const ring =
          bodyRows[
            Math.round(T.MathUtils.clamp((x + 2.32) / 4.64, 0, 1) * 180)
          ];
        let z = 0;
        for (let i = 0; i < ring.length; i++) {
          const a = ring[i],
            b = ring[(i + 1) % ring.length];
          if ((a[1] <= y && b[1] >= y) || (b[1] <= y && a[1] >= y)) {
            const t = a[1] === b[1] ? 0 : (y - a[1]) / (b[1] - a[1]);
            z = Math.max(z, T.MathUtils.lerp(a[2], b[2], t));
          }
        }
        return [x, y, (z + 0.004) * side];
      }

      const cabin = [
        [-1.88, 0.93, 0.78],
        [-1.61, 1.12, 0.68],
        [-1.12, 1.32, 0.62],
        [-0.72, 1.385, 0.6],
        [0.03, 1.39, 0.6],
        [0.38, 1.34, 0.62],
        [0.67, 1.19, 0.68],
        [1.07, 0.925, 0.79],
      ];
      function cabinPoint(x, t, side) {
        const [, roof, width] = interpolate(cabin, x);
        const base = 0.92,
          belt = 0.805;
        const y = T.MathUtils.lerp(base, roof - 0.035, t);
        const z =
          T.MathUtils.lerp(belt, width, t) + Math.sin(t * Math.PI) * 0.018;
        return [x, y, z * side];
      }
      function roofPoint(x, t, offset) {
        const [, height, width] = interpolate(cabin, x);
        return [x, height - t * t * 0.035 + (offset || 0), t * width];
      }
      function roofPatch(start, end, material, parent, offset) {
        const rows = [];
        for (let i = 0; i <= 45; i++) {
          const row = [],
            x = start + ((end - start) * i) / 45;
          for (let j = 0; j <= 28; j++)
            row.push(roofPoint(x, 1 - j / 14, offset));
          rows.push(row);
        }
        return surface(rows, material, parent);
      }
      [-1, 1].forEach(function (side) {
        const rows = [];
        for (let i = 0; i <= 100; i++) {
          const x = -1.88 + (i * 2.95) / 100,
            row = [];
          for (let j = 0; j <= 12; j++) row.push(cabinPoint(x, j / 12, side));
          rows.push(row);
        }
        surface(rows, bodyMat);
      });
      roofPatch(-0.88, 0.39, bodyMat);
      roofPatch(0.39, 1.06, glassMat, car, 0.003);
      tube(
        [roofPoint(0.4, -1), roofPoint(0.4, 0), roofPoint(0.4, 1)],
        0.012,
        black,
      );
      tube(
        [roofPoint(1.06, -1), roofPoint(1.06, 0), roofPoint(1.06, 1)],
        0.012,
        black,
      );

      function windowPoint(p, side) {
        const [, roof, width] = interpolate(cabin, p[0]);
        const t = T.MathUtils.clamp(
          (p[1] - 0.92) / (roof - 0.035 - 0.92),
          0,
          1,
        );
        const z =
          T.MathUtils.lerp(0.805, width, t) + Math.sin(t * Math.PI) * 0.018;
        return [p[0], p[1], side * (z + 0.006)];
      }
      function sideWindow(outline, side) {
        const points = outline.map((p) => new T.Vector2(...p));
        const triangles = T.ShapeUtils.triangulateShape(points, []);
        const vertices = outline.flatMap((p) => windowPoint(p, side));
        const g = new T.BufferGeometry();
        g.setAttribute("position", new T.Float32BufferAttribute(vertices, 3));
        g.setIndex(triangles.flat());
        g.computeVertexNormals();
        mesh(g, glassMat);
        tube(
          outline.map((p) => windowPoint(p, side)),
          0.008,
          chrome,
          car,
          true,
        );
      }
      function doorSeam(points, side) {
        const curve = new T.CatmullRomCurve3(
          points.map((p) => new T.Vector3(...p)),
          false,
          "catmullrom",
          0.12,
        );
        return line(
          curve.getPoints(140).map((p) => bodySidePoint([p.x, p.y], side)),
          seam,
        );
      }
      [-1, 1].forEach(function (side) {
        sideWindow(
          [
            [0.94, 0.948],
            [0.62, 1.18],
            [0.34, 1.3],
            [-0.22, 1.327],
            [-0.22, 0.948],
          ],
          side,
        );
        sideWindow(
          [
            [-0.3, 0.948],
            [-0.3, 1.327],
            [-0.73, 1.32],
            [-1.18, 1.2],
            [-1.42, 0.948],
          ],
          side,
        );
        sideWindow(
          [
            [-1.49, 0.948],
            [-1.28, 1.14],
            [-1.57, 1.035],
            [-1.69, 0.948],
          ],
          side,
        );
        // Door shut lines follow the curved shoulder and sill, not a wireframe cage.
        const front = doorSeam(
          [
            [-0.26, 1.33, 0.625 * side],
            [-0.26, 0.93, 0.815 * side],
            [-0.26, 0.78, 0.908 * side],
            [-0.26, 0.31, 0.883 * side],
            [0.8, 0.31, 0.885 * side],
            [0.99, 0.72, 0.9 * side],
            [0.96, 0.93, 0.81 * side],
          ],
          side,
        );
        const rear = doorSeam(
          [
            [-0.26, 0.31, 0.883 * side],
            [-0.98, 0.31, 0.88 * side],
            [-1.04, 0.54, 0.9 * side],
            [-1.13, 0.69, 0.91 * side],
            [-1.43, 0.94, 0.812 * side],
          ],
          side,
        );
        highlighted.doors.push(front, rear);
        [-0.03, -0.96].forEach((x) => {
          box(0.18, 0.027, 0.025, x, 0.86, 0.903 * side, chrome);
          box(0.2, 0.035, 0.014, x, 0.85, 0.902 * side, black);
        });
        const mirror = mesh(new T.SphereGeometry(1, 24, 16), bodyMat);
        mirror.scale.set(0.14, 0.065, 0.105);
        mirror.position.set(0.77, 1.0, 0.94 * side);
        box(0.055, 0.03, 0.14, 0.77, 0.96, 0.87 * side, black);
        const mirrorGlass = mesh(new T.SphereGeometry(1, 20, 12), chrome);
        mirrorGlass.scale.set(0.008, 0.046, 0.077);
        mirrorGlass.position.set(0.66, 1.004, 0.948 * side);
        tube(
          [
            [1.07, 0.942, 0.51 * side],
            [1.45, 0.917, 0.53 * side],
            [1.9, 0.86, 0.5 * side],
            [2.16, 0.79, 0.42 * side],
          ],
          0.004,
          black,
        );
        tube(
          [
            [-0.95, 0.228, 0.89 * side],
            [0.4, 0.228, 0.89 * side],
            [1.02, 0.25, 0.89 * side],
          ],
          0.019,
          bodyMat,
        );
        line(
          [
            [-0.95, 0.213, 0.9 * side],
            [0.3, 0.213, 0.9 * side],
            [1.01, 0.235, 0.9 * side],
          ],
          new T.LineBasicMaterial({
            color: 0x8a252c,
            transparent: true,
            opacity: 0.55,
          }),
        );
        [-1.39, 1.42].forEach(function (x) {
          const points = [];
          for (let i = 0; i <= 48; i++) {
            const a = (i * Math.PI) / 48;
            points.push([
              x + Math.cos(a) * 0.394,
              0.35 + Math.sin(a) * 0.394,
              0.907 * side,
            ]);
          }
          tube(points, 0.011, bodyMat);
        });
      });

      const hatch = new T.Group();
      hatch.position.set(-0.88, 1.36, 0);
      car.add(hatch);
      const hatchSkin = new T.Group();
      hatchSkin.position.set(0.88, -1.36, 0);
      hatch.add(hatchSkin);
      roofPatch(-1.73, -0.88, glassMat, hatchSkin, 0.003);
      roofPatch(-1.9, -1.73, bodyMat, hatchSkin);
      const hatchEdge = line(
        [
          [-0.88, 1.35, 0.61],
          [-1.42, 1.2, 0.66],
          [-1.88, 0.95, 0.79],
          [-2.18, 0.91, 0.78],
          [-2.18, 0.91, -0.78],
          [-1.88, 0.95, -0.79],
          [-1.42, 1.2, -0.66],
          [-0.88, 1.35, -0.61],
        ],
        frameMat,
        hatchSkin,
        true,
      );
      highlighted.trunk.push(hatchEdge);
      const deck = [];
      for (let i = 0; i <= 24; i++) {
        const x = -2.21 + (i * 0.49) / 24;
        const [, top, width] = interpolate(bodyProfile, x),
          row = [];
        for (let j = 0; j <= 24; j++) {
          const t = 1 - j / 12;
          row.push([x, top - 0.018 - 0.018 * t * t, t * width * 0.84]);
        }
        deck.push(row);
      }
      surface(deck, bodyMat, hatchSkin);

      // Rounded tyres, alloy split spokes, brake discs and recessed wheel barrels.
      [-1.39, 1.42].forEach(function (x) {
        [-1, 1].forEach(function (side) {
          const wheel = new T.Group();
          wheel.position.set(x, 0.35, 0.84 * side);
          car.add(wheel);
          const tyreProfile = [
            [0.263, -0.12],
            [0.31, -0.119],
            [0.342, -0.092],
            [0.35, -0.06],
            [0.35, 0.06],
            [0.342, 0.092],
            [0.31, 0.119],
            [0.263, 0.12],
          ];
          const tyre = mesh(
            new T.LatheGeometry(
              tyreProfile.map((p) => new T.Vector2(...p)),
              64,
            ),
            rubber,
            wheel,
          );
          tyre.rotation.x = Math.PI / 2;
          function cylinder(radius, depth, z, material) {
            const m = mesh(
              new T.CylinderGeometry(radius, radius, depth, 64),
              material,
              wheel,
            );
            m.rotation.x = Math.PI / 2;
            m.position.z = z * side;
            return m;
          }
          const barrel = mesh(
            new T.CylinderGeometry(0.264, 0.264, 0.19, 64, 1, true),
            black,
            wheel,
          );
          barrel.rotation.x = Math.PI / 2;
          cylinder(0.211, 0.012, 0.082, brake);
          const caliper = box(
            0.07,
            0.16,
            0.045,
            -0.145,
            0.03,
            0.092 * side,
            brake,
            wheel,
          );
          caliper.rotation.z = -0.2;
          [0.263, 0.248].forEach(function (r) {
            const ring = mesh(
              new T.TorusGeometry(r, 0.009, 8, 64),
              alloy,
              wheel,
            );
            ring.position.z = 0.122 * side;
          });
          const bead = mesh(
            new T.TorusGeometry(0.311, 0.002, 4, 64),
            black,
            wheel,
          );
          bead.position.z = 0.12 * side;
          for (let i = 0; i < 5; i++) {
            const a = (i * Math.PI * 2) / 5 + 0.1;
            [-1, 1].forEach(function (fork) {
              const start = new T.Vector3(
                Math.cos(a) * 0.065,
                Math.sin(a) * 0.065,
                0.139 * side,
              );
              const end = new T.Vector3(
                Math.cos(a + fork * 0.095) * 0.248,
                Math.sin(a + fork * 0.095) * 0.248,
                0.12 * side,
              );
              const direction = end.clone().sub(start);
              const spoke = mesh(
                new T.BoxGeometry(0.026, direction.length(), 0.024),
                alloy,
                wheel,
              );
              spoke.position.copy(start.add(end).multiplyScalar(0.5));
              spoke.quaternion.setFromUnitVectors(
                new T.Vector3(0, 1, 0),
                direction.normalize(),
              );
            });
          }
          cylinder(0.066, 0.028, 0.139, alloy);
          cylinder(0.03, 0.004, 0.157, black);
          for (let i = 0; i < 5; i++) {
            const a = (i * Math.PI * 2) / 5;
            const bolt = mesh(new T.SphereGeometry(0.008, 6, 4), chrome, wheel);
            bolt.position.set(
              Math.cos(a) * 0.045,
              Math.sin(a) * 0.045,
              0.158 * side,
            );
          }
        });
      });

      // Front fascia: traditional twin kidneys, slatted lower intake and twin LEDs.
      function noseX(z) {
        return 2.34 - Math.pow(Math.abs(z) / 0.9, 3) * 0.25;
      }
      function wrapFront(points) {
        return points.map((p) => [noseX(p[2]) + p[0] - 2.325, p[1], p[2]]);
      }
      function frontShape(points, x, material, parent) {
        const shape = points.map((p) => new T.Vector2(...p));
        const g = new T.BufferGeometry();
        g.setAttribute(
          "position",
          new T.Float32BufferAttribute(
            points.flatMap((p) => [noseX(-p[0]) + x - 2.325, p[1], -p[0]]),
            3,
          ),
        );
        g.setIndex(T.ShapeUtils.triangulateShape(shape, []).flat());
        g.computeVertexNormals();
        return mesh(g, material, parent);
      }
      const fascia = [];
      for (let i = 0; i <= 60; i++) {
        const z = -0.84 + (i * 1.68) / 60,
          row = [];
        for (let j = 0; j <= 12; j++)
          row.push([
            noseX(z) - 0.012,
            0.23 + (j / 12) * (0.49 + (0.035 * Math.abs(z)) / 0.84),
            z,
          ]);
        fascia.push(row);
      }
      surface(fascia, bodyMat);
      surface(
        fascia.map((row) => row.map((p) => [-p[0], p[1], p[2]])),
        bodyMat,
      );
      // Shape coordinates are (-z, y) on a plane facing the nose.
      [-1, 1].forEach(function (side) {
        const kidney = [
          [0.045, 0.71],
          [0.1, 0.74],
          [0.33, 0.72],
          [0.385, 0.67],
          [0.34, 0.53],
          [0.1, 0.52],
          [0.045, 0.56],
        ];
        frontShape(
          kidney.map((p) => [-p[0] * side, p[1]]),
          2.325,
          black,
        );
        tube(
          wrapFront(kidney.map((p) => [2.337, p[1], p[0] * side])),
          0.009,
          chrome,
          car,
          true,
        );
        for (let i = 0; i < 7; i++) {
          const z = (0.085 + i * 0.038) * side;
          box(0.025, 0.155, 0.009, noseX(z) + 0.018, 0.626, z, chrome);
        }
        const lampOutline = [
          [0.4, 0.73],
          [0.59, 0.765],
          [0.8, 0.73],
          [0.83, 0.67],
          [0.7, 0.6],
          [0.43, 0.62],
        ];
        frontShape(
          lampOutline.map((p) => [-p[0] * side, p[1]]),
          2.335,
          black,
        );
        const lampEdge = line(
          wrapFront(
            lampOutline
              .concat([lampOutline[0]])
              .map((p) => [2.337, p[1], p[0] * side]),
          ),
          frameMat,
        );
        highlighted.lights.push(lampEdge);
        [0.49, 0.68].forEach(function (z) {
          const led = [
            [2.319, 0.706, (z - 0.062) * side],
            [2.327, 0.645, (z - 0.04) * side],
            [2.327, 0.642, (z + 0.04) * side],
            [2.312, 0.71, (z + 0.067) * side],
          ];
          tube(
            wrapFront(led.map((p) => [2.343, p[1], p[2]])),
            0.007,
            frontLampMat,
          );
          const lens = mesh(new T.SphereGeometry(0.033, 16, 10), chrome);
          lens.scale.set(0.23, 1, 1);
          lens.position.set(noseX(z) + 0.008, 0.685, z * side);
        });
        tube(
          wrapFront([
            [2.343, 0.735, 0.42 * side],
            [2.343, 0.752, 0.6 * side],
            [2.343, 0.73, 0.79 * side],
          ]),
          0.005,
          frontLampMat,
        );
        frontShape(
          [
            [-0.49 * side, 0.44],
            [-0.79 * side, 0.47],
            [-0.8 * side, 0.3],
            [-0.46 * side, 0.3],
          ],
          2.335,
          black,
        );
        for (let i = 0; i < 3; i++)
          box(0.02, 0.009, 0.24, 2.265, 0.32 + i * 0.045, 0.64 * side, chrome);
        const fog = mesh(new T.SphereGeometry(0.047, 20, 12), chrome);
        fog.scale.set(0.25, 1, 1);
        fog.position.set(2.26, 0.392, 0.65 * side);
        const tail = [
          [-2.285, 0.79, 0.42 * side],
          [-2.295, 0.78, 0.68 * side],
          [-2.18, 0.76, 0.85 * side],
          [-2.04, 0.77, 0.88 * side],
        ];
        tube(tail, 0.022, backLampMat);
        tube(
          tail.map((p) => [p[0], p[1] - 0.055, p[2]]),
          0.012,
          backLampMat,
        );
        const exhaust = mesh(
          new T.CylinderGeometry(0.047, 0.047, 0.14, 24, 1, true),
          chrome,
        );
        exhaust.rotation.z = Math.PI / 2;
        exhaust.position.set(-2.31, 0.255, 0.63 * side);
      });
      frontShape(
        [
          [-0.42, 0.44],
          [0.42, 0.44],
          [0.44, 0.29],
          [-0.44, 0.29],
        ],
        2.335,
        black,
      );
      for (let i = 0; i < 3; i++)
        box(0.02, 0.009, 0.81, 2.355, 0.32 + i * 0.045, 0, chrome);
      tube(
        [
          [2.15, 0.25, -0.79],
          [2.32, 0.245, -0.4],
          [2.34, 0.245, 0],
          [2.32, 0.245, 0.4],
          [2.15, 0.25, 0.79],
        ],
        0.015,
        bodyMat,
      );
      box(0.022, 0.12, 0.4, -2.335, 0.58, 0, black);
      // A small neutral bonnet badge, deliberately not a copied OEM texture.
      const badge = mesh(
        new T.CylinderGeometry(0.035, 0.035, 0.006, 32),
        chrome,
      );
      badge.position.set(2.13, 0.795, 0);
      badge.rotation.z = -0.22;

      const engine = new T.Group();
      engine.position.set(1.0, 0.78, 0);
      car.add(engine);
      const engineMat = new T.MeshStandardMaterial({
        color: 0x9cabbc,
        metalness: 0.7,
        roughness: 0.35,
      });
      box(0.75, 0.16, 0.53, 0, 0, 0, engineMat, engine);
      for (let i = 0; i < 6; i++)
        box(0.06, 0.045, 0.4, -0.27 + i * 0.105, 0.1, 0, black, engine);
      const engineEdge = line(
        [
          [0.5, 0.99, -0.5],
          [1.6, 0.93, -0.5],
          [1.6, 0.93, 0.5],
          [0.5, 0.99, 0.5],
          [0.5, 0.99, -0.5],
        ],
        frameMat,
      );
      engineEdge.visible = false;
      highlighted.engine.push(engineEdge);
      engine.visible = false;

      return {
        car,
        hatch,
        bodyMat,
        frameMat,
        selectedMat,
        highlighted,
        engine,
        engineMat,
        engineEdge,
        frontLampMat,
        backLampMat,
        seam,
      };
    },
  };
})();
