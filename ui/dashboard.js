(function () {
  const root = document.getElementById("oe-roadster");
  if (!root) return;
  const state = {
    page: "home",
    part: null,
    trunkOpen: false,
    lightsOn: false,
    data: "demo",
    units: "c",
  };
  const appearance = { accent: "#f12c35", grid: true };
  const readings = {
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
    ["roadster-f36", "vehicle-f36"].includes(saved.privateContent.dashboard)
  ) {
    const previous = saved.privateContent;
    if (["home", "monitor", "diagnostics", "settings"].includes(previous.page))
      state.page = previous.page;
    if (previous.page === "drive") state.page = "monitor";
    if (["demo", "stale", "unavailable"].includes(previous.data))
      state.data = previous.data;
    if (["c", "f"].includes(previous.units)) state.units = previous.units;
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
      dashboard: "vehicle-f36",
      page: state.page,
      data: state.data,
      units: state.units,
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
    ["home", "monitor", "diagnostics", "settings"].forEach(function (id) {
      root.querySelector("#oe-" + id).hidden = id !== name;
    });
    root.querySelectorAll("[data-page]").forEach(function (button) {
      button.setAttribute(
        "aria-current",
        String(
          button.closest(".oe-nav") !== null && button.dataset.page === name,
        ),
      );
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
  const descriptions = {
    trunk: {
      icon: "door-open",
      title: "Trunk",
      caption: "Rear hatch / F36",
      description: "Explore the hatch position on the 3D vehicle model.",
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
        "Thermal readings and engine speed are available in the Monitor preview.",
      rows: [
        ["Oil temperature", "96 °C · demo"],
        ["Coolant", "87 °C · demo"],
      ],
    },
  };
  function renderDetail() {
    root.querySelector("[data-overview-hatch]").textContent = state.trunkOpen
      ? "Open · preview"
      : "Closed · preview";
    root.querySelector("[data-overview-lights]").textContent = state.lightsOn
      ? "On · preview"
      : "Off · preview";
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
        '<button class="oe-action" data-go-monitor><i data-lucide="gauge" aria-hidden="true"></i>View telemetry</button>';
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
    if (button.hasAttribute("data-go-monitor")) {
      page("monitor");
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
  icons();
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
    renderer.toneMappingExposure = 1.1;
    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(32, 1, 0.1, 70);
    const focus = new T.Vector3(0, 0.65, 0);
    const car = new T.Group();
    scene.add(car);
    scene.add(new T.AmbientLight(0xd5deed, 0.6));
    const key = new T.DirectionalLight(0xe4e8f3, 3.2);
    key.position.set(4, 6, -5);
    scene.add(key);
    const rim = new T.DirectionalLight(0xf12c35, 0.5);
    rim.position.set(-5, 2, 4);
    scene.add(rim);
    const model = globalThis.OpenEvoVehicle.create(T, renderer, scene);
    car.add(model.car);
    const {
      bodyMat,
      frameMat,
      selectedMat,
      highlighted,
      hatch,
      engine,
      engineEdge,
      frontLampMat,
      backLampMat,
      seam,
    } = model;
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
      angle: 2.5,
      elevation: 0.21,
      distance: 7.8,
      targetAngle: 2.5,
      targetElevation: 0.21,
    };
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    let scheduled = false,
      selected = null;
    function hotspots() {
      const targets = {
        trunk: [-1.95, 0.95, -0.4],
        doors: [-0.15, 0.72, -0.92],
        engine: [1.1, 1.0, 0],
        lights: [2.33, 0.7, -0.57],
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
      camera.fov = width < 450 ? 40 : 32;
      cameraState.distance = Math.max(
        7.8,
        2.75 / (Math.tan(T.MathUtils.degToRad(camera.fov / 2)) * camera.aspect),
      );
      camera.updateProjectionMatrix();
      invalidate();
    }
    function update() {
      const inspectEngine = selected === "engine";
      if (bodyMat.transparent !== inspectEngine) {
        bodyMat.transparent = inspectEngine;
        bodyMat.depthWrite = !inspectEngine;
        bodyMat.needsUpdate = true;
      }
      bodyMat.opacity = inspectEngine ? 0.17 : 1;
      engine.visible = inspectEngine;
      engineEdge.visible = inspectEngine;
      frontLampMat.color.setHex(
        state.lightsOn ? 0xe5efff : selected === "lights" ? 0xf12c35 : 0x92a1b2,
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
          mesh.material =
            key === part ? selectedMat : key === "doors" ? seam : frameMat;
        });
      });
      if (part === "trunk") {
        cameraState.targetAngle = 3.95;
        cameraState.targetElevation = 0.29;
      }
      if (part === "lights" || part === "engine") {
        cameraState.targetAngle = 2.5;
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
          view === "rear" ? 3.95 : view === "side" ? Math.PI : 2.5;
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
