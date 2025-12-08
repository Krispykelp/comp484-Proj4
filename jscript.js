let map;
let currentQuestion = null;  // index into locations array
let answeredCount = 0;
let correctCount = 0;
let rectangles = [];         // drawn rectangles

// added functionality : Timer + accuracy high score
let startTime = null;
let timerInterval = null;
let bestAccuracy = null;

// Defined locations
// Use real lat/lng bounds from Google Maps.
const locations = [
  {
    name: "Bookstore",
    bounds: {
    north: 34.2378,
    south: 34.2370,
    east: -118.5278,
    west: -118.5286
    }
    },
    {
    name: "Jacaranda Hall",
    bounds: {
        north: 34.2421,
        south: 34.2410,
        east: -118.5279,  
        west: -118.5292
    }
    },
    {
    name: "Manzanita Hall",
    bounds: {
    north: 34.2378,     
    south: 34.2369,     
    east: -118.5296,    
    west: -118.5306
    }     
  },
  {
    name: "University Library",
    bounds: {
    north: 34.2404,   
    south: 34.2395,   
    east: -118.5286,  
    west: -118.5300   
    }
  },
  {
    name: "Police Services (B3)", // assigned one
    bounds: {
    north: 34.2389,
    south: 34.2386,
    east: -118.5330,
    west: -118.5336
    }
  }
];

// ---------- Utility functions ----------
function setStatus(text) {
  const statusEl = document.getElementById("status");
  if (statusEl) statusEl.textContent = text;
}

function updateTimerDisplay(seconds) {
  const timerEl = document.getElementById("timer");
  if (timerEl) timerEl.textContent = `Time: ${seconds}s`;
}

function updateBestScoreDisplay() {
  const el = document.getElementById("best-score");
  if (!el) return;

  if (bestAccuracy === null) {
    el.textContent = "Best Accuracy: —";
  } else {
    el.textContent = `Best Accuracy: ${(bestAccuracy * 100).toFixed(0)}%`;
  }
}

function clearRectangles() {
  rectangles.forEach(r => r.setMap(null));
  rectangles = [];
}

function drawRectangle(bounds, isCorrect) {
  const rect = new google.maps.Rectangle({
    strokeColor: isCorrect ? "#00FF00" : "#FF0000",
    strokeOpacity: 0.8,
    strokeWeight: 2,
    fillColor: isCorrect ? "#00FF00" : "#FF0000",
    fillOpacity: 0.35,
    map,
    bounds
  });
  rectangles.push(rect);
}

function pointInBounds(latLng, bounds) {
  const lat = latLng.lat();
  const lng = latLng.lng();
  return (
    lat <= bounds.north &&
    lat >= bounds.south &&
    lng <= bounds.east &&
    lng >= bounds.west
  );
}

//Timer behavior
function startTimerIfNeeded() {
  if (startTime !== null) return; // already running

  startTime = Date.now();
  timerInterval = setInterval(() => {
    const seconds = Math.floor((Date.now() - startTime) / 1000);
    updateTimerDisplay(seconds);
  }, 1000);
}

function stopTimer() {
  if (timerInterval !== null) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

//added functionality : Reset game
function resetGame() {
  // reset counters
  currentQuestion = null;
  answeredCount = 0;
  correctCount = 0;

  // reset timer
  stopTimer();
  startTime = null;
  updateTimerDisplay(0);

  // clear rectangles
  clearRectangles();

  // re-enable buttons
  document.querySelectorAll(".question-btn").forEach(btn => {
    btn.disabled = false;
  });

  setStatus("Click a question to start.");
}

// ---------- Map init ----------

async function initMap() {
  // Load best accuracy from localStorage
  const storedAccuracy = localStorage.getItem("bestAccuracy");
  if (storedAccuracy !== null) {
    const parsed = parseFloat(storedAccuracy);
    if (!isNaN(parsed)) {
      bestAccuracy = parsed;
    }
  }
  updateBestScoreDisplay();

  // Center around CSUN 
  const center = { lat: 34.23962898582113, lng: -118.52967628011604 };

  const { Map } = await google.maps.importLibrary("maps");

  map = new Map(document.getElementById("map"), {
    center,
    zoom: 16.9,
    disableDefaultUI: true,
    draggable: false,
    scrollwheel: false,
    disableDoubleClickZoom: true,
    gestureHandling: "none",
    // hide POIs to increase difficulty
    // Noteable that some halls are still labeled despite boardwide visibility changes
    styles: [
      { featureType: "poi", elementType: "all", stylers: [{ visibility: "off" }] },
      { featureType: "poi.school", elementType: "all", stylers: [{ visibility: "off" }] },
      { featureType: "poi.business", elementType: "all", stylers: [{ visibility: "off" }] },
      { featureType: "poi.medical", elementType: "all", stylers: [{ visibility: "off" }] },
      { featureType: "poi.place_of_worship", elementType: "all", stylers: [{ visibility: "off" }] },
      { featureType: "poi.sports_complex", elementType: "all", stylers: [{ visibility: "off" }] },
      { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
      { featureType: "poi", elementType: "labels.text", stylers: [{ visibility: "off" }] },
      { featureType: "poi", elementType: "labels.text.fill", stylers: [{ visibility: "off" }] },
      { featureType: "poi", elementType: "labels.text.stroke", stylers: [{ visibility: "off" }] },
      { featureType: "road", elementType: "labels.text", stylers: [{ visibility: "on" }] },
      { featureType: "road", elementType: "labels.icon", stylers: [{ visibility: "off" }] }
    ]
  });

  // Map double-click handler
  map.addListener("dblclick", (e) => {
    if (currentQuestion === null) {
      setStatus("Choose a question first.");
      return;
    }

    const location = locations[currentQuestion];
    const bounds = location.bounds;

    clearRectangles();

    if (pointInBounds(e.latLng, bounds)) {
      drawRectangle(bounds, true);
      setStatus("Your answer is correct!");
      correctCount++;

    } else {
      drawRectangle(bounds, false);
      setStatus("Sorry, wrong location.");
    }

    answeredCount++;

    // disable button after answer
    const btn = document.querySelector(
      `.question-btn[data-index="${currentQuestion}"]`
    );
    if (btn) btn.disabled = true;

    currentQuestion = null;

    // Added functionality: Accuracy check
    if (answeredCount === locations.length) {
      stopTimer();
      const total = locations.length;
      const incorrect = total - correctCount;
      const accuracy = total === 0 ? 0 : correctCount / total;
      const percent = Math.round(accuracy * 100);

      // Show final result in status (no alerts)
      setStatus(`${correctCount} Correct, ${incorrect} Incorrect (${percent}% accuracy)`);

      // Update best accuracy
      if (total > 0 && (bestAccuracy === null || accuracy > bestAccuracy)) {
        bestAccuracy = accuracy;
        localStorage.setItem("bestAccuracy", bestAccuracy.toString());
        updateBestScoreDisplay();
      }
    }
  });

  // Question buttons 
  document.querySelectorAll(".question-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.disabled) return;

      // start timer on first question
      startTimerIfNeeded();

      currentQuestion = parseInt(btn.dataset.index, 10);
      clearRectangles();
      setStatus(
        `Double click on the map where you think ${locations[currentQuestion].name} is.`
      );
    });
  });

  // Added functionality : Restart button
  const restartBtn = document.getElementById("restart-btn");
  if (restartBtn) {
    restartBtn.addEventListener("click", () => {
      resetGame();
    });
  }
}

// Make initMap global for Google callback
window.initMap = initMap;