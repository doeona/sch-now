require("dotenv").config();

const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "100kb" }));
app.disable("x-powered-by");
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  next();
});
const publicDir = path.join(__dirname, "public");
app.use(express.static(publicDir, { extensions: ["html"] }));
app.get("/", (req, res) => {
  const publicIndex = path.join(publicDir, "index.html");
  const rootIndex = path.join(__dirname, "index.html");
  if (require("fs").existsSync(publicIndex)) return res.sendFile(publicIndex);
  if (require("fs").existsSync(rootIndex)) return res.sendFile(rootIndex);
  return res.status(404).send("SCH NOW: index.html을 찾을 수 없습니다.");
});

// 순천향대학교 공식 캠퍼스 맵에 표시된 교내 주요 건물 목록을 기준으로 구성.
// type은 SCH NOW에서 빠르게 찾기 위한 서비스 분류입니다.
const campusBuildings = [
  { id: "A01", code: "A01", name: "인간사랑관", type: "학생편의", description: "학생지원·교육문화 공간", icon: "🤝" },
  { id: "A02", code: "A02", name: "향설도서관", type: "학습", description: "도서관·열람·학습 공간", icon: "📚" },
  { id: "A03", code: "A03", name: "대학본관", type: "학생편의", description: "대학 주요 행정 및 학사 업무", icon: "🏛️" },
  { id: "C03", code: "C03", name: "공학관", type: "강의시설", description: "공과대학 강의·실습 공간", icon: "⚙️" },
  { id: "C04", code: "C04", name: "전기실", type: "학생편의", description: "교내 전기 설비 시설", icon: "⚡" },
  { id: "C05", code: "C05", name: "향설생활관 1", type: "학생편의", description: "학생 생활관", icon: "🏠" },
  { id: "C06", code: "C06", name: "유니토피아관", type: "강의시설", description: "교육·학생 지원 공간", icon: "🎓" },
  { id: "C07", code: "C07", name: "산학협력관", type: "강의시설", description: "산학협력 및 창업 지원 공간", icon: "🤝" },
  { id: "C08", code: "C08", name: "지역혁신관", type: "강의시설", description: "지역혁신·교육 공간", icon: "🌱" },
  { id: "C09", code: "C09", name: "BRIX관", type: "강의시설", description: "교육·창업·융합 활동 공간", icon: "🧩" },
  { id: "C10", code: "C10", name: "학예관", type: "강의시설", description: "학예·교육 및 행정 공간", icon: "🏫" },
  { id: "C11", code: "C11", name: "멀티미디어관", type: "강의시설", description: "멀티미디어·콘텐츠 교육 공간", icon: "🖥️" },
  { id: "C12", code: "C12", name: "앙뜨레프레너관", type: "학생편의", description: "창업·산학협력 공간", icon: "🚀" },
  { id: "C13", code: "C13", name: "향설생활관 3", type: "학생편의", description: "학생 생활관", icon: "🏠" },
  { id: "C14", code: "C14", name: "글로벌빌리지", type: "학생편의", description: "글로벌 학생 생활·교류 공간", icon: "🌏" },
  { id: "C15", code: "C15", name: "향설생활관 2", type: "학생편의", description: "학생 생활관", icon: "🏠" },
  { id: "B16", code: "B16", name: "학성사 3", type: "학생편의", description: "학생 생활관", icon: "🏠" },
  { id: "B17", code: "B17", name: "학성사 2", type: "학생편의", description: "학생 생활관", icon: "🏠" },
  { id: "B18", code: "B18", name: "학성사 1", type: "학생편의", description: "학생 생활관", icon: "🏠" },
  { id: "B19", code: "B19", name: "SCH미디어랩스관", type: "강의시설", description: "미디어·콘텐츠 교육 공간", icon: "🎬" },
  { id: "B20", code: "B20", name: "의료과학관", type: "강의시설", description: "의료과학 교육·실습 공간", icon: "🧪" },
  { id: "B21", code: "B21", name: "한마루관", type: "학생편의", description: "학생 생활·커뮤니티 공간", icon: "🌿" },
  { id: "B22", code: "B22", name: "교육과학관", type: "강의시설", description: "교육과학 강의·실습 공간", icon: "🔬" },
  { id: "B23", code: "B23", name: "글로벌교육관", type: "강의시설", description: "글로벌 교육 공간", icon: "🌐" },
  { id: "B24", code: "B24", name: "I'Design관", type: "학생편의", description: "진로·취업 지원 공간", icon: "💼" },
  { id: "B25", code: "B25", name: "학생회관", type: "학생편의", description: "학생회·학생복지 및 편의 공간", icon: "👥" },
  { id: "B26", code: "B26", name: "자연과학관", type: "강의시설", description: "자연과학 강의·실험 공간", icon: "🧬" },
  { id: "B27", code: "B27", name: "체육관(실내)", type: "체육시설", description: "실내 체육 활동 공간", icon: "🏀" },
  { id: "B28", code: "B28", name: "학군단", type: "학생편의", description: "학생군사교육단 시설", icon: "🎖️" },
  { id: "B29", code: "B29", name: "운동부 생활관", type: "체육시설", description: "운동부 학생 생활 공간", icon: "🏃" }
];

