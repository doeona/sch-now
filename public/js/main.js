const clock = document.getElementById("clock");
const menuToggle = document.getElementById("menuToggle");
const mobileMenu = document.getElementById("mobileMenu");

function updateClock() {
  const now = new Date();
  const value = now.toLocaleTimeString("ko-KR", {
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false
  });
  clock.textContent = value;
  const dashClock = document.getElementById("dashClock");
  if (dashClock) dashClock.textContent = value.slice(0, 5);
}
updateClock();
setInterval(updateClock, 1000);

menuToggle.addEventListener("click", () => {
  const open = mobileMenu.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", open ? "메뉴 닫기" : "메뉴 열기");
});

document.querySelectorAll("#mobileMenu a").forEach(a => {
  a.addEventListener("click", () => { mobileMenu.classList.remove("open"); menuToggle.setAttribute("aria-expanded", "false"); menuToggle.setAttribute("aria-label", "메뉴 열기"); });
});

async function loadSubway() {
  const list = document.getElementById("trainList");
  const notice = document.getElementById("subwayNotice");
  const refreshButton = document.getElementById("refreshSubway");
  if (refreshButton) refreshButton.disabled = true;
  try {
    const res = await fetch("/api/subway");
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.notice || "열차 정보를 불러오지 못했습니다.");
    if (!data.trains || data.trains.length === 0) {
      list.innerHTML = `<article class="train-card"><div class="dir">안내</div><h3>현재 이후 신창행 열차가 없습니다.</h3><p>시간표 또는 역 코드 설정을 확인해주세요.</p></article>`;
    } else {
      list.innerHTML = data.trains.map((t, index) => `
        <article class="train-card">
          <div class="dir">${index === 0 ? "다음 열차" : "신창행"}</div>
          <h3>${t.departureTime || "--:--"} 출발</h3>
          <p>${t.minutes === 0 ? "곧 출발" : `${t.minutes}분 후 출발 예정`}</p>
          <small>열차번호 ${t.trainNo || "-"}</small>
        </article>`).join("");
    }
    notice.textContent = data.notice || "KRIC 시간표 기준 정보입니다.";
    const dashStatus = document.getElementById("dashSubwayStatus");
    const dashNotice = document.getElementById("dashSubwayNotice");
    if (dashStatus) dashStatus.textContent = data.source === "kric-timetable" ? "KRIC 시간표 연결됨" : "연결 확인 필요";
    if (dashNotice) dashNotice.textContent = data.source === "kric-timetable" ? "아산역 → 신창역 다음 열차" : (data.notice || "KRIC API 설정을 확인하세요.");
  } catch (error) {
    list.innerHTML = `<article class="train-card"><div class="dir">안내</div><h3>시간표를 불러오지 못했습니다.</h3><p>${error.message || "잠시 후 다시 시도해주세요."}</p></article>`;
    notice.textContent = "KRIC 인증키와 Render 환경변수 설정을 확인해주세요.";
  } finally { if (refreshButton) refreshButton.disabled = false; }
}
document.getElementById("refreshSubway").addEventListener("click", loadSubway);
loadSubway();

const categoryNames = {
  "전체": "전체 주변정보",
  "식당": "식당",
  "카페": "카페",
  "편의점": "편의점",
  "약국": "약국",
  "은행": "은행"
};

