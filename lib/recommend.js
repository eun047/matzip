// 카테고리 선호도 계산
const getCategoryScores = (places) => {
  const scores = {};
  places.forEach((place) => {
    const cat = place.category?.split(">").pop()?.trim() || "기타";
    scores[cat] = (scores[cat] || 0) + 1;
  });
  const total = places.length;
  Object.keys(scores).forEach((key) => {
    scores[key] = scores[key] / total;
  });
  return scores;
};

// K-means 클러스터링
const kMeans = (places, k = 2, iterations = 20) => {
  if (places.length <= 1) return [{ lat: places[0].lat, lng: places[0].lng }];
  if (places.length <= k)
    return places.map((p) => ({ lat: p.lat, lng: p.lng }));

  // 1단계: K-means++ 방식으로 초기 중심점 설정 (랜덤보다 안정적)
  const centers = [];
  centers.push({ lat: places[0].lat, lng: places[0].lng });

  for (let c = 1; c < k; c++) {
    const distances = places.map((place) => {
      const minDist = Math.min(
        ...centers.map(
          (center) =>
            Math.pow(place.lat - center.lat, 2) +
            Math.pow(place.lng - center.lng, 2),
        ),
      );
      return minDist;
    });
    const totalDist = distances.reduce((sum, d) => sum + d, 0);
    let rand = Math.random() * totalDist;
    let selected = 0;
    for (let i = 0; i < distances.length; i++) {
      rand -= distances[i];
      if (rand <= 0) {
        selected = i;
        break;
      }
    }
    centers.push({ lat: places[selected].lat, lng: places[selected].lng });
  }

  // 2~3단계 반복
  let clusters = [];
  for (let iter = 0; iter < iterations; iter++) {
    clusters = centers.map(() => []);

    places.forEach((place) => {
      let minDist = Infinity;
      let nearest = 0;
      centers.forEach((center, idx) => {
        const dist =
          Math.pow(place.lat - center.lat, 2) +
          Math.pow(place.lng - center.lng, 2);
        if (dist < minDist) {
          minDist = dist;
          nearest = idx;
        }
      });
      clusters[nearest].push(place);
    });

    // 중심점 재계산
    let moved = false;
    clusters.forEach((cluster, idx) => {
      if (!cluster.length) return;
      const newLat =
        cluster.reduce((sum, p) => sum + p.lat, 0) / cluster.length;
      const newLng =
        cluster.reduce((sum, p) => sum + p.lng, 0) / cluster.length;
      if (
        Math.abs(newLat - centers[idx].lat) > 0.0001 ||
        Math.abs(newLng - centers[idx].lng) > 0.0001
      ) {
        moved = true;
      }
      centers[idx] = { lat: newLat, lng: newLng };
    });

    // 중심점이 더 이상 움직이지 않으면 종료
    if (!moved) break;
  }

  // 클러스터 크기 순으로 정렬해서 반환
  return clusters
    .map((cluster, idx) => ({ center: centers[idx], count: cluster.length }))
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count);
};

// 알레르기/식이제한 필터링
const isFiltered = (place, profile) => {
  if (!profile) return false;
  const category = place.category_name?.toLowerCase() || "";

  const allergyMap = {
    돼지고기: ["돼지", "삼겹", "곱창", "순대", "보쌈", "족발"],
    소고기: ["소고기", "한우", "갈비", "불고기", "스테이크"],
    해산물: [
      "해산물",
      "횟집",
      "회",
      "초밥",
      "해물",
      "굴",
      "조개",
      "새우",
      "게",
    ],
    유제품: ["유제품", "치즈", "버터", "크림", "아이스크림"],
  };

  const dietaryMap = {
    채식주의: [
      "고기",
      "삼겹",
      "갈비",
      "불고기",
      "치킨",
      "닭",
      "돼지",
      "소고기",
      "곱창",
      "족발",
      "보쌈",
    ],
    비건: [
      "고기",
      "삼겹",
      "갈비",
      "불고기",
      "치킨",
      "닭",
      "돼지",
      "소고기",
      "해산물",
      "횟집",
      "회",
      "유제품",
    ],
    할랄: ["돼지", "삼겹", "곱창", "순대", "보쌈", "족발"],
  };

  for (const allergy of profile.allergies || []) {
    const keywords = allergyMap[allergy] || [allergy.toLowerCase()];
    if (keywords.some((k) => category.includes(k))) return true;
  }

  for (const diet of profile.dietary || []) {
    const keywords = dietaryMap[diet] || [];
    if (keywords.some((k) => category.includes(k))) return true;
  }

  return false;
};

// 추천 점수 계산
const scorePlace = (place, categoryScores) => {
  const cat = place.category_name?.split(">").pop()?.trim() || "기타";
  return (categoryScores[cat] || 0) * 10;
};

// 메인 추천 함수
export const getRecommendations = async (savedPlaces, profile, map) => {
  if (!savedPlaces.length || !map) return [];

  const categoryScores = getCategoryScores(savedPlaces);

  // K-means 클러스터링 (데이터 수에 따라 k 결정)
  const k = savedPlaces.length >= 4 ? 2 : 1;
  const clusters = kMeans(savedPlaces, k);

  // 가장 큰 클러스터(가장 자주 가는 지역)만 사용
  const mainCenter = clusters[0].center;

  // 선호 카테고리 top2
  const topCategories = Object.entries(categoryScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([cat]) => cat);

  console.log("카테고리 점수:", categoryScores);
  console.log("클러스터:", clusters);
  console.log("메인 중심점:", mainCenter);
  console.log("검색 카테고리:", topCategories);

  return new Promise((resolve) => {
    const ps = new window.kakao.maps.services.Places();
    const results = [];
    let completed = 0;

    topCategories.forEach((cat) => {
      ps.keywordSearch(
        cat,
        (data, status) => {
          if (status === window.kakao.maps.services.Status.OK) {
            data.forEach((place) => {
              const alreadySaved = savedPlaces.some(
                (p) => p.name === place.place_name,
              );
              const filtered = isFiltered(place, profile);
              if (!alreadySaved && !filtered) {
                const score = scorePlace(place, categoryScores);
                results.push({ ...place, score });
              }
            });
          }
          completed++;
          if (completed === topCategories.length) {
            const seen = new Set();
            const unique = results.filter((p) => {
              if (seen.has(p.id)) return false;
              seen.add(p.id);
              return true;
            });
            resolve(unique.sort((a, b) => b.score - a.score).slice(0, 3));
          }
        },
        {
          location: new window.kakao.maps.LatLng(
            mainCenter.lat,
            mainCenter.lng,
          ),
          radius: 2000,
        },
      );
    });
  });
};