const campusFacilities = [
  { name: "향설도서관", info: "도서관·열람·학습 공간", icon: "📚" },
  { name: "학생회관", info: "학생회·학생복지 공간", icon: "👥" },
  { name: "체육관(실내)", info: "실내 체육 활동 공간", icon: "🏀" },
  { name: "I'Design관", info: "진로·취업 지원 공간", icon: "💼" },
  { name: "향설생활관", info: "학생 생활관", icon: "🏠" }
];

const KAKAO_API_URL = "https://dapi.kakao.com/v2/local/search/category.json";
const KAKAO_KEYWORD_URL = "https://dapi.kakao.com/v2/local/search/keyword.json";
const CAMPUS_CENTER = { name: "순천향대학교", x: "126.9319", y: "36.7694" };
const nearbyCategoryCodes = { "식당":"FD6", "카페":"CE7", "편의점":"CS2", "약국":"PM9", "은행":"BK9" };
const campusCoordinateCache = new Map();

function kakaoHeaders() {
  if (!process.env.KAKAO_REST_API_KEY) throw new Error("KAKAO_REST_API_KEY가 설정되지 않았습니다.");
  return { Authorization: `KakaoAK ${process.env.KAKAO_REST_API_KEY}` };
}

async function searchKakaoCategory(category) {
  const code = nearbyCategoryCodes[category];
  if (!code) return [];
  const params = new URLSearchParams({category_group_code:code,x:CAMPUS_CENTER.x,y:CAMPUS_CENTER.y,radius:"2000",sort:"distance",size:"15"});
  const response = await fetch(`${KAKAO_API_URL}?${params}`, {headers:kakaoHeaders()});
  if (!response.ok) throw new Error(`Kakao API ${response.status}: ${await response.text()}`);
  const data=await response.json();
  return data.documents.map(place=>({
    id:place.id, category, name:place.place_name, description:place.category_name||category,
    distance:Number(place.distance||0), walk:Math.max(1,Math.ceil(Number(place.distance||0)/70)),
    icon:category==="식당"?"🍚":category==="카페"?"☕":category==="편의점"?"🏪":category==="약국"?"💊":"🏦",
    rating:null, tags:[category], address:place.road_address_name||place.address_name,
    phone:place.phone||"", x:place.x, y:place.y, placeUrl:place.place_url
  }));
}

async function findCampusBuildingCoordinate(building) {
  if (campusCoordinateCache.has(building.id)) return campusCoordinateCache.get(building.id);
  const query = `순천향대학교 ${building.name}`;
  const params = new URLSearchParams({ query, x:CAMPUS_CENTER.x, y:CAMPUS_CENTER.y, radius:"3000", size:"5" });
  const response = await fetch(`${KAKAO_KEYWORD_URL}?${params}`, {headers:kakaoHeaders()});
  if (!response.ok) throw new Error(`Kakao API ${response.status}: ${await response.text()}`);
  const data = await response.json();
  const campusResult = data.documents.find(item => /순천향대학교/.test(`${item.place_name} ${item.address_name} ${item.road_address_name}`)) || data.documents[0];
  if (!campusResult) return null;
  const result = {
    x: campusResult.x,
    y: campusResult.y,
    address: campusResult.road_address_name || campusResult.address_name || "",
    placeUrl: campusResult.place_url || ""
  };
  campusCoordinateCache.set(building.id, result);
  return result;
}

app.get("/api/campus/buildings", async (req, res) => {
  const type = req.query.type || "전체";
  const filtered = type === "전체" ? campusBuildings : campusBuildings.filter(item => item.type === type);
  try {
    const buildings = await Promise.all(filtered.map(async building => ({
      ...building,
      ...(await findCampusBuildingCoordinate(building) || {})
    })));
    res.json({ source: "school-campus-map+kakao", campus: "순천향대학교", type, buildings });
  } catch (error) {
    console.error("[Campus Kakao API]", error.message);
    res.status(502).json({ source: "school-campus-map+kakao", type, buildings: filtered, error: "캠퍼스 위치 정보를 불러오지 못했습니다.", detail: error.message });
  }
});

app.get("/api/campus/facilities", (req, res) => {
  res.json({ source: "school-campus-map", facilities: campusFacilities });
});

app.get("/api/nearby", async (req,res)=>{
  const category=req.query.category||"전체";
  const categories=category==="전체"?Object.keys(nearbyCategoryCodes):[category];
  try {
    const results=await Promise.all(categories.map(searchKakaoCategory));
    res.json({source:"kakao",center:CAMPUS_CENTER.name,category,places:results.flat().sort((a,b)=>a.distance-b.distance)});
  } catch(error) {
    console.error("[Kakao Local API]",error.message);
    res.status(502).json({source:"kakao",category,places:[],error:"카카오 장소 API를 불러오지 못했습니다.",detail:error.message});
  }
});