async function loadNearby(category = "전체") {
  const grid = document.getElementById("placeGrid");
  const title = document.getElementById("resultTitle");
  const count = document.getElementById("resultCount");

  grid.innerHTML = '<div class="place-card"><p>주변 정보를 불러오는 중...</p></div>';

  try {
    const res = await fetch(`/api/nearby?category=${encodeURIComponent(category)}`);
    const data = await res.json();

    title.textContent = categoryNames[category];
    count.textContent = `${data.places.length}곳`;

    grid.innerHTML = data.places.map(place => `
      <article class="place-card">
        <div class="place-top">
          <span class="place-icon">${place.icon}</span>
          <span class="place-distance">${place.distance}m · 도보 ${place.walk}분</span>
        </div>
        <h3>${place.name}</h3>
        <p>${place.description || ""}</p>
        <div class="rating">${place.phone ? `☎ ${place.phone}` : ""}</div>
        <p class="place-address">${place.address || "주소 정보 없음"}</p>
        <div class="tags">${(place.tags || []).map(tag => `<span class="tag">${tag}</span>`).join("")}</div>
        ${place.placeUrl ? `<a class="place-link" href="${place.placeUrl}" target="_blank" rel="noopener noreferrer">카카오맵에서 보기 ↗</a>` : ""}
      </article>
    `).join("");
  } catch {
    count.textContent = "-";
    grid.innerHTML = '<div class="place-card"><p>주변 정보를 불러오지 못했습니다.</p><small>카카오 API 연결 상태를 확인해주세요.</small></div>';
  }
}

document.querySelectorAll(".category-btn").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".category-btn").forEach(b => b.classList.remove("active"));
    button.classList.add("active");
    loadNearby(button.dataset.category);
  });
});

loadNearby();

const campusTabs = document.querySelectorAll(".campus-tab");
const campusPanels = {
  buildings: document.getElementById("campusBuildingsPanel"),
  cafeteria: document.getElementById("cafeteriaPanel"),
  map: document.getElementById("campusMapPanel")
};

let campusMap = null;
let campusMarkers = [];
let campusBuildingsCache = [];
const CAMPUS_CENTER = [36.7694, 126.9319];

campusTabs.forEach(tab => {
  tab.addEventListener("click", () => {
    campusTabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    Object.values(campusPanels).forEach(panel => panel.classList.add("hidden"));
    campusPanels[tab.dataset.campusTab].classList.remove("hidden");

    if (tab.dataset.campusTab === "map") {
      initCampusMap();
      renderCampusMarkers(campusBuildingsCache);
      setTimeout(() => campusMap && campusMap.invalidateSize(), 50);
    }
    if (tab.dataset.campusTab === "cafeteria") loadFacilities();
  });
});

function buildingCard(item) {
  return `
    <article class="building-card" data-building-id="${item.id}">
      <span class="building-code">${item.code}</span>
      <div class="building-icon">${item.icon}</div>
      <h3>${item.name}</h3>
      <p>${item.description}</p>
      <span class="building-type">${item.type}</span>
      ${item.address ? `<p class="building-address">📍 ${item.address}</p>` : ""}
      <div class="building-actions">
        ${item.placeUrl ? `<a class="building-map-link" href="${item.placeUrl}" target="_blank" rel="noopener noreferrer">카카오맵 ↗</a>` : ""}
        ${item.x && item.y ? `<button class="building-focus" type="button" data-building-id="${item.id}">지도에서 보기</button>` : ""}
      </div>
    </article>
  `;
}

