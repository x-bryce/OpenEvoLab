(function () {
  const root = document.getElementById("oe-roadster");
  if (!root) return;
  const state = {
    page: "home",
    part: null,
    playing: false,
    track: 0,
    trunkOpen: false,
    lightsOn: false,
    data: "demo",
    units: "c",
  };
  const appearance = { accent: "#f12c35", surfaceOpacity: 0.24, grid: true };
  const tracks = [
    "After Hours",
    "Chrome Coast",
    "Concrete Lines",
    "Lowlight",
    "Long Way Home",
  ];
  const readings = {
    speed: "0",
    fuel: "62%",
    oil: 96,
    coolant: 87,
    intake: 31,
    rpm: "740",
    battery: "13.9",
  };
  let carView = null;
  const storageKey = "openevolab.dashboard.preview.v1";
  let saved = null;
  try {
    const privateContent = JSON.parse(localStorage.getItem(storageKey));
    saved = { privateContent };
  } catch {
    // The preview still works when browser storage is unavailable.
  }
  if (
    saved &&
    saved.privateContent &&
    saved.privateContent.dashboard === "roadster-f36"
  ) {
    const previous = saved.privateContent;
    if (["home", "listen", "drive", "settings"].includes(previous.page))
      state.page = previous.page;
    if (["demo", "stale", "unavailable"].includes(previous.data))
      state.data = previous.data;
    if (["c", "f"].includes(previous.units)) state.units = previous.units;
    if (
      Number.isInteger(previous.track) &&
      previous.track >= 0 &&
      previous.track < tracks.length
    )
      state.track = previous.track;
    if (["trunk", "doors", "engine", "lights"].includes(previous.part))
      state.part = previous.part;
    state.trunkOpen = previous.trunkOpen === true;
    state.lightsOn = previous.lightsOn === true;
  }
  function icons() {
    if (globalThis.lucide)
      globalThis.lucide.createIcons({ attrs: { width: 16, height: 16 } });
  }
  function announce(text) {
    root.querySelector("#oe-announcer").textContent = text;
  }
  function save() {
    const preferences = {
      dashboard: "roadster-f36",
      page: state.page,
      data: state.data,
      units: state.units,
      track: state.track,
      part: state.part,
      trunkOpen: state.trunkOpen,
      lightsOn: state.lightsOn,
    };
    try {
      localStorage.setItem(storageKey, JSON.stringify(preferences));
    } catch {
      // Storage is optional for this simulated dashboard.
    }
  }
  function page(name) {
    state.page = name;
    ["home", "listen", "drive", "settings"].forEach(function (id) {
      root.querySelector("#oe-" + id).hidden = id !== name;
    });
    root.querySelectorAll("[data-page]").forEach(function (button) {
      button.setAttribute("aria-current", String(button.dataset.page === name));
    });
    if (carView) carView.resize();
  }
  function renderReadings() {
    root.classList.toggle("oe-state-stale", state.data === "stale");
    root.classList.toggle("oe-state-unavailable", state.data === "unavailable");
    root.querySelector("#oe-data-label").textContent =
      state.data === "demo"
        ? "DEMO DATA"
        : state.data === "stale"
          ? "STALE DEMO DATA"
          : "DATA UNAVAILABLE";
    root.querySelector("#oe-reading-age").textContent =
      state.data === "demo"
        ? "Simulated sample · Engine idling"
        : state.data === "stale"
          ? "Last demo sample · 2 min ago"
          : "No supported data source";
    root.querySelector("#oe-source-name").textContent =
      state.data === "demo"
        ? "Demo adapter"
        : state.data === "stale"
          ? "Stale demo sample"
          : "Unavailable";
    root.querySelectorAll("[data-reading]").forEach(function (el) {
      const key = el.dataset.reading;
      let value = readings[key];
      if (state.units === "f" && ["oil", "coolant", "intake"].includes(key))
        value = Math.round((value * 9) / 5 + 32);
      el.textContent = state.data === "unavailable" ? "—" : String(value);
    });
    root
      .querySelectorAll(".oe-reading-line strong small")
      .forEach(function (el) {
        el.textContent = state.units === "c" ? "°C" : "°F";
      });
    root.querySelector("#oe-data-state").value = state.data;
    root.querySelector("#oe-units").value = state.units;
  }
  function renderMusic() {
    root.querySelectorAll("[data-track-title]").forEach(function (el) {
      el.textContent = tracks[state.track];
    });
    root.querySelectorAll("[data-play]").forEach(function (button) {
      button.setAttribute("aria-pressed", String(state.playing));
      button.setAttribute(
        "aria-label",
        state.playing ? "Pause demo track" : "Play demo track",
      );
      const isFull = button.classList.contains("oe-action");
      button.innerHTML =
        '<i data-lucide="' +
        (state.playing ? "pause" : "play") +
        '" aria-hidden="true"></i>' +
        (isFull
          ? "<span>" +
            (state.playing ? "Pause preview" : "Play preview") +
            "</span>"
          : "");
    });
    icons();
  }
  const descriptions = {
    trunk: {
      icon: "door-open",
      title: "Trunk",
      caption: "Rear hatch / F36",
      description: "Explore the hatch position on the vehicle schematic.",
      rows: [["Source", "Demo preview"]],
    },
    doors: {
      icon: "lock-keyhole",
      title: "Doors",
      caption: "Body / four-door",
      description: "Vehicle locking requires a separately verified connection.",
      rows: [
        ["Front doors", "Closed · demo"],
        ["Rear doors", "Closed · demo"],
        ["Lock state", "Locked · demo"],
      ],
    },
    lights: {
      icon: "lightbulb",
      title: "Lighting",
      caption: "Exterior / front & rear",
      description: "Preview the light signature and highlighted lamp groups.",
      rows: [["Source", "Demo preview"]],
    },
    engine: {
      icon: "cpu",
      title: "Powertrain",
      caption: "B58 / inline-six",
      description:
        "Thermal readings and engine speed are available in the Drive preview.",
      rows: [
        ["Oil temperature", "96 °C · demo"],
        ["Coolant", "87 °C · demo"],
      ],
    },
  };
  function renderDetail() {
    root.querySelector("#oe-overview").hidden = !!state.part;
    const detail = root.querySelector("#oe-detail");
    detail.hidden = !state.part;
    root.querySelectorAll("[data-part]").forEach(function (button) {
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.part === state.part),
      );
    });
    if (!state.part) return;
    const d = descriptions[state.part];
    let rows = d.rows;
    if (state.part === "trunk")
      rows = [
        [
          "Hatch position",
          state.trunkOpen ? "Open · preview" : "Closed · preview",
        ],
        ["Source", "Demo preview"],
      ];
    if (state.part === "lights")
      rows = [
        ["Exterior lamps", state.lightsOn ? "On · preview" : "Off · preview"],
        ["Source", "Demo preview"],
      ];
    if (state.part === "engine") {
      function temp(key) {
        return state.data === "unavailable"
          ? "Unavailable"
          : String(
              state.units === "f"
                ? Math.round((readings[key] * 9) / 5 + 32)
                : readings[key],
            ) +
              " °" +
              state.units.toUpperCase() +
              " · " +
              (state.data === "stale" ? "stale demo" : "demo");
      }
      rows = [
        ["Oil temperature", temp("oil")],
        ["Coolant", temp("coolant")],
      ];
    }
    let action = "";
    if (state.part === "trunk")
      action =
        '<button class="oe-action" data-preview="trunk"><i data-lucide="' +
        (state.trunkOpen ? "chevrons-down" : "chevrons-up") +
        '" aria-hidden="true"></i>' +
        (state.trunkOpen ? "Preview closed" : "Preview open") +
        "</button>";
    if (state.part === "lights")
      action =
        '<button class="oe-action" data-preview="lights"><i data-lucide="lightbulb" aria-hidden="true"></i>' +
        (state.lightsOn ? "Preview lights off" : "Preview lights on") +
        "</button>";
    if (state.part === "doors")
      action =
        '<button class="oe-action" disabled>Vehicle control unavailable</button>';
    if (state.part === "engine")
      action =
        '<button class="oe-action" data-go-drive><i data-lucide="gauge" aria-hidden="true"></i>View telemetry</button>';
    detail.innerHTML =
      '<button class="oe-back" data-back><i data-lucide="arrow-left" aria-hidden="true"></i>Overview</button><p class="oe-label">' +
      d.caption +
      '</p><div class="oe-subsystem-glyph"><i data-lucide="' +
      d.icon +
      '" aria-hidden="true"></i></div><h2>' +
      d.title +
      '</h2><p class="oe-description">' +
      d.description +
      '</p><div class="oe-status-list">' +
      rows
        .map(function (row) {
          return (
            '<div class="oe-status-row"><span>' +
            row[0] +
            "</span><strong>" +
            row[1] +
            "</strong></div>"
          );
        })
        .join("") +
      "</div>" +
      action +
      '<p class="oe-note">Simulated state · No vehicle connection</p>';
    icons();
  }
  root.addEventListener("click", function (event) {
    const button = event.target.closest("button");
    if (!button || button.disabled) return;
    if (button.dataset.page) {
      page(button.dataset.page);
      save();
    }
    if (button.hasAttribute("data-open-settings")) {
      page("settings");
      save();
    }
    if (button.hasAttribute("data-go-drive")) {
      page("drive");
      save();
    }
    if (button.dataset.part) {
      state.part = button.dataset.part;
      renderDetail();
      if (carView) carView.select(state.part);
      save();
    }
    if (button.hasAttribute("data-back")) {
      state.part = null;
      renderDetail();
      if (carView) carView.select(null);
      save();
    }
    if (button.dataset.camera) {
      if (carView) carView.camera(button.dataset.camera);
      root.querySelectorAll("[data-camera]").forEach(function (b) {
        b.setAttribute("aria-pressed", String(b === button));
      });
    }
    if (button.hasAttribute("data-play")) {
      state.playing = !state.playing;
      renderMusic();
      announce(
        state.playing
          ? "Demo playback selected. No audio source is connected."
          : "Demo playback paused.",
      );
      save();
    }
    if (button.dataset.skip) {
      state.track =
        (state.track + Number(button.dataset.skip) + tracks.length) %
        tracks.length;
      renderMusic();
      save();
    }
    if (button.hasAttribute("data-track")) {
      state.track = Number(button.dataset.track);
      renderMusic();
      save();
    }
    if (button.dataset.preview === "trunk") {
      state.trunkOpen = !state.trunkOpen;
      renderDetail();
      if (carView) carView.update();
      announce(
        "Hatch illustration " +
          (state.trunkOpen ? "opened" : "closed") +
          ". Preview only.",
      );
      save();
    }
    if (button.dataset.preview === "lights") {
      state.lightsOn = !state.lightsOn;
      renderDetail();
      if (carView) carView.update();
      announce(
        "Lamp illustration " +
          (state.lightsOn ? "on" : "off") +
          ". Preview only.",
      );
      save();
    }
  });
  root
    .querySelector("#oe-data-state")
    .addEventListener("change", function (event) {
      state.data = event.target.value;
      renderReadings();
      renderDetail();
      save();
    });
  root.querySelector("#oe-units").addEventListener("change", function (event) {
    state.units = event.target.value;
    renderReadings();
    renderDetail();
    save();
  });
  page(state.page);
  renderMusic();
  renderReadings();
  renderDetail();
  function buildCar() {
    const T = globalThis.THREE;
    const canvas = root.querySelector("#oe-car-canvas");
    const stage = root.querySelector("#oe-car-stage");
    if (!T) throw new Error("3D runtime unavailable");
    const renderer = new T.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: true,
      powerPreference: "low-power",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x050607, 0);
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(34, 1, 0.1, 70);
    const focus = new T.Vector3(0, 0.65, 0);
    const car = new T.Group();
    scene.add(car);
    scene.add(new T.AmbientLight(0xced4e5, 1.5));
    const key = new T.DirectionalLight(0xe4e8f3, 2.6);
    key.position.set(4, 6, 5);
    scene.add(key);
    const rim = new T.DirectionalLight(0xf12c35, 0.35);
    rim.position.set(-5, 2, -4);
    scene.add(rim);
    const bodyMat = new T.MeshPhysicalMaterial({
      color: 0x8994a3,
      metalness: 0.5,
      roughness: 0.39,
      transparent: true,
      opacity: appearance.surfaceOpacity,
      depthWrite: false,
      side: T.DoubleSide,
    });
    const glassMat = new T.MeshPhysicalMaterial({
      color: 0x263143,
      metalness: 0.3,
      roughness: 0.24,
      transparent: true,
      opacity: 0.38,
      depthWrite: false,
      side: T.DoubleSide,
    });
    const frameMat = new T.LineBasicMaterial({
      color: 0x8d98a6,
      transparent: true,
      opacity: 0.78,
    });
    const darkMat = new T.MeshStandardMaterial({
      color: 0x111317,
      roughness: 0.9,
      metalness: 0.1,
    });
    const rimMat = new T.MeshStandardMaterial({
      color: 0x828890,
      roughness: 0.38,
      metalness: 0.85,
    });
    const selectedMat = new T.LineBasicMaterial({
      color: 0xf12c35,
      transparent: true,
      opacity: 0.93,
    });
    const highlighted = { trunk: [], doors: [], engine: [], lights: [] };
    function line(points, material, parent) {
      const geom = new T.BufferGeometry().setFromPoints(
        points.map(function (p) {
          return new T.Vector3(p[0], p[1], p[2]);
        }),
      );
      const mesh = new T.Line(geom, material || frameMat);
      (parent || car).add(mesh);
      return mesh;
    }
    function box(w, h, d, x, y, z, mat, parent) {
      const mesh = new T.Mesh(new T.BoxGeometry(w, h, d), mat);
      mesh.position.set(x, y, z);
      (parent || car).add(mesh);
      return mesh;
    }
    const profile = [
      [-2.38, 0.65, 0.33, 0.64],
      [-2.25, 0.81, 0.29, 0.8],
      [-2.03, 0.85, 0.29, 0.89],
      [-1.7, 0.86, 0.29, 0.91],
      [-1.25, 0.87, 0.29, 0.92],
      [-0.7, 0.87, 0.29, 0.92],
      [0, 0.87, 0.29, 0.92],
      [0.7, 0.84, 0.29, 0.91],
      [1.3, 0.81, 0.29, 0.9],
      [1.85, 0.78, 0.3, 0.88],
      [2.16, 0.72, 0.33, 0.81],
      [2.35, 0.64, 0.37, 0.67],
    ];
    const smoothProfile = new T.CatmullRomCurve3(
      profile.map(function (s) {
        return new T.Vector3(s[0], s[1], s[3]);
      }),
      false,
      "catmullrom",
      0.3,
    );
    const stations = smoothProfile.getPoints(70).map(function (p) {
      return [p.x, p.y, 0.3, p.z];
    });
    const vertices = [],
      indices = [],
      rings = [];
    stations.forEach(function (s, index) {
      const x = s[0],
        top = s[1],
        bottom = s[2],
        w = s[3];
      const archX = Math.min(Math.abs(x + 1.56), Math.abs(x - 1.55));
      const cut =
        archX < 0.48 ? 0.4 + Math.sqrt(0.48 * 0.48 - archX * archX) : bottom;
      const sideBottom = Math.min(Math.max(bottom, cut), top - 0.015);
      const pts = [
        [x, top, w * 0.76],
        [x, top - 0.06, w * 0.97],
        [x, Math.max(sideBottom, top - 0.2), w],
        [x, sideBottom, w * 0.99],
        [x, bottom, w * 0.75],
        [x, bottom, -w * 0.75],
        [x, sideBottom, -w * 0.99],
        [x, Math.max(sideBottom, top - 0.2), -w],
        [x, top - 0.06, -w * 0.97],
        [x, top, -w * 0.76],
      ];
      rings.push(pts);
      pts.forEach(function (p) {
        vertices.push(p[0], p[1], p[2]);
      });
      if (index > 0)
        for (let j = 0; j < 10; j++) {
          const a = (index - 1) * 10 + j,
            b = (index - 1) * 10 + ((j + 1) % 10),
            c = index * 10 + j,
            d = index * 10 + ((j + 1) % 10);
          indices.push(a, c, b, b, c, d);
        }
    });
    const geometry = new T.BufferGeometry();
    geometry.setAttribute(
      "position",
      new T.Float32BufferAttribute(vertices, 3),
    );
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    car.add(new T.Mesh(geometry, bodyMat));
    [0, 1, 3, 8, 9].forEach(function (i) {
      line(
        rings.map(function (r) {
          return r[i];
        }),
      );
    });
    line(rings[0].concat([rings[0][0]]));
    line(rings[rings.length - 1].concat([rings[rings.length - 1][0]]));
    function shell(sections, material) {
      const verts = [],
        idx = [];
      sections.forEach(function (s, i) {
        [
          [s[0], s[1], s[2]],
          [s[0], s[3], s[4]],
          [s[0], s[3], -s[4]],
          [s[0], s[1], -s[2]],
        ].forEach(function (p) {
          verts.push.apply(verts, p);
        });
        if (i > 0)
          for (let j = 0; j < 3; j++) {
            const a = (i - 1) * 4 + j,
              b = a + 1,
              c = i * 4 + j,
              d = c + 1;
            idx.push(a, c, b, b, c, d);
          }
      });
      const g = new T.BufferGeometry();
      g.setAttribute("position", new T.Float32BufferAttribute(verts, 3));
      g.setIndex(idx);
      g.computeVertexNormals();
      const m = new T.Mesh(g, material);
      car.add(m);
      return m;
    }
    const cabin = [
      [-1.78, 0.86, 0.78, 0.91, 0.77],
      [-1.28, 0.88, 0.8, 1.18, 0.65],
      [-0.72, 0.88, 0.81, 1.38, 0.64],
      [0.32, 0.87, 0.8, 1.37, 0.64],
      [0.65, 0.85, 0.79, 1.25, 0.66],
      [1.12, 0.81, 0.78, 0.85, 0.76],
    ];
    shell(cabin, glassMat);
    [-1, 1].forEach(function (side) {
      line(
        cabin.map(function (s) {
          return [s[0], s[3], s[4] * side];
        }),
      );
      line(
        cabin.map(function (s) {
          return [s[0], s[1], s[2] * side];
        }),
      );
      line(
        [
          [-0.35, 0.87, 0.81 * side],
          [-0.35, 1.38, 0.64 * side],
        ],
        frameMat,
      );
      line(
        [
          [0.62, 0.85, 0.79 * side],
          [0.62, 1.25, 0.66 * side],
        ],
        frameMat,
      );
      const front = line(
        [
          [-0.34, 1.37, 0.65 * side],
          [-0.34, 0.46, 0.927 * side],
          [0.91, 0.45, 0.915 * side],
          [1.04, 0.79, 0.8 * side],
        ],
        frameMat,
      );
      const rear = line(
        [
          [-0.35, 1.37, 0.65 * side],
          [-1.27, 1.17, 0.66 * side],
          [-1.43, 0.83, 0.88 * side],
          [-1.3, 0.44, 0.922 * side],
          [-0.35, 0.45, 0.927 * side],
        ],
        frameMat,
      );
      highlighted.doors.push(front, rear);
      box(0.21, 0.035, 0.028, 0.18, 0.79, 0.932 * side, rimMat);
      box(0.17, 0.035, 0.028, -0.86, 0.8, 0.932 * side, rimMat);
      const mirror = box(0.22, 0.1, 0.14, 0.84, 0.94, 0.99 * side, darkMat);
      const mirrorEdge = new T.LineSegments(
        new T.EdgesGeometry(mirror.geometry),
        frameMat,
      );
      mirror.add(mirrorEdge);
      line(
        [
          [1.12, 0.81, 0.78 * side],
          [2.2, 0.71, 0.65 * side],
        ],
        frameMat,
      );
    });
    line(
      [
        [-0.72, 1.38, 0.64],
        [-0.72, 1.4, 0],
        [-0.72, 1.38, -0.64],
      ],
      frameMat,
    );
    line(
      [
        [0.32, 1.37, 0.64],
        [0.32, 1.39, 0],
        [0.32, 1.37, -0.64],
      ],
      frameMat,
    );
    const hatch = new T.Group();
    hatch.position.set(-0.78, 1.34, 0);
    car.add(hatch);
    const hatchGeom = new T.BufferGeometry().setFromPoints([
      new T.Vector3(0, 0, 0.63),
      new T.Vector3(-0.65, -0.29, 0.75),
      new T.Vector3(-1.51, -0.53, 0.79),
      new T.Vector3(-1.51, -0.53, -0.79),
      new T.Vector3(-0.65, -0.29, -0.75),
      new T.Vector3(0, 0, -0.63),
      new T.Vector3(0, 0, 0.63),
    ]);
    const hatchEdge = new T.Line(hatchGeom, frameMat);
    hatch.add(hatchEdge);
    highlighted.trunk.push(hatchEdge);
    const hatchSurface = new T.BufferGeometry();
    hatchSurface.setAttribute(
      "position",
      new T.Float32BufferAttribute(
        [
          0, 0, 0.63, -0.65, -0.29, 0.75, -1.51, -0.53, 0.79, 0, 0, -0.63,
          -0.65, -0.29, -0.75, -1.51, -0.53, -0.79,
        ],
        3,
      ),
    );
    hatchSurface.setIndex([0, 1, 3, 1, 4, 3, 1, 2, 4, 2, 5, 4]);
    hatchSurface.computeVertexNormals();
    hatch.add(new T.Mesh(hatchSurface, glassMat));
    const trunkStrip = box(0.025, 0.065, 1.5, -1.48, -0.48, 0, darkMat, hatch);
    const wheels = [];
    [-1.56, 1.55].forEach(function (x) {
      [-1, 1].forEach(function (side) {
        const group = new T.Group();
        group.position.set(x, 0.42, 0.88 * side);
        car.add(group);
        const tyre = new T.Mesh(
          new T.CylinderGeometry(0.43, 0.43, 0.24, 48, 1),
          darkMat,
        );
        tyre.rotation.x = Math.PI / 2;
        group.add(tyre);
        const ring = new T.Mesh(
          new T.TorusGeometry(0.33, 0.017, 7, 48),
          rimMat,
        );
        ring.position.z = 0.13 * side;
        group.add(ring);
        const tireEdge = new T.Mesh(
          new T.TorusGeometry(0.42, 0.008, 6, 48),
          new T.MeshBasicMaterial({ color: 0x4f535e }),
        );
        tireEdge.position.z = 0.125 * side;
        group.add(tireEdge);
        const hub = new T.Mesh(
          new T.CylinderGeometry(0.085, 0.085, 0.028, 20),
          rimMat,
        );
        hub.rotation.x = Math.PI / 2;
        hub.position.z = 0.14 * side;
        group.add(hub);
        for (let i = 0; i < 10; i++) {
          const a = (i * Math.PI) / 5;
          line(
            [
              [Math.cos(a) * 0.09, Math.sin(a) * 0.09, 0.145 * side],
              [
                Math.cos(a + 0.07) * 0.31,
                Math.sin(a + 0.07) * 0.31,
                0.145 * side,
              ],
            ],
            new T.LineBasicMaterial({
              color: 0xb3b5bc,
              transparent: true,
              opacity: 0.85,
            }),
            group,
          );
        }
        wheels.push(group);
      });
    });
    const engine = new T.Group();
    engine.position.set(1.0, 0.72, 0);
    car.add(engine);
    const engineMat = new T.MeshStandardMaterial({
      color: 0xb9a06c,
      metalness: 0.65,
      roughness: 0.38,
      transparent: true,
      opacity: 0.4,
    });
    box(0.72, 0.13, 0.62, 0, 0, 0, engineMat, engine);
    for (let i = 0; i < 6; i++)
      box(0.065, 0.045, 0.45, -0.27 + i * 0.1, 0.085, 0, engineMat, engine);
    engine.visible = false;
    const frontLampMat = new T.MeshBasicMaterial({
      color: 0xc3d1df,
      transparent: true,
      opacity: 0.55,
    });
    const backLampMat = new T.MeshBasicMaterial({
      color: 0xc53741,
      transparent: true,
      opacity: 0.5,
    });
    [-1, 1].forEach(function (side) {
      box(0.035, 0.075, 0.43, 2.285, 0.66, 0.59 * side, frontLampMat);
      line(
        [
          [2.31, 0.68, 0.41 * side],
          [2.34, 0.61, 0.46 * side],
          [2.34, 0.61, 0.59 * side],
          [2.29, 0.68, 0.66 * side],
        ],
        frameMat,
      );
      line(
        [
          [2.29, 0.68, 0.64 * side],
          [2.31, 0.61, 0.7 * side],
          [2.26, 0.61, 0.79 * side],
        ],
        frameMat,
      );
      box(0.04, 0.065, 0.44, -2.285, 0.69, 0.59 * side, backLampMat);
      line(
        [
          [-2.32, 0.7, 0.4 * side],
          [-2.32, 0.65, 0.78 * side],
          [-2.28, 0.58, 0.8 * side],
        ],
        new T.LineBasicMaterial({ color: 0x965158 }),
      );
      const grille = box(0.035, 0.17, 0.31, 2.35, 0.48, 0.19 * side, darkMat);
      grille.add(
        new T.LineSegments(new T.EdgesGeometry(grille.geometry), frameMat),
      );
      for (let i = 0; i < 5; i++)
        box(0.045, 0.14, 0.008, 2.374, 0.48, (0.07 + i * 0.055) * side, rimMat);
      box(0.1, 0.07, 0.18, -2.31, 0.28, 0.65 * side, rimMat);
    });
    line(
      [
        [-1.5, 0.25, 0.75],
        [1.55, 0.25, 0.75],
      ],
      frameMat,
    );
    line(
      [
        [-1.5, 0.25, -0.75],
        [1.55, 0.25, -0.75],
      ],
      frameMat,
    );
    const gridPositions = [];
    for (let x = -8; x <= 8; x += 0.42)
      for (let z = -7; z <= 7; z += 0.42) gridPositions.push(x, 0.005, z);
    const gridGeom = new T.BufferGeometry();
    gridGeom.setAttribute(
      "position",
      new T.Float32BufferAttribute(gridPositions, 3),
    );
    const grid = new T.Points(
      gridGeom,
      new T.PointsMaterial({
        color: 0x59434c,
        size: 0.016,
        transparent: true,
        opacity: 0.4,
        sizeAttenuation: true,
      }),
    );
    scene.add(grid);
    const shadowCanvas = document.createElement("canvas");
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const context = shadowCanvas.getContext("2d");
    const gradient = context.createRadialGradient(64, 64, 4, 64, 64, 64);
    gradient.addColorStop(0, "rgba(0,0,0,.85)");
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 128, 128);
    const shadow = new T.Mesh(
      new T.PlaneGeometry(6.1, 3.0),
      new T.MeshBasicMaterial({
        map: new T.CanvasTexture(shadowCanvas),
        transparent: true,
        depthWrite: false,
      }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.012;
    scene.add(shadow);
    const cameraState = {
      angle: 0.65,
      elevation: 0.23,
      distance: 8.8,
      targetAngle: 0.65,
      targetElevation: 0.23,
    };
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    let scheduled = false,
      selected = null;
    function hotspots() {
      const targets = {
        trunk: [-1.95, 0.95, 0.4],
        doors: [-0.15, 0.72, 1.02],
        engine: [1.1, 1.0, 0],
        lights: [2.33, 0.7, 0.57],
      };
      const positioned = [];
      Object.keys(targets).forEach(function (part) {
        const p = targets[part];
        const point = new T.Vector3(p[0], p[1], p[2]).project(camera);
        const button = root.querySelector('[data-part="' + part + '"]');
        let x = (point.x + 1) * 50,
          y = (-point.y + 1) * 50;
        if (part === "trunk") {
          x -= 3;
          y -= 11;
        }
        if (part === "engine") {
          x += 2;
          y -= 19;
        }
        if (part === "doors") {
          y += 13;
        }
        if (part === "lights") {
          x += 4;
          y += 9;
        }
        const halfWidth = button.offsetWidth / 2 + 8,
          halfHeight = button.offsetHeight / 2 + 4;
        x = Math.max(
          halfWidth,
          Math.min(
            stage.clientWidth - halfWidth,
            (x * stage.clientWidth) / 100,
          ),
        );
        y = Math.max(
          stage.clientHeight * 0.29,
          Math.min(stage.clientHeight * 0.78, (y * stage.clientHeight) / 100),
        );
        positioned.forEach(function (previous) {
          if (
            Math.abs(previous.x - x) <
              previous.w / 2 + button.offsetWidth / 2 + 4 &&
            Math.abs(previous.y - y) <
              previous.h / 2 + button.offsetHeight / 2 + 4
          )
            y = Math.min(
              stage.clientHeight * 0.82,
              previous.y + previous.h / 2 + halfHeight + 4,
            );
        });
        button.style.left = x + "px";
        button.style.top = y + "px";
        positioned.push({
          x: x,
          y: y,
          w: button.offsetWidth,
          h: button.offsetHeight,
        });
        const leader = root.querySelector('[data-leader="' + part + '"]');
        const originX = ((point.x + 1) * stage.clientWidth) / 2,
          originY = ((-point.y + 1) * stage.clientHeight) / 2;
        const path = leader.querySelector("line"),
          dot = leader.querySelector("circle");
        path.setAttribute("x1", originX);
        path.setAttribute("y1", originY);
        path.setAttribute("x2", x - button.offsetWidth / 2 + 11);
        path.setAttribute("y2", y);
        dot.setAttribute("cx", originX);
        dot.setAttribute("cy", originY);
      });
    }
    function render() {
      scheduled = false;
      if (state.page !== "home") return;
      const blend = reduce ? 1 : 0.16;
      cameraState.angle +=
        (cameraState.targetAngle - cameraState.angle) * blend;
      cameraState.elevation +=
        (cameraState.targetElevation - cameraState.elevation) * blend;
      const targetHatch = state.trunkOpen ? -0.63 : 0;
      hatch.rotation.z += (targetHatch - hatch.rotation.z) * blend;
      const d = cameraState.distance;
      camera.position.set(
        Math.sin(cameraState.angle) * Math.cos(cameraState.elevation) * d,
        focus.y + Math.sin(cameraState.elevation) * d,
        Math.cos(cameraState.angle) * Math.cos(cameraState.elevation) * d,
      );
      camera.lookAt(focus);
      camera.updateMatrixWorld();
      renderer.render(scene, camera);
      hotspots();
      if (
        Math.abs(cameraState.targetAngle - cameraState.angle) > 0.001 ||
        Math.abs(cameraState.targetElevation - cameraState.elevation) > 0.001 ||
        Math.abs(targetHatch - hatch.rotation.z) > 0.001
      )
        invalidate();
    }
    function invalidate() {
      if (!scheduled) {
        scheduled = true;
        requestAnimationFrame(render);
      }
    }
    function resize() {
      const width = stage.clientWidth,
        height = stage.clientHeight;
      if (width < 1 || height < 1) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.fov = width < 450 ? 40 : 34;
      camera.updateProjectionMatrix();
      invalidate();
    }
    function update() {
      bodyMat.opacity =
        selected === "engine" ? 0.13 : appearance.surfaceOpacity;
      engine.visible = selected === "engine";
      engineMat.opacity = 0.85;
      frontLampMat.color.setHex(
        state.lightsOn ? 0xe5efff : selected === "lights" ? 0xf12c35 : 0x9da7b6,
      );
      frontLampMat.opacity = state.lightsOn || selected === "lights" ? 1 : 0.4;
      backLampMat.opacity = state.lightsOn ? 1 : 0.35;
      grid.visible = appearance.grid;
      rim.color.set(appearance.accent);
      selectedMat.color.set(appearance.accent);
      invalidate();
    }
    function select(part) {
      selected = part;
      Object.keys(highlighted).forEach(function (key) {
        highlighted[key].forEach(function (mesh) {
          mesh.material = key === part ? selectedMat : frameMat;
        });
      });
      if (part === "trunk") {
        cameraState.targetAngle = -0.95;
        cameraState.targetElevation = 0.29;
      }
      if (part === "lights" || part === "engine") {
        cameraState.targetAngle = 0.65;
        cameraState.targetElevation = part === "engine" ? 0.39 : 0.23;
      }
      if (part === "trunk" || part === "lights" || part === "engine")
        markCamera(part === "trunk" ? "rear" : "front");
      update();
    }
    function markCamera(view) {
      root.querySelectorAll("[data-camera]").forEach(function (button) {
        button.setAttribute(
          "aria-pressed",
          String(button.dataset.camera === view),
        );
      });
    }
    let dragging = false,
      lastX = 0,
      lastY = 0;
    canvas.addEventListener("pointerdown", function (event) {
      if (event.button !== 0) return;
      dragging = true;
      lastX = event.clientX;
      lastY = event.clientY;
      canvas.setPointerCapture(event.pointerId);
    });
    canvas.addEventListener("pointermove", function (event) {
      if (!dragging) return;
      cameraState.targetAngle -= (event.clientX - lastX) * 0.009;
      cameraState.targetElevation = Math.max(
        0.1,
        Math.min(
          0.62,
          cameraState.targetElevation + (event.clientY - lastY) * 0.006,
        ),
      );
      lastX = event.clientX;
      lastY = event.clientY;
      markCamera(null);
      invalidate();
    });
    canvas.addEventListener("pointerup", function () {
      dragging = false;
    });
    canvas.addEventListener("pointercancel", function () {
      dragging = false;
    });
    new ResizeObserver(resize).observe(stage);
    resize();
    select(state.part);
    return {
      resize: resize,
      update: update,
      select: select,
      camera: function (view) {
        cameraState.targetAngle =
          view === "rear" ? -0.98 : view === "side" ? 0 : 0.65;
        cameraState.targetElevation = view === "side" ? 0.13 : 0.23;
        markCamera(view);
        invalidate();
      },
    };
  }
  try {
    carView = buildCar();
  } catch (error) {
    root.querySelector("#oe-car-fallback").hidden = false;
    console.warn("OpenEvoLab draft scene unavailable", error);
  }
})();
