const obj = {

  baseURL: 'https://api.tfl.gov.uk/',
  init: () => {
    document.addEventListener('DOMContentLoaded', obj.load);
    console.log('HTML loaded');

  },
  load: () => {
    obj.getLine();
  },
  getLine: () => {
    // Different page for different line
    let page = document.body.id;
    switch (page) {
      case 'bakerloo':
        obj.getData('bakerloo', '#B36305');
        break;
      case 'central':
        obj.getData('central', '#E32017');
        break;
      case 'circle':
        obj.getData('circle', '#FFD300');
        break;
      case 'district':
        obj.getData('district', '#00782A');
        break;
      case 'elizabeth':
        obj.getData('elizabeth', '#6950a1');
        break;
      case 'hammersmith-city':
        obj.getData('hammersmith-city', '#F3A9BB');
        break;
      case 'jubilee':
        obj.getData('jubilee', '#A0A5A9');
        break;
      case 'metropolitan':
        obj.getData('metropolitan', '#9B0056');
        break;
      case 'northern':
        obj.getData('northern', '#000000');
        break;
      case 'piccadilly':
        obj.getData('piccadilly', '#003688');
        break;
      case 'victoria':
        obj.getData('victoria', '#0098D4');
        break;
      case 'waterloo-city':
        obj.getData('waterloo-city', '#95CDBA');
        break;
      default:
        console.log('error');
    };
  },
  getData: (lineId, colour) => {
    // My id and key
    const app_id = "9373ab66bde3433da64fefe6bc278be6";
    const app_key = "6f55c79f04e2487fbce3dc8ad8b7a074";
    const thisLine = lineId
    const lineUrl = `https://api.tfl.gov.uk/Line/${thisLine}/StopPoints?app_id=${app_id}&app_key=${app_key}`;

    // Fetch the stops for the line
    fetch(lineUrl)
      .then(response => response.json()) // Convert response to JSON
      .then(stopsData => { // Map all of the stops on the line
        const stopPromises = stopsData.map(stopData => {
          const naptanId = stopData.naptanId;
          const stopUrl = `https://api.tfl.gov.uk/crowding/${naptanId}/Live?app_id=${app_id}&app_key=${app_key}`;

          // Get the live crowding data for each stop
          return fetch(stopUrl)
            .then(response => response.json())
            .then(crowdData => {
              stop = {
                name: stopData.commonName,
                crowding: crowdData.percentageOfBaseline
              }
              return stop;
            });
        });
        return Promise.all(stopPromises);
      })
      .then(results => { // draw the circles
        obj.makeCircles(results, colour, lineId);
      })
      .catch(error => console.error(error));
  },
  makeCircles: (stops, colour, name) => {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    let radius;

    // Exclude stops with crowding of zero
    let valid = stops.filter(a => {
      if(a.crowding > 0){
        return a;
      };
    });

    // Create the label for the line
    switch(name) {
      case 'waterloo-city':
        name = 'WATERLOO & CITY';
        break;
      case 'hammersmith-city':
        name = 'H\'SMITH & CITY';
        break;
      default:
        name = name.toUpperCase();
    };

    // Set radius of max circle
    if (canvas.width <= canvas.height) {
      radius = canvas.width / 8;
    } else {
      radius = canvas.height / 8;
    }

    centre = { // Circle centre
      x: canvas.width / 2,
      y: canvas.height / 2 
    };

    // Draw max circle
    ctx.fillStyle = colour;
    ctx.strokeStyle = 'black';
    ctx.beginPath();
    ctx.arc(centre.x, centre.y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fill();

    const segmentSize = (Math.PI * 2) / valid.length;
    let segment = 0;
    let x, y;
    for (let i = 0; i < valid.length; i++) {

      // Get station coodinate
      x = 3 * radius * Math.cos(segment) + centre.x;
      y = 3 * radius * Math.sin(segment) + centre.y;

      // Find the most crowded station
      const biggest = valid.reduce(function (prev, current) {
        return (prev.crowding > current.crowding) ? prev : current
      });

      // Make the station circle
      ctx.beginPath();
      ctx.fillStyle = colour;
      ctx.textAlign = "left";
      ctx.lineWidth = 0.5;
      ctx.arc(x, y, radius * valid[i].crowding, 0, Math.PI * 2);

      //Draw the circle
      if(valid[i] === biggest){ // Highlight and write which is the most crowded station
        ctx.fillStyle = '#89bcfe';
        ctx.font = "30px sans-serif";
        ctx.fill();
        ctx.stroke();

        ctx.lineWidth = 0.3;
        ctx.fillText(biggest.name, 10, 100, canvas.width/3);

        ctx.fillStyle = 'white';
        ctx.fillText('Most Crowded Station:', 10, 70);
      } else{
        ctx.fill();
        ctx.stroke();
      }

      segment += segmentSize;
    };
    // Label the line name
    ctx.fillStyle = 'white';
    ctx.font = "20px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(name, centre.x, centre.y, radius*2);
  }
}
obj.init();