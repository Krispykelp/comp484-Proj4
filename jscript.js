let map;
let currentQuestion = null; // index into locations array
let answeredCount = 0;
let correctCount = 0;
let rectangles = []; // store drawn rectangles so we can clear them

// Define quiz locations here.
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

function setStatus(text) {
  document.getElementById("status").textContent = text;
}

function clearRectangles() {
  rectangles.forEach(r => r.setMap(null));
  rectangles = [];
}

function drawCorrectRectangle(bounds, isCorrect) {
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

async function initMap() {
  // Centered on CSUN
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
    
    styles: [
    // Hide ALL place/building labels ("___ Hall", "Bookstore", etc.)
    {
        featureType: "poi",
        elementType: "labels",
        stylers: [{ visibility: "off" }]
    },
    // Keep street names
    {
        featureType: "road",
        elementType: "labels.text",
        stylers: [{ visibility: "on" }]
    },
    {
        featureType: "road",
        elementType: "labels.icon",
        stylers: [{ visibility: "off" }]
    }
    ]
  });

  // Map double click handler
  map.addListener("dblclick", (e) => {
    if (currentQuestion === null) {
      setStatus("Choose a question first.");
      return;
    }

    const location = locations[currentQuestion];
    const bounds = location.bounds;

    clearRectangles();

    if (pointInBounds(e.latLng, bounds)) {
      drawCorrectRectangle(bounds, true);
      setStatus("Your answer is correct!");
      correctCount++;
    } else {
      drawCorrectRectangle(bounds, false);
      setStatus("Sorry, wrong location.");
    }

    answeredCount++;
    // disable the used question button
    const btn = document.querySelector(
      `.question-btn[data-index="${currentQuestion}"]`
    );
    if (btn) btn.disabled = true;

    currentQuestion = null; // require them to pick next question

    if (answeredCount === locations.length) {
      const incorrect = locations.length - correctCount;
      setStatus(`${correctCount} Correct, ${incorrect} Incorrect`);
    }
  });

  // Hook up question buttons
  document.querySelectorAll(".question-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.disabled) return;
      currentQuestion = parseInt(btn.dataset.index, 10);
      clearRectangles();
      setStatus(
        `Double click on the map where you think ${locations[currentQuestion].name} is.`
      );
    });
  });
}

// Make initMap global so Google’s script can call it
window.initMap = initMap;
