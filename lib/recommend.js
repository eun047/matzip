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

// 자주 가는 지역 중심 좌표 계산
const getLocationCenter = (places) => {
  if (!places.length) return null;
  const avgLat = places.reduce((sum, p) => sum + p.lat, 0) / places.length;
  const avgLng = places.reduce((sum, p) => sum + p.lng, 0) / places.length;
  return { lat: avgLat, lng: avgLng };
};

// 알레르기/식이제한 필터링
const isFiltered = (place, profile) => {
  if (!profile) return false;
  const category = place.category_name?.toLowerCase() || "";

  // 알레르기 필터링
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

  for (const allergy of profile.allergies || []) {
    const keywords = allergyMap[allergy] || [allergy.toLowerCase()];
    if (keywords.some((k) => category.includes(k))) return true;
  }

  // 식이제한 필터링
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
  const center = getLocationCenter(savedPlaces);

  // 가장 선호하는 카테고리 top 2
  const topCategories = Object.entries(categoryScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([cat]) => cat);

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
              // 이미 저장된 장소 제외
              const alreadySaved = savedPlaces.some(
                (p) => p.name === place.place_name,
              );
              // 알레르기/식이제한 필터링
              const filtered = isFiltered(place, profile);

              if (!alreadySaved && !filtered) {
                const score = scorePlace(place, categoryScores);
                results.push({ ...place, score });
              }
            });
          }
          completed++;
          if (completed === topCategories.length) {
            const top3 = results.sort((a, b) => b.score - a.score).slice(0, 3);
            resolve(top3);
          }
        },
        {
          location: new window.kakao.maps.LatLng(center.lat, center.lng),
          radius: 2000,
        },
      );
    });
  });
};