const KRIC_TIMETABLE_URL = "https://openapi.kric.go.kr/openapi/trainUseInfo/subwayTimetable";

function kricDayCode(date = new Date()) {
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Seoul", weekday: "short" }).format(date);
  if (weekday === "Sat") return "7";
  if (weekday === "Sun") return "9";
  return process.env.KRIC_DAY_CODE || "8";
}
function kstClock() {
  return new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Seoul", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).format(new Date());
}
function collectKricRows(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];
  if (payload.trnNo || payload.dptTm || payload.arvTm) return [payload];
  for (const key of ["body", "data", "items", "item", "result", "subwayTimetable", "response"]) {
    if (payload[key] !== undefined) {
      const rows = collectKricRows(payload[key]);
      if (rows.length) return rows;
    }
  }
  return [];
}
function parseKricTime(value) {
  if (value == null) return null;
  const digits = String(value).replace(/\D/g, "");
  if (digits.length < 4) return null;
  const hh = Number(digits.slice(0, 2)), mm = Number(digits.slice(2, 4));
  if (hh > 29 || mm > 59) return null;
  return { text: `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`, minute: hh * 60 + mm };
}
async function fetchKricStationTimetable(stationCode, dayCode) {
  const serviceKey = process.env.KRIC_SERVICE_KEY;
  if (!serviceKey) throw new Error("Render 환경변수 KRIC_SERVICE_KEY가 설정되지 않았습니다.");
  const params = new URLSearchParams({
    serviceKey, format: "json",
    railOprIsttCd: process.env.KRIC_RAIL_OPR_ISTT_CD || "KR",
    dayCd: dayCode, lnCd: process.env.KRIC_LINE_CD || "1", stinCd: stationCode
  });
  const response = await fetch(`${KRIC_TIMETABLE_URL}?${params}`, { signal: AbortSignal.timeout(12000) });
  const text = await response.text();
  let payload;
  try { payload = JSON.parse(text); }
  catch { throw new Error(`KRIC 응답을 JSON으로 읽지 못했습니다(HTTP ${response.status}). 인증키와 API 포맷을 확인해주세요.`); }
  if (!response.ok) throw new Error(`KRIC API HTTP ${response.status}`);
  const rows = collectKricRows(payload);
  if (!rows.length) {
    const message = payload?.msg || payload?.message || payload?.resultMsg || payload?.error;
    throw new Error(message ? `KRIC 응답에 시간표가 없습니다: ${String(message).slice(0, 160)}` : "KRIC 응답에 시간표가 없습니다. 역 코드와 신청 상태를 확인해주세요.");
  }
  return rows;
}

app.get("/api/subway", async (req, res) => {
  const updatedAt = kstClock();
  const dayCode = process.env.KRIC_DAY_CODE || kricDayCode();
  try {
    const [asanRows, sinchangRows] = await Promise.all([
      fetchKricStationTimetable(process.env.KRIC_ASAN_STATION_CODE || "173", dayCode),
      fetchKricStationTimetable(process.env.KRIC_SINCHANG_STATION_CODE || "176", dayCode)
    ]);
    const sinchangNumbers = new Set(sinchangRows.map(row => String(row.trnNo ?? "").trim()).filter(Boolean));
    const now = kstClock().split(":").map(Number);
    const nowMinute = now[0] * 60 + now[1];
    const trains = asanRows.map(row => {
      const departure = parseKricTime(row.dptTm || row.arvTm);
      const trainNo = String(row.trnNo ?? "").trim();
      if (!departure || !trainNo || !sinchangNumbers.has(trainNo)) return null;
      const minutes = departure.minute - nowMinute;
      if (minutes < 0) return null;
      return { direction: "하행", destination: "신창행", departureTime: departure.text, minutes, trainNo, status: minutes === 0 ? "곧 출발" : "출발 예정", express: false };
    }).filter(Boolean).sort((a, b) => a.minutes - b.minutes).slice(0, 5);
    res.json({ source: "kric-timetable", station: "아산역", destination: "신창역", updatedAt, mode: "schedule", realtime: false, trains,
      notice: trains.length ? "KRIC 시간표 기준입니다. 실제 열차 위치·지연을 반영한 실시간 정보는 아직 연결되지 않았습니다." : "현재 시각 이후 신창행 열차를 찾지 못했습니다. KRIC 역 코드 또는 응답을 확인해주세요." });
  } catch (error) {
    console.error("[KRIC timetable]", error.message);
    res.status(502).json({ source: "kric-error", station: "아산역", destination: "신창역", updatedAt, mode: "unavailable", realtime: false, trains: [], notice: "KRIC 시간표를 불러오지 못했습니다.", error: error.message });
  }
});

app.get("/api/health", (req, res) => res.json({ ok:true, service:"SCH NOW", version:"3.0.0" }));

app.listen(PORT, "0.0.0.0", () => {
  console.log(`SCH NOW FINAL running: http://0.0.0.0:${PORT}`);
});