async function loadBuildings(type = "전체") {
  const grid = document.getElementById("buildingGrid");
  const count = document.getElementById("buildingCount");
  grid.innerHTML = '<div class="building-card"><p>실제 캠퍼스 건물 위치를 불러오는 중...</p></div>';
  try {
    const res = await fetch(`/api/campus/buildings?type=${encodeURIComponent(type)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || data.error || "건물 정보를 불러오지 못했습니다.");
    campusBuildingsCache = data.buildings || [];
    count.textContent = `${campusBuildingsCache.length}개`;
    grid.innerHTML = campusBuildingsCache.map(buildingCard).join("") || '<div class="building-card"><p>해당 분류의 건물이 없습니다.</p></div>';
    const dashBuildingCount = document.getElementById("dashBuildingCount");
    if (dashBuildingCount && type === "전체") dashBuildingCount.textContent = `${campusBuildingsCache.length}개 건물 등록`;
    grid.querySelectorAll(".building-focus").forEach(button => {
      button.addEventListener("click", () => focusBuilding(button.dataset.buildingId));
    });
    if (campusMap) renderCampusMarkers(campusBuildingsCache);
  } catch (error) {
    count.textContent = "오류";
    grid.innerHTML = `<div class="building-card"><p>건물 정보를 불러오지 못했습니다.</p><small>${error.message}</small></div>`;
  }
}

document.querySelectorAll(".building-filter").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".building-filter").forEach(b => b.classList.remove("active"));
    button.classList.add("active");
    loadBuildings(button.dataset.type);
  });
});

async function loadFacilities() {
  const grid = document.getElementById("facilityGrid");
  if (!grid || grid.dataset.loaded === "true") return;
  grid.innerHTML = '<article class="info-box"><span>⏳</span><strong>불러오는 중</strong><p>교내 시설 정보를 가져오고 있습니다.</p></article>';
  try {
    const res = await fetch("/api/campus/facilities");
    const data = await res.json();
    grid.innerHTML = (data.facilities || []).map(item => `
      <article class="info-box"><span>${item.icon}</span><strong>${item.name}</strong><p>${item.info}</p></article>
    `).join("");
    grid.dataset.loaded = "true";
  } catch {
    grid.innerHTML = '<article class="info-box"><span>⚠️</span><strong>정보를 불러오지 못했습니다.</strong><p>잠시 후 다시 시도해주세요.</p></article>';
  }
}

loadBuildings();

function initCampusMap() {
  if (campusMap) return;
  campusMap = L.map("campusMap", { scrollWheelZoom: true }).setView(CAMPUS_CENTER, 16);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(campusMap);

  L.circle(CAMPUS_CENTER, {
    radius: 170,
    color: "#00a86b",
    fillColor: "#00a86b",
    fillOpacity: 0.08,
    weight: 1
  }).addTo(campusMap).bindTooltip("순천향대학교", { sticky: true });

  document.getElementById("centerCampusMap").addEventListener("click", () => {
    campusMap.setView(CAMPUS_CENTER, 16);
  });
}

function showBuildingInfo(building) {
  const info = document.getElementById("campusMapInfo");
  info.classList.remove("hidden");
  info.innerHTML = `
    <div class="map-info-top"><span class="map-info-icon">${building.icon}</span><div><span class="map-info-code">${building.code}</span><strong>${building.name}</strong></div></div>
    <div class="map-info-tags"><span>${building.type}</span><span>순천향대학교</span></div>
    <p>${building.description}</p>
    <p>📍 ${building.address || "주소 정보 없음"}</p>
    <div class="map-info-actions">
      ${building.placeUrl ? `<a href="${building.placeUrl}" target="_blank" rel="noopener noreferrer">카카오맵에서 보기 ↗</a>` : ""}
      ${building.x && building.y ? `<button type="button" data-info-focus="${building.id}">지도 중심으로 보기</button>` : ""}
    </div>`;
  const focusButton = info.querySelector("[data-info-focus]");
  if (focusButton) focusButton.addEventListener("click", () => focusBuilding(building.id));
}

function focusBuilding(id) {
  const building = campusBuildingsCache.find(item => item.id === id);
  if (!building || !building.x || !building.y) return;
  if (!campusMap) {
    const mapTab = document.querySelector('[data-campus-tab="map"]');
    mapTab?.click();
  }
  setTimeout(() => {
    campusMap?.setView([Number(building.y), Number(building.x)], 18, { animate: true });
    const marker = campusMarkers.find(m => {
      const pos = m.getLatLng();
      return Math.abs(pos.lat - Number(building.y)) < 0.000001 && Math.abs(pos.lng - Number(building.x)) < 0.000001;
    });
    marker?.openPopup();
    showBuildingInfo(building);
  }, 80);
}

function renderCampusMarkers(buildings) {
  if (!campusMap) return;
  campusMarkers.forEach(marker => marker.remove());
  campusMarkers = [];

  buildings.filter(b => b.x && b.y).forEach(building => {
    const marker = L.marker([Number(building.y), Number(building.x)])
      .addTo(campusMap)
      .bindPopup(`
        <div class="map-popup-code">${building.code}</div>
        <div class="map-popup-name">${building.name}</div>
        <div class="map-popup-type">${building.type} · ${building.description}</div>
      `);
    marker.on("click", () => showBuildingInfo(building));
    campusMarkers.push(marker);
  });
}

loadBuildings();
